let axios = require('axios')
let headers = {
  'User-Agent': 'Super Agent/0.0.1',
  'Content-Type': 'application/x-www-form-urlencoded'
}

module.exports = function (app, db, io, log, validator) {
  let parity = require('./parity')(db, log, validator)
  let Promise = require('bluebird')
  let methodCachesInProgress = new Set()

  function validAddress (address) {
    return address.length === 42 && validator.isHexadecimal(address.substr(2)) && address.substr(0, 2) === '0x'
  }

  app.get('/api/inProgressMethods/delete/:address/:method', (req, res) => {
    if (req.socket.remoteAddress !== '::ffff:127.0.0.1') {
      return res.status(401).json('You do not have access to this.')
    } else {
      let address = req.params.address
      let method = req.params.method
      methodCachesInProgress.delete(address + method)
      return res.status(200).json('Deleting..')
    }
  })

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
      log.debug(searchStr)
      db.searchContractName(searchStr).then((results) => {
        return res.status(200).json(results)
      })
    }
  })

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
            from = parseInt(from)
            to = parseInt(to)
            latestBlock = parseInt(latestBlock)
            //cacheMorePoints(contractInfo, address, method, parseInt(from), parseInt(to), parseInt(latestBlock))
            axios.post('http://localhost:8081/cache', {
              address: address,
              method: method,
              from: parseInt(from),
              to: parseInt(to),
              latestBlock: parseInt(latestBlock)
            }) .then((response) => {
                log.debug("Starting microservice to cache points")
              }).catch((err) => {
                log.error("Microservice failed to start caching points for", contractInfo, address, method)
              })
          })
        .catch((err) => {
          log.error('Parity latest block err at api.js:', err)
        })
      })
      .catch((err) => {
        log.error('Error caching more points:', err)
      })
  }
}
