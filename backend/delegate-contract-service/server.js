const amqp = require('amqplib/callback_api')
const settings = require('../common/settings')
const log = require('loglevel')
const Web3 = require('web3')
const db = require('../db')
const Parity = require('../common/parity')
const errorHandler = require('../common/errorHandlers')

const parity = Parity(db, log)
const parityUrl = "http://" + settings.ETHEROSCOPEPARITYMAINNET
const web3 = new Web3(new Web3.providers.HttpProvider(parityUrl))

log.enableAll()

const opt = { credentials: require('amqplib').credentials.plain(settings.RABBITMQ.user, settings.RABBITMQ.password) }

/**
 * Function responsible for processing given range of blocks.
 *
 * For each block checks all transactions from the block and retrieves created contracts' addresses.
 * Then, they are sent through RABBIT.
 *
 * @param begin
 * @param end
 * @param channel
 * @return {Promise<void>}
 */
async function processBlockRange(begin, end, channel) {
    for (let block = begin; block <= end; block++) {
        log.debug(`Block ${block} started`)
        let count = await web3.eth.getBlockTransactionCount(block)
        for (let i = 0; i < count; i++) {
            let transaction = await web3.eth.getTransactionFromBlock(block, i)
            let address = transaction.creates
            if (transaction.to == null) {
                try {
                    let contractInfo = await parity.getContract(address)
                    if (contractInfo !== null) {
                        channel.sendToQueue(settings.RABBITMQ.queue, new Buffer(address.toLowerCase()), {persistent: true});
                        log.debug(`${address} <- VERIFIED`)
                    }
                } catch (err) {
                    errorHandler.errorHandle(`[ERROR] Error occured for ${address}`)(err)
                }
            }
        }
        log.debug(`Block ${block} finished`)
        }
    log.debug(`Range ${begin} ${end} finished`)
}


amqp.connect(`amqp://${settings.RABBITMQ.address}`, opt, async (err, conn) => {
    if (err) {
        log.error('Failed to connect to RABBITMQ', err)
        process.exit(1)
    }
    conn.createChannel(async (err, ch) => {
        if (err) {
            log.error('Failed to create channel', err)
            conn.close()
            process.exit(1)
        }
        let latestBlock = await parity.getLatestBlock()

        let firstBlock = parseInt(process.argv[2])
        let lastBlock = Math.min(parseInt(process.argv[3]), latestBlock)

        await processBlockRange(firstBlock, lastBlock, ch)
        ch.close()
        conn.close()
    })
});
