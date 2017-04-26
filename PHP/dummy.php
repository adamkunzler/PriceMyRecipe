<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$conn = new mysqli("localhost:3306", "adamkunzler", "Elizag11!", "adamkunzler_pricemyrecipe");

$queryType = htmlspecialchars($_GET["query"]);

function getGetParam($param) {
	return htmlspecialchars($_GET[$param]);
}

$msg = "";
switch($queryType) {
	case "adam":
		$msg = ereg_replace("\n", "|", getGetParam("test"));
		$msg .= "\r\n\r\n" . urlencode(str_replace("|", "\n", "one|two|three"));
		break;
	default:
		$msg = "nobody knows the trouble i'm in...";
}

echo '"' . $msg . '"';
?>