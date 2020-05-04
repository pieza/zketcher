import React from 'react'
import Join from '../components/forms/Join'
import Navbar from '../components/bars/Navbar'
import CreateRoom from '../components/forms/CreateRoom'

import './Home.css'

import Background from '../assets/img/bg.jpg'

const Home = () => {
    return (
        <>
            <div className="home" style={{ backgroundImage: `url(${Background})` }}>
                <Navbar className="mb-6 " />
                <div className="container mt-6">
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
                </div>
            </div>
        </>
    )
}

export default Home