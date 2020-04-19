import React, { useState } from 'react'
import {
    withRouter
  } from 'react-router-dom'

const Join = ({ history }) => {
    const [name, setName] = useState('')
    const [room, setRoom] = useState('')
    const join = e => {
        e.preventDefault()
        sessionStorage.setItem('username', name)
        history.push(`/play/${room}`)
    }
    return (
        <>
            <form onSubmit={join}>
                <div>
                    <div className="form-group">
                        <div className="input-group">
                            <div className="input-group-prepend">
                                <div className="input-group-text">
                                    <i className="material-icons prefix">account_circle</i>
                                </div>
                            </div>
                            <input name="name" type="text" placeholder="Username"
                                className="form-control" required onChange={event => setName(event.target.value)}/>
                        </div>
                    </div>
                    <div className="form-group">
                        <div className="input-group">
                            <div className="input-group-prepend">
                                <div className="input-group-text">
                                    <i className="material-icons prefix">home</i>
                                </div>
                            </div>
                            <input  name="room" type="text" placeholder="Room"
                                className="form-control" required onChange={event => setRoom(event.target.value)}/>
                        </div>
                    </div>
                </div>
                <button type="submit" className="btn btn-outline-main btn-block">
                    Go
                </button>
            </form>
        </>
    )
}

export default withRouter(Join)