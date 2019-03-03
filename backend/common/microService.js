var express = require('express')
var app = express()
var bodyParser = require('body-parser')
var methodOverride = require('method-override')
var morgan = require('morgan')
var path = require('path')
var log = require('loglevel')
var validator = require('validator')

var errorHandle = require('./errorHandlers').errorHandle
var errorCallbackHandle = require('./errorHandlers').errorHandleCallback

var settings = require('./settings.js')

// Change this to alter how much information is printed out
log.setLevel('trace')
log.enableAll()

console.log('microService.js: Starting microService.js')

exports = module.exports = (port) => {
    try {
        var Promise = require('bluebird')
        Promise.config({cancellation: true})

        process.on('uncaughtException', (err) => log.error('micro-service.js: Error: processs got uncaughtException:\n' + err))
        process.on('unhandledRejection', (reason, p) => console.log('microService.js: Unhandled Rejection at:\n Promise:\n', p, '\nreason:\n', reason))

// Application options and configurations
        app.use(bodyParser.json()) // parse application/json
        app.use(bodyParser.json({type: 'application/vnd.api+json'})) // parse application/vnd.api+json as json
        app.use(bodyParser.urlencoded({extended: true})) // parse application/x-www-form-urlencoded
        app.use(methodOverride('X-HTTP-Method-Override')) // override with the X-HTTP-Method-Override header in the request. simulate DELETE/PUT
        app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*')
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
            next()
        })
        app.use(morgan('dev'))
        log.info('microService.js: Starting server at: ' + port)    // shoutout to the user
        app.listen(port)
        return app
    } catch (err) {
        errorHandle('could not app.listen on port' + port)(err)
    }
}



