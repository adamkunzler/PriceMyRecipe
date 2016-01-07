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