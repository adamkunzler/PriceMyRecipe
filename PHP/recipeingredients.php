<?php
/*
	Boom!! Do the headers
 */
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

/*
	Some global variables
 */
$errorQueryType = '[{"message": "invalid or unknown query type requested: $1"}]';
$genMessage = '[{"message": "$1"}]';
$errMessage = '[{"message": "$1"}]';

$table = "pmr_recipe_ingredient";

function getGetParam($param) {
	return htmlspecialchars($_GET[$param]);
}

/*
	Set up the connection to the database
 */
$conn = new mysqli("localhost:3306", "adamkunzler", "Elizag11!", "adamkunzler_pricemyrecipe");

/*
	Build the query
 */
$query = "";
$queryType = getGetParam("query");

$isSelect = false;
$isUpdate = false;
$isInsert = false;
$isDelete = false;

switch($queryType) {
	case "deleteIngredient":
		$id = getGetParam("id");
		$query = "DELETE FROM " . $table ." WHERE id=" . $id;
		$isDelete = true;

		break;
	case "getAllRecipeIngredients":
		$recipeId = getGetParam("recipeId");

		$query = "SELECT t1.id, t1.ingredientId, t2.name, t2.gramsPerCup, t1.recipeId, t1.storeIngredientId, t3.quantity, t3.quantityType, t3.cost, t1.wholeAmount, t1.partialAmount, t1.measurementType";
		$query .= " FROM " . $table . " t1";
		$query .= " LEFT JOIN pmr_ingredient t2 ON t2.id = t1.ingredientId";
		$query .= " LEFT JOIN pmr_store_ingredient t3 ON t3.id = t1.storeIngredientId";
		$query .= " WHERE t1.recipeId = " . $recipeId;
		$isSelect = true;

		break;
	case "insertRecipeIngredient":
		$ingredientId = getGetParam("ingredientId");
		$recipeId = getGetParam("recipeId");
		$storeIngredientId = getGetParam("storeIngredientId");
		$wholeAmount = getGetParam("wholeAmount");
		$partialAmount = getGetParam("partialAmount");
		$measurementType = getGetParam("measurementType");

		$query = "INSERT INTO " . $table ." (ingredientId, recipeId, storeIngredientId, wholeAmount, partialAmount, measurementType)";
		$query .= " VALUES (" . $ingredientId . ", " . $recipeId . ", " . $storeIngredientId . ", " . $wholeAmount . ", '" . $partialAmount . "', '" . $measurementType . "')";

		$isInsert = true;
		break;
	default:
		echo(str_replace("$1", $queryType, $errorQueryType));
		return;
}

/*
	Execute the query
 */
$result = $conn->query($query);
if(!$result) {
	echo(str_replace("$1", $conn->error, $errMessage));
	return;
}

/*
	Build out the data as JSON and echo it back
*/
if($isSelect) {
	$outp = "";
	while($rs = $result->fetch_array(MYSQLI_ASSOC)) {
	    if ($outp != "") {$outp .= ",";}

	    $outp .= '{"id": "'  . $rs["id"] . '",';
	    $outp .= '"ingredient": { "id": "' . $rs["ingredientId"] .  '", "name": "' . $rs["name"] . '", "gramsPerCup":  "' . $rs["gramsPerCup"] . '" },';
	    $outp .= '"recipe": { "id": "'   . $rs["recipeId"].  '" },';
	    $outp .= '"storeIngredient": { "id": "'   . $rs["storeIngredientId"].  '", "quantity": "' . $rs["quantity"] . '", "quantityType":  "' . $rs["quantityType"] . '", "cost": "' . $rs["cost"] . '" },';
		$outp .= '"wholeAmount": "'   . $rs["wholeAmount"].  '",';
	    $outp .= '"partialAmount": "'   . $rs["partialAmount"].  '",';
	    $outp .= '"measurementType":"'. $rs["measurementType"] . '"';
	    $outp .= '}';
	}
	$outp ='['.$outp.']';
	//$outp = json_encode($outp);
	$conn->close();

	echo($outp);
	return;
}

if($isUpdate || $isDelete) {
	$msg = '[{"rowsAffected": ' . $conn->affected_rows . '}]';
	echo($msg);
	return;
}

if($isInsert) {
	$msg = '[{"rowsAffected": ' . $conn->affected_rows . ', "generatedId": ' . $conn->insert_id . '}]';
	echo($msg);
	return;
}

?>