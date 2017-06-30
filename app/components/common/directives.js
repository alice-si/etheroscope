/*jshint multistr: true */
angular.module('aliceApp')
  .directive('icheck', ['$timeout', function ($timeout) {
    return {
      require: 'ngModel',
      link: function ($scope, element, $attrs, ngModel) {
        return $timeout(function () {
          var value = $attrs.value;
          $scope.$watch($attrs.ngModel, function (newValue) {
            $(element).iCheck('update');
          });

          $scope.$watch($attrs.ngDisabled, function (newValue) {
            $(element).iCheck(newValue ? 'disable' : 'enable');
            $(element).iCheck('update');
          });

          return $(element).iCheck({
            checkboxClass: 'icheckbox_minimal-blue',
            radioClass: 'iradio_minimal-blue'
          }).on('ifToggled', function (event) {
            if ($(element).attr('type') === 'checkbox' && $attrs.ngModel) {
              $scope.$apply(function () {
                return ngModel.$setViewValue(event.target.checked);
              });
            }
            if ($(element).attr('type') === 'radio' && $attrs.ngModel) {
              return $scope.$apply(function () {
                return ngModel.$setViewValue(value);
              });
            }
          });
        });
      }
    };
  }])
  .directive('hasError', [function () {
    return {
      require: '^form',
      restrict: "A",
      link: function (scope, element, attrs, ctrl) {
        var input = element.find('input, textarea, select');
        if (input.length) {
          scope.$watch(function () {
            return (ctrl.$submitted || input.controller('ngModel').$touched) && input.controller('ngModel').$invalid;
          }, function (isInvalid) {
            element.toggleClass('has-error', isInvalid);
          });
        }
      }
    };
  }])
  .directive('errorMessage', [function () {
    return {
      require: '^form',
      restrict: 'E',
      transclude: true,
      scope: {},
      template: '<span ng-show="(formCtrl.$submitted || inputCtrl.$touched) && inputCtrl.$error[error]" class="help-block" ng-transclude></span>',
      link: function ($scope, element, attrs, ctrl) {
        $scope.formCtrl = ctrl;
        $scope.inputCtrl = ctrl[attrs.name];
        $scope.error = attrs.error;
      }
    };
  }])
  .directive('sort', function() {

    return {
      scope: {
        action: '=',
        field: '@'
      },
      template: '<span style="position: relative; margin-left: 5px;">\
      <i class="fa fa-chevron-up" aria-hidden="true" style="position: absolute; font-size: 14px; color: #1998a2; cursor: pointer;" ng-click="action(field, \'ASC\')"></i>\
      <i class="fa fa-chevron-down" aria-hidden="true" style="position: absolute; font-size: 14px; color: #1998a2; top: 8px; cursor: pointer;" ng-click="action(\'-\' + field, \'ASC\')"></i></span>'
    };
  });
