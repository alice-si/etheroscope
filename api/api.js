module.exports = function (app, db, io, log) {
  var Parity = require('./parity')(log)
  let Promise = require('bluebird')
  var methodCachesInProgress = new Set()

  app.get('/api/explore/:contractAddress', (req, res) => {
    return Parity.getContract(req.params.contractAddress)
      .then((contract) => {
        return Parity.getContractVariables(contract)
      })
      .then((variables) => {
        console.log('vars: ' + JSON.stringify(variables))
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

  function sendDataPointsFromParity (socket, contractAddress, method, from, to,
    totalFrom, totalTo) {
    console.log('Sending history from parity')
    // First we obtain the contract.
    let contract = null
    return new Promise((resolve, reject) => {
      Parity.getContract(contractAddress)
        // Then, we get the history of transactions
        .then(function (parsedContract) {
          contract = parsedContract
          console.log('Parsed Contract')
          return Parity.getHistory(contractAddress, method, from, to, totalFrom, totalTo)
        })
        .then(function (events) {
          console.log('Obtained Transaction History')
          return Parity.generateDataPoints(events, contract, method, from, to,
            totalFrom, totalTo)
        })
        .then(function (results) {
          console.log('generated data points successfully')
          socket.emit('getHistoryResponse', { error: false, contract: contractAddress, method: method, from: from, to: to, results: results })
          return resolve()
        })
        .catch(function (err) {
          console.log('Error in parity sending')
          console.log(err)
          socket.emit('getHistoryResponse', { error: true })
          return reject(err)
        })
    })
  }

  function sendAllDataPointsFromDB (socket, address, method) {
    console.log('Sending history from db')
    db.getDataPoints(address.substr(2), method)
      .then((dataPoints) => {
        return Promise.map(dataPoints[0], (elem) => {
          return [elem.timeStamp, elem.value]
        })
      })
      .then((dataPoints) => {
        console.dir(dataPoints)
        socket.emit('getHistoryResponse', { error: false, contract: address, method: method, results: dataPoints })
      })
      .catch(function (err) {
        console.log('Error sending datapoints from DD')
        console.log(err)
        socket.emit('getHistoryResponse', { error: true })
      })
  }

  io.on('connection', function (socket) {
    socket.on('getHistory', ([address, method]) => {
      sendHistory(socket, address, method)
    })
  })

  io.on('disconnect', function (socket) {
    console.log('User has disconnected')
  })

  function sendHistory (socket, address, method) {
    // Send every point we have in the db so far
    sendAllDataPointsFromDB(socket, address, method)

    // If there is already a caching process, we don't need to set one up
    if (methodCachesInProgress.has(address + method)) {
      return
    }
    methodCachesInProgress.add(address + method)

    db.getCachedFromTo(address.substring(2), method)
    .then((result) => {
      console.log('Result is:', result)
      Parity.getLatestBlock()
      .then((latestBlock) => {
        console.log('Result is', result)
        let from = result.cachedFrom
        let to = result.cachedUpTo
        if (result.cachedFrom === null || result.cachedUpTo === null) {
          from = latestBlock
          to = latestBlock
        }
        cacheMorePoints(socket, address, method, from, to, latestBlock)
      })
    })
    .catch((err) => {
      console.log('Error caching more points:', err)
    })
  }

  // from, to and latestBlock are exclusive
  function cacheMorePoints (socket, address, method, from, to, latestBlock) {
    const chunkSize = 1000
    if (to === latestBlock) {
      if (from === 1) {
        methodCachesInProgress.delete(address + method)
        return
      }
      let newFrom = Math.max(from - chunkSize, 1)
      sendDataPointsFromParity(socket, address, method, newFrom, from - 1, newFrom, to)
      .then(() => {
        cacheMorePoints(socket, address, method, newFrom, to, latestBlock)
      })
    } else {
      let newTo = Math.min(to + chunkSize, latestBlock)
      sendDataPointsFromParity(socket, address, method, to + 1, newTo, from, newTo)
      .then(() => {
        cacheMorePoints(socket, address, method, from, newTo, latestBlock)
      })
    }
  }
}
