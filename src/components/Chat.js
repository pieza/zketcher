import React, { useState } from 'react'
import MessageList from './lists/MessageList'

import './Chat.css'

const Chat = ({ socket, messages, imHost }) => {
    const [message, setMessage] = useState('')
    const sendMessage = (e) => {
        e.preventDefault()
        socket.emit('send_message', message)
        setMessage('')
    }

    return (
        <>
            <form onSubmit={sendMessage}>
                <div id="message-list" className="card chat-list scrollable">
                    <MessageList messages={messages} />
                </div>
                <input className="input-message" type="text" value={message} onChange={e => setMessage(e.target.value)}/>
            </form> 
        </>
    )
}

export default Chat