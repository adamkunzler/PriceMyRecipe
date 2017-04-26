;(function(undefined) {
	'use strict';

	angular.module('app.recipe')
		.factory('StoreIngredientService', function($http, $q, $log, UserService, DALService) {
			var service = {};

			var rootUrl = 'http://test.adamkunzler.com/PHP/storeingredients.php';
            //var userId = UserService.currentUser.id;

            /*
            	Attempt to load a store ingredient
             */
            service.getStoreIngredient = function(storeId, ingredientId) {
            	var params = [
            			'storeId=' + storeId,
            			'ingredientId=' + ingredientId
        			];

        		return DALService.executeQuery(rootUrl, 'getStoreIngredient', params)
        			.then(function(data) {
                        if(data) {
                        	var isArray = angular.isArray(data);
                            return isArray ? undefined : data;
                        } else {
                            return $q.reject();
                        }
                    }, function(errResponse) {
                        $log.log('SERVICE ERROR: ' + errResponse);
                    });
            };

            /*
                Insert a store ingredient
             */
            service.insertStoreIngredient = function(storeIngredient) {
                var params = [
                        'ingredientId=' + storeIngredient.ingredient.id,
                        'storeId=' + storeIngredient.store.id,
                        'quantity=' + storeIngredient.quantity,
                        'quantityType=' + storeIngredient.quantityType.value,
                        'cost=' + storeIngredient.cost,
                        'isOrganic=' + storeIngredient.isOrganic
                    ];

                return DALService.executeNonQuery(rootUrl, 'insertStoreIngredient', params)
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
                Update a store ingredient
             */
            service.updateStoreIngredient = function(storeIngredient) {
                var params = [
                        'id=' + storeIngredient.id,
                        'ingredientId=' + storeIngredient.ingredient.id,
                        'storeId=' + storeIngredient.store.id,
                        'quantity=' + storeIngredient.quantity,
                        'quantityType=' + storeIngredient.quantityType.value,
                        'cost=' + storeIngredient.cost,
                        'isOrganic=' + storeIngredient.isOrganic
                    ];

                return DALService.executeNonQuery(rootUrl, 'updateStoreIngredient', params)
                    .then(function(response) {
                        if(response && response.rowsAffected !== -1) {
                            return;
                        } else {
                            return $q.reject();
                        }
                    }, function(errResponse) {
                        $log.log('SERVICE ERROR: ' + errResponse);
                    });
            };

			return service;
		});
})();