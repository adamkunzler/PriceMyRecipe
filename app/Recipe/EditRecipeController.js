;(function(undefined) {
    'use strict';

    angular.module('app.recipe')
        .controller('EditRecipeController', function($scope, $q, $location, validationService, RecipeService) {
            $scope.recipe = {};

            $scope.continue = function() {
            	// make sure form is valid
                if(!new validationService().checkFormValidity($scope.frmRecipe)) return;

				// make sure ingredient name is unique
                // TODO

                _updateRecipe($scope.recipe).then(function() {
    				$location.path('/recipe');
        		});
            };

            $scope.nevermind = function() {
                $location.path('/recipe');
            };

            var _updateRecipe = function(recipe) {
                return RecipeService.updateRecipe(recipe)
                    .then(function() {
                		return;
                    }, function() {
                        alert('ERROR: Recipe not updated: ' + recipe.name);
                        return $q.reject();
                    });
            };

            var _getRecipe = function(id) {
                return RecipeService.getRecipeById(id)
                    .then(function(recipeData) {
                        if (recipeData) {
                            $scope.recipe = recipeData;
                        }
                    }, function() {
                        alert('ERROR: Recipe not found for id: ' + id);
                    });
            };

            var init = function() {
                // attempt to retrieve recipe id from local storage
                var id = localStorage.getItem('pmr_recipeId');

                if (!id) {
                	alert('Somehow the loaded recipe got unloaded. Please reload it at your leisure.');
                    $location.path('/recipe');
                } else {
                    _getRecipe(id);
                }
            };

            init();
        });
})();
