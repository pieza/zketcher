import { useState, useEffect } from 'react'
import socketIOClient from 'socket.io-client'
import useUsers from './useUsers'
import useMessages from './useMessages'

const endpoint = process.env.NODE_ENV === 'development' ? `localhost:${process.env.REACT_APP_SERVER_PORT}` : ''
const _socket = socketIOClient(endpoint)

const AUDIO_JOINED = new Audio(require('../assets/audio/store_door_chime.mp3'))
const AUDIO_NEXT_PLAYER = new Audio(require('../assets/audio/bike_horn.mp3'))
const AUDIO_GAME_STARTS = new Audio(require('../assets/audio/boxing_bell_start_round.mp3'))
const AUDIO_GAME_ENDS = new Audio(require('../assets/audio/ole_bullfighter.mp3'))
const AUDIO_WORD_GUESSED = new Audio(require('../assets/audio/camera_shutter_click.mp3'))
const AUDIO_TIME_RUNNING_OUT = new Audio(require('../assets/audio/tick_tock.mp3'))

export default () => {
    const [socket] = useState(_socket)
    const [users, setUsers] = useUsers()
    const [room, setRoom] = useState({})
    const [user, setUser] = useState({})
    const [messages, setMessages] = useMessages()
    
    useEffect(() => {
        socket.on('room_data', data => {
            setUsers(data.users)
            setRoom(data.room)

            if(data.action === 'start') {
                AUDIO_GAME_STARTS.play()
            }

            if(data.action === 'join') {
                AUDIO_JOINED.play()
            }

            if(data.action === 'next_player') {
                AUDIO_NEXT_PLAYER.play()
            }

            if(data.action === 'game_ends') {
                AUDIO_GAME_ENDS.play()
                alert(`The winner is ${data.winner.name} !`)
            }
            if(data.action === 'word_guessed') {
                AUDIO_WORD_GUESSED.play()
            }

            if(data.room.time == 5) {
                AUDIO_TIME_RUNNING_OUT.play()
            }
        })

        socket.on('user_data', data => {
            setUser(data)
        })
        
        socket.on('message', message => {
            setMessages(draft => {
                draft.push(message)
                setTimeout(() => {
                    const messageListDiv = document.getElementById("message-list")
                    if(messageListDiv != null)
                        messageListDiv.scrollTop = messageListDiv.scrollHeight * 2
                }, 20)
                
            })
        })

        socket.on('disconnect', data => {
            alert('Error de conexión')
        })


    }, [])
    return { socket, users, messages, room, user }
}