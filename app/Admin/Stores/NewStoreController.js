;(function(undefined) {
	'use strict';

	angular.module('app.recipe')
		.controller('NewStoreController', function($scope, $uibModalInstance, validationService, StoreService) {
			$scope.store = undefined;

			$scope.ok = function() {
                // make sure form is valid
                if(!new validationService().checkFormValidity($scope.frmAddStore)) return;

                // set default notes to ''
                $scope.store.notes = '';

                _insertStore($scope.store)
                    .then(function(newId) {
                        $uibModalInstance.close(newId);
                    });
            };

            $scope.cancel = function() {
                $uibModalInstance.dismiss('cancel');
            };

            var _insertStore = function(store) {
                return StoreService.insertStore(store)
                    .then(function(newId) {
                        return newId;
                    }, function() {
                        alert('ERROR: Store not created: ' + store.name);
                    });
            };

            var init = function() {
            };

            init();
		});
})();