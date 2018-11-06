var mysql = require('promise-mysql')
var mysqlConnectionOptions = require('../../backend/settings.js').mysqlConnectionOptions

const pool = mysql.createPool(mysqlConnectionOptions)

function test () {
  // pool.query('select * from blocks where timeStamp != blockNumber').then(function (results) {
  //   console.log('results blocks: ', results)
  // })
  // pool.query('select * from contractLookupHistory').then(function (results) {
  //   console.log('results contractLookupHistory: ', results)
  // })
  // pool.query('select * from contracts').then(function (results) {
  //   console.log('results contracts: ', results)
  // })
  // pool.query('select * from dataPoints').then(function (results) {
  //   console.log('results dataPoints: ', results)
  // })
  // pool.query('select * from variableUnits').then(function (results) {
  //   console.log('results variableUnits: ', results)
  // })
  // pool.query('select * from variables').then(function (results) {
  //   console.log('results variabels: ', results)
  // })
  pool.query('show tables').then(function (results) {
    console.log('results show tables: ', results)
  })
  var sql = 'select MAX(blockNumber) from blocks where userLog=0'
  pool.query(sql).then(function (results) {
    console.log('Max block: ', results)
  })
}

setTimeout(test, 500)
