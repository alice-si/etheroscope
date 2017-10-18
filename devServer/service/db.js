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

module.exports = db
