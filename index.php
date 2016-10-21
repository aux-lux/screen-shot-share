<?php
function sp(){
	$sp = 'bcdfghjklmnprstwz';
	return substr($sp, rand(0,strlen($sp)-1), 1);
}
function sa(){
	$sa = 'aouiey';
	return substr($sa, rand(0,strlen($sa)-1), 1);
}

if (isset($_POST['photo'])) { 
	$photo = array_pop(explode(',', $_POST['photo']));
	$data = base64_decode($photo);
	$name = sp().sa().sp().sa().sp();
	$url = 'files/' . $name . '.jpg';
	while (is_file($url)) {
		$name = sp().sa().sp().sa().sp();
		$url = 'files/' . $name . '.jpg';
	}
	file_put_contents($url, $data);
	header('Location: ' . $name . '.jpg');
} else {
	?><!doctype><html style="width:100%;height:100%;"><head><link rel="shortcut icon" type="image/png" href="/favicon.png"/></head><body style="margin:0;pading:0;width:100%;height:100%;"><canvas id="my_canvas" style="width: 100%; height: 100%;"></canvas><script src="main.min.js"></script><div id="note" style="font: 20px/30px Trebuchet Ms, Arial, sans-serif; pointer-events: none; position: absolute; top: 50%; left:0; right:0; text-align: center; transform: translate(0, -50%); color: #43638b;">Make PrintScreen and paste here [Ctrl+V]</div></body></html><?php
}