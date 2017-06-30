var Fs = require('fs');
var Parity = require("../service/parity");

module.exports = function (app) {


  app.get('/api/explore/:contractAddress', function (req, res) {
    return Parity.getContract(req.params.contractAddress)
      .then(function(contract) {
        return res.status(200).json(contract);
    }).catch(function(err) {
        console.log(err);
        return res.status(400).json(err.message);
    });
  });

  app.get('/api/getHistory/:contractAddress/:method', function(req, res) {
    return Parity.getContract(req.params.contractAddress).then(function(contract) {
      return Parity.getHistory(req.params.contractAddress).then(function(events) {
        var promises = [];
        var history = [];
        events.forEach(function(event) {
          promises.push(new Promise(function(resolve) {
            Parity.queryAtBlock(contract[req.params.method], event.blockNumber.valueOf()).then(function(val) {
              Parity.getBlockTime(event.blockNumber.valueOf()).then(function(time) {
                history.push([time, val]);
                return resolve(val);
              });
            });
          }));
        });
        return Promise.all(promises).then(function() {
          history.sort(function(a,b) {
            return a[0] - b[0];
          });
          return res.status(200).json(history);
        });
      });
    });
  });
};