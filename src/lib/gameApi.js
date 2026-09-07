import { supabase } from './supabase'

const configurationError = new Error('Supabase is not configured. Add REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_PUBLISHABLE_KEY.')

export const rpc = async (name, args = {}) => {
    if (!supabase) throw configurationError
    const { data, error } = await supabase.rpc(name, args)
    if (error) throw new Error(error.message || 'The request could not be completed.')
    return data
}

export const createRoom = (roomId, nickname, options) => rpc('create_room', {
    room_code: roomId,
    nickname,
    selected_words_id: options.wordsId,
    configured_max_time: Number(options.maxTime),
    configured_max_rounds: Number(options.maxRounds),
    configured_tries_per_user: Number(options.triesPerUser)
})

export const joinRoom = (roomId, nickname) => rpc('join_room', { room_code: roomId, nickname })
export const leaveRoom = roomId => rpc('leave_room', { room_code: roomId })
export const heartbeatRoom = roomId => rpc('heartbeat_room', { room_code: roomId })
export const getRoomSnapshot = roomId => rpc('get_room_snapshot', { room_code: roomId })
export const startGame = roomId => rpc('start_game', { room_code: roomId })
export const sendMessage = (roomId, text) => rpc('send_message', { room_code: roomId, message_text: text })
export const appendDrawingStroke = (roomId, line, opts) => rpc('append_drawing_stroke', {
    room_code: roomId,
    stroke_line: line,
    stroke_opts: opts
})
export const clearDrawing = roomId => rpc('clear_drawing', { room_code: roomId })
export const advanceExpiredRound = roomId => rpc('advance_expired_round', { room_code: roomId })
export const getHostWord = roomId => rpc('get_host_word', { room_code: roomId })
