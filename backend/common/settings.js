module.exports.ETHEROSCOPEPARITYMAINNET="35.246.67.158:8545"
module.exports.allowedOrigin = process.env.FRONTEND_IP || "*"

module.exports.server = {
  etherscanAPIKey: "RVDWXC49N3E3RHS6BX77Y24F6DFA8YTK23",
  port: 8080,
  cacheChunkSize: 100000,
  popularContractsDays: 7,
  popularContractsLimit: 10,
  contractNotVerified: 'Contract source code not verified',
}

module.exports.dataPointsService = {
  cacheChunkSize: 10000,
  socketPort: 8081,
  cachedFrom: 1,
}

module.exports.RABBITMQ = {
  address: process.env.RABBITMQADDRESS || "localhost",
  queue: 'address_queue',
  user: process.env.RABBITMQUSER || "guest",
  password: process.env.RABBITMQPASSWORD || "guest",
  messageTtl: 2 ** 32 - 1,
}
