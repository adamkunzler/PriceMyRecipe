;(function(undefined) {
    'use strict';

    angular.module('app.recipe')
        .controller('StoreIngredientDetailsController', function($scope, $location, $uibModal, validationService, MeasurementService, StoreService, StoreIngredientService, AddIngredientModel) {

            $scope.continue = function() {
                if(!new validationService().checkFormValidity($scope.frmStoreIng)) return;

                if (!$scope.storeIngredient.id) {
                    // insert the store ingredient
                    _insertStoreIngredient($scope.storeIngredient)
                        .then(function(newId) {
                            $scope.storeIngredient.id = newId;

                            _updateModelAndMoveOn();
                        });
                } else {
                    // update the store ingredient
                    _updateStoreIngredient($scope.storeIngredient)
                        .then(function() {
                            _updateModelAndMoveOn();
                        });
                }
            };

            $scope.goBack = function() {
                AddIngredientModel.reset();
                $location.path('/recipe');
            };

            $scope.storeChanged = function() {
                var si = $scope.storeIngredient,
                    ingId = si.ingredient.id,
                    storeId = si.store.id;

                _getStoreIngredient(storeId, ingId)
                    .then(function(storeIngData) {
                        if (storeIngData) {
                            si.id = parseInt(storeIngData.id);
                            si.quantity = parseInt(storeIngData.quantity);
                            si.quantityType = _findQuantityType(storeIngData.quantityType.value);
                            si.cost = parseFloat(storeIngData.cost);
                            si.isOrganic = storeIngData.isOrganic === 'true';
                        } else {
                            _clearDetails();
                        }
                    });
            };

            $scope.addNewStore = function() {
                var addModal = $uibModal.open({
                    animation: true,
                    templateUrl: 'Admin/Stores/NewStoreView.html',
                    controller: 'NewStoreController',
                    size: 'sm'
                });

                // wait for result from modal promise
                addModal.result.then(function(storeId) {
                    if (storeId) {
                        _getStore(storeId).then(function(newStore) {
                            if (newStore) {
                                $scope.stores.push(newStore);
                                $scope.storeIngredient.store = newStore;
                                _clearDetails();
                            }
                        });
                    }
                });
            };

            var _clearDetails = function() {
                var si = $scope.storeIngredient;

                si.quantity = undefined;
                si.quantityType = undefined;
                si.cost = undefined;
                si.isOrganic = false;
            };

            var _findQuantityType = function(value) {
                var index = $scope.quantityTypes.map(function(val) {
                    return val.value;
                }).indexOf(value);
                return (index > -1) ? $scope.quantityTypes[index] : null;
            };

            var _updateModelAndMoveOn = function() {
                if ($scope.storeIngredient.id) {
                    AddIngredientModel.storeIngredient = angular.copy($scope.storeIngredient);
                    $location.path('/ingredient/recipe');
                }
            };

            var _insertStoreIngredient = function(storeIng) {
                return StoreIngredientService.insertStoreIngredient(storeIng)
                    .then(function(newId) {
                        return newId;
                    }, function() {
                        alert('ERROR: StoreIngredient not created: ' + storeIng.ingredient.name);
                    });
            };

            var _updateStoreIngredient = function(storeIng) {
                return StoreIngredientService.updateStoreIngredient(storeIng)
                    .then(function() {
                        return;
                    }, function() {
                        alert('ERROR: StoreIngredient not updated: ' + storeIng.ingredient.name);
                    });
            };

            var _getStoreIngredient = function(storeId, ingredientId) {
                return StoreIngredientService.getStoreIngredient(storeId, ingredientId)
                    .then(function(storeIngData) {
                        return storeIngData;
                    });
            };

            var _getStore = function(storeId) {
                return StoreService.getStoreById(storeId)
                    .then(function(storeData) {
                        if (storeData) {
                            return storeData;
                        }
                    }, function() {
                        alert('ERROR: Store not found for id: ' + storeId);
                    });
            };

            var _getStores = function() {
                return StoreService.getAllStores()
                    .then(function(storeData) {
                        $scope.stores = storeData || [];
                    });
            };

            var init = function() {
                if (!AddIngredientModel.ingredient) {
                    alert('Something\'s wrong: ingredient didn\'t carry over from last page.');
                    return;
                }

                $scope.storeIngredient = {
                    isOrganic: false
                };

                $scope.storeIngredient.ingredient = angular.copy(AddIngredientModel.ingredient);

                $scope.quantityTypes = MeasurementService.getStoreQuantityTypes($scope.storeIngredient.ingredient.measureType === 'weight');
                _getStores();
            };

            init();
        });
})();
