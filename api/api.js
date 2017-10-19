var axios = require('axios')
var Promise = require('bluebird')
// var Level = require('level')
var Web3 = require('web3')
var web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))

// Testing with Alice.
let Alice = '0xBd897c8885b40d014Fb7941B3043B21adcC9ca1C'
// let testAddress = '0x1e143b2588705dfea63a17f2032ca123df995ce0'
let testAddress = '0xF0160428a8552AC9bB7E050D90eEADE4DDD52843'

// Using etherscan to obtain ABI information
let getContract = function (address) {
  return new Promise(function (resolve, reject) {
    return axios.get('https://api.etherscan.io/api?module=contract&action=getabi&address=' + address + '&apikey=KEKY5TS8G2WH712WG3SY5HWDHD2HNIUPJD')
      .then(function (response) {
        var desc = response.data.result
        return resolve(parseContract(desc, address))
      }).catch(function (err) {
        return reject(err)
      })
  })
}

// JSON parsing
let parseContract = function (desc, address) {
  var contractABI = JSON.parse(desc)
  var Contract = web3.eth.contract(contractABI)
  return Contract.at(address)
}

// Obtain relevant smart contract public variables
let getMethods = function (contract) {
  var abi = contract.abi
  let methods = []
  abi.forEach(function (item) {
    if (item.outputs && item.outputs.length === 1 && item.outputs[0].type.indexOf('uint') === 0) {
      if (item.inputs.length === 0) {
        methods.push(item.name)
      }
    }
  })
  return methods
}

let getHistory = function (address) {
  // let startTime = new Date().getTime()
  let startBlock = 1230000
  let endBlock = 1500000
  var filter = web3.eth.filter({fromBlock: startBlock, toBlock: endBlock, address: address})
  return new Promise(function (resolve, reject) {
    filter.get(function (error, result) {
      if (!error) {
        console.log('[I] Fetched all transactions sent or sent to ' + address)
        resolve(result)
      } else {
        reject(error)
      }
    })
  })
}

let getBlockTime = function (blockNumber) {
  let approx = Math.round(blockNumber / 1000) * 1000
  return new Promise(function (resolve) {
    // Pull from db else
    let time = web3.eth.getBlock(approx).timestamp * 1000
    // Put into db
    return resolve(time)
  })
}

let queryAtBlock = function (query, block) {
  var hex = '0x' + block.toString(16)
  web3.eth.defaultBlock = hex
  return new Promise(function (resolve, reject) {
    return query(function (err, result) {
      if (err) {
        return reject(err)
      }
      return resolve(parseInt(result.valueOf()))
    })
  })
}

let getHistoryHTTPS = function (contractAddress, method) {
  // To search the DB
  // let key = contractAddress + '/' + method
  return getContract(contractAddress).then(function (contract) {
    return getHistory(contractAddress).then(function (events) {
      var history = []
      var i = 0
      var prevTime = 0
      Promise.map(events, function (event) {
        return new Promise(function (resolve) {
          getBlockTime(event.blockNumber.valueOf()).then(function (time) {
            if (time === prevTime) return resolve()
            prevTime = time
            queryAtBlock(contract[method], event.blockNumber.valueOf()).then(function (val) {
              history.push([time, val])
              console.log('Fetched: ' + i + ' time: ' + time + ' val: ' + val)
              i++
              return resolve(val)
            })
          })
        })
      }, {concurrency: 20}).then(function () {
        history.sort(function (a, b) {
          return a[0] - b[0]
        })
        // console.log(history)
        // historyCache.put(key, JSON.stringify(history))
        // return res.status(200).json(history)
      })
    })
  })
}

getHistory(Alice).then(function (val) {
  console.log('done with val: ' + val)
})
