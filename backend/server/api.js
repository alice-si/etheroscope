let axios = require('axios')
var Web3Client = require('../contract-info/web3Client')

module.exports = function (app, db, log, validator) {
  let web3Client = new Web3Client(db, log, validator)
  let Promise = require('bluebird')

  function validAddress (address) {
    return address.length === 42 && validator.isHexadecimal(address.substr(2)) && address.substr(0, 2) === '0x'
  }

  app.get('/api/popular/', (req, res) => {
    db.getPopularContracts('day', 7, 10)
      .then((result) => {
        return res.status(200).json(result)
      })
      .catch((err) => {
        return res.status(400).json(err)
      })
  })

  app.get('/api/explore/:contractAddress', (req, res) => {
    console.log('Reached API')
    let address = req.params.contractAddress
    if (!validAddress(address)) {
      log.debug('User requested something stupid')
      let err = 'Error - invalid contract hash'
      return res.status(400).json(err)
    }
    db.addContractLookup(address.substr(2))
        .catch((err)=>console.log('could not add contract lookup'))
    return web3Client.getContract(address)
      .then((contractInfo) => {
        return web3Client.getContractVariables(contractInfo)
      })
      .then((contractInfo) => {
        return res.status(200).json(contractInfo)
      })
      .catch((err) => {
        log.error(err)
        return res.status(400).json(err.message)
      })
  })

  app.get('/api/search/', (req, res) => {
    return res.status(200).json([])
  })

  app.post('/api/search/:string', (req, res) => {
    let searchStr = req.params.string
    let variables = null
    let transactions = null
    if (typeof req.body.variables !== 'undefined') {
      variables = req.body.variables
    }
    if (typeof req.body.transactions !== 'undefined') {
      transactions = req.body.transactions
    }
    db.searchContract(searchStr, variables, transactions).then((results) => {
      if (results === null) {
        results = []
      }
      return res.status(200).json(results)
    })
  })
}
