var mysql = require('promise-mysql')
var mysqlConnectionOptions = require('../../backend/backendSettings.js').mysqlConnectionOptions

const pool = mysql.createPool(mysqlConnectionOptions)

function test () {
  pool.query('show tables')
    .then(function (results) {
      console.log('Show tables results:\n ', results)
    })
    .catch(function (err) {
      console.log('Show tables error:\n', err)
    })
}

setTimeout(test, 500)
