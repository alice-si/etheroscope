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

/* This function takes in an array of arrays of the form:
 * values = ['0x0123456789', 'name']
 * and a callback function (err, result)
 */
db.addContracts = function (values, callback) {
  var request = new mssql.Request(pool)
  var sql = 'insert into Contracts (contractHash, name) values ?'
  request.query(sql, [values], callback)
}

/* This function takes in a contract hash
 * and a callback function (err, result)
 */
db.getContractName = function (contractHash, callback) {
  var request = new mssql.Request(pool)
  var sql = "select * from Contracts where contractHash='" + contractHash + "'"
  request.query(sql, callback)
}

/* This function takes in an array of arrays of the form:
 * values = ['0x0123456789', 'id', blockNumber, 'value']
 * and a callback function (err, result)
 */
db.addDataPoints = function (values, callback) {
  var request = new mssql.Request(pool)
  var sql = 'insert into DataPoints (contractHash, variableID, blockNumber, value) values ?'
  request.query(sql, [values], callback)
}

/* This function returns *all* the variables across all dates
 * for a given contract hash
 */
db.getDataPoints = function (contractHash, callback) {
  var request = new mssql.Request(pool)
  var sql = "select * from DataPoints where contractHash='" + contractHash + "'"
  request.query(sql, callback)
}

/* This function returns *all* the variables in a given date range 
 * for a given contract hash
 */
db.getDataPointsInDateRange = function (contractHash, from, to, callback) {
  var request = new mssql.Request(pool)
  var sql = 'select * from (DataPoints natural join Blocks)' +
            "where contractHash='" +
            contractHash + "' and timeStamp between '" +
            from + "' and '" + to + "'"
  request.query(sql, callback)
}

module.exports = db
