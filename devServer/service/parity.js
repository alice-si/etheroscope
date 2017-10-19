const axios = require('axios')
const Web3 = require('web3')
const Promise = require('bluebird')

const parityUrl = 'http://localhost:8545'
const web3 = new Web3(new Web3.providers.HttpProvider(parityUrl))
const inDB = false

const Parity = function () {
  this.getContract = function (address) {
    return new Promise(function (resolve, reject) {
      if (inDB) {
        // withdraw and retrieve
        // return the parsedContract
      } else {
        // TODO: Queuing System for Etherscan API
        const axiosGET = 'https://api.etherscan.io/api?module=contract&action=getabi&address=' // Get ABI
        const axiosAPI = '&apikey=KEKY5TS8G2WH712WG3SY5HWDHD2HNIUPJD'
        return axios.get(axiosGET + address + axiosAPI)
          .then(function (res) {
            const parsedContract = this.parseContract(res.data.result, address)
            // TODO: Place parsedContract in database
            return resolve(parsedContract)
          })
          .catch(function (err) {
            console.log('Etherscan.io API error: ' + err)
            return reject(err)
          })
      }
    })
  }

  // Obtaining Contract information from ABI and address
  this.parseContract = function (desc, address) {
    var contractABI = JSON.parse(desc)
    var Contract = web3.eth.contract(contractABI)
    return Contract.at(address)
  }

  // Query value of variable at certain block
  this.queryAtBlock = function (query, block) {
    var hex = '0x' + block.toString(16)
    web3.eth.defaultBlock = hex
    return new Promise(function (resolve, reject) {
      return query(function (err, result) {
        return (err ? reject(err) : resolve(parseInt(result.valueOf())))
      })
    })
  }

  this.getBlockTime = function (blockNumber) {
    var approx = Math.round(blockNumber / 1000) * 1000
    return new Promise(function (resolve) {
      blockCache.get(approx, function (err, value) {
        if (err) {
          var time = web3.eth.getBlock(approx).timestamp * 1000
          blockCache.put(approx, time, function (err) {
            if (err) console.log(err)
          })
          return resolve(time)
        } else {
          return resolve(value)
        }
      })
    })
  }

  // TODO: delete if dependencies not affected
  // this.getMaxCachedBlock = function () {
  //   var max = 0
  //   return new Promise(function (resolve) {
  //     blockCache.createReadStream()
  //       .on('data', function (data) {
  //         if (parseInt(data.key) > max) max = parseInt(data.key)
  //       })
  //       .on('end', function () {
  //         return resolve(max)
  //       })
  //   })
  // }

  this.getHistory = function (address) {
    var startTime = new Date().getTime()
    var startBlock = web3.eth.blockNumber - 150000
    console.log('From block: ' + startBlock)
    return new Promise(function (resolve, reject) {
      web3.trace.filter({'fromBlock': '0x' + startBlock.toString(16), 'toAddress': [address]}, function (err, traces) {
        console.log('Fetched in : ' + (new Date().getTime() - startTime))
        console.log('Browsing through ' + traces.length + ' transactions')
        if (err) return reject(err)
        return resolve(traces)
      })
    })
  }

  this.generateDataPoints = function (events, contract, method, res) {
    // if not exist in db...
    let history = []
    let prevTime = 0
    Promise.map(events, function (event) {
      return new Promise(function (resolve) {
        this.getBlockTime(event.blockNumber.valueOf()).then(function (time) {
          if (time === prevTime) return resolve()
          prevTime = time
          this.queryAtBlock(contract[method], event.blockNumber.valueOf()).then(function (val) {
            history.push([time, val])
            return resolve(val)
          })
        })
      })
    }, {concurrency: 20}).then(function () {
      history.sort(function (a, b) {
        return a[0] - b[0]
      })
      return res.status(200).json(history)
    })
  }
}

module.exports = Parity
