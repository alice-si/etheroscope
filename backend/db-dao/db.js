"use strict";

const models = require('./models');
const sequelize = models.sequelize

/**
 *
 * @returns {Promise<void>}
 */
async function testConnection() {
    try {
        return await sequelize.authenticate();
    } catch (e) {
        console.error("testConnection()")
    }
}

/**
 *
 * @returns {Promise<Array<Model>>}
 */
async function getContracts() {
    try {
        return await models.Contract.findAll();
    } catch (e) {
        console.error("EEEEEEE!")
    }
}

/**
 *
 * @param contractHash
 * @returns {Promise<Model>}
 */
async function getContract(contractHash) {
    try {
        return await models.Contract.findOne({where: {hash: [contractHash]}});
    } catch (e) {
        console.error("EEEEEEE!")
    }
}

/**
 * todo
 * @param values  [{ hash: 'barfooz', name: '', abi: ''}, { hash: 'barfooz', name: '', abi: ''}, { hash: 'barfooz', name: '', abi: ''},]
 * @returns {Promise<Array<Model>>}
 */
async function addContracts(values) {
    try {
        return await models.Contract.bulkCreate(values);
    } catch (e) {
        console.error("EEEEEEE!")
    }
}

/**
 * todo
 * @param contractHash
 * @returns {Promise<*>}
 */
async function addContractLookup(contractHash) {
    try {
        let contract = await models.Contract.findOne({where: {hash: contractHash}});
        let lookup = await models.ContractLookup.build({date: new Date()});
        await lookup.setContract(contract, {save: false});
        return await lookup.save()
        // return await contract.addContractLookup(lookup);
    } catch (e) {
        console.error("EEEEEEE!")
    }
}


/**
 * todo
 * @param limit1
 * @param lastDays
 * @returns {Promise<void>}
 */
async function getPopularContracts(limit1, lastDays = 7) {
    // noinspection JSCheckFunctionSignatures
    try {
        return await sequelize.query('SELECT hash, Count(t2.id) as cnt FROM Contracts as t1 LEFT JOIN ContractLookups as t2 ON t1.hash = t2.ContractHash where t2.date >= DATE_SUB(NOW(), INTERVAL $2 DAY) group by t1.hash order by cnt desc limit $1 ',
            {raw: true, bind: [limit1, lastDays], type: sequelize.QueryTypes.SELECT}
        )
    } catch (e) {
        console.error("EEEEEEE!")
    }
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
async function addDataPoints(contractAddress, variableName, values, cachedFrom, cachedUpTo) {
    try {
        let variable = await models.Variable.findOne({where: {ContractHash: contractAddress, name: variableName}});
        let bulkmap = [];
        if (variable && values.length !== 0) {
            values.forEach((elem) => {
                bulkmap.push({value: elem[1], BlockNumber: elem[2], VariableId: variable.id})
            });
            await variable.update({cachedFrom: cachedFrom, cachedUpTo: cachedUpTo})
            return await models.DataPoint.bulkCreate(bulkmap);
        }
    } catch (e) {
        console.error("EEEEEEE!")
    }
}

/**
 * Returns all timestamps and values for a given contract and variable.
 * @param contractAddress
 * @param variableName
 * @returns {Promise<Array<Model>>} -> with assosiated models -> maybe todo better
 */
async function getDataPoints(contractAddress, variableName) {
    try {
        let variable = await models.Variable.findOne({where: {ContractHash: contractAddress, name: variableName}});
        return await models.DataPoint.findAll({include: [Block], where: {VariableId: variable.id}});
    } catch (e) {
        console.error("EEEEEEE!")
    }
}


/**
 * todo
 * @param values  [{ ContractHash: 'barfooz', name: '', cachedFrom: '', cachedUpTo: '', UnitId:'' }, ... ]
 * @returns {Promise<Array<Model>>}
 */
async function addVariables(values) {
    try {
        return await models.Variable.bulkCreate(values);
    } catch (e) {
        console.error("EEEEEEE!")
    }
}


async function getVariables(contractHash) {
    try {
        return await models.Variable.findAll({where: {ContractHash: contractHash}});
    } catch (e) {
        console.error("EEEEEEE!")
    }
}


/**
 *
 * @param blockNumber
 * @returns {Promise<*>}
 */
async function getBlockTime(blockNumber) {
    try {
        let block = await models.Block.findOne({where: {number: blockNumber}});
        return block.timeStamp;
    } catch (e) {
        console.error("EEEEEEE!")
    }
}

/**
 * todo
 * @param values [{ number: 34, timeStamp: 23}, ... ]
 * @returns {Promise<Array<Model>>}
 */
async function addBlocks(values) {
    try {
        return await models.Block.bulkCreate(values);
    } catch (e) {
        console.error("EEEEEEE!")
    }
}

/**
 * todo
 * @param contractHash
 * @param variableName
 * @param from
 * @param to
 * @returns {Promise<Array<Model>>}
 */
async function getDataPointsInBlockNumberRange(contractHash, variableName, from, to) {
    try {
        let variable = await models.Variable.findOne({where: {ContractHash: contractHash, name: variableName}});
        return await models.DataPoint.findAll({
            // include: [models.Block],
            where: {VariableId: variable.id, blockNumber: {[Op.between]: [from, to]}}
        });
    } catch (e) {
        console.error("EEEEEEE!")
    }
}

/**
 * todo
 * @returns {Promise<*>}
 */
async function getLatestCachedBlock() {
    try {
        return await models.Block.max('number')
    } catch (e) {
        console.error("EEEEEEE!")
    }
}

/**
 * Returns range of cached data in database for a given contract and variable.
 *
 * @param {string} contractHash
 * @param {string} variableName
 *
 * @returns {Promise<Object>} returns Object {cachedFrom, cachedUpTo}
 */

async function getCachedFromTo(contractHash, variableName) {
    let variable = await models.Variable.findOne({where: {ContractHash: contractHash, name: variableName}});
    return {
        cachedFrom: variable.cachedFrom,
        cachedUpTo: variable.cachedUpTo
    }
}

/**
 *
 * @param contractHash
 * @param contractABI
 * @returns {Promise<this>}
 */
async function updateContractABI(contractHash, contractABI) {
    let contract = await models.Contract.findOne({where: {hash: [contractHash]}});
    return await contract.update({abi: contractABI})
}

/*
###########################################################################
###########################################################################
###########################################################################
 */


/**
 * @param {Boolean} [force=false] If force is true, each Model will run `DROP TABLE IF EXISTS`, before it tries to create its own table
 */
(function initDB(force = false) {
    testConnection().then(() => {
        sequelize.sync({force: force})
    })
})(true);

module.exports.testConnection = testConnection;
module.exports.addContracts = addContracts;
module.exports.getContracts = getContracts;
// module.exports.addDataPoints = addDataPoints; todo test
module.exports.getContract = getContract;
module.exports.addContractLookup = addContractLookup;
module.exports.getPopularContracts = getPopularContracts;


//
// todo jeszcze ta funkcja
//     db.searchContract = function (pattern, variables, transactions) {
//         console.log('db.searchContract')
//         return new Promise(function (resolve, reject) {
//
//             let interspersedPattern = intersperse(pattern, '%')
//             let searchField = 'name'
//             // if the pattern is a hash, rather than a name
//             if (pattern[0] === '0' && (pattern[1] === 'x' || pattern[1] === 'X')) {
//                 pattern = pattern.substr(2)
//                 interspersedPattern = pattern + '%'
//                 searchField = 'contractHash'
//             }
//
//             var sql = 'select *, strcmp(' + searchField + ', \'' + pattern +
//                 '\') as nameDiff' + ' from contracts where ' + searchField + ' LIKE \'' +
//                 interspersedPattern + '\''
//
//             console.log('sql with difference: ', sql)
//
//             if (variables !== null && variables.length > 0) {
//                 for (let i = 0; i < variables.length; i++) {
//                     sql += ' and contracthash in' +
//                         ' (select contracthash from datapoints inner join blocks' +
//                         ' on datapoints.blocknumber = blocks.blocknumber where' +
//                         ' variableName = \'' + variables[i].name + '\''
//                     if (variables[i].endTime !== '' && variables[i].startTime !== '') {
//                         sql += ' and (timestamp between ' + variables[i].startTime + ' and ' +
//                             variables[i].endTime + ')'
//                     }
//                     if (variables[i].min !== null && variables[i].max !== null) {
//                         sql += ' and (value between ' + variables[i].min +
//                             ' and ' + variables[i].max + ')'
//                     }
//                     sql += ')'
//                 }
//             }
//
//             if (transactions !== null && transactions.length > 0) {
//                 for (let i = 0; i < transactions.length; i++) {
//                     sql += ' and contracthash in' +
//                         ' (select contracthash from datapoints inner join blocks' +
//                         ' on datapoints.blocknumber = blocks.blocknumber where' +
//                         ' timestamp between ' + transactions[i].startTime + ' and ' +
//                         transactions[i].endTime + ') ' +
//                         'limit 5'
//                 }
//             }
//
//             sql += ' order by nameDiff DESC;'
//             pool.query(sql).then((results) => {
//                 return resolve(results)
//             })
//                 .catch((err) => {
//                     log.error(err)
//                 })
//         })
//     }
//
//     let intersperse = function (str, intrsprs) {
//         str = str.split('').map((elem) => {
//             return elem + intrsprs
//         })
//         return ('%' + str.join(''))
//     }
//
//     return db
// }