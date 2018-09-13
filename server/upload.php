<?php
error_reporting(0);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept');
header('Content-Type: text/plain');

$datafile=empty($_ENV['SBI_DATAFILE'])?'data.txt':$_ENV['SBI_DATAFILE'];
$path=empty($_ENV['SBI_PREFIX'])?'http://'.$_SERVER['HTTP_HOST'].'/img/':$_ENV['SBI_PREFIX'];

if(empty($_REQUEST['imgdata'])==false){
	preg_match('/^data:(.*?);base64,(.*)/',$_REQUEST['imgdata'],$imgdata);
	$time=time();
	$timestr=dechex($time);
	$ext=explode('/',$imgdata[1])[1];
	if(empty($ext)){
		$ext='jpg';
	}
	$filename=strlen($timestr).$timestr.uniqid().'.'.$ext;
	file_put_contents($filename,base64_decode($imgdata[2]));
	echo $path.$filename;
	$data=explode(' ',file_get_contents($datafile));
	$new_data='';
	$num=count($data);
	foreach($data as $item) {
		$tlen=substr($item,0,1);
		$t=hexdec(substr($item,1,(int)$tlen));
		if($time-$t>300){
			unlink($item);
		}
		else{
			$new_data.=$item.' ';
		}
	}
	$new_data.=$filename;
	file_put_contents('data.txt',$new_data);
}
exit;
?>