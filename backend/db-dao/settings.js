module.exports.DBNAME = 'mysqldb';
module.exports.DBUSER = 'zppuser';
module.exports.DBPASS = 'T6yt1rLPYv25';
module.exports.DBOPTIONS = {host: '35.205.216.85', dialect: 'mysql', operatorsAliases: false, logging: /*false*/console.log/*todo delete logging: false from here*/};
// todo secrets - code like this one below would be perfect ;]
// module.exports = {
//     development: {
//         dialect: "sqlite",
//         storage: "./db.development.sqlite"
//     },
//     test: {
//         dialect: "sqlite",
//         storage: ":memory:"
//     },
//     production: {
//         username: process.env.DB_USERNAME,
//         password: process.env.DB_PASSWORD,
//         database: process.env.DB_NAME,
//         host: process.env.DB_HOSTNAME,
//         dialect: 'mysql',
//         use_env_variable: 'DATABASE_URL'
//     }
// };
