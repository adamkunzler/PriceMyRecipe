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