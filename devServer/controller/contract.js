// var Fs = require('fs')
var Parity = require('../service/parity')
require('bluebird')
// var Level = require('level')

// var historyCache = Level('./db/history')

module.exports = function (app) {
  app.get('/api/explore/:contractAddress', function (req, res) {
    return Parity.getContract(req.params.contractAddress)
      .then(function (contract) {
        return res.status(200).json(contract)
      }).catch(function (err) {
        console.log(err)
        return res.status(400).json(err.message)
      })
  })

  app.get('/api/getHistory/:contractAddress/:method', function (req, res) {
    const contractAddress = req.params.contractAddress
    let contract = null
    // First we obtain the contract.
    return Parity.getContract(req.params.contractAddress)
      // Then, we get the history of transactions
      .then(function (parsedContract) {
        contract = parsedContract
        return Parity.getHistory(contractAddress)
      })
      .then(function (events) {
        return Parity.generateDataPoints(events, contract, req.params.method, res)
      })
      .catch(function (err) {
        console.log(err)
        return res.status(400).json(err.message)
      })
  })
}
