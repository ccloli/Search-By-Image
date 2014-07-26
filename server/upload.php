<?php
header('Access-Control-Allow-Origin: *');
header('X-XSS-Proctection: 0');
header('Content-Security-Policy: reflected-xss allow');
header('X-Content-Security-Policy: reflected-xss allow');
if(empty($_REQUEST['imgdata'])==false){
	preg_match('/^data:.*?;base64,(.*)/',$_REQUEST['imgdata'],$imgdata);
	$time=time();
	$filename=$time.'.jpg';
	file_put_contents($filename,base64_decode($imgdata[1]));
	echo 'http://sbi.ccloli.com/img/'.$filename;
	$data=explode(' ',file_get_contents('data.txt'));
	$new_data='';
	$num=count($data);
	for($i=0;$i<$num;$i++){
		if($time-$data[$i]>300){
			unlink($data[$i].'.jpg');
		}
		else{
			$new_data.=$data[$i].' ';
		}
	}
	$new_data.=$time;
	file_put_contents('data.txt',$new_data);
}
exit;
?>