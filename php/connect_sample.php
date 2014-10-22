<?php

	/**
	 * @file
	 * A single location to store configuration.
	 */

    $connection = mysqli_connect(MYSQL_HOSTNAME, MYSQL_USERNAME, MYSQL_PASSWORD, MYSQL_DATABASE);
	if (mysqli_connect_errno()) {
		echo 'Failed to connect to MySQL: ' . mysqli_connect_error();
		exit();
	}
	
?>