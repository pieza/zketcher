import React from 'react'
import { Link } from 'react-router-dom'


const GameStats = ({ socket, user, room, imHost, imOwner }) => {
    const { _id, host, word, round, time, is_start, max_rounds } = room
    
    const handleStartClick = e => {
        e.preventDefault()
        socket.emit('start_game')
    }



    return (
        <nav className="navbar navbar-light">
            <Link className="navbar-brand" to="/">
                <img src={require('../../assets/img/logo.png')} height="30" className="d-inline-block align-top" alt="zketcher" />
                <img src={require('../../assets/img/logo_name.png')} height="30" className="d-inline-block align-top" alt="zketcher" />
            </Link>
            <label>
                Room: { _id ? _id : null }
            </label>
            <label>
                You are: { user ? user.name : null }
            </label>
            <label>
                Round: { round ? `${round}/${max_rounds}` : '-' }
            </label>
            <label>
                Time left: { is_start && time ? time : "-"}
            </label>
            <label>
                Secret word: { imHost && word ? word.name : "---"}
            </label>
            <label>Drawing: { host ? host.name : null }</label>
            <form className="form-inline">
                
                { imHost ? 
                    room && !is_start ? 
                    <button className="btn btn-outline-success my-2 my-sm-0" onClick={handleStartClick}>Start</button>
                    : null
                : null }
                
            </form>

        </nav>
    )
}

export default GameStats