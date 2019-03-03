var Web3Client = require('../common/parity')
var RabbitMq = require('../common/rabbitMq')
var validator = require('validator')
var log = require('loglevel')
var db = require('../common/db.js')(log)

let web3Client = new Web3Client(db, log, validator)

RabbitMq.serveContractRaw((contractAddress) => {
    db.addContractLookup(contractAddress.substr(2)).catch((err) => console.log('could not add contract lookup'))
    return web3Client.getContractRaw(contractAddress).then(async (contractInfo) => {
        return await JSON.stringify(await contractInfo)
    })
})

RabbitMq.serveContractVariables((contractAddress) => {
    db.addContractLookup(contractAddress.substr(2)).catch((err) => console.log('could not add contract lookup'))
    return web3Client.getContract(contractAddress).then(async (contractInfo) => {
        return await JSON.stringify(await web3Client.getContractVariables(await contractInfo))
    })
})

