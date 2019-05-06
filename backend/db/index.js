"use strict";

const models = require('./models');
const sequelize = models.sequelize;
const Sequelize = models.Sequelize;
const Op = Sequelize.Op;
const handler = require("../common/errorHandlers").errorHandleThrow;

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
        handler('[DB index.js] getContract', 'Problem occurred in getContract')(e);
    }
}

/**
 * Create many Contracts in database.
 *
 * @param contract object e.g
 *      ```
 *      { hash: 'barfoohash1z', name: 'name1', abi: 'abisbiss'}
 *      ```
 * @returns {Promise<Model>} - array of inserted instances.
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
async function addContract(contract) {
    try {
        return await sequelize.transaction(async (t) => {
            let is_any = await models.Contract.findOne({where: {hash: contract.hash}, transaction: t});
            if (is_any != null) return is_any
            return await models.Contract.create(contract, {transaction: t});
        });
    } catch (e) {
        handler('[DB index.js] addContract', 'Problem occurred in addContract')(e);
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
    } catch (e) {
        handler('[DB index.js] addContractLookup', 'Problem occurred in addContractLookup')(e);
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
        let res = [];
        if (process.env.NODE_ENV) { // if in production
            res = await sequelize.query('SELECT hash as contractHash, name, Count(t2.id) as searches FROM Contracts as t1 LEFT JOIN ContractLookups as t2 ON t1.hash = t2.ContractHash where t2.date >= DATE_SUB(NOW(), INTERVAL $2 DAY) group by t1.hash, t1.name having searches > 0 order by searches desc limit $1 ',
                {raw: true, bind: [limit1, lastDays], type: sequelize.QueryTypes.SELECT}
            )
        } else {
            res = await sequelize.query('SELECT hash as contractHash, name, Count(t2.id) as searches FROM Contracts as t1 LEFT JOIN ContractLookups as t2 ON t1.hash = t2.ContractHash group by t1.hash, t1.name having searches > 0 order by searches desc limit $1 ',
                {raw: true, bind: [limit1], type: sequelize.QueryTypes.SELECT}
            )
        }
        return res
    } catch (e) {
        handler('[DB index.js] getPopularContracts', 'Problem occurred in getPopularContracts')(e);
    }
}


/**
 * Caches information about value of a given variable in a given block.
 * Timestamps are currently ignored.
 *
 * Consists of 3 steps:
 * Step 1 adds values into database.
 * Step 2 checks if last value in values is the same as the latest value in database
 *        (we want to omit having the same consecutive values in database)
 * Step 3 updates  cached range for this variable.
 *
 * @param {string}   contractAddress
 * @param {string}   variableName
 * @param {Object[]} values          elements are [timestamp, value, blockNumber]
 * @param {Number}   cachedUpTo      end of range of cached blocks
 */
async function addDataPoints(contractAddress, variableName, values, cachedUpTo) {

    try {
        return await sequelize.transaction(async (t) => {
            let variable = await models.Variable.findOne({
                where: {ContractHash: contractAddress, name: variableName},
                transaction: t
            });
            let bulkmap = [];
            if (variable && cachedUpTo > variable.cachedUpTo) {
                if (values && values.length !== 0) {
                    let maxBlockNumber = await models.DataPoint.max('BlockNumber', {
                        where: {VariableId: variable.id},
                        transaction: t
                    });
                    if (isNaN(maxBlockNumber) === false) {
                        let lastDataPoint = await models.DataPoint.findOne({
                            where: {
                                BlockNumber: maxBlockNumber,
                                VariableId: variable.id
                            }, transaction: t
                        });
                        if (values.length > 0 && lastDataPoint.value === values[0][1])
                            values.shift()
                    }
                    values.forEach((elem) => {
                        bulkmap.push({value: elem[1], BlockNumber: elem[2], VariableId: variable.id})
                    });
                    await models.DataPoint.bulkCreate(bulkmap, {transaction: t});
                }
                return await variable.update({cachedUpTo: cachedUpTo}, {transaction: t});
            }
        });
    } catch (e) {
        handler('[DB index.js] addDataPoints', 'Problem occurred in addDataPoints')(e);
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
        handler('[DB index.js] getDataPoints', 'Problem occurred in getDataPoints')(e);
    }
}


/**
 * Create many Variables in database.
 *
 * @param values - should be an array of variables e.g:
 * let result4 = await dao.addVariables([{
 *       ContractHash: '1',
 *       name: 'namenameVariable',
 *       cachedUpTo: '422',
 *       // UnitId:'1',
 *   }, {
 *       ContractHash: '2',
 *       name: 'namename22',
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
        return await sequelize.transaction(async (t) => {
            if (values.length > 0) {
                let res = await getVariables(values[0].contractHash)
                if (res.length > 0)
                    return res
            }
            return await models.Variable.bulkCreate(values, {transaction: t})
        });
    } catch (e) {
        handler('[DB index.js] addVariables', 'Problem occurred in addVariables')(e);
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
        handler('[DB index.js] getVariables', 'Problem occurred in getVariables')(e);
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
        handler('[DB index.js] getBlockTime', 'Problem occurred in getBlockTime')(e);
    }
}

/**
 * Create in db blocks for given values.
 *
 * @param   block    eq. { number: 34, timeStamp: Date.now()}
 * @returns {Promise<Model>} - array of inserted instances.
 */
async function addBlock(block) {
    try {
        return await sequelize.transaction(async (t) => {
            let is_any = await models.Block.findOne({where: {number: block.number}, transaction: t});
            if (is_any != null) return is_any;
            return await models.Block.create(block, {transaction: t});
        });
    } catch (e) {
        handler('[DB index.js] addBlocks', 'Problem occurred in addBlocks')(e);
    }
}

/**
 * Returns range of cached data in database for a given contract and variable.
 *
 * @param {string} contractHash
 * @param {string} variableName
 *
 * @returns {Promise<Number>} returns cachedUpTo value
 */
async function getCachedUpTo(contractHash, variableName) {
    try {
        let variable = await models.Variable.findOne({where: {ContractHash: contractHash, name: variableName}});
        return variable == null ? null : variable.cachedUpTo
    } catch (e) {
        handler('[DB index.js] getCachedUpTo', 'Problem occurred in getCachedUpTo')(e);
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
        handler('[DB index.js] searchContract', 'Problem occurred in searchContract')(e);
    }
}

module.exports.addContract = addContract;
module.exports.searchContract = searchContract;
module.exports.getContract = getContract;
module.exports.addContractLookup = addContractLookup;
module.exports.getPopularContracts = getPopularContracts;
module.exports.addVariables = addVariables;
module.exports.getVariables = getVariables;
module.exports.addDataPoints = addDataPoints;
module.exports.getDataPoints = getDataPoints;
module.exports.addBlock = addBlock;
module.exports.getBlockTime = getBlockTime;
module.exports.getCachedUpTo = getCachedUpTo;

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
})();