<?php
	require_once('connect.php');
	session_start();
	
	$task_id = $_REQUEST['task_id'];
	$user_id = $_SESSION['user_id'];
	
	$query = 'DELETE FROM tasks WHERE id = ' . $task_id . ' AND user_id = ' . $user_id;	
	$result = mysqli_query($connection, $query);
	if ($result) {
		echo json_encode(array(
			"success" => "success"
		));
	} else {
		echo json_encode(array(
			"error" => "Query failed."
		));
	}
	
	mysqli_close($connection); 
?>