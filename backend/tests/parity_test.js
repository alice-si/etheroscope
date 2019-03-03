const Web3 = require('web3')
var settings = require('../common/settings.js')

// var parityUrl = settings.ETHEROSCOPEPARITYMAINNET
var parityUrl = settings.ETHEROSCOPEPARITYTESTNET
let log = require('loglevel')
let validator = require('validator')
let db = require('../common/db.js')(log)
var Promise = require('bluebird')
var Parity = require('../common/parity.js')
var parityClient = Parity(db, log,validator)

parityUrl = "http://" + parityUrl

console.log(parityUrl)


var abi = '[{"constant":false,"inputs":[{"name":"newDepositary_function","type":"uint256"}],"name":"setDepositary_function","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"retrait_3","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_User_1","type":"address"},{"name":"_Securities_1","type":"address"},{"name":"_Standard_1","type":"uint256"}],"name":"Eligibility_Group_1","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newDepositary_function_control","type":"uint256"}],"name":"setDepositary_function_control","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_User_5","type":"address"},{"name":"_Securities_5","type":"address"},{"name":"_Standard_5","type":"uint256"}],"name":"Eligibility_Group_5","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"getDepositary_function","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"Standard_4","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"Securities_2","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"User_1","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"retrait_5","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newCmd_control","type":"uint256"}],"name":"setCmd_control","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"User_2","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getID_control","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_User_3","type":"address"},{"name":"_Securities_3","type":"address"},{"name":"_Standard_3","type":"uint256"}],"name":"Eligibility_Group_3","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"Standard_1","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"Securities_1","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getID","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_User_2","type":"address"},{"name":"_Securities_2","type":"address"},{"name":"_Standard_2","type":"uint256"}],"name":"Eligibility_Group_2","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"getCmd","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"User_5","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"User_3","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"Standard_5","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newID_control","type":"uint256"}],"name":"setID_control","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"Standard_3","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"Standard_2","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"Securities_3","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getCmd_control","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newID","type":"uint256"}],"name":"setID","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"Securities_5","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"User_4","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"Securities_4","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"retrait_2","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"retrait_1","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newCmd","type":"uint256"}],"name":"setCmd","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_User_4","type":"address"},{"name":"_Securities_4","type":"address"},{"name":"_Standard_4","type":"uint256"}],"name":"Eligibility_Group_4","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"getDepositary_function_control","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"retrait_4","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"}]'


// var address = '0x2c6775BfC1179cf9666297FCD15c65781E850B64'
// var address = '0xAC7FA90A250D8240EEa4d7F8b89294B55Ed84b9f'
// var address = '0x576D318810416FB41cffc06ac507d1bd50101e82'
// var address = '0x4C3da77d8BCe020D4128995D7F92C5bD0919fCc3'
// var address = '0xdf92c7D29b9782685C3a8C628Fe22Ec7F5E39878'
// var address = '0xDC926b36B7FAAdAa1DaA1C8bFb60B6e7a88faDAe'
// var address = '0x53eccC9246C1e537d79199d0C7231e425a40f896'
// var address = '0xecE9Fa304cC965B00afC186f5D0281a00D3dbBFD'
var address = '0xE6FDF91D942137dB636af7dE0C545834f2429fd0'
var method = "total"
var from = "1"
// var upTo = "400"
var upTo = parityClient.getLatestBlock()

const web3 = new Web3(new Web3.providers.HttpProvider(parityUrl))

console.log('Web3 is connected?',web3.isConnected())

async function getRangeTest(address,method,from,upTo){
    var contractInfo = await parityClient.getContract(address,"kovan")
    console.log('Address',contractInfo.parsedContract.address)
    var getRangeRes = await parityClient.getRange(address, contractInfo.parsedContract, method, from, await upTo)
    console.log('!!!parity.getRange(result:',getRangeRes)
    return getRangeRes
}

getRangeTest(address,method,from,upTo).then(console.log)

// var MyContract = web3.eth.contract(abi);
// var myContractInstance = MyContract.at(address);
//
// console.log(web3.eth.getStorageAt(address,1,30))
const axios = require('axios')

async function getContractInfoFromEtherscan(address,network) {
    // TODO: choose axiosGET between ethereum and rinkeby // const axiosGET = 'https://api.etherscan.io/api?module=contract&action=getabi&address=' // Get ABI
    var axiosGET = 'https://api'
    if (network) axiosGET = axiosGET + "-" + network
    console.log("!!@@#",axiosGET)
    axiosGET += '.etherscan.io/api?module=contract&action=getabi&address=' // Get ABI
    const axiosAPI = '&apikey=RVDWXC49N3E3RHS6BX77Y24F6DFA8YTK23'
    console.log('will get from Etherscan ',axiosGET + address + axiosAPI)
    return await axios.get(axiosGET + address + axiosAPI)
}

// getContractInfoFromEtherscan('0xef1A329402B14253A474d5b9188f1cE30C9c3260',"kovan").then(console.log)

new Promise((resolve, reject) => {
    return web3.eth.getBlockNumber((error, block) => {
        if (error) {
            log.error('Error getting block number' + error)
        }
        return resolve(block)
    })
}).then(console.log)
