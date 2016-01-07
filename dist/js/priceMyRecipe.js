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

;(function(undefined) {
    'use strict';

    angular.module('app.recipe')
        .controller('EditRecipeController', function($scope, $q, $location, validationService, RecipeService) {
            $scope.recipe = {};

            $scope.continue = function() {
            	// make sure form is valid
                if(!new validationService().checkFormValidity($scope.frmRecipe)) return;

				// make sure ingredient name is unique
                // TODO

                _updateRecipe($scope.recipe).then(function() {
    				$location.path('/recipe');
        		});
            };

            $scope.nevermind = function() {
                $location.path('/recipe');
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

            var _getRecipe = function(id) {
                return RecipeService.getRecipeById(id)
                    .then(function(recipeData) {
                        if (recipeData) {
                            $scope.recipe = recipeData;
                        }
                    }, function() {
                        alert('ERROR: Recipe not found for id: ' + id);
                    });
            };

            var init = function() {
                // attempt to retrieve recipe id from local storage
                var id = localStorage.getItem('pmr_recipeId');

                if (!id) {
                	alert('Somehow the loaded recipe got unloaded. Please reload it at your leisure.');
                    $location.path('/recipe');
                } else {
                    _getRecipe(id);
                }
            };

            init();
        });
})();

;(function(undefined) {
	'use strict';

	angular.module('app.recipe')
		.controller('NewRecipeController', function($rootScope, $scope, $location, validationService, RecipeService) {
			$scope.recipe = {};
			$scope.recipe.notes = '';

			$scope.continue = function() {
				// make sure form is valid
                if(!new validationService().checkFormValidity($scope.frmRecipe)) return;

				// make sure ingredient name is unique
                // TODO

                _insertRecipe($scope.recipe)
                    .then(function(newId) {
                    	// save reference to recipe id
                		localStorage.setItem('pmr_recipeId', newId);

                		// navigate to main recipe page
                        $location.path('/recipe');
                    });
			};

			$scope.nevermind = function() {
        		if($rootScope.previousRoute === '/recipe') {
        			$location.path('/recipe');
        		} else {
        			// navigate to main page
                	$location.path('/home');
        		}
			};

			var _insertRecipe = function(recipe) {
                return RecipeService.insertRecipe(recipe)
                    .then(function(newId) {
                        return newId;
                    }, function() {
                        alert('ERROR: Recipe not created: ' + recipe.name);
                    });
            };

			var init = function() {

			};

			init();
		});
})();
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

                if(angular.isDefined($scope.model.recipe) && angular.isDefined($scope.model.recipe.ingredients)) {
                    for (var i = 0; i < $scope.model.recipe.ingredients.length; i++) {
                        cost += $scope.calculateIngredientCost($scope.model.recipe.ingredients[i]);
                    }
                }

                return cost;
            };

            $scope.calculatePerServingCost = function() {
                if(angular.isDefined($scope.model.recipe) && angular.isDefined($scope.model.recipe.ingredients)) {
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

                _getAllRecipes();

                var id = _getRecipeIdFromLocalStorage();
                if (id) {
                    _getRecipe(id);
                    //_getIngredients(id);
                }
            };

            init();
        });
})();

;(function(undefined) {
	'use strict';

	angular.module('app.recipe')
		.factory('RecipeModel', function() {
			var model = {};

			model.recipe = undefined;
			//model.ingredients = [];
			model.recipes = [];

			return model;
		});
})();
;(function(undefined) {
	'use strict';

	angular.module('app.recipe')
		.controller('StoreDetailsController', function($scope) {

			var init = function() {

			};

			init();
		});
})();
;(function(undefined) {
    'use strict';

    angular.module('app.recipe')
        .controller('AddIngredientController', function($rootScope, $scope, $location, validationService, IngredientService, AddIngredientModel) {
            $scope.ingredients = [];
            $scope.ingredient = undefined;

            $scope.continue = function() {
                if(!new validationService().checkFormValidity($scope.frmAddIngredient)) return;

                if ($scope.isCustom) {
                    // make sure the custom name is unique
                    if (!_isNameUnique($scope.ingredient.name)) {
                        alert('Ingredient name is not unique: ' + $scope.ingredient.name);
                        return;
                    }
                    // insert the custom ingredient
                    _insertIngredient($scope.ingredient)
                        .then(function(newId) {
                            $scope.ingredient.id = newId;

                            _updateModelAndMoveOn();
                        });
                } else {
                	_updateModelAndMoveOn();
                }
            };

            $scope.nevermind = function() {
                AddIngredientModel.reset();
                $location.path('/recipe');
            };

            $scope.validateExistingIngredient = function() {
                var isValid = false;

                for (var i = 0; i < $scope.ingredients.length; i++) {
                    if ($scope.ingredients[i].id === $scope.ingredient.id) {
                        isValid = true;
                        break;
                    }
                }

                //return isValid;
                return {
                    isValid: isValid,
                    message: 'Must choose an ingredient from the list.'
                };
            };

            $scope.resetForm = function() {
                $scope.ingredient = undefined;
                $scope.ingredient = undefined;
                new validationService().resetForm($scope.frmAddIngredient);
                console.log('reset');
            };

			var _updateModelAndMoveOn = function() {
                if ($scope.ingredient.id) {
                    AddIngredientModel.ingredient = angular.copy($scope.ingredient);
                    $location.path('/ingredient/store');
                }
            };

            var _isNameUnique = function(name) {
                var isUnique = true;

                for (var i = 0; i < $scope.ingredients.length; i++) {
                    if ($scope.ingredients[i].name === name) {
                        isUnique = false;
                        break;
                    }
                }

                return isUnique;
            };

            var _insertIngredient = function(ing) {
                return IngredientService.insertIngredient(ing)
                    .then(function(newId) {
                        return newId;
                    }, function() {
                        alert('ERROR: Ingredient not created: ' + ing.name);
                    });
            };

            var _getIngredients = function() {
                return IngredientService.getAllIngredients()
                    .then(function(ingredientData) {
                        $scope.ingredients = ingredientData || [];
                    });
            };

            var init = function() {
                // reload ingredient if coming back from the next page
                if (AddIngredientModel.ingredient !== undefined && $rootScope.previousRoute === '/ingredient/store') {
                    $scope.ingredient = angular.copy(AddIngredientModel.ingredient);
                }

                _getIngredients();
            };

            init();
        });
})();

;(function(undefined) {
	'use strict';

	angular.module('app.recipe')
		.factory('AddIngredientModel', function() {
			var model = {};

			model.ingredient = undefined;
			model.storeIngredient = undefined;
			model.recipeIngredient = undefined;

			model.reset = function() {
				model.ingredient = undefined;
				model.storeIngredient = undefined;
				model.recipeIngredient = undefined;
			};

			return model;
		});
})();
;(function(undefined) {
    'use strict';

    angular.module('app.recipe')
        .controller('RecipeIngredientDetailsController', function($scope, $q, $location, validationService, AddIngredientModel, MeasurementService, RecipeIngredientService) {

            $scope.addToRecipe = function() {
                if(!new validationService().checkFormValidity($scope.frmRecipeIng)) return;

                if(!$scope.recipeIngredient.partialAmount && !$scope.recipeIngredient.wholeAmount) {
                    return;
                }

                if(!$scope.recipeIngredient.wholeAmount) {
                    $scope.recipeIngredient.wholeAmount = 0;
                }

                // insert the store ingredient
                _insertRecipeIngredient($scope.recipeIngredient)
                    .then(function(newId) {
                        $scope.recipeIngredient.id = newId;

                        _updateModelAndMoveOn();
                    });
            };

            $scope.goBack = function() {
                AddIngredientModel.reset();
                $location.path('/recipe');
            };

            var _updateModelAndMoveOn = function() {
                if ($scope.recipeIngredient.id) {
                    AddIngredientModel.recipeIngredient = angular.copy($scope.recipeIngredient);
                    $location.path('/recipe');
                }
            };

            var _insertRecipeIngredient = function(recipeIng) {
                return RecipeIngredientService.insertRecipeIngredient(recipeIng)
                    .then(function(newId) {
                    	if(newId) {
                        	return newId;
                        } else {
                        	$q.reject();
                        }
                    }, function() {
                        alert('ERROR: RecipeIngredient not created: ' + recipeIng.ingredient.name);
                    });
            };

            var init = function() {
                if (!AddIngredientModel.storeIngredient) {
                    alert('Something\'s wrong: store ingredient didn\'t carry over from last page.');
                    return;
                }

                $scope.model = AddIngredientModel;

                $scope.recipeIngredient = {};
                $scope.recipeIngredient.ingredient = angular.copy(AddIngredientModel.ingredient);
                $scope.recipeIngredient.storeIngredient = angular.copy(AddIngredientModel.storeIngredient);

                $scope.recipeIngredient.recipe = {};
                $scope.recipeIngredient.recipe.id = localStorage.getItem('pmr_recipeId');

                $scope.partialAmounts = MeasurementService.getPartialAmounts();
                $scope.measurementTypes = MeasurementService.getMeasurementTypes($scope.model.ingredient.measureType === 'weight');
            };

            init();
        });
})();

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

;(function(undefined) {
	'use strict';

	angular.module('app.recipe')
		.factory('DALService', function($http, $q, $log) {
			var service = {};

			/*
				Executes a query and returns the result
			 */
			service.executeQuery = function(url, query, params) {
				var queryParams = getQueryParams(params);

				return $http.get(url + '?query=' + query + queryParams)
                    .then(function(response) {
                    	var errors = isErrors(response);
                        if (errors) {
                        	return $q.reject('ERROR: ' + errors);
                        }

                        return (response.data.length === 1) ? response.data[0] : response.data;
                    }, function errorCallback(response) {
                    	var msg = 'SERVER ERROR: ' + query + ' : '+ queryParams + ' : msg=' + JSON.stringify(response);
                        $log.log(msg);
                        return $q.reject(msg);
                    });
			};

			/*
				Executes a non-query statement (e.g. INSERT, UPDATE, DELETE) and resutrs an object
				with some of the following properties: rowsAffected, generatedId
			 */
			service.executeNonQuery = function(url, query, params) {
				var queryParams = getQueryParams(params);

				return $http.get(url + '?query=' + query + queryParams)
					.then(function(response) {
						var errors = isErrors(response);
                        if (errors) {
                        	return $q.reject('ERROR: ' + errors);
                        }

                        return response.data[0];
					}, function errorCallback(response) {
						var msg = 'SERVER ERROR: ' + query + ' : '+ queryParams + ' : msg=' + JSON.stringify(response);
                        $log.log(msg);
                        return $q.reject(msg);
					});
			};

			// function to take an array of params and turn it into a url string
			function getQueryParams(params) {
				var queryParams = '';

				if(params) {
					for(var i = 0; i < params.length; i++) {
						queryParams += '&' + params[i];
					}
				}

				return encodeURI(queryParams);
			}

			// function to check for errors on the $http response object
            function isErrors(response) {
                if (response.data) {
                	if(response.data[0]) {
                		if(response.data[0].message) {
                			var errorMsg = response.data[0].message;
                			$log.log(errorMsg);
                    		return errorMsg;
                    	}
                	}
                }
            }

			return service;
		});
})();
;(function(undefined) {
    'use strict';

    angular.module('app.recipe')
        .factory('IngredientService', function($http, $q, $log, DALService) {
            var service = {};

            var rootUrl = 'http://apps.adamkunzler.com/tempPrice/PHP/ingredients.php';

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
                            return data;
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

;(function(undefined) {
    'use strict';

    angular.module('app.recipe')
        .factory('MeasurementService', function() {
            var service = {};

            var GRAMS_PER_POUND = 453.592;
            //var GRAMS_PER_OUNCE = 28.3495;

            var _cupConversion = {
                'cups' : 1,
                'tbsp' : 16,
                'tsp' : 48,
                'oz' : 10
            };

            var _ounceConversion = {
                'cups' : 10,
                'tbsp' : 0.625,
                'tsp' : 0.208,
                'oz' : 1
            };


            service.calculateIngredientCost = function(recipeIngredient) {
                var cost = 0;

                //if(recipeIngredient.measurementType === 'pieces') {
                if(recipeIngredient.storeIngredient.quantityType === 'pieces') {
                    // PIECES

                    // calculate cost per piece from store
                    var costPerPiece = parseFloat(recipeIngredient.storeIngredient.cost) / parseInt(recipeIngredient.storeIngredient.quantity);

                    // multiply prev value by number of pieces recipe uses
                    cost = costPerPiece * (parseInt(recipeIngredient.wholeAmount) + (recipeIngredient.partialAmount !== '' ? eval(recipeIngredient.partialAmount) : 0)); // jshint ignore:line
                } else if(recipeIngredient.storeIngredient.quantityType === 'ounces') {
                    // OUNCES

                    // calculate costs per unit
                    var costPerOunce = parseFloat(recipeIngredient.storeIngredient.cost) / parseInt(recipeIngredient.storeIngredient.quantity);

                    // calcualte total measurement
                    var totalMeasureType = (parseInt(recipeIngredient.wholeAmount) + (recipeIngredient.partialAmount !== '' ? eval(recipeIngredient.partialAmount) : 0)); // jshint ignore:line
                    var totalOunces = totalMeasureType * _ounceConversion[recipeIngredient.measurementType];

                    // calcualte cost
                    cost = totalOunces * costPerOunce;
                } else if(recipeIngredient.storeIngredient.quantityType === 'pounds') {
                    // CUPS

                    // calculate costs per unit
                    var costPerPound = parseFloat(recipeIngredient.storeIngredient.cost) / parseInt(recipeIngredient.storeIngredient.quantity);
                    var costPerGram = costPerPound / GRAMS_PER_POUND;

                    // calcualte total measurement
                    var totalMeasureType = (parseInt(recipeIngredient.wholeAmount) + (recipeIngredient.partialAmount !== '' ? eval(recipeIngredient.partialAmount) : 0)); // jshint ignore:line
                    var totalCups = totalMeasureType / _cupConversion[recipeIngredient.measurementType];
                    var totalGrams = parseInt(recipeIngredient.ingredient.gramsPerCup) * totalCups;

                    // calcualte cost
                    cost = totalGrams * costPerGram;
                }

                return cost;
            };

            service.getStoreQuantityTypes = function(ingIsWeight) {
                if (ingIsWeight) {
                    return [{
                        name: 'Pounds',
                        value: 'pounds'
                    }, {
                        name: 'Ounces',
                        value: 'ounces'
                    }, ];
                } else {
                    return [{
                        name: 'Pieces',
                        value: 'pieces'
                    }];
                }
            };

            service.getMeasurementTypes = function(ingIsWeight) {
                var weights = [{
                        name: 'Cups',
                        abbr: 'Cups',
                        value: 'cups'
                    }, {
                        name: 'Tablespoons',
                        abbr: 'Tbsp.',
                        value: 'tbsp'
                    }, {
                        name: 'Teaspoons',
                        abbr: 'Tsp.',
                        value: 'tsp'
                    }, {
                        name: 'Ounces',
                        abbr: 'Ounces',
                        value: 'oz'
                    }],
                    pieces = [{
                        name: 'Pieces',
                        abbr: 'Pieces',
                        value: 'pieces'
                    }];

                if (ingIsWeight === undefined) {
                    return weights.concat(pieces);
                }

                return (ingIsWeight) ? weights : pieces;
            };

            service.getPartialAmounts = function() {
                return [
                    '3/4',
                    '2/3',
                    '1/2',
                    '1/3',
                    '1/4',
                    '1/8'
                ];
            };

            return service;
        });
})();

;(function(undefined) {
	'use strict';

	angular.module('app.recipe')
		.factory('RecipeIngredientService', function($http, $log, $q, DALService, UserService) {
			var service = {};

			var rootUrl = 'http://apps.adamkunzler.com/tempPrice/PHP/recipeingredients.php';
            //var userId = UserService.currentUser.id;

            /*
                Delete an ingredient from a recipe
             */
            service.deleteIngredient = function(recipeIngId) {
                 return DALService.executeNonQuery(rootUrl, 'deleteIngredient', ['id=' + recipeIngId])
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

            /*
            	Get an arrary of all ingredients for a recipe
             */
            service.getAllRecipeIngredients = function(recipeId) {
            	var params = [
                        'recipeId=' + recipeId
                    ];

                return DALService.executeQuery(rootUrl, 'getAllRecipeIngredients', params)
                    .then(function(data) {
                        if(data) {
                            return data;
                        }
                    }, function(errResponse) {
                        $log.log('SERVICE ERROR: ' + errResponse);
                    });
            };

            /*
                Insert a recipe ingredient
             */
            service.insertRecipeIngredient = function(recipeIngredient) {
                var params = [
                        'ingredientId=' + recipeIngredient.ingredient.id,
                        'recipeId=' + recipeIngredient.recipe.id,
                        'storeIngredientId=' + recipeIngredient.storeIngredient.id,
                        'wholeAmount=' + recipeIngredient.wholeAmount,
                        'partialAmount=' + (angular.isDefined(recipeIngredient.partialAmount) ? recipeIngredient.partialAmount : ''),
                        'measurementType=' + recipeIngredient.measurementType.value
                    ];

                return DALService.executeNonQuery(rootUrl, 'insertRecipeIngredient', params)
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

			return service;
		});
})();
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
                var params = [
                        'id=' + recipe.id,
                        'name=' + recipe.name,
                        'numServings=' + recipe.numServings,
                        'notes=' + recipe.notes,
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

;(function(undefined) {
	'use strict';

	angular.module('app.recipe')
		.factory('StoreIngredientService', function($http, $q, $log, UserService, DALService) {
			var service = {};

			var rootUrl = 'http://apps.adamkunzler.com/tempPrice/PHP/storeingredients.php';
            //var userId = UserService.currentUser.id;

            /*
            	Attempt to load a store ingredient
             */
            service.getStoreIngredient = function(storeId, ingredientId) {
            	var params = [
            			'storeId=' + storeId,
            			'ingredientId=' + ingredientId
        			];

        		return DALService.executeQuery(rootUrl, 'getStoreIngredient', params)
        			.then(function(data) {
                        if(data) {
                        	var isArray = angular.isArray(data);
                            return isArray ? undefined : data;
                        } else {
                            return $q.reject();
                        }
                    }, function(errResponse) {
                        $log.log('SERVICE ERROR: ' + errResponse);
                    });
            };

            /*
                Insert a store ingredient
             */
            service.insertStoreIngredient = function(storeIngredient) {
                var params = [
                        'ingredientId=' + storeIngredient.ingredient.id,
                        'storeId=' + storeIngredient.store.id,
                        'quantity=' + storeIngredient.quantity,
                        'quantityType=' + storeIngredient.quantityType.value,
                        'cost=' + storeIngredient.cost,
                        'isOrganic=' + storeIngredient.isOrganic
                    ];

                return DALService.executeNonQuery(rootUrl, 'insertStoreIngredient', params)
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
                Update a store ingredient
             */
            service.updateStoreIngredient = function(storeIngredient) {
                var params = [
                        'id=' + storeIngredient.id,
                        'ingredientId=' + storeIngredient.ingredient.id,
                        'storeId=' + storeIngredient.store.id,
                        'quantity=' + storeIngredient.quantity,
                        'quantityType=' + storeIngredient.quantityType.value,
                        'cost=' + storeIngredient.cost,
                        'isOrganic=' + storeIngredient.isOrganic
                    ];

                return DALService.executeNonQuery(rootUrl, 'updateStoreIngredient', params)
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

			return service;
		});
})();
;(function(undefined) {
	'use strict';

	angular.module('app.recipe')
		.factory('StoreService', function($http, $q, $log, UserService, DALService) {
			var service = {};

			var rootUrl = 'http://apps.adamkunzler.com/tempPrice/PHP/stores.php';
            var userId = UserService.currentUser.id;

            /*
            	Get an ingredient by id
             */
            service.getStoreById = function(storeId) {
                return DALService.executeQuery(rootUrl, 'getStoreById', ['id=' + storeId])
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
            	Get an arrary of all stores for a user
             */
            service.getAllStores = function() {
                return DALService.executeQuery(rootUrl, 'getAllStores', ['userId=' + userId])
                    .then(function(data) {
                        if(data) {
                            return data;
                        }
                    }, function(errResponse) {
                        $log.log('SERVICE ERROR: ' + errResponse);
                    });
            };

            /*
                Insert a store
             */
            service.insertStore = function(store) {
                var params = [
                        'userId=' + userId,
                        'name=' + store.name,
                        'notes=' + store.notes
                    ];

                return DALService.executeNonQuery(rootUrl, 'insertStore', params)
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
            	Update a store
             */
            service.updateStore = function(store) {
                var params = [
                        'id=' + store.id,
                        'userId=' + store.userId,
                        'name=' + store.name,
                        'notes=' + store.notes
                    ];

                return DALService.executeNonQuery(rootUrl, 'updateStore', params)
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

			return service;
		});
})();
;(function(undefined) {
	'use strict';

	angular.module('app.recipe')
		.factory('UserService', function($q, $log, $cookies, $location, pmrConfig, DALService) {
			var service = {};

			var rootUrl = 'http://apps.adamkunzler.com/tempPrice/PHP/users.php';

			service.login = function(username, encodedPassword) {
				var params = [
                		'username=' + username,
                        'password=' + encodedPassword
                    ];

                return DALService.executeQuery(rootUrl, 'login', params)
                    .then(function(data) {
                        if(angular.isDefined(data) && data.id) {
                            service.currentUser = {};
							service.currentUser.id = parseInt(data.id);
							service.currentUser.username = data.username;
							service.currentUser.isAdmin = data.isAdmin === 'true';

							// lazy authentication
							service.authValue = btoa(data.id + data.username + pmrConfig.SECRET_WORD);
							$cookies.put('pmr_' + data.username, service.authValue);

                            return true;
                        } else {
                            return $q.reject('Invalid username or password.');
                        }
                    }, function(errResponse) {
                        $log.log('SERVICE ERROR: ' + errResponse);
                    });
			};

			service.logout = function() {
				$log.log('logging out...');
				$cookies.remove('pmr_' + service.currentUser.username);
				$location.path('/login');

			};

			service.isAdmin = function() {
				return (angular.isDefined(service.currentUser) && service.currentUser.isAdmin);
			};

			service.isAuthenticated = function() {
				if(!angular.isDefined(service.currentUser)) return false;

				return $cookies.get('pmr_' + service.currentUser.username) === service.authValue;
			};

			return service;
		});
})();
;(function(undefined) {
	'use strict';

	angular.module('app.recipe')
		.controller('UserLoginController', function($scope, $log, $location, validationService, UserService) {
			$scope.login = function(username, password) {
				if(!new validationService().checkFormValidity($scope.frmUserLogin)) return;

				var encoded = btoa(password);
				UserService.login(username, encoded)
					.then(function success(isLoginSuccess) {
						if(isLoginSuccess) {
							$log.log('logged in...');
							$location.path('/recipe');
						}
					}, function error(errorData) {
						$scope.login.error = errorData;
					});
			};

			var init = function() {

			};

			init();
		});
})();
;(function(undefined) {
    'use strict';

    angular.module('app.recipe')
        .controller('EditIngredientController', function($scope, $uibModalInstance, $q, validationService, IngredientService, ingredient) {
            $scope.ingredient = ingredient;

            $scope.ok = function() {
            	// make sure form is valid
                if(!new validationService().checkFormValidity($scope.frmEditIngredient)) return;

                // make sure ingredient name is unique
                if(!_isNameUnique($scope.ingredient.name, $scope.ingredient.id)) {
                    alert('Ingredient name is not unique: ' + $scope.ingredient.name);
                    return;
                }

            	_updateIngredient($scope.ingredient).then(function() {
    				_getIngredient().then(function(ingredientData) {
						if(ingredientData) {
                            $uibModalInstance.close(ingredientData);
                        }
					});
        		});
            };

            $scope.cancel = function() {
                $uibModalInstance.dismiss('cancel');
            };

            var _updateIngredient = function(ing) {
                return IngredientService.updateIngredient(ing)
                    .then(function() {
                		return;
                    }, function() {
                        alert('ERROR: Ingredient not updated: ' + ing.name);
                    });
            };

            var _isNameUnique = function(name, id) {
                var isUnique = true;

                for(var i = 0; i < $scope.ingredients.length; i++) {
                    if($scope.ingredients[i].id === id) continue;

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

            var _getIngredient = function() {
                return IngredientService.getIngredientById(ingredient.id)
                    .then(function(ingredientData) {
                        if(ingredientData) {
                            return ingredientData;
                        } else {
                            alert('ERROR: Ingredient not found for id: ' + ingredient.id);
                            return $q.reject();
                        }
                    });
            };

            var init = function() {
                _getIngredients();

            	_getIngredient().then(function(ingredientData) {
                    if(ingredientData) {
                        $scope.ingredient = ingredientData;
                    }
                });
            };

            init();
        });
})();

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
