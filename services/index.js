let bodyParser = require('body-parser')
let Lock = require('lock').Lock
let methodCachesLock = Lock()
let methodCachesInProgress = new Set()
var morgan = require('morgan')
var Promise = require('bluebird')

let log = require('loglevel')
let validator = require('validator')
console.log('here1')
let db = require('./../db/db.js')(log)
console.log('here1.5')

let socketPort = 8081

let express = require('express')
let app = express()
console.log('here2')
let server = require('http').createServer(app)
let io = require('socket.io')(server)
console.log('here3')

db.poolConnect().then(() => {
  server.listen(socketPort)
  console.log('CONNECTED TO POOL')
console.log('here4')
// Initialise the server
let parity = require('../api/parity')(db, log, validator)
console.log('here4.5')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(morgan('dev'))
console.log('here5')

function validAddress (address) {
  return address.length === 42 && validator.isHexadecimal(address.substr(2)) && address.substr(0, 2) === '0x'
}

log.info('services/index.js: Micro-service started at', socketPort)

io.on('connection', function (socket) {
  console.log('CONNTECTION')
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

// We currently have everything from from up to (but no including) to.
// Find more things, firstly at to - end, and later anything before from
// pre: from, to, latestBlock are numbers, not strings
function cacheMorePoints (contractInfo, address, method, from, to, latestBlock) {
  console.log('In cache more points: ' + from + ' ' + to)
  const chunkSize = 1000
  // To is exclusive - add 1 to latest block to check if to has gotten it
  if (to === latestBlock + 1) {
    if (from === 1) {
      log.info('Cached all points for ' + address + ' ' + method)
      methodCachesLock('setLock', (release) => {
        methodCachesInProgress.delete(address + method)
        release()
      })
      return
    }
    let newFrom = Math.max(from - chunkSize, 1)
    sendDataPointsFromParity(contractInfo, address, method, newFrom, from, newFrom, to)
    .then(() => {
      cacheMorePoints(contractInfo, address, method, newFrom, to, latestBlock)
    })
  } else {
    // newTo is exclusive, so can be at most latestBlock + 1
    let newTo = Math.min(to + chunkSize, latestBlock + 1)
    sendDataPointsFromParity(contractInfo, address, method, to, newTo, from, newTo)
    .then(() => {
      cacheMorePoints(contractInfo, address, method, from, newTo, latestBlock)
    })
  }
}

// Send all points from from up to but not including to
function sendDataPointsFromParity (contractInfo, contractAddress, method, from, to,
  totalFrom, totalTo) {
  return new Promise((resolve, reject) => {
    // First we obtain the contract.
    let contract = contractInfo.parsedContract
    // Subtract 1 from to, because to is exclusive, and getHistory is inclusive
    parity.getHistory(contractAddress, method, from, to - 1)
    .then(function (events) {
      return parity.generateDataPoints(events, contract, method,
        totalFrom, totalTo)
    })
    .then(function (results) {
      console.log('Sending response')
      io.sockets.in(contractAddress + method).emit('getHistoryResponse',
          { error: false, from: from, to: to, results: results })
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

          methodCachesLock('setLock', (release) => {
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
