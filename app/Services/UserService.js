;(function(undefined) {
	'use strict';

	angular.module('app.recipe')
		.factory('UserService', function($q, $log, $cookies, $location, pmrConfig, DALService) {
			var service = {};

			var rootUrl = 'http://apps.adamkunzler.com/tempPrice/PHP/users.php';

			service.login = function(username, encodedPassword) {
				var params = [
                		'username=' + username,
                        'password=' + encodedPassword
                    ];

                return DALService.executeQuery(rootUrl, 'login', params)
                    .then(function(data) {
                        if(angular.isDefined(data) && data.id) {
                            service.currentUser = {};
							service.currentUser.id = parseInt(data.id);
							service.currentUser.username = data.username;
							service.currentUser.isAdmin = data.isAdmin === 'true';

							// lazy authentication
							service.authValue = btoa(data.id + data.username + pmrConfig.SECRET_WORD);
							$cookies.put('pmr_' + data.username, service.authValue);

                            return true;
                        } else {
                            return $q.reject('Invalid username or password.');
                        }
                    }, function(errResponse) {
                        $log.log('SERVICE ERROR: ' + errResponse);
                    });
			};

			service.logout = function() {
				$log.log('logging out...');
				$cookies.remove('pmr_' + service.currentUser.username);
				$location.path('/login');

			};

			service.isAdmin = function() {
				return (angular.isDefined(service.currentUser) && service.currentUser.isAdmin);
			};

			service.isAuthenticated = function() {
				if(!angular.isDefined(service.currentUser)) return false;

				return $cookies.get('pmr_' + service.currentUser.username) === service.authValue;
			};

			return service;
		});
})();