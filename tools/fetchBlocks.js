var Parity = require('../devServer/service/parity');
var Web3 = require('web3');

var providerUrl = "http://localhost:8545";
var web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));

var currentBlock = web3.eth.blockNumber;

var fetch = function (i, max) {
  var b = i * 1000;
  Parity.getBlockTime(b).then(function (time) {
    console.log("Block: " + b + " at: " + time);
    if (i < max) fetch(i + 1, max);
  });
};


Parity.getMaxCachedBlock().then(function(cached) {
  console.log("Current block: " + currentBlock + " Max cached: " + cached);
  var max = Math.floor(currentBlock/1000);
  if (cached/ 1000 < max) {
    fetch(cached / 1000, max);
  }
});

