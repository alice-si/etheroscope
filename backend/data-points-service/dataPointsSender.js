const Promise = require('bluebird')

const errorHandler = require('../common/errorHandlers')
const Parity = require('../common/parity')
var RabbitMq = require('../common/rabbitMq')
const streamedSet = require('./streamedSet')()
const settings = require('../common/settings.js')

module.exports = function (io, log) {
    try {
        let dataPointsSender = {}

        const db = require('../common/db.js')(log)

        const parityClient = Parity(db, log)

        /**
         * Initialises values of cachedRange.
         *
         * If any of them is null, that means that database has no data about variable.
         * In this situation they are set to their starting values.
         *
         * @param {Object} cachedRange
         * @param {String} cachedRange.cachedFrom beginning of cached range in database
         * @param {String} cachedRange.cachedUpTo end of cached range in database
         *
         * @returns {{cachedFrom: number, cachedUpTo: number}}
         */
        function setInitCached(cachedRange) {
            let {cachedFrom, cachedUpTo} = cachedRange

            if (cachedUpTo == null || cachedUpTo === null)
                return {
                    cachedFrom: 1,
                    cachedUpTo: 0
                }
            else
                return {
                    cachedFrom: parseInt(cachedFrom),
                    cachedUpTo: parseInt(cachedUpTo)
                }
        }

        /**
         * Main function responsible for sending data through socket.
         *
         * First step is sending all the data stored in database.
         * Next, all data that is not stored in our database is retrieved from ethereum.
         * Information gained in that process is saved in database for future use.
         * Currently address and variableName sent from frontend are not validated in any way.
         *
         * @param {string} address
         * @param {string} variableName
         */
        dataPointsSender.sendHistory = async function (address, variableName) {
            try {
                log.debug(`dataPointsSender.sendHistory ${address} ${variableName}`)

                let latestBlock = await parityClient.getLatestBlock()
                let curLatestBlock = await streamedSet.addChannel(address, variableName, latestBlock)

                let cachedRange = await db.getCachedFromTo(address.substring(2), variableName)
                let { cachedFrom, cachedUpTo } = setInitCached(cachedRange)

                if (curLatestBlock) {
                    io.sockets.in(address + variableName).emit('latestBlock', {latestBlock: curLatestBlock})

                    await sendAllDataPointsFromDB(address, variableName, cachedFrom, cachedUpTo)
                } else {
                    io.sockets.in(address + variableName).emit('latestBlock', {latestBlock: latestBlock})

                    await sendAllDataPointsFromDB(address, variableName, cachedFrom, cachedUpTo)

                    var contractRaw = await RabbitMq.getContractRaw(address)
                    let contractInfo = await parityClient.parseContract(await JSON.parse(contractRaw))
                    let parsedContract = contractInfo.parsedContract

                    await cacheMorePoints(parsedContract, variableName, cachedFrom, cachedUpTo, latestBlock)
                }

            } catch (err) {
                errorHandler.errorHandle(`dataPointsSender.sendHistory ${address} ${variableName}`)(err)
                io.sockets.in(address + variableName).emit('getHistoryResponse', { error: true })
            } finally {
                streamedSet.deleteChannel(address, variableName)
            }
        }

        /**
         * Function responsible for sending already cached data through socket.
         *
         * @param {string} address
         * @param {string} variableName
         * @param {Number} from
         * @param {Number} to
         */
        async function sendAllDataPointsFromDB(address, variableName, from, to) {
            try {
                log.debug(`dataPointsSender.sendAllDataPointsFromDB ${address} ${variableName} ${from} ${to}`)

                let dataPoints = await db.getDataPoints(address.substr(2), variableName)

                dataPoints = await Promise.map(dataPoints, dataPoint => [dataPoint.timeStamp, dataPoint.value])

                io.sockets.in(address + variableName).emit('getHistoryResponse', {
                    error: false,
                    from: from,
                    to: to,
                    results: dataPoints
                })
            } catch (err) {
                errorHandler.errorHandleThrow("dataPointsSender sendAllDataPointsFromDB", '')(err)
            }
        }

        /**
         * Function responsible for caching all the blocks that have not been cached yet.
         *
         * Generates all points in range (upTo, latestBlock].
         *
         * @param {Object} parsedContract
         * @param {string} variableName
         * @param {Number} from         beginning of range currently cached in database
         * @param {Number} upTo         end of range currently cached in database
         * @param {Number} latestBlock  latest block number in ethereum
         */
        async function cacheMorePoints(parsedContract, variableName, from, upTo, latestBlock) {
            try {
                log.debug(`dataPointsSender.cacheMorePoints ${parsedContract.address} ${variableName} ${from} ${upTo}`)

                let totalUpTo = upTo, totalFrom = from
                let chunkSize = settings.dataPointsService.cacheChunkSize

                while (totalUpTo < latestBlock) {
                    [from, totalUpTo] = [totalUpTo + 1, Math.min(totalUpTo + chunkSize, latestBlock)]
                    await generateAndSendDataPoints(parsedContract, variableName, from, totalUpTo, totalFrom, totalUpTo)
                }
            } catch (err) {
                errorHandler.errorHandleThrow(
                    `dataPointsSender.cacheMorePoints ${parsedContract.address} ${variableName} ${from} ${upTo}`,
                    '')(err)
            }
        }

        /**
         * Function responsible for generating and caching blocks in range [from, upTo].
         * Additionally it updates information about cached range for this variable.
         *
         * @param {Object} parsedContract
         * @param {string} variableName
         * @param {Number} from         beginning of range to be cached
         * @param {Number} upTo         end of range to be cached
         * @param {Number} totalFrom    beginning of range of totally cached data for this variable
         * @param {Number} totalUpTo    end of range of totally cached data for this variable
         */
        async function generateAndSendDataPoints(parsedContract, variableName, from, upTo, totalFrom, totalUpTo) {
            try {
                log.debug(`dataPointsSender.generateAndSendDataPoints ${parsedContract.address} ${variableName} ${from} ${upTo}`)

                // TODO method to index
                let address = parsedContract.address

                let dataPoints = await parityClient.generateDataPoints(parsedContract, variableName, from, upTo)

                await db.addDataPoints(address.substr(2), variableName, dataPoints, totalFrom, totalUpTo)

                io.sockets.in(address + variableName).emit('getHistoryResponse', {
                    error: false,
                    from: from,
                    to: upTo,
                    results: dataPoints
                })
            } catch (err) {
                errorHandler.errorHandleThrow(
                    `dataPointsSender.generateAndSendDataPoints ${parsedContract.address} ${variableName} ${from} ${upTo}`,
                    '')(err)
            }
        }

        return dataPointsSender
    }
    catch (err) {
        errorHandler.errorHandleThrow("dataPointsSender constructor", "could not start")(err)
    }

}
