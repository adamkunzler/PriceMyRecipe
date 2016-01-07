;(function(undefined) {
    'use strict';

    angular.module('app.recipe')
        .controller('EditIngredientController', function($scope, $uibModalInstance, $q, validationService, IngredientService, ingredient) {
            $scope.ingredient = ingredient;

            $scope.ok = function() {
            	// make sure form is valid
                if(!new validationService().checkFormValidity($scope.frmEditIngredient)) return;

                // make sure ingredient name is unique
                if(!_isNameUnique($scope.ingredient.name, $scope.ingredient.id)) {
                    alert('Ingredient name is not unique: ' + $scope.ingredient.name);
                    return;
                }

            	_updateIngredient($scope.ingredient).then(function() {
    				_getIngredient().then(function(ingredientData) {
						if(ingredientData) {
                            $uibModalInstance.close(ingredientData);
                        }
					});
        		});
            };

            $scope.cancel = function() {
                $uibModalInstance.dismiss('cancel');
            };

            var _updateIngredient = function(ing) {
                return IngredientService.updateIngredient(ing)
                    .then(function() {
                		return;
                    }, function() {
                        alert('ERROR: Ingredient not updated: ' + ing.name);
                    });
            };

            var _isNameUnique = function(name, id) {
                var isUnique = true;

                for(var i = 0; i < $scope.ingredients.length; i++) {
                    if($scope.ingredients[i].id === id) continue;

                    if($scope.ingredients[i].name === name) {
                        isUnique = false;
                        break;
                    }
                }

                return isUnique;
            };

            var _getIngredients = function() {
                return IngredientService.getAllIngredients()
                    .then(function(ingredientData) {
                        $scope.ingredients = ingredientData || [];
                    });
            };

            var _getIngredient = function() {
                return IngredientService.getIngredientById(ingredient.id)
                    .then(function(ingredientData) {
                        if(ingredientData) {
                            return ingredientData;
                        } else {
                            alert('ERROR: Ingredient not found for id: ' + ingredient.id);
                            return $q.reject();
                        }
                    });
            };

            var init = function() {
                _getIngredients();

            	_getIngredient().then(function(ingredientData) {
                    if(ingredientData) {
                        $scope.ingredient = ingredientData;
                    }
                });
            };

            init();
        });
})();
