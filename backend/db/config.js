module.exports = {
    // development: {
    //     username: "root",
    //     password: "root",
    //     database: "zpp_dev",
    //     host: "127.0.0.1",
    //     dialect: 'mysql',
    //     operatorsAliases: false,
    //     logging: false
    // },
    development: {
        dialect: "sqlite",
        storage: "db.sqlite",
        operatorsAliases: false,
        logging: false,
    },
    test: {
        dialect: "sqlite",
        storage: ":memory:",
        operatorsAliases: false,
        logging: false,
    },
    production: {
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOSTNAME,
        dialect: 'mysql',
        operatorsAliases: false,
        logging: false,
    },
};
