var Sequelize = require('sequelize')
var login = require('./login.js')

const db = new Sequelize('EtheroscopeDB', login.username, login.password, {
  host: login.hostname,
  dialect: 'mssql',
  operatorsAliases: false,

  dialectOptions: {
    encrypt: true
  },

  pool: {
    max: 5,
    min: 0,
    idle: 10000
  }
})

db
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.')
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err)
  })

// const dataPoints = db.define('dataPoints', {
//   contractHash: Sequelize.CHAR(40),
//   variableID: Sequelize.INTEGER,
//   value: Sequelize.CHAR(78),
//   blockNumber: Sequelize.BIGINT
// })

// const contracts = db.define('contracts', {
//   contractHash: Sequelize.CHAR(40),
//   name: Sequelize.CHAR(128)
// })

// const blocks = db.define('blocks', {
//   blockNumber: Sequelize.BIGINT,
//   timeStamp: Sequelize.DATE
// })

// const variables = db.define('variables', {
//   contractHash: Sequelize.CHAR(40),
//   variableID: Sequelize.INTEGER,
//   name: Sequelize.CHAR(128)
// })

// // force: true will drop the table if it already exists
// User.sync({force: true}).then(() => {
//   // Table created
//   return User.create({
//     firstName: 'John',
//     lastName: 'Hancock'
//   })
// })

module.exports = db
