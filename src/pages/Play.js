import React, { useEffect } from 'react'

import DrawableCanvas from '../components/canvas/DrawableCanvas'
import UserList from '../components/UserList'

import useSocket from '../hooks/useSocket'
import useUsers from '../hooks/useUsers'


const Play = ({ match }) => {
    const [socket] = useSocket()
    const [users] = useUsers()
    const id = match.params.id
    useEffect(() => {  
        socket.emit('join', { room_id: id })
    }, [id, users, socket])

    return (
        <>
            <h2>usuarios</h2>
            <UserList users={users}/>
            <DrawableCanvas socket={socket}/>
        </>
    )
}

export default Play