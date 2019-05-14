const Parity = require('../common/parity.js')
const settings = require('../common/settings')

module.exports = function (app, db, log, validator) {
    let parityClient = new Parity(db, log, validator)


    function validAddress(address) {
        return address.length === 42 && validator.isHexadecimal(address.substr(2)) && address.substr(0, 2) === '0x'
    }

    /**
     * Checks if argument is a valid numeric value.
     *
     * @param {string} number string representing a number
     * @return {boolean} is argument numeric
     */
    function validNumeric(number) {
        return !Number.isNaN(parseInt(number)) && Number.isFinite(parseInt(number))
    }

    /**
     * Returns top contracts with the most lookups in last days.
     */
    app.get('/api/popular/', (req, res) => {
        db.getPopularContracts(settings.server.popularContractsLimit, settings.server.popularContractsDays)
            .then((result) => {
                return res.status(200).json(result)
            })
            .catch(err => {
                log.error(`[/popular] Error occured, ${err}`)
                return res.status(500).json('Internal error occured')
            })
    })

    /**
     * Returns information about contract's variables.
     * Returns null object, when contract is not verified on Etherscan.
     *
     */
    app.get('/api/explore/:contractAddress', (req, res) => {
        let address = req.params.contractAddress
        if (!validAddress(address)) {
            log.debug(`[/transactions] ${address} is not a valid address`)
            return res.status(400).json('Error - invalid contract hash')
        }
        return parityClient.getContract(address)
            .then((contract) => {
                if (contract === null)
                    return null
                db.addContractLookup(address.substr(2))
                    .catch(err => log.error(`[/explore] Could not add lookup for address ${address}, ${err}`))
                return parityClient.getContractVariables(contract)
            })
            .then((contractInfo) => {
                return res.status(200).json(contractInfo)
            })
            .catch((err) => {
                log.error(`[/explore] Error occured for contract ${address}, ${err}`)
                return res.status(500).json('Internal error occured')
            })
    })

    /**
     * Obtains transactions in contract under indexes [start,end).
     *
     * @param {Object} req request
     * @param {Object} res response
     * @param {string} req.params.contractAddress address of contract
     * @param {string} req.query.start start position of transactions sub-array
     * @param {string} req.query.end end position of transactions sub-array
     * @return {undefined}
     */
    app.get('/api/transactions/:contractAddress', (req, res) => {
        let contractAddress = req.params.contractAddress
        let startIndex = req.query.start
        let endIndex = req.query.end
        log.debug(`[/transactions] Getting transactions of contract ${contractAddress} from index ${startIndex} to index ${endIndex}`)

        if (!validAddress(contractAddress)) {
            log.debug(`[/transactions] ${contractAddress} is not a valid address`)
            return res.status(400).json('Error - invalid contract hash')
        }

        if (!validNumeric(startIndex) || !validNumeric(endIndex)) {
            log.debug(`[/transactions] start or end is not valid numeric values`)
            return res.status(400).json('Error - invalid indexes')
        }

        startIndex = parseInt(req.query.start)
        endIndex = parseInt(req.query.end)
        if (startIndex > endIndex) {
            log.debug(`[/transactions] startIndex > endIndex`)
            return res.status(400).json('Error - invalid indexes')
        }

        return parityClient.generateTransactions(contractAddress, startIndex, endIndex)
            .then(transactionsHistory => {
                transactionsHistory = transactionsHistory.map(t => {
                    return {
                        transactionHash: t.transactionHash,
                        blockNumber: t.Block.number,
                        timestamp: t.Block.timeStamp,
                        value: t.value,
                        transaction: {
                            from: t.from,
                            to: t.to,
                        }
                    }
                })
                res.status(200).json(transactionsHistory)
            })
            .catch((err) => {
                log.error(`[/transactions] error occured for contract ${address}, ${err}`)
                return res.status(500).json('Internal error occured')
            })
    })

    /**
     * Returns addresses stored in database that fit the pattern.
     */
    app.get('/api/search/:string', (req, res) => {
        let searchStr = req.params.string
        db.searchContract(searchStr)
            .then(contracts => {
                let results = []
                if (contracts !== null) {
                    contracts.forEach(contract => results.push({
                        contractHash: contract.hash,
                        name: contract.name,
                        abi: contract.abi
                    }))
                }
                return res.status(200).json(results)
            })
            .catch((err) => {
                log.error(`[/search] error occured for search ${searchStr}, ${err}`)
                return res.status(500).json('Internal error occured')
            })
    })
}
