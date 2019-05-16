const errorHandler = require('../common/errorHandlers')
const Parity = require('../common/parity')
const streamedSet = require('./streamedSet')()
const settings = require('../common/settings.js')
const validator = require('validator')

module.exports = function (io, log) {
    try {
        let dataPointsSender = {}

        const db = require('../db')

        const parityClient = Parity(db, log)

        function validAddress(address) {
            return address.length === 42 && validator.isHexadecimal(address.substr(2)) && address.substr(0, 2) === '0x'
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
         * @param {string} socketId
         */
        dataPointsSender.sendHistory = async function (address, variableName, socketId) {
            try {
                log.debug(`dataPointsSender.sendHistory ${address} ${variableName}`)

                if (validAddress(address)) {
                    let latestBlock = await parityClient.getLatestBlock()
                    let curLatestBlock = await streamedSet.addChannel(address, variableName, latestBlock)

                    let cachedUpTo = await db.getCachedUpTo(address, variableName)
                    cachedUpTo = isNaN(cachedUpTo) ? settings.dataPointsService.cachedFrom - 1 : cachedUpTo

                    if (curLatestBlock) {
                        io.sockets.in(address + variableName).emit('latestBlock', {latestBlock: curLatestBlock})

                        await sendAllDataPointsFromDB(address, variableName, cachedUpTo, socketId)
                    } else {
                        io.sockets.in(address + variableName).emit('latestBlock', {latestBlock: latestBlock})

                        await sendAllDataPointsFromDB(address, variableName, cachedUpTo, socketId)

                        let contractInfo = await parityClient.getContract(address)

                        await cacheMorePoints(contractInfo, variableName, cachedUpTo, latestBlock)
                    }
                } else {
                    log.debug(`datapointsSender.sendHistory ${address} is not a valid address`)
                    io.sockets.in(address + variableName).emit('getHistoryResponse', { error: true })
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
         * @param {Number} to
         * @param {String} socketId
         */
        async function sendAllDataPointsFromDB(address, variableName, to, socketId) {
            try {
                log.debug(`dataPointsSender.sendAllDataPointsFromDB ${address} ${variableName} ${to}`)

                let dataPoints = await db.getDataPoints(address, variableName)
                dataPoints = dataPoints == null ? [] : dataPoints
                let new_dataPoints = dataPoints.map(dataPoint =>
                    [dataPoint.Block.timeStamp, dataPoint.value, dataPoint.Block.number])

                io.to(socketId).emit('getHistoryResponse', {
                    error: false,
                    from: settings.dataPointsService.cachedFrom,
                    to: to,
                    results: new_dataPoints
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
                let chunkSize = settings.dataPointsService.cacheChunkSize

                while (totalUpTo < latestBlock) {
                    [from, totalUpTo] = [totalUpTo + 1, Math.min(totalUpTo + chunkSize, latestBlock)]
                    await generateAndSendDataPoints(contractInfo, variableName, from, totalUpTo)
                }
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

                // TODO method to index

                let dataPoints = await parityClient.generateDataPoints(contractInfo, variableName, from, upTo)
                await parityClient.getBlockTime(upTo)
                await db.addDataPoints(address, variableName, dataPoints, upTo)

                io.sockets.in(address + variableName).emit('getHistoryResponse', {
                    error: false,
                    from: from,
                    to: upTo,
                    results: dataPoints
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
