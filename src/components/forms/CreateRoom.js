import React, { useState } from 'react'
import {
    withRouter
  } from 'react-router-dom'

const words = [ 
    {
        id: 'lol',
        image: require('../../assets/img/lol.jpg')
    },
    {
        id: 'ow',
        image: require('../../assets/img/ow.png')
    },
    {
        id: 'paladins',
        image: require('../../assets/img/paladins.jpg')
    },
    {
        id: 'pokemon',
        image: require('../../assets/img/pokemon.png')
    }
    // {
    //     id: 'ow',
    //     image: ''
    // }
]

const CreateRoom = ({ history, socket }) => {
    const [name, setName] = useState('')
    const [id, setId] = useState('')
    const [maxTime, setMaxTime] = useState(120)
    const [maxRounds, setMaxRounds] = useState(8)
    const [triesPerUser, setTriesPerUser] = useState(0)
    const [wordsId, setWordsId] = useState('lol')

    const create = e => {
        e.preventDefault()
        if(id && name && maxRounds && maxTime) {
            sessionStorage.setItem('username', name)
            const opts = {
                _id: id,
                max_time: maxTime,
                max_rounds: maxRounds,
                words_id: wordsId,
                tries_per_user: triesPerUser
            }
            sessionStorage.setItem('opts', JSON.stringify(opts))
            history.push(`/play/${id}`)
        }
        
    }

    const handleWordsClick = (e, word) => {
        setWordsId(word.id)
    }
    return (
        <>
            <form onSubmit={create}>
                <div>
                    <div className="form-group">
                        <div className="input-group">
                            <div className="input-group-prepend">
                                <div className="input-group-text">
                                    <i className="material-icons prefix">account_circle</i>
                                </div>
                            </div>
                            <input name="name" type="text" placeholder="Username" value={name} maxLength="10"
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
                            <input  name="id" type="text" placeholder="Room"
                                className="form-control" required onChange={event => setId(event.target.value)}/>
                        </div>
                    </div>

                    <div className="form-group">
                        <div className="input-group">
                            <div className="input-group-prepend">
                                <div className="input-group-text">
                                    <i className="material-icons prefix">hourglass_empty</i>
                                </div>
                            </div>
                            <input  name="room" type="number" placeholder="Max rounds" value={maxRounds} max="20"
                                className="form-control" required onChange={event => setMaxRounds(event.target.value)}/>
                        </div>
                    </div>

                    <div className="form-group">
                        <div className="input-group">
                            <div className="input-group-prepend">
                                <div className="input-group-text">
                                    <i className="material-icons prefix">alarm</i>
                                </div>
                            </div>
                            <input  name="room" type="number" placeholder="Time per round (seconds)" value={maxTime} max="600"
                                className="form-control" required onChange={event => setMaxTime(event.target.value)}/>
                        </div>
                    </div>

                    <div className="form-group">
                        <div className="input-group">
                            <div className="input-group-prepend">
                                <div className="input-group-text">
                                    <i className="material-icons prefix">plus_one</i>
                                </div>
                            </div>
                            <input  name="triesPerUser" type="number" placeholder="Number of tries per user (cero to unlimited)" value={triesPerUser} max="50"
                                className="form-control" required onChange={event => setTriesPerUser(event.target.value)}/>
                        </div>
                    </div>


                    <div className="form-group word-selection">
                        <ul>
                            { words.map((word, key) => { return (
                                <li key={key}>
                                    <input type="checkbox" id={`cb${key}`} checked={wordsId == word.id} onClick={e => handleWordsClick(e, word)} readOnly/>
                                    <label htmlFor={`cb${key}`}><img src={word.image} /></label>
                                </li>
                            )})}
                        </ul>
                    </div>
                </div>
                <button type="submit" className="btn btn-outline-main btn-block">
                    Create
                </button>
            </form>
        </>
    )
}

export default withRouter(CreateRoom)