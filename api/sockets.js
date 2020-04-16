const cache = require('./data/cache')

module.exports = io => {
    io.on('connection', socket => {
        const user_id = socket.id
        console.log('new connection' + user_id)
        let line_history = cache.line_history
        for (const line of line_history) {
            io.emit('draw_line', { line })
        }

        socket.on('join', ({ room_id }) => {
            console.log(room_id)
            if(cache.rooms[room_id]) {
                cache.rooms[room_id].users.push({ _id: user_id })
                socket.join(room_id)
                io.to(room_id).emit('join', { users: cache.rooms[room_id].users })
            }
        })

        socket.on('create_room', data => {
            console.log(data)
        })

        socket.on('join_room', data => {
            console.log(data)
        })



        socket.on('draw_line', data => {
            cache.line_history.push(data.line)
            io.emit('draw_line', data)
        })

        socket.on('disconnect', () => {
            console.log('bye')
        })
    })
}