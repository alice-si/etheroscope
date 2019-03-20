let axios = require('axios')
// var Web3Client = require('../contract-info/web3Client')
var Web3Client = require('../common/parity.js')
var ContractInfoService = require('../contract-info-service/contractInfoService')
module.exports = function (app, db, log, validator) {
    let web3Client = new Web3Client(db, log, validator)
    let contractInfoService = new ContractInfoService(db, log, validator)

    function validAddress(address) {
        return address.length === 42 && validator.isHexadecimal(address.substr(2)) && address.substr(0, 2) === '0x'
    }

    /**
     * Checks if argument is a numeric value
     *
     * @param {string} number string representing a number
     * @return {boolean} is argument numeric
     */
    function validNumeric(number) {
        return !Number.isNaN(parseInt(number)) && Number.isFinite(parseInt(number))
    }

    /**
     * Checks if argument is a correct block number, i.e. is a numeric string or 'latest' or 'pending' string
     *
     * @param {string} block value
     * @return {boolean} is argument correct block value
     */
    function validBlock(block) {
        return validNumeric(block) || block === 'latest' || block === 'pending'
    }

    app.get('/api/popular/', (req, res) => {
        db.getPopularContracts(10, 7)
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
            .catch((err) => console.log('could not add contract lookup'))
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

    /**
     * Obtains transactions in contract under indexes [start,end).
     * If not specified it looks for transaction from block 0 to the latest one.
     *
     * @param {Object} req request
     * @param {Object} res response
     * @param {string} req.params.contractAddress address of contract
     * @param {string} req.query.start start position of transactions sub-array
     * @param {string} req.query.end end position of transactions sub-array
     * @param {string} [req.query.from=0] start position of transactions sub-array
     * @param {string} [req.query.to=latest] end position of transactions sub-array
     * @return {undefined}
     */
    app.get('/api/transactions/:contractAddress', (req, res) => {
        let contractAddress = req.params.contractAddress
        let startIndex = req.query.start
        let endIndex = req.query.end
        let fromBlock = req.query.from || 0
        let toBlock = req.query.to || 'latest'

        if (!validAddress(contractAddress)) {
            log.debug('The requested contract address is wrong')
            return res.status(400).json('Error - invalid contract hash')
        }

        if (!validNumeric(startIndex) || !validNumeric(endIndex)) {
            log.debug('"Start" or "end" parameters are wrong')
            return res.status(400).json('Error - invalid indexes')
        }

        startIndex = (req.query.start) ? parseInt(req.query.start) : startIndex
        endIndex = (req.query.end) ? parseInt(req.query.end) : endIndex
        if (startIndex > endIndex) {
            log.debug('Wrong parameters: startIndex > endIndex')
            return res.status(400).json('Error - invalid indexes')
        }

        if (!validBlock(fromBlock) || !validBlock(toBlock)) {
            log.debug('"from" or "to" parameters are wrong')
            return res.status(400).json('Error - invalid block numbers')
        }

        fromBlock = (req.query.from) ? parseInt(req.query.from) : fromBlock
        toBlock = (req.query.to) ? parseInt(req.query.to) : toBlock
        if (validNumeric(fromBlock) && validNumeric(toBlock) && fromBlock > toBlock) {
            log.debug('Wrong parameters: fromBlock > toBlock')
            return res.status(400).json('Error - invalid indexes')
        }

        log.debug('Getting transactions of contract: ' + contractAddress + ' from index ' + startIndex +
            ' to index ' + endIndex + ' from block ' + fromBlock + ' to block ' + toBlock)

        return contractInfoService.getTransactions(contractAddress, fromBlock, toBlock, startIndex, endIndex)
            .then(transactionsHistory => {
                res.status(200).json(transactionsHistory)
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
        let contract = await db.searchContract(searchStr/* todo , variables, transactions*/);
        let results = []
        if (contract !== null) {
            results = [{contract.hash, contract.name, contract.abi}]
        }
        return res.status(200).json(results)
    })
}
