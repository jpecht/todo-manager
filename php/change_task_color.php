<?php
	require_once('connect.php');
	session_start();

	$user_id = $_SESSION['user_id'];
	$task_id = $_REQUEST['task_id'];
	$new_color_id = $_REQUEST['color_id'];

	$query = 'UPDATE tasks SET color = ' . $new_color_id . ' WHERE user_id = ' . $user_id . ' AND id = ' . $task_id;
	$result = mysqli_query($connection, $query);
	if ($result) {
		echo json_encode(array(
			'success' => 'success'
		));
	} else {
		echo json_encode(array(
			'error' => 'Query failed.'
		));
	}

	mysqli_close($connection);
?>