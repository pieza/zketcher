import { useState } from 'react'

export default () => {
    const [pallete, setPallete] = useState({
        size: 2,
        color: '#000000'
    })

    return [pallete, setPallete]
}
