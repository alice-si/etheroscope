var rabbitMqApi = require('./rabbitMqApi')

rabbitMqApi.getBlockTimestamp(1234,(timestamp)=>{console.log('recieved timestamp '+timestamp)})