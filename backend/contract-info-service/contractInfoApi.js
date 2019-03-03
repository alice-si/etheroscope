var Web3Client = require('../common/parity')
var RabbitMq = require('../common/rabbitMq')

let web3Client = new Web3Client(db, log, validator)
RabbitMq.serveContractInfo((contractHash) => {
    db.addContractLookup(address.substr(2)).catch((err) => console.log('could not add contract lookup'))
    return web3Client.getContract(address).then(async (contractInfo) => {
        return await JSON.stringify(await web3Client.getContractVariables(await contractInfo))
    })
})

