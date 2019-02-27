module.exports.ETHEROSCOPEFRONTEND=process.env.ETHEROSCOPEFRONTEND
module.exports.ETHEROSCOPESERVER=process.env.ETHEROSCOPESERVER
module.exports.ETHEROSCOPEDATAPOINTSSERVICE=process.env.ETHEROSCOPEDATAPOINTSSERVICE
module.exports.ETHEROSCOPEPARITYMAINNET=process.env.ETHEROSCOPEPARITYMAINNET
module.exports.ETHEROSCOPEMARIADB=process.env.ETHEROSCOPEMARIADB

// module.exports.ETHEROSCOPECONTRACTINFOSERVICE=process.env.ETHEROSCOPECONTRACTINFOSERVICE
// module.exports.ETHEROSCOPEBLOCKTIMESTAMPSERVICE=process.env.ETHEROSCOPEBLOCKTIMESTAMPSERVICE
// tmeporary
module.exports.ETHEROSCOPECONTRACTINFOSERVICE="localhost:8085"
module.exports.ETHEROSCOPEBLOCKTIMESTAMPSERVICE="localhost:8086"
module.exports.ETHEROSCOPETRANSACTIONLISTSERVICE="localhost:8087"

module.exports.mysqlConnectionOptions = {
  connectionLimit: 10,
  connectionTimeout: 10000,
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
