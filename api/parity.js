const axios = require('axios')
const Web3 = require('web3')
var Promise = require('bluebird')
const db = require('../db/db')

const parityUrl = 'http://localhost:8545'
const web3 = new Web3(new Web3.providers.HttpProvider(parityUrl))

const Parity = {
  getContract: function (address) {
    return new Promise((resolve, reject) => {
      db.getContractName(address.substr(2), (err, res) => {
        if (err) console.log('Error getting contract name from the db:\n' + err)
        // Caching new contract
        if (res.rowsAffected[0] === 0) {
          console.log('Caching new contract: ' + address)
          db.addContracts([[address.substr(2), null]], (err, res) => {
            if (err) console.log('Error adding contract name to the db')
          })
        }
        // TODO: Queuing System for Etherscan API
        const axiosGET = 'https://api.etherscan.io/api?module=contract&action=getabi&address=' // Get ABI
        const axiosAPI = '&apikey=RVDWXC49N3E3RHS6BX77Y24F6DFA8YTK23'
        return axios.get(axiosGET + address + axiosAPI)
          .then((res) => {
            let parsedContract = Parity.parseContract(res.data.result, address)
            return resolve(parsedContract)
          })
          .catch((err) => {
            console.log('Etherscan.io API error: ' + err)
            return reject(err)
          })
      })
    })
  },

  // Obtaining Contract information from ABI and address
  parseContract: function (desc, address) {
    var contractABI = JSON.parse(desc)
    var Contract = web3.eth.contract(contractABI)
    return Contract.at(address)
  },

  getContractVariables: function (parsedContract) {
    return new Promise((resolve, reject) => {
      let address = parsedContract.address
      db.getVariables(address, (err, res) => {
        if (err) console.log('variable retrieval error: ' + err)
        if (res.recordset.length === 0) {
          console.log('Caching variables for contract: ')
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
              return Promise.each(variableNames, (variableName) => {
                db.addVariable([[address.substr(2), variableName]], (err, res) => {
                  if (err) console.log('Error with caching variables: ' + err)
                })
              })
            })
            .then((results) => {
              return resolve(variableNames)
            })
        }
        return resolve(res)
      })
    })
  },

  // Query value of variable at certain block
  queryAtBlock: function (query, block) {
    let hex = '0x' + block.toString(16)
    web3.eth.defaultBlock = hex
    return new Promise((resolve, reject) => {
      return query((err, result) => {
        return (err ? reject(err) : resolve(parseInt(result.valueOf())))
      })
    })
  },

  calculateBlockTime: function (blockNumber) {
    return new Promise((resolve) => {
      let time = web3.eth.getBlock(blockNumber).timestamp
      return resolve(time)
    })
  },

  getBlockTime: function (blockNumber) {
    return new Promise((resolve) => {
      db.getBlockTime(blockNumber, (err, res) => {
        if (err) {
          console.log('Error getting the time of a block from db:\n' + err)
        }
        if (res.recordset.length !== 0) {
          return resolve(res.recordset[0].timeStamp)
        }
        return this.calculateBlockTime(blockNumber).then((time) => {
          console.log('Adding ' + blockNumber + ' with time ' + time)
          db.addBlockTime([[blockNumber, time, 1]], function (err, res) {
            if (err) {
              console.log('Error adding the time of a block to the db:\n' + err)
            }
          })
          return resolve(time)
        })
      })
    })
  },

  sendDataPointsInRange: function (address, start, end) {
    const resultSize = 10000
    /* Request the results from the database in blocks of 10000, and send them on to the user */
    for (var i = start; i < end; i += resultSize) {
      let to = i + resultSize - 1
      if (to > end) {
        to = end
      }
      db.getDataPointsInRange(address, i, to).then((dataPoints) => {
        /* Send the results to the user */
      })
    }
  },

  getHistory: function (address, startBlock, endBlock) {
    let filter = web3.eth.filter({fromBlock: startBlock, toBlock: endBlock, address: address})
    return new Promise((resolve, reject) => {
      filter.get((error, result) => {
        if (!error) {
          console.log('[I] Fetched all transactions of sent or sent to ' + address + 'of size ' + result.length)
          return resolve(result)
        } else {
          return reject(error)
        }
      })
    })
  },

  generateDataPoints: function (eventsA, contract, method) {
    let i = 0
    let prevTime = 0
    return new Promise((resolve, reject) => {
      db.getDataPoints(contract.address.substr(2), method, (err, res) => {
        if (err) console.log('Error getting datapoint from the db:\n' + err)
        if (res.recordset.length !== 0) {
          console.log('generateDataPoints: Cache hit: ' + contract.address)
          // TODO: verify this
          return Promise.map(res.recordset, (dataObj) => {
            return [dataObj.timeStamp, dataObj.value, dataObj.blockNumber]
          }).then((triplets) => {
            return resolve(triplets.sort((a, b) => {
              return a[0] - b[0]
            }))
          })
        } else {
          console.log('generateDataPoints: Cache miss.')
          Promise.map(eventsA, (event) => {
            console.log('mapping...: ' + i)
            i++
            // [(t,v,b)]
            return Promise.all([Parity.getBlockTime(event.blockNumber.valueOf()),
              Parity.queryAtBlock(contract[method], event.blockNumber.valueOf()), event.blockNumber.valueOf()])
          }, {concurrency: 20})
            .then((events) => {
              return Promise.filter(events, ([time, val, blockNum]) => {
                console.log('filtering...')
                if (time !== prevTime) {
                  prevTime = time
                  db.addDataPoints([[contract.address.substr(2), method, blockNum, val]],
                    (err, res) => {
                      if (err) console.log('Error adding datapoint to db:\n' + err)
                    })
                  return true
                } else {
                  return false
                }
              })
            })
            .then((events) => {
              resolve(events.sort((a, b) => {
                return a[0] - b[0]
              }))
            })
            .catch((err) => {
              console.log('Data set generation error: ' + err)
              return reject(err)
            })
        }
      })
    })
  }
}

module.exports = Parity
