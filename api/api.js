module.exports = function (app, db, io, log) {
  var parity = require('./parity')(db, log)
  let Promise = require('bluebird')
  var methodCachesInProgress = new Set()

  app.get('/api/explore/:contractAddress', (req, res) => {
    return parity.getContract(req.params.contractAddress)
      .then((contract) => {
        return parity.getContractVariables(contract)
      })
      .then((variables) => {
        log.debug('vars: ' + JSON.stringify(variables))
        return res.status(200).json(variables)
      })
      .catch((err) => {
        log.error(err)
        return res.status(400).json(err.message)
      })
  })

  function sendDataPointsFromParity (contractAddress, method, from, to,
    totalFrom, totalTo) {
    log.debug('Sending history from parity')
    // First we obtain the contract.
    let contract = null
    return new Promise((resolve, reject) => {
      parity.getContract(contractAddress)
        // Then, we get the history of transactions
      .then(function (parsedContract) {
        contract = parsedContract
        return parity.getHistory(contractAddress, method, from, to, totalFrom, totalTo)
      })
      .then(function (events) {
        return parity.generateDataPoints(events, contract, method, from, to,
          totalFrom, totalTo)
      })
      .then(function (results) {
        io.sockets.in(contractAddress + method).emit('getHistoryResponse', { error: false, contract: contractAddress, method: method, from: from, to: to, results: results })
        return resolve()
      })
      .catch(function (err) {
        log.error('Error in parity sending' + err)
        io.sockets.in(contractAddress + method).emit('getHistoryResponse', { error: true })
        return reject(err)
      })
    })
  }

  function sendAllDataPointsFromDB (address, method) {
    db.getDataPoints(address.substr(2), method)
    .then((dataPoints) => {
      return Promise.map(dataPoints[0], (elem) => {
        return [elem.timeStamp, elem.value]
      })
    })
    .then((dataPoints) => {
      console.dir(dataPoints)
      io.sockets.in(address + method).emit('getHistoryResponse', { error: false, contract: address, method: method, results: dataPoints })
    })
    .catch(function (err) {
      log.error('Error sending datapoints from DD')
      log.error(err)
      io.sockets.in(address + method).emit('getHistoryResponse', { error: true })
    })
  }

  io.on('connection', function (socket) {
    socket.on('getHistory', ([address, method]) => {
      let room = address + method
      socket.join(room)
      log.debug('Joined room:', room)
      sendHistory(address, method)
    })
    socket.on('unsubscribe', ([address, method]) => {
      if (address !== null && method !== null) {
        log.debug('Unsubbing')
        socket.leave(address+method, (err) => {
          log.debug('unsubbed!!')
          socket.emit('unsubscribed', { error: err })
        })
      } else {
        socket.emit('unsubscribed', { error: null })
      }
    })
  })

  io.on('disconnect', function (socket) {
  })

  function sendHistory (address, method) {
    // Send every point we have in the db so far
    sendAllDataPointsFromDB(address, method)

    // If there is already a caching process, we don't need to set one up
    if (methodCachesInProgress.has(address + method)) {
      return
    }
    methodCachesInProgress.add(address + method)

    db.getCachedFromTo(address.substring(2), method)
    .then((result) => {
      log.debug('Result is:', result)
      parity.getLatestBlock()
      .then((latestBlock) => {
        log.debug('Result is', result)
        let from = result.cachedFrom
        let to = result.cachedUpTo
        if (result.cachedFrom === null || result.cachedUpTo === null) {
          from = latestBlock
          to = latestBlock
        }
        cacheMorePoints(address, method, from, to, latestBlock)
      })
    })
    .catch((err) => {
      log.error('Error caching more points:', err)
    })
  }

  // from, to and latestBlock are exclusive
  function cacheMorePoints (address, method, from, to, latestBlock) {
    const chunkSize = 1000
    if (to === latestBlock) {
      if (from === 1) {
        methodCachesInProgress.delete(address + method)
        return
      }
      let newFrom = Math.max(from - chunkSize, 1)
      sendDataPointsFromParity(address, method, newFrom, from - 1, newFrom, to)
      .then(() => {
        cacheMorePoints(address, method, newFrom, to, latestBlock)
      })
    } else {
      let newTo = Math.min(to + chunkSize, latestBlock)
      sendDataPointsFromParity(address, method, to + 1, newTo, from, newTo)
      .then(() => {
        cacheMorePoints(address, method, from, newTo, latestBlock)
      })
    }
  }
}
