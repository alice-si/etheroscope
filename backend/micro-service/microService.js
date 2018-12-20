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
var errorHandle = require('../common/errorHandlers').errorHandle
var errorHandleCallback = require('../common/errorHandlers').errorCallbackHandle

log.info('services/index.js: Micro-service started at', socketPort)
let db = require('../common/db.js')(log)
var Web3Client = require('../common/web3Client')
var web3Client = new Web3Client(db, log, validator)
let ethStorageClient = require('./ethStorageClient')(db, web3Client, log, validator)
var streamedSet = require('./streamedSet')()

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


function validAddress(address) {
    return address.length === 42
        && validator.isHexadecimal(address.substr(2))
        && address.substr(0, 2) === '0x'
}

function setInitCached(cachedRange, latestBlock) {
    var {cachedFrom, cachedUpTo} = cachedRange
    if (cachedUpTo == null || cachedUpTo === null) {
        cachedFrom = cachedUpTo = latestBlock // double assignment
    }
    else {
        cachedFrom = parseInt(cachedFrom);
        cachedUpTo = parseInt(cachedUpTo)
    }
    return {cachedFrom, cachedUpTo}

}

async function sendHistory(address, method, socket) {
    /* Ignore invalid requests on the socket - the frontend should
     * ensure these are not send, so any invalid addresses
     * will not have been sent from our front end */
    if (!validAddress(address)) {
        return
    }

    try {

        var latestBlock = await web3Client.getLatestBlock()
        var latestBlockDirectAccess = await ethStorageClient.latestFullBlock()

        console.log(
            'New client: WEBSOCKET EMIT:latestBlockDirectAccess=', latestBlockDirectAccess,
            'latestBlock=', latestBlock)

        io.sockets.in(address + method).emit('latestBlock', {latestBlock: latestBlockDirectAccess})

        var cachedRange = await db.getCachedFromTo(address.substring(2), method)
        var {cachedFrom, cachedUpTo} = setInitCached(cachedRange, latestBlockDirectAccess)

        sendAllDataPointsFromDB(address, method, cachedFrom, cachedUpTo, socket)

        await streamedSet.addChannel(address, method)
        var contractInfo = await web3Client.getContract(address)

        console.log('ejj')
        cacheMorePoints(await contractInfo, address, method, cachedFrom, cachedUpTo, latestBlockDirectAccess,latestBlock)
        console.log('ejj2')

    } catch (err) {
        errorHandle("sendHistory")(err)
    }
}

async function sendAllDataPointsFromDB(address, method, from, to, socket) {
    try {

        var dataPoints = await db.getDataPoints(address.substr(2), method)
        dataPoints = await Promise.map(dataPoints, (elem) => [elem.timeStamp, elem.value])
        await socket.emit('getHistoryResponse', {error: false, from: from, to: to, results: dataPoints})

    } catch (err) {
        errorHandle("sendAllDataPointsFromDB")(err)
        socket.emit('getHistoryResponse', {error: true})
    }
}

// We currently have everything from from up to (but no including) upTo.
// Find more things, firstly at to - end, and later anything before from
// pre: from, upTo, latestBlock are numbers, not strings
async function cacheMorePoints(
    contractInfo, address, method, from, upTo, latestBlockDirectAccess, latestBlock) {
    // const chunkSize = 1000
    //TODO: assert if working
    try {
        var totalFrom = from
        var totalUpTo = upTo
        const chunkSize = 10000
        // upTo is exclusive - add 1 to latest block to check if upTo has gotten it
        while (totalUpTo < latestBlockDirectAccess + 1) {
            upTo = totalUpTo
            totalUpTo = await Math.min(upTo + chunkSize, latestBlockDirectAccess + 1)
            await sendDatapointsFromEthStorage(
                contractInfo, address, method, upTo, totalUpTo, totalFrom, totalUpTo)
        }
        while (totalUpTo < latestBlock + 1) {
            upTo = totalUpTo
            totalUpTo = await Math.min(upTo + chunkSize, latestBlockDirectAccess + 1)
            await sendDatapointsFromEthStorage(
                contractInfo, address, method, upTo, totalUpTo, totalFrom, totalUpTo, true)
        }
        while (1 < totalFrom) {
            from = totalFrom
            totalFrom = await Math.max(from - chunkSize, 1)
            await sendDatapointsFromEthStorage(
                contractInfo, address, method, totalFrom, from, totalFrom, totalUpTo)
        }
        if (from === 1 && upTo === latestBlockDirectAccess + 1) { // end of reccursion
            log.info('Cached all points for ' + address + ' ' + method)
            streamedSet.deleteChannel(address, method)
        }
    } catch (err) {
        errorHandle("cachedMorePoints")(err)
    }
}

// Send all points from from up to but not including to
async function sendDatapointsFromEthStorage(
    contractInfo, contractAddress, method, from, upTo, totalFrom, totalTo, useWeb3 = false) {
    try {
        // First we obtain the contract.
        let contract = contractInfo.parsedContract // TODO Var to index
        // Subtract 1 from to, because to is exclusive, and getHistory is inclusive
        var dataPoints = await ethStorageClient
            .generateDataPoints(contractInfo, contractAddress, method, from, upTo, useWeb3)
        // save to db
        await db.addDataPoints(contract.address.substr(2), method, dataPoints, totalFrom, totalTo)
        io.sockets.in(contractAddress + method).emit('getHistoryResponse', {
            error: false,
            from: from,
            to: upTo,
            results: dataPoints
        })
    } catch (err) {
        errorHandle("sendDatapointsFromEthStorage")(err)
    }
}

