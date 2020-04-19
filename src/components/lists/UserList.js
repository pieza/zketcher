import React from 'react'

const UserList = ({ users }) => {
    return (
        <ul>
            { users ? users.map(user => 
                <li key={user._id}>
                    { user.name } - { user.points }
                </li>
            ) : null }
        </ul>
    )
}

export default UserList