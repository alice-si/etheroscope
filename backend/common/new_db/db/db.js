"use strict";

const log = require('../../errorHandlers').log;
const models = require('../models');
const sequelize = models.sequelize;
const dbWrapper = require('./dbWrapper.js');

let SAFE_ZONE = {
    testConnection: async function () {
        await sequelize.authenticate();
        log('Connection has been established successfully.')
    },
    getVariables: async function () {
        return await models.Variable.findAll()
    },
    getContracts: async function () {
        return await models.Contract.findAll();
    },
    // todo Guys use bulk insert where it's possible and reasonable.
    // todo Guys use bulk insert where it's possible and reasonable.
    // todo Guys use bulk insert where it's possible and reasonable.

    // insert your funcs here

};

(function initDB() {
    SAFE_ZONE.testConnection()
        .then(() => {
            sequelize.sync({force: true})
        })
        .catch(e => {
            console.error("Error in initDB -> ", e);
            process.exit();
        });
    dbWrapper.wrapAllFunctionsFromNamespaceIntoErrorHandler(SAFE_ZONE, dbWrapper.simpleDbErrHandler);
    module.exports = SAFE_ZONE;
})();
