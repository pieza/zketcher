import React, { useEffect, useRef } from 'react'
import './DrawableCanvas.css'

const DrawableCanvas = ({ pallete, strokes, canDraw, onDrawLine }) => {
    const canvasRef = useRef(null)
    const drawingRef = useRef(false)
    const previousPointRef = useRef(null)

    const drawStroke = (ctx, stroke, width, height) => {
        if (!stroke || !stroke.line || stroke.line.length !== 2) return
        const opts = stroke.opts || {}
        ctx.beginPath()
        ctx.lineWidth = Number(opts.size) || 2
        ctx.strokeStyle = opts.color || '#000000'
        ctx.lineCap = 'round'
        ctx.moveTo(stroke.line[0].x * width, stroke.line[0].y * height)
        ctx.lineTo(stroke.line[1].x * width, stroke.line[1].y * height)
        ctx.stroke()
    }

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return undefined
        const resize = () => {
            const rect = canvas.getBoundingClientRect()
            const scale = window.devicePixelRatio || 1
            canvas.width = rect.width * scale
            canvas.height = rect.height * scale
            const ctx = canvas.getContext('2d')
            ctx.setTransform(scale, 0, 0, scale, 0, 0)
            ctx.clearRect(0, 0, rect.width, rect.height)
            strokes.forEach(stroke => drawStroke(ctx, stroke, rect.width, rect.height))
        }
        resize()
        window.addEventListener('resize', resize)
        return () => window.removeEventListener('resize', resize)
    }, [strokes])

    const pointFromEvent = event => {
        const rect = event.currentTarget.getBoundingClientRect()
        return {
            x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
            y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height))
        }
    }

    const handlePointerDown = event => {
        if (!canDraw) return
        drawingRef.current = true
        previousPointRef.current = pointFromEvent(event)
        event.currentTarget.setPointerCapture(event.pointerId)
    }

    const handlePointerMove = event => {
        if (!canDraw || !drawingRef.current || !previousPointRef.current) return
        const nextPoint = pointFromEvent(event)
        const line = [previousPointRef.current, nextPoint]
        previousPointRef.current = nextPoint
        onDrawLine(line, { size: pallete.size, color: pallete.color }).catch(() => undefined)
    }

    const stopDrawing = event => {
        drawingRef.current = false
        previousPointRef.current = null
        if (event.currentTarget.hasPointerCapture && event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    }

    return <canvas ref={canvasRef} id="chart" className={canDraw ? 'drawable-canvas' : 'drawable-canvas read-only'} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={stopDrawing} onPointerCancel={stopDrawing} />
}

export default DrawableCanvas
