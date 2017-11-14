var log = require('loglevel')
var db = require('./db.js')(log)
const Web3 = require('web3')
const Promise = require('bluebird')
const parityUrl = 'http://localhost:8545'
const web3 = new Web3(new Web3.providers.HttpProvider(parityUrl))
var Parity = require('../api/parity')(db, log)

db.poolConnect().then(() => {
  db.getLatestCachedBlockTime((err, res) => {
    let currentValue = 1
    if (err) {
      console.error('BlockCaching error: ' + err)
    }
    if (res.recordset[0][''] !== null) {
      currentValue = parseInt(res.recordset[0]['']) + 1
    }
    generateBlockTimeMappings(currentValue)
  })
})

let generateBlockTimeMappings = async function (index) {
  console.log('Logging block number  ' + index)
  getCurrentBlock().then((currentLatestBlock) => {
    if (index >= currentLatestBlock) {
      console.log('Waiting for 1 minute')
      Promise.delay(1000 * 60).then(() => {
        generateBlockTimeMappings(index)
      })
    } else {
      return Parity.calculateBlockTime(index).then((time) => {
        console.log('B,V: ' + index + ', ' + time)
        db.addBlockTime([[index, time, 0]])
          .then(() => {
            generateBlockTimeMappings(index += 1)
          })
      })
    }
  })
}

let getCurrentBlock = function () {
  return new Promise((resolve) => {
    web3.eth.getBlockNumber((error, result) => {
      if (error) {
        log.error('cacheBlocks.js: Error in getCurrentBlock')
      }
      return resolve(result)
    })
  })
}
