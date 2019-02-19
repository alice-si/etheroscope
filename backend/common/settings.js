module.exports.fullBlockchainPath = '/usr/src/app/etheroscope/geth-blockchains/fullRinkebyBlockchain/geth/chaindata'
// module.exports.fullBlockchainPath = '../../Alice/dirForFullRinkeby/geth/chaindata'

module.exports.gethHost = '10.3.255.188'

module.exports.ETHEROSCOPEPARITYTESTNET='35.246.67.158:8545'
module.exports.ETHEROSCOPEPARITYMAINNET=process.env.ETHEROSCOPEPARITYMAINNET
module.exports.ETHEROSCOPEGETHHOST=process.env.ETHEROSCOPEGETHHOST
module.exports.ETHEROSCOPEMARIADB=process.env.ETHEROSCOPEMARIADB
module.exports.ETHEROSCOPEMICROSERVICE=process.env.ETHEROSCOPEMICROSERVICE
module.exports.ETHEROSCOPESERVER=process.env.ETHEROSCOPESERVER
module.exports.ETHEROSCOPEFRONTEND=process.env.ETHEROSCOPEFRONTEND
module.exports.ETHEROSCOPEBLOCKCHAIN=process.env.ETHEROSCOPEBLOCKCHAIN
// module.exports.ETHEROSCOPEBLOCKCHAIN='C:\\Users\\ja1\\Alice\\dirforrinkeby'

module.exports.mysqlConnectionOptions = {
  connectionLimit: 10,
  connectionTimeout: 10000,
  // host: '192.168.99.100',
  host: module.exports.ETHEROSCOPEMARIADB.toString().slice(0,-5),
  port: module.exports.ETHEROSCOPEMARIADB.toString().slice(-4),
  user: 'root',
  password: 'wp',
  database: 'etheroscope'
}

module.exports.dataPointsService = {
  cacheChunkSize: 10000,
  socketPort: 8081
}
