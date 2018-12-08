var ReadWriteLock = require('rwlock')
var lock = new ReadWriteLock()

let methodCachesInProgress = new Set()
var morgan = require('morgan')
var Promise = require('bluebird')
let log = require('loglevel')
let validator = require('validator')

console.log('microService.js: Starting microService.js')

let socketPort = 8081

// Initialise the server
let express = require('express')
// var cors = require('cors')
let bodyParser = require('body-parser')
var http = require('http')
let app = express()
let server = http.createServer(app)
server.listen(socketPort)

let io = require('socket.io')(server, {
  transports: ['xhr-polling']
})

//app.use(cors({origin: 'http://35.242.161.116'}))

// io.origins((origin, callback) => {
//   if (origin !== 'http://35.242.161.116:*') {
//     return callback('origin not allowed', false);
//   }
//   callback(null, true);
// });

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(morgan('dev'))


// io.set('origins', '*35.242.161.116*:*')
// origin: 'http://35.246.65.214:8081'
// (server, { origins: 'http://35.246.65.214:8081/*' })
// .use(cors({origin: 'http://35.242.161.116', credentials: true}))
// .set('origins', 'http://35.242.161.116:80')

// import other parts of project



let db = require('./db/db.js')(log)
let ethClient = require('./ethClient')(db, log, validator, true)

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
        socket.emit('unsubscribed', {error: err})
      })
    } else {
      socket.emit('unsubscribed', {error: null})
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
      ethClient.getLatestBlock()
        .then((latestBlock) => {
          io.sockets.in(address + method).emit('latestBlock', {latestBlock: latestBlock})
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
            ethClient.getContract(address)
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

function sendAllDataPointsFromDB (address, method, from, to, socket) {
  db.getDataPoints(address.substr(2), method)
    .then((dataPoints) => {
      // return Promise.map(dataPoints[0], (elem) => {
      console.log('index.js:sendDAllDataPointsFromDB', dataPoints)
      return Promise.map(dataPoints, (elem) => {
        return [elem.timeStamp, elem.value]
      })
    })
    .then((dataPoints) => {
      socket.emit('getHistoryResponse', {error: false, from: from, to: to, results: dataPoints})
    })
    .catch(function (err) {
      log.error('Error sending datapoints from DD')
      log.error(err)
      socket.emit('getHistoryResponse', {error: true})
    })
}

// We currently have everything from from up to (but no including) upTo.
// Find more things, firstly at to - end, and later anything before from
// pre: from, upTo, latestBlock are numbers, not strings
function cacheMorePoints (contractInfo, address, method, from, upTo, latestBlock) {
  // const chunkSize = 1000
  //TODO: assert if working
  const chunkSize = 10000
  // upTo is exclusive - add 1 to latest block to check if upTo has gotten it
  if (upTo === latestBlock + 1) {
    if (from === 1) {
      log.info('Cached all points for ' + address + ' ' + method)
      lock.writeLock('setLock', (release) => {
        methodCachesInProgress.delete(address + method)
        release()
      })
    } else {
      let newFrom = Math.max(from - chunkSize, 1)
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
    // ethClient.getHistory(contractAddress, method, from, upTo - 1)
    ethClient.getHistory(contractAddress, method, from, upTo)
      .then(function (events) {
        console.log('index.js:sendDataPointsFromParity:events', events)
        return ethClient.generateDataPoints(events, contract, method,
          totalFrom, totalTo)
      })
      .then(function (results) {
        console.log('index.js:sendDataPointsFromParity:results', results)
        // if (results.length > 0) throw error;
        io.sockets.in(contractAddress + method).emit('getHistoryResponse',
          {error: false, from: from, to: upTo, results: results})
        return resolve()
      })
      .catch(function (err) {
        log.error('Error in ethClient sending' + err)
        io.sockets.in(contractAddress + method).emit('getHistoryResponse', {error: true})
        return reject(err)
      })
  })
}
