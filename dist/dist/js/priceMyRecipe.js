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

			var rootUrl = 'http://test.adamkunzler.com/PHP/recipeingredients.php';
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

            var rootUrl = 'http://test.adamkunzler.com/PHP/recipes.php';
            var userId = UserService.currentUser.id;

            var apostrophe = 'APOSTROPHE';

            /*
            	Get an ingredient by id
             */
            service.getRecipeById = function(id) {
                return DALService.executeQuery(rootUrl, 'getRecipeById', ['id=' + id])
                    .then(function(data) {
                        if (data) {
                            var regex = new RegExp(apostrophe, 'g');
                            data.notes = data.notes.replace(regex, '\'');
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
                            var arrayData = [];

                            if(!angular.isArray(data)) {
                                arrayData.push(data);
                            } else {
                                arrayData = data;
                            }

                            angular.forEach(arrayData, function(value) {
                                var regex = new RegExp(apostrophe, 'g');
                                value.notes = value.notes.replace(regex, '\'');
                            });

                            return arrayData;
                        }
                    }, function(errResponse) {
                        $log.log('SERVICE ERROR: ' + errResponse);
                    });
            };

            /*
            	Update an recipe
             */
            service.updateRecipe = function(recipe) {
                var cleanNotes = recipe.notes.replace(/\'/g, apostrophe);

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

;(function(undefined) {
	'use strict';

	angular.module('app.recipe')
		.factory('StoreIngredientService', function($http, $q, $log, UserService, DALService) {
			var service = {};

			var rootUrl = 'http://test.adamkunzler.com/PHP/storeingredients.php';
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

			var rootUrl = 'http://test.adamkunzler.com/PHP/stores.php';
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

			var rootUrl = 'http://test.adamkunzler.com/PHP/users.php';

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
		.controller('StoreDetailsController', function($scope) {

			var init = function() {

			};

			init();
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

!function(e){"use strict";angular.module("app.recipe",["ngRoute","ngSanitize","ngCookies","ui.bootstrap","ghiscoding.validation","pascalprecht.translate"]).constant("pmrConfig",{SECRET_WORD:"samelliot"}).config(["$routeProvider","$translateProvider","$httpProvider",function(e,n,t){t.interceptors.push(["$location","$injector","$log",function(e,n,t){return{request:function(t){var r=n.get("UserService");return r.isAuthenticated()||e.path("/login"),t}}}]),n.useStaticFilesLoader({prefix:"../vendors/",suffix:".json"}),n.preferredLanguage("en"),n.useSanitizeValueStrategy("sanitize"),e.when("/login",{templateUrl:"User/UserLoginView.html",controller:"UserLoginController"}).when("/home",{templateUrl:"root/home.html",controller:"GeneralController"}).when("/recipe",{templateUrl:"Recipe/RecipeView.html",controller:"RecipeController"}).when("/recipe/new",{templateUrl:"Recipe/RecipeDetailsView.html",controller:"NewRecipeController"}).when("/recipe/edit",{templateUrl:"Recipe/RecipeDetailsView.html",controller:"EditRecipeController"}).when("/ingredient/add",{templateUrl:"Ingredient/AddIngredientView.html",controller:"AddIngredientController"}).when("/ingredient/store",{templateUrl:"Ingredient/StoreIngredientDetailsView.html",controller:"StoreIngredientDetailsController"}).when("/ingredient/recipe",{templateUrl:"Ingredient/RecipeIngredientDetailsView.html",controller:"RecipeIngredientDetailsController"}).when("/store/new",{templateUrl:"Store/StoreDetailsView.html",controller:"StoreDetailsController"}).when("/admin/ingredients",{templateUrl:"Admin/Ingredients/IngredientsView.html",controller:"IngredientsController"}).when("/admin/stores",{templateUrl:"Admin/Stores/StoresView.html",controller:"StoresController"}).otherwise({redirectTo:"/login"})}]).run(["$rootScope",function(e){console.log("running..."),e.$on("$locationChangeStart",function(n,t,r){e.previousRoute=r.substr(r.indexOf(".html#")+6)})}]),angular.module("app.recipe").controller("GeneralController",["$scope","UserService",function(e,n){e.isAdmin=function(){return n.isAdmin()},e.isAuth=function(){return n.isAuthenticated()},e.logout=function(){n.logout()}}])}(),function(e){"use strict";angular.module("app.recipe").controller("AddIngredientController",["$rootScope","$scope","$location","validationService","IngredientService","AddIngredientModel",function(n,t,r,i,o,c){t.ingredients=[],t.ingredient=e,t["continue"]=function(){if((new i).checkFormValidity(t.frmAddIngredient))if(t.isCustom){if(!a(t.ingredient.name))return void alert("Ingredient name is not unique: "+t.ingredient.name);d(t.ingredient).then(function(e){t.ingredient.id=e,u()})}else u()},t.nevermind=function(){c.reset(),r.path("/recipe")},t.validateExistingIngredient=function(){for(var e=!1,n=0;n<t.ingredients.length;n++)if(t.ingredients[n].id===t.ingredient.id){e=!0;break}return{isValid:e,message:"Must choose an ingredient from the list."}},t.resetForm=function(){t.ingredient=e,t.ingredient=e,(new i).resetForm(t.frmAddIngredient),console.log("reset")};var u=function(){t.ingredient.id&&(c.ingredient=angular.copy(t.ingredient),r.path("/ingredient/store"))},a=function(e){for(var n=!0,r=0;r<t.ingredients.length;r++)if(t.ingredients[r].name===e){n=!1;break}return n},d=function(e){return o.insertIngredient(e).then(function(e){return e},function(){alert("ERROR: Ingredient not created: "+e.name)})},s=function(){return o.getAllIngredients().then(function(e){t.ingredients=e||[]})},l=function(){c.ingredient!==e&&"/ingredient/store"===n.previousRoute&&(t.ingredient=angular.copy(c.ingredient)),s()};l()}])}(),function(e){"use strict";angular.module("app.recipe").factory("AddIngredientModel",function(){var n={};return n.ingredient=e,n.storeIngredient=e,n.recipeIngredient=e,n.reset=function(){n.ingredient=e,n.storeIngredient=e,n.recipeIngredient=e},n})}(),function(e){"use strict";angular.module("app.recipe").controller("RecipeIngredientDetailsController",["$scope","$q","$location","validationService","AddIngredientModel","MeasurementService","RecipeIngredientService",function(e,n,t,r,i,o,c){e.addToRecipe=function(){(new r).checkFormValidity(e.frmRecipeIng)&&(e.recipeIngredient.partialAmount||e.recipeIngredient.wholeAmount)&&(e.recipeIngredient.wholeAmount||(e.recipeIngredient.wholeAmount=0),a(e.recipeIngredient).then(function(n){e.recipeIngredient.id=n,u()}))},e.goBack=function(){i.reset(),t.path("/recipe")};var u=function(){e.recipeIngredient.id&&(i.recipeIngredient=angular.copy(e.recipeIngredient),t.path("/recipe"))},a=function(e){return c.insertRecipeIngredient(e).then(function(e){return e?e:void n.reject()},function(){alert("ERROR: RecipeIngredient not created: "+e.ingredient.name)})},d=function(){return i.storeIngredient?(e.model=i,e.recipeIngredient={},e.recipeIngredient.ingredient=angular.copy(i.ingredient),e.recipeIngredient.storeIngredient=angular.copy(i.storeIngredient),e.recipeIngredient.recipe={},e.recipeIngredient.recipe.id=localStorage.getItem("pmr_recipeId"),e.partialAmounts=o.getPartialAmounts(),void(e.measurementTypes=o.getMeasurementTypes("weight"===e.model.ingredient.measureType))):void alert("Something's wrong: store ingredient didn't carry over from last page.")};d()}])}(),function(e){"use strict";angular.module("app.recipe").controller("StoreIngredientDetailsController",["$scope","$location","$uibModal","validationService","MeasurementService","StoreService","StoreIngredientService","AddIngredientModel",function(n,t,r,i,o,c,u,a){n["continue"]=function(){(new i).checkFormValidity(n.frmStoreIng)&&(n.storeIngredient.id?p(n.storeIngredient).then(function(){l()}):g(n.storeIngredient).then(function(e){n.storeIngredient.id=e,l()}))},n.goBack=function(){a.reset(),t.path("/recipe")},n.storeChanged=function(){var e=n.storeIngredient,t=e.ingredient.id,r=e.store.id;f(r,t).then(function(n){n?(e.id=parseInt(n.id),e.quantity=parseInt(n.quantity),e.quantityType=s(n.quantityType.value),e.cost=parseFloat(n.cost),e.isOrganic="true"===n.isOrganic):d()})},n.addNewStore=function(){var e=r.open({animation:!0,templateUrl:"Admin/Stores/NewStoreView.html",controller:"NewStoreController",size:"sm"});e.result.then(function(e){e&&m(e).then(function(e){e&&(n.stores.push(e),n.storeIngredient.store=e,d())})})};var d=function(){var t=n.storeIngredient;t.quantity=e,t.quantityType=e,t.cost=e,t.isOrganic=!1},s=function(e){var t=n.quantityTypes.map(function(e){return e.value}).indexOf(e);return t>-1?n.quantityTypes[t]:null},l=function(){n.storeIngredient.id&&(a.storeIngredient=angular.copy(n.storeIngredient),t.path("/ingredient/recipe"))},g=function(e){return u.insertStoreIngredient(e).then(function(e){return e},function(){alert("ERROR: StoreIngredient not created: "+e.ingredient.name)})},p=function(e){return u.updateStoreIngredient(e).then(function(){},function(){alert("ERROR: StoreIngredient not updated: "+e.ingredient.name)})},f=function(e,n){return u.getStoreIngredient(e,n).then(function(e){return e})},m=function(e){return c.getStoreById(e).then(function(e){return e?e:void 0},function(){alert("ERROR: Store not found for id: "+e)})},I=function(){return c.getAllStores().then(function(e){n.stores=e||[]})},R=function(){return a.ingredient?(n.storeIngredient={isOrganic:!1},n.storeIngredient.ingredient=angular.copy(a.ingredient),n.quantityTypes=o.getStoreQuantityTypes("weight"===n.storeIngredient.ingredient.measureType),void I()):void alert("Something's wrong: ingredient didn't carry over from last page.")};R()}])}(),function(e){"use strict";angular.module("app.recipe").controller("EditRecipeController",["$scope","$q","$location","validationService","RecipeService",function(e,n,t,r,i){e.recipe={},e["continue"]=function(){(new r).checkFormValidity(e.frmRecipe)&&o(e.recipe).then(function(){t.path("/recipe")})},e.nevermind=function(){t.path("/recipe")};var o=function(e){return i.updateRecipe(e).then(function(){},function(){return alert("ERROR: Recipe not updated: "+e.name),n.reject()})},c=function(n){return i.getRecipeById(n).then(function(n){n&&(e.recipe=n)},function(){alert("ERROR: Recipe not found for id: "+n)})},u=function(){var e=localStorage.getItem("pmr_recipeId");e?c(e):(alert("Somehow the loaded recipe got unloaded. Please reload it at your leisure."),t.path("/recipe"))};u()}])}(),function(e){"use strict";angular.module("app.recipe").controller("NewRecipeController",["$rootScope","$scope","$location","validationService","RecipeService",function(e,n,t,r,i){n.recipe={},n.recipe.notes="",n["continue"]=function(){(new r).checkFormValidity(n.frmRecipe)&&o(n.recipe).then(function(e){localStorage.setItem("pmr_recipeId",e),t.path("/recipe")})},n.nevermind=function(){"/recipe"===e.previousRoute?t.path("/recipe"):t.path("/home")};var o=function(e){return i.insertRecipe(e).then(function(e){return e},function(){alert("ERROR: Recipe not created: "+e.name)})},c=function(){};c()}])}(),function(e){"use strict";angular.module("app.recipe").controller("RecipeController",["$scope","$sce","$q","$location","RecipeModel","RecipeService","RecipeIngredientService","MeasurementService",function(n,t,r,i,o,c,u,a){n.editRecipe=function(){var e=s();e&&i.path("/recipe/edit")},n.updateNotes=function(){l(n.model.recipe)},n.loadRecipe=function(e){localStorage.setItem("pmr_recipeId",e),p(e)},n.newRecipe=function(){i.path("/recipe/new")},n.calculateIngredientCost=function(e){var n=a.calculateIngredientCost(e);return n},n.calculateTotalCost=function(){var e=0;if(angular.isDefined(n.model.recipe)&&angular.isDefined(n.model.recipe.ingredients))for(var t=0;t<n.model.recipe.ingredients.length;t++)e+=n.calculateIngredientCost(n.model.recipe.ingredients[t]);return e},n.calculatePerServingCost=function(){if(angular.isDefined(n.model.recipe)&&angular.isDefined(n.model.recipe.ingredients)){var e=n.calculateTotalCost();return e/n.model.recipe.numServings}return 0},n.deleteIngredient=function(e){var t=n.model.recipe.ingredients.map(function(e){return e.id}).indexOf(e);confirm("Are you sure you want to delete '"+n.model.recipe.ingredients[t].ingredient.name+"'?")&&u.deleteIngredient(e).then(function(){n.model.recipe.ingredients.splice(t,1)},function(e){alert("ERROR: Unable to delete ingredient from recipe: "+e)})},n.formatIngredientAmount=function(e){var t=n.measurementTypes.map(function(e){return e.value}).indexOf(e.measurementType),r=""+("0"===e.wholeAmount?"":e.wholeAmount);return r+=""!==e.partialAmount?d(e.partialAmount):"",r+=" "+n.measurementTypes[t].abbr},n.saveToPDF=function(){window.print()};var d=function(e){return"&nbsp;<sup>"+e[0]+"</sup>&frasl;<sub>"+e[2]+"</sub>"},s=function(){var n=localStorage.getItem("pmr_recipeId");return n?parseInt(n):e},l=function(e){return c.updateRecipe(e).then(function(){},function(){return alert("ERROR: Recipe not updated: "+e.name),r.reject()})},g=function(e){return n.model.recipes.map(function(e){return e.id}).indexOf(e)},p=function(e){var t=g(e);t>=0?(n.model.recipe=n.model.recipes[t],n.model.recipe.ingredients=[],f(e),n.recipeLoaded=!0):n.recipeLoaded=!1},f=function(e){n.model.recipe&&0===n.model.recipe.ingredients.length&&u.getAllRecipeIngredients(e).then(function(e){angular.isArray(e)?n.model.recipe.ingredients=e||[]:(n.model.recipe.ingredients=[],n.model.recipe.ingredients.push(e))},function(){alert("ERROR: Ingredients not loaded for recipe id: "+e)})},m=function(){return c.getAllRecipes().then(function(e){angular.isArray(e)?n.model.recipes=e||[]:(n.model.recipes=[],n.model.recipes.push(e))})},I=function(){n.model=o,n.recipeLoaded=!1,n.measurementTypes=a.getMeasurementTypes(),m().then(function(){var e=s();e&&p(e)})};I()}])}(),function(e){"use strict";angular.module("app.recipe").factory("RecipeModel",function(){var n={};return n.recipe=e,n.recipes=[],n})}(),function(e){"use strict";angular.module("app.recipe").factory("DALService",["$http","$q","$log",function(e,n,t){function r(e){var n="";if(e)for(var t=0;t<e.length;t++)n+="&"+e[t];return encodeURI(n)}function i(e){if(e.data&&e.data[0]&&e.data[0].message){var n=e.data[0].message;return t.log(n),n}}var o={};return o.executeQuery=function(o,c,u){var a=r(u);return e.get(o+"?query="+c+a).then(function(e){var t=i(e);return t?n.reject("ERROR: "+t):1===e.data.length?e.data[0]:e.data},function(e){var r="SERVER ERROR: "+c+" : "+a+" : msg="+JSON.stringify(e);return t.log(r),n.reject(r)})},o.executeNonQuery=function(o,c,u){var a=r(u);return e.get(o+"?query="+c+a).then(function(e){var t=i(e);return t?n.reject("ERROR: "+t):e.data[0]},function(e){var r="SERVER ERROR: "+c+" : "+a+" : msg="+JSON.stringify(e);return t.log(r),n.reject(r)})},o}])}(),function(e){"use strict";angular.module("app.recipe").factory("IngredientService",["$http","$q","$log","DALService",function(n,t,r,i){var o={},c="http://test.adamkunzler.com/PHP/ingredients.php";return o.getIngredientById=function(e){return i.executeQuery(c,"getIngredientById",["ingId="+e]).then(function(e){return e?e:t.reject()},function(e){r.log("SERVICE ERROR: "+e)})},o.getAllIngredients=function(){return i.executeQuery(c,"getAllIngredients").then(function(e){if(e){if(angular.isArray(e))return e;var n=[];return n.push(e),n}},function(e){r.log("SERVICE ERROR: "+e)})},o.updateIngredient=function(e){var n=["id="+e.id,"name="+e.name,"measureType="+e.measureType,"gramsPerCup="+e.gramsPerCup];return i.executeNonQuery(c,"updateIngredient",n).then(function(e){return e&&-1!==e.rowsAffected?void 0:t.reject()},function(e){r.log("SERVICE ERROR: "+e)})},o.insertIngredient=function(n){var o=["name="+n.name,"measureType="+n.measureType,"gramsPerCup="+n.gramsPerCup];return i.executeNonQuery(c,"insertIngredient",o).then(function(n){return n!==e&&0!==n.generatedId&&-1!==n.rowsAffected?n.generatedId:t.reject()},function(e){r.log("SERVICE ERROR: "+e)})},o.deleteIngredient=function(n){return i.executeNonQuery(c,"deleteIngredient",["id="+n]).then(function(n){return n!==e&&-1!==n.rowsAffected?void 0:t.reject()},function(e){r.log("SERVICE ERROR: "+e)})},o}])}(),function(undefined){"use strict";angular.module("app.recipe").factory("MeasurementService",function(){var service={},GRAMS_PER_POUND=453.592,_cupConversion={cups:1,tbsp:16,tsp:48,oz:10},_ounceConversion={cups:10,tbsp:.625,tsp:.208,oz:1};return service.calculateIngredientCost=function(recipeIngredient){var cost=0;if("pieces"===recipeIngredient.storeIngredient.quantityType){var costPerPiece=parseFloat(recipeIngredient.storeIngredient.cost)/parseInt(recipeIngredient.storeIngredient.quantity);cost=costPerPiece*(parseInt(recipeIngredient.wholeAmount)+(""!==recipeIngredient.partialAmount?eval(recipeIngredient.partialAmount):0))}else if("ounces"===recipeIngredient.storeIngredient.quantityType){var costPerOunce=parseFloat(recipeIngredient.storeIngredient.cost)/parseInt(recipeIngredient.storeIngredient.quantity),totalMeasureType=parseInt(recipeIngredient.wholeAmount)+(""!==recipeIngredient.partialAmount?eval(recipeIngredient.partialAmount):0),totalOunces=totalMeasureType*_ounceConversion[recipeIngredient.measurementType];cost=totalOunces*costPerOunce}else if("pounds"===recipeIngredient.storeIngredient.quantityType){var costPerPound=parseFloat(recipeIngredient.storeIngredient.cost)/parseInt(recipeIngredient.storeIngredient.quantity),costPerGram=costPerPound/GRAMS_PER_POUND,totalMeasureType=parseInt(recipeIngredient.wholeAmount)+(""!==recipeIngredient.partialAmount?eval(recipeIngredient.partialAmount):0),totalCups=totalMeasureType/_cupConversion[recipeIngredient.measurementType],totalGrams=parseInt(recipeIngredient.ingredient.gramsPerCup)*totalCups;cost=totalGrams*costPerGram}return cost},service.getStoreQuantityTypes=function(e){return e?[{name:"Pounds",value:"pounds"},{name:"Ounces",value:"ounces"}]:[{name:"Pieces",value:"pieces"}]},service.getMeasurementTypes=function(e){var n=[{name:"Cups",abbr:"Cups",value:"cups"},{name:"Tablespoons",abbr:"Tbsp.",value:"tbsp"},{name:"Teaspoons",abbr:"Tsp.",value:"tsp"},{name:"Ounces",abbr:"Ounces",value:"oz"}],t=[{name:"Pieces",abbr:"Pieces",value:"pieces"}];return e===undefined?n.concat(t):e?n:t},service.getPartialAmounts=function(){return["3/4","2/3","1/2","1/3","1/4","1/8"]},service})}(),function(e){"use strict";angular.module("app.recipe").factory("RecipeIngredientService",["$http","$log","$q","DALService","UserService",function(n,t,r,i,o){var c={},u="http://test.adamkunzler.com/PHP/recipeingredients.php";return c.deleteIngredient=function(n){return i.executeNonQuery(u,"deleteIngredient",["id="+n]).then(function(n){return n!==e&&-1!==n.rowsAffected?void 0:r.reject()},function(e){t.log("SERVICE ERROR: "+e)})},c.getAllRecipeIngredients=function(e){var n=["recipeId="+e];return i.executeQuery(u,"getAllRecipeIngredients",n).then(function(e){return e?e:void 0},function(e){t.log("SERVICE ERROR: "+e)})},c.insertRecipeIngredient=function(n){var o=["ingredientId="+n.ingredient.id,"recipeId="+n.recipe.id,"storeIngredientId="+n.storeIngredient.id,"wholeAmount="+n.wholeAmount,"partialAmount="+(angular.isDefined(n.partialAmount)?n.partialAmount:""),"measurementType="+n.measurementType.value];return i.executeNonQuery(u,"insertRecipeIngredient",o).then(function(n){return n!==e&&0!==n.generatedId&&-1!==n.rowsAffected?n.generatedId:r.reject()},function(e){t.log("SERVICE ERROR: "+e)})},c}])}(),function(e){"use strict";angular.module("app.recipe").factory("RecipeService",["$http","$q","$log","UserService","DALService",function(n,t,r,i,o){var c={},u="http://test.adamkunzler.com/PHP/recipes.php",a=i.currentUser.id,d="APOSTROPHE";return c.getRecipeById=function(e){return o.executeQuery(u,"getRecipeById",["id="+e]).then(function(e){if(e){var n=new RegExp(d,"g");return e.notes=e.notes.replace(n,"'"),e}return t.reject()},function(e){r.log("SERVICE ERROR: "+e)})},c.getAllRecipes=function(){return o.executeQuery(u,"getAllRecipes",["userId="+a]).then(function(e){if(e){var n=[];return angular.isArray(e)?n=e:n.push(e),angular.forEach(n,function(e){var n=new RegExp(d,"g");e.notes=e.notes.replace(n,"'")}),n}},function(e){r.log("SERVICE ERROR: "+e)})},c.updateRecipe=function(n){var i=n.notes.replace(/\'/g,d),c=["id="+n.id,"name="+n.name,"numServings="+n.numServings,"notes="+i,"userId="+a];return o.executeNonQuery(u,"updateRecipe",c).then(function(n){return n!==e&&n.rowsAffected!==e&&-1!==n.rowsAffected?void 0:t.reject()},function(e){return r.log("SERVICE ERROR: "+e),t.reject()})},c.insertRecipe=function(e){var n=["name="+e.name,"numServings="+e.numServings,"notes="+e.notes,"userId="+a];return o.executeNonQuery(u,"insertRecipe",n).then(function(e){return e&&0!==e.generatedId&&-1!==e.rowsAffected?e.generatedId:t.reject()},function(e){r.log("SERVICE ERROR: "+e)})},c}])}(),function(e){"use strict";angular.module("app.recipe").factory("StoreIngredientService",["$http","$q","$log","UserService","DALService",function(n,t,r,i,o){var c={},u="http://test.adamkunzler.com/PHP/storeingredients.php";return c.getStoreIngredient=function(n,i){var c=["storeId="+n,"ingredientId="+i];return o.executeQuery(u,"getStoreIngredient",c).then(function(n){if(n){var r=angular.isArray(n);return r?e:n}return t.reject()},function(e){r.log("SERVICE ERROR: "+e)})},c.insertStoreIngredient=function(n){var i=["ingredientId="+n.ingredient.id,"storeId="+n.store.id,"quantity="+n.quantity,"quantityType="+n.quantityType.value,"cost="+n.cost,"isOrganic="+n.isOrganic];return o.executeNonQuery(u,"insertStoreIngredient",i).then(function(n){return n!==e&&0!==n.generatedId&&-1!==n.rowsAffected?n.generatedId:t.reject()},function(e){r.log("SERVICE ERROR: "+e)})},c.updateStoreIngredient=function(e){var n=["id="+e.id,"ingredientId="+e.ingredient.id,"storeId="+e.store.id,"quantity="+e.quantity,"quantityType="+e.quantityType.value,"cost="+e.cost,"isOrganic="+e.isOrganic];return o.executeNonQuery(u,"updateStoreIngredient",n).then(function(e){return e&&-1!==e.rowsAffected?void 0:t.reject()},function(e){r.log("SERVICE ERROR: "+e)})},c}])}(),function(e){"use strict";angular.module("app.recipe").factory("StoreService",["$http","$q","$log","UserService","DALService",function(n,t,r,i,o){var c={},u="http://test.adamkunzler.com/PHP/stores.php",a=i.currentUser.id;return c.getStoreById=function(e){return o.executeQuery(u,"getStoreById",["id="+e]).then(function(e){return e?e:t.reject()},function(e){r.log("SERVICE ERROR: "+e)})},c.getAllStores=function(){return o.executeQuery(u,"getAllStores",["userId="+a]).then(function(e){return e?e:void 0},function(e){r.log("SERVICE ERROR: "+e)})},c.insertStore=function(n){var i=["userId="+a,"name="+n.name,"notes="+n.notes];return o.executeNonQuery(u,"insertStore",i).then(function(n){return n!==e&&0!==n.generatedId&&-1!==n.rowsAffected?n.generatedId:t.reject()},function(e){r.log("SERVICE ERROR: "+e)})},c.updateStore=function(n){var i=["id="+n.id,"userId="+n.userId,"name="+n.name,"notes="+n.notes];return o.executeNonQuery(u,"updateStore",i).then(function(n){return n!==e&&n.rowsAffected!==e&&-1!==n.rowsAffected?void 0:t.reject()},function(e){return r.log("SERVICE ERROR: "+e),t.reject()})},c}])}(),function(e){"use strict";angular.module("app.recipe").factory("UserService",["$q","$log","$cookies","$location","pmrConfig","DALService",function(e,n,t,r,i,o){var c={},u="http://test.adamkunzler.com/PHP/users.php";return c.login=function(r,a){var d=["username="+r,"password="+a];return o.executeQuery(u,"login",d).then(function(n){return angular.isDefined(n)&&n.id?(c.currentUser={},c.currentUser.id=parseInt(n.id),c.currentUser.username=n.username,c.currentUser.isAdmin="true"===n.isAdmin,c.authValue=btoa(n.id+n.username+i.SECRET_WORD),t.put("pmr_"+n.username,c.authValue),!0):e.reject("Invalid username or password.")},function(e){n.log("SERVICE ERROR: "+e)})},c.logout=function(){n.log("logging out..."),t.remove("pmr_"+c.currentUser.username),r.path("/login")},c.isAdmin=function(){return angular.isDefined(c.currentUser)&&c.currentUser.isAdmin},c.isAuthenticated=function(){return angular.isDefined(c.currentUser)?t.get("pmr_"+c.currentUser.username)===c.authValue:!1},c}])}(),function(e){"use strict";angular.module("app.recipe").controller("StoreDetailsController",["$scope",function(e){var n=function(){};n()}])}(),function(e){"use strict";angular.module("app.recipe").controller("UserLoginController",["$scope","$log","$location","validationService","UserService",function(e,n,t,r,i){e.login=function(o,c){if((new r).checkFormValidity(e.frmUserLogin)){var u=btoa(c);i.login(o,u).then(function(e){e&&(n.log("logged in..."),t.path("/recipe"))},function(n){e.login.error=n})}};var o=function(){};o()}])}(),function(e){"use strict";angular.module("app.recipe").controller("EditIngredientController",["$scope","$uibModalInstance","$q","validationService","IngredientService","ingredient",function(e,n,t,r,i,o){e.ingredient=o,e.ok=function(){return(new r).checkFormValidity(e.frmEditIngredient)?u(e.ingredient.name,e.ingredient.id)?void c(e.ingredient).then(function(){d().then(function(e){e&&n.close(e)})}):void alert("Ingredient name is not unique: "+e.ingredient.name):void 0},e.cancel=function(){n.dismiss("cancel")};var c=function(e){return i.updateIngredient(e).then(function(){},function(){alert("ERROR: Ingredient not updated: "+e.name)})},u=function(n,t){for(var r=!0,i=0;i<e.ingredients.length;i++)if(e.ingredients[i].id!==t&&e.ingredients[i].name===n){r=!1;break}return r},a=function(){return i.getAllIngredients().then(function(n){e.ingredients=n||[]})},d=function(){return i.getIngredientById(o.id).then(function(e){return e?e:(alert("ERROR: Ingredient not found for id: "+o.id),t.reject())})},s=function(){a(),d().then(function(n){n&&(e.ingredient=n)})};s()}])}(),function(e){"use strict";angular.module("app.recipe").controller("IngredientsController",["$scope","$http","$uibModal","IngredientService",function(n,t,r,i){n.sortType="name",n.sortReverse=!1,n.searchIngredient="",n.ingredients=e,n.addIngredient=function(){var e=r.open({animation:!0,templateUrl:"Admin/Ingredients/NewIngredientView.html",controller:"NewIngredientController",size:"sm"});e.result.then(function(e){e&&o(e).then(function(e){e&&n.ingredients.push(e)})})},n.editIngredient=function(e){var t=r.open({animation:!0,templateUrl:"Admin/Ingredients/EditIngredientView.html",controller:"EditIngredientController",size:"sm",resolve:{ingredient:{id:e}}});t.result.then(function(e){if(e)for(var t=0;t<n.ingredients.length;t++)if(n.ingredients[t].id===e.id){n.ingredients[t]=angular.copy(e);break}})},n.deleteIngredient=function(e){var t=n.ingredients.map(function(e){return e.id}).indexOf(e);confirm("Are you sure you want to delete '"+n.ingredients[t].name+"'?")&&i.deleteIngredient(e).then(function(){n.ingredients.splice(t,1)},function(e){alert("ERROR: Unable to delete ingredient: "+e)})};var o=function(e){return i.getIngredientById(e).then(function(e){return e?e:void 0},function(){alert("ERROR: Ingredient not found for id: "+e)})},c=function(){return i.getAllIngredients().then(function(e){n.ingredients=e||[]})},u=function(){c()};u()}])}(),function(e){"use strict";angular.module("app.recipe").controller("NewIngredientController",["$scope","$uibModalInstance","validationService","IngredientService",function(n,t,r,i){n.ingredient=e,n.ok=function(){return(new r).checkFormValidity(n.frmAddIngredient)?o(n.ingredient.name)?void u(n.ingredient).then(function(e){t.close(e)}):void alert("Ingredient name is not unique: "+n.ingredient.name):void 0},n.cancel=function(){t.dismiss("cancel")};var o=function(e){for(var t=!0,r=0;r<n.ingredients.length;r++)if(n.ingredients[r].name===e){t=!1;break}return t},c=function(){return i.getAllIngredients().then(function(e){n.ingredients=e||[]})},u=function(e){return i.insertIngredient(e).then(function(e){return e},function(){alert("ERROR: Ingredient not created: "+e.name)})},a=function(){c()};a()}])}(),function(e){"use strict";angular.module("app.recipe").controller("EditStoreController",["$scope","$uibModalInstance","$q","validationService","StoreService","store",function(e,n,t,r,i,o){e.store=o,e.ok=function(){(new r).checkFormValidity(e.frmEditStore)&&c(e.store).then(function(){u().then(function(e){e&&n.close(e)})})},e.cancel=function(){n.dismiss("cancel")};var c=function(e){return i.updateStore(e).then(function(){},function(){alert("ERROR: Ingredient not updated: "+e.name)})},u=function(){return i.getStoreById(o.id).then(function(e){return e?e:(alert("ERROR: Store not found for id: "+o.id),t.reject())})},a=function(){u().then(function(n){n&&(e.store=n)})};a()}])}(),function(e){"use strict";angular.module("app.recipe").controller("NewStoreController",["$scope","$uibModalInstance","validationService","StoreService",function(n,t,r,i){n.store=e,n.ok=function(){(new r).checkFormValidity(n.frmAddStore)&&(n.store.notes="",o(n.store).then(function(e){t.close(e)}))},n.cancel=function(){t.dismiss("cancel")};var o=function(e){return i.insertStore(e).then(function(e){return e},function(){alert("ERROR: Store not created: "+e.name)})},c=function(){};c()}])}(),function(e){"use strict";angular.module("app.recipe").controller("StoresController",["$scope","$uibModal","StoreService",function(e,n,t){e.addStore=function(){var t=n.open({animation:!0,templateUrl:"Admin/Stores/NewStoreView.html",controller:"NewStoreController",size:"sm"});t.result.then(function(n){n&&r(n).then(function(n){n&&e.stores.push(n)})})},e.deleteStore=function(){alert("Not yet determined how to implement this feature.")},e.editStore=function(t){var r=n.open({animation:!0,templateUrl:"Admin/Stores/EditStoreView.html",controller:"EditStoreController",size:"sm",resolve:{store:{id:t}}});r.result.then(function(n){if(n)for(var t=0;t<e.stores.length;t++)if(e.stores[t].id===n.id){e.stores[t]=angular.copy(n);break}})};var r=function(e){return t.getStoreById(e).then(function(e){return e?e:void 0},function(){alert("ERROR: Store not found for id: "+e)})},i=function(){return t.getAllStores().then(function(n){e.stores=n||[]})},o=function(){i()};o()}])}();