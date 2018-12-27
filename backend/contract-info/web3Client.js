const axios = require('axios')
const Web3 = require('web3')
var Promise = require('bluebird')
var ReadWriteLock = require('rwlock')
var lock = new ReadWriteLock()

var errorHandle = require('../common/errorHandlers').errorHandle
var errorCallbackHandle = require('../common/errorHandlers').errorCallbackHandle

var settings = require('../common/settings.js')
var WEB3HOST = settings.ETHEROSCOPEGETHHOST
const PARITYURL = 'http://' + WEB3HOST // api connector


async function getContractInfoFromEtherscan(address) {
    // TODO: choose axiosGET between ethereum and rinkeby // const axiosGET = 'https://api.etherscan.io/api?module=contract&action=getabi&address=' // Get ABI
    const axiosGET = 'https://api.etherscan.io/api?module=contract&action=getabi&address=' // Get ABI
    const axiosAPI = '&apikey=RVDWXC49N3E3RHS6BX77Y24F6DFA8YTK23'
    console.log('will get from Etherscan ',axiosGET + address + axiosAPI)
    return await axios.get(axiosGET + address + axiosAPI)
}

module.exports = Web3Client

function Web3Client(db, log, validator) {
    var self = this
    self.db = db
    self.log = log
    self.validator = validator
    self.web3 = new Web3(new Web3.providers.HttpProvider(PARITYURL))
    if (!self.web3.isConnected()) {
        console.log('Please start self.web3, have tried: ', PARITYURL)
        process.exit(1)
    } else {
        console.log('Successfully connected to self.web3, have tried: ', PARITYURL)
    }
}

Web3Client.prototype.getWeb3 = function () {
    var self = this
    console.log(self.web3.toString().slice(30))
    return self.web3
}

Web3Client.prototype.getLatestBlock = function () {
    var self = this
    return new Promise((resolve,reject)=>{
        return self.web3.eth.getBlockNumber((error,result)=>{
            console.log("yolo",result,error)
            if (error) reject(error)
            return resolve(result)
        })
    })
}

// Obtaining Contract information from ABI and address
Web3Client.prototype.parseContract = async function (desc, address) {
    // console.log('desc', desc)
    var self = this
    try {
        var contractABI = (typeof desc === 'string') ? await JSON.parse(JSON.stringify(desc)) : desc
        var Contract = await self.web3.eth.contract(contractABI)
        return await Contract.at(address)
    } catch (err) {
        errorHandle("parseContract")(err)
    }
}

Web3Client.prototype.getContract = async function (address) {
    var self = this
    try {
        var contractFromDB = await self.db.getContract(address.substr(2))
        var parsedABI = contractFromDB.contract

        if (parsedABI === null) { // If we don't have the contract, get it from etherscan
            var contractFromEtherscan = await getContractInfoFromEtherscan(address)
            var ABI = contractFromEtherscan.data.result
            self.db.updateContractWithABI(address.substr(2), ABI)
        }

        // console.log('ABI',parsedABI, 'address',address)
        var parsedContract = await self.parseContract(parsedABI,address)

        console.log(parsedContract.address)

        return {contractName: contractFromDB.contractName, parsedContract: parsedContract}
    } catch (error) {
        console.log("THIS IS ERR", error)
        errorHandle("self.web3client.js:getContract(" + address + ")")(error)
        return null
    }
}

function isVariable(item) {
    return (item.outputs && item.outputs.length === 1 &&
        item.outputs[0].type.indexOf('uint') === 0 &&
        item.inputs.length === 0)
}

Web3Client.prototype.cacheContractVariables = async function (address, ABI) {
    var self = this
    let variableNames = []
    await Promise.each(ABI, (item) => {
        if (isVariable(item)) variableNames.push(item.name)
    })
    await self.db.addVariables(address, variableNames)
}


Web3Client.prototype.getContractVariables = async function (contractInfo) {
    var self = this
    let parsedContract = await contractInfo.parsedContract
    let address = await parsedContract.address.substr(2)
    let contractName = contractInfo.contractName
    var ABI = parsedContract.abi

    var variables = await self.db.getVariables(address)

    if (variables.length === 0) {
        await self.cacheContractVariables(address, ABI)
    }

    let variableNames = []
    await Promise.map(variables, (elem) => variableNames.push(elem), {concurrency: 5})
    return {variables: variableNames, contractName: contractName}
}

Web3Client.prototype.calculateBlockTime = async function (blockNumber) {
    var self = this
    return await self.web3.eth.getBlock(blockNumber).timestamp
}

Web3Client.prototype.getBlockTime = async function (blockNumber) {
    // Check the database for the blockTimeMapping
    var self = this
    var result = await self.db.getBlockTime(blockNumber)
    if (result.length !== 0) return result[0].timeStamp
    // If it isn't in the database, we need to calculate it
    // acquire a lock so that we don't calculate this value twice
    // Using a global lock to protect the creation of locks...

    return await new Promise((resolve, reject) => {
        lock.writeLock(blockNumber, async (release) => {
            // Check again if it is in the self.db, since it may have been
            // added whilst we were waiting for the lock
            var result = await self.db.getBlockTime(blockNumber)
            if (result.length !== 0) {
                release()
                return resolve(result[0].timeStamp)
            }
            // If it still isn't in there, we calcuate it and add it
            var time = await self.web3.calculateBlockTime(blockNumber)
            await self.db.addBlockTime([[blockNumber, time, 1]])
            release()
            return resolve(time)
        })
    })
}


