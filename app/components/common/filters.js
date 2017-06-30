angular.module('aliceApp')
  .filter('money',['numberFilter', function (numberFilter) {

    return function (val) {
      if (val === null || val === undefined) return '';
      val = val / 100;
      var isInteger = (val % 1 === 0);
      return "£" + numberFilter(val, isInteger ? 0 : 2);
    };
  }])
  .filter('rounded',['numberFilter', function (numberFilter) {
    return function (val) {
      if (val === null || val === undefined) return '';
      return "£" + numberFilter(val/100, 0);
    };
  }]);