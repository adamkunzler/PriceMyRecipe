;(function(undefined) {
	'use strict';

	angular.module('app.recipe')
		.controller('NewRecipeController', function($rootScope, $scope, $location, validationService, RecipeService) {
			$scope.recipe = {};
			$scope.recipe.notes = '';

			$scope.continue = function() {
				// make sure form is valid
                if(!new validationService().checkFormValidity($scope.frmRecipe)) return;

				// make sure ingredient name is unique
                // TODO

                _insertRecipe($scope.recipe)
                    .then(function(newId) {
                    	// save reference to recipe id
                		localStorage.setItem('pmr_recipeId', newId);

                		// navigate to main recipe page
                        $location.path('/recipe');
                    });
			};

			$scope.nevermind = function() {
        		if($rootScope.previousRoute === '/recipe') {
        			$location.path('/recipe');
        		} else {
        			// navigate to main page
                	$location.path('/home');
        		}
			};

			var _insertRecipe = function(recipe) {
                return RecipeService.insertRecipe(recipe)
                    .then(function(newId) {
                        return newId;
                    }, function() {
                        alert('ERROR: Recipe not created: ' + recipe.name);
                    });
            };

			var init = function() {

			};

			init();
		});
})();