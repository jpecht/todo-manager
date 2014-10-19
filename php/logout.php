<?php
	session_start();
	if (is_set($_SESSION['USER_ID'])) unset($_SESSION['USER_ID']);
	if (is_set($_COOKIE['publickey'])) unset($_COOKIE['publickey']);
	header('Location: http://www.jpecht.com/todo-man');
?>