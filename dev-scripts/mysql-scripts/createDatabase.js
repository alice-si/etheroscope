var mysql = require('promise-mysql')

function test () {
  pool.query('create database etheroscope')
    .then(function (results) {
      console.log('Database creation success! results:\n ', results)
    })
    .catch(function (err) {
      console.log('Database cretion error:\n', err)
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
