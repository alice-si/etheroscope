const amqp = require('amqplib/callback_api')
const log = require('loglevel')
const Parity = require('../common/parity')
const Promise = require('bluebird')

const errorHandler = require('../common/errorHandlers')
const settings = require('../common/settings')
const db = require('../db')

log.enableAll()
const parity = Parity(db, log)

const opt = { credentials: require('amqplib').credentials.plain(settings.RABBITMQ.user,
        settings.RABBITMQ.password) }

/**
 * Function responsible for caching all variables' values in a given range [from, upTo]
 *
 * Consists of 3 steps
 * Step 1 - parity,getHistory call (getting events in a given range)
 * Step 2 - caching blocks' timestamps
 * Step 3 - caching values for each variable
 *
 * @param contractInfo
 * @param variables
 * @param from
 * @param upTo
 * @return {Promise<*>}
 */
async function cacheDataPoints(contractInfo, variables, from, upTo) {
    let address = contractInfo.parsedContract.options.address
    try {
        let methods = contractInfo.parsedContract.methods

        let events = await parity.getHistory(address, from, upTo)

        for (let event of events) {
            await parity.getBlockTime(event.blockNumber.valueOf())
        }

        await Promise.each(variables, async variable => {
            if (variable.cachedUpTo < upTo) {
                let datapoints = await parity.processEvents(events, methods[variable.variableName])
                await db.addDataPoints(address.substr(2), variable.variableName, datapoints, upTo)
                variables.cachedUpTo = upTo
            }
        })
    } catch (err) {
        errorHandler.errorHandleThrow(`cacheDataPoints ${address} ${from} ${upTo}`, '')(err)
    }
}


/**
 * Main function responsible for processing and caching contract's data in database.
 *
 * Consists of _ steps
 * Step 1 - preparing data (latestBlock, contractInfo, variables)
 * Step 2 - adding cachedUpTo for each variable and sorting variables by cachedUpTo in ascending order
 * Step 3 - iterating over block ranges and calling cacheDataPoints for each of them
 *
 * @param address
 */
async function processContract(address) {
    try {
        log.debug(`Started processing contract ${address}`)

        let latestBlock = await parity.getLatestBlock()
        let contractInfo = await parity.getContract(address)
        let variables = await parity.getContractVariables(contractInfo)
        variables = await Promise.all(variables.variables.map(async variable => {
            let cachedUpTo = await db.getCachedUpTo(address.substring(2), variable.variableName)
            return {
                variableName: variable.variableName,
                cachedUpTo: cachedUpTo == null ? settings.dataPointsService.cachedFrom - 1 : cachedUpTo
            }
        }))

        variables.sort((v1, v2) => v1.cachedUpTo - v2.cachedUpTo)

        if (variables.length > 0) {
            let actUpTo = variables[0].cachedUpTo
            while (actUpTo < latestBlock) {
                let actFrom = actUpTo + 1
                actUpTo = Math.min(latestBlock, actFrom + settings.dataPointsService.cacheChunkSize)
                await cacheDataPoints(contractInfo, variables, actFrom, actUpTo)
            }
        }

        log.debug(`Finished processing contract ${address}`)
    } catch (err) {
        errorHandler.errorHandle(`processContract ${address}`)(err)
        process.exit(1)
    }
}


amqp.connect(`amqp://${settings.RABBITMQ.address}`, opt, (err, conn) => {
    if (err) {
        log.error('Failed to connect to RABBITMQ', err)
        process.exit(1)
    }
    log.debug('Successfully connected to RABBITMQ')
    conn.createChannel((err, ch) => {
        if (err) {
            log.error('Failed to create a channel', err)
            process.exit(1)
        }
        log.debug('Successfully created channel')
        ch.assertQueue(settings.RABBITMQ.queue, { durable: true, messageTtl: settings.RABBITMQ.messageTtl })

        ch.consume(settings.RABBITMQ.queue, async msg => {
            await processContract(msg.content.toString())
            ch.ack(msg)
        }, { noAck: false })
    })
})