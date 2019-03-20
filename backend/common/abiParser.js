let log = require('loglevel')
let validator = require('validator')
let db = require('../db')
var Promise = require('bluebird')
var Parity = require('../common/parity.js')
var parityClient = Parity(db, log,validator)

// var address = "0xF973dfE8010CFd44070B1990841da192c7b3CeD9"
var address = '0x53eccC9246C1e537d79199d0C7231e425a40f896'

// db.getContract(address).then(console.log)
var web3 = parityClient.getWeb3()


// web3.eth.getStorageAt(0,address).then(console.log)

function isVariable(item) {
    return (item.outputs && item.outputs.length === 1 &&
        // item.outputs[0].type.indexOf('uint') === 0 &&
        item.inputs.length === 0)
}

async function cacheContractVariables(address, parsedAbi) {
    let variableNames = []
    await Promise.each(parsedAbi, (item) => {
        if (isVariable(item)) variableNames.push(item.name)
    })
    return variableNames
}

parityClient.getContract(address).then(async function(w){
    console.log(w.parsedContract.abi)
    var varNames = await cacheContractVariables(address,w.parsedContract.abi)
    console.log(varNames)
})




