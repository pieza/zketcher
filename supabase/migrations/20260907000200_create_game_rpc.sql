create or replace function game_private.require_user()
returns uuid
language plpgsql
stable
security definer
set search_path = public, game_private, auth
as $$
declare current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception using errcode = '28000', message = 'Authentication is required.';
  end if;
  return current_user_id;
end
$$;

create or replace function game_private.broadcast_user_event(requested_user_id uuid, event_name text, event_payload jsonb)
returns void
language plpgsql
security definer
set search_path = public, game_private, realtime
as $$
begin
  perform realtime.send(event_payload, event_name, 'user:' || requested_user_id::text, true);
end
$$;

create or replace function game_private.advance_locked_room(requested_room_id text, force_advance boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = public, game_private, word_bank, auth
as $$
declare
  room_row public.rooms%rowtype;
  current_round public.room_rounds%rowtype;
  next_drawer uuid;
  next_round_id uuid;
  next_word_id bigint;
  next_word text;
  winner jsonb;
  snapshot jsonb;
  member_count integer;
begin
  select * into room_row from public.rooms where id = lower(btrim(requested_room_id)) for update;
  if room_row.id is null or room_row.status <> 'playing' then
    return game_private.safe_snapshot(requested_room_id);
  end if;
  if not force_advance and (room_row.round_ends_at is null or room_row.round_ends_at > now()) then
    return game_private.safe_snapshot(requested_room_id);
  end if;

  select count(*) into member_count from public.room_members where room_id = room_row.id;
  select * into current_round from public.room_rounds where room_id = room_row.id and round_number = room_row.round_number;

  if member_count = 0 or room_row.round_number >= room_row.max_rounds then
    select jsonb_build_object('id', user_id, '_id', user_id, 'name', nickname, 'points', score)
      into winner
      from public.room_members where room_id = room_row.id order by score desc, joined_at limit 1;
    update public.rooms set status = 'finished', round_ends_at = null, updated_at = now() where id = room_row.id;
    snapshot := game_private.safe_snapshot(room_row.id);
    perform game_private.broadcast_room_event(room_row.id, 'room_state', jsonb_build_object('action', 'game_ends', 'snapshot', snapshot, 'winner', winner));
    return snapshot;
  end if;

  select member.user_id into next_drawer
  from public.room_members member
  where member.room_id = room_row.id
    and (
      (member.joined_at > coalesce((select previous.joined_at from public.room_members previous where previous.room_id = room_row.id and previous.user_id = room_row.host_id), '-infinity'::timestamptz))
      or room_row.host_id is null
    )
  order by member.joined_at
  limit 1;
  if next_drawer is null then
    select member.user_id into next_drawer from public.room_members member where member.room_id = room_row.id order by member.joined_at limit 1;
  end if;

  select entry.id into next_word_id from word_bank.entries entry
  where entry.list_id = room_row.words_id order by random() limit 1;
  if next_word_id is null then
    raise exception using errcode = 'P0001', message = 'The selected word list is empty.';
  end if;

  update public.rooms
  set host_id = next_drawer,
      round_number = room_row.round_number + 1,
      round_ends_at = now() + make_interval(secs => room_row.max_time),
      expires_at = now() + interval '10 minutes',
      updated_at = now()
  where id = room_row.id;

  insert into public.room_rounds(room_id, round_number, drawer_id)
  values (room_row.id, room_row.round_number + 1, next_drawer)
  returning id into next_round_id;
  insert into game_private.round_secrets(round_id, room_id, word_id) values (next_round_id, room_row.id, next_word_id);
  select entry.word into next_word from word_bank.entries entry where entry.id = next_word_id;
  delete from public.drawing_strokes where room_id = room_row.id;
  update public.room_members
  set guessed = false, tries_left = room_row.tries_per_user, last_heartbeat = now()
  where room_id = room_row.id;

  snapshot := game_private.safe_snapshot(room_row.id);
  perform game_private.broadcast_user_event(next_drawer, 'host_word', jsonb_build_object('word', next_word));
  perform game_private.broadcast_room_event(room_row.id, 'clear_draw', jsonb_build_object('round_id', next_round_id));
  perform game_private.broadcast_room_event(room_row.id, 'room_state', jsonb_build_object('action', 'next_player', 'snapshot', snapshot));
  return snapshot;
end
$$;

create or replace function public.create_room(
  room_code text,
  nickname text,
  selected_words_id text default 'lol',
  configured_max_time integer default 120,
  configured_max_rounds integer default 8,
  configured_tries_per_user integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public, game_private, word_bank, auth
as $$
declare
  current_user_id uuid := game_private.require_user();
  normalized_room text := lower(btrim(room_code));
  normalized_nickname text := lower(btrim(nickname));
  snapshot jsonb;
begin
  if normalized_room !~ '^[a-z0-9][a-z0-9_-]{2,31}$' then raise exception using errcode = '22023', message = 'Room codes must be 3-32 lowercase letters, numbers, hyphens, or underscores.'; end if;
  if normalized_nickname !~ '^[a-z0-9][a-z0-9 _-]{0,19}$' then raise exception using errcode = '22023', message = 'Nicknames may contain up to 20 letters, numbers, spaces, hyphens, or underscores.'; end if;
  if configured_max_time not between 10 and 600 or configured_max_rounds not between 1 and 20 or configured_tries_per_user not between 0 and 50 then
    raise exception using errcode = '22023', message = 'Room settings are outside the allowed range.';
  end if;
  if not exists (select 1 from word_bank.lists where id = selected_words_id) then
    raise exception using errcode = '22023', message = 'The selected word list does not exist.';
  end if;
  insert into public.rooms(id, owner_id, host_id, words_id, max_time, max_rounds, tries_per_user)
  values (normalized_room, current_user_id, current_user_id, selected_words_id, configured_max_time, configured_max_rounds, configured_tries_per_user);
  insert into public.room_members(room_id, user_id, nickname, tries_left) values (normalized_room, current_user_id, normalized_nickname, configured_tries_per_user);
  snapshot := game_private.safe_snapshot(normalized_room);
  perform game_private.broadcast_room_event(normalized_room, 'room_state', jsonb_build_object('action', 'join', 'snapshot', snapshot));
  return snapshot;
exception when unique_violation then
  raise exception using errcode = '23505', message = 'The room or nickname already exists.';
end
$$;

create or replace function public.join_room(room_code text, nickname text)
returns jsonb
language plpgsql
security definer
set search_path = public, game_private, auth
as $$
declare
  current_user_id uuid := game_private.require_user();
  normalized_room text := lower(btrim(room_code));
  normalized_nickname text := lower(btrim(nickname));
  room_row public.rooms%rowtype;
  snapshot jsonb;
begin
  select * into room_row from public.rooms where id = normalized_room for update;
  if room_row.id is null or room_row.expires_at < now() then raise exception using errcode = 'P0002', message = 'The room does not exist or has expired.'; end if;
  if normalized_nickname !~ '^[a-z0-9][a-z0-9 _-]{0,19}$' then raise exception using errcode = '22023', message = 'Nicknames may contain up to 20 letters, numbers, spaces, hyphens, or underscores.'; end if;
  if exists (select 1 from public.room_members where room_id = normalized_room and lower(nickname) = normalized_nickname and user_id <> current_user_id) then
    raise exception using errcode = '23505', message = 'Username already exists in this room.';
  end if;
  insert into public.room_members(room_id, user_id, nickname, tries_left)
  values (normalized_room, current_user_id, normalized_nickname, case when room_row.status = 'playing' then room_row.tries_per_user else 0 end)
  on conflict (room_id, user_id) do update set nickname = excluded.nickname, last_heartbeat = now();
  update public.rooms set expires_at = now() + interval '10 minutes', updated_at = now() where id = normalized_room;
  snapshot := game_private.safe_snapshot(normalized_room);
  perform game_private.broadcast_room_event(normalized_room, 'room_state', jsonb_build_object('action', 'join', 'snapshot', snapshot));
  return snapshot;
end
$$;

create or replace function public.leave_room(room_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, game_private, auth
as $$
declare
  current_user_id uuid := game_private.require_user();
  room_row public.rooms%rowtype;
  replacement_id uuid;
  snapshot jsonb;
begin
  select * into room_row from public.rooms where id = lower(btrim(room_code)) for update;
  if room_row.id is null then return '{}'::jsonb; end if;
  delete from public.room_members where room_id = room_row.id and user_id = current_user_id;
  if not exists (select 1 from public.room_members where room_id = room_row.id) then
    update public.rooms set expires_at = now() + interval '5 minutes', updated_at = now() where id = room_row.id;
    return '{}'::jsonb;
  end if;
  select user_id into replacement_id from public.room_members where room_id = room_row.id order by joined_at limit 1;
  update public.rooms
  set owner_id = case when owner_id = current_user_id then replacement_id else owner_id end,
      host_id = case when host_id = current_user_id then replacement_id else host_id end,
      updated_at = now()
  where id = room_row.id;
  snapshot := game_private.safe_snapshot(room_row.id);
  perform game_private.broadcast_room_event(room_row.id, 'room_state', jsonb_build_object('action', 'leave', 'snapshot', snapshot));
  return snapshot;
end
$$;

create or replace function public.heartbeat_room(room_code text)
returns boolean
language plpgsql
security definer
set search_path = public, game_private, auth
as $$
declare current_user_id uuid := game_private.require_user();
begin
  update public.room_members set last_heartbeat = now() where room_id = lower(btrim(room_code)) and user_id = current_user_id;
  update public.rooms set expires_at = now() + interval '10 minutes', updated_at = now() where id = lower(btrim(room_code));
  return found;
end
$$;

create or replace function public.get_room_snapshot(room_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, game_private, auth
as $$
begin
  perform game_private.require_user();
  if not game_private.is_room_member(room_code) then raise exception using errcode = '42501', message = 'You must join this room first.'; end if;
  return game_private.safe_snapshot(room_code);
end
$$;

create or replace function public.start_game(room_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, game_private, word_bank, auth
as $$
declare
  current_user_id uuid := game_private.require_user();
  room_row public.rooms%rowtype;
  first_round_id uuid;
  first_word_id bigint;
  snapshot jsonb;
begin
  select * into room_row from public.rooms where id = lower(btrim(room_code)) for update;
  if room_row.id is null or not game_private.is_room_member(room_row.id) then raise exception using errcode = '42501', message = 'You must join this room first.'; end if;
  if room_row.owner_id <> current_user_id then raise exception using errcode = '42501', message = 'Only the room owner can start the game.'; end if;
  if room_row.status = 'playing' then return game_private.safe_snapshot(room_row.id); end if;
  select entry.id into first_word_id from word_bank.entries entry where entry.list_id = room_row.words_id order by random() limit 1;
  if first_word_id is null then raise exception using errcode = 'P0001', message = 'The selected word list is empty.'; end if;
  delete from public.room_rounds where room_id = room_row.id;
  update public.rooms set status = 'playing', round_number = 1, round_ends_at = now() + make_interval(secs => room_row.max_time), expires_at = now() + interval '10 minutes', updated_at = now() where id = room_row.id;
  update public.room_members set score = 0, guessed = false, tries_left = room_row.tries_per_user, last_heartbeat = now() where room_id = room_row.id;
  insert into public.room_rounds(room_id, round_number, drawer_id) values (room_row.id, 1, room_row.host_id) returning id into first_round_id;
  insert into game_private.round_secrets(round_id, room_id, word_id) values (first_round_id, room_row.id, first_word_id);
  perform game_private.broadcast_user_event(room_row.host_id, 'host_word', jsonb_build_object('word', (select word from word_bank.entries where id = first_word_id)));
  snapshot := game_private.safe_snapshot(room_row.id);
  perform game_private.broadcast_room_event(room_row.id, 'clear_draw', jsonb_build_object('round_id', first_round_id));
  perform game_private.broadcast_room_event(room_row.id, 'room_state', jsonb_build_object('action', 'start', 'snapshot', snapshot));
  return snapshot;
end
$$;

create or replace function public.send_message(room_code text, message_text text)
returns jsonb
language plpgsql
security definer
set search_path = public, game_private, word_bank, auth
as $$
declare
  current_user_id uuid := game_private.require_user();
  room_row public.rooms%rowtype;
  member_row public.room_members%rowtype;
  secret_word text;
  normalized_message text := btrim(message_text);
  remaining_seconds integer;
  extra_time integer;
  guessed_count integer;
  eligible_count integer;
  message_row public.room_messages%rowtype;
  message_json jsonb;
  snapshot jsonb;
begin
  select * into room_row from public.rooms where id = lower(btrim(room_code)) for update;
  select * into member_row from public.room_members where room_id = room_row.id and user_id = current_user_id for update;
  if room_row.id is null or member_row.user_id is null then raise exception using errcode = '42501', message = 'You must join this room first.'; end if;
  if normalized_message = '' or length(normalized_message) > 500 then raise exception using errcode = '22023', message = 'Messages must be between 1 and 500 characters.'; end if;

  if room_row.status = 'playing' and current_user_id <> room_row.host_id and not member_row.guessed then
    if room_row.tries_per_user > 0 and member_row.tries_left = 0 then
      perform game_private.broadcast_user_event(current_user_id, 'private_notice', jsonb_build_object('text', member_row.nickname || ', you do not have more tries.', 'color', '#ffcccc'));
      return game_private.safe_snapshot(room_row.id);
    end if;
    if room_row.tries_per_user > 0 then
      update public.room_members set tries_left = tries_left - 1 where room_id = room_row.id and user_id = current_user_id;
    end if;
    select entry.word into secret_word
    from game_private.round_secrets secret join word_bank.entries entry on entry.id = secret.word_id
    join public.room_rounds round on round.id = secret.round_id
    where secret.room_id = room_row.id and round.round_number = room_row.round_number;
    if game_private.normalize_word(normalized_message) = game_private.normalize_word(secret_word) then
      remaining_seconds := greatest(0, ceil(extract(epoch from (room_row.round_ends_at - now())))::integer);
      extra_time := round(room_row.max_time * 0.2)::integer;
      update public.room_members set guessed = true, score = score + remaining_seconds where room_id = room_row.id and user_id = current_user_id;
      if remaining_seconds > extra_time then update public.rooms set round_ends_at = now() + make_interval(secs => extra_time), updated_at = now() where id = room_row.id; end if;
      update public.room_members set score = score + extra_time where room_id = room_row.id and user_id = room_row.host_id;
      select count(*) filter (where guessed) into guessed_count from public.room_members where room_id = room_row.id and user_id <> room_row.host_id;
      select count(*) into eligible_count from public.room_members where room_id = room_row.id and user_id <> room_row.host_id;
      snapshot := game_private.safe_snapshot(room_row.id);
      perform game_private.broadcast_room_event(room_row.id, 'chat_message', jsonb_build_object('message', jsonb_build_object('user', jsonb_build_object('name', 'System'), 'text', member_row.nickname || ' guessed the word!', 'color', '#ffff80')));
      perform game_private.broadcast_user_event(current_user_id, 'private_notice', jsonb_build_object('text', 'You guessed the word ' || secret_word || '!', 'color', '#ffff80'));
      perform game_private.broadcast_room_event(room_row.id, 'room_state', jsonb_build_object('action', 'word_guessed', 'snapshot', snapshot));
      if eligible_count > 0 and guessed_count >= eligible_count then return game_private.advance_locked_room(room_row.id, true); end if;
      return snapshot;
    end if;
  end if;

  insert into public.room_messages(room_id, user_id, text, color) values (room_row.id, current_user_id, normalized_message, '#ffffff') returning * into message_row;
  message_json := jsonb_build_object('id', message_row.id, 'user', jsonb_build_object('id', current_user_id, '_id', current_user_id, 'name', member_row.nickname), 'text', message_row.text, 'color', message_row.color, 'created_at', message_row.created_at);
  perform game_private.broadcast_room_event(room_row.id, 'chat_message', jsonb_build_object('message', message_json));
  return game_private.safe_snapshot(room_row.id);
end
$$;

create or replace function public.append_drawing_stroke(room_code text, stroke_line jsonb, stroke_opts jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, game_private, auth
as $$
declare
  current_user_id uuid := game_private.require_user();
  room_row public.rooms%rowtype;
  current_round public.room_rounds%rowtype;
  stroke_row public.drawing_strokes%rowtype;
begin
  select * into room_row from public.rooms where id = lower(btrim(room_code)) for update;
  select * into current_round from public.room_rounds where room_id = room_row.id and round_number = room_row.round_number;
  if room_row.id is null or room_row.status <> 'playing' or room_row.host_id <> current_user_id then raise exception using errcode = '42501', message = 'Only the current drawer can draw.'; end if;
  if jsonb_typeof(stroke_line) <> 'array' or jsonb_array_length(stroke_line) <> 2 then raise exception using errcode = '22023', message = 'A stroke must have two points.'; end if;
  if not ((stroke_line->0->>'x')::numeric between 0 and 1 and (stroke_line->0->>'y')::numeric between 0 and 1 and (stroke_line->1->>'x')::numeric between 0 and 1 and (stroke_line->1->>'y')::numeric between 0 and 1) then raise exception using errcode = '22023', message = 'Stroke coordinates must be normalized between 0 and 1.'; end if;
  if (stroke_opts->>'size')::numeric not between 1 and 32 or (stroke_opts->>'color') !~ '^#[0-9a-fA-F]{6}$' then raise exception using errcode = '22023', message = 'Drawing options are invalid.'; end if;
  insert into public.drawing_strokes(room_id, round_id, user_id, line, opts) values (room_row.id, current_round.id, current_user_id, stroke_line, stroke_opts) returning * into stroke_row;
  perform game_private.broadcast_room_event(room_row.id, 'draw_line', jsonb_build_object('id', stroke_row.id, 'line', stroke_row.line, 'opts', stroke_row.opts));
  return jsonb_build_object('id', stroke_row.id, 'line', stroke_row.line, 'opts', stroke_row.opts);
end
$$;

create or replace function public.clear_drawing(room_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, game_private, auth
as $$
declare
  current_user_id uuid := game_private.require_user();
  room_row public.rooms%rowtype;
  current_round public.room_rounds%rowtype;
  snapshot jsonb;
begin
  select * into room_row from public.rooms where id = lower(btrim(room_code)) for update;
  select * into current_round from public.room_rounds where room_id = room_row.id and round_number = room_row.round_number;
  if room_row.id is null or room_row.status <> 'playing' or room_row.host_id <> current_user_id then raise exception using errcode = '42501', message = 'Only the current drawer can clear the canvas.'; end if;
  delete from public.drawing_strokes where room_id = room_row.id and round_id = current_round.id;
  snapshot := game_private.safe_snapshot(room_row.id);
  perform game_private.broadcast_room_event(room_row.id, 'clear_draw', jsonb_build_object('round_id', current_round.id));
  perform game_private.broadcast_room_event(room_row.id, 'room_state', jsonb_build_object('action', 'clean_draw', 'snapshot', snapshot));
  return snapshot;
end
$$;

create or replace function public.advance_expired_round(room_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, game_private, auth
as $$
begin
  perform game_private.require_user();
  if not game_private.is_room_member(room_code) then raise exception using errcode = '42501', message = 'You must join this room first.'; end if;
  return game_private.advance_locked_room(room_code, false);
end
$$;

create or replace function public.get_host_word(room_code text)
returns text
language plpgsql
security definer
set search_path = public, game_private, word_bank, auth
as $$
declare current_user_id uuid := game_private.require_user(); result text;
begin
  select entry.word into result
  from public.rooms room join public.room_rounds round on round.room_id = room.id and round.round_number = room.round_number
  join game_private.round_secrets secret on secret.round_id = round.id
  join word_bank.entries entry on entry.id = secret.word_id
  where room.id = lower(btrim(room_code)) and room.status = 'playing' and room.host_id = current_user_id;
  if result is null then raise exception using errcode = '42501', message = 'Only the current drawer can access the secret word.'; end if;
  return result;
end
$$;

create or replace function public.cleanup_expired_rooms()
returns integer
language plpgsql
security definer
set search_path = public, game_private
as $$
declare removed integer := 0;
  orphaned_room public.rooms%rowtype;
  replacement_id uuid;
begin
  delete from public.room_members where last_heartbeat < now() - interval '90 seconds';
  for orphaned_room in
    select room.*
    from public.rooms room
    where room.status = 'playing'
      and not exists (select 1 from public.room_members member where member.room_id = room.id and member.user_id = room.host_id)
  loop
    select member.user_id into replacement_id from public.room_members member where member.room_id = orphaned_room.id order by member.joined_at limit 1;
    if replacement_id is not null then
      update public.rooms set host_id = replacement_id, updated_at = now() where id = orphaned_room.id;
      perform game_private.broadcast_room_event(orphaned_room.id, 'room_state', jsonb_build_object('action', 'next_player', 'snapshot', game_private.safe_snapshot(orphaned_room.id)));
    end if;
  end loop;
  delete from public.rooms where expires_at < now() or not exists (select 1 from public.room_members member where member.room_id = rooms.id);
  get diagnostics removed = row_count;
  return removed;
end
$$;

revoke all on function game_private.require_user() from public, anon, authenticated;
revoke all on function game_private.broadcast_user_event(uuid, text, jsonb) from public, anon, authenticated;
revoke all on function game_private.advance_locked_room(text, boolean) from public, anon, authenticated;
revoke all on function public.create_room(text, text, text, integer, integer, integer) from public, anon;
revoke all on function public.join_room(text, text) from public, anon;
revoke all on function public.leave_room(text) from public, anon;
revoke all on function public.heartbeat_room(text) from public, anon;
revoke all on function public.get_room_snapshot(text) from public, anon;
revoke all on function public.start_game(text) from public, anon;
revoke all on function public.send_message(text, text) from public, anon;
revoke all on function public.append_drawing_stroke(text, jsonb, jsonb) from public, anon;
revoke all on function public.clear_drawing(text) from public, anon;
revoke all on function public.advance_expired_round(text) from public, anon;
revoke all on function public.get_host_word(text) from public, anon;
revoke all on function public.cleanup_expired_rooms() from public, anon, authenticated;
grant execute on function public.create_room(text, text, text, integer, integer, integer), public.join_room(text, text), public.leave_room(text), public.heartbeat_room(text), public.get_room_snapshot(text), public.start_game(text), public.send_message(text, text), public.append_drawing_stroke(text, jsonb, jsonb), public.clear_drawing(text), public.advance_expired_round(text), public.get_host_word(text) to authenticated;

-- pg_cron is available in hosted Supabase projects and local Supabase stacks.
create extension if not exists pg_cron;
select cron.schedule('zketcher-cleanup', '* * * * *', 'select public.cleanup_expired_rooms();')
where not exists (select 1 from cron.job where jobname = 'zketcher-cleanup');
