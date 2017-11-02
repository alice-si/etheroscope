var Parity = require('./parity')
let Promise = require('bluebird')

module.exports = function (app, db, io) {
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

  function sendDataPointsFromParity (socket, contractAddress, method, from, to) {
    console.log('Sending history from parity')
    // First we obtain the contract.
    let contract = null
    return new Promise((resolve, reject) => {
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
          console.log('generated data points successfully')
          socket.emit('getHistoryResponse', { error: false, from: from, to: to, results: results })
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

  function cacheRemainingPoints (contractAddress, method, from, to) {
    // Don't do anything if we don't have to
    return new Promise((resolve, reject) => {
      if (from > to) {
        return resolve()
      }
      console.log('Caching more points in db from parity')
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
          console.log('Successfully cached more points from parity')
          return resolve()
        })
        .catch(function (err) {
          console.log('Error caching remaining points from parity')
          console.log(err)
        })
    })
  }

  function sendAllDataPointsFromDB (socket, address, method) {
    console.log('Sending history from db')
    db.getDataPoints(address.substr(2), method)
      .then((dataPoints) => {
        return Promise.map(dataPoints[0], (elem) => {
          console.log('getting a response')
          return [elem.timeStamp, elem.value]
        })
      })
      .then((dataPoints) => {
        console.dir(dataPoints)
        socket.emit('getHistoryResponse', { error: false, results: dataPoints})
      })
      .catch(function (err) {
        console.log('Error sending datapoints from DD')
        console.log(err)
        socket.emit('getHistoryResponse', { error: true })
      })
  }

  function sendDataPointsFromDB (socket, address, method, start, end) {
    console.log('Sending history from db')
    db.getDataPointsInDateRange(address.substr(2), method, start, end)
      .then((dataPoints) => {
        return Promise.map(dataPoints[0], (elem) => {
          console.log('getting a response')
          return [elem.timeStamp, elem.value]
        })
      })
      .then((dataPoints) => {
        console.dir(dataPoints)
        socket.emit('getHistoryResponse', { error: false, from: start, to: end, results: dataPoints })
      })
      .catch(function (err) {
        console.log('Error sending datapoints from DD')
        console.log(err)
        socket.emit('getHistoryResponse', { error: true })
      })
  }

  io.on('connection', function (socket) {
    socket.on('getHistory', ([address, method, from, to]) => {
      console.log("preparing to send")
      sendHistory(socket, address, method, from, parseInt(to))
    })
  })

  io.on('disconnect', function (socket) {
    console.log('User has disconnected')
  })

  function sendHistory (socket, address, method, from, to) {
    console.log('The address:')
    console.log(address)
    return db.getCachedUpToBlock(address.substring(2), method)
      .then((cachedUpToBlock) => {
        let dbStart
        let dbEnd
        let parityStart
        let parityEnd
        let useDB
        let useParity

        console.log('cached up to block is: ', cachedUpToBlock)

        // if from is less than cached block, start db search from here
        if (from >= cachedUpToBlock) {
          useParity = true
          useDB = false
          parityStart = from
          parityEnd = to
        } else {
          useDB = true
          if (to >= cachedUpToBlock) {
            useParity = true
            dbStart = from
            dbEnd = cachedUpToBlock - 1
            parityStart = cachedUpToBlock
            parityEnd = to
          } else {
            useParity = false
            dbStart = from
            dbEnd = to
          }
        }

        // have parity handle any points not in the db
        if (useParity) {
          console.log('Sending data from parity', parityStart, 'and', to)
          sendDataPointsFromParity(socket, address, method, parityStart, parityEnd)
            .then(() => {
              // Cache the points between cachedUpToBlock and from
              return cacheRemainingPoints(address, method, cachedUpToBlock, parityStart - 1)
            })
            .then(() => {
              // Update the cachedUpToBlock so we know to use db in future
              console.log('Updating db cachedUpToBlock')
              return db.updateCachedUpToBlock(address.substring(2), method, to + 1)
            })
            .then(() => {
              console.log('Updated db cachedUpToBlock')
            })
        }

        // have the db send all cached points
        if (useDB) {
          console.log('Sending data from db')
          sendAllDataPointsFromDB(socket, address, method) //, dbStart, dbEnd)
        }
      })
      .catch((err) => {
        console.log('Here is the error!', err)
      })
  }
}
