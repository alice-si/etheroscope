let axios = require('axios')

module.exports = function (app, db, log, validator) {
    let ethClient = require('../transactions-list/parity.js')(db, log, validator)
    let Promise = require('bluebird')

    function validAddress (address) {
        return address.length === 42 && validator.isHexadecimal(address.substr(2)) && address.substr(0, 2) === '0x'
    }

    app.get('/tester/hello', async (req, res) => {
        try {
            var result = "Hello world form tester api."
            return res.status(200).json(result)
        }
        catch (err) {
            return res.status(400).json(err)
        }
    })

    app.get('/tester/db/:query', async (req, res) => {
        try {
            let query = req.params.query
            var result = await db.anyQuery(query)
            return res.status(200).json(result)
        }
        catch (err) {
            return res.status(400).json(err)
        }
    })

    app.get('/tester/db/tables', async (req, res) => {
        try {
            db.anyQuery('show tables')
            let query = req.params.query
            var result = await db.anyQuery(query)
            return res.status(200).json(result)
        }
        catch (err) {
            return res.status(400).json(err)
        }
    })

    app.get('/tester/web3Api/isSyncing', async (req, res) => {
        try {
            var settings = await require('./settings.js')
            var WEB3HOST = settings.ETHEROSCOPEGETHHOST
            const PARITYURL = 'http://' + WEB3HOST // api connector
            const web3 = new Web3(new Web3.providers.HttpProvider(PARITYURL))

            var result = await web3.eth.isSyncing()
            return res.status(200).json(result)
        }
        catch (err) {
            return res.status(400).json(err)
        }
    })

}

