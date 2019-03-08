module.exports.ETHEROSCOPEFRONTEND=process.env.ETHEROSCOPEFRONTEND
module.exports.ETHEROSCOPESERVER=process.env.ETHEROSCOPESERVER
module.exports.ETHEROSCOPEDATAPOINTSSERVICE=process.env.ETHEROSCOPEDATAPOINTSSERVICE
module.exports.ETHEROSCOPEPARITYMAINNET=process.env.ETHEROSCOPEPARITYMAINNET
module.exports.ETHEROSCOPEMARIADB=process.env.ETHEROSCOPEMARIADB
// module.exports.RABBITMQHOST='192.168.99.100'
// module.exports.RABBITMQHOST='35.189.85.243'
// module.exports.RABBITMQHOST='35.246.65.214'
module.exports.RABBITMQHOST='35.197.222.111'
// module.exports.RABBITMQHOST='10.3.249.34'
// module.exports.RABBITMQHOST=process.env.RABBITMQHOST


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
