module.exports = function (app, db, io, log, validator) {
  var parity = require('./parity')(db, log, validator)
  let Promise = require('bluebird')
  var methodCachesInProgress = new Set()

  function validAddress (address) {
    return address.length === 42 && validator.isHexadecimal(address.substr(2)) && address.substr(0, 2) === '0x'
  }

  app.get('/api/popular/', (req, res) => {
    db.getPopularContracts('week', 1, 10)
      .then((result) => {
        return res.status(200).json(result)
      })
      .catch((err) => {
        return res.status(400).json(err)
      })
  })

  app.get('/api/explore/:contractAddress', (req, res) => {
    let address = req.params.contractAddress
    if (!validAddress(address)) {
      log.debug('User requested something stupid')
      let err = 'Error - invalid contract hash'
      return res.status(400).json(err)
    }

    db.addContractLookup(address.substr(2))

    return parity.getContract(address)
      .then((contractInfo) => {
        return parity.getContractVariables(contractInfo)
      })
      .then((contractInfo) => {
        return res.status(200).json(contractInfo)
      })
      .catch((err) => {
        log.error(err)
        return res.status(400).json(err.message)
      })
  })

  app.get('/api/search/', (req, res) => {
    return res.status(200).json([])
  })

  app.get('/api/search/:string', (req, res) => {
    let searchStr = req.params.string
    if (searchStr[0] === '0' && (searchStr[1] === 'x' || searchStr[1] === 'X')) {
      db.searchContractHash(searchStr.substr(2)).then((results) => {
        return res.status(200).json(results)
      })
    } else {
      console.log(searchStr)
      db.searchContractName(searchStr).then((results) => {
        return res.status(200).json(results)
      })
    }
  })

  function sendDataPointsFromParity (contractInfo, contractAddress, method, from, to,
    totalFrom, totalTo) {
    // log.debug('Sending history from parity')
    // First we obtain the contract.
    let contract = contractInfo.parsedContract
    return new Promise((resolve, reject) => {
      parity.getHistory(contractAddress, method, from, to, totalFrom, totalTo)
      .then(function (events) {
        return parity.generateDataPoints(events, contract, method, from, to,
          totalFrom, totalTo)
      })
      .then(function (results) {
        io.sockets.in(contractAddress + method).emit('getHistoryResponse', { error: false, from: from, to: to, results: results })
        return resolve()
      })
      .catch(function (err) {
        log.error('Error in parity sending' + err)
        io.sockets.in(contractAddress + method).emit('getHistoryResponse', { error: true })
        return reject(err)
      })
    })
  }

  function sendAllDataPointsFromDB (address, method, from, to, socket) {
    db.getDataPoints(address.substr(2), method)
    .then((dataPoints) => {
      return Promise.map(dataPoints[0], (elem) => {
        return [elem.timeStamp, elem.value]
      })
    })
    .then((dataPoints) => {
      console.dir(dataPoints)
      socket.emit('getHistoryResponse', { error: false, from: from, to: to, results: dataPoints })
    })
    .catch(function (err) {
      log.error('Error sending datapoints from DD')
      log.error(err)
      socket.emit('getHistoryResponse', { error: true })
    })
  }

  io.on('connection', function (socket) {
    socket.on('getHistory', ([address, method]) => {
      let room = address + method
      socket.join(room)
      log.debug('Joined room:', room)
      sendHistory(address, method, socket)
    })
    socket.on('unsubscribe', ([address, method]) => {
      if (address !== null && method !== null) {
        log.debug('Unsubbing')
        socket.leave(address + method, (err) => {
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

  function sendHistory (address, method, socket) {
    /* Ignore invalid requests on the socket - the frontend should
     * ensure these are not send, so any invalid addresses
     * will not have been sent from our front end */
    if (!validAddress(address)) {
      return
    }

    db.getCachedFromTo(address.substring(2), method)
      .then((result) => {
        parity.getLatestBlock()
          .then((latestBlock) => {
            io.sockets.in(address + method).emit('latestBlock', { latestBlock: latestBlock })
            let from = result.cachedFrom
            let to = result.cachedUpTo
            if (from === null || to === null) {
              from = latestBlock
              to = latestBlock
            }
            // Send every point we have in the db so far
            sendAllDataPointsFromDB(address, method, parseInt(from), parseInt(to), socket)
            // If there is already a caching process, we don't need to set one up
            if (methodCachesInProgress.has(address + method)) {
              return
            }
            methodCachesInProgress.add(address + method)
            log.debug('api.js: calling cacheMorePoints: from:', from, 'to:', to, 'latestBlock:', latestBlock)
            parity.getContract(address)
            .then((contractInfo) => {
              cacheMorePoints(contractInfo, address, method, parseInt(from), parseInt(to), parseInt(latestBlock))
            })
          })
      })
      .catch((err) => {
        log.error('Error caching more points:', err)
      })
  }

  // from, to and latestBlock are inclusive
  // pre: from, to, latestBlock are numbers, not strings
  function cacheMorePoints (contractInfo, address, method, from, to, latestBlock) {
    const chunkSize = 1000
    if (to === latestBlock) {
      if (from === 1) {
        log.info('Cached all points for ' + address + ' ' + method)
        methodCachesInProgress.delete(address + method)
        return
      }
      let newFrom = Math.max(from - chunkSize, 1)
      sendDataPointsFromParity(contractInfo, address, method, newFrom, from - 1, newFrom, to)
      .then(() => {
        cacheMorePoints(contractInfo, address, method, newFrom, to, latestBlock)
      })
    } else {
      let newTo = Math.min(to + chunkSize, latestBlock)
      sendDataPointsFromParity(contractInfo, address, method, to + 1, newTo, from, newTo)
      .then(() => {
        cacheMorePoints(contractInfo, address, method, from, newTo, latestBlock)
      })
    }
  }
}
