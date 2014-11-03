<?php
	session_start();
	
	// unset session variables
	session_unset(); 
	
	// clear cookies
	if (isset($_COOKIE['publickey'])) {
		unset($_COOKIE['publickey']);
		setcookie('publickey', '', time() - 3600);
	}
	
	// redirect (not working atm)
	header('Location: http://www.jpecht.com/todo-manager');
?>