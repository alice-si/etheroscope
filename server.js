var express = require('express')
var app = express()
var bodyParser = require('body-parser')
var methodOverride = require('method-override')
var morgan = require('morgan')
var path = require('path')
var db = require('./db/db.js')

var server = app.listen(8080)
var io = require('socket.io').listen(server)

// Set port to 8080
var port = process.env.PORT || 8080

var Promise = require('bluebird')
Promise.config({
  cancellation: true
})

process.on('uncaughtException', function (err) {
  console.error(err)
  console.log('uncaughtException error: ' + err)
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
  require('./api/api.js')(app, db, io) // configure our routes
  app.get('/test', function (req, res) {
    res.sendFile(path.join(__dirname, '/', staticdir, '/test.html'))
  })
  app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '/', staticdir, '/index.html'))
  })

  // Start application
  // app.listen(port)                                    // startup our app at http://localhost:8080
  console.log('Starting server at: ' + port)          // shoutout to the user
  exports = module.exports = app                        // expose app
}) // kickstart db connection
