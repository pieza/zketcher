import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const GameStats = ({ user, room, currentWord, canStart, onStart, onExpired }) => {
    const [timeLeft, setTimeLeft] = useState(0)
    const { _id, host, round, max_rounds: maxRounds, status, round_ends_at: roundEndsAt } = room || {}

    useEffect(() => {
        if (!roundEndsAt || status !== 'playing') {
            setTimeLeft(0)
            return undefined
        }
        let expired = false
        const update = () => {
            const next = Math.max(0, Math.ceil((new Date(roundEndsAt).getTime() - Date.now()) / 1000))
            setTimeLeft(next)
            if (next === 0 && !expired) {
                expired = true
                Promise.resolve(onExpired()).catch(() => undefined)
            }
        }
        update()
        const timer = window.setInterval(update, 250)
        return () => window.clearInterval(timer)
    }, [roundEndsAt, status, onExpired])

    return (
        <nav className="navbar navbar-light game-stats">
            <Link className="navbar-brand" to="/">
                <img src={require('../../assets/img/logo.png')} height="30" className="d-inline-block align-top" alt="zketcher" />
                <img src={require('../../assets/img/logo_name.png')} height="30" className="d-inline-block align-top" alt="zketcher" />
            </Link>
            <span>Room: {_id || '-'}</span>
            <span>You are: {user ? user.name : '-'}</span>
            <span>Round: {round ? `${round}/${maxRounds}` : '-'}</span>
            <span>Time left: {status === 'playing' ? timeLeft : '-'}</span>
            <span>Secret word: {currentWord || '---'}</span>
            <span>Drawing: {host ? host.name : '-'}</span>
            {canStart && status !== 'playing' && <button className="btn btn-outline-success" onClick={event => { event.preventDefault(); Promise.resolve(onStart()).catch(() => undefined) }}>Start</button>}
        </nav>
    )
}

export default GameStats
