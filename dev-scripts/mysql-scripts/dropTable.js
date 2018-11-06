var mysql = require('promise-mysql')
var mysqlConnectionOptions = require('../../backend/backendSettings.js').mysqlConnectionOptions

const pool = mysql.createPool(mysqlConnectionOptions)

var tableName = 'contracts' // !!! set table name hear!

function test () {
  pool.query('drop table ' + tableName)
    .then(function (results) {
      console.log('Drop table "' + tableName + '" results:\n ', results)
    })
    .catch(function (err) {
      console.log('Drop table "' + tableName + '" error:\n', err)
    })
}

setTimeout(test, 500)
