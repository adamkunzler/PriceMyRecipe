;(function(undefined) {
    'use strict';

    angular.module('app.recipe')
        .controller('AddIngredientController', function($rootScope, $scope, $location, validationService, IngredientService, AddIngredientModel) {
            $scope.ingredients = [];
            $scope.ingredient = undefined;

            $scope.continue = function() {
                if(!new validationService().checkFormValidity($scope.frmAddIngredient)) return;

                if ($scope.isCustom) {
                    // make sure the custom name is unique
                    if (!_isNameUnique($scope.ingredient.name)) {
                        alert('Ingredient name is not unique: ' + $scope.ingredient.name);
                        return;
                    }
                    // insert the custom ingredient
                    _insertIngredient($scope.ingredient)
                        .then(function(newId) {
                            $scope.ingredient.id = newId;

                            _updateModelAndMoveOn();
                        });
                } else {
                	_updateModelAndMoveOn();
                }
            };

            $scope.nevermind = function() {
                AddIngredientModel.reset();
                $location.path('/recipe');
            };

            $scope.validateExistingIngredient = function() {
                var isValid = false;

                for (var i = 0; i < $scope.ingredients.length; i++) {
                    if ($scope.ingredients[i].id === $scope.ingredient.id) {
                        isValid = true;
                        break;
                    }
                }

                //return isValid;
                return {
                    isValid: isValid,
                    message: 'Must choose an ingredient from the list.'
                };
            };

            $scope.resetForm = function() {
                $scope.ingredient = undefined;
                $scope.ingredient = undefined;
                new validationService().resetForm($scope.frmAddIngredient);
                console.log('reset');
            };

			var _updateModelAndMoveOn = function() {
                if ($scope.ingredient.id) {
                    AddIngredientModel.ingredient = angular.copy($scope.ingredient);
                    $location.path('/ingredient/store');
                }
            };

            var _isNameUnique = function(name) {
                var isUnique = true;

                for (var i = 0; i < $scope.ingredients.length; i++) {
                    if ($scope.ingredients[i].name === name) {
                        isUnique = false;
                        break;
                    }
                }

                return isUnique;
            };

            var _insertIngredient = function(ing) {
                return IngredientService.insertIngredient(ing)
                    .then(function(newId) {
                        return newId;
                    }, function() {
                        alert('ERROR: Ingredient not created: ' + ing.name);
                    });
            };

            var _getIngredients = function() {
                return IngredientService.getAllIngredients()
                    .then(function(ingredientData) {
                        $scope.ingredients = ingredientData || [];
                    });
            };

            var init = function() {
                // reload ingredient if coming back from the next page
                if (AddIngredientModel.ingredient !== undefined && $rootScope.previousRoute === '/ingredient/store') {
                    $scope.ingredient = angular.copy(AddIngredientModel.ingredient);
                }

                _getIngredients();
            };

            init();
        });
})();
