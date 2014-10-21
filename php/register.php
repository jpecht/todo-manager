<?php
	require_once('config.php');
	require('phpmailer/PHPMailerAutoload.php');
    session_start();
	
	$email = $_REQUEST['email'];
	$username = $_REQUEST['username'];
	$passhash = $_REQUEST['passhash'];
	$reg_date = date('Y-m-d H:i:s');

    $connection = mysqli_connect(HOSTNAME, MYSQL_USERNAME, MYSQL_PASSWORD, DB_NAME);
	if (mysqli_connect_errno()) {
		echo json_encode(array('error' => 'Failed to connect to MySQL: ' . mysqli_connect_error()));
		exit();
	}

	// check for existing email
	$query = 'SELECT * FROM users WHERE email LIKE "' . $email . '"';
	$result = mysqli_query($connection, $query);
	
	if ($result) {
		if (mysqli_num_rows($result) > 0) {
			echo json_encode(array('error' => 'Email already exists'));
		} else {
			// generate salt and md5 together with password
			$salt = mcrypt_create_iv(5, MCRYPT_DEV_URANDOM);
			$saltedpw = md5($passhash . md5($salt));
			
			// convert IP address to int
			$reg_ip = ip2long($_SERVER['REMOTE_ADDR']);
			
			// insert in database
			$values = '("' . $username . '", "' . $email . '", "' . $salt . '", "' . $saltedpw . '", "' . $reg_date . '", "' . $reg_date . '", "' . $reg_ip . '", "' . $reg_ip . '")';
			$insert_query = 'INSERT INTO users (username, email, salt, saltedpw, reg_date, last_login_date, reg_ip, last_login_ip) VALUES ' . $values;
			mysqli_query($connection, $insert_query);

			// send email with verification to user
			$verification_code = md5($email . $saltedpw);
			$verification_link = 'http://www.jpecht.com/todo-man/index.html?token=' . $verification_code;
			$mail = new PHPMailer;
			$mail->From = 'me.jefferson@gmail.com';
			$mail->FromName = 'Jefferson';
			$mail->addAddress($email);
			$mail->isHTML(true);
			$mail->Subject = 'To-Do Manager Verification';
			$mail->Body = 'Thanks for signing up for To-Do Manager!<br/> Click <a href="' . $verification_link . '">here</a> to verify your account and log in!';
			if (!$mail->send()) {
				echo json_encode(array('error' => 'Trouble sending email'));
				exit;
			}

			echo json_encode(array('success' => 'success'));
		}
	} else {
		echo json_encode(array('error' => 'Failed query'));
	}
	
	mysqli_close($connection);
?>