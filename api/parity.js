const axios = require('axios')
const Web3 = require('web3')
var Promise = require('bluebird')
var ReadWriteLock = require('rwlock')
var lock = new ReadWriteLock()

const parityUrl = 'http://localhost:8545'
const web3 = new Web3(new Web3.providers.HttpProvider(parityUrl))

module.exports = function (db, log, validator) {
  const parity = {}

  if (!web3.isConnected()) {
    console.log('Please start parity')
    process.exit(1)
  }
  console.log('Successfully connected to parity')

  parity.getLatestBlock = function () {
    return new Promise((resolve, reject) => {
      return web3.eth.getBlockNumber((error, block) => {
        if (error) {
          log.error('Error getting block number' + error)
        }
        return resolve(block)
      })
    })
  }

  parity.getContract = function (address) {
    return new Promise((resolve, reject) => {
      db.getContract(address.substr(2))
      .then((result) => {
        // If we don't have the contract, get it from etherscan
        if (result.contract === null) {
          const axiosGET = 'https://api.etherscan.io/api?module=contract&action=getabi&address=' // Get ABI
          const axiosAPI = '&apikey=RVDWXC49N3E3RHS6BX77Y24F6DFA8YTK23'
          return axios.get(axiosGET + address + axiosAPI)
            .then((res) => {
              let parsedContract = parity.parseContract(res.data.result, address)
              // Add the contract to the database, assuming it is already in there (with a name)
              db.updateContractWithABI(address.substr(2), res.data.result)
                .catch((err) => {
                  log.error('parity.js: Error adding contract abi to the db')
                  log.error(err)
                })
              return resolve({ parsedContract: parsedContract, contractName: result.contractName })
            })
            .catch((err) => {
              log.error('parity.js: Etherscan.io API error: ' + err)
              return reject(err)
            })
        }
        let parsedContract = parity.parseContract(result.contract, address)
        return resolve({ contractName: result.contractName, parsedContract: parsedContract })
      })
    })
  }

  // Obtaining Contract information from ABI and address
  parity.parseContract = function (desc, address) {
    var contractABI = JSON.parse(desc)
    var Contract = web3.eth.contract(contractABI)
    return Contract.at(address)
  }

  parity.getContractVariables = function (contractInfo) {
    let parsedContract = contractInfo.parsedContract
    let contractName = contractInfo.contractName
    return new Promise((resolve, reject) => {
      let address = parsedContract.address.substr(2)
      db.getVariables(address).then((res) => {
        if (res.recordset.length === 0) {
          log.debug('parity.js: Caching variables for contract')
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
                log.error('parity.js: Error adding variable names to db')
                log.error(err)
                process.exit(1)
              })
          })
          .then((results) => {
            db.getVariables(address).then((res) => {
              let variableNames = []
              Promise.map(res.recordset, (elem) => {
                variableNames.push(elem)
              }, {concurrency: 5}).then(() => {
                return resolve({ variables: variableNames, contractName: contractName })
              })
            })
          })
        } else {
          let variableNames = []
          Promise.map(res.recordset, (elem) => {
            variableNames.push(elem)
          }, {concurrency: 5}).then(() => {
            return resolve({ variables: variableNames, contractName: contractName })
          })
        }
      })
    })
  }

  // Query value of variable at certain block
  parity.queryAtBlock = function (query, block) {
    let hex = '0x' + block.toString(16)
    web3.eth.defaultBlock = hex
    return new Promise((resolve, reject) => {
      return query((err, result) => {
        return (err ? reject(err) : resolve(parseInt(result.valueOf())))
      })
    })
  }

  parity.calculateBlockTime = function (blockNumber) {
    return new Promise((resolve) => {
      let time = web3.eth.getBlock(blockNumber).timestamp
      return resolve(time)
    })
  }

  parity.getBlockTime = function (blockNumber) {
    return new Promise((resolve) => {
      db.getBlockTime(blockNumber)
        .then((result) => {
          // Check the database for the blockTimeMapping
          if (result.recordset.length !== 0) {
            return resolve(result.recordset[0].timeStamp)
          }
          // If it isn't in the database, we need to calculate it
          // acquire a lock so that we don't calculate this value twice
          // Using a global lock to protect the creation of locks...
          lock.writeLock(blockNumber, (release) => {
            // Check again if it is in the db, since it may have been
            // added whilst we were waiting for the lock
            db.getBlockTime(blockNumber)
              .then((result) => {
                if (result.recordset.length !== 0) {
                  release()
                  return resolve(result.recordset[0].timeStamp)
                }
                // If it still isn't in there, we calcuate it and add it
                parity.calculateBlockTime(blockNumber).then((time) => {
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

  parity.getHistory = function (address, method, startBlock, endBlock) {
    let filter = web3.eth.filter({fromBlock: startBlock, toBlock: endBlock, address: address})
    return new Promise((resolve, reject) => {
      filter.get((error, result) => {
        if (!error) {
          return resolve(result)
        } else {
          return reject(error)
        }
      })
    })
  }

  parity.generateDataPoints = function (eventsA, contract, method,
    totalFrom, totalTo) {
    return new Promise((resolve, reject) => {
      // log.debug('Generating data points')
      Promise.map(eventsA, (event) => {
        // [(time, value, blockNum)]
        return Promise.all([parity.getBlockTime(event.blockNumber.valueOf()),
          parity.queryAtBlock(contract[method], event.blockNumber.valueOf()), event.blockNumber.valueOf()])
      }, {concurrency: 5})
      // Sort the events by time
      .then((events) => {
        return (events.sort((a, b) => {
          return a[0] - b[0]
        }))
      })
      .then((events) => {
        let prevBlock = 0
        let results = []
        events.forEach((elem, index) => {
          if (elem[2] !== prevBlock) {
            prevBlock = elem[2]
            results.push(elem)
          }
        })
        return results
      })
      .then((events) => {
        return db.addDataPoints(contract.address.substr(2), method, events, totalFrom, totalTo)
          .then(() => {
            if (events.length > 0) {
              log.debug('Added ' + events.length + ' data points for ' + contract.address + ' ' + method)
            }
            return resolve(events)
          })
      })
      .catch((err) => {
        log.error('Data set generation error: ' + err)
        return reject(err)
      })
    })
  }

  return parity
}
