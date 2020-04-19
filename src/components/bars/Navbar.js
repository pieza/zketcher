import React from 'react'
import { Link } from 'react-router-dom'


const Navbar = () => {
    return (
        <nav className="navbar navbar-dark " style={{ backgroundColor: '#7f4dca', marginBottom: '6vh' }}>
            <Link className="navbar-brand" to="/">
                <img src="/docs/4.4/assets/brand/bootstrap-solid.svg" width="30" height="30" className="d-inline-block align-top" alt="" />
                Zketcher
            </Link>
        </nav>
    )
}

export default Navbar