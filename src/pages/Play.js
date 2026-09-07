import React, { useEffect } from 'react'
import { withRouter } from 'react-router-dom'

import DrawableCanvas from '../components/canvas/DrawableCanvas'
import UserList from '../components/lists/UserList'
import useRoom from '../hooks/useRoom'
import usePallete from '../hooks/usePallete'
import Chat from '../components/Chat'
import GameStats from '../components/bars/GameStats'
import ToolsPallete from '../components/bars/ToolsPallete'
import Modal from '../components/notifications/Modal'
import { useAuth } from '../context/AuthContext'

const Play = ({ match, history, location }) => {
    const { user, loading: authLoading } = useAuth()
    const [pallete, setPallete] = usePallete()
    const roomId = match.params.id && match.params.id.trim().toLowerCase()
    const navigationState = location.state || {}
    const nickname = navigationState.nickname
    const createOptions = navigationState.createOptions
    const game = useRoom({ roomId, nickname, createOptions, user })

    useEffect(() => {
        if (!authLoading && (!user || !nickname)) history.replace('/')
    }, [authLoading, user, nickname, history])

    if (authLoading || game.loading) return <div className="container p-5 text-center">Joining room…</div>
    if (!user || !nickname) return null

    return (
        <>
            <GameStats user={game.users.find(player => (player.id || player._id) === user.id)} room={game.room || {}} currentWord={game.currentWord} canStart={game.isOwner} onStart={game.startGame} onExpired={game.advanceExpiredRound} />
            {game.error && <div className="alert alert-danger m-2" role="alert">{game.error}</div>}
            <div className="container">
                <div className="row">
                    <div className="col-md-2 full-height card">
                        <div className="row"><div className="col-md-12 user-list"><UserList users={game.users} /></div></div>
                        <div className="row"><div className="col-md-12"><Chat messages={game.messages} onSend={game.sendChat} /></div></div>
                    </div>
                    <div className="col-md-9 full-height card">
                        <Modal />
                        <DrawableCanvas strokes={game.strokes} canDraw={game.canDraw} pallete={pallete} onDrawLine={game.drawLine} />
                    </div>
                    <div className="col-md-1 full-height card">
                        <ToolsPallete canDraw={game.canDraw} room={game.room || {}} pallete={pallete} setPallete={setPallete} onClear={game.clearDrawing} />
                    </div>
                </div>
            </div>
        </>
    )
}

export default withRouter(Play)
