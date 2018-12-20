const axios = require('axios')
const Web3 = require('web3')
var Promise = require('bluebird')
var ReadWriteLock = require('rwlock')
var lock = new ReadWriteLock()


var EthStorage = require('eth-storage/ethStorage/layers/highLevel.js')
var FORMATTER = require('eth-storage/ethStorage/format/formatter.js')

var errorHandle = require('../common/errorHandlers').errorHandle
var errorHandleCallback = require('../common/errorHandlers').errorCallbackHandle

// geth database path (must be different then choosen api connector database)
var settings = require('../common/settings.js')
var BLOCKCHAINPATH = settings.ETHEROSCOPEBLOCKCHAIN

module.exports = function (db, web3Client, log, validator) {
    const ethStorageClient = {}

    var ethStorage = new EthStorage(BLOCKCHAINPATH, true)
    log.info('Eth-Storage connected to path',BLOCKCHAINPATH)

    function decodeValueInBuffer(rawVal) {
        return (Buffer.isBuffer(rawVal)) ? FORMATTER.bufferToInt(rawVal.toString('hex'), 16) : -1
        //     TODO: is reading int proper?
        // return (Buffer.isBuffer(rawVal)) ? FORMATTER.bufferToInt(rawVal) : -1
    }

    function convert(event) { // [(time, value, blockNum)]
        return Promise.all([web3Client.getBlockTime(event.block), decodeValueInBuffer(event.val), event.block])
    }

    // Send all points from from up to but not including to
    ethStorageClient.generateDataPoints = async function (contractInfo, contractAddress, method, from, upTo) {
        try {
            let contract = contractInfo.parsedContract
            var dataPoints = await ethStorage.promiseGetRange(contractAddress, 0, from, upTo)
            return await Promise.map(dataPoints, convert, {concurrency: 5})
        } catch (err) {
            errorHandle("ethStorage.generateDataPoints")(err)
        }
    }

    ethStorageClient.latestFullBlock = function () {
        return new Promise(
            (resolve, reject) => ethStorage.latestHeaderNumber(ethStorage.promiseEnd(resolve, reject))
        )
    }

    return ethStorageClient
}
