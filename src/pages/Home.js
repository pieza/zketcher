import React from 'react'
import Join from '../components/forms/Join'
import Navbar from '../components/bars/Navbar'
import CreateRoom from '../components/forms/CreateRoom'
import AuthPanel from '../components/auth/AuthPanel'
import { useAuth } from '../context/AuthContext'

import './Home.css'

import Background from '../assets/img/bg.jpg'

const Home = () => {
    const { user, loading, signOut } = useAuth()
    return (
        <>
            <div className="home" style={{ backgroundImage: `url(${Background})` }}>
                <Navbar className="mb-6 " user={user} signOut={signOut} />
                <div className="container mt-6">
                    {loading ? <div className="card border-main text-center p-4">Loading account…</div> : !user ? <div className="row mb-4"><div className="col-md-2"></div><div className="col-md-8"><div className="card text-center border-main mt-6"><div className="card-body"><h5 className="card-title">Sign in to play</h5><AuthPanel /></div></div></div><div className="col-md-2"></div></div> : <>
                    <div className="row mb-4">
                        <div className="col-md-2"></div>
                        <div className="col-md-8">
                            <div className="card text-center border-main mt-6">
                                <div className="card-body">
                                    <h5 className="card-title">Enter to a room</h5>
                                    <Join />
                                </div>
                            </div>
                        </div>
                        <div className="col-md-2"></div>
                    </div>
                    <div className="row">
                        <div className="col-md-2"></div>
                        <div className="col-md-8">
                            <div className="card text-center border-main mt-6">
                                <div className="card-body">
                                    <h5 className="card-title">Create a room</h5>
                                    <CreateRoom />
                                </div>
                            </div>
                        </div>
                        <div className="col-md-2"></div>
                    </div>
                    </>}
                </div>
            </div>
        </>
    )
}

export default Home
