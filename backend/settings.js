module.exports.fullBlockchainPath = '../geth-blockchains/fullRinkebyBlockchain/geth/chaindata'
// module.exports.fullBlockchainPath = '../../Alice/dirForFullRinkeby/geth/chaindata'

module.exports.mysqlConnectionOptions = {
  connectionLimit: 10,
  connectionTimeout: 10000,
  // host: '192.168.99.100',
  host: 'localhost',
  port: '8083',
  user: 'root',
  password: 'wp',
  database: 'etheroscope'
}
