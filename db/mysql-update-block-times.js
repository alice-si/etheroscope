var mysql = require('promise-mysql')

/*
* this script adds pseudo timestamps too blocks
 */

const pool = mysql.createPool({
  connectionLimit: 10,
  connectionTimeout: 1000000,
  host: '192.168.99.100',
  port: '8083',
  user: 'root',
  password: 'wp',
  database: 'etheroscope'
})

var sql = 'update blocks set timeStamp = \''+1492107044+'\' + blocks.blockNumber * 15, userLog = 0'

function eh(){
  pool.query(sql).then(()=>{
    console.log('success')
  }).catch(console.log)
}
setTimeout(eh, 500)
