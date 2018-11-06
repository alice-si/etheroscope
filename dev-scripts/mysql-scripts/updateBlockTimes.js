var mysql = require('promise-mysql')
var mysqlConnectionOptions = require('../../backend/backendSettings.js').mysqlConnectionOptions

const pool = mysql.createPool(mysqlConnectionOptions)

/*
* this script adds pseudo timestamps too blocks
 */

var sql = 'update blocks set timeStamp = \'' + 1492107044 + '\' + blocks.blockNumber * 15, userLog = 0'

function eh () {
  pool.query(sql).then(() => {
    console.log('success')
  }).catch(console.log)
}

setTimeout(eh, 500)
