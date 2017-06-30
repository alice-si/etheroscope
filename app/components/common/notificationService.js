angular.module('aliceApp')
  .service('NotificationService',['$rootScope', 'toastr', function($rootScope, toastr) {

    this.success = function(message) {
      toastr.success(message);
    };

    this.error = function(message) {
      toastr.error(message);
    };

  }]);