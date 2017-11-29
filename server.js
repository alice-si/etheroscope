var express = require('express')
var app = express()
var bodyParser = require('body-parser')
var methodOverride = require('method-override')
var morgan = require('morgan')
var path = require('path')
var log = require('loglevel')
var validator = require('validator')

// Change this to alter how much information is printed out
log.setLevel('trace')
log.enableAll()

var db = require('./db/db.js')(log)

// Set port to 8080
var port = process.env.PORT || 8080

var Promise = require('bluebird')
Promise.config({
  cancellation: true
})

process.on('uncaughtException', function (err) {
  log.error('server.js: Error: uncaughtException: ' + err)
})

// Application options and configurations
app.use(bodyParser.json()) // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })) // parse application/vnd.api+json as json
app.use(bodyParser.urlencoded({ extended: true })) // parse application/x-www-form-urlencoded
app.use(methodOverride('X-HTTP-Method-Override')) // override with the X-HTTP-Method-Override header in the request. simulate DELETE/PUT

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  next()
})
app.use(morgan('dev'))

// Angular compilation directory
var staticdir = 'dist'
app.use(express.static(path.join(__dirname, '/', staticdir)))

db.poolConnect().then(() => {
  // Home page endpoint
  app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '/', staticdir, '/index.html'))
  })
  app.get('/explorer', function (req, res) {
    res.redirect('/')
  })
  app.get('/popular', function (req, res) {
    res.redirect('/')
  })
  var server = app.listen(port)
  var io = require('socket.io').listen(server)
  require('./api/api.js')(app, db, io, log, validator) // configure our routes

  // Start application
  // app.listen(port)                                    // startup our app at http://localhost:8080
  log.info('server.js: Starting server at: ' + port)          // shoutout to the user
  exports = module.exports = app                        // expose app
}) // kickstart db connection
