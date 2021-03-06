const errorHandler = require('../common/errorHandlers')
const Parity = require('../common/parity')
const streamedSet = require('./streamedSet')()
const settings = require('../common/settings.js')
const validator = require('validator')
const ReadWriteLock = require('rwlock')

const lock = new ReadWriteLock()

module.exports = function (io, log) {
    try {
        let dataPointsSender = {}

        const db = require('../db')

        const parityClient = Parity(db, log)

        function validAddress(address) {
            return address.length === 42 && validator.isHexadecimal(address.substr(2)) && address.substr(0, 2) === '0x'
        }

        let processedToMap = new Map()

        /**
         * Main function responsible for sending data through socket.
         *
         * First step is sending all the data stored in database.
         * Next, all data that is not stored in our database is retrieved from ethereum.
         * Information gained in that process is saved in database for future use.
         *
         * @param {string} address
         * @param {string} variableName
         * @param {string} socketId
         */
        dataPointsSender.sendHistory = async function (address, variableName, socketId) {
            let didCreateChannel = false
            try {
                log.debug(`dataPointsSender.sendHistory ${address} ${variableName}`)

                if (validAddress(address)) {
                    let latestBlock = await parityClient.getLatestBlock()
                    let curLatestBlock = await streamedSet.addChannel(address, variableName, latestBlock)

                    let cachedUpTo = await db.getCachedUpTo(address, variableName)
                    cachedUpTo = isNaN(cachedUpTo) ? settings.dataPointsService.cachedFrom - 1 : cachedUpTo

                    if (curLatestBlock) {
                        await lock.async.writeLock(`DataPoints lock ${address + variableName}`, async (err, release) => {
                            let timestamp = await  parityClient.getBlockTime(curLatestBlock)
                            io.to(socketId).emit('latestBlock', {latestBlock: curLatestBlock, timestamp: timestamp})

                            await sendAllDataPointsFromDB(address, variableName, cachedUpTo, socketId)
                            release()
                        })
                    } else {
                        didCreateChannel = true
                        let timestamp = await parityClient.getBlockTime(latestBlock)
                        io.to(socketId).emit('latestBlock', {latestBlock: latestBlock, timestamp: timestamp})

                        await sendAllDataPointsFromDB(address, variableName, cachedUpTo, socketId)

                        let contractInfo = await parityClient.getContract(address)

                        await cacheMorePoints(contractInfo, variableName, cachedUpTo, latestBlock)
                    }
                } else {
                    log.debug(`datapointsSender.sendHistory ${address} is not a valid address`)
                    io.to(address + variableName).emit('getHistoryResponse', { error: true })
                }

            } catch (err) {
                errorHandler.errorHandle(`dataPointsSender.sendHistory ${address} ${variableName}`)(err)
                io.to(address + variableName).emit('getHistoryResponse', { error: true })
            } finally {
                if (didCreateChannel) {
                    processedToMap.delete(address + variableName)
                    streamedSet.deleteChannel(address, variableName)
                }
            }
        }

        /**
         * Function responsible for sending already cached data through socket.
         * Checks if other 'thread' is already processing this variable, in order to send proper 'to' value.
         *
         * @param {string} address
         * @param {string} variableName
         * @param {Number} to
         * @param {String} socketId
         */
        async function sendAllDataPointsFromDB(address, variableName, to, socketId) {
            try {
                log.debug(`dataPointsSender.sendAllDataPointsFromDB ${address} ${variableName} ${to}`)

                let dataPoints = await db.getDataPoints(address, variableName)
                dataPoints = dataPoints == null ? [] : dataPoints
                let actProcessedTo = processedToMap.get(address + variableName)
                to = actProcessedTo ? actProcessedTo : to

                let actFrom = settings.dataPointsService.cachedFrom
                while (dataPoints.length > 0) {
                    let actDataPoints = dataPoints.splice(0, settings.dataPointsService.sendChunkSize),
                        actTo = actDataPoints[actDataPoints.length - 1].Block.number
                    actDataPoints = actDataPoints.map(dataPoint =>
                        [dataPoint.Block.timeStamp, parseInt(dataPoint.value), dataPoint.Block.number])
                    io.to(socketId).emit('getHistoryResponse', {
                        error: false,
                        from: actFrom,
                        to: actTo,
                        results: actDataPoints
                    })

                    actFrom = actTo + 1
                }
                if (actFrom <= to) {
                    io.to(socketId).emit('getHistoryResponse', {
                        error: false,
                        from: actFrom,
                        to: to,
                        results: []
                    })
                }
            } catch (err) {
                errorHandler.errorHandleThrow("dataPointsSender sendAllDataPointsFromDB", '')(err)
            }
        }

        /**
         * Function responsible for caching all the blocks that have not been cached yet.
         *
         * Generates all points in range (upTo, latestBlock].
         * Next we add delimiter (in order to `mark` range we processed).
         *
         * @param {Object} contractInfo
         * @param {string} variableName
         * @param {Number} upTo         end of range currently cached in database
         * @param {Number} latestBlock  latest block number in ethereum
         */
        async function cacheMorePoints(contractInfo, variableName, upTo, latestBlock) {
            let address = contractInfo.parsedContract.options.address
            try {
                log.debug(`dataPointsSender.cacheMorePoints ${address} ${variableName} ${upTo}`)

                let totalUpTo = upTo
                let sendChunkSize = settings.dataPointsService.sendChunkSize

                while (totalUpTo < latestBlock) {
                    [from, totalUpTo] = [totalUpTo + 1, Math.min(totalUpTo + sendChunkSize, latestBlock)]
                    await generateAndSendDataPoints(contractInfo, variableName, from, totalUpTo)
                }
                // adding delimiter
                await db.addDataPoints(address, variableName, [['timestamp_placholder', null, latestBlock]])
            } catch (err) {
                errorHandler.errorHandleThrow(
                    `dataPointsSender.cacheMorePoints ${address} ${variableName} ${upTo}`,
                    '')(err)
            }
        }

        /**
         * Function responsible for generating and caching blocks in range [from, upTo].
         * Additionally it updates information about cached range for this variable.
         *
         * @param {Object} contractInfo
         * @param {string} variableName
         * @param {Number} from         beginning of range to be cached
         * @param {Number} upTo         end of range to be cached
         */
        async function generateAndSendDataPoints(contractInfo, variableName, from, upTo) {
            let address = contractInfo.parsedContract.options.address
            try {
                log.debug(`dataPointsSender.generateAndSendDataPoints ${address} ${variableName} ${from} ${upTo}`)

                let cachecChunkSize = settings.dataPointsService.cacheChunkSize, totalDataPoints = [], actFrom = from
                while (actFrom <= upTo) {
                    let actUpTo = Math.min(actFrom + cachecChunkSize, upTo)
                    let dataPoints = await parityClient.generateDataPoints(contractInfo, variableName, actFrom, actUpTo)
                    actFrom += cachecChunkSize + 1
                    totalDataPoints = totalDataPoints.concat(dataPoints)
                }
                await lock.async.writeLock(`DataPoints lock ${address + variableName}`, async (err, release) => {
                    await db.addDataPoints(address, variableName, totalDataPoints)

                    io.to(address + variableName).emit('getHistoryResponse', {
                        error: false,
                        from: from,
                        to: upTo,
                        results: totalDataPoints
                    })
                    processedToMap.set(address + variableName, upTo)
                    release()
                })
            } catch (err) {
                errorHandler.errorHandleThrow(
                    `dataPointsSender.generateAndSendDataPoints ${address} ${variableName} ${from} ${upTo}`,
                    '')(err)
            }
        }

        return dataPointsSender
    }
    catch (err) {
        errorHandler.errorHandleThrow("dataPointsSender constructor", "could not start")(err)
    }

}
