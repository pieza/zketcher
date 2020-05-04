import React from 'react'
import { Link } from 'react-router-dom'


const Navbar = () => {
    return (
        <nav className="navbar navbar-light " style={{ backgroundColor: '#ffffff', marginBottom: '6vh' }}>
            <Link className="navbar-brand" to="/">
                <img src={require('../../assets/img/logo.png')} height="30" className="d-inline-block align-top" alt="zketcher" />
                <img src={require('../../assets/img/logo_name.png')} height="30" className="d-inline-block align-top" alt="zketcher" />
            </Link>
        </nav>
    )
}

export default Navbar