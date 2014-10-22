<?php
	require_once('connect.php');		
	
	$username = $_REQUEST['username'];
	$passhash = $_REQUEST['passhash'];
	$autologin = $_REQUEST['autologin'];
	
	$query = 'SELECT * FROM users WHERE username LIKE "' . $username . '"'; 
	$result = mysqli_query($connection, $query);
	
	if ($result) {
		if (mysqli_num_rows($result) > 0) {
			// compare salted pw
			$user_array = mysqli_fetch_array($result);
			$salt = $user_array['salt'];
			$saltedpw = $user_array['saltedpw'];
			$must_verify = $user_array['must_verify'];

			$requested_saltedpw = md5($passhash . md5($salt));
			if (strcmp($requested_saltedpw, $saltedpw) === 0) {
				
				// check for verification code if havent verified yet
				if ($must_verify) {
					if (isset($_REQUEST['token'])) {
						$token = md5($user_array['email'] . $user_array['saltedpw']);
						if (strcmp($token, $_REQUEST['token']) === 0) {
							// verification token matches, toggle must_verify
							$alter_verify_query = 'UPDATE users SET must_verify = 0 WHERE id = ' . $user_array['id'];
							mysqli_query($connection, $alter_verify_query);
						} else {
							echo json_encode(array("error" => "Verification code does not match."));
							exit;
						}
					} else {
						echo json_encode(array("error" => "Must verify. No verification code."));
						exit;
					}
				}

				// passwords match; log them in
				session_start();
				$_SESSION['user_id'] = $user_array['id'];
				$_SESSION['user_agent'] = $_SERVER['HTTP_USER_AGENT'];

				if ($autologin) {
					// generate public and private key for autologin
					$created_on = date('Y-m-d H:i:s');
					$public_key = md5($user_array['email'] . $created_on);
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
				}
				
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