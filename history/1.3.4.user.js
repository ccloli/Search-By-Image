// ==UserScript==
// @name        Search By Image
// @version     1.3.4
// @description Search By Image | 以图搜图
// @match       <all_urls>
// @include     *
// @author      864907600cc
// @icon        http://1.gravatar.com/avatar/147834caf9ccb0a66b2505c753747867
// @run-at      document-start
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_openInTab
// @grant       GM_registerMenuCommand
// @namespace   http://ext.ccloli.com
// ==/UserScript==

// 本脚本基于 GPLv3 协议开源 http://www.gnu.org/licenses/gpl.html‎
// (c) 86497600cc. Some Rights Reserved.
// Default setting: Press Ctrl and click right key on a image to search.

var default_setting={
	"site_list":{
		"Google":"https://www.google.com/searchbyimage?image_url={%s}",
		"Baidu ShiTu":"http://stu.baidu.com/i?ct=1&tn=baiduimage&objurl={%s}",
		"Baidu Image":"http://image.baidu.com/i?rainbow=1&ct=1&tn=shituresultpc&objurl={%s}",
		"Bing":"http://cn.bing.com/images/searchbyimage?FORM=IRSBIQ&cbir=sbi&imgurl={%s}",
		"TinEye":"http://www.tineye.com/search?url={%s}",
		"Sogou":"http://pic.sogou.com/ris?query={%s}",
		//"Cydral":"http://www.cydral.com/#url={%s}",
		"Яндекс (Yandex)":"http://yandex.ru/images/search?rpt=imageview&img_url={%s}",
		"SauceNAO":"http://saucenao.com/search.php?db=999&url={%s}",
		"IQDB":"http://iqdb.org/?url={%s}"
	},
	"site_option":["Google","Baidu ShiTu","Baidu Image","Bing","TinEye","Sogou","Яндекс (Yandex)","SauceNAO","IQDB"],
	"hot_key":"ctrlKey" // Can be set as one of these: "ctrlKey", "shiftKey", "altKey". Default setting is "ctrlKey". 
}
var search_panel=null;
var setting=GM_getValue('setting')?JSON.parse(GM_getValue('setting')):default_setting;
var disable_contextmenu=false;
var img_src=null;

function set_setting(data){
	GM_setValue('setting',JSON.stringify(data));
}

function create_panel(){
	search_panel=document.createElement('div');
	search_panel.style.cssText='width:198px;font-size:14px;text-align:center;position:absolute;color:#000;z-index:9999999999;box-shadow:2px 2px 3px rgba(0,0,0,0.5);border:1px solid #CCC;background:rgba(255,255,255,0.9);border-top-right-radius:2px;border-bottom-left-radius:2px;font-family:"Arial";-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none';
	document.body.appendChild(search_panel);
	var search_item=document.createElement('div');
	search_item.style.cssText='width:100%;height:24px;line-height:24px;cursor:pointer';
	search_item.className='image-search-item';
	for(var i in setting.site_list){
		var search_item_child=search_item.cloneNode(true);
		search_item_child.textContent=i;
		search_item_child.setAttribute('search-option',i);
		search_panel.appendChild(search_item_child);
	}
	search_item.textContent='All';
	search_item.setAttribute('search-option','all');
	search_panel.appendChild(search_item);
	search_item_setting=search_item.cloneNode(true);
	search_item_setting.textContent='Setting';
	search_item_setting.setAttribute('search-option','setting');
	search_panel.appendChild(search_item_setting);
}

function call_setting(){
	var setting_panel=document.createElement('div');
	setting_panel.style.cssText='width:520px;font-size:14px;position:fixed;color:#000;z-index:9999999999;box-shadow:2px 2px 3px rgba(0,0,0,0.5);border:1px solid #CCC;background:rgba(255,255,255,0.9);border-top-right-radius:2px;border-bottom-left-radius:2px;padding:10px;left:0;right:0;top:0;bottom:0;margin:auto;font-family:"Arial";height:350px;max-height:90%;overflow:auto;text-align:center;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none';
	document.body.appendChild(setting_panel);
	var setting_header=document.createElement('div');
	setting_header.style.cssText='width:100%;height:32px;line-height:32px;font-size:18px;line-height:32px';
	setting_header.className='image-search-setting-header';
	setting_header.textContent='Search Image Setting';
	setting_panel.appendChild(setting_header);
	var setting_item=document.createElement('div');
	setting_item.style.cssText='width:100%;height:24px;line-height:24px;margin:1px 0';
	setting_item.className='image-search-setting-title';
	setting_item.innerHTML='<div style="text-align:center;display:inline-block;width:30px">多搜</div><div style="width:100px;text-align:center;display:inline-block">名称</div><div style="width:350px;text-align:center;display:inline-block">地址（图片地址以 {%s} 代替）</div><div style="width:20px;display:inline-block"></div>';
	setting_panel.appendChild(setting_item);
	for(var i in setting.site_list){
		var setting_item_child=setting_item.cloneNode(true);
		setting_item_child.className='image-search-setting-item';
		setting_item_child.innerHTML='<div style="text-align:center;display:inline-block;width:30px;vertical-align:middle"><input type="checkbox"'+(setting.site_option.join('\n').indexOf(i)>=0?' checked="checked"':'')+'></div><div style="width:100px;text-align:center;display:inline-block"><input style="width:90px" type="text" value="'+i+'"></div><div style="width:350px;text-align:center;display:inline-block"><input style="width:340px" type="text" value="'+setting.site_list[i]+'"></div><div style="text-align:center;display:inline-block;cursor:pointer;width:20px">×</div>';
		setting_panel.appendChild(setting_item_child);
		setting_item_child.getElementsByTagName('div')[3].onclick=function(){this.parentElement.outerHTML='';}
	}
	var setting_footer=document.createElement('div');
	setting_footer.style.cssText='width:100%;height:32px;line-height:32px;margin-top:5px;text-align:right';
	setting_footer.className='image-search-setting-footer';
	setting_panel.appendChild(setting_footer);
	var setting_hotkey=document.createElement('div');
	var setting_add=document.createElement('div');
	var setting_reset=document.createElement('div');
	var setting_save=document.createElement('div');
	var setting_cancel=document.createElement('div');
	setting_hotkey.style.cssText='height:32px;display:inline-block;text-align:left;float:left';
	setting_add.style.cssText='width:90px;height:32px;margin:0 5px;background:#666;color:#FFF;display:inline-block;text-align:center;cursor:pointer';
	setting_reset.style.cssText='width:90px;height:32px;background:#666;color:#FFF;display:inline-block;text-align:center;cursor:pointer';
	setting_save.style.cssText='width:90px;height:32px;margin:0 5px;background:#666;color:#FFF;display:inline-block;text-align:center;cursor:pointer';
	setting_cancel.style.cssText='width:90px;height:32px;background:#666;color:#FFF;display:inline-block;text-align:center;cursor:pointer';
	setting_add.textContent='Add Item';
	setting_reset.textContent='Reset';
	setting_save.textContent='Save';
	setting_cancel.textContent='Cancel';
	setting_hotkey.innerHTML='Hot Key <select><option value="ctrlKey"'+(setting.hot_key=='ctrlKey'?' selected':'')+'>Ctrl</option><option value="shiftKey"'+(setting.hot_key=='shiftKey'?' selected':'')+'>Shift</option><option value="altKey"'+(setting.hot_key=='altKey'?' selected':'')+'>Alt</option></select>';
	setting_footer.appendChild(setting_hotkey);
	setting_footer.appendChild(setting_add);
	setting_footer.appendChild(setting_reset);
	setting_footer.appendChild(setting_save);
	setting_footer.appendChild(setting_cancel);
	setting_add.onclick=function(){
		var setting_item_child=setting_item.cloneNode(true);
		setting_item_child.className='image-search-setting-item';
		setting_item_child.innerHTML='<div style="text-align:center;display:inline-block;width:30px;vertical-align:middle"><input type="checkbox"></div><div style="width:100px;text-align:center;display:inline-block"><input style="width:90px" type="text"></div><div style="width:350px;text-align:center;display:inline-block"><input style="width:340px" type="text"></div><div style="text-align:center;display:inline-block;cursor:pointer;width:20px">×</div>';
		setting_panel.insertBefore(setting_item_child,setting_footer);
		setting_item_child.getElementsByTagName('div')[3].onclick=function(){this.parentElement.outerHTML='';}
		setting_panel.scrollTop=setting_panel.scrollHeight;
	}
	setting_reset.onclick=function(){
		if(confirm('确定将所有设置初始化么？\n\n(初始化将清除所有所有设置，且不可逆)')==true){
			setting=default_setting;
			set_setting(setting);
			setting_panel.outerHTML='';
			if(search_panel!=null){
				search_panel.outerHTML='';
				search_panel=null;
			}
			call_setting();
		}
	}
	setting_save.onclick=function(){
		var setting_items=document.getElementsByClassName('image-search-setting-item');
		var setting_data={"site_list":{},"site_option":[],"hot_key":null};
		for(var i=0;i<setting_items.length;i++){
			if(setting_items[i].getElementsByTagName('input')[1].value!=''){
				if(setting_items[i].getElementsByTagName('input')[0].checked)setting_data.site_option.push(setting_items[i].getElementsByTagName('input')[1].value);
				setting_data.site_list[setting_items[i].getElementsByTagName('input')[1].value]=setting_items[i].getElementsByTagName('input')[2].value;
			}
		}
		setting_data.hot_key=setting_hotkey.getElementsByTagName('select')[0].value;
		console.log(setting_data);
		setting=setting_data;
		set_setting(setting);
		setting_panel.outerHTML='';
		if(search_panel!=null){
			search_panel.outerHTML='';
			search_panel=null;
		}
	}
	setting_cancel.onclick=function(){setting_panel.outerHTML='';}
}

document.onmousedown=function(event){
	console.log('Search Image >>\nevent.ctrlKey: '+event.ctrlKey+'\nevent.button: '+event.button+'\nevent.target.tagName: '+event.target.tagName+'\nevent.target.src: '+event.target.src+'\nevent.pageX: '+event.pageX+'\nevent.pageY: '+event.pageY+'\ndocument.documentElement.clientWidth: '+document.documentElement.clientWidth+'\ndocument.documentElement.clientHeight: '+document.documentElement.clientHeight+'\ndocument.documentElement.scrollLeft: '+document.documentElement.scrollLeft+'\ndocument.documentElement.scrollTop: '+document.documentElement.scrollTop);
	if(disable_contextmenu==true){
		document.oncontextmenu=null;
		disable_contextmenu=false;
	}
	if(event[setting.hot_key]==true&&event.button==2&&event.target.tagName.toLowerCase()=='img'&&event.target.src!=null){
		if(search_panel==null)create_panel();
		else search_panel.style.display='block';
		search_panel.style.left=(document.documentElement.clientWidth+document.body.scrollLeft-event.pageX>=200?event.pageX:event.pageX>=200?event.pageX-200:0)+'px';
		search_panel.style.top=(document.documentElement.scrollHeight-event.pageY>=search_panel.scrollHeight?event.pageY:event.pageY>=search_panel.scrollHeight?event.pageY-search_panel.scrollHeight:0)+'px';
		img_src=event.target.src;
		disable_contextmenu=true;
		//for(var i=0;i<setting.site_option.length;i++)GM_openInTab(setting.site_list[setting.site_option[i]].replace(/\{%s\}/,encodeURIComponent(event.target.src)));
		document.oncontextmenu=function(){return false;}
	}
	else{
		if(event.target.className=='image-search-item'&&event.button==0){
			if(event.target.getAttribute('search-option')=='all')for(var i=0;i<setting.site_option.length;i++)GM_openInTab(setting.site_list[setting.site_option[i]].replace(/\{%s\}/,encodeURIComponent(img_src)));
			else if(event.target.getAttribute('search-option')=='setting')call_setting();
			else GM_openInTab(setting.site_list[event.target.getAttribute('search-option')].replace(/\{%s\}/,encodeURIComponent(img_src)));
		}
		if(search_panel!=null)search_panel.style.display='none';
	}
}

GM_registerMenuCommand('Search Image Setting',call_setting);