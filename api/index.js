const express = require('express')
const cors = require('cors')
const path = require('path')
const http = require('http')
const socket = require('socket.io')

const app = express()
const server = http.createServer(app)
const io = socket(server, { origins: '*:*' })

// settings
app.set('port', process.env.PORT || 3100)
app.use(express.static(path.join(__dirname, '..', 'public')))

// sockets
require('./sockets')(io)

// midlewares
app.use(cors())

// routes
app.use('*', (req, res, next) => {
    if(!req.originalUrl.includes(process.env.API_PATH))
        res.sendFile(path.join(__dirname, '..', 'public', 'index.html'))
    else
        next()
})


server.listen(app.get('port'), () => {
    console.log(`Server running on port ${app.get('port')}`)
})