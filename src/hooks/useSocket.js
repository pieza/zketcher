import { useState, useEffect } from 'react'
import socketIOClient from 'socket.io-client'
import useUsers from './useUsers'

const _socket = socketIOClient('localhost:3100')

export default () => {
    const [socket, setSocket] = useState(_socket)
    const [users, setUsers] = useUsers()
    
    useEffect(() => {
        socket.on('join', data => {
            console.log(data)
            setUsers(data.users)
        })

        socket.on('message', data => {
            console.log(data)
        })

        return () => {
            socket.off()
        }
    }, [socket])
    return [socket]
}