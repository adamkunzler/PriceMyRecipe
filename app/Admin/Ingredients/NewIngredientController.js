;(function(undefined) {
    'use strict';

    angular.module('app.recipe')
        .controller('NewIngredientController', function($scope, $uibModalInstance, validationService, IngredientService) {
            $scope.ingredient = undefined;

            $scope.ok = function() {
                // make sure form is valid
                if(!new validationService().checkFormValidity($scope.frmAddIngredient)) return;

                // make sure ingredient name is unique
                if(!_isNameUnique($scope.ingredient.name)) {
                    alert('Ingredient name is not unique: ' + $scope.ingredient.name);
                    return;
                }

                _insertIngredient($scope.ingredient)
                    .then(function(newId) {
                        $uibModalInstance.close(newId);
                    });
            };

            $scope.cancel = function() {
                $uibModalInstance.dismiss('cancel');
            };

            var _isNameUnique = function(name) {
                var isUnique = true;

                for(var i = 0; i < $scope.ingredients.length; i++) {
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

            var _insertIngredient = function(ing) {
                return IngredientService.insertIngredient(ing)
                    .then(function(newId) {
                        return newId;
                    }, function() {
                        alert('ERROR: Ingredient not created: ' + ing.name);
                    });
            };

            var init = function() {
                _getIngredients();
            };

            init();
        });
})();
