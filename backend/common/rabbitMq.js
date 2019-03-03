var amqp = require('amqplib/callback_api');
const Promise = require('bluebird')

var settings = require('../common/settings')

// channel names
const blockTimestampsChannelName = 'timestamps'
const contractInfoChannelName = 'contractinfo'

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
module.exports.getContractInfo = (contractHash) => new Promise((resolve, reject) => {
    try {
        contractHash = contractHash.toString()
        sendToQueue(requestChannel(blockTimestampsChannelName), contractHash)
        subscribeQueue(responseChannel(blockTimestampsChannelName, contractHash), resolve, true)
    }
    catch (err) {
        reject(err)
    }
})

/**
 *
 * @param answerer(blockNumber) - function wich returns block timestamp
 */
module.exports.serveContractInfo = (answerer) => {
    subscribeQueue(requestChannel(blockTimestampsChannelName), async (contractHash) => {
        var contractInfo = await answerer(contractHash)
        sendToQueue(await responseChannel(blockTimestampsChannelName, contractHash), contractInfo)
    })
}

