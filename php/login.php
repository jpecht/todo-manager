<?php
	require_once('config.php');	

    $connection = mysqli_connect(HOSTNAME, MYSQL_USERNAME, MYSQL_PASSWORD, DB_NAME);
	if (mysqli_connect_errno()) {
		echo 'Failed to connect to MySQL: ' . mysqli_connect_error();
		exit();
	}
	
	$username = $_REQUEST['username'];
	$passhash = $_REQUEST['passhash'];
	
	$query = 'SELECT id, email, salt, saltedpw FROM users WHERE username LIKE "' . $username . '"'; 
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
				session_start();
				$_SESSION['user_id'] = $result_array['id'];
				$_SESSION['user_agent'] = $_SERVER['HTTP_USER_AGENT'];

				// generate public and private key for autologin
				$created_on = date('Y-m-d H:i:s');
				$public_key = md5($result_array['email'] . $created_on);
				$private_key = md5($_SESSION['user_agent'] . $salt);

				// delete oldest autologin record if too many in database
				$autologin_query = 'SELECT * FROM autologin WHERE user_id = ' . $_SESSION['user_id'];
				$num_sessions = mysqli_num_rows(mysqli_query($connection, $autologin_query));
				if ($num_sessions > 5) {
					$delete_query = 'DELETE FROM autologin ORDER BY created_on LIMIT 1';
					$delete_result = mysqli_query($connection, $delete_query);
				}

				// store autologin record in database
				$insert_values = '("' . $_SESSION['user_id'] . '", "' . $public_key . '", "' . $private_key . '", "' . $created_on . '")';
				$insert_query = 'INSERT INTO autologin (user_id, public_key, private_key, created_on) VALUES ' . $insert_values;
				$insert_result = mysqli_query($connection, $insert_query);

				// set cookie and redirect
				setcookie('publickey', $_SESSION['user_id'] . $public_key);
				
				// header not working, so redirecting in javascript for now
				//header('Location: http://www.jpecht.com');
				echo json_encode(array("success" => "Success"));
				exit;
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