module.exports.fullBlockchainPath = '../geth-blockchains/fullRinkebyBlockchain/geth/chaindata'
// module.exports.fullBlockchainPath = '../../Alice/dirForFullRinkeby/geth/chaindata'

module.exports.gethHost = '10.3.255.188'

module.exports.mysqlConnectionOptions = {
  connectionLimit: 10,
  connectionTimeout: 10000,
  // host: '192.168.99.100',
  host: '10.3.240.97',
  port: '8083',
  user: 'root',
  password: 'wp',
  database: 'etheroscope'
}
