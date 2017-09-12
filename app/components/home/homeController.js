angular.module('aliceApp')
  .controller('HomeController', ['$rootScope', '$timeout', '$http', 'NotificationService', 'API', function ($rootScope, $timeout, $http, NotificationService, API) {
    var vm = this;

    vm.favourites = {
      'Alice' : "0xBd897c8885b40d014Fb7941B3043B21adcC9ca1C",
      'The DAO' : "0xbb9bc244d798123fde783fcc1c72d3bb8c189413"
    };

    vm.selectFavourite = function(val) {
      vm.contractAddress = val;
      vm.explore();
    };

    vm.explore = function () {
      if (vm.searchForm.$valid) {
        vm.waiting = true;
        $http.get(API + 'explore/' + vm.contractAddress).then(
          function (response) {
            console.log(response.data);
            var abi = response.data.abi;
            vm.methods = [];
            abi.forEach(function(item) {
              if (item.outputs && item.outputs.length === 1 && item.outputs[0].type.indexOf('uint') === 0) {
                if (item.inputs.length === 0) {
                  vm.methods.push(item.name);
                }
              }
            });
            vm.waiting = false;
          }, function (rejection) {
            NotificationService.error(rejection.data);
            vm.sending = false;
          }
        );
      }
    };

    vm.getHistory = function (method) {
      vm.waiting = true;
        $http.get(API + 'getHistory/' + vm.contractAddress + '/' + method).then(
          function (response) {
            console.log(response.data);
            vm.donationsChartData[0].data = response.data;
            vm.chartOptions.xaxis.min = response.data[0][0];
            vm.chartOptions.xaxis.max = response.data[response.data.length - 1][0];
            vm.chartOptions.yaxis.max = response.data[response.data.length - 1][1];

            vm.waiting = false;
          }, function (rejection) {
            NotificationService.error(rejection.data);
            vm.sending = false;
          }
        );
    };

    vm.onChartHover = function (event) {
      console.log(event);
    };

    vm.chartOptions = {
      grid: {
        borderWidth: {top: 0, right: 0, bottom: 1, left: 1},
        borderColor: {left: "#1998a2", bottom: "#1998a2"},
        labelMargin: 10,
        color: "#B7B7B7"
      },
      xaxis: {
        mode: "time",
        minTickSize: [1, "day"],
        min: (new Date(2017, 0, 1)).getTime(),
        max: (new Date(2017, 11, 31)).getTime()
      },
      yaxis: {
        min: 0,
        max: 50000
      },
      series: {
        lines: {show: true, lineWidth: 4},
        points: {show: true, radius: 5, fill: true}
      }
    };

    vm.donationsChartData = [
      {color: '#1998a2', points: {fillColor: "#1998a2"}}
    ];


    return vm;
  }]);