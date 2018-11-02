
var mysql = require('promise-mysql')
var sqlContracts = 'create table if not exists Contracts(\n' +
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

function test () {
  pool.query('SELECT 1 + 1 AS solution').then(function (results) {
    console.log('The solution is: ', results[0].solution)
  })
  // pool.query(strangeString).then(function (results) {
  //   console.log('Create if not exist: ', results)
  // })
  pool.query(sqlVariableUnits).then(function (results) {
    console.log('Show tables: ', results)
  })

  pool.query(sqlContractLookupHistory).then(function (results) {
    console.log('create: ', results)
  }).then(() => {
    pool.query(sqlContracts).then(function (results) {
      console.log('create: ', results)
    })
  }).then(() => {
    pool.query(sqlBlocks).then(function (results) {
      console.log('create: ', results)
    })
  }).then(() => {
    pool.query(sqlVariables).then(function (results) {
      console.log('create: ', results)
    })
  }).then(() => {
    pool.query(sqlVariableUnits).then(function (results) {
      console.log('create: ', results)
    })
  }).then(() => {
    pool.query(sqlDataPoints).then(function (results) {
      console.log('create: ', results)
    })
  })

  pool.query('show tables').then(function (results) {
    console.log('Show tables: ', results)
  })
  // pool.query('SHOW DATABASES').then(function (results) {
  //   console.log('Show databases: ', results)
  // })
}

const pool = mysql.createPool({
  connectionLimit: 10,
  connectionTimeout: 10000,
  host: '192.168.99.100',
  port: '8083',
  user: 'root',
  password: 'wp',
  database: 'etheroscope'
})

test()
