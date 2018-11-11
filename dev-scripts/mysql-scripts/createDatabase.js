var mysql = require('promise-mysql')
var mysqlConnectionOptions = require('../../backend/settings.js').mysqlConnectionOptions

var optionsBeforeDBCreation = JSON.parse(JSON.stringify(mysqlConnectionOptions)) // full copy
delete optionsBeforeDBCreation['database'] // delete database field

const pool = mysql.createPool(optionsBeforeDBCreation)

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
