var Parity = require('./parity')
require('bluebird')

module.exports = function (app, db, io) {
  app.get('/api/explore/:contractAddress', function (req, res) {
    return Parity.getContract(req.params.contractAddress)
      .then(function (contract) {
        return Parity.getContractVariables(contract)
      })
      .then(function (variables) {
        console.log('vars??????: ' + JSON.stringify(variables))
        return res.status(200).json(variables)
      })
      .catch(function (err) {
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
        return Parity.getHistory(contractAddress, 1240000, 1245000)
      })
      .then(function (events) {
        console.log('Obtained Transaction History')
        return Parity.generateDataPoints(events, contract, method)
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

  function sendDataPointsFromParity (socket, contractAddress, method, from, to) {
    // First we obtain the contract.
    let contract = null
    Parity.getContract(contractAddress)
    // Then, we get the history of transactions
      .then(function (parsedContract) {
        contract = parsedContract
        console.log('Parsed Contract')
        return Parity.getHistory(contractAddress, from, to)
      })
      .then(function (events) {
        console.log('Obtained Transaction History')
        return Parity.generateDataPoints(events, contract, method)
      })
      .then(function (results) {
        console.log('generated data points: ' + results)
        socket.emit('getHistoryResponse', { error: false, results: results })
      })
      .catch(function (err) {
        console.log(err)
        socket.emit('getHistoryResponse', { error: true })
      })
  }

  function sendDataPointsFromDB (user, address, start, end) {
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
  }

  io.on('connection', function (socket) {
    socket.on('getHistory', (address, method, from, to) => {
      sendHistory(socket, address, method, from, to)
    })
  })

  function sendHistory (socket, address, method, from, to) {
    return db.getCachedUpToBlock(address)
      .then((cachedUpToBlock) => {
        let dbStart
        let dbEnd
        let parityStart
        let useDB = true
        let useParity = true

        // if from is less than cached block, start db search from here
        if (from < cachedUpToBlock) {
          dbStart = cachedUpToBlock
        } else {
          useDB = false
        }

        // if to is less than cached block, end db search there
        if (to < cachedUpToBlock) {
          dbEnd = to
          useParity = false
        } else {
          dbEnd = cachedUpToBlock - 1
          parityStart = cachedUpToBlock
        }

        // have parity handle any points not in the db
        if (useParity) {
          sendDataPointsFromParity(socket, address, method, parityStart, to)
        }

        // have the db send all cached points
        if (useDB) {
          sendDataPointsFromDB(socket, address, method, dbStart, dbEnd)
        }
      })
  }
}
