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

$recipeTable = "pmr_recipe";

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
	case "getRecipeById":
		$id = htmlspecialchars($_GET["id"]);
		$query = "SELECT id, userId, name, numServings, notes FROM " . $recipeTable ." WHERE id = " . $id;
		$isSelect = true;

		break;
	case "getAllRecipes":
		$userId = htmlspecialchars($_GET["userId"]);
		$query = "SELECT id, userId, name, numServings, notes FROM " . $recipeTable . " WHERE userId = " . $userId;
		$isSelect = true;

		break;
	case "updateRecipe":
		$id = getGetParam("id");
		$userId = getGetParam("userId");
		$name = getGetParam("name");
		$numServings = getGetParam("numServings");
		$notes = ereg_replace("\n", "|NL|", getGetParam("notes"));

		$query = "UPDATE " . $recipeTable ." SET userId=" . $userId . ", name='" . $name . "', numServings=" . $numServings . ", notes='" . $notes . "'";
		$query .= " WHERE id=" . $id;

		$isUpdate = true;
		//echo(str_replace("$1", $query, $genMessage));
		//return;
		break;
	case "insertRecipe":
		$userId = getGetParam("userId");
		$name = getGetParam("name");
		$numServings = getGetParam("numServings");
		$notes = ereg_replace("\n", "|", getGetParam("notes"));

		$query = "INSERT INTO " . $recipeTable ." (userId, name, numServings, notes) VALUES (" . $userId . ", '" . $name . "', '" . $numServings . "', '" . $notes . "')";

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

	    $outp .= '{"id":'  . $rs["id"] . ',';
	    $outp .= '"userId":'   . $rs["userId"].  ',';
	    $outp .= '"name":"'   . $rs["name"].  '",';
	    $outp .= '"numServings":'   . $rs["numServings"].  ',';
	    $outp .= '"notes":"'. str_replace("|NL|", "\\n", $rs["notes"]) . '"';
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