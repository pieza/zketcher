
import { useImmer } from 'use-immer'

export default () => {
    const [mouse, setMouse] = useImmer({
        click: false,
        move: false,
        pos: {
            x: 0,
            y: 0
        },
        pos_prev: false
    })

    return [mouse, setMouse]
}