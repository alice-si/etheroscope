var Parity = require('./parity')
require('bluebird')

module.exports = function (app, db, io) {
  app.get('/api/explore/:contractAddress', (req, res) => {
    return Parity.getContract(req.params.contractAddress)
      .then((contract) => {
        return Parity.getContractVariables(contract)
      })
      .then((variables) => {
        console.log('vars??????: ' + JSON.stringify(variables))
        return res.status(200).json(variables)
      })
      .catch((err) => {
        console.log(err)
        return res.status(400).json(err.message)
      })
  })

  app.get('/api/getHistory/:contractAddress/:method', (req, res) => {
    const contractAddress = req.params.contractAddress
    const method = req.params.method
    let contract = null
    res.setTimeout(300000, () => {
      // TODO: Solve this computational problem
      console.log('Response timeout.')
    })
    // First we obtain the contract.
    return Parity.getContract(contractAddress)
    // Then, we get the history of transactions
      .then((parsedContract) => {
        contract = parsedContract
        console.log('Parsed Contract')
        return Parity.getHistory(contractAddress, 1240000, 1245000)
      })
      .then((events) => {
        console.log('Obtained Transaction History')
        return Parity.generateDataPoints(events, contract, method)
      })
      .then((results) => {
        console.log('generated data points: ' + results)
        res.status(200).json(results)
      })
      .catch((err) => {
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
        socket.emit('getHistoryResponse', { error: false, from: from, to: to, results: results })
      })
      .catch(function (err) {
        console.log('Error in parity sending')
        console.log(err)
        socket.emit('getHistoryResponse', { error: true })
      })
  }

  function sendDataPointsFromDB (socket, address, start, end) {
    const resultSize = 10000
    /* Request the results from the database in blocks of 10000, and send them on to the user */
    for (var i = start; i < end; i += resultSize) {
      let to = i + resultSize - 1
      if (to > end) {
        to = end
      }
      db.getDataPointsInRange(address, i, to).then((dataPoints) => {
        socket.emit('getHistoryResponse', { error: false, from: i, to: to, results: dataPoints })
      })
      .catch(function (err) {
        console.log('Error sending datapoints from DD')
        console.log(err)
        socket.emit('getHistoryResponse', { error: true })
      })
    }
  }

  io.on('connection', function (socket) {
    socket.on('getHistory', (address, method, from, to) => {
      sendHistory(socket, address, method, from, to)
    })
  })

  io.on('disconnect', function (socket) {
    console.log('User has disconnected')
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
          console.log('Sending data from parity')
          sendDataPointsFromParity(socket, address, method, parityStart, to)
        }

        // have the db send all cached points
        if (useDB) {
          console.log('Sending data from db')
          sendDataPointsFromDB(socket, address, method, dbStart, dbEnd)
        }
      })
  }
}
