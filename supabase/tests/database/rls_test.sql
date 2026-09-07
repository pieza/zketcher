begin;

select plan(12);

select ok((select relrowsecurity from pg_class where oid = 'public.rooms'::regclass), 'rooms has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.room_members'::regclass), 'room_members has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.room_rounds'::regclass), 'room_rounds has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.room_messages'::regclass), 'room_messages has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.drawing_strokes'::regclass), 'drawing_strokes has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'game_private.round_secrets'::regclass), 'round secrets have RLS enabled');

select has_function('public', 'create_room', array['text', 'text', 'text', 'integer', 'integer', 'integer'], 'create_room RPC exists');
select has_function('public', 'join_room', array['text', 'text'], 'join_room RPC exists');
select has_function('public', 'append_drawing_stroke', array['text', 'jsonb', 'jsonb'], 'drawing RPC exists');
select has_function('public', 'get_host_word', array['text'], 'secret RPC exists');

select ok(not has_table_privilege('authenticated', 'game_private.round_secrets', 'SELECT'), 'authenticated cannot read private round secrets directly');
select ok(not has_table_privilege('authenticated', 'public.rooms', 'INSERT'), 'authenticated cannot insert rooms directly');

select * from finish();
rollback;
