<?php
	require_once('config.php');

    $connection = mysqli_connect('localhost', MYSQL_USERNAME, MYSQL_PASSWORD, 'todo');
	if (mysqli_connect_errno()) {
		echo 'Failed to connect to MySQL: ' . mysqli_connect_error();
		exit();
	}

?>