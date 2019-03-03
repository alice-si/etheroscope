var amqp = require('amqplib/callback_api');
const Promise = require('bluebird')

var settings = require('../common/settings')

// channel names
const blockTimestampsRequestChannel = '@timestamps@'

/**
 *
 * @param blockNumber
 * @returns {string}
 */
function blockTimestampResponseChannel(blockNumber) {
    return '@block' + blockNumber + '@'
}

function connectRabbitMq(cb) {
    amqp.connect('amqp://' + settings.RABBITMQHOST, (err, conn) => {
        if (err) console.log(err)
        else cb(conn)
    });
}

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
            console.log("rabbitmq: '" + message + "' ->", queueName);
        });
        setTimeout(() => {
            conn.close();
            process.exit(0)
        }, 500);
    });
}

/***
 *
 * @param queueName
 * @param consume(msg)
 * @param onlyOnce - take only first message
 */
function subscribeQueue(queueName, consume, onlyOnce = false) {
    connectRabbitMq((conn) => {
        conn.createChannel((err, ch) => {
            ch.assertQueue(queueName, {durable: false});
            ch.consume(queueName, (msg) => {
                var message = msg.content.toString()
                console.log("rabbitmq: '" + message + "' <-", queueName);
                consume(message)
                if (onlyOnce) {
                    conn.close();
                    process.exit(0)
                }
            }, {noAck: true});
        });
    });
}

/**
 *
 * @param blockNumber
 * @param consume(msg) - do something with timestamp
 */
module.exports.getBlockTimestamp = (blockNumber, consume) => {
    sendToQueue(blockTimestampsRequestChannel, blockNumber.toString())
    subscribeQueue(blockTimestampResponseChannel(blockNumber), consume, true)
}

/**
 *
 * @param answerer(blockNumber) - function wich returns block timestamp
 */
module.exports.serveBlockTimestamps = (answerer) => {
    subscribeQueue(blockTimestampsRequestChannel, async (blockNumber) => {
        var timestamp = await answerer(blockNumber)
        sendToQueue(await blockTimestampResponseChannel(blockNumber), timestamp)
    })
}
