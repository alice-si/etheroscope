var Promise = require('bluebird')
var assert = require('assert');
// import other parts of project
var errorHandler = require('../common/errorHandlers')
let DataPointsClient = require('./dataPointsClient')

module.exports = function (io, log, validator) {
    try {

        var dataPointsSender = {}

        let db = require('../common/db.js')(log)
        var dataPointsClient = DataPointsClient(db, log, validator)
        var streamedSet = require('./streamedSet')()

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

        dataPointsSender.sendHistory = async function (address, method, socket) {
            try {
                /* Ignore invalid requests on the socket - the frontend should
                 * ensure these are not send, so any invalid addresses
                 * will not have been sent from our front end */
                assert(validAddress(address))

                var latestBlock = await dataPointsClient.latestFullBlockParity()
                // var latestBlockDirectAccess = await dataPointsClient.latestFullBlockBlockchain()
                var latestBlockDirectAccess = 20
                await assert(!isNaN(latestBlock) && !isNaN(latestBlockDirectAccess))
                // await console.log("latestBlock latestBLockDirectAccess",latestBlock,latestBlockDirectAccess)


                io.sockets.in(address + method).emit('latestBlock', {latestBlock: latestBlock})

                var cachedRange = await db.getCachedFromTo(address.substring(2), method)
                // var {cachedFrom, cachedUpTo} = setInitCached(cachedRange, latestBlockDirectAccess)
                var {cachedFrom, cachedUpTo} = setInitCached(cachedRange, 1000)

                sendAllDataPointsFromDB(address, method, cachedFrom, cachedUpTo, socket)

                await streamedSet.addChannel(address, method)
                var contractInfo = await dataPointsClient.getContract(address)

                cacheMorePoints(await contractInfo, address, method, cachedFrom, cachedUpTo, latestBlockDirectAccess, latestBlock)
            } catch (err) {
                errorHandler.errorHandleThrow("sendHistory", "in sned History")(err)
            }
        }

        async function sendAllDataPointsFromDB(address, method, from, to, socket) {
            try {

                var dataPoints = await db.getDataPoints(address.substr(2), method)
                dataPoints = await Promise.map(dataPoints, (elem) => [elem.timeStamp, elem.value])
                await socket.emit('getHistoryResponse', {
                    error: false,
                    from: from,
                    to: to,
                    results: dataPoints})

            } catch (err) {
                socket.emit('getHistoryResponse', {error: true})
                errorHandler.errorHandleThrow("sendAllDataPointsFromDB", "cant send data form db")(err)
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
                var chunkSize = 10000
                // upTo is exclusive - add 1 to latest block to check if upTo has gotten it
                if (totalFrom === totalUpTo) {
                    io.sockets.in(address + method).emit('getHistoryResponse', {
                        error: false,
                        from: totalFrom,
                        to: totalUpTo,
                        results: [[ 1488459400,-1,-1]]
                    })
                }
                // while (totalUpTo < latestBlockDirectAccess + 1) {
                //     chunkSize = 10000
                //     upTo = totalUpTo
                //     totalUpTo = await Math.min(upTo + chunkSize, latestBlockDirectAccess + 1)
                //     await generateAndSendDataPoints(
                //         contractInfo, address, method, upTo, totalUpTo, totalFrom, totalUpTo)
                // }
                while (1 < totalFrom) {
                    chunkSize = 10000
                    from = totalFrom
                    totalFrom = await Math.max(from - chunkSize, 1)
                    await generateAndSendDataPoints(
                        contractInfo, address, method, totalFrom, from, totalFrom, totalUpTo, true)
                }
                while (totalUpTo < latestBlock + 1) {
                    chunkSize = 10000
                    upTo = totalUpTo
                    totalUpTo = await Math.min(upTo + chunkSize, latestBlock + 1)
                    await generateAndSendDataPoints(
                        contractInfo, address, method, upTo, totalUpTo, totalFrom, totalUpTo, true)
                }
                // if (from === 1 && upTo === latestBlockDirectAccess + 1) { // end of reccursion
                if (from === 1 && upTo === latestBlock + 1) { // end of reccursion
                    log.info('Cached all points for ' + address + ' ' + method)
                    streamedSet.deleteChannel(address, method)
                }
            } catch (err) {
                errorHandler.errorHandleThrow("cacheMorePoints", "cant cache more points")(err)
            }
        }

// Send all points from from up to but not including to
        async function generateAndSendDataPoints(
            contractInfo, contractAddress, method, from, upTo, totalFrom, totalTo, useWeb3 = false) {
            try {
                let parsedContract = contractInfo.parsedContract // TODO method to index
                // Subtract 1 from to, because to is exclusive, and getHistory is inclusive
                var dataPoints = await dataPointsClient
                    .generateDataPoints(contractInfo, contractAddress, method, from, upTo, useWeb3)
                console.log('generated datapoitns:', dataPoints)
                // save to db
                db.addDataPoints(parsedContract.address.substr(2), method, dataPoints, totalFrom, totalTo)
                // dataPoints = await Promise.map(dataPoints, (elem) => {retrun [elem[], elem[1]]})
                io.sockets.in(contractAddress + method).emit('getHistoryResponse', {
                    error: false,
                    from: from,
                    to: upTo,
                    results: dataPoints
                })
            } catch (err) {
                errorHandler.errorHandleThrow("generateAndSendDataPoints", "")(err)
            }
        }

        return dataPointsSender
    }
    catch (err) {
        errorHandler.errorHandleThrow("dataPointsSender constructor", "could not start dataPointsClient")(err)
    }

}
