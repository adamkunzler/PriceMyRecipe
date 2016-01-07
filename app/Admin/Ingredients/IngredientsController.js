;(function(undefined) {
    'use strict';

    angular.module('app.recipe')
        .controller('IngredientsController', function($scope, $http, $uibModal, IngredientService) {
            // MODEL
            $scope.sortType = 'name';
            $scope.sortReverse = false;
            $scope.searchIngredient = '';

            $scope.ingredients = undefined;
            // END MODEL

            // SCOPE METHODS
            $scope.addIngredient = function() {
                var addModal = $uibModal.open({
                    animation: true,
                    templateUrl: 'Admin/Ingredients/NewIngredientView.html',
                    controller: 'NewIngredientController',
                    size: 'sm'
                });

                // wait for result from modal promise
                addModal.result.then(function(ingId) {
                    if (ingId) {
                        _getIngredient(ingId).then(function(newIngredient) {
                            if(newIngredient) {
                                $scope.ingredients.push(newIngredient);
                            }
                        });
                    }
                });
            };

            $scope.editIngredient = function(ingId) {
                var editModal = $uibModal.open({
                    animation: true,
                    templateUrl: 'Admin/Ingredients/EditIngredientView.html',
                    controller: 'EditIngredientController',
                    size: 'sm',
                    resolve: {
                        ingredient: {
                            id: ingId
                        }
                    }
                });

                // wait for result from modal promise
                editModal.result.then(function(updatedIngredient) {
                    if (updatedIngredient) {
                        // if the ingredient was updated, update the original with the changes
                        for (var i = 0; i < $scope.ingredients.length; i++) {
                            if ($scope.ingredients[i].id === updatedIngredient.id) {
                                $scope.ingredients[i] = angular.copy(updatedIngredient);
                                break;
                            }
                        }
                    }
                });
            };

            $scope.deleteIngredient = function(ingId) {
                var index = $scope.ingredients.map(function(d) {
                    return d.id;
                }).indexOf(ingId);

                // TODO
                // NEED TO ADD CHECK IF DELETE IS ALLOWED
                // KEYS ON OTHER TABLES

                if (confirm('Are you sure you want to delete \'' + $scope.ingredients[index].name + '\'?')) {
                    IngredientService.deleteIngredient(ingId)
                        .then(function() {
                            $scope.ingredients.splice(index, 1);
                        }, function(error) {
                            alert('ERROR: Unable to delete ingredient: ' + error);
                        });
                }
            };

            // END SCOPE METHODS

            // INIT METHODS
            var _getIngredient = function(ingId) {
                return IngredientService.getIngredientById(ingId)
                    .then(function(ingredientData) {
                        if(ingredientData) {
                            return ingredientData;
                        }
                    }, function() {
                        alert('ERROR: Ingredient not found for id: ' + ingId);
                    });
            };

            var _getIngredients = function() {
                return IngredientService.getAllIngredients()
                    .then(function(ingredientData) {
                        $scope.ingredients = ingredientData || [];
                    });
            };

            var init = function() {
                _getIngredients();
            };
            // END INIT METHODS

            init();
        });
})();
