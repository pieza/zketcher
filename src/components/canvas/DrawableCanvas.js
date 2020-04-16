import React, { useEffect } from 'react'
import './DrawableCanvas.css'


const DrawableCanvas = ({ socket }) => {
    useEffect(() => {
        let mouse = {
            click: false,
            move: false,
            pos: {
                x: 0,
                y: 0
            },
            pos_prev: false
        }

        const canvas = document.getElementById('chart')
        const ctx = canvas.getContext('2d')
        const width = window.innerWidth
        const height = window.innerHeight

        canvas.width = width
        canvas.height = height

        canvas.addEventListener('mousedown', e => {
            mouse.click = true
        })

        canvas.addEventListener('mouseup', e => {
            mouse.click = false
        })

        canvas.addEventListener('mousemove', e => {
            mouse.pos.x = e.clientX / width
            mouse.pos.y = e.clientY / height
            mouse.move = true
        })

        socket.on('draw_line', data => {
            const line = data.line
            ctx.beginPath()
            ctx.lineWith = 2
            ctx.moveTo(line[0].x * width, line[0].y * height)
            ctx.lineTo(line[1].x * width, line[1].y * height)
            ctx.stroke()
        })

        const mainLoop = () => {
            if (mouse.click && mouse.move && mouse.pos_prev) {
                socket.emit('draw_line', { line: [mouse.pos, mouse.pos_prev] })
                mouse.move = false
            }
            mouse.pos_prev = { x: mouse.pos.x, y: mouse.pos.y }
            setTimeout(mainLoop, 25)
        }
        mainLoop()
    })

    return (
        <>
            <canvas id="chart"> </canvas>
        </>
    )

}

export default DrawableCanvas