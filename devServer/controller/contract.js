var Fs = require('fs');
var Parity = require("../service/parity");
var Promise = require('bluebird');

module.exports = function (app) {


    app.get('/api/explore/:contractAddress', function (req, res) {
        return Parity.getContract(req.params.contractAddress)
            .then(function (contract) {
                return res.status(200).json(contract);
            }).catch(function (err) {
                console.log(err);
                return res.status(400).json(err.message);
            });
    });

    app.get('/api/getHistory/:contractAddress/:method', function (req, res) {
        return Parity.getContract(req.params.contractAddress).then(function (contract) {
            return Parity.getHistory(req.params.contractAddress).then(function (events) {
                var history = [];
                var i=0;
                var prevTime = 0;
                Promise.map(events, function (event) {
                    return new Promise(function (resolve) {
                        Parity.getBlockTime(event.blockNumber.valueOf()).then(function (time) {
                            if (time === prevTime) return resolve();
                            prevTime = time;
                            Parity.queryAtBlock(contract[req.params.method], event.blockNumber.valueOf()).then(function (val) {
                                history.push([time, val]);
                                console.log("Fetched: " + i + " time: " + time + " val: " + val);
                                i++;
                                return resolve(val);
                            });
                        });
                    });
                }, {concurrency: 20}).then(function () {
                   history.sort(function (a, b) {
                      return a[0] - b[0];
                   });
                   return res.status(200).json(history);
                });
            });
        });
    })
};