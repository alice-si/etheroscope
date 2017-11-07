module.exports = function (app, db, io, log) {
  var parity = require('./parity')(log)
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

  app.get('/api/getHistory/:contractAddress/:method', (req, res) => {
    const contractAddress = req.params.contractAddress
    const method = req.params.method
    let contract = null
    res.setTimeout(300000, () => {
      // TODO: Solve this computational problem
      log.warn('Response timeout.')
    })
    // First we obtain the contract.
    return parity.getContract(contractAddress)
    // Then, we get the history of transactions
      .then((parsedContract) => {
        contract = parsedContract
        log.trace('Parsed Contract')
        return parity.getHistory(contractAddress, 1240000, 1245000)
      })
      .then((events) => {
        log.trace('Obtained Transaction History')
        return parity.generateDataPoints(events, contract, method)
      })
      .then((results) => {
        log.trace('Generated data points: ' + results)
        res.status(200).json(results)
      })
      .catch((err) => {
        log.error('Error getting contract from parity.js' + err)
        return res.status(400).json(err.message)
      })
  })

  function sendDataPointsFromParity (contractAddress, method, from, to,
    totalFrom, totalTo) {
    log.trace('Sending history from parity')
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
    socket.on('getHistory', ([address, method, prevAddress, prevMethod]) => {
      console.log('sub ' + address + method)
      if (prevAddress !== null) {
        socket.leave(prevAddress + prevMethod, (err) => {
          if (err) {
            log.error('Error leaving socket: ' + err)
          }
          socket.join(address + method)
          sendHistory(address, method)
        })
      } else {
        socket.join(address + method)
        sendHistory(address, method)
      }
    })
    // socket.on('unsubscribe', ([address, method]) => {
    //   log.debug("unsub " + address+method)
    //   socket.leave(address+method)
    // })
  })

  io.on('disconnect', function (socket) {
    log.trace('User has disconnected')
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
