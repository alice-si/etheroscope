const morgan = require('morgan')
const log = require('loglevel')
const http = require('http')
const express = require('express')
const bodyParser = require('body-parser')
const socketIO = require('socket.io')

const settings = require('../common/settings')
const DataPointsSender = require('./dataPointsSender')

const socketPort = settings.dataPointsService.socketPort

log.enableAll()

const app = express()

// set CORS
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    next()
})

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(morgan('dev'))

const server = http.createServer(app)
server.listen(socketPort)

log.info(`dataPointsApi started at port: ${socketPort}`)

const io = socketIO(server, {
    transports: ['websocket', 'xhr-polling']
})

const dataPointsSender = DataPointsSender(io,log)

io.on('connection', function (socket) {
    socket.on('getHistory', ([address, varableName]) => {
        try {
            let room = address + varableName
            log.debug(`Joining room ${room}`)
            socket.join(room)
            dataPointsSender.sendHistory(address, varableName, socket.id)
        } catch (err) {
            log.error('dataPointsService connection', err)
        }
    })

    socket.on('unsubscribe', ([address, variableName]) => {
        try {
            if (address !== null && variableName !== null) {
                let room = address + variableName
                log.debug(`Leaving room ${room}`)
                socket.leave(room)
            }
        } catch (err) {
            log.error('dataPoints service unsubscribe', err)
        }
    })
})

