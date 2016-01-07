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

$table = "pmr_store_ingredient";

function getGetParam($param) {
	return htmlspecialchars($_GET[$param]);
}

/*
	Set up the connection to the database
 */
$conn = new mysqli("server", "username", "password", "database");

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
	case "getStoreIngredient":
		$ingredientId = getGetParam("ingredientId");
		$storeId = getGetParam("storeId");

		$query = "SELECT id, ingredientId, storeId, quantity, quantityType, cost, isOrganic FROM " . $table;
		$query .= " WHERE storeId = " . $storeId . " AND ingredientId = " . $ingredientId;
		$isSelect = true;

		break;
	case "updateStoreIngredient":
		$id = getGetParam("id");
		$ingredientId = getGetParam("ingredientId");
		$storeId = getGetParam("storeId");
		$quantity = getGetParam("quantity");
		$quantityType = getGetParam("quantityType");
		$cost = getGetParam("cost");
		$isOrganic = getGetParam("isOrganic");

		$query = "UPDATE " . $table ." SET ingredientId=" . $ingredientId . ", storeId=" . $storeId . ", quantity=" . $quantity . ", quantityType='" . $quantityType . "', cost=" . $cost . ", isOrganic=" . $isOrganic;
		$query .= " WHERE id=" . $id;

		$isUpdate = true;

		break;
	case "insertStoreIngredient":
		$ingredientId = getGetParam("ingredientId");
		$storeId = getGetParam("storeId");
		$quantity = getGetParam("quantity");
		$quantityType = getGetParam("quantityType");
		$cost = getGetParam("cost");
		$isOrganic = getGetParam("isOrganic");

		$query = "INSERT INTO " . $table ." (ingredientId, storeId, quantity, quantityType, cost, isOrganic)";
		$query .= " VALUES (" . $ingredientId . ", " . $storeId . ", " . $quantity . ", '" . $quantityType . "', " . $cost . ", " . $isOrganic . ")";

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
	    $outp .= '"ingredient": { "id": "' . $rs["ingredientId"].  '" },';
	    $outp .= '"store": { "id": "'   . $rs["storeId"].  '" },';
	    $outp .= '"quantity":"'   . $rs["quantity"].  '",';
	    $outp .= '"quantityType": { "value": "'   . $rs["quantityType"].  '" },';
	    $outp .= '"cost": "'   . $rs["cost"].  '",';
	    $outp .= '"isOrganic":"'. (($rs["isOrganic"] == 0) ? "false" : "true") . '"';
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