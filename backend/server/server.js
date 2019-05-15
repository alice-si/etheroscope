const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const morgan = require('morgan')
const log = require('loglevel')
const validator = require('validator')
const db = require('../db')
const errorHandle = require('../common/errorHandlers').errorHandle
const settings = require('../common/settings.js')

const port = settings.server.port

log.enableAll()

log.debug('server.js: Starting server.js')

try {
    app.use(bodyParser.json())

    app.use(function (req, res, next) {
        res.header('Access-Control-Allow-Origin', settings.allowedOrigin)
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
        next()
    })
    app.use(morgan('dev'))

    require('./api.js')(app, db, log, validator)

    log.debug('server.js: Starting server at: ' + port)

    app.listen(port)
} catch (err) {
    errorHandle('could not app.listen on port' + port)(err)
    process.exit(1)
}
