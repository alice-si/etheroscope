var mysql = require('promise-mysql')

function test () {
  pool.query('show tables')
    .then(function (results) {
      console.log('Show tables results:\n ', results)
    })
    .catch(function (err) {
      console.log('Show tables error:\n', err)
    })
}

const pool = mysql.createPool({
  connectionLimit: 10,
  connectionTimeout: 10000,
  host: 'localhost',
  port: '8083',
  user: 'root',
  password: 'wp',
  database: 'etheroscope'
})

setTimeout(test, 500)
