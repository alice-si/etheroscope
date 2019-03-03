var amqp = require('amqplib/callback_api');
const Promise = require('bluebird')

var settings = require('../common/settings')

// channel names
const blockTimestampsChannelName = 'timestamps'
const contractRawChannelName = 'contractraw'
const contractVariablesChannelName = 'contractvariables'
const transactionsChannelName = 'transactions'

/**
 *
 * @param channelName
 * @returns {string}
 */
var requestChannel = (channelName) => '@request:' + channelName + '@'

/**
 *
 * @param channelName
 * @param query
 * @returns {string}
 */
var responseChannel = (channelName, query) => '@response:' + channelName + ':' + query + '@'

/**
 *
 * @param cb
 */
var connectRabbitMq = (cb) => amqp.connect('amqp://' + settings.RABBITMQHOST,
    (err, conn) => {
        if (err) console.log(err)
        else cb(conn)
    });

/**
 *
 * @returns {*}
 */
var defaultTimeout = (conn) => setTimeout(() => conn.close(), 500)

/**
 *
 * @param queueName
 * @param message
 */
function sendToQueue(queueName, message) {
    connectRabbitMq((conn) => {
        conn.createChannel((err, ch) => {
            ch.assertQueue(queueName, {durable: false});
            ch.sendToQueue(queueName, new Buffer(message));
            ch.close()
            console.log("rabbitmq: '" + message + "' ->", queueName);
        });
        defaultTimeout(conn)
    });
}

/***
 *
 * @param queueName
 * @param consume(msg,ch)
 * @param onlyOnce - take only first message
 */
var subscribeQueue = (queueName, consume, onlyOnce = false) => {
    connectRabbitMq((conn) => {
        conn.createChannel((err, ch) => {
            ch.assertQueue(queueName, {durable: false});
            ch.consume(queueName, (msg) => {
                var message = msg.content.toString()
                console.log("rabbitmq: '" + message + "' <-", queueName);
                consume(message, ch)
                if (onlyOnce) {
                    defaultTimeout(conn)
                }
            }, {noAck: true});
        });
    });
}

/**
 *
 * @param blockNumber
 */
module.exports.getBlockTimestamp = (blockNumber) => new Promise((resolve, reject) => {
    try {
        blockNumber = blockNumber.toString()
        sendToQueue(requestChannel(blockTimestampsChannelName), blockNumber)
        subscribeQueue(responseChannel(blockTimestampsChannelName, blockNumber), resolve, true)
    }
    catch (err) {
        reject(err)
    }
})

/**
 *
 * @param answerer(blockNumber) - function wich returns block timestamp
 */
module.exports.serveBlockTimestamps = (answerer) => {
    subscribeQueue(requestChannel(blockTimestampsChannelName), async (blockNumber) => {
        var timestamp = await answerer(blockNumber)
        sendToQueue(await responseChannel(blockTimestampsChannelName, blockNumber), timestamp)
    })
}

/**
 *
 * @param contractHash
 */
module.exports.getContractRaw = (contractHash) => new Promise((resolve, reject) => {
    try {
        contractHash = contractHash.toString()
        sendToQueue(requestChannel(contractRawChannelName), contractHash)
        subscribeQueue(responseChannel(contractRawChannelName, contractHash), resolve, true)
    }
    catch (err) {
        reject(err)
    }
})

/**
 *
 * @param answerer(blockNumber) - function wich returns block timestamp
 */
module.exports.serveContractRaw = (answerer) => {
    subscribeQueue(requestChannel(contractRawChannelName), async (contractHash) => {
        var contractRaw = await answerer(contractHash)
        sendToQueue(await responseChannel(contractRawChannelName, contractHash), contractRaw)
    })
}

/**
 *
 * @param contractHash
 */
module.exports.getContractVariables = (contractHash) => new Promise((resolve, reject) => {
    try {
        contractHash = contractHash.toString()
        sendToQueue(requestChannel(contractVariablesChannelName), contractHash)
        subscribeQueue(responseChannel(contractVariablesChannelName, contractHash), resolve, true)
    }
    catch (err) {
        reject(err)
    }
})

/**
 *
 * @param answerer(blockNumber) - function wich returns block timestamp
 */
module.exports.serveContractVariables = (answerer) => {
    subscribeQueue(requestChannel(contractVariablesChannelName), async (contractHash) => {
        var contractVariables = await answerer(contractHash)
        sendToQueue(await responseChannel(contractVariablesChannelName, contractHash), contractVariables)
    })
}

/**
 *
 * @param contractAddress
 * @param fromBlock
 * @param toBlock
 * @param startIndex
 * @param endIndex
 */
module.exports.getTransactions = (contractAddress, fromBlock, toBlock, startIndex, endIndex) => new Promise((resolve, reject) => {
    try {
        var args = {contractAddress, fromBlock, toBlock, startIndex, endIndex}
        sendToQueue(requestChannel(transactionsChannelName), JSON.stringify(args))
        subscribeQueue(responseChannel(transactionsChannelName, contractHash), resolve, true)
    }
    catch (err) {
        reject(err)
    }
})

/**
 *
 * @param answerer(contractAddress, fromBlock, toBlock, startIndex, endIndex) - function wich returns block timestamp
 */
module.exports.serveTransactions = (answerer) => {
    subscribeQueue(requestChannel(transactionsChannelName), async (args) => {
        var {contractAddress, fromBlock, toBlock, startIndex, endIndex} = JSON.parse(args)
        var transactions = await answerer(contractAddress, fromBlock, toBlock, startIndex, endIndex)
        sendToQueue(await responseChannel(transactionsChannelName, args), transactions)
    })
}
