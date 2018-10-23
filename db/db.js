// var mssql = require('mssql')
// var login = require('./login.js')
var path = require('path')
var mysql = require('promise-mysql')

const pool = mysql.createPool({
  connectionLimit: 10,
  connectionTimeout: 10000,
  host: '192.168.99.100',
  port: '8083',
  user: 'root',
  password: 'wp',
  database: 'etheroscope'
})

function test () {
  pool.query('SELECT 1 + 1 AS solution').then(function (results) {
    console.log('The solution is: ', results[0].solution)
  })
  pool.query('SHOW DATABASES').then(function (results) {
    console.log('Show databases: ', results[0].solution)
  })
}

test()

/* DEFINE TABLES FOR BULK INSERT
 * Here we define the table schema
 * so that we can use them for bulk inserts
 */

/* Variables Table
 */
function getNewVariablesTable () {
  console.log('getNewVariablesTable')
  var variablesTable = {}
  variablesTable.sql = 'insert into variables (contractHash, variableName, cachedFrom, cachedUpTo) values ?'
  variablesTable.createTable = 'create table if not exists variables(' +
    'contractHash varchar(40) primary key not null,' +
    'variableName varchar(50) primary key not null,' +
    'cachedFrom bigint,' +
    'cachedUpTo bigint)'
  variablesTable.values = []
  variablesTable.rows = {
    add: function (address, variable) {
      variablesTable.values.push([address, variable, null, null])
    }
  }
  return variablesTable
}

/* DataPoints Table
 */
function getNewDataPointsTable () {
  console.log('getNewDataPointsTable')
  var dataPointsTable = {}
  dataPointsTable.sql = 'insert ignore into dataPoints (contractHash, variableName, blockNumber, value) values ?'
  dataPointsTable.createTable = 'create table if not exists dataPoints(' +
    'contractHash varchar(40) primary key not null,' +
    'variableName varchar(50) primary key not null,' +
    'blockNumber bigint,' +
    'value varchar(78))'
  dataPointsTable.values = []
  dataPointsTable.rows = {
    add: function (contractAdress, method, blockNumber, value) {
      dataPointsTable.values.push([contractAdress, method, blockNumber, value])
    }
  }
  return dataPointsTable
}

/* A function to build a set of values
 * to be inserted in an sql statement.
 * Each record is represented as an array of
 * values. This function takes in an array of
 * such arrays, to facilitate inserting
 * multiple records.
 */
function buildValueString (valuesArray, nonapostrofindex=undefined) {
  console.log('buildValueString')
  var result = ''
  for (var i = 0; i < valuesArray.length; i++) {
    result += '('
    for (var j = 0; j < valuesArray[i].length; j++) {
      if (j !== nonapostrofindex) result += '\''
      result += valuesArray[i][j]
      if (j !== nonapostrofindex) result += '\''
      result += ', '
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
    console.log('loadSchema')
    var fs = require('fs')
    fs.readFile(path.join(__dirname, '/moduleschema.ddl'), function (err, data) {
      if (err) {
        throw err
      }

      pool.query(data.toString(), (err, result) => {
        if (err) {
          log.error('db.js: Error creating tables - perhaps they already exist')
        }
      })
    })
  }

  db.poolConnect = function () {
    console.log('db.poolConnect')
    return new Promise(function (resolve, reject) {
      log.info('db.js: Successfully connected to pool')
      resolve()
    })
  }

  /* This function takes in an array of arrays of the form:
   * values = ['0x0123456789', 'name'], and returns a promise
   */
  db.addContracts = function (values) {
    console.log('db.addContracts')
    return new Promise(function (resolve, reject) {

      var valueString = buildValueString(values)
      var sql = 'insert into contracts (contractHash, name) values ' + valueString
      pool.query(sql)
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
    console.log('db.updateContractsWithABI')
    return new Promise(function (resolve, reject) {

      var sql = 'update contracts set abi=\'' + JSON.stringify(parsedContract) + '\' where contractHash=\'' + address + '\''
      pool.query(sql)
        .catch((err) => {
          log.error('db.js: Error in updateContractWithABI')
          log.error(err)
        })
    })
  }

  db.addContractLookup = function (address) {
    console.log('db.addContractLookup')
    return new Promise(function (resolve, reject) {

      var sql = 'insert into contractLookupHistory (contractHash, date) values (\'' + address + '\', CURDATE())'

      console.log('addContractLookup:sql', sql)

      pool.query(sql)
        .catch((err) => {
          log.error('db.js: Error in addContractLookup')
          log.error('this error is not invasing, probably duplicate entry')
          // log.error((err + '').slice(0, 100))
          // log.error(err)
        })
    })
  }

  /* Gets the most popular contracts in the last timeUnit timeAmount
   * where timeUnit is a string ('day', 'week', 'month' etc)
   * and timeAmount is the number of time units passed
   * limit is the number of contracts to return
   */
  db.getPopularContracts = function (timeUnit, timeAmount, limit) {
    console.log('db.getPopularContracts:timeUnit', timeUnit)
    return new Promise(function (resolve, reject) {

      var sql = 'select contractHash, COUNT(*) as searches ' +
        'from contractLookupHistory where DATEDIFF(date, CURDATE()) < ' + timeAmount + ' ' +
        'GROUP BY contractHash ' +
        'ORDER BY searches desc ' +
        'limit ' + limit
      var joined = 'select contracts.contractHash, name, searches from (' + sql + ') as popular join contracts on contracts.contractHash = popular.contractHash'
      pool.query(joined)
        .then((result) => {
          return resolve(result)
        })
        .catch((err) => {
          log.error('db.js: Error in getPopularContracts')
          log.error(err)
          return reject(err)
        })
    })
  }

  /* This function takes in a contract hash
   * and returns a promise
   */
  db.getContract = function (contractHash) {
    console.log('db.getContract')
    return new Promise(function (resolve, reject) {

      var sql = 'select name, abi from contracts where contractHash=\'' + contractHash + '\''
      pool.query(sql)
        .then((results) => {
          console.log('db.getContract:results:', results)
          let result = {contractName: null, contract: null}
          if (results.length !== 0) {
            result.contractName = results[0].name
            let abi = results[0].abi
            if (abi) {
              abi = abi.slice(1, abi.length - 1)
              console.log('sliced rawabi', abi)
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
    console.log('db.addDataPoints')
    return new Promise(function (resolve, reject) {
      if (values.length === 0) {
        console.log('db.addDataPoints empty values', values)
        return resolve()
      }
      else {
        let dataPointsTable = getNewDataPointsTable()

        console.log('db.addDataPoints nonTableValues ([0] ignored)', values)

        values.forEach((elem) => {
          // TODO: is int reading from buffer good?
          dataPointsTable.rows.add(contractAddress, method, elem[2], elem[1])
        })

        // console.log('dpt.sql', dataPointsTable.sql, 'values', dataPointsTable.values)

        pool.query(dataPointsTable.sql, [dataPointsTable.values])
          .then(() => {
            // var sql =
              // 'update variables set cachedFrom=\'' + from + '\' where contractHash=\'' + contractAddress +
              // '\' and variableName=\'' + method + '\';' +
            // 'update variables set cachedUpTo=\'' + to + '\' where contractHash=\'' + contractAddress +
            // '\' and variableName=\'' + method + '\';'
            var sql =
              'update variables set cachedFrom=\'' + from + '\', cachedUpTo=\'' + to + '\' where contractHash=\'' + contractAddress +
              '\' and variableName=\'' + method + '\''
            console.log('\nsql', sql)
            return pool.query(sql)
          })
          .then(() => {
            return resolve()
          })
          .catch((err) => {
            log.error('db.js: Error in addDataPoints')
            log.error(err)
            process.exit(1)
            return reject(err)
          })
      }
    })
  }

  /* This function takes a variable */
  db.addVariables = function (address, variables) {
    console.log('db.addVariables')
    return new Promise(function (resolve, reject) {

      let variablesTable = getNewVariablesTable()
      variables.forEach((variable) => {
        variablesTable.rows.add(address, variable)
      })
      pool.query(variablesTable.sql, [variablesTable.values])
        .then(() => {
            return resolve()
          }
        )
    })
  }

  /* This function returns *all* the variables in a given date range
   * for a given contract hash
   */
  db.getDataPoints = function (contractHash, method) {
    console.log('db.getDataPoints')
    return new Promise(function (resolve, reject) {
      var sql =
        'select timeStamp, value from (dataPoints inner join blocks on dataPoints.blockNumber = blocks.blockNumber) ' +
        'where dataPoints.contractHash=\'' + contractHash +
        '\' and (dataPoints.variableName=\'' + method + '\')'
      pool.query(sql)
        .then((results) => {
          return resolve(results)
        })
        .catch((err) => {
          log.error('db.js: Error in getDataPoints')
          log.error(err)
          return reject(err)
        })
    })
  }

  db.getVariables = function (contractHash) {
    console.log('db.getVariables')
    return new Promise(function (resolve, reject) {

      var sql = 'select v.variableName, u.unit, u.description from variables as v left join variableUnits as u on v.unitID = u.id where v.contractHash=\'' + contractHash + '\''
      pool.query(sql)
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
    console.log('db.getBlockTime')
    return new Promise(function (resolve, reject) {

      var sql = 'select * from blocks where blockNumber=\'' + blockNumber + '\''
      pool.query(sql)
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
    console.log('db.addBlockTime:values\n',values)
    return new Promise(function (resolve, reject) {

      var valueString = buildValueString(values,2)
      var sql = 'insert into blocks (blockNumber, timeStamp, userLog) values ' + valueString +
        ' on duplicate key update timeStamp = \'' + values[0][1] + '\', userLog=b\'' + values[0][2] + '\''
      pool.query(sql)
        .then(() => {
          return resolve()
        })
        .catch((err) => {
          log.error('db.js: Error in addBlocKTime, you are most likely adding duplicates\n'+sql+', err:',err)
          return reject(err)
        })
    })
      .catch((err) => {
        log.error('db.js: Error 2 in addBlocKTime, you are most likely adding duplicates')
      })
  }

  /* This function returns *all* the variables in a given date range
   * for a given contract hash
   */
  db.getDataPointsInDateRange = function (contractHash, method, from, to) {
    console.log('db.getDataPointsInDateRange')
    return new Promise(function (resolve, reject) {

      var sql =
        'select timeStamp, value from (dataPoints inner join blocks on dataPoints.blockNumber = blocks.blockNumber) ' +
        'where dataPoints.contractHash=\'' + contractHash +
        '\' and (dataPoints.blockNumber between \'' + from + '\' and \'' + to + '\')' +
        ' and (dataPoints.variableName=\'' + method + '\')'
      pool.query(sql)
        .then((results) => {
          return resolve(results)
        })
        .catch((err) => {
          log.error('db.js: Error in getDataPointsInDateRange')
          log.error(err)
          return reject(err)
        })
    })
  }

  db.getCachedFromTo = function (contractHash, method) {
    console.log('db.getCachedFromTo')
    return new Promise(function (resolve, reject) {

      var sql = 'select cachedFrom, cachedUpTo from variables ' +
        'where contractHash=\'' + contractHash + '\' ' +
        'and variableName=\'' + method + '\''
      pool.query(sql)
        .then((results) => {
          return resolve({
            cachedFrom: results[0].cachedFrom,
            cachedUpTo: results[0].cachedUpTo
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
    console.log('db.getLatestCachedBlockTime')
    return new Promise(function (resolve, reject) {

      var sql = 'select MAX(blockNumber) from blocks where userLog=0'
      pool.query(sql).then((results) => {
        return resolve(results[0][''])
      })
    })
  }

  db.searchContract = function (pattern, variables, transactions) {
    console.log('db.searchContract')
    return new Promise(function (resolve, reject) {

      let interspersedPattern = intersperse(pattern, '%')
      let searchField = 'name'
      // if the pattern is a hash, rather than a name
      if (pattern[0] === '0' && (pattern[1] === 'x' || pattern[1] === 'X')) {
        pattern = pattern.substr(2)
        interspersedPattern = pattern + '%'
        searchField = 'contractHash'
      }

      var sql = 'select *, strcmp(' + searchField + ', \'' + pattern +
        '\') as nameDiff' + ' from contracts where ' + searchField + ' LIKE \'' +
        interspersedPattern + '\''

      console.log('sql with difference: ', sql)

      if (variables !== null && variables.length > 0) {
        for (let i = 0; i < variables.length; i++) {
          sql += ' and contracthash in' +
            ' (select contracthash from datapoints inner join blocks' +
            ' on datapoints.blocknumber = blocks.blocknumber where' +
            ' variableName = \'' + variables[i].name + '\''
          if (variables[i].endTime !== '' && variables[i].startTime !== '') {
            sql += ' and (timestamp between ' + variables[i].startTime + ' and ' +
              variables[i].endTime + ')'
          }
          if (variables[i].min !== null && variables[i].max !== null) {
            sql += ' and (value between ' + variables[i].min +
              ' and ' + variables[i].max + ')'
          }
          sql += ')'
        }
      }

      if (transactions !== null && transactions.length > 0) {
        for (let i = 0; i < transactions.length; i++) {
          sql += ' and contracthash in' +
            ' (select contracthash from datapoints inner join blocks' +
            ' on datapoints.blocknumber = blocks.blocknumber where' +
            ' timestamp between ' + transactions[i].startTime + ' and ' +
            transactions[i].endTime + ') ' +
            'limit 5'
        }
      }

      sql += ' order by nameDiff DESC;'
      pool.query(sql).then((results) => {
        return resolve(results)
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
