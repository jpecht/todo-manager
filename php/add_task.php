<?php
	require_once('connect.php');
	session_start();
	
	$user_id = $_SESSION['user_id'];
	$description = $_REQUEST['description'];
	$list_num = $_REQUEST['list_num'];
	$date_created = date('Y-m-d H:i:s');


	$max_id_query = 'SELECT MAX(order_id) FROM tasks WHERE user_id = ' . $user_id;
	$max_id_result = mysqli_query($connection, $max_id_query);
	$max_id_array = mysqli_fetch_array($max_id_result);
	$max_id = $max_id_array['MAX(order_id)'];
	$new_max_id = (int)$max_id + 1000;
	
	$keys = '(user_id, description, list_num, date_created, order_id)';
	$values = '(' . $user_id . ', "'. $description . '", "' . $list_num . '", "' . $date_created . '", ' . $new_max_id . ')';
	$query = 'INSERT INTO tasks ' . $keys . ' VALUES ' . $values;
	$result = mysqli_query($connection, $query);
	
	if ($result) {
		echo json_encode(array(
			"description" => $description,
			"list_num" => $list_num,
			"task_id" => mysqli_insert_id($connection),
			"date_created" => $date_created,
			"date_completed" => NULL,
			"order_id" => $new_max_id,
			"color" => 0
		));
	} else {
		echo json_encode(array(
			"error" => "Query failed."
		));
	}
	
	mysqli_close($connection);
?>