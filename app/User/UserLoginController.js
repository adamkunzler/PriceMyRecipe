;(function(undefined) {
	'use strict';

	angular.module('app.recipe')
		.controller('UserLoginController', function($scope, $log, $location, validationService, UserService) {
			$scope.login = function(username, password) {
				if(!new validationService().checkFormValidity($scope.frmUserLogin)) return;

				var encoded = btoa(password);
				UserService.login(username, encoded)
					.then(function success(isLoginSuccess) {
						if(isLoginSuccess) {
							$log.log('logged in...');
							$location.path('/recipe');
						}
					}, function error(errorData) {
						$scope.login.error = errorData;
					});
			};

			var init = function() {

			};

			init();
		});
})();