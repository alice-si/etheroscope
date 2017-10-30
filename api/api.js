var Parity = require('./parity')
require('bluebird')
module.exports = (app) => {
  app.get('/api/explore/:contractAddress', (req, res) => {
    return Parity.getContract(req.params.contractAddress)
      .then((contract) => {
        return Parity.getContractVariables(contract)
      })
      .then((variables) => {
        console.log('vars??????: ' + JSON.stringify(variables))
        return res.status(200).json(variables)
      })
      .catch((err) => {
        console.log(err)
        return res.status(400).json(err.message)
      })
  })

  app.get('/api/getHistory/:contractAddress/:method', (req, res) => {
    const contractAddress = req.params.contractAddress
    const method = req.params.method
    let contract = null
    res.setTimeout(300000, () => {
      // TODO: Solve this computational problem
      console.log('Response timeout.')
    })
    // First we obtain the contract.
    return Parity.getContract(contractAddress)
    // Then, we get the history of transactions
      .then((parsedContract) => {
        contract = parsedContract
        console.log('Parsed Contract')
        return Parity.getHistory(contractAddress)
      })
      .then((events) => {
        console.log('Obtained Transaction History')
        return Parity.generateDataPoints(events, contract, method, res)
      })
      .then((results) => {
        console.log('generated data points: ' + results)
        res.status(200).json(results)
      })
      .catch((err) => {
        console.log(err)
        return res.status(400).json(err.message)
      })
  })
}
