import React from 'react'
import './ToolsPallete.css'

const colors = ['#ffffff', '#000000', '#e14e25', '#f09d34', '#e5c62e', '#b3d048', '#6bc56c', '#2292F7', '#C948F5', '#F75BEB', '#5BF7F7', '#d0d3d9']
const sizes = [2, 6, 8, 12]

const ToolsPallete = ({ socket, imHost, room, pallete, setPallete }) => {
    const { _id, host, word, round, time, is_start } = room
    
    const handleClearClick = e => {
        e.preventDefault()
        socket.emit('clear_draw')
    }
    const handleColorClick = (e, color) => {
        setPallete({
            ...pallete,
            color
        })
    }

    const handleSizeClick = (e, size) => {
        e.preventDefault()
        setPallete({
            ...pallete,
            size
        })
    }

    return (
        <>
            { imHost && is_start ?
                <>
                    <div className="row mb-4">
                        <button className="btn btn-outline-danger my-2 my-sm-0" onClick={handleClearClick}>
                            <span className="material-icons">delete</span>
                        </button>
                    </div>
                    <div className="row text-center">
                        <h4>Sizes</h4>
                    </div>
                    <div className="row mb-4 color-pallete">
                        { sizes.map((size, key) => {
                            const id = `c${key}`
                            return (<div key={key}>
                                <input id={id} type="checkbox" checked={pallete.size == size} onClick={e => handleSizeClick(e, size)} readOnly/>
                                <label className="ripple-effect" htmlFor={id} style={{ backgroundColor: 'black' }}></label>
                            </div>)
                        }) }
                    </div>

                    <div className="row text-center">
                        <h4>Colors</h4>
                    </div>
                    <div className="row color-pallete">
                        { colors.map((color, key) => {
                            const id = `s${key}`
                            return (<div key={key}>
                                <input id={id} type="checkbox" checked={pallete.color == color} onClick={e => handleColorClick(e, color)} readOnly/>
                                <label className="ripple-effect" htmlFor={id} style={{ backgroundColor: color }}></label>
                            </div>)
                        }) }
                    </div>
                </>
            : null }
        </>
    )
}

export default ToolsPallete