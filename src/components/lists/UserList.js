import React from 'react'

const UserList = ({ users }) => {
    return (
        <table className="table table-sm">
            <thead>
                <tr>
                    <th>
                        Name
                    </th>
                    <th>
                        Points
                    </th>
                    <th>
                        Tries
                    </th>
                </tr>
            </thead>
            <tbody>
                { users ? users.map(user => 
                    <tr key={user._id}>
                        <td style={{ wordWrap: 'break-word', maxWidth:'10px' }}>
                            { user.name }
                        </td>
                        <td>
                            { user.points }
                        </td>
                        <td>
                            { user.tries_left }
                        </td>
                    </tr>
                ) : null }
            </tbody>
        </table>
        // <ul>
        //     { users ? users.map(user => 
        //         <li key={user._id}>
        //             { user.name } - { user.points }
        //         </li>
        //     ) : null }
        // </ul>
    )
}

export default UserList