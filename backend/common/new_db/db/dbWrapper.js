"use strict";
const errorHandle = require('../../errorHandlers').errorHandle;

module.exports.simpleDbErrHandler = function (err) {
    errorHandle('[db]')(err)
};

function safeUseDBWrapper(fun, handler) {
    return async function () {
        try {
            fun.apply(this, arguments)
                .catch(e => handler(e));
        } catch (e) {
            errorHandle('[db]')(e)
        }
    }
}

module.exports.wrapAllFunctionsFromNamespaceIntoErrorHandler = function wrapIntoSafeFunctions(namespace, handler) {
    for (let i in namespace) {
        let p = namespace[i];
        if (typeof p === 'function') {
            namespace[i] = safeUseDBWrapper(p, handler);
        }
    }
};