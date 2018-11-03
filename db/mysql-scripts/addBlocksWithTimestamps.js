var mysql = require('promise-mysql')

/*
simple and quick block generating for mysql, block.timeStamp = block.blockNumber
 */

async function test () {

  var step = 100          // size of inserted block pack
  var startBlock = 0
  var endBlock = 2946440

  var timesStampOfFirstBlock = 1492107044

  var i = startBlock // second for iterator
  for (var curEndBlock = startBlock + step; curEndBlock < endBlock; curEndBlock += step) {

    var array = []

    for (; i < curEndBlock; i++) {
      var blockNumber = i
      await array.push([blockNumber, timesStampOfFirstBlock + (blockNumber * 15), 0])

      console.log('pushed to array block', blockNumber, 'percent completed', blockNumber / endBlock)
    }

    sql = 'insert into blocks (blockNumber, timeStamp, userLog) values ?'
    pool.query(sql, [array], console.log)
  }
}

const pool = mysql.createPool({
  connectionLimit: 10,
  connectionTimeout: 10000000,
  host: 'localhost',
  port: '8083',
  user: 'root',
  password: 'wp',
  database: 'etheroscope'
})

setTimeout(test, 500)

