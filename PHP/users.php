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

$table = "pmr_users";

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
	case "login":
		$username = getGetParam("username");
		$password = getGetParam("password");
		$query = "SELECT id, username, isAdmin FROM " . $table ." WHERE username = '" . $username . "' AND password = '" . $password . "'";
		$isSelect = true;

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
	    $outp .= '"username":"'   . $rs["username"].  '",';
	    $outp .= '"isAdmin":"'. (($rs["isAdmin"] == 0) ? "false" : "true") . '"';
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