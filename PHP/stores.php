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

$storeTable = "pmr_store";

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
	case "getStoreById":
		$id = getGetParam("id");
		$query = "SELECT id, userId, name, notes FROM " . $storeTable ." WHERE id = " . $id;
		$isSelect = true;

		break;
	case "getAllStores":
		$userId = getGetParam("userId");
		$query = "SELECT id, userId, name, notes FROM " . $storeTable . " WHERE userId = " . $userId;
		$isSelect = true;

		//echo(str_replace("$1", $query, $genMessage));
		//return;

		break;
	case "updateStore":
		$id = getGetParam("id");
		$userId = getGetParam("userId");
		$name = getGetParam("name");
		$notes = ereg_replace("\n", "|NL|", getGetParam("notes"));

		$query = "UPDATE " . $storeTable ." SET name='" . $name . "', notes='" . $notes . "'";
		$query .= " WHERE id=" . $id;

		$isUpdate = true;

		break;
	case "deleteStore":
		// $id = getGetParam("id");
		// $query = "DELETE FROM " . $storeTable ." WHERE id=" . $id;
		// $isDelete = true;
		return;
		//break;
	case "insertStore":
		$userId = getGetParam("userId");
		$name = getGetParam("name");
		$notes = ereg_replace("\n", "|NL|", getGetParam("notes"));

		$query = "INSERT INTO " . $storeTable ." (userId, name, notes) VALUES ('" . $userId . "', '" . $name . "', '" . $notes . "')";

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
	    $outp .= '"userId":"'   . $rs["userId"].  '",';
	    $outp .= '"name":"'   . $rs["name"].  '",';
	    $outp .= '"notes":"'   . str_replace("|NL|", "\\n", $rs["notes"]) . '"';
	    $outp .= '}';
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