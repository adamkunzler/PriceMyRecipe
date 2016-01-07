;(function(undefined) {
	'use strict';

	angular.module('app.recipe')
		.factory('DALService', function($http, $q, $log) {
			var service = {};

			/*
				Executes a query and returns the result
			 */
			service.executeQuery = function(url, query, params) {
				var queryParams = getQueryParams(params);

				return $http.get(url + '?query=' + query + queryParams)
                    .then(function(response) {
                    	var errors = isErrors(response);
                        if (errors) {
                        	return $q.reject('ERROR: ' + errors);
                        }

                        return (response.data.length === 1) ? response.data[0] : response.data;
                    }, function errorCallback(response) {
                    	var msg = 'SERVER ERROR: ' + query + ' : '+ queryParams + ' : msg=' + JSON.stringify(response);
                        $log.log(msg);
                        return $q.reject(msg);
                    });
			};

			/*
				Executes a non-query statement (e.g. INSERT, UPDATE, DELETE) and resutrs an object
				with some of the following properties: rowsAffected, generatedId
			 */
			service.executeNonQuery = function(url, query, params) {
				var queryParams = getQueryParams(params);

				return $http.get(url + '?query=' + query + queryParams)
					.then(function(response) {
						var errors = isErrors(response);
                        if (errors) {
                        	return $q.reject('ERROR: ' + errors);
                        }

                        return response.data[0];
					}, function errorCallback(response) {
						var msg = 'SERVER ERROR: ' + query + ' : '+ queryParams + ' : msg=' + JSON.stringify(response);
                        $log.log(msg);
                        return $q.reject(msg);
					});
			};

			// function to take an array of params and turn it into a url string
			function getQueryParams(params) {
				var queryParams = '';

				if(params) {
					for(var i = 0; i < params.length; i++) {
						queryParams += '&' + params[i];
					}
				}

				return encodeURI(queryParams);
			}

			// function to check for errors on the $http response object
            function isErrors(response) {
                if (response.data) {
                	if(response.data[0]) {
                		if(response.data[0].message) {
                			var errorMsg = response.data[0].message;
                			$log.log(errorMsg);
                    		return errorMsg;
                    	}
                	}
                }
            }

			return service;
		});
})();