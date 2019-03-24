"use strict";

const models = require('./models');
const sequelize = models.sequelize;
const Sequelize = models.Sequelize;
const Op = Sequelize.Op;

/**
 * Get all Contracts from db.
 *
 * @returns {Promise<Array<Model>>} - array of Contract instances.
 * Contract is a sequelizejs Model with 'hash', 'name', 'abi' fields,
 * and with hasMany(ContractLookup), hasMany(Variable) associations.
 * Model represents a table in the database. Instances of this class represent a database row.
 * The values from dataValues can be accessed directly from the Instance, that is:
 *      ```
 *      instance.field
 *      // is the same as
 *      instance.get('field')
 *      // is the same as
 *      instance.getDataValue('field')
 *      ```
 */
async function getContracts() {
    try {
        return await models.Contract.findAll();
    } catch (e) {
        console.error("getContracts()")
    }
}

/**
 * Get Contract from db with hash = {@param contractHash}.
 *
 * @param contractHash - contract hash
 *
 * @returns {Promise<Model>} - Contract instance
 * Contract is a sequelizejs Model with 'hash', 'name', 'abi' fields,
 * and with hasMany(ContractLookup), hasMany(Variable) assotiations.
 * Model represents a table in the database. Instances of this class represent a database row.
 * The values from dataValues can be accessed directly from the Instance, that is:
 *      ```
 *      instance.field
 *      // is the same as
 *      instance.get('field')
 *      // is the same as
 *      instance.getDataValue('field')
 *      ```
 */
async function getContract(contractHash) {
    try {
        return await models.Contract.findOne({where: {hash: [contractHash]}});
    } catch (e) {
        console.error("getContract(" + contractHash + ")")
    }
}

/**
 * Create many Contracts in database.
 *
 * @param values - should be an array of contracts e.g:
 *      ```
 *      [{ hash: 'barfoohash1z', name: 'name1', abi: 'abisbiss'},
 *      { hash: 'barfohash2oz', name: 'name2', abi: 'abisbiss'},
 *      { hash: 'barfoozhash3', name: 'name 23', abi: '8aushiau'},]
 *      ```
 * @returns {Promise<Array<Model>>} - array of inserted instances.
 * Contract is a sequelizejs Model with 'hash', 'name', 'abi' fields,
 * and with hasMany(ContractLookup), hasMany(Variable) assotiations.
 * Model represents a table in the database. Instances of this class represent a database row.
 * The values from dataValues can be accessed directly from the Instance, that is:
 *      ```
 *      instance.field
 *      // is the same as
 *      instance.get('field')
 *      // is the same as
 *      instance.getDataValue('field')
 *      ```
 */
async function addContracts(values) {
    try {
        return await models.Contract.bulkCreate(values, {returning: true});
    } catch (e) {
        console.error("addContracts()", values, e)
    }
}

/**
 * Add a lookup for contract.
 * @param contractHash - hash of contract.
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
        console.error("addContractLookup()", e)
    }
}


/**
 * Get top limit1 popular contracts in last lasDays days.
 * @param {int}     limit1      how many contracts
 * @param {int}     lastDays    how many last days
 * @returns {Promise<void>}
 */
async function getPopularContracts(limit1, lastDays = 7) {
    try {
        // return await sequelize.query('SELECT hash, name, Count(t2.id) as cnt FROM Contracts as t1 LEFT JOIN ContractLookups as t2 ON t1.hash = t2.ContractHash where t2.date >= datetime(\'now\', \'+$2 DAY\') group by t1.hash, t1.name order by cnt desc limit $1 ',
        //     {raw: true, bind: [limit1, lastDays], type: sequelize.QueryTypes.SELECT}
        // )
        return await sequelize.query('SELECT hash, name, Count(t2.id) as cnt FROM Contracts as t1 LEFT JOIN ContractLookups as t2 ON t1.hash = t2.ContractHash where t2.date >= DATE_SUB(NOW(), INTERVAL $2 DAY) group by t1.hash, t1.name order by cnt desc limit $1 ',
            {raw: true, bind: [limit1, lastDays], type: sequelize.QueryTypes.SELECT}
        )
    } catch (e) {
        console.error("getPopularContracts(" + limit1 + ", " + lastDays + ")", e)
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
        if (variable && values && values.length !== 0) {
            values.forEach((elem) => {
                bulkmap.push({value: elem[1], BlockNumber: elem[2], VariableId: variable.id})
            });
            await models.DataPoint.bulkCreate(bulkmap);
            return await variable.update({cachedFrom: cachedFrom, cachedUpTo: cachedUpTo});
        }
    } catch (e) {
        console.error("addDataPoints(" + contractAddress + ", " + variableName + ", " + values + ", " + cachedFrom + ", " + cachedUpTo + ")", e)

    }
}

/**
 * Returns all timestamps and values for a given contract and variable.
 * @param contractAddress
 * @param variableName
 * @returns {Promise<Array<Model>>}         Array of DataPoints instances with included associated Block instance.
 *                                          Block is accessible eq. `res[i].Block.number`
 */
async function getDataPoints(contractAddress, variableName) {
    try {
        let variable = await models.Variable.findOne({where: {ContractHash: contractAddress, name: variableName}});
        return await models.DataPoint.findAll({include: [models.Block], where: {VariableId: variable.id}});
    } catch (e) {
        console.error("getDataPoints(" + contractAddress + ", " + variableName + ")")
    }
}


/**
 * Create many Variables in database.
 *
 * @param values - should be an array of variables e.g:
 * let result4 = await dao.addVariables([{
 *       ContractHash: '1',
 *       name: 'namenameVariable',
 *       cachedFrom: '420',
 *       cachedUpTo: '422',
 *       // UnitId:'1',
 *   }, {
 *       ContractHash: '2',
 *       name: 'namename22',
 *       cachedFrom: '420',
 *       cachedUpTo: '422',
 *       // UnitId:'1',
 * },
 *
 * ]);
 *
 * Care Unit.js model is currently not used that's why u shouldn't set UnitId in values.
 *
 * @returns {Promise<Array<Model>>} - array of inserted instances.
 */
async function addVariables(values) {
    try {
        return await models.Variable.bulkCreate(values);
    } catch (e) {
        console.error("addVariables()", e)
    }
}

/**
 * Get all variables for contract.
 *
 * @param   contractHash    hash of contract
 * @returns {Promise<Array<Model>>}
 */
async function getVariables(contractHash) {
    try {
        return await models.Variable.findAll({where: {ContractHash: contractHash}});
    } catch (e) {
        console.error("getVariables()")
    }
}


/**
 * Get timeStamp for given block number.
 *
 * @param blockNumber   - block number
 * @returns {Promise<*>} - timestamp
 */
async function getBlockTime(blockNumber) {
    try {
        let block = await models.Block.findOne({where: {number: blockNumber}});
        return block === null ? null : block.timeStamp;
    } catch (e) {
        console.error("getBlockTime()", e)
    }
}

/**
 * Create in db blocks for given values.
 *
 * @param   values    eq. [{ number: 34, timeStamp: Date.now()}, ... ]
 * @returns {Promise<Array<Model>>} - array of inserted instances.
 */
async function addBlocks(values) {
    try {
        return await models.Block.bulkCreate(values);
    } catch (e) {
        console.error("addBlocks()!")
    }
}

/**
 * Gets dataPoints for a variable in block number <from, to> range.
 *
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
            where: {
                VariableId: variable.id,
                BlockNumber: {
                    [Op.between]: [from, to]
                }
            }
        })
            ;
    } catch (e) {
        console.error("getDataPointsInBlockNumberRange()")
    }
}

/**
 * Get the latest number of cached blocks.
 *
 * @returns {Promise<*>} - block number
 */
async function getLatestCachedBlock() {
    try {
        return await models.Block.max('number')
    } catch (e) {
        console.error(getLatestCachedBlock())
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
    try {
        let variable = await models.Variable.findOne({where: {ContractHash: contractHash, name: variableName}});
        return variable == null ? {
            cachedFrom: null,
            cachedUpTo: null
        } : {
            cachedFrom: variable.cachedFrom,
            cachedUpTo: variable.cachedUpTo
        }
    } catch (e) {
        console.error("getCachedFromTo()", e)
    }
}

/**
 * Updates abi of given contract.
 *
 * @param contractHash      contract hash
 * @param contractABI       new abi
 * @returns {Promise<Model>}    updated instance
 */
async function updateContractABI(contractHash, contractABI) {
    try {
        let contract = await models.Contract.findOne({where: {hash: [contractHash]}});
        return await contract.update({abi: contractABI})
    } catch (e) {
        console.error("updateContractABI()", e)
    }
}

/**
 * Temp. implementation looking for exact hash or name match.
 * fixme
 *
 * @param pattern
 * @returns {Promise<Model>}
 */
async function searchContract(pattern) {
    // todo function (pattern, variables, transactions) - advanced search
    try {
        if (pattern[0] === '0' && (pattern[1] === 'x' || pattern[1] === 'X')) {
            pattern = pattern.substr(2)
            return await models.Contract.findOne({where: {hash: [pattern]}})
        } else {
            return await models.Contract.findOne({where: {name: [pattern]}})
        }
    } catch (e) {
        console.error("searchContract()")
    }
}

module.exports.addContracts = addContracts;
module.exports.getContracts = getContracts;
module.exports.updateContractABI = updateContractABI;
module.exports.searchContract = searchContract;
module.exports.getContract = getContract;
module.exports.addContractLookup = addContractLookup;
module.exports.getPopularContracts = getPopularContracts;
module.exports.addVariables = addVariables;
module.exports.getVariables = getVariables;
module.exports.addDataPoints = addDataPoints;
module.exports.getDataPoints = getDataPoints;
module.exports.getDataPointsInBlockNumberRange = getDataPointsInBlockNumberRange;
module.exports.addBlocks = addBlocks;
module.exports.getBlockTime = getBlockTime;
module.exports.getLatestCachedBlock = getLatestCachedBlock;
module.exports.getCachedFromTo = getCachedFromTo;

// todo  - address can be 0x, 0X or just hash - better fix everywhere hash used
// todo - loglevel require('../db')(log)


(function initDB(force = false) {
    // If force is true, each Model will run `DROP TABLE IF EXISTS`, before it tries to create its own table
    sequelize.sync({force: force})
        .then(() => {
            sequelize.authenticate().then(() => {
                console.log("DB CONNECTED")
            });
        }).catch((e) => {
        console.log(e)
    })
})(true);