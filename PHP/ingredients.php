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

$ingredientTable = "pmr_ingredient";

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
	case "getIngredientById":
		$ingId = htmlspecialchars($_GET["ingId"]);
		$query = "SELECT id, name, measureType, gramsPerCup FROM " . $ingredientTable ." WHERE id = " . $ingId;
		$isSelect = true;

		break;
	case "getAllIngredients":
		$query = "SELECT id, name, measureType, gramsPerCup FROM " . $ingredientTable;
		$isSelect = true;

		break;
	case "updateIngredient":
		$id = getGetParam("id");
		$name = getGetParam("name");
		$measureType = getGetParam("measureType");
		$gramsPerCup = $measureType === "weight" ? getGetParam("gramsPerCup") : NULL;

		$query = "UPDATE " . $ingredientTable ." SET name='" . $name . "', measureType='" . $measureType . "'";
		if(!is_null($gramsPerCup)) {
			$query .= ", gramsPerCup=" . $gramsPerCup;
		} else {
			$query .= ", gramsPerCup=NULL";
		}
		$query .= " WHERE id=" . $id;

		$isUpdate = true;

		break;
	case "deleteIngredient":
		$id = getGetParam("id");
		$query = "DELETE FROM " . $ingredientTable ." WHERE id=" . $id;
		$isDelete = true;

		break;
	case "insertIngredient":
		$name = getGetParam("name");
		$measureType = getGetParam("measureType");
		$gramsPerCup = $measureType === "weight" ? getGetParam("gramsPerCup") : NULL;

		$query = "INSERT INTO " . $ingredientTable ." (name, measureType, gramsPerCup) VALUES ('" . $name . "', '" . $measureType . "'";
		if(!is_null($gramsPerCup)) {
			$query .= ", " . $gramsPerCup . ")";
		} else {
			$query .= ", NULL)";
		}

		$isInsert = true;
		//echo(str_replace("$1", $query, $genMessage));
		//return;
		break;
	default:
		echo(str_replace("$1", $queryType, $errorQueryType));
		return;
}

/*
	Execute the query
 */
$result = $conn->query($query);

/*
	Build out the data as JSON and echo it back
*/
if($isSelect) {
	$outp = "";
	while($rs = $result->fetch_array(MYSQLI_ASSOC)) {
	    if ($outp != "") {$outp .= ",";}

	    $outp .= '{"id":"'  . $rs["id"] . '",';
	    $outp .= '"name":"'   . $rs["name"].  '",';
	    $outp .= '"measureType":"'   . $rs["measureType"].  '",';
	    $outp .= '"gramsPerCup":"'. $rs["gramsPerCup"];
	    $outp .= '"}';
	}
	$outp ='['.$outp.']';
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