const Parity = require('../common/parity.js')
const errorHandler = require('../common/errorHandlers')
const Promise = require('bluebird')

module.exports = function (db, log, validator) {
  const contractInfoService = {}
  let parityClient = new Parity(db, log, validator)

  /**
   * Returns list of contract transactions from startIndex to endIndex in transactions history, excluding the second one.
   * TODO: Maybe it's worth storing res in db since this method does 2 * (endIndex - startIndex) + 1 parity api calls
   *
   * @param {string} contractAddress address of contract
   * @param {string} fromBlock block to start looking for transactions
   * @param {string} toBlock block to end looking for transactions
   * @param {number} startIndex block to start looking for transactions
   * @param {number} endIndex block to end looking for transactions
   *
   * @return {Bluebird} array of transactions
   */
  contractInfoService.getTransactions = async function (contractAddress, fromBlock, toBlock, startIndex, endIndex) {
    try {
      let transactionsList = await parityClient.getHistory(contractAddress, fromBlock, toBlock)
      let transactionsHistory = transactionsList.slice(startIndex, endIndex)

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

  return contractInfoService
}
