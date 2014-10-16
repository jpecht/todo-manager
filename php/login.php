<?php
	require_once('config.php');	

    $connection = mysqli_connect('jpecht.db', MYSQL_USERNAME, MYSQL_PASSWORD, 'todo');
	if (mysqli_connect_errno()) {
		echo 'Failed to connect to MySQL: ' . mysqli_connect_error();
		exit();
	}
	
	$username = $_REQUEST['username'];
	$passhash = $_REQUEST['passhash'];
	
	$query = 'SELECT salt, saltedpw FROM users WHERE username = "' . $username . '"'; 
	$result = mysqli_query($connection, $query);
	
	if ($result) {
		if (mysqli_num_rows($result) > 0) {
			// compare salted pw
			$result_array = mysqli_fetch_array($result);
			$salt = $result_array['salt'];
			$saltedpw = $result_array['saltedpw'];

			$requested_saltedpw = md5($passhash . md5($salt));
			if (strcmp($requested_saltedpw, $saltedpw) === 0) {
				// passwords match; log them in
				echo json_encode(array("success" => "success"));
			} else {
				echo json_encode(array("error" => "Incorrect password"));
			}
		} else {
			echo json_encode(array("error" => "Username not found"));
		}
	} else {
		echo json_encode(array("error" => "Failed query"));
	}

	mysqli_close($connection);
?>