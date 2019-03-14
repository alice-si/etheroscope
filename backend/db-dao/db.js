"use strict";

const models = require('./models');
const sequelize = models.sequelize;

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
        console.error("getContracts()")
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
        console.error("getContract(" + contractHash + ")")
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
        console.error("addContracts(" + values + ")")
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
        console.error("addContractLookup(" + contractHash + ")")
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
        console.error("getPopularContracts(" + limit1 + ", " + lastDays + ")")
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
        console.error("addDataPoints(" + contractAddress + ", " + variableName + ", " + values + ", " + cachedFrom + ", " + cachedUpTo + ")")

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
        console.error("getDataPoints(" + contractAddress + ", " + variableName + ")")
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
    try {
        let variable = await models.Variable.findOne({where: {ContractHash: contractHash, name: variableName}});
        return {
            cachedFrom: variable.cachedFrom,
            cachedUpTo: variable.cachedUpTo
        }
    } catch (e) {
        console.error("EEEEEEE!")
    }
}

/**
 *
 * @param contractHash
 * @param contractABI
 * @returns {Promise<this>}
 */
async function updateContractABI(contractHash, contractABI) {
    try {
        let contract = await models.Contract.findOne({where: {hash: [contractHash]}});
        return await contract.update({abi: contractABI})
    } catch (e) {
        console.error("EEEEEEE!")
    }
}


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
        console.error("EEEEEEE!")
    }
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
