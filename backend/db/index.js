"use strict";

const models = require('./models');
const sequelize = models.sequelize;
const Sequelize = models.Sequelize;
const Op = Sequelize.Op;
const handler = require("../common/errorHandlers").dbErrorHandler;

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
 * Create Contract in database.
 *
 * @param contract object e.g
 *      ```
 *      { hash: 'barfoohash1z', name: 'name1', abi: 'abisbiss'}
 *      ```
 * @returns {Promise<void>}
 */
async function addContract(contract) {
    try {
        await models.Contract.findOrCreate({where: contract});
    } catch (e) {
        handler('[DB index.js] addContract', 'Problem occurred in addContract')(e);
    }
}

/**
 * Add a lookup for contract.
 * @param contractHash - hash of contract.
 * @returns {Promise<void>}
 */
async function addContractLookup(contractHash) {
    try {
        let contract = await models.Contract.findOne({where: {hash: contractHash}});
        let lookup = await models.ContractLookup.build({date: new Date()});
        await lookup.setContract(contract, {save: false});
        await lookup.save()
    } catch (e) {
        handler('[DB index.js] addContractLookup', 'Problem occurred in addContractLookup')(e);
    }
}


/**
 * Get top limit1 popular contracts in last lasDays days.
 * @param {int}     limit1      how many contracts
 * @param {int}     lastDays    how many last days
 * @returns {Promise<*>}
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
 * Timestamps are currently ignored. Adds values into database
 *
 * @param {string}   contractAddress
 * @param {string}   variableName
 * @param {Object[]} values          elements are [timestamp, value, blockNumber]
 */
async function addDataPoints(contractAddress, variableName, values) {
    try {
        let variable = await models.Variable.findOne({
            where: {ContractHash: contractAddress, name: variableName},
        });

        let bulkmap = [];
        if (variable) {
            values.forEach((elem) => {
                bulkmap.push({value: elem[1], BlockNumber: elem[2], VariableId: variable.id})
            });
            await models.DataPoint.bulkCreate(bulkmap);
        }
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
        return await models.DataPoint.findAll({
            include: [models.Block], where: {
                VariableId: variable.id,
                value: { // is not a delimiter
                    [Op.ne]: null
                }
            }
        });
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
 * @returns {Promise<void>}
 */
async function addVariables(values) {
    try {
        // We assume that variables are added only once
        let res = await models.Variable.findAll({where: {ContractHash: values[0].contractHash}});
        if (res.length === 0)
            await models.Variable.bulkCreate(values)
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
 * Create in db block for given value.
 *
 * @param   block    eq. { number: 34, timeStamp: Date.now()}
 * @returns {Promise<void>}
 */
async function addBlock(block) {
    try {
        await models.Block.findOrCreate({where: block});
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
        return await models.DataPoint.max('BlockNumber', {
            where: {VariableId: variable.id},
        })
    } catch (e) {
        handler('[DB index.js] getCachedUpTo', 'Problem occurred in getCachedUpTo')(e);
    }
}

/**
 * Looking  in db for hash or name interpmatch
 *
 * @param pattern
 * @returns {Promise<Array<Model>>}
 */
async function searchContract(pattern) {
    try {
        pattern = "%" + Array.from(pattern).join("%") + "%";
        return await models.Contract.findAll({
            where: {
                [Op.or]: [
                    {
                        hash: {
                            [Op.like]: pattern
                        }
                    },
                    {
                        name: {
                            [Op.like]: pattern
                        }
                    }
                ]
            }
        })
    } catch (e) {
        handler('[DB index.js] searchContract', 'Problem occurred in searchContract')(e);
    }
}

/**
 * Adds transaction to database.
 * In case of "normal" transactions make sure there are no transactions with the same transactionHash.
 * In other scenario we add delimiter.
 *
 * @param transaction
 * @return {Promise<void>}
 */
async function addTransaction(transaction) {
    try {
        if (transaction.transactionHash === null)
            await models.Transaction.findOrCreate({ where: transaction })
        else
            await models.Transaction.findOrCreate({ where: {transactionHash: transaction.transactionHash },
                defaults: transaction })
    } catch (e) {
        handler('[DB index.js] addTransaction', 'Problem occurred in addTransaction')(e);
    }
}

/**
 * Returns maximum BlockNumber for transactions associated with given address.
 *
 * @param address
 * @return {Promise<Number>}
 */
async function getAddressTransactionsMaxBlock(address) {
    try {
        return await models.Transaction.max('BlockNumber', {
            where: {
                [Op.or]: [
                    { from: address },
                    { to: address }
                ]
            },
        });
    } catch (e) {
        handler('[DB index.js] getAddressTransactionsMaxBlock', 'Problem occurred in getAddressTransactionsMaxBlock')(e);
    }
}

/**
 * Returns minimum BlockNumber for transactions associated with given address.
 *
 * @param address
 * @return {Promise<Number>}
 */
async function getAddressTransactionsMinBlock(address) {
    try {
        return await models.Transaction.min('BlockNumber', {
            where: {
                [Op.or]: [
                    { from: address },
                    { to: address }
                ]
            },
        });
    } catch (e) {
        handler('[DB index.js] getAddressTransactionsMinBlock', 'Problem occurred in getAddressTransactionsMinBlock')(e);
    }
}

/**
 * Returns number of "normal" transactions associated with given address.
 *
 * @param address
 * @return {Promise<Number>} Array of Transaction models
 */
async function getAddressTransactionsCount(address) {
    try {
        return await models.Transaction.count({where: {
            [Op.and]: [
                {
                    [Op.or]: [
                        { from: address },
                        { to: address },
                    ]
                },
                {
                    transactionHash: { [Op.ne]: null}
                }
            ]
        } })
    } catch (e) {
        handler('[DB index.js] getAddressTransactionsCount', 'Problem occurred in getAddressTransactionsCount')(e);
    }
}

/**
 * Returns specific number of "normal" transactions associated with given address.
 *
 * @param address
 * @param offset
 * @param limit
 * @return {Promise<Array>} Array of Transaction models, sorted in descending order
 */
async function getAddressTransactions(address, offset, limit) {
    try {
        return await models.Transaction.findAll({include: [models.Block], where: {
            [Op.and]: [
                {
                    [Op.or]: [
                        { from: address },
                        { to: address },
                    ]
                },
                {
                    transactionHash: { [Op.ne]: null }
                }
            ]
            }, offset: offset, limit: limit, order: [ ['Block', 'number', 'DESC'] ]});
    } catch (e) {
        handler('[DB index.js] getAddressTransactions', 'Problem occurred in getAddressTransactions')(e);
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
module.exports.addTransaction = addTransaction;
module.exports.getAddressTransactionsMaxBlock = getAddressTransactionsMaxBlock;
module.exports.getAddressTransactionsMinBlock =  getAddressTransactionsMinBlock;
module.exports.getAddressTransactionsCount = getAddressTransactionsCount;
module.exports.getAddressTransactions = getAddressTransactions;

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