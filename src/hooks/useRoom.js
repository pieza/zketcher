import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import * as gameApi from '../lib/gameApi'

const addMessage = (current, next) => {
    if (!next) return current
    if (next.id && current.some(message => message.id === next.id)) return current
    return current.concat(next).slice(-100)
}

export default ({ roomId, nickname, createOptions, user }) => {
    const [room, setRoom] = useState(null)
    const [users, setUsers] = useState([])
    const [messages, setMessages] = useState([])
    const [strokes, setStrokes] = useState([])
    const [onlineUsers, setOnlineUsers] = useState([])
    const [currentWord, setCurrentWord] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const roomChannelRef = useRef(null)
    const userChannelRef = useRef(null)
    const userId = user && user.id
    const hostId = room && room.host_id
    const roomStatus = room && room.status
    const roundId = room && room.round_id

    const applySnapshot = useCallback(snapshot => {
        if (!snapshot || !snapshot.room) return
        setRoom(snapshot.room)
        setUsers(snapshot.users || [])
        setMessages(snapshot.messages || [])
        setStrokes(snapshot.strokes || [])
    }, [])

    const run = useCallback(async action => {
        setError('')
        try {
            const snapshot = await action()
            if (snapshot && snapshot.room) applySnapshot(snapshot)
            return snapshot
        } catch (actionError) {
            setError(actionError.message || 'The room request failed.')
            throw actionError
        }
    }, [applySnapshot])

    useEffect(() => {
        if (!supabase || !userId || !roomId || !nickname) {
            setLoading(false)
            return undefined
        }
        let active = true
        const roomChannel = supabase.channel(`room:${roomId}`, {
            config: {
                private: true,
                broadcast: { self: false },
                presence: { key: userId }
            }
        })
        const userChannel = supabase.channel(`user:${userId}`, { config: { private: true } })
        roomChannelRef.current = roomChannel
        userChannelRef.current = userChannel

        const receiveSnapshot = payload => {
            if (payload && payload.snapshot) applySnapshot(payload.snapshot)
        }
        roomChannel
            .on('broadcast', { event: 'room_state' }, ({ payload }) => receiveSnapshot(payload))
            .on('broadcast', { event: 'chat_message' }, ({ payload }) => {
                if (payload && payload.message) setMessages(current => addMessage(current, payload.message))
            })
            .on('broadcast', { event: 'draw_line' }, ({ payload }) => {
                if (payload) setStrokes(current => current.some(stroke => stroke.id === payload.id) ? current : current.concat(payload))
            })
            .on('broadcast', { event: 'clear_draw' }, () => setStrokes([]))
            .on('presence_sync', () => {
                const presence = roomChannel.presenceState()
                const nextUsers = Object.keys(presence).reduce((all, key) => all.concat(presence[key] || []), [])
                setOnlineUsers(nextUsers)
            })
        userChannel
            .on('broadcast', { event: 'host_word' }, ({ payload }) => setCurrentWord(payload && payload.word ? payload.word : ''))
            .on('broadcast', { event: 'private_notice' }, ({ payload }) => {
                if (payload && payload.text) setMessages(current => addMessage(current, { id: `notice-${Date.now()}`, user: { name: 'System' }, text: payload.text, color: payload.color || '#ffff80' }))
            })

        const start = async () => {
            try {
                const snapshot = createOptions
                    ? await gameApi.createRoom(roomId, nickname, createOptions)
                    : await gameApi.joinRoom(roomId, nickname)
                if (!active) return
                applySnapshot(snapshot)
                setLoading(false)
                await Promise.all([
                    new Promise((resolve, reject) => roomChannel.subscribe(status => status === 'SUBSCRIBED' ? resolve() : status === 'CHANNEL_ERROR' ? reject(new Error('Could not subscribe to the room.')) : undefined)),
                    new Promise((resolve, reject) => userChannel.subscribe(status => status === 'SUBSCRIBED' ? resolve() : status === 'CHANNEL_ERROR' ? reject(new Error('Could not subscribe to private notices.')) : undefined))
                ])
                await roomChannel.track({ user_id: userId, nickname })
            } catch (startError) {
                if (active) {
                    setError(startError.message || 'Could not enter the room.')
                    setLoading(false)
                }
            }
        }
        start()

        const heartbeat = window.setInterval(() => {
            gameApi.heartbeatRoom(roomId).catch(() => undefined)
        }, 25000)
        return () => {
            active = false
            window.clearInterval(heartbeat)
            gameApi.leaveRoom(roomId).catch(() => undefined)
            if (roomChannelRef.current) supabase.removeChannel(roomChannelRef.current)
            if (userChannelRef.current) supabase.removeChannel(userChannelRef.current)
            roomChannelRef.current = null
            userChannelRef.current = null
        }
    }, [roomId, nickname, userId, createOptions, applySnapshot])

    useEffect(() => {
        if (!hostId || !userId || hostId !== userId || roomStatus !== 'playing') {
            setCurrentWord('')
            return undefined
        }
        gameApi.getHostWord(roomId).then(setCurrentWord).catch(() => undefined)
        return undefined
    }, [hostId, roomStatus, roundId, roomId, userId])

    const startGame = useCallback(() => run(() => gameApi.startGame(roomId)), [roomId, run])
    const sendChat = useCallback(text => run(() => gameApi.sendMessage(roomId, text)), [roomId, run])
    const drawLine = useCallback((line, opts) => gameApi.appendDrawingStroke(roomId, line, opts).then(stroke => {
        setStrokes(current => current.some(item => item.id === stroke.id) ? current : current.concat(stroke))
        return stroke
    }).catch(actionError => {
        setError(actionError.message || 'Drawing failed.')
        throw actionError
    }), [roomId])
    const clearDrawing = useCallback(() => run(() => gameApi.clearDrawing(roomId)), [roomId, run])
    const advanceExpiredRound = useCallback(() => run(() => gameApi.advanceExpiredRound(roomId)), [roomId, run])

    return {
        room, users, messages, strokes, onlineUsers, currentWord, loading, error,
        startGame, sendChat, drawLine, clearDrawing, advanceExpiredRound,
        canDraw: Boolean(room && user && room.status === 'playing' && room.host_id === user.id),
        isOwner: Boolean(room && user && room.owner_id === user.id)
    }
}
