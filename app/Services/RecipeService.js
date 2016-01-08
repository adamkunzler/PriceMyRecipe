;(function(undefined) {
    'use strict';

    angular.module('app.recipe')
        .factory('RecipeService', function($http, $q, $log, UserService, DALService) {
            var service = {};

            var rootUrl = 'http://apps.adamkunzler.com/tempPrice/PHP/recipes.php';
            var userId = UserService.currentUser.id;

            /*
            	Get an ingredient by id
             */
            service.getRecipeById = function(id) {
                return DALService.executeQuery(rootUrl, 'getRecipeById', ['id=' + id])
                    .then(function(data) {
                        if (data) {
                            data.notes = data.notes.replace('\'\'', '\'');
                            return data;
                        } else {
                            return $q.reject();
                        }
                    }, function(errResponse) {
                        $log.log('SERVICE ERROR: ' + errResponse);
                    });
            };

            /*
            	Get an arrary of all recipes
             */
            service.getAllRecipes = function() {
                return DALService.executeQuery(rootUrl, 'getAllRecipes', ['userId=' + userId])
                    .then(function(data) {
                        if(data) {
                            return data;
                        }
                    }, function(errResponse) {
                        $log.log('SERVICE ERROR: ' + errResponse);
                    });
            };

            /*
            	Update an recipe
             */
            service.updateRecipe = function(recipe) {
                var cleanNotes = recipe.notes.replace('\'', '\'\'');

                var params = [
                        'id=' + recipe.id,
                        'name=' + recipe.name,
                        'numServings=' + recipe.numServings,
                        'notes=' + cleanNotes,
                        'userId=' + userId
                    ];

                return DALService.executeNonQuery(rootUrl, 'updateRecipe', params)
                    .then(function(response) {
                        if((response !== undefined) && (response.rowsAffected !== undefined) && (response.rowsAffected !== -1)) {
                            return;
                        } else {
                            return $q.reject();
                        }
                    }, function(errResponse) {
                        $log.log('SERVICE ERROR: ' + errResponse);
                        return $q.reject();
                    });
            };

            /*
                Insert an recipe
             */
            service.insertRecipe = function(recipe) {
                var params = [
                    'name=' + recipe.name,
                    'numServings=' + recipe.numServings,
                    'notes=' + recipe.notes,
                    'userId=' + userId
                ];

                return DALService.executeNonQuery(rootUrl, 'insertRecipe', params)
                    .then(function(response) {
                        if (response && response.generatedId !== 0 && response.rowsAffected !== -1) {
                            return response.generatedId;
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
