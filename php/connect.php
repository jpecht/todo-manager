<?php

	/**
	 * @file
	 * A single location to store configuration.
	 */
	
    $connection = mysqli_connect('jpecht.db', 'jpecht', 'smokethedro2', 'todo');
	if (mysqli_connect_errno()) {
		echo 'Failed to connect to MySQL: ' . mysqli_connect_error();
		exit();
	}
	
?>