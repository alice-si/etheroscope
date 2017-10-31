const db = require('./db')
const Web3 = require('web3')
var Parity = require('../api/parity')
const Promise = require('bluebird')
const parityUrl = 'http://localhost:8545'
const web3 = new Web3(new Web3.providers.HttpProvider(parityUrl))

db.poolConnect().then(() => {
  db.getLatestCachedBlockTime((err, res) => {
    let currentValue = 1
    if (err) {
      console.error("BlockCaching error: " + err)
    }
    if (res.recordset[0][''] !== null) {
      currentValue = parseInt(res.recordset[0]['']) + 1
    }
    generateBlockTimeMappings(currentValue)
  })
})

let generateBlockTimeMappings = async function (index) {
  console.log("Logging block number  " + index)
  getCurrentBlock().then((currentLatestBlock) => {
    if (index >= currentLatestBlock) {
      console.log("Waiting for 1 minute")
      Promise.delay(1000 * 60).then(() => {
        generateBlockTimeMappings(index)
      })
    } else {
      return Parity.calculateBlockTime(index).then((time) => {
        console.log("B,V: " + index + ", " + time)
        db.addBlockTime([[index, time, 0]], function (err, res) {
          if (err) {
            console.log('Error adding the time of a block to the db:\n' + err)
          }
          generateBlockTimeMappings(index+=1)
        })
      })
    }
  })
}

let getCurrentBlock = function () {
  return new Promise((resolve) => {
    web3.eth.getBlockNumber((error, result) => {
      return resolve(result)
    })
  })
}
