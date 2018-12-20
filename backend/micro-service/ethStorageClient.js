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
    console.log('Eth-Storage  connected to path',BLOCKCHAINPATH)

    async function decodeValueInBuffer(rawVal) {
        var isBuff =await Buffer.isBuffer(rawVal)
        var isNotNan = !isNaN(rawVal)
        return (isBuff || isNotNan) ? (isNotNan) ? rawVal : await FORMATTER.bufferToInt(await rawVal.toString('hex'), 16) : -1
        //     TODO: is reading int proper?
        // return (Buffer.isBuffer(rawVal)) ? FORMATTER.bufferToInt(rawVal) : -1
    }

    async function convert(event) { // [(time, value, blockNum)]
        return await Promise.all([web3Client.getBlockTime(event.block), decodeValueInBuffer(event.val), event.block])
    }

    async function getRangeWeb3(web3, address, index, startBlockNumber, endBlockNumber) {
        var self = this;

        var array = []
        console.log('getRangeWeb3 array before',array,'start end block',startBlockNumber,endBlockNumber)

        while (startBlockNumber < endBlockNumber) {
            var value =await web3.eth.getStorageAt(address,index,startBlockNumber)
            // console.log('getRangeWeb3 value',value)
             value = await parseInt(value)
            await array.push({block: startBlockNumber, val: value});

            startBlockNumber = startBlockNumber + 1
        }

        async function removeDuplicates(array) {
            var result = []
            await result.push(array[0])
            for (var i = 1; i < array.length; i++) {
                if (result[result.length - 1]['val'].toString() !== array[i]['val'].toString()) {
                    await result.push(array[i])
                }
            }
            return result;
        };

        array = await removeDuplicates(array)
        console.log('getRangeWeb3 array',array)
        return array
    };

    // Send all points from from up to but not including to
    ethStorageClient.generateDataPoints = async function (contractInfo, contractAddress, method, from, upTo, useWeb3 = false) {
        try {
            let contract = contractInfo.parsedContract
            var dataPoints
            if (!useWeb3) {
                dataPoints = await ethStorage.promiseGetRange(contractAddress, 0, from, upTo)
                console.log('data points direct access',dataPoints)
            }
            else {
                var web3 = await web3Client.getWeb3()
                // console.log("this is web3",web3,"this is getRangeWb3)",getRangeWeb3)
                dataPoints = await getRangeWeb3(web3,contractAddress, 0, from, upTo)
                console.log('data points WEB3',dataPoints)
            }
            return await Promise.map(dataPoints, convert, {concurrency: 5})
        } catch (err) {
            errorHandle("ethStorage.generateDataPoints")(err)
            throw err
        }
    }

    ethStorageClient.latestFullBlock = function () {
        return new Promise(
            (resolve, reject) => ethStorage.latestHeaderNumber(ethStorage.promiseEnd(resolve, reject))
        )
    }

    return ethStorageClient

}

