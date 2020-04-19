import React from 'react'

const MessageList = ({ messages }) => {
    return (
        <ul id="messages">
            { messages ? messages.map((message, key) => 
                <li key={key} style={{
                    backgroundColor: message.color || '#fff'
                }}>
                    <b>{ message.user.name }:</b> { message.text }
                </li>
            ) : null }
        </ul>
    )
}

export default MessageList