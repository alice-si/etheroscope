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

// geth database path (must be different then choosen api connector database)
var BLOCKCHAINPATH = settings.ETHEROSCOPEBLOCKCHAIN

module.exports = function (db, web3Client, log, validator) {
    const ethStorageClient = {}

        var ethStorage = new EthStorage(BLOCKCHAINPATH, true)
        console.log('Eth-Storage connected')

    function decodeValueInBuffer(rawVal) {
        // TODO: is reading int proper?
        return (Buffer.isBuffer(rawVal)) ? parseInt(rawVal.toString('hex'), 16) : -1
    }

// Send all points from from up to but not including to
    ethStorageClient.generateDataPoints = function (contractInfo, contractAddress, method, from, upTo,
                                                    totalFrom, totalTo) {
        return new Promise((resolve, reject) => {
            // First we obtain the contract.
            let contract = contractInfo.parsedContract
            // Subtract 1 from to, because to is exclusive, and getHistory is inclusive
            // ethStorageClient.getHistory(contractAddress, method, from, upTo - 1)

            return new Promise((resolve, reject) => {
                return ethStorage.hashSet(contractAddress, 0, from, upTo, function returnResults(err, events) {
                    if (err) return reject(err)
                    console.log('ethStorageClient.getHistory:always returs value at index 0):\n',
                        'startBlock', from, 'endBlock', upTo, 'querylength', upTo - from,
                        '\nevents found: ',events)
                    resolve(Promise.map(events, (event) => {
                        // [(time, value, blockNum)]
                        return Promise.all([web3Client.getBlockTime(event.block), decodeValueInBuffer(event.val), event.block])
                    }, {concurrency: 5}))
                }, 8)
            })
                .then((events) => {
                    return db.addDataPoints(contract.address.substr(2), method, events, totalFrom, totalTo)
                })
                .then((events) => {
                    if (events.length > 0) {
                        log.debug('Added ' + events.length + ' data points for ' + contract.address + ' ' + method)
                    }
                    return resolve(events)
                })
                .catch((err) => {
                    log.error('Data set generation error: ' + err)
                    return reject(err)
                })
                .catch(function (err) {
                    log.error('Error in ethStorageClient ' + err)
                    return reject(err)
                })
        })
    }

    return ethStorageClient
}
