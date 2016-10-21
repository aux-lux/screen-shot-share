<?php
function scan_dir($dir) {
    $ignored = array('.', '..', '.htaccess');

    $files = array();    
    foreach (scandir($dir) as $file) {
        if (in_array($file, $ignored)) continue;
        $files[$file] = filemtime($dir . '/' . $file);
    }

    arsort($files);
    $files = array_keys($files);

    return ($files) ? $files : false;
}

$dir = 'files/';
foreach(scan_dir($dir) as $file) {
	if (((time() - fileatime($dir.$file))/60/60/24/2) > 2) {
		unlink($dir.$file);
	}
}

$fi = new FilesystemIterator($dir, FilesystemIterator::SKIP_DOTS);
$io = popen ( '/usr/bin/du -sk ' . $dir, 'r' );
$size = fgets ( $io, 4096);
$size = substr ( $size, 0, strpos ( $size, "\t" ) );
$strSize = $size . ' kB';
if ($size > 1024 * 1024) {
	$strSize = round($size/1024/1024*100)/100 . ' GB';
} else if ($size > 1024) {
	$strSize = round($size/1024*100)/100 . ' MB';
}
$proc = $size / 1024 / 512 * 100; // limit 1GB
if ($proc > 1) {
	$proc = 1;
}
pclose ( $io );
?><!doctype><html><head></head><body style="margin:0;padding:0; background: #f9f9f9;">
<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 300px; height: 16px; background: #fff; box-shadow: 1px 1px 20px rgba(0,0,0,0.05); border: 2px #fff solid;"><div style="width: <?php echo $proc; ?>%; height: 100%; background: #56d87b;"></div><div style="position: absolute; pointer-events: none; top:0;left:0;right:0;bottom:0;font: 12px/18px Trebuchet MS, Arial, sans-serif; color: #555; text-align: center;"><?php echo $strSize . ' ( ' . iterator_count($fi) . ' )'; ?></div></div>
</body>
