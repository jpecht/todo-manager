<?php
	require_once('config.php');

    $connection = mysqli_connect(HOSTNAME, MYSQL_USERNAME, MYSQL_PASSWORD, DB_NAME);
	if (mysqli_connect_errno()) {
		echo 'Failed to connect to MySQL: ' . mysqli_connect_error();
		exit();
	}
	
	$user_id = $_REQUEST['user_id'];
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