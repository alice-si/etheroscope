var Web3Client = require('../common/parity.js')

module.exports = function (app, db, log, validator) {
    let web3Client = new Web3Client(db, log, validator)

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


    app.get('/:blockNumber', (req, res) => {
        console.log('Reached API')
        let blockNumber = req.params.blockNumber
        if (!validBlock(blockNumber)) {
            log.debug('User requested something stupid')
            let err = 'Error - invalid contract hash'
            return res.status(400).json(err)
        }
        return web3Client.calculateBlockTime(blockNumber)
            .then((time) => {
                return res.status(200).json(time)
            })
            .catch((err) => {
                log.error(err)
                return res.status(400).json(err.message)
            })
    })

}
