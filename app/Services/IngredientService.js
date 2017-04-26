;(function(undefined) {
    'use strict';

    angular.module('app.recipe')
        .factory('IngredientService', function($http, $q, $log, DALService) {
            var service = {};

            var rootUrl = 'http://test.adamkunzler.com/PHP/ingredients.php';

            /*
            	Get an ingredient by id
             */
            service.getIngredientById = function(ingId) {
                return DALService.executeQuery(rootUrl, 'getIngredientById', ['ingId=' + ingId])
                    .then(function(data) {
                        if(data) {
                            return data;
                        } else {
                            return $q.reject();
                        }
                    }, function(errResponse) {
                        $log.log('SERVICE ERROR: ' + errResponse);
                    });
            };

            /*
            	Get an arrary of all ingredients
             */
            service.getAllIngredients = function() {
                return DALService.executeQuery(rootUrl, 'getAllIngredients')
                    .then(function(data) {
                        if(data) {
                            if(angular.isArray(data)) return data;

                            var arrayData = [];
                            arrayData.push(data);
                            return arrayData;
                        }
                    }, function(errResponse) {
                        $log.log('SERVICE ERROR: ' + errResponse);
                    });
            };

            /*
            	Update an ingredient
             */
            service.updateIngredient = function(ingredient) {
                var params = [
                        'id=' + ingredient.id,
                        'name=' + ingredient.name,
                        'measureType=' + ingredient.measureType,
                        'gramsPerCup=' + ingredient.gramsPerCup
                    ];
                    //url = rootUrl + '?query=updateIngredient' + encodeURI(params);

                return DALService.executeNonQuery(rootUrl, 'updateIngredient', params)
                    .then(function(response) {
                        if(response && response.rowsAffected !== -1) {
                            return;
                        } else {
                            return $q.reject();
                        }
                    }, function(errResponse) {
                        $log.log('SERVICE ERROR: ' + errResponse);
                    });
            };

            /*
                Insert an ingredient
             */
            service.insertIngredient = function(ingredient) {
                var params = [
                        'name=' + ingredient.name,
                        'measureType=' + ingredient.measureType,
                        'gramsPerCup=' + ingredient.gramsPerCup
                    ];

                return DALService.executeNonQuery(rootUrl, 'insertIngredient', params)
                    .then(function(response) {
                        if(response !== undefined && response.generatedId !== 0 && response.rowsAffected !== -1) {
                            return response.generatedId;
                        } else {
                            return $q.reject();
                        }
                    }, function(errResponse) {
                        $log.log('SERVICE ERROR: ' + errResponse);
                    });
            };

            /*
            	Delete an ingredient by its id
             */
            service.deleteIngredient = function(ingId) {
                return DALService.executeNonQuery(rootUrl, 'deleteIngredient', ['id=' + ingId])
                    .then(function(response) {
                        if(response !== undefined && response.rowsAffected !== -1) {
                            return;
                        } else {
                            return $q.reject();
                        }
                    }, function(errResponse) {
                        $log.log('SERVICE ERROR: ' + errResponse);
                    });
            };


            return service;
        });
})();
