<?php

	/**
	 * @file
	 * A single location to store configuration.
	 */

	define('MYSQL_HOSTNAME', '**********');
	define('MYSQL_USERNAME', '**********');
	define('MYSQL_PASSWORD', '**********');
	define('MYSQL_DATABASE', '**********');
	
    $connection = mysqli_connect(MYSQL_HOSTNAME, MYSQL_USERNAME, MYSQL_PASSWORD, MSQL_DATABASE);
	if (mysqli_connect_errno()) {
		echo 'Failed to connect to MySQL: ' . mysqli_connect_error();
		exit();
	}
	
?>