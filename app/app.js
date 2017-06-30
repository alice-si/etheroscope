angular.module('aliceApp', ['ui.router', 'ngCookies', 'angular-jwt', 'ui.bootstrap', 'ui.bootstrap.modal', 'ngAnimate',
  'toastr', 'ngFileUpload', 'angularMoment', 'datetime', 'ngSanitize', 'ng-currency',
  'angular-svg-round-progressbar', 'treasure-overlay-spinner', 'ui.bootstrap', 'angular-flot'])

  .constant('AUTH_EVENTS', {
    notAuthenticated: 'auth-not-authenticated'
  })

  .constant(function(envConfig) {envConfig();})
  
  .config(['toastrConfig', function(toastrConfig) {
    angular.extend(toastrConfig, {
      timeOut: '10000',
      containerId: 'toast-container',
      maxOpened: 0,
      newestOnTop: true,
      positionClass: 'toast-top-center',
      preventDuplicates: false,
      preventOpenDuplicates: false,
      target: 'body'
    });
  }])

  .config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.otherwise('/');

    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: '/components/home/homeView.html'
      });
  }])

  .factory('ErrorInterceptor', ['$rootScope', '$q', '$injector', function ($rootScope, $q) {
    return {
      responseError: function (response) {
        $rootScope.$broadcast("server:error", response);
        return $q.reject(response);
      }
    };
  }])

  .config(['$httpProvider', function ($httpProvider) {
    $httpProvider.interceptors.push('ErrorInterceptor');
  }])

  .config(['$locationProvider', function($locationProvider) {
      $locationProvider.html5Mode({
        enabled: true
      }).hashPrefix('');
  }])

  .run(['$rootScope', '$state', '$location', function ($rootScope, $state, $location) {
    //Activate WOW animations
    new WOW().init();

    //Autoscroll to top after route change
    $rootScope.$on('$stateChangeSuccess', function() {
      document.body.scrollTop = document.documentElement.scrollTop = 0;
    });

    $rootScope.$on('$stateChangeSuccess', function(){
      ga('send', 'pageview', $location.path());
    });

  }]);
