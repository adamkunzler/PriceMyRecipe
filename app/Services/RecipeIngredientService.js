;(function(undefined) {
	'use strict';

	angular.module('app.recipe')
		.factory('RecipeIngredientService', function($http, $log, $q, DALService, UserService) {
			var service = {};

			var rootUrl = 'http://apps.adamkunzler.com/tempPrice/PHP/recipeingredients.php';
            //var userId = UserService.currentUser.id;

            /*
                Delete an ingredient from a recipe
             */
            service.deleteIngredient = function(recipeIngId) {
                 return DALService.executeNonQuery(rootUrl, 'deleteIngredient', ['id=' + recipeIngId])
                    .then(function(response) {
                        if(response !== undefined && response.rowsAffected !== -1) {
                            return;
                        } else {
                            return $q.reject();
                        }
                    }, function(errResponse) {
                        $log.log('SERVICE ERROR: ' + errResponse);
                    });
            };

            /*
            	Get an arrary of all ingredients for a recipe
             */
            service.getAllRecipeIngredients = function(recipeId) {
            	var params = [
                        'recipeId=' + recipeId
                    ];

                return DALService.executeQuery(rootUrl, 'getAllRecipeIngredients', params)
                    .then(function(data) {
                        if(data) {
                            return data;
                        }
                    }, function(errResponse) {
                        $log.log('SERVICE ERROR: ' + errResponse);
                    });
            };

            /*
                Insert a recipe ingredient
             */
            service.insertRecipeIngredient = function(recipeIngredient) {
                var params = [
                        'ingredientId=' + recipeIngredient.ingredient.id,
                        'recipeId=' + recipeIngredient.recipe.id,
                        'storeIngredientId=' + recipeIngredient.storeIngredient.id,
                        'wholeAmount=' + recipeIngredient.wholeAmount,
                        'partialAmount=' + (angular.isDefined(recipeIngredient.partialAmount) ? recipeIngredient.partialAmount : ''),
                        'measurementType=' + recipeIngredient.measurementType.value
                    ];

                return DALService.executeNonQuery(rootUrl, 'insertRecipeIngredient', params)
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

			return service;
		});
})();