const express = require('express')
const cors = require('cors')
const path = require('path')
const http = require('http')
const socket = require('socket.io')

const dotenv = require('dotenv')
dotenv.config()

const app = express()
const server = http.createServer(app)
const io = socket(server, { origins: '*:*' })

// settings
if(process.env.NODE_ENV == 'development') {
    app.set('port', process.env.REACT_APP_SERVER_PORT || 5000)
    
} else {
    app.set('port', process.env.PORT || 3000)
}
app.use(express.static(path.join(__dirname, '..', 'build')))

// sockets
require('./sockets')(io)

// midlewares
app.use(cors())

// routes
app.use('*', (req, res, next) => {
    if(!req.originalUrl.includes(process.env.API_PATH))
        res.sendFile(path.join(__dirname, '..', 'build', 'index.html'))
    else
        next()
})


server.listen(app.get('port'), () => {
    console.log(`Server running on port ${app.get('port')}`)
})