import React from 'react'

const UserList = ({ users }) => {
    return (
        <ul>
            { users ? users.map(user => 
                <li>
                    { user._id }
                </li>
            ) : null }
        </ul>
    )
}

export default UserList