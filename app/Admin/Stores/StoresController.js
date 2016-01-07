;(function(undefined) {
    'use strict';

    angular.module('app.recipe')
        .controller('StoresController', function($scope, $uibModal, StoreService) {
            $scope.addStore = function() {
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
                            }
                        });
                    }
                });
            };

            $scope.deleteStore = function() {
            	alert('Not yet determined how to implement this feature.')
            };

            $scope.editStore = function(storeId) {
            	var editModal = $uibModal.open({
                    animation: true,
                    templateUrl: 'Admin/Stores/EditStoreView.html',
                    controller: 'EditStoreController',
                    size: 'sm',
                    resolve: {
                        store: {
                            id: storeId
                        }
                    }
                });

                // wait for result from modal promise
                editModal.result.then(function(updatedStore) {
                    if (updatedStore) {
                        // if the store was updated, update the original with the changes
                        for (var i = 0; i < $scope.stores.length; i++) {
                            if ($scope.stores[i].id === updatedStore.id) {
                                $scope.stores[i] = angular.copy(updatedStore);
                                break;
                            }
                        }
                    }
                });
            };

            var _getStore = function(storeId) {
                return StoreService.getStoreById(storeId)
                    .then(function(storeData) {
                        if(storeData) {
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
            	_getStores();
            };

            init();
        });
})();
