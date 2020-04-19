import { useState, useEffect } from 'react'
import { useImmer } from 'use-immer'

export default () => {
    const [pallete, setPallete] = useState({
        size: 2,
        color: '#000000'
    })

    return [pallete, setPallete]
}