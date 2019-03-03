var Web3Client = require('../common/parity')
var RabbitMq = require('../common/rabbitMq')

let web3Client = new Web3Client(db, log, validator)
RabbitMq.serveBlockTimestamps((blockNumber) => web3Client.getBlockTime(blockNumber))
