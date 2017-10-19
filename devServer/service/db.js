var mssql = require('mssql')
var login = require('./login.js')

/* TABLE DEFINITIONS
 * Here we define all the tables used in the database.
 * Setting the .create attribute means that if the table
 * does not already exist in the database, it will
 * be created.
 */

const contracts = new mssql.Table('Contracts')
contracts.create = true
contracts.columns.add('contractHash', mssql.VarChar(40),
                    {nullable: false, primary: true})
contracts.columns.add('name', mssql.VarChar(128),
                    {nullable: true})

const blocks = new mssql.Table('Blocks')
blocks.create = true
blocks.columns.add('blockNumber', mssql.BIGINT,
                    {nullable: false, primary: true})
blocks.columns.add('timeStamp', mssql.DATETIME,
                    {nullable: false})

const variables = new mssql.Table('Variables')
variables.create = true
variables.columns.add('contractHash', mssql.VarChar(40),
                    {nullable: false, primary: true})
variables.columns.add('variableID', mssql.INT,
                    {nullable: false, primary: true})
variables.columns.add('name', mssql.VarChar(128),
                    {nullable: true})

const dataPoints = new mssql.Table('DataPoints')
dataPoints.create = true
dataPoints.columns.add('contractHash', mssql.VarChar(40),
                    {nullable: false, primary: true})
dataPoints.columns.add('variableID', mssql.INT,
                    {nullable: false, primary: true})
dataPoints.columns.add('blockNumber', mssql.BIGINT,
                    {nullable: false, primary: true})
dataPoints.columns.add('value', mssql.VarChar(128),
                    {nullable: false})

/* ESTABLISHING A CONNECTION
 * Here we create a connection pool to the mssql server.
 * we store the configuration in a separate module, login.js.
 */
const pool = new mssql.ConnectionPool({
  user: login.username,
  password: login.password,
  server: login.hostname,
  database: login.database,
  options: {
      encrypt: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
})

pool.connect(err => {
  if (err) {
    console.log('Error connecting to database pool:')
    console.log(err)
  } else {
    console.log('Successfully connected to pool')
  }
})

var db = {}

module.exports = db
