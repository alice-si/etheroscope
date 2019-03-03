var validator = require('validator')
var log = require('loglevel')

var Web3Client = require('../common/parity')
var RabbitMq = require('../common/rabbitMq')
var db = require('../common/db.js')(log)
const errorHandler = require('../common/errorHandlers')
const Parity = require('../common/parity.js')
let parityClient = new Parity(db, log, validator)

var getTransactions = async (contractAddress, fromBlock, toBlock, startIndex, endIndex) => {
    try {
        let transactionsList = await parityClient.getHistory(contractAddress, fromBlock, toBlock)
        transactionsList = transactionsList.filter((transaction, index, self) =>
            index === self.findIndex(t => t.transactionHash === transaction.transactionHash)
        )
        let transactionsHistory = transactionsList.slice(Math.max(transactionsList.length - endIndex, 0),
            Math.max(transactionsList.length - startIndex, 0)).reverse()

        console.log(transactionsHistory.map(x => x.transactionHash))
        return Promise.all(transactionsHistory.map(async (transaction) => {
            transaction.timestamp = await parityClient.calculateBlockTime(transaction.blockNumber)
            transaction.transaction = await parityClient.getTransaction(transaction.transactionHash)
            transaction.value = parityClient.convertValue(transaction.transaction.value, 'ether')
            return transaction
        }))
    } catch (err) {
        errorHandler.errorHandleThrow('ContractInfoService', 'Problem with obtaining transactions')(err)
    }
}

RabbitMq.serveContractRaw((contractAddress, fromBLock, toBlock, startIndex, endIndex) => {
    db.addContractLookup(contractAddress.substr(2)).catch((err) => console.log('could not add contract lookup'))
    return getTransactions(contractAddress, fromBLock, toBlock, startIndex, endIndex)
        .then(async (transactions) => {
            return await JSON.stringify(transactions)
        })
})
