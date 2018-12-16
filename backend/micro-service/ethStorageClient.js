const axios = require('axios')
const Web3 = require('web3')
var Promise = require('bluebird')
var ReadWriteLock = require('rwlock')
var lock = new ReadWriteLock()

var settings = require('../common/settings.js')
var gethHost = settings.ETHEROSCOPEGETHHOST
const parityUrl = 'http://' + gethHost // api connector
const web3 = new Web3(new Web3.providers.HttpProvider(parityUrl))

var EthStorage = require('eth-storage/ethStorage/layers/highLevel.js')
var FORMATTER = require('eth-storage/ethStorage/format/formatter.js')

var errorHandle = require('../common/errorHandlers').errorHandle
var errorCallbackHandle = require('../common/errorHandlers').errorCallbackHandle

// geth database path (must be different then choosen api connector database)
var BLOCKCHAINPATH = settings.ETHEROSCOPEBLOCKCHAIN

module.exports = function (db, web3Client, log, validator) {
    const ethStorageClient = {}

    var ethStorage = new EthStorage(BLOCKCHAINPATH, true)
    console.log('Eth-Storage connected')

    function decodeValueInBuffer(rawVal) {
    //     TODO: is reading int proper?
        return (Buffer.isBuffer(rawVal)) ? FORMATTER.bufferToInt(rawVal.toString('hex'), 16) : -1
        // return (Buffer.isBuffer(rawVal)) ? FORMATTER.bufferToInt(rawVal) : -1
    }

    function convert(event) { // [(time, value, blockNum)]
        return Promise.all([web3Client.getBlockTime(event.block), decodeValueInBuffer(event.val), event.block])
    }

// Send all points from from up to but not including to
    ethStorageClient
        .generateDataPoints = async function (contractInfo, contractAddress, method, from, upTo,
                                              totalFrom, totalTo) {
        console.log('GENERATE DATA POINTS',totalFrom,totalTo)
        // First we obtain the contract.
        let contract = contractInfo.parsedContract
        // Subtract 1 from to, because to is exclusive, and getHistory is inclusive
        // ethStorageClient.getHistory(contractAddress, method, from, upTo - 1)

        var events = await ethStorage.promiseGetRange(contractAddress, 0, from, upTo)
            .catch(errorCallbackHandle('promiseGetRange', console.log))
        events = await Promise.map(events, convert, {concurrency: 5})
            .catch(errorCallbackHandle('generateDatapoints:promisemap', console.log))
        events = await db.addDataPoints(contract.address.substr(2), method, events, totalFrom, totalTo)
            .catch(errorCallbackHandle('generateDatapoints', console.log))

        if (events.length > 0) {
            log.debug('Added ' + events.length + ' data points for ' + contract.address + ' ' + method)
        }

        return events
    }

    ethStorageClient.latestFullBlock = function () {
        return new Promise((resolve,reject)=>{
            ethStorage.latestHeaderNumber(ethStorage.promiseEnd(resolve,reject))
        })
    }

    return ethStorageClient
}
