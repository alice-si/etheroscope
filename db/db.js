var sql = require('mysql')
var login = require('./login.js')
var path = require('path')

/* ESTABLISHING A CONNECTION
 * Here we create a connection pool to the sql server.
 * we store the configuration in a separate module, login.js.
 */
var pool = sql.createPool({
  connectionLimit: 10,
  host: login.hostname,
  user: login.username,
  password: login.password,
  database: login.database
})

function poolquery (sql) {
  return new Promise((resolve, reject) => {
    pool.query(sql, (err, rows) => {
      if (err) return reject(err)
      resolve(rows)
    })
  })
}

function poolbulk (sql, values) {
  return new Promise((resolve, reject) => {
    pool.query(sql, values, (err, rows) => {
      if (err) return reject(err)
      resolve(rows)
    })
  })
}

function createTables () {
  let fs = require('fs')
  return new Promise((resolve, reject) => {
    fs.readFile(path.join(__dirname, '/dbschema.ddl'), function (err, data) {
      if (err) {
        throw err
      }
      poolquery(data.toString(), (err, result) => {
        if (err) {
          console.log('db.js: Error creating tables - perhaps they already exist')
          console.log(err)
        }
      })
    })
  })
}

let tables =
  ['contracts',
    'contractLookupHistory',
    'blocks',
    'variables',
    'variableUnits',
    'dataPoints']

// Check to see if we have all the tables we want in the database
function checkTables () {
  return new Promise(function (resolve, reject) {
    let query = "SELECT count(*) as count FROM information_schema.TABLES WHERE (TABLE_SCHEMA = 'etheroscope') AND (TABLE_NAME in (" + "'" + tables.join("', '") + "'" + '));'
    poolquery(query).then(rows => {
      console.log('muh rows')
      console.log(rows)
      if (rows[0].count === tables.length) {
        resolve()
      }
      if (rows[0].count === 0) {
        createTables().then(() => {
          resolve()
        })
      }
      reject(new Error('db.js: error - tables not set up correctly'))
    })
  })
}

module.exports = function (log) {
  var db = {}

  db.poolConnect = function () {
    log.info('db.js: Connecting to pool')
    return new Promise(function (resolve, reject) {
      checkTables().then(() => {
        resolve()
      }).catch((err) => {
        return reject(err)
      })
    })
  }

  /* This function takes in a list of contracts of the form:
   * Note: Address is without '0x' prefix..
   * [{address: '0123456789...', name: 'name', abi: '...'}], and returns a promise
   */
  db.addContracts = function (contracts) {
    return new Promise(function (resolve, reject) {
      let values = []
      contracts.forEach((contract) => {
        if (contract.abi) contract.abi = JSON.stringify(contract.abi)
        values.push([contract.address, contract.name, contract.abi])
      })
      poolbulk('insert into contracts (address, name, abi) values ?', [values])
        .then(() => {
          console.log('Added contract to contract table: ' + contracts[0].address)
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
      var query = "update contracts set abi=? where address='" + address + "'"
      poolbulk(query, [JSON.stringify(parsedContract)])
      .catch((err) => {
        log.error('db.js: Error in updateContractWithABI')
        log.error(err)
      })
    })
  }

  db.addContractLookup = function (address) {
    return new Promise(function (resolve, reject) {
      var query = "insert into contractLookupHistory (address, date) values ('" + address + "', NOW())"
      poolquery(query)
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
      var query = 'select address, COUNT(*) as searches ' +
                  'from contractLookupHistory where DATEDIFF(date, NOW()) < ' +
                   timeAmount + ' ' +
                  'GROUP BY address ' +
                  'ORDER BY searches desc ' +
                  'LIMIT ' + limit

      var joined = 'select contracts.address, name, searches from (' + query +
                   ') as popular join contracts on contracts.address = popular.address'
      poolquery(joined)
        .then((result) => {
          return resolve(result)
        })
        .catch((err) => {
          log.error('db.js: Error in getPopularContracts')
          log.error(err)
        })
    })
  }

  /* This function takes in a contract address
   * and returns a promise
   */
  db.getContract = function (address) {
    return new Promise(function (resolve, reject) {
      var query = "select name, abi from contracts where address='" + address + "'"
      poolquery(query)
        .then((results) => {
          let result = { contractName: null, contract: null }
          if (results.length !== 0) {
            result.contractName = results[0].name
            let abi = results[0].abi
            if (abi) {
              result.contract = JSON.parse(abi)
            }
          } else {
            db.addContracts([{ address: address, name: null, abi: null }])
              .then(() => {
                return resolve(result)
              })
              .catch((err) => {
                log.error('db.js: Error in getContract after addContracts')
                log.error(err)
                return reject(err)
              })
          }
          return resolve(result)
        })
        .catch((err) => {
          log.error('db.js: Error in getContract')
          log.error(err)
          return reject(err)
        })
    })
  }

  function addDataPoints (connection, values) {
    return new Promise(function (resolve, reject) {
      if (values.length !== 0) {
        connection.query('insert into dataPoints (address, variableName, blockNumber, value) values ?', [values], (err) => {
          console.log('4')
          if (err) {
            console.log('REEE error' + err)
            connection.rollback(() => {
              throw err
            })
          }
          return resolve()
        })
      } else {
        return resolve()
      }
    })
  }

  function updateFromUpTo (connection, address, method, from, upTo) {
    return new Promise(function (resolve, reject) {
      let query =
        'update variables set cachedFrom=?, cachedUpTo=?' +
        ' where address=? ' +
        'and variableName=?;'
      connection.query(query, [from, upTo, address, method], (err) => {
        console.log('5')
        if (err) {
          return connection.rollback(() => {
            throw err
          })
        }
        return resolve()
      })
    })
  }

  /* This function takes in a contract address, method and
   * array of arrays of the form: [[time, 'value', blockNum]]
   * time is currently ignored
   */
  db.addDataPoints = function (address, method, points, from, upTo) {
    return new Promise(function (resolve, reject) {
      let values = []
      console.log('points are:')
      console.log(points)
      points.forEach((point) => {
        values.push([address, method, point.block, point.value])
      })
      console.log('1')
      pool.getConnection((err, connection) => {
        console.log('2')
        if (err) throw err
        connection.beginTransaction((err) => {
          console.log('3')
          if (err) throw err
          console.log('values are: ')
          console.log(values)
          addDataPoints(connection, values).then(() => {
            return updateFromUpTo(connection, address, method, from, upTo)
          }).then(() => {
            connection.commit((err) => {
              console.log('6')
              if (err) {
                return connection.rollback(() => {
                  throw err
                })
              }
              console.log('success!')
              connection.release()
              return resolve()
            })
          })
        })
      })
    })
  }

  /* This function takes a variable */
  db.addVariables = function (address, variables) {
    return new Promise(function (resolve, reject) {
      let values = []
      variables.forEach((variable) => {
        values.push([address, variable])
      })
      poolbulk('insert into variables (address, variableName) values ?', [values])
      .then(() => {
        return resolve()
      })
    })
  }

  /* This function returns *all* the variables in a given date range
   * for a given contract address
   */
  db.getDataPoints = function (address, method) {
    return new Promise(function (resolve, reject) {
      var query =
        'select timeStamp, value from (dataPoints inner join blocks on dataPoints.blockNumber = blocks.blockNumber) ' +
        "where dataPoints.address='" + address +
        "' and (dataPoints.variableName='" + method + "')"
      poolquery(query)
        .then((results) => {
          console.log('dataPoints are:')
          console.log(results)
          console.log('done datapoints')
          return resolve(results)
        })
        .catch((err) => {
          log.error('db.js: Error in getDataPoints')
          log.error(err)
          return reject(err)
        })
    })
  }

  db.getVariables = function (address) {
    return new Promise(function (resolve, reject) {
      var query = "select v.variableName as variableName, u.unit, u.description from variables as v left outer join variableUnits as u on v.unitID = u.id where v.address='" + address + "'"
      poolquery(query)
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
      var query = "select * from blocks where blockNumber='" + blockNumber + "'"
      poolquery(query)
        .then((results) => {
          console.log('db results are')
          console.log(results)
          return resolve(results)
        })
        .catch((err) => {
          log.error('db.js: Error in getBlockTime')
          log.error(err)
          process.exit(1)
        })
    })
  }

  db.addBlockTime = function (blockTimes) {
    return new Promise(function (resolve, reject) {
      var values = []
      blockTimes.forEach((blockTime) => {
        // BlockNumber, Timestamp, Userlog
        values.push([blockTime[0], blockTime[1], blockTime[2]])
      })
      poolbulk('insert into blocks (blockNumber, timeStamp, userLog) values ?', [values])
        .then(() => {
          return resolve()
        })
        .catch((err) => {
          log.error('db.js: Error in addBlockTime, you are most likely adding duplicates')
          return reject(err)
        })
    })
  }

  /* This function returns *all* the variables in a given date range
   * for a given contract address
   */
  db.getDataPointsInDateRange = function (address, method, from, to) {
    return new Promise(function (resolve, reject) {
      var query =
        'select timeStamp, value from (dataPoints inner join blocks on dataPoints.blockNumber = blocks.blockNumber) ' +
        "where dataPoints.address='" + address +
        "' and (dataPoints.blockNumber between '" + from + "' and '" + to + "')" +
        " and (dataPoints.variableName='" + method + "')"
      poolquery(query)
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

  db.getCachedFromTo = function (address, method) {
    return new Promise(function (resolve, reject) {
      var query = 'select cachedFrom, cachedUpTo from variables ' +
        "where address='" + address + "' " +
        "and variableName='" + method + "'"
      poolquery(query)
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
    return new Promise(function (resolve, reject) {
      var query = 'select MAX(blockNumber) from blocks where userLog=0'
      poolquery(query).then((results) => {
        return resolve(results[0][''])
      })
    })
  }

  db.searchContract = function (pattern, variables, transactions) {
    return new Promise(function (resolve, reject) {
      let interspersedPattern = intersperse(pattern, '%')
      let searchField = 'name'
      // if the pattern is a hash, rather than a name
      if (pattern[0] === '0' && (pattern[1] === 'x' || pattern[1] === 'X')) {
        interspersedPattern = pattern + '%'
        searchField = 'address'
      }

      var query = 'select address, name'/*, difference(' + searchField + ', \'' + pattern +
        '\') as nameDiff' */+ ' from contracts where ' + searchField + ' LIKE \'' +
        interspersedPattern + '\''

      if (variables !== null && variables.length > 0) {
        for (let i = 0; i < variables.length; i++) {
          query += ' and address in' +
            ' (select address from datapoints inner join blocks' +
            ' on datapoints.blocknumber = blocks.blocknumber where' +
            ' variableName = \'' + variables[i].name + '\''
          if (variables[i].endTime !== '' && variables[i].startTime !== '') {
            query += ' and (timestamp between ' + variables[i].startTime + ' and ' +
            variables[i].endTime + ')'
          }
          if (variables[i].min !== null && variables[i].max !== null) {
            query += ' and (value between ' + variables[i].min +
            ' and ' + variables[i].max + ')'
          }
          query += ')'
        }
      }

      if (transactions !== null && transactions.length > 0) {
        for (let i = 0; i < transactions.length; i++) {
          query += ' and address in' +
            ' (select address from datapoints inner join blocks' +
            ' on datapoints.blocknumber = blocks.blocknumber where' +
            ' timestamp between ' + transactions[i].startTime + ' and ' +
            transactions[i].endTime + ')'
        }
      }

      // query += ' order by nameDiff DESC'
      query += ' limit 5'
      poolquery(query).then((results) => {
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
