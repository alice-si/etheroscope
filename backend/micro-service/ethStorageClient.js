const axios = require('axios')
const Web3 = require('web3')
var Promise = require('bluebird')
var ReadWriteLock = require('rwlock')
var lock = new ReadWriteLock()

var settings = require('../common/settings.js')
var GETHHOST = settings.ETHEROSCOPEGETHHOST
const GETHURL = 'http://' + GETHHOST // api connector
const web3 = new Web3(new Web3.providers.HttpProvider(GETHURL))

var EthStorage = require('eth-storage/ethStorage/layers/highLevel.js')
var FORMATTER = require('eth-storage/ethStorage/format/formatter.js')

var errorHandle = require('../common/errorHandlers').errorHandle
var errorCallbackHandle = require('../common/errorHandlers').errorCallbackHandle

// geth database path (must be different then choosen api connector database)
var BLOCKCHAINPATH = settings.ETHEROSCOPEBLOCKCHAIN

module.exports = function (db, web3Client, log, validator) {
    const ethStorageClient = {}

    var ethStorage = new EthStorage(BLOCKCHAINPATH, true)
    console.log('Eth-Storage connected to path',BLOCKCHAINPATH)

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
        let contract = contractInfo.parsedContract
        var dataPoints = await ethStorage.promiseGetRange(contractAddress, 0, from, upTo).catch(errorCallbackHandle('promiseGetRange', console.log))
        return await Promise.map(dataPoints, convert, {concurrency: 5}).catch(errorCallbackHandle('generateDatapoints:promisemap', console.log))
    }

    ethStorageClient.latestFullBlock = function () {
        return new Promise((resolve, reject) => {
            return ethStorage.latestHeaderNumber(ethStorage.promiseEnd(resolve, reject))
            // .catch(errorCallbackHandle('latest block error',console.log))
        })
    }

    return ethStorageClient
}
