<?php
	require_once('connect.php');
	session_start();
	
	$user_id = $_SESSION['user_id'];
	$description = $_REQUEST['description'];
	$list_num = $_REQUEST['list_num'];
	$date_created = date('Y-m-d H:i:s');
	
	$keys = '(user_id, description, list_num, date_created)';
	$values = '(' . $user_id . ', "'. $description . '", "' . $list_num . '", "' . $date_created . '")';
	$query = 'INSERT INTO tasks ' . $keys . ' VALUES ' . $values;
	$result = mysqli_query($connection, $query);
	
	echo json_encode(array(
		"task_id" => mysqli_insert_id($connection),
		"date_created" => $date_created
	));
	
	mysqli_close($connection);
?>