// const axios = require('axios')
const Web3 = require('web3')
const Promise = require('bluebird')
// const ReadWriteLock = require('rwlock')

// const settings = require('./settings.js')
// const errorHandler = require('../common/errorHandlers')

// const lock = new ReadWriteLock()
const parityUrl = 'http://' + '35.246.67.158:8545'
const web3 = new Web3(new Web3.providers.HttpProvider(parityUrl))


/**
 * Function responsible for sending number of latest block in ethereum.
 *
 * @return {Promise<number>} number of latest block
 */
// var getLatestHash = async function () {
//   try {
//     console.log('parity.getLatestBlock')
//
//     return new Promise((resolve, reject) => {
//       return web3.eth.getBlock((err, block) => {
//         if (err) {
//           console.log('ERROR - parityGetLatestBlock', err)
//           return reject(err)
//         }
//         console.log('block', block)
//         return resolve(block)
//       })
//     })
//   } catch (err) {
//     // errorHandler.errorHandleThrow('parity.getLatestBlock', '')(err)
//   }
// }

console.log("yolo")
web3.eth.net.isListening()
  .then(() => {
    console.log('Successfully connected to parity, tried', parityUrl)
    return new Promise((resolve, reject) => {
      return web3.eth.getBlock((err, block) => {
        if (err) {
          console.log('ERROR - parityGetLatestBlock', err)
          return reject(err)
        }
        console.log('block', block)
        return resolve(block)
      }).catch(console.log)
    }).catch(console.log)
  })
  .catch(() => {
    console.log('Please start parity, have tried:', parityUrl)
    process.exit(1)
  })

