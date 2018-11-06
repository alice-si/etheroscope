var mysql = require('promise-mysql')
var mysqlConnectionOptions = require('../../backend/backendSettings.js').mysqlConnectionOptions

const pool = mysql.createPool(mysqlConnectionOptions)

function test () {
  pool.query('create database etheroscope')
    .then(function (results) {
      console.log('Database creation success! results:\n ', results)
    })
    .catch(function (err) {
      console.log('Database cretion error:\n', err)
    })
}

setTimeout(test, 500)
