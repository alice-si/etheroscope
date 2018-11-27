var mysql = require('promise-mysql')
var mysqlConnectionOptions = require('../../backend/settings.js').mysqlConnectionOptions

var optionsBeforeDBCreation = JSON.parse(JSON.stringify(mysqlConnectionOptions)) // full copy
delete optionsBeforeDBCreation['database'] // delete database field

console.log('opt\n', optionsBeforeDBCreation)

var pool = mysql.createPool(optionsBeforeDBCreation)

function createDatabase () {
  pool.query('create database etheroscope')
    .then(function (results) {
      console.log('Database creation success! results:\n ', results)
      pool = mysql.createPool(mysqlConnectionOptions)
    })
    .catch(function (err) {
      console.log('Database cretion error:\n', err)
      pool = mysql.createPool(mysqlConnectionOptions)
    })
}

var sqlContracts = 'create table if not exists contracts(\n' +
  '    contractHash VARCHAR(40)  not null,\n' +
  '    name         VARCHAR(128),\n' +
  '    abi          NVARCHAR(11844),\n' +
  '    primary key (contractHash)\n' +
  ');\n'
var sqlContractLookupHistory = 'create table if not exists contractLookupHistory(\n' +
  '    contractHash VARCHAR(40)  not null,\n' +
  '    date         datetime,\n' +
  '    primary key (contractHash, date)\n' +
  ');\n'
var sqlBlocks = 'create table if not exists blocks(\n' +
  '    blockNumber BIGINT   not null,\n' +
  '    timeStamp   BIGINT   not null,\n' +
  '    userLog     BIT      not null,\n' +
  '    primary key (blockNumber)\n' +
  ');\n'
var sqlVariables = 'create table if not exists variables(\n' +
  '    contractHash VARCHAR(40) not null,\n' +
  '    variableName VARCHAR(50) not null,\n' +
  '    cachedFrom   BIGINT,\n' +
  '    cachedUpTo   BIGINT,\n' +
  '    unitID       BIGINT,\n' +
  '    primary key (contractHash, variableName)\n' +
  ');\n'
var sqlVariableUnits = 'create table if not exists variableUnits(\n' +
  '    id          BIGINT not null,\n' +
  '    variable    VARCHAR(50) not null,\n' +
  '    unit        VARCHAR(50) not null,\n' +
  '    description NVARCHAR(11844),\n' +
  '    primary key (id)\n' +
  ');\n'
var sqlDataPoints = 'create table if not exists dataPoints(\n' +
  '    contractHash VARCHAR(40) not null,\n' +
  '    variableName VARCHAR(50) not null,\n' +
  '    blockNumber  BIGINT      not null,\n' +
  '    value        VARCHAR(78) not null,\n' +
  '    primary key (contractHash, variableName, blockNumber),\n' +
  '    foreign key (contractHash) references contracts(contractHash),\n' +
  '    foreign key (blockNumber) references  blocks(blockNumber),\n' +
  '    foreign key (contractHash, variableName) references  variables(contractHash, variableName)\n' +
  ');\n'

function createTables () {
  pool.query(sqlContractLookupHistory).then(function (results) {
    console.log('create table (' + sqlContractLookupHistory + '): ', results)
  }).then(() => {
    pool.query(sqlContracts).then(function (results) {
      console.log('create(' + sqlContracts + '): ', results)
    })
  }).then(() => {
    pool.query(sqlBlocks).then(function (results) {
      console.log('create(' + sqlBlocks + '): ', results)
    })
  }).then(() => {
    pool.query(sqlVariables).then(function (results) {
      console.log('create(' + sqlVariables + '): ', results)
    })
  }).then(() => {
    pool.query(sqlVariableUnits).then(function (results) {
      console.log('create(' + sqlVariableUnits + '): ', results)
    })
  }).then(() => {
    pool.query(sqlDataPoints).then(function (results) {
      console.log('create(' + sqlDataPoints + '): ', results)
    })
  })

}

async function addBlocksWithTimestamps () {

  var step = 10000          // size of inserted block pack
  var startBlock = 0
  // var endBlock = 1000000
  var endBlock = 4500000

  var timesStampOfFirstBlock = 1492107044

  var i = startBlock // second for iterator
  var sql
  for (var curEndBlock = startBlock + step; curEndBlock < endBlock; curEndBlock += step) {

    var array = []

    for (; i < curEndBlock; i++) {
      var blockNumber = i
      await array.push([blockNumber, timesStampOfFirstBlock + (blockNumber * 15), 0])

    }
    console.log('pushed to array block', blockNumber, 'percent completed (+/-', parseInt(step / endBlock), '):', 100 * (blockNumber / endBlock), '%')

    sql = 'insert into blocks (blockNumber, timeStamp, userLog) values ?'
    pool.query(sql, [array], console.log)
  }
  console.log('[setupNewDatabase.js]: Pushing blocks completed, turn off this script.\n')
}

setTimeout(createDatabase, 500)
setTimeout(createTables, 3500)
setTimeout(createTables, 5500) // datapoints table doesnt create first time
setTimeout(addBlocksWithTimestamps, 7500)
