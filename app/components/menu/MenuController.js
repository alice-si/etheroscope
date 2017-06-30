angular.module('aliceApp')
  .controller('MenuController', ['$state', function($state, AuthService) {
    var vm = this;
    vm.$state = $state;

    return vm;
  }])
  
  .directive('menuHeader', function() {
    return {
      templateUrl : '/components/menu/menuHeaderTemplate.html'
    };
  }); 



