let axios =  require('axios');
let port = 8081
let bodyParser = require('body-parser')
module.exports = function (db, io, log, validator) {
  // Initialise the server
  let parity = require('../api/parity')(db, log, validator)
  let app = require('express')()
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }))

  app.post('/cache', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    console.log('got post req')
    res.end();
    parity.getContract(req.body.address).then((contractInfo) => {
      cacheMorePoints(contractInfo, req.body.address, req.body.method, req.body.from, req.body.to, req.body.latestBlock)
    })
  })
  app.listen(port)
  log.info('services/index.js: Micro-service started at', port)


  // from, to and latestBlock are inclusive
  // pre: from, to, latestBlock are numbers, not strings
  function cacheMorePoints (contractInfo, address, method, from, to, latestBlock) {
    // console.log('it is', contractInfo)
    const chunkSize = 1000
    if (to === latestBlock) {
      if (from === 1) {
        log.info('Cached all points for ' + address + ' ' + method)
        axios.get('http://localhost:8080/api/inProgressMethods/delete/' + address + '/' + method).then(() => {
          console.log('Delete Cache Methods in progress')
        })
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
}

