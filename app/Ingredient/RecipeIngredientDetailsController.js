;(function(undefined) {
    'use strict';

    angular.module('app.recipe')
        .controller('RecipeIngredientDetailsController', function($scope, $q, $location, validationService, AddIngredientModel, MeasurementService, RecipeIngredientService) {

            $scope.addToRecipe = function() {
                if(!new validationService().checkFormValidity($scope.frmRecipeIng)) return;

                if(!$scope.recipeIngredient.partialAmount && !$scope.recipeIngredient.wholeAmount) {
                    return;
                }

                if(!$scope.recipeIngredient.wholeAmount) {
                    $scope.recipeIngredient.wholeAmount = 0;
                }

                // insert the store ingredient
                _insertRecipeIngredient($scope.recipeIngredient)
                    .then(function(newId) {
                        $scope.recipeIngredient.id = newId;

                        _updateModelAndMoveOn();
                    });
            };

            $scope.goBack = function() {
                AddIngredientModel.reset();
                $location.path('/recipe');
            };

            var _updateModelAndMoveOn = function() {
                if ($scope.recipeIngredient.id) {
                    AddIngredientModel.recipeIngredient = angular.copy($scope.recipeIngredient);
                    $location.path('/recipe');
                }
            };

            var _insertRecipeIngredient = function(recipeIng) {
                return RecipeIngredientService.insertRecipeIngredient(recipeIng)
                    .then(function(newId) {
                    	if(newId) {
                        	return newId;
                        } else {
                        	$q.reject();
                        }
                    }, function() {
                        alert('ERROR: RecipeIngredient not created: ' + recipeIng.ingredient.name);
                    });
            };

            var init = function() {
                if (!AddIngredientModel.storeIngredient) {
                    alert('Something\'s wrong: store ingredient didn\'t carry over from last page.');
                    return;
                }

                $scope.model = AddIngredientModel;

                $scope.recipeIngredient = {};
                $scope.recipeIngredient.ingredient = angular.copy(AddIngredientModel.ingredient);
                $scope.recipeIngredient.storeIngredient = angular.copy(AddIngredientModel.storeIngredient);

                $scope.recipeIngredient.recipe = {};
                $scope.recipeIngredient.recipe.id = localStorage.getItem('pmr_recipeId');

                $scope.partialAmounts = MeasurementService.getPartialAmounts();
                $scope.measurementTypes = MeasurementService.getMeasurementTypes($scope.model.ingredient.measureType === 'weight');
            };

            init();
        });
})();
