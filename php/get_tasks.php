<?php
	require_once('config.php');	

    $connection = mysqli_connect(HOSTNAME, MYSQL_USERNAME, MYSQL_PASSWORD, DB_NAME);
	if (mysqli_connect_errno()) {
		echo 'Failed to connect to MySQL: ' . mysqli_connect_error();
		exit();
	}
	
	$user_id = $_REQUEST['user_id'];
	
	$query = 'SELECT * FROM tasks WHERE user_id = ' . $user_id . ' AND date_completed IS NULL'; 
	$result = mysqli_query($connection, $query);
	
	$tasks = array();
	while ($row = mysqli_fetch_array($result)) {
		array_push($tasks, array(
			"task_id" => $row["id"],
			"description" => $row["description"],
			"list_num" => $row["list_num"],
			"date_created" => $row["date_created"]
		));
	}
		
	echo json_encode($tasks);

	mysqli_close($connection);
?>