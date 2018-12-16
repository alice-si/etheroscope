var ReadWriteLock = require('rwlock')
var lock = new ReadWriteLock()

let methodCachesInProgress = new Set()
var morgan = require('morgan')
var Promise = require('bluebird')
let log = require('loglevel')
let validator = require('validator')

console.log('microService.js: Starting microService.js')
console.log('Extra test log')

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
    transports: ['websocket', 'xhr-polling']
})

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    next()
})

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(morgan('dev'))

// import other parts of project

log.info('services/index.js: Micro-service started at', socketPort)
let db = require('../common/db.js')(log)
let web3Client = require('../common/web3Client')(db, log, validator)
let ethStorageClient = require('./ethStorageClient')(db, web3Client, log, validator)
var errorHandle = require('../common/errorHandlers').errorHandle
var errorCallbackHandle = require('../common/errorHandlers').errorCallbackHandle

function validAddress(address) {
    return address.length === 42 && validator.isHexadecimal(address.substr(2)) && address.substr(0, 2) === '0x'
}

log.info('services/index.js: Micro-service started at', socketPort)

io.on('connection', function (socket) {
    console.log('new client request \'connection\'')

    socket.on('getHistory', ([address, method]) => {
        console.log('new client request \'connection\' \'getHistory\'')
        let room = address + method
        socket.join(room)
        log.debug('Joined room:', room)
        sendHistory(address, method, socket)
    })

    socket.on('unsubscribe', ([address, method]) => {
        console.log('new client request \'connection\' \'unsubscribe\'')
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
    console.log('new client request \'disconnect\'')
})

async function sendHistory(address, method, socket) {
    /* Ignore invalid requests on the socket - the frontend should
     * ensure these are not send, so any invalid addresses
     * will not have been sent from our front end */
    if (!validAddress(address)) {
        return
    }

    try {
        console.log("ethstoafgeclient:\n",ethStorageClient)
        var latestBlock = await ethStorageClient.latestFullBlock()
        var cachedRange = await db.getCachedFromTo(address.substring(2), method)
        io.sockets.in(address + method).emit('latestBlock', {latestBlock: latestBlock})
        latestBlock = parseInt(latestBlock)
        let to = (cachedRange.cachedUpTo === null || cachedRange.cachedUpTo === null) ? latestBlock : parseInt(cachedRange.cachedUpTo)
        let from = (cachedRange.cachedFrom === null || cachedRange.cachedUpTo === null) ? latestBlock : parseInt(cachedRange.cachedFrom)

        sendAllDataPointsFromDB(address, method, from, to, socket)

        await lock.writeLock('setLock', (release) => {
            // If there is already a caching process, we don't need to set one up
            if (!methodCachesInProgress.has(address + method)) {
                methodCachesInProgress.add(address + method)
            }
            release()
        })

        var contractInfo = await web3Client.getContract(address)
        cacheMorePoints(contractInfo, address, method, from, to, latestBlock)

    } catch(err){
        console.log('ERROR in send history')
        console.log(err)
    }
}

async function sendAllDataPointsFromDB(address, method, from, to, socket) {
    try {
        var dataPoints = await db.getDataPoints(address.substr(2), method)
        dataPoints = await Promise.map(dataPoints, (elem) => [elem.timeStamp, elem.value])
        dataPoints = await socket.emit('getHistoryResponse', {error: false, from: from, to: to, results: dataPoints})
    } catch(err){
        log.error('ERROR in sendAllDataPointsFromDB')
        log.error(err)
        socket.emit('getHistoryResponse', {error: true})
    }
}

// We currently have everything from from up to (but no including) upTo.
// Find more things, firstly at to - end, and later anything before from
// pre: from, upTo, latestBlock are numbers, not strings
async function cacheMorePoints(contractInfo, address, method, from, upTo, latestBlock) {
    // const chunkSize = 1000
    //TODO: assert if working
    try {
        const chunkSize = 10000
        // upTo is exclusive - add 1 to latest block to check if upTo has gotten it
        if (from === 1 && upTo === latestBlock + 1) { // end of reccursion
            log.info('Cached all points for ' + address + ' ' + method)

            function deleteChannel(release) {
                methodCachesInProgress.delete(address + method)
                release()
            }

            lock.writeLock('setLock', deleteChannel)
        }
        else {
            if (upTo === latestBlock + 1) { // get oldest data points
                let newFrom = await Math.max(from - chunkSize, 1)
                await sendDatapointsFromEthStorage(contractInfo, address, method, newFrom, from, newFrom, upTo)
                cacheMorePoints(contractInfo, address, method, newFrom, upTo, latestBlock)
            } else { // newTo is exclusive, so can be at most latestBlock + 1, get newest datapoints
                let newUpTo = await Math.min(upTo + chunkSize, latestBlock + 1)
                await sendDatapointsFromEthStorage(contractInfo, address, method, upTo, newUpTo, from, newUpTo)
                cacheMorePoints(contractInfo, address, method, from, newUpTo, latestBlock)
            }
        }
    }catch (err) {
        log.error('ERROR in sendDatapointsFromEthStorage')
        log.error(err)
    }
}

// Send all points from from up to but not including to
async function sendDatapointsFromEthStorage(contractInfo, contractAddress, method, from, upTo, totalFrom, totalTo) {
    try {
        // First we obtain the contract.
        let contract = contractInfo.parsedContract
        // Subtract 1 from to, because to is exclusive, and getHistory is inclusive
        var dataPoints = await ethStorageClient.generateDataPoints(contractInfo, contractAddress, method, from, upTo, totalFrom, totalTo)
        log.error('index.js:sendDatapointsFromEthStorage:results\n', dataPoints)
        io.sockets.in(contractAddress + method).emit('getHistoryResponse', {
            error: false,
            from: from,
            to: upTo,
            results: dataPoints
        })
    }catch (err) {
        log.error('ERROR in sendDatapointsFromEthStorage')
        log.error(err)
    }
}

