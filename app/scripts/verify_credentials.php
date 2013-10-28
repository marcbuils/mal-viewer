<?php
	$ch = curl_init();
	curl_setopt($ch,CURLOPT_URL, 'http://myanimelist.net/api/account/verify_credentials.xml');
	curl_setopt($ch, CURLOPT_USERPWD, $_POST['login'] . ":" . $_POST['password']);
	$result = curl_exec($ch);
	curl_close($ch);
?>