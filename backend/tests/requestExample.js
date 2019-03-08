var rabbitMqApi = require('../common/rabbitMq')

rabbitMqApi.getBlockTimestamp(1234,(timestamp)=>{console.log('recieved timestamp '+timestamp)})