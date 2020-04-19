import { useState } from 'react'

export default () => {
    const [users, setUsers] = useState([])
    

    return [users, setUsers]
}