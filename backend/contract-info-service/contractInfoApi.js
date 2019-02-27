var Web3Client = require('../common/parity.js')

module.exports = function (app, db, log, validator) {
    let web3Client = new Web3Client(db, log, validator)

    function validAddress(address) {
        return address.length === 42 && validator.isHexadecimal(address.substr(2)) && address.substr(0, 2) === '0x'
    }

    app.get('/:contractAddress', (req, res) => {
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

}

