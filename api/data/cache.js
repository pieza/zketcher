const _users = []
const _rooms = []

const setRandomWord = (room) => {
    let i = Math.floor(Math.random() * room.words.length)
    room.word = room.words.splice(i, 1)[0]
    return room
}



const users = {
    create: ({ _id, name, room_id }) => {
        if(!name || !room_id) return { error: 'Please enter a valid room and username' }

        name = name.trim().toLowerCase()
        room_id = room_id.trim().toLowerCase()
        const existingUser = _users.find(user => user.room_id === room_id && user.name === name)

        if(existingUser) return { error: 'Username already exist.' }

        const user = { 
            _id, 
            name, 
            room_id, 
            points: 0,  
            guessed: false
        }
        _users.push(user)

        return { user }
    },
    all: () => { 
        return _users 
    },
    findOne: _id => {
        return _users.find(user => user._id == _id)
    },
    findByRoom: room_id => {
        return _users.filter(user => user.room_id == room_id)
    },
    delete: _id => {
        const index = _users.findIndex(user => user._id == _id)

        if(index !== -1) return _users.splice(index, 1)[0]
    }
}

const rooms = {
    get: _id => {
        if(!_id) return null

        _id = _id.trim().toLowerCase()
        const existingRoom = _rooms.find(room => room._id === _id)

        if(existingRoom) return existingRoom
    },
    create: opts => {
        console.log(opts)
        const existingRoom = _rooms.find(room => room._id === opts._id)
        if(existingRoom) return { error: 'The room already exist.' }

        const room = { 
            _id: opts._id, 
            message_history: [],
            line_history: [],
            //host: user,
            //owner: user,
            words: [],
            all_words: opts.words_id ? require(`./word-lists/${opts.words_id}.js`) : require(`./word-lists/lol.js`),
            word: '',
            is_start: false,
            max_rounds: opts.max_rounds || 8,
            max_time: opts.max_time || 120,
            tries_per_user: opts.tries_per_user || 0,
            time: 0,
            round: 0
        }

        //user.room_id = room._id

        _rooms.push(room)
        return { room }
    },
    delete: _id => {
        const index = _rooms.findIndex(room => room._id == _id)

        if(index !== -1) return _rooms.splice(index, 1)[0]
    }
}

const setNextHost = (room) => {
    const players = users.findByRoom(room._id)
    let index = players.findIndex(user => user._id == room.host._id)
    let max = players.length
    index++
    if(index > max - 1) {
        index = 0
    }
    room.host = players[index]
    return room
}

module.exports = Object.freeze({
    rooms,
    users,
    setRandomWord,
    setNextHost
})
