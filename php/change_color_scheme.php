<?php
	require_once('connect.php');
	session_start();

	$user_id = $_SESSION['user_id'];
	$color_scheme = $_REQUEST['color_scheme'];

	$query = 'UPDATE users SET color_scheme = "' . $color_scheme . '" WHERE id = ' . $user_id;
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