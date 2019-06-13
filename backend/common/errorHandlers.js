module.exports.errorHandle = (msg) => (error) => console.error(`ERROR message: ${msg}, error is :${error}`);

module.exports.errorHandleCallback = (msg, cb) => (error) => {
    console.error(`ERROR message: ${msg}, ERROR is: ${error}`)
    cb(error)
};

module.exports.errorHandleThrow = (msg, throwMsg) => (error) => {
    console.error(`ERROR message: ${msg}`)
    throw error
};


module.exports.dbErrorHandler = (msg, throwMsg) => (error) => {
    if (error.name === "SequelizeUniqueConstraintError") {
        console.log("[FINE] Db unique constraint error ignored:", msg)
    } else {
        console.error(`ERROR message: ${msg}`);
        throw error
    }
};
