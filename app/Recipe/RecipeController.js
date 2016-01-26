;(function(undefined) {
    'use strict';

    angular.module('app.recipe')
        .controller('RecipeController', function($scope, $sce, $q, $location, RecipeModel, RecipeService, RecipeIngredientService, MeasurementService) {
            $scope.editRecipe = function() {
                var id = _getRecipeIdFromLocalStorage();

                if (!id) return;

                $location.path('/recipe/edit');
            };

            $scope.updateNotes = function() {
                _updateRecipe($scope.model.recipe);
            };

            $scope.loadRecipe = function(id) {
                localStorage.setItem('pmr_recipeId', id);
                _getRecipe(id);
                //init();
            };

            $scope.newRecipe = function() {
                $location.path('/recipe/new');
            };

            $scope.calculateIngredientCost = function(ing) {
                var cost = MeasurementService.calculateIngredientCost(ing);
                return cost;
            };

            $scope.calculateTotalCost = function() {
                var cost = 0;

                if (angular.isDefined($scope.model.recipe) && angular.isDefined($scope.model.recipe.ingredients)) {
                    for (var i = 0; i < $scope.model.recipe.ingredients.length; i++) {
                        cost += $scope.calculateIngredientCost($scope.model.recipe.ingredients[i]);
                    }
                }

                return cost;
            };

            $scope.calculatePerServingCost = function() {
                if (angular.isDefined($scope.model.recipe) && angular.isDefined($scope.model.recipe.ingredients)) {
                    var cost = $scope.calculateTotalCost();
                    return cost / $scope.model.recipe.numServings;
                } else {
                    return 0;
                }
            };

            $scope.deleteIngredient = function(recIngId) {
                var index = $scope.model.recipe.ingredients.map(function(d) {
                    return d.id;
                }).indexOf(recIngId);

                if (confirm('Are you sure you want to delete \'' + $scope.model.recipe.ingredients[index].ingredient.name + '\'?')) {
                    RecipeIngredientService.deleteIngredient(recIngId)
                        .then(function() {
                            $scope.model.recipe.ingredients.splice(index, 1);
                        }, function(error) {
                            alert('ERROR: Unable to delete ingredient from recipe: ' + error);
                        });
                }
            };

            $scope.formatIngredientAmount = function(ingredient) {
                var index = $scope.measurementTypes.map(function(e) {
                    return e.value;
                }).indexOf(ingredient.measurementType);
                var val = '' + (ingredient.wholeAmount === '0' ? '' : ingredient.wholeAmount);
                val += ((ingredient.partialAmount !== '') ? _formatAsFraction(ingredient.partialAmount) : '');
                val += ' ' + $scope.measurementTypes[index].abbr;

                return val;
            };

            $scope.saveToPDF = function() {
                window.print();
            };

            var _formatAsFraction = function(stringVal) {
                return '&nbsp;<sup>' + stringVal[0] + '</sup>&frasl;<sub>' + stringVal[2] + '</sub>';
            };

            // PRIVATE FUNCTIONS
            var _getRecipeIdFromLocalStorage = function() {
                // attempt to retrieve recipe id from local storage
                var id = localStorage.getItem('pmr_recipeId');
                if (!id) {
                    //alert('Somehow the loaded recipe got unloaded. Please reload at your leisure.');
                    return undefined;
                }

                return parseInt(id);
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

            var _getRecipeIndex = function(recipeId) {
                return $scope.model.recipes.map(function(d) {
                    return d.id;
                }).indexOf(recipeId);
            };

            var _getRecipe = function(id) {
                var index = _getRecipeIndex(id);
                if (index >= 0) {
                    $scope.model.recipe = $scope.model.recipes[index];
                    $scope.model.recipe.ingredients = [];

                    _getIngredients(id);

                    $scope.recipeLoaded = true;
                } else {
                    $scope.recipeLoaded = false;
                }
                // return RecipeService.getRecipeById(id)
                //     .then(function(recipeData) {
                //         if (recipeData) {
                //             $scope.model.recipe = recipeData;
                //             $scope.recipeLoaded = true;
                //         }
                //     }, function() {
                //         alert('ERROR: Recipe not found for id: ' + id);
                //     });
            };

            var _getIngredients = function(recipeId) {
                if (!$scope.model.recipe) return;

                if ($scope.model.recipe.ingredients.length === 0) {
                    RecipeIngredientService.getAllRecipeIngredients(recipeId)
                        .then(function(ingredientsData) {
                            if (angular.isArray(ingredientsData)) {
                                $scope.model.recipe.ingredients = ingredientsData || [];
                            } else {
                                $scope.model.recipe.ingredients = [];
                                $scope.model.recipe.ingredients.push(ingredientsData);
                            }
                        }, function() {
                            alert('ERROR: Ingredients not loaded for recipe id: ' + recipeId);
                        });
                }
            };

            var _getAllRecipes = function() {
                return RecipeService.getAllRecipes()
                    .then(function(recipeData) {
                        if (angular.isArray(recipeData)) {
                            $scope.model.recipes = recipeData || [];
                        } else {
                            $scope.model.recipes = [];
                            $scope.model.recipes.push(recipeData);
                        }
                    });
            };

            // END PRIVATE FUNCTIONS

            var init = function() {
                $scope.model = RecipeModel;
                $scope.recipeLoaded = false;

                $scope.measurementTypes = MeasurementService.getMeasurementTypes();

                _getAllRecipes().
                then(function() {
                    var id = _getRecipeIdFromLocalStorage();
                    if (id) {
                        _getRecipe(id);
                        //_getIngredients(id);
                    }
                });
            };

            init();
        });
})();
