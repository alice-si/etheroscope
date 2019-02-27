var log = require('loglevel')
var validator = require('validator')

var errorHandlers = require('../common/errorHandlers')
var settings = require('../common/settings.js')

// Change this to alter how much information is printed out
log.setLevel('trace')
log.enableAll()

console.log('server.js: Starting server.js')
console.log('server.js: Will require db.js')

try {
    var app = require('../common/preconfiguredApp.js')
    var db = require('../common/db.js')(log)


// add test query handler API
    require('./transactionListApi.js')(app, db, log, validator) // configure our routes

// Set port to 8080
    var port = settings.ETHEROSCOPETRANSACTIONLISTSERVICE.slice(-4)

// Start application
    log.info('server.js: Starting server at: ' + port)    // shoutout to the user
    app.listen(port)

    exports = module.exports = app                        // expose app
} catch (err) {
    errorHandlers.errorHandle('could not app.listen on port' + port)(err)
}


