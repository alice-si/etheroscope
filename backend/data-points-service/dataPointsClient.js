const axios = require('axios')
var Promise = require('bluebird')

var EthStorage = require('eth-storage/ethStorage/layers/highLevel.js')
var Parity = require('../common/parity.js')
var FORMATTER = require('eth-storage/ethStorage/format/formatter.js')
var errorHandler = require('../common/errorHandlers')
var settings = require('../common/settings.js')
// geth database path (must be different then choosen api connector database)
var BLOCKCHAINPATH = settings.ETHEROSCOPEBLOCKCHAIN

module.exports = function (db, log, validator) {
    try {
        const dataPointsClient = {}

        var ethStorage = new EthStorage(BLOCKCHAINPATH, true)
        var parityClient = Parity(db, log,validator)

        async function decodeValueInBuffer(rawVal) {
            var isBuff = await Buffer.isBuffer(rawVal)
            var isNotNan = !isNaN(rawVal)
            var decoded = (isBuff || isNotNan) ? (isNotNan) ? rawVal : await FORMATTER.bufferToInt(await rawVal.toString('hex'), 16) : -1
            while (decoded > 1000000) decoded = decoded / 10
            return decoded
            //     TODO: is reading int proper?
        }

        async function convert(event) { // [(time, value, blockNum)]
            return await Promise.all([parityClient.getBlockTime(event.block), decodeValueInBuffer(event.val), event.block])
        }

        // Send all points from from up to but not including to
        dataPointsClient.generateDataPoints = async function (contractInfo, contractAddress, method, from, upTo, useWeb3 = false) {
            try {
                var index = 0
                log.info('generateDataPoints at index:',index)
                var dataPoints = (!useWeb3) ?
                    await ethStorage.promiseGetRange(contractAddress, index, from, upTo) :
                    await parityClient.getRange(contractAddress, contractInfo.parsedContract, method, from, upTo)
                return await Promise.map(dataPoints, convert, {concurrency: 5})
            } catch (err) {
                errorHandler.errorHandleThrow("ethStorage.generateDataPoints","could not generate datapoints")(err)
            }
        }

        dataPointsClient.latestFullBlockBlockchain = function () {
            return ethStorage.promiseLatestFullBlock()
        }

        dataPointsClient.latestFullBlockParity = function () {
            return parityClient.getLatestBlock()
        }

        dataPointsClient.getContract = function (address) {
            return parityClient.getContract(address)
        }

        return dataPointsClient
    }
    catch (err) {
        errorHandler.errorHandleThrow("dataPointsClient constructor","could not start dataPointsClient")(err)
    }

}

