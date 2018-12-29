var morgan = require('morgan')
let log = require('loglevel')
let validator = require('validator')
var assert = require('assert');

// Initialise the server
let express = require('express')
let bodyParser = require('body-parser')
let app = express()

// set CORS
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    next()
})
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(morgan('dev'))

var http = require('http')
let socketPort = 8081
let server = http.createServer(app)
server.listen(socketPort)
log.info('dataPointsApi started at port:', socketPort)

let io = require('socket.io')(server, {
    transports: ['websocket', 'xhr-polling']
})

// import other parts of project
var errorHandler = require('../common/errorHandlers')
var DataPointsSender = require('./dataPointsSender')
var dataPointsSender = DataPointsSender(io,log,validator)

io.on('connection', function (socket) {
    log.info('new client request \'connection\'')

    socket.on('getHistory', ([address, method]) => {
        log.info('new client request \'connection\' \'getHistory\'')
        let room = address + method
        socket.join(room)
        log.debug('Joined room:', room)
        dataPointsSender.sendHistory(address, method, socket)
    })

    socket.on('unsubscribe', ([address, method]) => {
        log.info('new client request \'connection\' \'unsubscribe\'')
        if (address !== null && method !== null) {
            log.debug('Unsubbing')
            socket.leave(address + method, (err) => {
                log.debug('unsubbed!!')
                socket.emit('unsubscribed', {error: err})
            })
        } else {
            socket.emit('unsubscribed', {error: null})
        }
    })
})

io.on('disconnect', function (socket) {
    log.info('new client request \'disconnect\'')
})

