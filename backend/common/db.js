const mysql = require('promise-mysql')

const settings = require('./settings.js')
const mysqlConnectionOptions = settings.mysqlConnectionOptions

const errorHandle = require('../common/errorHandlers').errorHandle

const pool = mysql.createPool(mysqlConnectionOptions)

async function connect() {
    try {
        var results = await pool.query('SELECT 1 + 1 AS solution')
        console.log('MYSQL connection test "1+1" the solution is: ', results[0].solution)

    } catch (err) {
        errorHandle('MYSQL connection failed')(err)
    }
}

connect()

/* DEFINE TABLES FOR BULK INSERT
 * Here we define the table schema
 * so that we can use them for bulk inserts
 */

/* Variables Table
 */
function getNewVariablesTable(contractAddress, variables) {
    // console.log('getNewDataPointsTable')
    var sqlFormatValues = []
    variables.forEach((variable) => {
        sqlFormatValues.push([contractAddress, variable, null, null])
    })

    return {
        sql: 'insert into variables (contractHash, variableName, cachedFrom, cachedUpTo) values ?',
        values: sqlFormatValues
    }
}

/**
 * Function responsible for preparing string for sql query
 *
 * Iterates over all elements of valuesArray and puts them together.
 *
 * @param {Array} valuesArray
 *
 * @return {string}
 */
function buildValueString(valuesArray) {
    let result = ''

    for (let i = 0; i < valuesArray.length; i++) {
        result += '('

        for (let j = 0; j < valuesArray[i].length; j++) {
            result += `\'${valuesArray[i][j]}\', `
        }

        result = result.slice(0, -2)
        result += '), '
    }

    return result.slice(0, -2)
}

module.exports = function (log) {
    let db = {}

    /* This function takes in an array of arrays of the form:
     * values = ['0x0123456789', 'name'], and returns a promise
     */
    db.addContracts = function (values) {
        console.log('db.addContracts')
        return new Promise(function (resolve, reject) {

            var valueString = buildValueString(values)
            var sql = 'insert into contracts (contractHash, name) values ' + valueString
            pool.query(sql)
                .then(() => {
                    return resolve()
                })
                .catch((err) => {
                    log.error('db.js: Error in addContracts')
                    log.error(err)
                    return reject(err)
                })
        })
    }

    db.updateContractWithABI = function (address, parsedABI) {
        console.log('db.updateContractsWithABI',JSON.stringify(parsedABI).length)
        return new Promise(async function (resolve, reject) {
            //TODO: update or insert?
            var ABI = await JSON.stringify(parsedABI)
            var name = "Ethereum contract"
            var sql = 'insert into contracts (contractHash, name, abi) values (' +
                '\'' + address + '\', ' +
                '\''+ name +'\',' +
                '\'' + ABI + '\'' +
                ') ON DUPLICATE KEY UPDATE name=\''+name+'\', abi=\''+ABI+'\''
            await pool.query(sql).catch(errorHandle('db.js: Error in updateContractWithABI'))
            return resolve()
        })
    }

    db.addContractLookup = function (address) {
        console.log('db.addContractLookup')
        return new Promise(function (resolve, reject) {

            var sql = 'insert into contractLookupHistory (contractHash, date) values (\'' + address + '\', CURDATE())'
            // console.log('addContractLookup:sql', sql)
            pool.query(sql)
                .then(resolve)
                .catch((err) => {
                    console.log("takie tam: ", sql)
                    log.error('db.js: Error in addContractLookup, this error is not invasing, probably duplicate entry')
                    reject(err)
                })
        })
    }

    /* Gets the most popular contracts in the last timeUnit timeAmount
     * where timeUnit is a string ('day', 'week', 'month' etc)
     * and timeAmount is the number of time units passed
     * limit is the number of contracts to return
     */
    db.getPopularContracts = function (timeUnit, timeAmount, limit) {
        console.log('db.getPopularContracts:timeUnit', timeUnit)
        return new Promise(function (resolve, reject) {

            var sql = 'select contractHash, COUNT(*) as searches ' +
                'from contractLookupHistory where DATEDIFF(date, CURDATE()) < ' + timeAmount + ' ' +
                'GROUP BY contractHash ' +
                'ORDER BY searches desc ' +
                'limit ' + limit
            var joined = 'select contracts.contractHash, name, searches from (' + sql + ') as popular join contracts on contracts.contractHash = popular.contractHash'
            pool.query(joined)
                .then((result) => {
                    return resolve(result)
                })
                .catch((err) => {
                    log.error('db.js: Error in getPopularContracts')
                    log.error(err)
                    return reject(err)
                })
        })
    }

    /**
     * Function responsible for retrieving information about contract from database.
     *
     * Returns {contractName: null, contract: null}, where there is no data in database.
     * Otherwise, returns contractName and contract info stored in database.
     *
     * @param contractHash
     * @return {Promise<Object>} returns object {contractName: {string}, contract: {Object}}
     */
    db.getContract = async function (contractHash) {
        log.debug(`db.getContract ${contractHash}`)

        let sql = `SELECT name, abi FROM contracts WHERE contractHash=\'${contractHash}\'`

        let results = await pool.query(sql)

        if (results.length !== 0)
            return { contractName: results[0].name, contract: JSON.parse(results[0].abi) }
        else
            return { contractName: null,  contract: null }
    }

    /**
     * Caches information about value of a given variable in a given block.
     * Timestamps are currently ignored.
     *
     * Consists of 2 steps:
     * Step 1 adds values into database.
     * Step 2 updates  cached range for this variable.
     *
     * @param {string}   contractAddress
     * @param {string}   variableName
     * @param {Object[]} values          elements are [timestamp, value, blockNumber]
     * @param {Number}   cachedFrom      beginning of range of cached blocks
     * @param {Number}   cachedUpTo      end of range of cached blocks
     */
    db.addDataPoints = async function (contractAddress, variableName, values, cachedFrom, cachedUpTo) {
        log.debug(`db.addDataPoints ${contractAddress} ${variableName} ${values} ${cachedFrom} ${cachedUpTo}`)

        if (values.length !== 0) {
            let sqlFormatValues = []

            values.forEach((elem) => {
                sqlFormatValues.push([contractAddress, variableName, elem[1], elem[2]])
            })

            let dataPointsTable = {
                sql: 'INSERT INTO dataPoints (contractHash, variableName, value, blockNumber) values ?',
                values: sqlFormatValues
            }

            await pool.query(dataPointsTable.sql, [dataPointsTable.values])
        }

        let sql = `UPDATE variables SET cachedFrom=\'${cachedFrom}\', cachedUpTo=\'${cachedUpTo}\'` +
            `WHERE contractHash=\'${contractAddress}\' and variableName=\'${variableName}\'`

        await pool.query(sql)

    }

    /* This function takes a variable */
    db.addVariables = function (address, variables) {
        console.log('db.addVariables:', variables)
        return new Promise(function (resolve, reject) {

            let variablesTable = getNewVariablesTable(address, variables)
            pool.query(variablesTable.sql, [variablesTable.values])
                .then(() => {
                    return resolve()
                })
                .catch((err) => {
                    console.log('sql query', variablesTable.sql, 'values [', variablesTable.values, ']')
                    console.log('err', err)
                    reject()
                })
        })
    }

    /**
     * Returns all timestamps and values for a given contract and variable.
     *
     * @param {string} contractHash
     * @param {string} variableName
     *
     * @returns {Promise<Array>} promise representing array of Objects {timeStamp, value}
     */
    db.getDataPoints = async function (contractHash, variableName) {
        log.debug(`db.getDataPoints ${contractHash} ${variableName}`)

        let sql = `SELECT timeStamp, value FROM dataPoints NATURAL JOIN blocks ` +
            `WHERE contractHash=\'${contractHash}\' AND variableName=\'${variableName}\'`

        return await pool.query(sql)
    }

    db.getVariables = function (contractHash) {
        console.log('db.getVariables')
        return new Promise(function (resolve, reject) {

            var sql = 'select v.variableName, u.unit, u.description from variables as v left join variableUnits as u on v.unitID = u.id where v.contractHash=\'' + contractHash + '\''
            pool.query(sql)
                .then((results) => {
                    return resolve(results)
                })
                .catch((err) => {
                    log.error('db.js: Error in getVariables')
                    log.error(err)
                    return reject(err)
                })
        })
    }

    /**
     * Function responsible for returning timestamp of a given block.
     *
     * @param blockNumber
     *
     * @return {Promise<Array>} array of object {timestamp}
     */
    db.getBlockTime = async function (blockNumber) {
        log.debug(`db.getBlockTime ${blockNumber}`)

        let sql = 'SELECT timeStamp FROM blocks WHERE blockNumber=\'' + blockNumber + '\''
        return await pool.query(sql)
    }

    /**
     * Function responsible for adding block's timestamp into database.
     *
     * @param {Array} values array of [blockNumber, timeStamp]
     */
    db.addBlockTime = async function (values) {
        log.debug(`db.addBlockTime ${values}`)

        let valueString = buildValueString(values)

        let sql = `INSERT INTO blocks (blockNumber, timeStamp) VALUES ${valueString}`
        await pool.query(sql)
    }

    /* This function returns *all* the variables in a given date range
     * for a given contract hash
     */
    db.getDataPointsInDateRange = function (contractHash, method, from, to) {
        console.log('db.getDataPointsInDateRange')
        return new Promise(function (resolve, reject) {

            var sql =
                'select timeStamp, value from (dataPoints inner join blocks on dataPoints.blockNumber = blocks.blockNumber) ' +
                'where dataPoints.contractHash=\'' + contractHash +
                '\' and (dataPoints.blockNumber between \'' + from + '\' and \'' + to + '\')' +
                ' and (dataPoints.variableName=\'' + method + '\')'
            pool.query(sql)
                .then((results) => {
                    return resolve(results)
                })
                .catch((err) => {
                    log.error('db.js: Error in getDataPointsInDateRange')
                    log.error(err)
                    return reject(err)
                })
        })
    }

    /**
     * Returns range of cached data in database for a given contract and variable.
     *
     * @param {string} contractHash
     * @param {string} variableName
     *
     * @returns {Promise<Object>} returns Object {cachedFrom, cachedUpTo}
     */
    db.getCachedFromTo = async function (contractHash, variableName) {
        log.debug(`db.getCachedFromTo ${contractHash} ${variableName}`)

        let sql = `SELECT cachedFrom, cachedUpTo FROM variables WHERE contractHash='${contractHash}'` +
            `AND variableName='${variableName}'`

        let results = await pool.query(sql)
        return {
            cachedFrom: results[0].cachedFrom,
            cachedUpTo: results[0].cachedUpTo
        }
    }

    db.getLatestCachedBlockTime = function () {
        console.log('db.getLatestCachedBlockTime')
        return new Promise(function (resolve, reject) {

            var sql = 'select MAX(blockNumber) from blocks where userLog=0'
            pool.query(sql).then((results) => {
                console.log('db.getLatestCachedBlockTime:results (will neeed [0][\'\'],', results)
                return resolve(results[0][''])
            })
        })
    }

    db.searchContract = function (pattern, variables, transactions) {
        console.log('db.searchContract')
        return new Promise(function (resolve, reject) {

            let interspersedPattern = intersperse(pattern, '%')
            let searchField = 'name'
            // if the pattern is a hash, rather than a name
            if (pattern[0] === '0' && (pattern[1] === 'x' || pattern[1] === 'X')) {
                pattern = pattern.substr(2)
                interspersedPattern = pattern + '%'
                searchField = 'contractHash'
            }

            var sql = 'select *, strcmp(' + searchField + ', \'' + pattern +
                '\') as nameDiff' + ' from contracts where ' + searchField + ' LIKE \'' +
                interspersedPattern + '\''

            console.log('sql with difference: ', sql)

            if (variables !== null && variables.length > 0) {
                for (let i = 0; i < variables.length; i++) {
                    sql += ' and contracthash in' +
                        ' (select contracthash from datapoints inner join blocks' +
                        ' on datapoints.blocknumber = blocks.blocknumber where' +
                        ' variableName = \'' + variables[i].name + '\''
                    if (variables[i].endTime !== '' && variables[i].startTime !== '') {
                        sql += ' and (timestamp between ' + variables[i].startTime + ' and ' +
                            variables[i].endTime + ')'
                    }
                    if (variables[i].min !== null && variables[i].max !== null) {
                        sql += ' and (value between ' + variables[i].min +
                            ' and ' + variables[i].max + ')'
                    }
                    sql += ')'
                }
            }

            if (transactions !== null && transactions.length > 0) {
                for (let i = 0; i < transactions.length; i++) {
                    sql += ' and contracthash in' +
                        ' (select contracthash from datapoints inner join blocks' +
                        ' on datapoints.blocknumber = blocks.blocknumber where' +
                        ' timestamp between ' + transactions[i].startTime + ' and ' +
                        transactions[i].endTime + ') ' +
                        'limit 5'
                }
            }

            sql += ' order by nameDiff DESC;'
            pool.query(sql).then((results) => {
                return resolve(results)
            })
                .catch((err) => {
                    log.error(err)
                })
        })
    }

    let intersperse = function (str, intrsprs) {
        str = str.split('').map((elem) => {
            return elem + intrsprs
        })
        return ('%' + str.join(''))
    }

    return db
}
