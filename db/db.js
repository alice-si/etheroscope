var mssql = require('mssql')
var login = require('./login.js')
var path = require('path')

/* ESTABLISHING A CONNECTION
 * Here we create a connection pool to the mssql server.
 * we store the configuration in a separate module, login.js.
 */
const pool = new mssql.ConnectionPool({
  user: login.username,
  password: login.password,
  server: login.hostname,
  database: login.database,
  connectionTimeout: 30000,
  requestTimeout: 30000,
  options: {
    encrypt: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }

})

/* DEFINE TABLES FOR BULK INSERT
 * Here we define the table schema
 * so that we can use them for bulk inserts
 */
/* Variables Table
 */
function getNewVariablesTable () {
  var variablesTable = new mssql.Table('variables')
  variablesTable.create = true
  variablesTable.columns.add('contractHash', mssql.VarChar(40), {nullable: false, primary: true})
  variablesTable.columns.add('variableName', mssql.VarChar(50), {nullable: false, primary: true})
  variablesTable.columns.add('cachedFrom', mssql.BigInt, {nullable: true})
  variablesTable.columns.add('cachedUpTo', mssql.BigInt, {nullable: true})
  return variablesTable
}

/* DataPoints Table
 */
function getNewDataPointsTable () {
  var dataPointsTable = new mssql.Table('dataPoints')
  dataPointsTable.create = true
  dataPointsTable.columns.add('contractHash', mssql.VarChar(40), {nullable: false, primary: true})
  dataPointsTable.columns.add('variableName', mssql.VarChar(50), {nullable: false, primary: true})
  dataPointsTable.columns.add('blockNumber', mssql.BigInt, {nullable: false})
  dataPointsTable.columns.add('value', mssql.VarChar(78), {nullable: false})
  return dataPointsTable
}

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

module.exports = function (log) {
  var db = {}
  var isLoadSchema = false

  function loadSchema () {
    var fs = require('fs')
    fs.readFile(path.join(__dirname, '/moduleschema.ddl'), function (err, data) {
      if (err) {
        throw err
      }
      var request = new mssql.Request(pool)
      request.query(data.toString(), (err, result) => {
        if (err) {
          log.error('db.js: Error creating tables - perhaps they already exist')
        }
      })
    })
  }

  db.poolConnect = function () {
    log.info('db.js: Connecting to pool')
    return new Promise(function (resolve, reject) {
      pool.connect(err => {
        if (err) {
          log.error('db.js: Error connecting to database pool:')
          log.error(err)
          reject(err)
        } else {
          log.info('db.js: Successfully connected to pool')
          if (isLoadSchema) {
            loadSchema()
          }
          resolve()
        }
      })
    })
  }

  /* This function takes in an array of arrays of the form:
   * values = ['0x0123456789', 'name'], and returns a promise
   */
  db.addContracts = function (values) {
    return new Promise(function (resolve, reject) {
      var request = new mssql.Request(pool)
      var valueString = buildValueString(values)
      var sql = 'insert into Contracts (contractHash, name) values ' + valueString
      request.query(sql)
        .then(() => {
          return resolve()
        })
        .catch((err) => {
          log.error('db.js: Error in addContracts')
          log.error(err)
          return reject(err)
        })
    })
  }

  db.updateContractWithABI = function (address, parsedContract) {
    return new Promise(function (resolve, reject) {
      var request = new mssql.Request(pool)
      var sql = "update Contracts set abi='" + JSON.stringify(parsedContract) + "' where contractHash='" + address + "'"
      request.query(sql)
      .catch((err) => {
        log.error('db.js: Error in updateContractWithABI')
        log.error(err)
      })
    })
  }

  db.addContractLookup = function (address) {
    return new Promise(function (resolve, reject) {
      var request = new mssql.Request(pool)
      var sql = "insert into contractLookupHistory (contractHash, date) values ('" + address + "', GETDATE())"
      request.query(sql)
      .catch((err) => {
        log.error('db.js: Error in addContractLookup')
        log.error(err)
      })
    })
  }

  /* Gets the most popular contracts in the last timeUnit timeAmount
   * where timeUnit is a string ('day', 'week', 'month' etc)
   * and timeAmount is the number of time units passed
   * limit is the number of contracts to return
   */
  db.getPopularContracts = function (timeUnit, timeAmount, limit) {
    return new Promise(function (resolve, reject) {
      var request = new mssql.Request(pool)
      var sql = 'select top ' + limit + ' contractHash, COUNT(*) as searches ' +
                'from contractLookupHistory where DATEDIFF(' +
                timeUnit + ', date, GETDATE()) < ' + timeAmount + ' ' +
                'GROUP BY contractHash ' +
                'ORDER BY searches desc'
      var joined = 'select contracts.contractHash, name, searches from (' + sql + ') as popular join contracts on contracts.contractHash = popular.contractHash'
      request.query(joined)
        .then((result) => {
          return resolve(result.recordset)
        })
        .catch((err) => {
          log.error('db.js: Error in getPopularContracts')
          log.error(err)
        })
    })
  }

  /* This function takes in a contract hash
   * and returns a promise
   */
  db.getContract = function (contractHash) {
    return new Promise(function (resolve, reject) {
      var request = new mssql.Request(pool)
      var sql = "select name, abi from Contracts where contractHash='" + contractHash + "'"
      request.query(sql)
        .then((results) => {
          let result = { contractName: null, contract: null }
          if (results.rowsAffected[0] !== 0) {
            result.contractName = results.recordset[0].name
            let abi = results.recordset[0].abi
            if (abi) {
              result.contract = JSON.parse(abi)
            }
          }
          return resolve(result)
        })
        .catch((err) => {
          log.error('db.js: Error in getContractName')
          log.error(err)
          return reject(err)
        })
    })
  }

  /* This function takes in a contract address, method and
   * array of arrays of the form: [[time, 'value', blockNum]]
   * time is currently ignored
   */
  db.addDataPoints = function (contractAddress, method, values, from, to) {
    return new Promise(function (resolve, reject) {

      let dataPointsTable = getNewDataPointsTable()
      values.forEach((elem) => {
        dataPointsTable.rows.add(contractAddress, method, elem[2], elem[1])
      })

      var transaction = new mssql.Transaction(pool)
      var request = new mssql.Request(transaction);

      transaction.begin()
        .then(() => {
          return request.bulk(dataPointsTable)
        })
        .then(() => {
          var sql = 
            "update variables set cachedFrom='" + from + "' where contractHash='" + contractAddress +
             "' and variableName='" + method + "';" +
            "update variables set cachedUpTo='" + to + "' where contractHash='" + contractAddress +
             "' and variableName='" + method + "';"
          return request.query(sql)
        })
        .then(() => {
          return transaction.commit()
        })
        .then(() => {
          return resolve()
        })
        .catch((err) => {
          log.error('db.js: Error in addDataPoints')
          log.error(err)        
          transaction.rollback()
            .then(() => {
              log.error('db.js: Rolled back transaction')
              process.exit(1)
              return reject(err)
            })
            .catch((err) => {
              log.error('db.js: Failed to rollback failed transaction!!')
              log.error(err)
              process.exit(1)
              return reject(err)
            })
        })
    })
  }

  /* This function takes a variable */
  db.addVariable = function (values) {
    return new Promise(function (resolve, reject) {
      var request = new mssql.Request(pool)
      var valueString = buildValueString(values)
      var sql = 'insert into Variables (contractHash, variableName) values ' + valueString
      request.query(sql)
        .then(() => {
          return resolve()
        })
        .catch((err) => {
          log.error('db.js: Error in addVariable')
          log.error(err)
          return reject(err)
        })
    })
  }

  /* This function returns *all* the variables in a given date range
   * for a given contract hash
   */
  db.getDataPoints = function (contractHash, method) {
    return new Promise(function (resolve, reject) {
      var request = new mssql.Request(pool)
      var sql =
        'select timeStamp, value from (DataPoints inner join Blocks on DataPoints.blockNumber = Blocks.blockNumber) ' +
        "where DataPoints.contractHash='" + contractHash +
        "' and (DataPoints.variableName='" + method + "')"
      request.query(sql)
        .then((results) => {
          return resolve(results.recordsets)
        })
        .catch((err) => {
          log.error('db.js: Error in getDataPoints')
          log.error(err)
          return reject(err)
        })
    })
  }

  db.getVariables = function (contractHash) {
    return new Promise(function (resolve, reject) {
      var request = new mssql.Request(pool)
      var sql = "select variableName from variables where contractHash='" + contractHash + "'"
      request.query(sql)
        .then((results) => {
          return resolve(results)
        })
        .catch((err) => {
          log.error('db.js: Error in getVariables')
          log.error(err)
          return reject(err)
        })
    })
  }

  db.getBlockTime = function (blockNumber) {
    return new Promise(function (resolve, reject) {
      var request = new mssql.Request(pool)
      var sql = "select * from Blocks where blockNumber='" + blockNumber + "'"
      request.query(sql)
        .then((results) => {
          return resolve(results)
        })
        .catch((err) => {
          log.error('db.js: Error in getBlockTime')
          log.error(err)
          process.exit(1)
          return reject(err)
        })
    })
  }

  db.addBlockTime = function (values) {
    return new Promise(function (resolve, reject) {
      var request = new mssql.Request(pool)
      var valueString = buildValueString(values)
      var sql = 'insert into Blocks (blockNumber, timeStamp, userLog) values ' + valueString
      request.query(sql)
        .then(() => {
          return resolve()
        })
        .catch((err) => {
          log.error('db.js: Error in addBlocKTime')
          log.error(err)
          return reject(err)
        })
    })
  }

  /* This function returns *all* the variables in a given date range
   * for a given contract hash
   */
  db.getDataPointsInDateRange = function (contractHash, method, from, to) {
    return new Promise(function (resolve, reject) {
      var request = new mssql.Request(pool)
      var sql =
        'select timeStamp, value from (DataPoints inner join Blocks on DataPoints.blockNumber = Blocks.blockNumber) ' +
        "where DataPoints.contractHash='" + contractHash +
        "' and (DataPoints.blockNumber between '" + from + "' and '" + to + "')" +
        " and (DataPoints.variableName='" + method + "')"
      request.query(sql)
        .then((results) => {
          return resolve(results.recordsets)
        })
        .catch((err) => {
          log.error('db.js: Error in getDataPointsInDateRange')
          log.error(err)
          return reject(err)
        })
    })
  }

  db.getCachedFromTo = function (contractHash, method) {
    return new Promise(function (resolve, reject) {
      var request = new mssql.Request(pool)
      var sql = 'select cachedFrom, cachedUpTo from variables ' +
        "where contractHash='" + contractHash + "' " +
        "and variableName='" + method + "'"
      request.query(sql)
        .then((results) => {
          return resolve({
            cachedFrom: results.recordset[0].cachedFrom,
            cachedUpTo: results.recordset[0].cachedUpTo
          })
        })
        .catch((err) => {
          log.error('db.js: Error in getCachedFromTo')
          log.error(err)
          return reject(err)
        })
    })
  }

  db.getLatestCachedBlockTime = function () {
    return new Promise(function (resolve, reject) {
      var request = new mssql.Request(pool)
      var sql = 'select MAX(blockNumber) from blocks where userLog=0'
      request.query(sql).then((results) => {
        return resolve(results.recordset[0][''])
      })
    })
  }

  db.searchContractHash = function (pattern) {
    return new Promise(function (resolve, reject) {
      var request = new mssql.Request(pool)
      let interspersedPattern = pattern + '%'
      var sql = 'select top 5 *, difference(contracthash, \'' + pattern + '\') as contractDiff' +
      ' from contracts where contracthash LIKE \'' + interspersedPattern +
      '\' order by contractDiff DESC;'
      request.query(sql).then((results) => {
        return resolve(results.recordset)
      })
      .catch((err) => {
        log.error(err)
      })
    })
  }

  db.searchContractName = function (pattern) {
    return new Promise(function (resolve, reject) {
      var request = new mssql.Request(pool)
      let interspersedPattern = intersperse(pattern, '%')
      var sql = 'select top 5 *, difference(name, \'' + pattern + '\') as nameDiff' +
      ' from contracts where name LIKE \'' + interspersedPattern +
      '\' order by nameDiff DESC;'
      request.query(sql).then((results) => {
        return resolve(results.recordset)
      })
      .catch((err) => {
        log.error(err)
      })
    })
  }

  let intersperse = function (str, intrsprs) {
    str = str.split('').map((elem) => {
      return elem + intrsprs
    })
    return ('%' + str.join(''))
  }

  return db
}
