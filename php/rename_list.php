<?php
	require_once('connect.php');
	session_start();

	$list_name = $_REQUEST['list_name'];
	$list_num = $_REQUEST['list_num'];

	$query = 'UPDATE users SET list_name_' . $list_num . ' = ' . $list_name . ' WHERE id = ' . $_SESSION['user_id'];
	$result = mysqli_query($connection, $query);
	if ($result) {
		echo json_encode(array(
			"success" => "success"
		));
	} else {
		echo json_encode(array(
			"error" => "Query failed."
		))
	}
?>