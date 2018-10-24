var mysql = require('promise-mysql')
function  test() {
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


const pool = mysql.createPool({
  connectionLimit: 10,
  connectionTimeout: 10000,
  host: '192.168.99.100',
  port: '8083',
  user: 'root',
  password: 'wp',
  database: 'etheroscope'
})

setTimeout(test,500)
