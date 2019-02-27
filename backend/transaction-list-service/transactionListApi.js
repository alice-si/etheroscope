var TransactionListService = require('./transactionListService')

module.exports = function (app, db, log, validator) {
    let transactionListService = new TransactionListService(db, log, validator)

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

    function validAddress(address) {
        return address.length === 42 && validator.isHexadecimal(address.substr(2)) && address.substr(0, 2) === '0x'
    }


    app.get('/:contractAddress/:fromBlock/:toBlock/:startIndex/:endIndex', (req, res) => {
        console.log('Reached API')
        let contractAddress = req.params.contractAddress
        let fromBLock = req.params.fromBlock
        let toBlock = req.params.toBlock
        let startIndex = req.params.startIndex
        let endIndex = req.params.endIndex
        if (!validAddress(contractAddress) || !validBlock(fromBLock) || !validBlock(toBlock)) {
            log.debug('User requested something stupid')
            let err = 'Error - invalid contract hash'
            return res.status(400).json(err)
        }
        return transactionListService.getTransactions(contractAddress, fromBLock, toBlock, startIndex, endIndex)
            .then((time) => {
                return res.status(200).json(time)
            })
            .catch((err) => {
                log.error(err)
                return res.status(400).json(err.message)
            })
    })

}
