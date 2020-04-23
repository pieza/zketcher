import React, { useEffect } from 'react'
import {
    withRouter
  } from 'react-router-dom'


import DrawableCanvas from '../components/canvas/DrawableCanvas'
import UserList from '../components/lists/UserList'

import useSocket from '../hooks/useSocket'
import usePallete from '../hooks/usePallete'

import Chat from '../components/Chat'
import GameStats from '../components/bars/GameStats'
import ToolsPallete from '../components/bars/ToolsPallete'

const Play = ({ match, history }) => {
    const { socket, users, room, user, messages } = useSocket()
    const [pallete, setPallete] = usePallete()
    const id = match.params.id
    const name = sessionStorage.getItem('username')

    const imHost = () => {
        return room && room.host && user && room.host._id === user._id
    }

    const imOwner = () => {
        return room && room.owner && user && room.owner._id === user._id
    }

    useEffect(() => {
        if(!socket.connected)
            socket.connect()

            const optsStr = sessionStorage.getItem('opts')

        if(optsStr) {
            const opts = JSON.parse(optsStr)
            socket.emit('create_room', opts, error => {
                if(error) {
                    alert(error)
                    history.push(`/`)
                } else {
                    socket.emit('join', { room_id: id, name }, error => { 
                        alert(error)
                        history.push(`/`)
                    })
                } 
                
            })
            sessionStorage.removeItem('opts')
        } else if(id && name && name.trim()) {
            socket.emit('join', { room_id: id, name }, error => { 
                alert(error)
                history.push(`/`)
            } )
            sessionStorage.removeItem('username')
        } else {
            history.push(`/`)
            sessionStorage.removeItem('username')
        }
        
        return () => {
            sessionStorage.removeItem('username')
            sessionStorage.removeItem('opts')
            socket.off()
            socket.disconnect()
        }
        
    }, []) 
    return (
        <>
            {/* <DrawableCanvas socket={socket}/> */}
            <GameStats socket={socket} user={user} room={room} imHost={imHost()} imOwner={imOwner()}/>
            <div className="container">
                <div className="row">
                    <div className="col-md-2 full-height card">
                        <div className="row">
                            <div className="col-md-12 user-list">
                                <UserList users={users} />
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-12">
                                <Chat socket={socket} messages={messages} imHost={imHost()}/>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-9 full-height card">
                        <DrawableCanvas className="full-height" socket={socket} pallete={pallete}/>
                    </div>
                    <div className="col-md-1 full-height card">
                        <ToolsPallete className="full-height" socket={socket} imHost={imHost()} room={room}  pallete={pallete} setPallete={setPallete} />
                    </div>
                </div>
            </div>
        </>
    )
}

export default withRouter(Play)