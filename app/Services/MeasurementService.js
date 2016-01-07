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
