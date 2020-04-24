const cache = require('./data/cache')
const admin_name = 'System'

const EXTRA_TIME_PERCENT = 0.1
const POINTS_PER_USER_GUESS = 10

module.exports = io => {
    io.on('connection', socket => {
        console.log('new connection ' + socket.id)

        // ===================================
        //              SOCKETS
        // ===================================

        socket.on('join', ({ room_id, name }, callback) => {
            const room = cache.rooms.get(room_id)
            if(!room) return callback("The room doesn't exist.")
            
            const {error, user } = cache.users.create({ _id: socket.id, room_id, name })
            if(error || !user) return callback(error)

            user.tries_left = room.tries_per_user

            for (const { line, opts } of room.line_history) {
                socket.emit('draw_line', { line, opts })
            }
            
            join(user, room)
        })

        socket.on('create_room', (opts, callback) => {
            const {err, room } = cache.rooms.create(opts)
            if(callback) {
                if(err || !room) return callback(err)
                return callback()
            }
        })

        socket.on('send_message', message => {
            const user = cache.users.findOne(socket.id)
            if(!user) return
            const room = cache.rooms.get(user.room_id)

            if(!room) return

            const host = cache.users.findOne(room.host._id)

            // chek game is start and user is not drawing
            if(room.is_start && room.host._id != user._id && !user.gessed) {
                const users = cache.users.findByRoom(room._id)

                // check user has tries
                if(room.tries_per_user > 0) {
                    if(user.tries_left == 0) {
                        return io.to(user._id).emit('message', { user: { name: admin_name }, text: `${user.name}, you don't have more tries.`, color: '#ffcccc' })
                    } else {
                        user.tries_left--
                    }
                }
                // check guessed the word
                if(sanizateWord(message) == sanizateWord(room.word.name)) {
                    const countUsersGuessed = users.filter(user => user.guessed == true).length + 1

                    user.points += room.time
                    let extraTime = Math.round(room.time * EXTRA_TIME_PERCENT)
                    if(room.time > extraTime) {
                        room.time = extraTime
                    }
                    
                    host.points += Math.round(POINTS_PER_USER_GUESS * (extraTime / 10))

                    user.guessed = true

                    room.host = host
                    io.to(user.room_id).emit('message', { user: { name: admin_name }, text: `${user.name} guess the word!!`, color: '#ffff80' })
                    io.to(user._id).emit('message', { user: { name: admin_name }, text: `You guess the word ${room.word.name}!!`, color: '#ffff80' })
                    io.to(user._id).emit('user_data', user)
                    io.to(host._id).emit('user_data', host)
                    

                    if(countUsersGuessed == users.length - 1) {
                        if(room.words.length == 0 || room.max_rounds - 1 <= room.round) {
                            io.to(room._id).emit('message', { user: { name: admin_name }, text: `Everyone guess the word ${room.word.name}`, color: '#ffff80' })
                            end_game(room)
                            clearInterval(loop)
                        } else {
                            io.to(room._id).emit('message', { user: { name: admin_name }, text: `Everyone guess the word ${room.word.name}`, color: '#ffff80' })
                            next_player(room)
                        }
                    } else {
                        io.to(room._id).emit('room_data', { action: 'word_guessed', room, users })
                    }
                    
                }

            // else just send plain message
            } else {
                return io.to(user.room_id).emit('message', { user, text: message })
            }
            
            
        })


        socket.on('draw_line', ({ line, opts }) => {
            const user = cache.users.findOne(socket.id)
            if(!user) return
            const room = cache.rooms.get(user.room_id)

            if(user && room && room.host && room.is_start) {
                if(room.host._id === user._id) {
                    room.line_history.push({ line, opts })
                    io.to(user.room_id).emit('draw_line', { line, opts })
                }
            }
        })

        socket.on('clear_draw', () => {
            const user = cache.users.findOne(socket.id)
            if(!user) return
            const room = cache.rooms.get(user.room_id)

            room.line_history = []
            io.to(user.room_id).emit('clear_draw')
            return io.to(room._id).emit('room_data', { action: 'clean_draw', room, users: cache.users.findByRoom(room._id) })
        })

        socket.on('start_game', () => {
            start()
        })

        socket.on('disconnect', () => {
            const user = cache.users.delete(socket.id)

            if(user) {
                const room = cache.rooms.get(user.room_id)
                
                if(room.host._id == user._id){
                    next_player(room)
                }
                
                socket.leave(user.room_id)
                const users = cache.users.findByRoom(user.room_id)
                if(users.length > 0){
                    io.to(user.room_id).emit('message', { user: { name: admin_name }, text: `${user.name} has left.`, color: '#ffcccc' })
                    io.to(user.room_id).emit('room_data', { action: 'leave', room, users})
                } else {
                    cache.rooms.delete(room._id)
                }
                
            }
            console.log(`bye ${user ? user.name : socket.id}`)
        })




        // ===================================
        //         UTILITY METHODS
        // ===================================

        const join = (user, room) => {
            user.room_id = room._id
            socket.join(user.room_id)

            const users = cache.users.findByRoom(user.room_id)

            if(!room.owner) {
                room.owner = user
            }
            if(!room.host) {
                room.host = user
            }

            io.to(user.room_id).emit('room_data', { action: 'join', user, room, users })
            socket.emit('user_data', user)
            io.to(user.room_id).emit('message', { user: { name: admin_name }, text: `${user.name} joined.`, color: '#c2f0c2' })
            console.log(`joined ${user.name} to room ${user.room_id}`)
        }

        /**
         * Initialize a game in the room of the user, will setup the room with the configuration selected.
         */
        const start = () => {            
            const user = cache.users.findOne(socket.id)
            if(!user) return
            const room = cache.rooms.get(user.room_id)

            if(user && room) {
                cache.users.findByRoom(user.room_id).map(user => {
                    user.points = 0
                })
                room.line_history = []
                room.words = room.all_words
                room.is_start = true
                room.round = 1
                room.time = room.max_time
                cache.setRandomWord(room)
                const users = cache.users.findByRoom(room._id)
                users.forEach(user => {
                    user.tries_left = room.tries_per_user
                })
                io.to(room._id).emit('clear_draw')
                io.to(user.room_id).emit('room_data', { action: 'start', user, room, users })
                gameLoop(room)
            }
        }

        /**
         * Chage the drawer of the room.
         * 
         * @param {Object} room 
         */
        const next_player = (room) => {
            cache.setNextHost(room)
            if(room.is_start) {
                room.line_history = []
                room.round++
                room.time = room.max_time
                cache.setRandomWord(room)
                const users = cache.users.findByRoom(room._id)
                users.forEach(user => {
                    user.tries_left = room.tries_per_user
                })
                io.to(room._id).emit('clear_draw')
                return io.to(room._id).emit('room_data', { action: 'next_player', room, users })
            }
        }

        /**
         * Ends the game of the room and look for the winner.
         * 
         * @param {*} room 
         */
        const end_game = (room) => {
            room.is_start = false
            room.round++
            const winner = cache.users.findByRoom(room._id).sort((a,b)=>b.points - a.points)[0]
            return io.to(room._id).emit('room_data', { action: 'game_ends', room, users: cache.users.findByRoom(room._id), winner })
        }

        /**
         * Create a promise in order to work as a separate thread, setup a 1 sec interval
         * and update room time, resolve when game is over.
         * 
         * @param {Object} room 
         */
        const gameLoop = (room) => {
            let loop = setInterval(()=> {
                if(!room.is_start) {
                    clearInterval(loop)
                } else if(room.time > 0) {
                    room.time--
                    io.to(room._id).emit('room_data', { action: 'update_time', room, users: cache.users.findByRoom(room._id) })
                } else {
                    if(room.words.length == 0 || room.max_rounds - 1 <= room.round) {
                        io.to(room._id).emit('message', { user: { name: admin_name }, text: `The word was ${room.word.name}`, color: '#ffff80' })
                        end_game(room)
                        clearInterval(loop)
                    } else {
                        io.to(room._id).emit('message', { user: { name: admin_name }, text: `The word was ${room.word.name}`, color: '#ffff80' })
                        next_player(room)
                    }
                }
            }, 1000)
        }

        const sanizateWord = text => {
            return text.trim().toLowerCase().replace("'", '') 
        }
    })
}