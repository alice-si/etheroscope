var Web3Client = require('../common/parity')
var RabbitMq = require('../common/rabbitMq')
var validator = require('validator')
var log = require('loglevel')
var db = require('../common/db.js')(log)

let web3Client = new Web3Client(db, log, validator)

RabbitMq.serveBlockTimestamps((blockNumber) => web3Client.getBlockTime(blockNumber))
