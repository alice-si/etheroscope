const axios = require('axios')
const Web3 = require('web3')
var Promise = require('bluebird')
const db = require('./db')

const parityUrl = 'http://localhost:8545'
const web3 = new Web3(new Web3.providers.HttpProvider(parityUrl))
const inDB = false

const Parity = {
  getContract: function (address) {
    return new Promise(function (resolve, reject) {
      db.getContractName(address.substr(2), function (err, res) {
        if (err) {
          console.log('Error getting contract name from the db:\n' + err)
        }
        console.log(res)
        if (res.rowsAffected[0] !== 0) {
          console.log('cachedd name!!!')
          // TODO get the variable names for the hash and return that
        } else {
          console.log('not cached name!!!')
          db.addContracts([[address.substr(2), null]], function (err, res) {
            if (err) {
              console.log('Error adding contract name to the db')
            }
          })
        }
        // TODO: Queuing System for Etherscan API
        // console.log('pre etherscan')
        const axiosGET = 'https://api.etherscan.io/api?module=contract&action=getabi&address=' // Get ABI
        const axiosAPI = '&apikey=RVDWXC49N3E3RHS6BX77Y24F6DFA8YTK23'
        // const axiosAPI = '&apikey=KEKY5TS8G2WH712WG3SY5HWDHD2HNIUPJD'
        return axios.get(axiosGET + address + axiosAPI)
          .then(function (res) {
            const parsedContract = Parity.parseContract(res.data.result, address)
            // TODO: add in parsed contract field in the contracts table
            return resolve(parsedContract)
          })
          .catch(function (err) {
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

  // Query value of variable at certain block
  queryAtBlock: function (query, block) {
    var hex = '0x' + block.toString(16)
    web3.eth.defaultBlock = hex
    return new Promise(function (resolve, reject) {
      return query(function (err, result) {
        return (err ? reject(err) : resolve(parseInt(result.valueOf())))
      })
    })
  },

  getBlockTime: function (blockNumber) {
    return new Promise(function (resolve) {
      db.getBlockTime(blockNumber, function (err, res) {
        if (err) {
          console.log('Error getting the time of a block from db:\n' + err)
        }
        if (res.recordset.length !== 0) {
          return resolve(res.recordset[0].timeStamp)
        }
        var approx = Math.round(blockNumber / 1000) * 1000
        var time = web3.eth.getBlock(approx).timestamp * 1000
        console.log('Adding ' + blockNumber + ' with time ' + time)
        db.addBlockTime([[blockNumber, time]], function (err, res) {
          if (err) {
            console.log('Error adding the time of a block to the db:\n' + err)
          }
        })
        // cache into db
        return resolve(time)
      })
    })
  },

  getHistory: function (address) {
    let startBlock = 1240000
    let endBlock = 1245000
    let filter = web3.eth.filter({fromBlock: startBlock, toBlock: endBlock, address: address})
    return new Promise(function (resolve, reject) {
      filter.get(function (error, result) {
        if (!error) {
          console.log('[I] Fetched all transactions of sent or sent to ' + address + 'of size ' + result.length)
          return resolve(result)
        } else {
          return reject(error)
        }
      })
    })
  },
  generateDataPoints: function (eventsA, contract, method, res) {
    let i = 0
    let prevTime = 0
    return new Promise(function (resolve, reject) {
      db.getDataPoints(contract.address.substr(2), method, function (err, res) {
        if (err) console.log('Error getting datapoint from the db:\n' + err)
        if (res.recordset.length !== 0) {
          console.log('generateDataPoints: Cache hit: ' + contract.address)
          // TODO: verify this
          return Promise.map(res.recordset, (dataObj) => {
            return [dataObj.timeStamp, dataObj.value, dataObj.blockNumber]
          }).then((triplets) => {
            return resolve(triplets)
          })
        } else {
          console.log('generateDataPoints: Cache miss.')
          Promise.map(eventsA, function (event) {
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
            .then(function (events) {
              resolve(events)
            })
            .catch(function (err) {
              console.log('Data set generation error: ' + err)
              return reject(err)
            })
        }
      })
    })
  }
}
module.exports = Parity
