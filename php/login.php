<?php
	require_once('config.php');	

    $connection = mysqli_connect('localhost', MYSQL_USERNAME, MYSQL_PASSWORD, 'todo');
	if (mysqli_connect_errno()) {
		echo 'Failed to connect to MySQL: ' . mysqli_connect_error();
		exit();
	}
	
	$user_name = $_REQUEST['username'];
	$password = $_REQUEST['password'];
	
	$query = 'SELECT user_id FROM users WHERE user_name = "' . $user_name . '" AND password="' . $password . '"'; 
	$result = mysqli_query($connection, $query);
	$user_id = mysqli_fetch_array($result)['user_id'];
		
	echo $user_id;

	mysqli_close($connection);
?>