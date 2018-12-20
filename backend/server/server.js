var express = require('express')
var app = express()
var bodyParser = require('body-parser')
var methodOverride = require('method-override')
var morgan = require('morgan')
var path = require('path')
var log = require('loglevel')
var validator = require('validator')

var errorHandle = require('../common/errorHandlers').errorHandle
var errorCallbackHandle = require('../common/errorHandlers').errorCallbackHandle

var settings = require('../common/settings.js')

// Change this to alter how much information is printed out
log.setLevel('trace')
log.enableAll()

console.log('server.js: Starting server.js')
console.log('server.js: Will require db.js')

try {
    var db = require('../common/db.js')(log)

    var Promise = require('bluebird')
    Promise.config({
        cancellation: true
    })

    process.on('uncaughtException', function (err) {
        log.error('server.js: Error: processs got uncaughtException:\n' + err)
    })

// Application options and configurations
    app.use(bodyParser.json()) // parse application/json
    app.use(bodyParser.json({type: 'application/vnd.api+json'})) // parse application/vnd.api+json as json
    app.use(bodyParser.urlencoded({extended: true})) // parse application/x-www-form-urlencoded
    app.use(methodOverride('X-HTTP-Method-Override')) // override with the X-HTTP-Method-Override header in the request. simulate DELETE/PUT

    app.use(function (req, res, next) {
        res.header('Access-Control-Allow-Origin', '*')

        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
        next()
    })
    app.use(morgan('dev'))

// Angular compilation directory
// var staticdir = 'dist'
// app.use(express.static(path.join(__dirname, '/', staticdir)))
//     / Angular compilation directory
//     var staticdir = 'dist'
//     app.use(express.static(path.join(__dirname, '/', staticdir)))

// Home page endpoint
// app.get('/', function (req, res) {
//     console.log('/')
//     res.sendFile(path.join(__dirname, '/', staticdir, '/index.html'))
// })
//     app.get('/explorer', function (req, res) {
//         console.log('/explorer')
//         res.sendFile(path.join(__dirname, '/', staticdir, '/index.html'))
//     })
//     app.get('/explorer/*', function (req, res) {
//         console.log('/explorer/*')
//         res.sendFile(path.join(__dirname, '/', staticdir, '/index.html'))
//     })
//     app.get('/popular', function (req, res) {
//         console.log('/popular')
//         res.sendFile(path.join(__dirname, '/', staticdir, '/index.html'))
//     })

    process.on('unhandledRejection', (reason, p) => {
        console.log('server.js: Unhandled Rejection at:\n Promise:\n', p, '\nreason:\n', reason)
    })

// require first query handler
    require('./api.js')(app, db, log, validator) // configure our routes

// use test query handler
    require('../tester/testerApi.js')(app, db, log, validator) // configure our routes

// Set port to 8080
    var port = settings.ETHEROSCOPESERVER.slice(-4)
// port = "" + (parseInt(port) + 17)

// Start application
    log.info('server.js: Starting server at: ' + port)    // shoutout to the user
console.log('server.js: Starting server at: ' + port)    // shoutout to the user
    app.listen(port)
} catch (err) {
    errorHandle('could not app.listen on port'+port)(err)
}


exports = module.exports = app                        // expose app
