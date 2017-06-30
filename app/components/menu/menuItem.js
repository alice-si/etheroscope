/*jshint multistr: true */
angular.module('aliceApp').directive('menuItem', function () {
  return {
    scope: {},
    bindToController: {
      target: '@',
      label: '@',
      last: '='
    },
    replace: true,
    template: '<li class="menu-item {{ctrl.$state.current.name == ctrl.target ? \'active\' : \'\'}}">\
                 <a class="page-scroll" href="/{{ctrl.target}}">{{ctrl.label}}<span ng-hide="ctrl.last" class="divider hidden-xs">|</span></a>\
               </li>',
    controller: ['$state', function ($state) {
      this.$state = $state;
      this.label = this.target.replace(/-/g, ' ');
    }],
    controllerAs: 'ctrl'
  };
});
