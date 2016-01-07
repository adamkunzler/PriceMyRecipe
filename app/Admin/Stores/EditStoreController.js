;(function(undefined) {
    'use strict';

    angular.module('app.recipe')
        .controller('EditStoreController', function($scope, $uibModalInstance, $q, validationService, StoreService, store) {
            $scope.store = store;

            $scope.ok = function() {
                // make sure form is valid
                if(!new validationService().checkFormValidity($scope.frmEditStore)) return;

                _updateStore($scope.store).then(function() {
                    _getStore().then(function(storeData) {
                        if (storeData) {
                            $uibModalInstance.close(storeData);
                        }
                    });
                });
            };

            $scope.cancel = function() {
                $uibModalInstance.dismiss('cancel');
            };

            var _updateStore = function(changedStore) {
                return StoreService.updateStore(changedStore)
                    .then(function() {
                        return;
                    }, function() {
                        alert('ERROR: Ingredient not updated: ' + changedStore.name);
                    });
            };

            var _getStore = function() {
                return StoreService.getStoreById(store.id)
                    .then(function(storeData) {
                        if (storeData) {
                            return storeData;
                        } else {
                            alert('ERROR: Store not found for id: ' + store.id);
                            return $q.reject();
                        }
                    });
            };

            var init = function() {
                _getStore().then(function(storeData) {
                    if (storeData) {
                        $scope.store = storeData;
                    }
                });
            };

            init();
        });
})();
