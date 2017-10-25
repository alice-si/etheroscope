var mssql = require('mssql')
var login = require('./login.js')
var path = require('path')

/* TABLE DEFINITIONS
 * Here we define all the tables used in the database.
 * Setting the .create attribute means that if the table
 * does not already exist in the database, it will
 * be created.
 */
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
    var fs = require('fs')
    fs.readFile(path.join(__dirname, '/dbschema.ddl'), function (err, data) {
      if (err) {
        throw err
      }
      var request = new mssql.Request(pool)
      request.query(data.toString(), (err, result) => {
        if (err) {
          console.log('Error creating tables - perhaps they already exist')
        }
      })
    })
  }
})

var db = {}

/* A function to build a set of values
 * to be inserted in an sql statement.
 * Each record is represented as an array of
 * values. This function takes in an array of
 * such arrays, to facilitate inserting
 * multiple records.
 */
function buildValueString (valuesArray) {
  var result = ''
  for (var i = 0; i < valuesArray.length; i++) {
    result += '('
    for (var j = 0; j < valuesArray[i].length; j++) {
      result += "'"
      result += valuesArray[i][j]
      result += "', "
    }
    // Remove the last two characters ', ' from the string
    result = result.slice(0, -2)
    result += '), '
  }
  // Remove the last two characters ', ' from the string
  return result.slice(0, -2)
}

/* This function takes in an array of arrays of the form:
 * values = ['0x0123456789', 'name']
 * and a callback function (err, result)
 */
db.addContracts = function (values, callback) {
  var request = new mssql.Request(pool)
  var valueString = buildValueString(values)
  var sql = 'insert into Contracts (contractHash, name) values ' + valueString
  request.query(sql, callback)
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
  var valueString = buildValueString(values)
  var sql = 'insert into DataPoints ' +
          '(contractHash, variableID, blockNumber, value) values ' +
          valueString
  request.query(sql, callback)
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
