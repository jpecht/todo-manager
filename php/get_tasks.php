<?php
	require_once('connect.php');
	session_start();
		
	$query = 'SELECT * FROM tasks WHERE user_id = ' . $_SESSION['user_id'] . ' AND date_completed IS NULL'; 
	$result = mysqli_query($connection, $query);
	
	$tasks = array();
	while ($row = mysqli_fetch_array($result)) {
		array_push($tasks, array(
			"task_id" => $row["id"],
			"description" => $row["description"],
			"list_num" => $row["list_num"],
			"date_created" => $row["date_created"],
			"order_id" => $row["order_id"]
		));
	}
		
	echo json_encode($tasks);

	mysqli_close($connection);
?>