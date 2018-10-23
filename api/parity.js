const axios = require('axios')
const Web3 = require('web3')
var Promise = require('bluebird')
var ReadWriteLock = require('rwlock')
var lock = new ReadWriteLock()

const parityUrl = 'http://localhost:8545'
const web3 = new Web3(new Web3.providers.HttpProvider(parityUrl))

var StateDB = require('eth-storage/ethStorage/layers/highLevel.js')
var dbPath = 'C:/Users/ja1/Alice/dirforfullrinkeby/geth/chaindata'  // database path

module.exports = function (db, log, validator, withStateDB = false) {
  const parity = {}

  if (withStateDB) {
    var stateDB = new StateDB(dbPath, true)
    console.log('stateDB', stateDB)
  }

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
            // const axiosGET = 'https://api.etherscan.io/api?module=contract&action=getabi&address=' // Get ABI
            //TODO: choose axiosGET between ethereum and rinkeby
            const axiosGET = 'https://api-rinkeby.etherscan.io/api?module=contract&action=getabi&address=' // Get ABI
            const axiosAPI = '&apikey=RVDWXC49N3E3RHS6BX77Y24F6DFA8YTK23'
            console.log('address', address)
            return axios.get(axiosGET + address + axiosAPI)
              .then((res) => {
                let parsedContract = parity.parseContract(res.data.result, address)
                // Add the contract to the database, assuming it is already in there (with a name)
                console.log('will updateContractWithABI')
                db.updateContractWithABI(address.substr(2), res.data.result)
                  .catch((err) => {
                    log.error('parity.js: Error adding contract abi to the db')
                    log.error(err)
                  })
                return resolve({parsedContract: parsedContract, contractName: result.contractName})
              })
              .catch((err) => {
                log.error('parity.js: Etherscan.io API error: ' + err)
                return reject(err)
              })
          }
          console.log('parity.getContract:result',result)
          let parsedContract = parity.parseContract(result.contract, address)
          return resolve({contractName: result.contractName, parsedContract: parsedContract})
        })
    })
  }

  // Obtaining Contract information from ABI and address
  parity.parseContract = function (desc, address) {
    // console.log('desc', desc)
    var contractABI = desc
    try {
      //TODO: type of
      console.log('parity.parseContract:typeofdesc',typeof desc)
      if (typeof desc === "string")
      {
        contractABI = JSON.parse(desc)
      }
    }catch(err) {
      console.log("error in JSON parse")
      console.log(err)
      console.log('tried to parse:\n',desc)
    }
    var Contract = web3.eth.contract(contractABI)
    return Contract.at(address)
  }

  parity.getContractVariables = function (contractInfo) {
    let parsedContract = contractInfo.parsedContract
    let contractName = contractInfo.contractName
    return new Promise((resolve, reject) => {
      let address = parsedContract.address.substr(2)
      db.getVariables(address).then((res) => {
        console.log('res', res)
        if (res.length === 0) {
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
                console.log('parity:res', res)
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
    //TODO: method to index translation
    console.log('parity.getHistory:args(currently with no method):',startBlock,endBlock)
    return new Promise((resolve, reject) => {
      // console.log('stateDB2', stateDB)
      if (stateDB) {
        console.log('parity.getHistory:querylength', endBlock - startBlock)
        return stateDB.hashSet(address, 0, startBlock, endBlock, function returnResults (err, result) {
          if (err) return reject(err)
          else return resolve(result)
        })
      }
    })
  }

  parity.generateDataPoints = function (eventsA, contract, method,
                                        totalFrom, totalTo) {
    console.log('parity:generateDataPoints,eventsA', eventsA, 'contract adr:', contract.address.slice(0, 8),
      '... method', method, 'total from:', totalFrom, 'total to:', totalTo)
    return new Promise((resolve, reject) => {
      // log.debug('Generating data points')

      Promise.map(eventsA, (event) => {
        // [(time, value, blockNum)]
        var rawVal = event.val

        var val;
        if (Buffer.isBuffer(rawVal)) {
          var len = rawVal.length
          //TODO: reading itn proper?
          var startIdx = (len - 4 < 0) ? 0 : len - 4
          val = rawVal.readUIntBE(startIdx, len)
        }
        else{
          val = 0;
        }

        console.log('generateDataPoints:nonrawval',val)

        return Promise.all([parity.getBlockTime(event.block), val, event.block])
      }, {concurrency: 5})
    // * array of arrays of the form: [[time, 'value', blockNum]]
      .then((eventsA) => {return db.addDataPoints(contract.address.substr(2), method, eventsA, totalFrom, totalTo)})
      .then(() => {
        if (eventsA.length > 0) {
          log.debug('Added ' + eventsA.length + ' data points for ' + contract.address + ' ' + method)
        }
        return resolve(eventsA)
      })
      .catch((err) => {
        log.error('Data set generation error: ' + err)
        return reject(err)
      })
    })
  }

  return parity
}
