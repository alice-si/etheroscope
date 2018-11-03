var mysql = require('promise-mysql')

var tableName = 'contracts' // !!! set table name hear!

function test () {
  pool.query('drop table ' + tableName)
    .then(function (results) {
      console.log('Drop table "'+ tableName+'" results:\n ', results)
    })
    .catch(function (err) {
      console.log('Drop table "'+ tableName+'" error:\n', err)
    })
}

const pool = mysql.createPool({
  connectionLimit: 10,
  connectionTimeout: 10000,
  host: 'localhost',
  port: '8083',
  user: 'root',
  password: 'wp',
})

setTimeout(test, 500)
