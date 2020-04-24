import { useState, useEffect } from 'react'
import socketIOClient from 'socket.io-client'
import useUsers from './useUsers'
import useMessages from './useMessages'

const endpoint = process.env.NODE_ENV === 'development' ? `localhost:${process.env.REACT_APP_SERVER_PORT}` : ''
const _socket = socketIOClient(endpoint)

const audio_joined = new Audio('http://soundbible.com/grab.php?id=1599&type=mp3')
const audio_next_payer = new Audio('http://soundbible.com/grab.php?id=1446&type=mp3')
const audio_game_starts = new Audio('http://soundbible.com/grab.php?id=56&type=mp3')
const audio_game_ends = new Audio('http://soundbible.com/grab.php?id=652&type=mp3')
const audio_word_guessed = new Audio('http://soundbible.com/grab.php?id=563&type=mp3')
const audio_time_running_out = new Audio('http://soundbible.com/grab.php?id=1258&type=mp3')

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
                audio_game_starts.play()
            }

            if(data.action === 'join') {
                audio_joined.play()
            }

            if(data.action === 'next_player') {
                audio_next_payer.play()
            }

            if(data.action === 'game_ends') {
                audio_game_ends.play()
                alert(`The winner is ${data.winner.name} !`)
            }
            if(data.action === 'word_guessed') {
                audio_word_guessed.play()
            }

            if(data.room.time == 5) {
                audio_time_running_out.play()
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