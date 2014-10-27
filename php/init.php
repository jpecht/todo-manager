<?php
	session_start();

	if (array_key_exists('USER_ID', $_SESSION)) {
		$user_id = (int)$_SESSION['USER_ID'];

		// check to make sure useragent is the same
		if (strcmp($_SESSION['user_agent'], $_SERVER['HTTP_USER_AGENT']) === 0) {
			// open connection
			require_once('connect.php');
	
			$user_query = 'SELECT * FROM users WHERE id = ' . $user_id;
			$user_result = mysqli_query($connection, $user_query);
			$user_obj = mysqli_fetch_array($user_result);
			echo json_encode(array(
				'username' => $user_obj['username'],
				'email' => $user_obj['email'],
				'color_scheme' => $user_obj['color_scheme'],
				'list_name_1' => $user_obj['list_name_1'],
				'list_name_2' => $user_obj['list_name_2'],
				'list_name_3' => $user_obj['list_name_3'],
				'list_name_4' => $user_obj['list_name_4'],
				'status' => 'session id exists'
			));
		} else {
			echo json_encode(array('error' => 'different user agent detected'));
		}
	} else {
		// check for public key cookie
		if (isset($_COOKIE['publickey']) && strlen($_COOKIE['publickey']) > 32) {

			// open connection
			require_once('connect.php');

			$cookie = $_COOKIE['publickey'];
			$user_id = (int)substr($cookie, 0, strlen($cookie) - 32);
			$publickey = substr($cookie, -32);

			// retrive private key from database where user_id and public key match
			$query = 'SELECT * FROM autologin WHERE user_id = ' . $user_id . ' AND public_key ="' . $publickey . '"';
			$result = mysqli_query($connection, $query);

			if ($result && mysqli_num_rows($result) > 0) {
				$al_row = mysqli_fetch_array($result);

				// retrieve user's salt
				$user_query = 'SELECT * FROM users WHERE id = ' . $user_id;
				$user_obj = mysqli_fetch_array(mysqli_query($connection, $user_query));
				$salt = $user_obj['salt'];

				// reconstruct private key and compare to database
				$private_key = md5($_SERVER['HTTP_USER_AGENT'] . $salt);
				if (strcmp($private_key, $al_row['private_key']) === 0) {
					$_SESSION['USER_ID'] = $user_id;

					$ip_add = ip2long($_SERVER['REMOTE_ADDR']);
					$datetime = date('Y-m-d H:i:s');
					$update_query = 'UPDATE autologin SET last_used_on = "' . $datetime . '", last_used_ip = "' . $ip_add . '" WHERE user_id = ' . $user_id . ' AND public_key ="' . $publickey . '"';
					mysqli_query($connection, $update_query);

					echo json_encode(array(
						'user_id' => $user_id,
						'username' => $user_obj['username'],
						'email' => $user_obj['email'],
						'color_scheme' => $user_obj['color_scheme'],
						'list_name_1' => $user_obj['list_name_1'],
						'list_name_2' => $user_obj['list_name_2'],
						'list_name_3' => $user_obj['list_name_3'],
						'list_name_4' => $user_obj['list_name_4'],
						'status' => 'publickey cookie exists'
					));
				} else {
					// cookie invalid
					echo json_encode(array("error" => "private key does not match"));
				}
			} else {
				// cookie invalid
				echo json_encode(array("error" => "user id and public key combo does not match"));
			}

			mysqli_close($connection);
		} else {
			// cookie not available
			echo json_encode(array("error" => "no cookie found"));
		}
	}
?>