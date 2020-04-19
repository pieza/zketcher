import React, { useEffect } from 'react'
import './DrawableCanvas.css'

import useMouse from '../../hooks/useMouse'

const DrawableCanvas = ({ socket, pallete }) => {
    const [mouse, setMouse] = useMouse()
    
    const handleMouseMove = e => {

    }

    useEffect(() => {
        const canvas = document.getElementById('chart')
        const ctx = canvas.getContext('2d')
        const width = canvas.offsetWidth
        const height = canvas.offsetHeight
    
        canvas.width = width
        canvas.height = height

        canvas.addEventListener('mousedown', e => {
            setMouse(draft => {
                draft.click = true
            })
        })

        canvas.addEventListener('mouseup', e => {
            setMouse(draft => {
                draft.click = false
            })
        })

        canvas.addEventListener('mousemove', e => {
            setMouse(draft => {
                draft.pos.x = e.offsetX / width
                draft.pos.y = e.offsetY / height
                draft.move = true
            })
            
        })

        socket.on('draw_line', ({ line, opts }) => {
            ctx.beginPath()
            ctx.lineWidth = opts.size
            ctx.strokeStyle = opts.color
            ctx.lineCap = 'round'
            ctx.moveTo(line[0].x * width, line[0].y * height)
            ctx.lineTo(line[1].x * width, line[1].y * height)
            ctx.stroke()
        })

        socket.on('clear_draw', () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
        })


    }, [])

    useEffect(() => {

        setMouse(draft => {
            if (draft.click && draft.move && draft.pos_prev) {
                socket.emit('draw_line', { line: [draft.pos, draft.pos_prev], opts: { size: pallete.size, color: pallete.color }})
            }
            draft.pos_prev = { x: draft.pos.x, y: draft.pos.y }
        })

        
        // const mainLoop = () => {
        //     setMouse(draft => {
        //         console.log(draft.click && draft.move && draft.pos_prev, draft.click, draft.move, draft.pos.x)
        //         if (draft.click && draft.move && draft.pos_prev) {
        //             console.log(draft.click, draft.move, draft.pos_prev)
        //             socket.emit('draw_line', { line: [draft.pos, draft.pos_prev], opts: { size: pallete.size, color: pallete.color }})

        //         }
        //         draft.pos_prev = { x: draft.pos.x, y: draft.pos.y }
        //     })
        //     setTimeout(mainLoop, 10)
        // }
        // mainLoop()
            
    }, [mouse.pos])

    

    return (
        <canvas id="chart"> </canvas>
    )
}

export default DrawableCanvas