const axios = require('axios')
const Web3 = require('web3')
const Promise = require('bluebird')
const ReadWriteLock = require('rwlock')

const settings = require('./settings.js')


const lock = new ReadWriteLock()
const parityUrl = "http://" + settings.ETHEROSCOPEPARITYMAINNET
const web3 = new Web3(new Web3.providers.HttpProvider(parityUrl))

module.exports = function (db) {
    let parity = {}

    if (!web3.isConnected()) {
        console.log('Please start parity, have tried:', parityUrl)
        process.exit(1)
    }
    console.log('Successfully connected to parity, tried', parityUrl)

    /**
     *
     * Function responsible for sending number of latest block in ethereum.
     *
     * @return {Bluebird} number of latest block
     */
    parity.getLatestBlock = function() {
        return new Promise((resolve, reject) => {
            return web3.eth.getBlockNumber((error, block) => {
                if (error)
                    return reject(error)
                return resolve(block)
            })
        })
    }

    /**
     * Function responsible for fetching contract's information from etherscan API.
     *
     * @param address
     * @param network specifies ethereum's network we currently use
     *
     * @return {Promise<any>} contract's instance
     */
    async function getContractInfoFromEtherscan(address, network) {
        // TODO - store apiKey in settings
        let etherscanAPIKey = "RVDWXC49N3E3RHS6BX77Y24F6DFA8YTK23"

        let axiosGET = network === "mainnet" ? 'https://api' : `https://api-${network}`
        axiosGET += `.etherscan.io/api?module=contract&action=getabi&address=${address}&apikey=${etherscanAPIKey}`

        let response = await axios.get(axiosGET)

        return JSON.parse(response.data.result)
    }

    /**
     * Function responsible for generating contract's information and caching it in database.
     *
     * If information is already stored in database we simply take it from there.
     * Otherwise, we retrieve data from etherscan and cache it in database for future use.
     *
     * @param {string} address
     * @param {string} [network=mainnet] specifies ethereum's network we currently use
     *
     * @return {Promise<{parsedContract: Object, contractName: string}>}
     */
    parity.getContract = async function (address, network="mainnet") {
        let contractFromDB = await db.getContract(address.substr(2))
        let parsedABI = contractFromDB.contract

        // this scenario happens "in" the main server
        if (parsedABI === null) {
            parsedABI =  await getContractInfoFromEtherscan(address, network)
            await db.updateContractWithABI(address.substr(2), parsedABI)
            contractFromDB = await db.getContract(address.substr(2))
            parsedABI = contractFromDB.contract
        }

        let contract = web3.eth.contract(parsedABI)
        let parsedContract = contract.at(address)

        return { contractName: contractFromDB.contractName, parsedContract: parsedContract }
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

    /**
     * Function that computes value of given variable in a given block.
     *
     * @param {function} variableFunction
     * @param {number}   blockNumber
     * @return {Bluebird | Bluebird<any>} value of variable
     */
    function valueAtBlock(variableFunction, blockNumber) {
        let hex = '0x' + blockNumber.toString(16)
        web3.eth.defaultBlock = hex
        return new Promise((resolve, reject) => {
            return variableFunction((err, result) => {
                return (err ? reject(err) : resolve(parseInt(result.valueOf())))
            })
        })
    }

    /**
     * Function responsible for retrieving block's timestamp from ethereum
     *
     * @param {number} blockNumber
     *
     * @return {Promise<number>}
     */
    async function calculateBlockTime(blockNumber) {
        console.log('before')
        let block = await web3.eth.getBlock(blockNumber)
        console.log('after')
        return block.timestamp
    }


    /**
     * Function responsible for generating timestamp of given block.
     *
     * First step is checking if timestamp is already in database, in this case we return stored timestamp.
     * Otherwise, we lock (in case of simultaneous action that put data in database just after we checked)
     * and check again, if it is in database. If not, we compute timestamp of block and put it into database.
     *
     * @param {Number} blockNumber
     *
     * @return {Promise} timestamp of block
     */
    async function getBlockTime(blockNumber) {
        let result = await db.getBlockTime(blockNumber)
        if (result.length !== 0)
            return result[0].timeStamp

        return await new Promise((resolve, reject) => {
            try {
                lock.writeLock(blockNumber, async (release) => {
                    let result = await db.getBlockTime(blockNumber)

                    if (result.length !== 0) {
                        release()
                        return resolve(result[0].timeStamp)
                    }

                    console.log('before')
                    let time = await calculateBlockTime(blockNumber)
                    console.log('after')
                    // var timesStampOfFirstBlock = 1492107044
                    // var time = timesStampOfFirstBlock + (blockNumber * 15)
                    await db.addBlockTime([[blockNumber, time]])

                    release()

                    return resolve(time)
                })
            }
            catch (err) {
                reject(err)
            }
        })
    }

    /**
     * Function responsible for retrieving basic transaction information
     *
     * @param {String} transactionHash hash of contract transaction
     *
     * @return {Promise} transaction object
     */
    parity.getTransaction = async function (transactionHash) {
        return new Promise((resolve, reject) => {
            web3.eth.getTransaction(transactionHash, (err, res) => {
              if (err) {
                reject(err)
              } else {
                resolve(res)
              }
            })
        })
    }

    /**
     * Function responsible for converting value of transaction to another unit.
     *
     * @param {number|BigNumber|string} value wei value of transaction
     * @param {string} unit one of the following: https://github.com/ethereum/wiki/wiki/JavaScript-API#web3fromwei
     *
     * @return {string|BigNumber} converted value
     */
    parity.convertValue = function (value, unit) {
        try {
            return web3.fromWei(value, unit)
        } catch (err) {
            errorHandler.errorHandleThrow('ParityClient', 'Problem with converting transaction value')(err)
        }
    }

    parity.getHistory = async function (address, startBlock, endBlock) {
       return new Promise((resolve, reject) => {
            web3.eth.filter({fromBlock: startBlock, toBlock: endBlock, address: address}).get((err, res) => {
              if (err) {
                reject(err)
              } else {
                if (res.length === 0) console.log('getHistoryResult is empty:', res)
                resolve(res)
              }
            })
        })
=======
    /**
     * Function responsible for generating contract's events that occured in a given block range [startBlock, endBlock].
     *
     * @param {string} address
     * @param {Number} startBlock beginning od block frame
     * @param {Number} endBlock   end of block frame
     *
     * @return {Promise<any>} array of events
     */
    async function getHistory(address, startBlock, endBlock) {
        let filter = await web3.eth.filter({fromBlock: startBlock, toBlock: endBlock, address: address})

        return await new Promise((resolve, reject) => {
            filter.get((err, res) => {
                if (!err) {
                    return resolve(res)
                } else {
                    return reject(err)
                }
            })
        })
>>>>>>> parityv1 - TODO final check
    }

    /**
     * Main function responsible for generating data points for variable in block range [from, upTo]
     *
     * Consists of 3 steps:
     * Step 1 - generating all events in given range (getHistory call)
     * Step 2 - converting event to tuple [timestamp, value, blockNumber]
     * Step 3 - sorting elements (ascending by timestamp) and discarding consecutive elements with
     *          the same blockNumber (????) or value as predecessor
     *
     * @param {Object} parsedContract contract's instance
     * @param {string} variableName
     * @param {Number} from           beginning of block frame
     * @param {Number} upTo           end of block frame
     *
     * @return {Promise<Array>} array of tuples [timeStamp, value, blockNumber]
     */
    parity.generateDataPoints = async function (parsedContract, variableName, from, upTo) {
        let address = parsedContract.address
        let events = await getHistory(address, from, upTo)

        events = await Promise.map(events, event => {
            let blockNumber = event.blockNumber.valueOf()

            return Promise.all([getBlockTime(blockNumber),
                valueAtBlock(parsedContract[variableName], blockNumber), blockNumber])
        })

        events = events.sort((a, b) => a[0] - b[0])

        let prevElem = []
        let results = []

        events.forEach((elem, index) => {
            if (index === 0 || (elem[1] !== prevElem[1] && elem[2] !== prevElem[2])) {
                prevElem = elem
                results.push(elem)
            }
        })

        if (results.length > 0) {
            if (results[0][1] === this.curLastValue)
                results.shift()
            if (results.length > 0) {
                this.curLastValue = results[results.length - 1][1]
                console.log('newVal', this.curLastValue)
            }
        }

        return results
    }

    return parity
}

