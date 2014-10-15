<?php
	require_once('config.php');

    $connection = mysqli_connect('localhost', MYSQL_USERNAME, MYSQL_PASSWORD, 'todo');
	if (mysqli_connect_errno()) {
		echo 'Failed to connect to MySQL: ' . mysqli_connect_error();
		exit();
	}
	
	$user_id = $_REQUEST['user_id'];
	$task_name = $_REQUEST['taskName'];
	$date_created = date('Y-m-d H:i:s');
	$date_finished = -1;
	$list_name = $_REQUEST['listName'];
	
	$query = 'INSERT INTO tasks VALUES (' . $user_id . ', "'. $task_name . '", "' . $date_created . '", ' . $date_finished . ', "' . $list_name . '")';
	$result = mysqli_query($connection, $query);
	
	echo $result;
	
	mysqli_close($connection);
?>