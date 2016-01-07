;(function(undefined) {
    'use strict';

    angular.module('app.recipe', ['ngRoute', 'ngSanitize', 'ngCookies', 'ui.bootstrap', 'ghiscoding.validation', 'pascalprecht.translate'])
        .constant('pmrConfig', {
            'SECRET_WORD': 'samelliot'
        })
        .config(function($routeProvider, $translateProvider, $httpProvider) {
            //$httpProvider.defaults.headers.common['Access-Control-Allow-Headers'] = '*';
            $httpProvider.interceptors.push(function($location, $injector, $log) {
                return {
                    request: function(config) {
                        var UserService = $injector.get('UserService');

                        if(!UserService.isAuthenticated()) {
                            //$log.log('not authenticated...returning to login.');
                            $location.path('/login');
                        }

                        return config;
                    }
                };
            });

            $translateProvider.useStaticFilesLoader({
                prefix: '../vendors/',
                suffix: '.json'
            });
            $translateProvider.preferredLanguage('en');
            $translateProvider.useSanitizeValueStrategy('sanitize');

            $routeProvider
                .when('/login', {
                    templateUrl: 'User/UserLoginView.html',
                    controller: 'UserLoginController'
                })
                .when('/home', {
                    templateUrl: 'root/home.html',
                    controller: 'GeneralController'
                })
                // RECIPE
                .when('/recipe', {
                    templateUrl: 'Recipe/RecipeView.html',
                    controller: 'RecipeController'
                })
                .when('/recipe/new', {
                    templateUrl: 'Recipe/RecipeDetailsView.html',
                    controller: 'NewRecipeController'
                })
                .when('/recipe/edit', {
                    templateUrl: 'Recipe/RecipeDetailsView.html',
                    controller: 'EditRecipeController'
                })
                // SINGLE INGREDIENT
                .when('/ingredient/add', {
                    templateUrl: 'Ingredient/AddIngredientView.html',
                    controller: 'AddIngredientController'
                })
                .when('/ingredient/store', {
                    templateUrl: 'Ingredient/StoreIngredientDetailsView.html',
                    controller: 'StoreIngredientDetailsController'
                })
                .when('/ingredient/recipe', {
                    templateUrl: 'Ingredient/RecipeIngredientDetailsView.html',
                    controller: 'RecipeIngredientDetailsController'
                })
                // STORE
                .when('/store/new', {
                    templateUrl: 'Store/StoreDetailsView.html',
                    controller: 'StoreDetailsController'
                })
                // ADMIN
                .when('/admin/ingredients', {
                    templateUrl: 'Admin/Ingredients/IngredientsView.html',
                    controller: 'IngredientsController'
                })
                .when('/admin/stores', {
                    templateUrl: 'Admin/Stores/StoresView.html',
                    controller: 'StoresController'
                })
                .otherwise({
                    redirectTo: '/login'
                });
        })
        .run(function($rootScope) {
            console.log('running...');
            $rootScope.$on('$locationChangeStart', function(evt, next, prev) {
                $rootScope.previousRoute = prev.substr(prev.indexOf('.html#') + 6);
            });
        });

    angular.module('app.recipe')
        .controller('GeneralController', function($scope, UserService) {
            $scope.isAdmin = function() {
                return UserService.isAdmin();
            };

            $scope.isAuth = function() {
                return UserService.isAuthenticated();
            };

            $scope.logout = function() {
                UserService.logout();
            };
        });
})();
