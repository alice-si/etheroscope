const axios = require('axios')
const Web3 = require('web3')
var Promise = require('bluebird')
var ReadWriteLock = require('rwlock')
var lock = new ReadWriteLock()

var settings = require('./settings.js')
var WEB3HOST = settings.ETHEROSCOPEGETHHOST
const PARITYURL = 'http://' + WEB3HOST // api connector
const web3 = new Web3(new Web3.providers.HttpProvider(PARITYURL))

module.exports = function (db, log, validator, withStateDB = false) { // TODO: del withStateDB Aaargument
  const web3Client = {}

  if (!web3.isConnected()) {
    console.log('Please start web3Client, have tried: ', PARITYURL)
    process.exit(1)
  }
  console.log('Successfully connected to web3Client, have tried: ', PARITYURL)

  web3Client.getLatestBlock = function () {
    return new Promise((resolve, reject) => {
      return web3.eth.getBlockNumber((error, block) => {
        if (error) {
          log.error('Error getting block number' + error)
        }
        return resolve(block)
      })
    })
  }

  web3Client.getContract = function (address) {
    return new Promise((resolve, reject) => {
      db.getContract(address.substr(2))
        .then((result) => {
          // If we don't have the contract, get it from etherscan
          if (result.contract === null) {
            // const axiosGET = 'https://api.etherscan.io/api?module=contract&action=getabi&address=' // Get ABI
            // TODO: choose axiosGET between ethereum and rinkeby
            const axiosGET = 'https://api-rinkeby.etherscan.io/api?module=contract&action=getabi&address=' // Get ABI
            const axiosAPI = '&apikey=RVDWXC49N3E3RHS6BX77Y24F6DFA8YTK23'
            return axios.get(axiosGET + address + axiosAPI)
              .then((res) => {
                console.log('address', address)
                let parsedContract = web3Client.parseContract(res.data.result, address)
                // Add the contract to the database, assuming it is already in there (with a name)
                console.log('will updateContractWithABI')
                db.updateContractWithABI(address.substr(2), res.data.result)
                  .catch((err) => {
                    log.error('web3Client.js: Error adding contract abi to the db')
                    log.error(err)
                  })
                return resolve({parsedContract: parsedContract, contractName: result.contractName})
              })
              .catch((err) => {
                log.error('web3Client.js: Etherscan.io API error: ' + err)
                return reject(err)
              })
          }
          // console.log('web3Client.getContract:result', result)
          let parsedContract = web3Client.parseContract(result.contract, address)
          return resolve({contractName: result.contractName, parsedContract: parsedContract})
        })
    })
  }

  // Obtaining Contract information from ABI and address
  web3Client.parseContract = function (desc, address) {
    // console.log('desc', desc)
    var contractABI = desc
    try {
      //TODO: type of
      console.log('web3Client.parseContract:typeofdesc', typeof desc)
      // console.log('desc:----------\n', desc)
      if (typeof desc === 'string') {
        contractABI = JSON.parse(desc)
      }
    } catch (err) {
      console.log('error in JSON parse')
      console.log(err)
      console.log('tried to parse desc\n')
    }
    var Contract = web3.eth.contract(contractABI)
    return Contract.at(address)
  }

  web3Client.getContractVariables = function (contractInfo) {
    let parsedContract = contractInfo.parsedContract
    let contractName = contractInfo.contractName
    return new Promise((resolve, reject) => {
      let address = parsedContract.address.substr(2)
      db.getVariables(address).then((res) => {
        console.log('res', res)
        if (res.length === 0) {
          log.debug('web3Client.js: Caching variables for contract')
          var abi = parsedContract.abi
          let variableNames = []
          return Promise.each(abi, (item) => {
            if (item.outputs && item.outputs.length === 1 &&
              item.outputs[0].type.indexOf('uint') === 0 &&
              item.inputs.length === 0) {
              variableNames.push(item.name)
            }
          })
            .then((results) => {
              return db.addVariables(address, variableNames)
                .then(() => {
                  return results
                })
                .catch((err) => {
                  log.error('web3Client.js: Error adding variable names to db')
                  log.error(err)
                  process.exit(1)
                })
            })
            .then((results) => {
              db.getVariables(address).then((res) => {
                console.log('web3Client:res', res)
                let variableNames = []
                Promise.map(res, (elem) => {
                  variableNames.push(elem)
                }, {concurrency: 5}).then(() => {
                  return resolve({variables: variableNames, contractName: contractName})
                })
              })
            })
        } else {
          console.log('hello')
          let variableNames = []
          Promise.map(res, (elem) => {
            console.log('->hello')
            variableNames.push(elem)
          }, {concurrency: 5}).then(() => {
            return resolve({variables: variableNames, contractName: contractName})
          })
        }
      })
    })
  }

  // Query value of variable at certain block
  web3Client.queryAtBlock = function (query, block) {
    let hex = '0x' + block.toString(16)
    web3.eth.defaultBlock = hex
    return new Promise((resolve, reject) => {
      return query((err, result) => {
        return (err ? reject(err) : resolve(parseInt(result.valueOf())))
      })
    })
  }

  web3Client.calculateBlockTime = function (blockNumber) {
    return new Promise((resolve) => {
      let time = web3.eth.getBlock(blockNumber).timestamp
      return resolve(time)
    })
  }

  web3Client.getBlockTime = function (blockNumber) {
    return new Promise((resolve) => {
      db.getBlockTime(blockNumber)
        .then((result) => {
          // Check the database for the blockTimeMapping
          if (result.length !== 0) {
            return resolve(result[0].timeStamp)
          }
          // If it isn't in the database, we need to calculate it
          // acquire a lock so that we don't calculate this value twice
          // Using a global lock to protect the creation of locks...
          lock.writeLock(blockNumber, (release) => {
            // Check again if it is in the db, since it may have been
            // added whilst we were waiting for the lock
            db.getBlockTime(blockNumber)
              .then((result) => {
                if (result.length !== 0) {
                  release()
                  return resolve(result[0].timeStamp)
                }
                // If it still isn't in there, we calcuate it and add it
                web3Client.calculateBlockTime(blockNumber).then((time) => {
                  db.addBlockTime([[blockNumber, time, 1]])
                    .then(() => {
                      release()
                      return resolve(time)
                    })
                })
              })
          })
        })
    })
  }

  return web3Client
}
