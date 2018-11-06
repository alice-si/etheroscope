var mysql = require('promise-mysql')
var mysqlConnectionOptions = require('../../backend/settings.js').mysqlConnectionOptions

const pool = mysql.createPool(mysqlConnectionOptions)

/*
simple and quick block generating for mysql, block.timeStamp = block.blockNumber
 */

async function test () {

  var step = 100          // size of inserted block pack
  var startBlock = 0
  var endBlock = 2946440

  var timesStampOfFirstBlock = 1492107044

  var i = startBlock // second for iterator
  var sql
  for (var curEndBlock = startBlock + step; curEndBlock < endBlock; curEndBlock += step) {

    var array = []

    for (; i < curEndBlock; i++) {
      var blockNumber = i
      await array.push([blockNumber, timesStampOfFirstBlock + (blockNumber * 15), 0])

      console.log('pushed to array block', blockNumber, 'percent completed', 100 * (blockNumber / endBlock), '%')
    }

    sql = 'insert into blocks (blockNumber, timeStamp, userLog) values ?'
    pool.query(sql, [array], console.log)
  }
  console.log('[addBlocksWithTImestamps.js]: Pushing blocks completed, turn off this script.\n')

}

setTimeout(test, 500)

