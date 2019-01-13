const axios = require('axios')
const Web3 = require('web3')
var Promise = require('bluebird')
var ReadWriteLock = require('rwlock')
var lock = new ReadWriteLock()

var settings = require('./settings.js')
var parityUrl = settings.ETHEROSCOPEPARITYMAINNET
parityUrl = "http://" + parityUrl
const web3 = new Web3(new Web3.providers.HttpProvider(parityUrl))
var errorHandler = require('./errorHandlers')

module.exports = function (db, log, validator) {
    const parity = {}

    if (!web3.isConnected()) {
        console.log('Please start parity, have tried:', parityUrl)
        process.exit(1)
    }
    console.log('Successfully connected to parity, tried', parityUrl)
    // var address = "0xF973dfE8010CFd44070B1990841da192c7b3CeD9"

    parity.getLatestBlock = function () {
        return new Promise((resolve, reject) => {
            return web3.eth.getBlockNumber((error, block) => {
                if (error) {
                    log.error('Error getting block number' + error)
                }
                return resolve(block)
            })
        })
    }

    // parity.getContract = function (address) {
    //     return new Promise((resolve, reject) => {
    //         db.getContract(address.substr(2))
    //             .then((result) => {
    //                 If we don't have the contract, get it from etherscan
    // if (result.contract === null) {
    //     const axiosGET = 'https://api.etherscan.io/api?module=contract&action=getabi&address=' // Get ABI
    //     const axiosAPI = '&apikey=RVDWXC49N3E3RHS6BX77Y24F6DFA8YTK23'
    //     return axios.get(axiosGET + address + axiosAPI)
    //         .then((res) => {
    //             let parsedContract = parity.parseContract(res.data.result, address)
    //             Add the contract to the database, assuming it is already in there (with a name)
    // db.updateContractWithABI(address.substr(2), res.data.result)
    //     .catch((err) => {
    //         log.error('parity.js: Error adding contract abi to the db')
    //         log.error(err)
    //     })
    // return resolve({ parsedContract: parsedContract, contractName: result.contractName })
    // })
    // .catch((err) => {
    //     log.error('parity.js: Etherscan.io API error: ' + err)
    //     return reject(err)
    // })
    // }
    // let parsedContract = parity.parseContract(result.contract, address)
    // return resolve({ contractName: result.contractName, parsedContract: parsedContract })
    // })
    // })
    // }
// Obtaining Contract information from ABI and address
    parity.parseContract = async function (desc, address) {
        // console.log('desc', desc)
        try {
            var contractABI = (typeof desc === 'string') ? await JSON.parse(JSON.stringify(desc)) : desc
            var Contract = await web3.eth.contract(contractABI)
            return await Contract.at(address)
        } catch (err) {
            errorHandler.errorHandle("parseContract")(err)
        }
    }

    async function getContractInfoFromEtherscan(address) {
        // TODO: choose axiosGET between ethereum and rinkeby // const axiosGET = 'https://api.etherscan.io/api?module=contract&action=getabi&address=' // Get ABI
        const axiosGET = 'https://api.etherscan.io/api?module=contract&action=getabi&address=' // Get ABI
        const axiosAPI = '&apikey=RVDWXC49N3E3RHS6BX77Y24F6DFA8YTK23'
        console.log('will get from Etherscan ',axiosGET + address + axiosAPI)
        return await axios.get(axiosGET + address + axiosAPI)
    }

    parity.getContract = async function (address) {
        try {
            var contractFromDB = await db.getContract(address.substr(2))
            var parsedABI

            if (contractFromDB.contract === null) { // If we don't have the contract, get it from etherscan
                var contractFromEtherscan = await getContractInfoFromEtherscan(address)
                parsedABI = contractFromEtherscan.data.result
                await db.updateContractWithABI(address.substr(2), parsedABI)
                contractFromDB = await db.getContract(address.substr(2))
            }

            // log.debug("Parsed ABI is:", parsedABI)

            parsedABI = contractFromDB.contract
            var parsedContract = await parity.parseContract(parsedABI, address)
            return {contractName: contractFromDB.contractName, parsedContract: parsedContract}
        } catch (error) {
            errorHandler.errorHandleThrow("web3client.js:getContract(" + address + ")", "could not get (" + address + ")")(error)
        }
    }

    function isVariable(item) {
        return (item.outputs && item.outputs.length === 1 &&
            item.outputs[0].type.indexOf('uint') === 0 &&
            item.inputs.length === 0)
    }

    async function cacheContractVariables(address, parsedAbi) {
        let variableNames = []
        await Promise.each(parsedAbi, (item) => {
            if (isVariable(item)) variableNames.push(item.name)
        })
        await db.addVariables(address, variableNames)
    }

    parity.getContractVariables = async function (contractInfo) {
        let parsedContract = await contractInfo.parsedContract
        let address = await parsedContract.address.substr(2)
        let contractName = contractInfo.contractName
        var parsedAbi = parsedContract.abi

        var variables = await db.getVariables(address)

        if (variables.length === undefined || variables.length === 0) {
            await cacheContractVariables(address, parsedAbi)
            variables = await db.getVariables(address)
        }

        // if (variables.length === 0 ) throw "still only 0 variabels"

        let variableNames = []
        await Promise.map(variables, (elem) => variableNames.push(elem), {concurrency: 5})
        return {variables: variableNames, contractName: contractName}
    }

    // Query value of variable at certain block
    parity.queryAtBlock = function (query, block) {
        let hex = '0x' + block.toString(16)
        web3.eth.defaultBlock = hex
        return new Promise((resolve, reject) => {
            return query((err, result) => {
                return (err ? reject(err) : resolve(parseInt(result.valueOf())))
            })
        })
    }

    parity.calculateBlockTime = async function (blockNumber) {
        return await web3.eth.getBlock(blockNumber).timestamp
    }

    parity.getBlockTime = async function (blockNumber) {
        // Check the database for the blockTimeMapping
        var result = await db.getBlockTime(blockNumber)
        if (result.length !== 0) return result[0].timeStamp
        // If it isn't in the database, we need to calculate it
        // acquire a lock so that we don't calculate this value twice
        // Using a global lock to protect the creation of locks...

        return await new Promise((resolve, reject) => {
            lock.writeLock(blockNumber, async (release) => {
                // Check again if it is in the db, since it may have been
                // added whilst we were waiting for the lock
                var result = await db.getBlockTime(blockNumber)
                if (result.length !== 0) {
                    release()
                    return resolve(result[0].timeStamp)
                }
                // If it still isn't in there, we calcuate it and add it
                var time = await web3.calculateBlockTime(blockNumber)
                await db.addBlockTime([[blockNumber, time, 1]])
                release()
                return resolve(time)
            })
        })
    }

    parity.getHistory = async function (address, method, startBlock, endBlock) {
        let filter = await web3.eth.filter({fromBlock: startBlock, toBlock: endBlock, address: address})
        var result = await new Promise((resolve, reject) => {
            filter.get((error, result) => {
                if (!error) {
                    return resolve(result)
                } else {
                    return reject(error)
                }
            })
        })
        if (result.length === 0) console.log('getHistoryResult is empty:',result)
        return result
    }

    parity.generateDataPoints = function (eventsA, contract, method,
                                          totalFrom, totalTo) {
        return new Promise((resolve, reject) => {
            // log.debug('Generating data points')
            Promise.map(eventsA, (event) => {
                // [(time, value, blockNum)]
                return Promise.all([parity.getBlockTime(event.blockNumber.valueOf()),
                    parity.queryAtBlock(contract[method], event.blockNumber.valueOf()), event.blockNumber.valueOf()])
            }, {concurrency: 5})
            // Sort the events by time
                .then((events) => {
                    return (events.sort((a, b) => {
                        return a[0] - b[0]
                    }))
                })
                .then((events) => {
                    let prevBlock = 0
                    let results = []
                    events.forEach((elem, index) => {
                        if (elem[2] !== prevBlock) {
                            prevBlock = elem[2]
                            results.push(elem)
                        }
                    })
                    return results
                })
                .then((events) => {
                    return db.addDataPoints(contract.address.substr(2), method, events, totalFrom, totalTo)
                        .then(() => {
                            if (events.length > 0) {
                                log.debug('Added ' + events.length + ' data points for ' + contract.address + ' ' + method)
                            }
                            return resolve(events)
                        })
                })
                .catch((err) => {
                    log.error('Data set generation error: ' + err)
                    return reject(err)
                })
        })
    }

    parity.getRange = function (contractAddress, parsedContract, method, from, upTo) {
        console.log('!!!parity.getRange(',contractAddress, method, from, upTo)
        return parity.getHistory(contractAddress, method, from, upTo - 1)
            .then(function (events) {
                // console.log('!!!parity.getHistory(result:',events)
                return parity.generateDataPoints(events, parsedContract, method,
                    from, upTo)
            })
    }

    parity.getWeb3 = async function () {
        return await web3
    }

    return parity
}

