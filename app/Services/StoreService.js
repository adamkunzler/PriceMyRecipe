;(function(undefined) {
	'use strict';

	angular.module('app.recipe')
		.factory('StoreService', function($http, $q, $log, UserService, DALService) {
			var service = {};

			var rootUrl = 'http://test.adamkunzler.com/PHP/stores.php';
            var userId = UserService.currentUser.id;

            /*
            	Get an ingredient by id
             */
            service.getStoreById = function(storeId) {
                return DALService.executeQuery(rootUrl, 'getStoreById', ['id=' + storeId])
                    .then(function(data) {
                        if(data) {
                            return data;
                        } else {
                            return $q.reject();
                        }
                    }, function(errResponse) {
                        $log.log('SERVICE ERROR: ' + errResponse);
                    });
            };

            /*
            	Get an arrary of all stores for a user
             */
            service.getAllStores = function() {
                return DALService.executeQuery(rootUrl, 'getAllStores', ['userId=' + userId])
                    .then(function(data) {
                        if(data) {
                            return data;
                        }
                    }, function(errResponse) {
                        $log.log('SERVICE ERROR: ' + errResponse);
                    });
            };

            /*
                Insert a store
             */
            service.insertStore = function(store) {
                var params = [
                        'userId=' + userId,
                        'name=' + store.name,
                        'notes=' + store.notes
                    ];

                return DALService.executeNonQuery(rootUrl, 'insertStore', params)
                    .then(function(response) {
                        if(response !== undefined && response.generatedId !== 0 && response.rowsAffected !== -1) {
                            return response.generatedId;
                        } else {
                            return $q.reject();
                        }
                    }, function(errResponse) {
                        $log.log('SERVICE ERROR: ' + errResponse);
                    });
            };

            /*
            	Update a store
             */
            service.updateStore = function(store) {
                var params = [
                        'id=' + store.id,
                        'userId=' + store.userId,
                        'name=' + store.name,
                        'notes=' + store.notes
                    ];

                return DALService.executeNonQuery(rootUrl, 'updateStore', params)
                    .then(function(response) {
                        if((response !== undefined) && (response.rowsAffected !== undefined) && (response.rowsAffected !== -1)) {
                            return;
                        } else {
                            return $q.reject();
                        }
                    }, function(errResponse) {
                        $log.log('SERVICE ERROR: ' + errResponse);
                        return $q.reject();
                    });
            };

			return service;
		});
})();