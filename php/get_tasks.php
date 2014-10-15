<?php
	require_once('config.php');	

    $connection = mysqli_connect('localhost', MYSQL_USERNAME, MYSQL_PASSWORD, 'todo');
	if (mysqli_connect_errno()) {
		echo 'Failed to connect to MySQL: ' . mysqli_connect_error();
		exit();
	}
	
	$user_id = $_REQUEST['user_id'];
	
	$query = 'SELECT * FROM tasks WHERE user_id = ' . $user_id; 
	$result = mysqli_query($connection, $query);
	
	$rows = array();
	while ($row = mysqli_fetch_array($result)) {
		array_push($rows, array(
			"task" => $row["task"],
			"date_created" => $row["date_created"],
			"date_finished" => $row["date_finished"],
			"list" => $row["list"]
		));
	}
		
	echo json_encode($rows);

	mysqli_close($connection);
?>