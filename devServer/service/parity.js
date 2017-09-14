var axios = require('axios');
var Web3 = require('web3');
var Promise = require('bluebird');
var Level = require('level');
var Config = require('../../config');


var contractCache = Level('./db/contracts');
var blockCache = Level('./db/blocks');

var web3 = new Web3(new Web3.providers.HttpProvider(Config.parityUrl));

function Parity() {
}

Parity.parseContract = function(desc, address) {
    var contractABI = JSON.parse(desc);
    var Contract = web3.eth.contract(contractABI);
    return Contract.at(address);
}

Parity.getContract = function (address) {
  return new Promise(function (resolve, reject) {
      contractCache.get(address, function (err, value) {
              if (err) {
                  return axios.get("https://api.etherscan.io/api?module=contract&action=getabi&address=" + address + "&apikey=KEKY5TS8G2WH712WG3SY5HWDHD2HNIUPJD")
                      .then(function (response) {
                          var desc = response.data.result;
                          contractCache.put(address, desc);
                          return resolve(Parity.parseContract(desc, address));
                      }).catch(function (err) {
                          return reject(err);
                      });
              }
              return resolve(Parity.parseContract(value, address));
          }) ;
  });
};

Parity.queryAtBlock = function (query, block) {
  var hex = "0x" + block.toString(16);
  web3.eth.defaultBlock = hex;
  return new Promise(function (resolve, reject) {
    return query(function (err, result) {
      if (err) return reject(err);
      return resolve(parseInt(result.valueOf()));
    });
  });
};

Parity.getBlockTime = function (blockNumber) {
  var approx = Math.round(blockNumber / 1000) * 1000;
  return new Promise(function (resolve) {
    blockCache.get(approx, function (err, value) {
      if (err) {
        var time = web3.eth.getBlock(approx).timestamp * 1000;
        blockCache.put(approx, time, function (err) {
          if (err) console.log(err);
        });
        return resolve(time);
      } else {
        return resolve(value);
      }
    });
  });
};

Parity.getMaxCachedBlock = function () {
  var max = 0;
  return new Promise(function (resolve) {
    blockCache.createReadStream()
      .on('data', function (data) {
        if (parseInt(data.key) > max) max = parseInt(data.key);
      })
      .on('end', function () {
        return resolve(max);
      });
  });
};

Parity.getHistory = function (address) {
  var startTime = new Date().getTime();
  var startBlock = web3.eth.blockNumber - 100000;
  console.log("From block: " + startBlock);
  return new Promise(function (resolve, reject) {
    web3.trace.filter({"fromBlock": "0x" + startBlock.toString(16), "toAddress": [address]}, function (err, traces) {
      console.log("Fetched in : " + (new Date().getTime() - startTime));
      console.log("Browsing through " + traces.length + " transactions");
      if (err) return reject(err);
      return resolve(traces);
    });
  });
};

module.exports = Parity;

