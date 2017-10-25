let db = require('./db')
let Promise = require('bluebird')
const addr = '0xBd897c8885b40d014Fb7941B3043B21adcC9ca1C'
const daoaddr = 'bb9bc244d798123fde783fcc1c72d3bb8c189413'

console.log("Connected")
db.poolConnect().then(function () {
  db.getContractName(daoaddr, (err, res) => {
    console.log(res.recordset.length !== 0)
  })
})
