const axios = require('axios')
const Web3 = require('web3')
const Promise = require('bluebird')
// const db = require('./db')

// const parityUrl = 'http://localhost:8545'
const parityUrl = 'http://localhost:8545'
const web3 = new Web3(new Web3.providers.HttpProvider(parityUrl))
const inDB = false

const Parity = {
  getContract: function (address) {
    return new Promise(function (resolve, reject) {
      if (inDB) {
        // withdraw and retrieve
        // return the parsedContract
      } else {
        // TODO: Queuing System for Etherscan API
        // console.log('pre etherscan')
        const axiosGET = 'https://api.etherscan.io/api?module=contract&action=getabi&address=' // Get ABI
        const axiosAPI = '&apikey=RVDWXC49N3E3RHS6BX77Y24F6DFA8YTK23'
        // const axiosAPI = '&apikey=KEKY5TS8G2WH712WG3SY5HWDHD2HNIUPJD'
        return axios.get(axiosGET + address + axiosAPI)
          .then(function (res) {
            const parsedContract = Parity.parseContract(res.data.result, address)
            // TODO: add in parsed contract field in the contracts table
            // db.addContracts([address, null], () => {})
            return resolve(parsedContract)
          })
          .catch(function (err) {
            console.log('Etherscan.io API error: ' + err)
            return reject(err)
          })
      }
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
    var approx = Math.round(blockNumber / 1000) * 1000
    return new Promise(function (resolve) {
      var time = web3.eth.getBlock(approx).timestamp * 1000
      // cache into db
      return resolve(time)
    })
  },

  getHistory: function (address) {
    let startBlock = 1230000
    let endBlock = 1250000
    let filter = web3.eth.filter({fromBlock: startBlock, toBlock: endBlock, address: address})
    return new Promise(function (resolve, reject) {
      filter.get(function (error, result) {
        if (!error) {
          console.log('[I] Fetched all transactions of sent or sent to ' + address + 'of size ' + result.length)
          return resolve(result)
        } else {
          reject(error)
        }
      })
    })
  },
  generateDataPoints: function (events, contract, method, res) {
    let history = []
    let prevTime = 0
    Promise.map(events, function (event, index, length) {
      console.log('booboo')
      return new Promise(function (resolve) {
        Parity.getBlockTime(event.blockNumber.valueOf()).then(function (time) {
          if (time === prevTime) return resolve()
          prevTime = time
          Parity.queryAtBlock(contract[method], event.blockNumber.valueOf()).then(function (val) {
            // db.addDataPoints([contract.address, index, event.blockNumber.valueof(), val],
            //   () => {})
            console.log('Pushed T-V pair: ' + time + ', ' + val)
            history.push([time, val])
            console.log('pushed')
            return resolve(val)
          })
        })
      })
    }, {concurrency: 20})
      .then(function () {
        history.sort(function (a, b) {
          return a[0] - b[0]
        })
        return res.status(200).json(history)
      })
  }
}

module.exports = Parity
