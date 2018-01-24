var ReadWriteLock = require('rwlock')
var lock = new ReadWriteLock()
let methodCachesInProgress = new Set()
var Promise = require('bluebird')

let log = require('loglevel')
let validator = require('validator')
let db = require('./../db/db.js')(log)

// Socket IO server setup
let express = require('express')
let app = express()
let server = require('http').createServer(app)
let io = require('socket.io')(server)
let socketPort = 8081

let firstBlock = 0

db.poolConnect().then(() => {
  server.listen(socketPort)
  // Initialise the server
  let parity = require('../api/parity')(db, log, validator)

  function validAddress (address) {
    return address.length === 42 && validator.isHexadecimal(address.substr(2)) && address.substr(0, 2) === '0x'
  }

  log.info('services/index.js: Micro-service started at', socketPort)

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

  function sendAllDataPointsFromDB (address, method, from, to, socket) {
    db.getDataPoints(address, method)
      // Hack to get the points in the right format for frontend
      .then((dataPoints) => {
        return Promise.map(dataPoints, (elem) => {
          return [elem.timeStamp, elem.value]
        })
      })
      .then((dataPoints) => {
        socket.emit('getHistoryResponse', { error: false, from: from, to: to, results: dataPoints })
      })
      .catch(function (err) {
        log.error('Error sending datapoints from DB')
        log.error(err)
        socket.emit('getHistoryResponse', { error: true })
      })
  }

  // We currently have all points from 'from' up to (but no including) 'upTo'
  // Find more points, firstly at to - end, and later anything before from
  // pre: from, upTo, latestBlock are numbers, not strings
  function cacheMorePoints (contractInfo, address, method, from, upTo, latestBlock) {
    const chunkSize = 1000
    // upTo is exclusive - add 1 to latest block to check if upTo has gotten it
    if (upTo === latestBlock + 1) {
      if (from === firstBlock) {
        log.info('Cached all points for ' + address + ' ' + method)
        lock.writeLock('setLock', (release) => {
          methodCachesInProgress.delete(address + method)
          release()
        })
      } else {
        let newFrom = Math.max(from - chunkSize, firstBlock)
        sendDataPointsFromParity(contractInfo, address, method, newFrom, from, newFrom, upTo)
        .then(() => {
          cacheMorePoints(contractInfo, address, method, newFrom, upTo, latestBlock)
        })
      }
    } else {
      // newTo is exclusive, so can be at most latestBlock + 1
      let newUpTo = Math.min(upTo + chunkSize, latestBlock + 1)
      sendDataPointsFromParity(contractInfo, address, method, upTo, newUpTo, from, newUpTo)
      .then(() => {
        cacheMorePoints(contractInfo, address, method, from, newUpTo, latestBlock)
      })
    }
  }

  // Send all points from from up to but not including to
  function sendDataPointsFromParity (contractInfo, contractAddress, method, from, upTo,
    totalFrom, totalTo) {
    return new Promise((resolve, reject) => {
      // First we obtain the contract.
      let contract = contractInfo.parsedContract
      // Subtract 1 from to, because to is exclusive, and getHistory is inclusive
      parity.getHistory(contractAddress, method, from, upTo - 1)
      .then(function (events) {
        return parity.generateDataPoints(events, contract, method,
          totalFrom, totalTo)
      })
      .then(function (results) {
        // Hack for frontend
        let derpPoints = results.map((point) => {
          return [point.time, point.value, point.block]
        })
        io.sockets.in(contractAddress + method).emit('getHistoryResponse',
            { error: false, from: from, to: upTo, results: derpPoints })
        return resolve()
      })
      .catch(function (err) {
        log.error('Error in parity sending' + err)
        io.sockets.in(contractAddress + method).emit('getHistoryResponse', { error: true })
        return reject(err)
      })
    })
  }

  function sendHistory (address, method, socket) {
    /* Ignore invalid requests on the socket - the frontend should
     * ensure these are not send, so any invalid addresses
     * will not have been sent from our front end */
    if (!validAddress(address)) {
      return
    }

    db.getCachedFromTo(address, method)
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
            lock.writeLock('setLock', function (release) {
              if (methodCachesInProgress.has(address + method)) {
                release()
                return
              }
              methodCachesInProgress.add(address + method)
              release()
              from = parseInt(from)
              to = parseInt(to)
              latestBlock = parseInt(latestBlock)
              parity.getContract(address)
              .then((contractInfo) => {
                cacheMorePoints(contractInfo, address, method, parseInt(from), parseInt(to),
                                parseInt(latestBlock))
              })
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
})
