// var Fs = require('fs')
var Parity = require('../service/parity')
require('bluebird')
// var Level = require('level')

// var historyCache = Level('./db/history')

module.exports = function (app) {
  app.get('/api/explore/:contractAddress', function (req, res) {
    return Parity.getContract(req.params.contractAddress)
      .then(function (contract) {
        // console.log('Here')
        return res.status(200).json(contract)
      }).catch(function (err) {
        console.log(err)
        return res.status(400).json(err.message)
      })
  })

  app.get('/api/getHistory/:contractAddress/:method', function (req, res) {
    const contractAddress = req.params.contractAddress
    const method = req.params.method
    let contract = null
    res.setTimeout(300000, function () {
      // TODO: Solve this computational problem
      console.log('Response timeout.')
    })
    // First we obtain the contract.
    return Parity.getContract(contractAddress)
    // Then, we get the history of transactions
      .then(function (parsedContract) {
        contract = parsedContract
        console.log('Parsed Contract')
        return Parity.getHistory(contractAddress)
      })
      .then(function (events) {
        console.log('Obtained Transaction History')
        return Parity.generateDataPoints(events, contract, method, res)
      })
      .then(function (results) {
        console.log('generated data points: ' + results)
        res.status(200).json(results)
      })
      .catch(function (err) {
        console.log(err)
        return res.status(400).json(err.message)
      })
  })
}
