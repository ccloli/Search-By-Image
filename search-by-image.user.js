// ==UserScript==
// @name        Search By Image
// @version     1.6.4
// @description Search By Image | 以图搜图
// @match       <all_urls>
// @include     *
// @author      864907600cc
// @icon        http://1.gravatar.com/avatar/147834caf9ccb0a66b2505c753747867
// @run-at      document-start
// @grant       GM.getValue
// @grant       GM.setValue
// @grant       GM.openInTab
// @grant       GM.registerMenuCommand
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_openInTab
// @grant       GM_registerMenuCommand
// @updateURL   https://github.com/ccloli/Search-By-Image/raw/master/search-by-image.user.js
// @downloadURL https://github.com/ccloli/Search-By-Image/raw/master/search-by-image.user.js
// @updateURL   https://greasyfork.org/scripts/2998/code.meta.js
// @downloadURL https://greasyfork.org/scripts/2998/code.user.js
// @updateURL   http://ext.ccloli.com/search-by-image/search-by-image.user.js
// @downloadURL http://ext.ccloli.com/search-by-image/search-by-image.user.js
// @namespace   http://ext.ccloli.com
// ==/UserScript==


// 本脚本基于 GPLv3 协议开源 http://www.gnu.org/licenses/gpl.html
// (c) 86497600cc. Some Rights Reserved.
// Default setting: Press Ctrl and click right key on a image to search.

'use strict';
var default_setting = {
	"site_list": {
		"Google": "https://www.google.com/searchbyimage?image_url={%s}",
		"Baidu": "https://image.baidu.com/n/pc_search?queryImageUrl={%s}&fm=result_camera&uptype=paste&drag=1",
		"Bing": "https://www.bing.com/images/searchbyimage?cbir=sbi&iss=sbi&imgurl={%s}",
		"TinEye": "https://www.tineye.com/search?url={%s}",
		//"Cydral": "http://www.cydral.com/#url={%s}",
		"Yandex": "https://yandex.ru/images/search?rpt=imageview&img_url={%s}", // change "Яндекс (Yandex)" to "Yandex"
		"Sogou": "https://pic.sogou.com/ris?query={%s}&flag=1&drag=0",
		"360 ShiTu": "http://st.so.com/stu?imgurl={%s}",
		"SauceNAO": "https://saucenao.com/search.php?db=999&url={%s}",
		"IQDB": "https://iqdb.org/?url={%s}",
		"3D IQDB": "https://3d.iqdb.org/?url={%s}",
		"WhatAnime": "https://trace.moe/?url={%s}",
		"Ascii2D": "https://ascii2d.net/search/url/{%s}"
	},
	"site_option": ["Google", "Baidu", "Bing", "TinEye", "Yandex", "Sogou", "360 ShiTu", "SauceNAO", "IQDB", "3D IQDB", "WhatAnime", "Ascii2D"],
	"hot_key": "ctrlKey",
	"server_url": "//sbi.ccloli.com/img/upload.php"
};

/*var server_url = "//sbi.ccloli.com/img/upload.php";*/
// 请直接在设置页进行设置（Firefox 请尽量选择支持 https 的服务器）
// 地址前使用"//"表示按照当前页面设定决定是否使用 https
// 地址前使用"http://"表示强制使用 http
// 地址前使用"https://"表示强制使用 https（需确认服务器支持 ssl）
// 如果需要自己架设上传服务器的话请访问 GitHub 项目页（https://github.com/ccloli/Search-By-Image）获取服务端
// 其他可用的上传服务器如下：
// Heroku: //search-by-image.herokuapp.com/img/upload.php （支持 https）
// BeGet: http://fh13121a.bget.ru/img/upload.php （不支持 https）
// OpenShift: //searchbyimage-864907600cc.rhcloud.com/img/upload.php （支持 https）
// DigitalOcean VPS: //sbi.ccloli.com/img/upload.php （支持 https，thanks to Retaker）
// 注意，部分服务器可能仅支持 http 协议，若您选择了这些服务器，请务必注明 "http://"，且若您使用的是 Firefox 浏览器，在 https 页面下将不能上传文件搜索搜索（除非设置 security.mixed_content.block_active_content 为 false）

var search_panel = null;
var setting = default_setting;
var disable_contextmenu = false;
var img_src = null;
var data_version = 0;
var last_update = 0;
var xhr = new XMLHttpRequest();
var reader = new FileReader();
reader.onload = function(file) {
	upload_file(this.result);
};
var asyncGMAPI = false;

var i18n = {
	'zh': {
		'u2s': '上传图片并搜索',
		'dh': '拖拽文件至此',
		'ca': '确认终止上传文件吗？',
		'a': '多搜',
		'n': '名称',
		'l': '地址（图片地址以 {%s} 代替）',
		'cr': '确定将所有设置初始化么？\n(初始化将清除所有所有设置，且不可逆)',
		'us': '上传完成！',
		'uf': '上传失败！',
		'sh': '热键',
		'sa': '添加',
		'sr': '重置',
		'ss': '保存',
		'sc': '取消'
	},
	'en': {
		'u2s': 'Upload image to search',
		'dh': 'Drag file to here',
		'ca': 'Are you sure to cancel uploading?',
		'a': 'All',
		'n': 'Name',
		'l': 'Location (Image URL should be replace with {%s})',
		'cr': 'Are you sure to reset all preferences (irreversible) ?',
		'us': 'Upload finished!',
		'uf': 'Upload failed!',
		'sh': 'Hot Key',
		'sa': 'Add',
		'sr': 'Reset',
		'ss': 'Save',
		'sc': 'Cancel'
	}
};
var lang = i18n[navigator.language] ? navigator.language : navigator.languages ? navigator.languages.filter(function(elem){
	return i18n[elem];
})[0] : null;
if (lang == null) lang = 'en';

var getValue;
if (typeof GM_getValue === 'undefined' && typeof GM !== 'undefined') {
	self.GM_getValue = GM.getValue;
	self.GM_setValue = GM.setValue;
	self.GM_openInTab = GM.openInTab;
	self.GM_registerMenuCommand = GM.registerMenuCommand;
	getValue = GM.getValue;
	asyncGMAPI = true;
}
else {
	getValue = function(key, init) {
		return new Promise(function(resolve, reject){
			try {
				resolve(GM_getValue(key, init));
			}
			catch(e) {
				reject(e);
			}
		});
	};
}

function init() {
	return Promise.all([getValue('setting'), GM_getValue('version', 0), GM_getValue('timestamp', 0)]).then(function(res) {
		var s = res[0], v = res[1], t = res[2];
		setting = s ? JSON.parse(s) : default_setting;
		data_version = v;
		last_update = t;

		if (data_version < 6) {
			if (data_version < 5) {
				if (data_version < 4) {
					var new_site_list = {};
					var new_site_option = [];

					for (var i in setting.site_list) {
						// use for loop to keep order, will use array in 2.x
						switch (i) {
							case 'Baidu ShiTu':
							case 'Baidu Image':
								new_site_list['Baidu'] = default_setting.site_list['Baidu'];
								break;

							case 'Bing':
							case 'Sogou':
								new_site_list[i] = default_setting.site_list[i];
								break;

							default:
								new_site_list[i] = setting.site_list[i];
						}
					}
					new_site_list['WhatAnime'] = default_setting.site_list['WhatAnime'];

					for (var i = 0; i < setting.site_option.length; i++) {
						if ((setting.site_option[i] === 'Baidu ShiTu' || setting.site_option[i] === 'Baidu Image') && !(/,?Baidu,?/.test(new_site_option.join(',')))) {
							new_site_option.push('Baidu');
						}
						else {
							new_site_option.push(setting.site_option[i]);
						}
					}
					new_site_option.push('WhatAnime');

					setting.site_list = new_site_list;
					setting.site_option = new_site_option;
				}

				setting.site_list['Ascii2D'] = default_setting.site_list['Ascii2D'];
				setting.site_option.push('Ascii2D');
			}
			if (setting.site_list['WhatAnime']) {
				setting.site_list['WhatAnime'] = default_setting.site_list['WhatAnime'];
				set_setting(setting);
			}
			GM_setValue('version', data_version = 6);
		}

		var repeatTest = {};
		var finalOpt = [];
		for (var i = 0, len = setting.site_option.length; i < len; i++) {
			var cur = setting.site_option[i];
			if (!repeatTest[cur] && setting.site_list[cur]) {
				finalOpt.push(cur);
				repeatTest[cur] = 1;
			}
		}
		setting.site_option = finalOpt;

		if (setting.server_url == null || setting.server_url == '') {
			setting.server_url = default_setting.server_url;
			set_setting(setting);
		}
	});
}

var server_url = setting.server_url;

function set_setting(data) {
	GM_setValue('setting', JSON.stringify(data));
	GM_setValue('timestamp', new Date().getTime());
}

function create_panel() {
	search_panel = document.createElement('div');
	search_panel.style.cssText = 'width: 198px; font-size: 14px; text-align: center; position: absolute; color: #000; z-index: 9999999999; box-shadow: 2px 2px 3px rgba(0, 0, 0, 0.5); border: 1px solid #CCC; background: rgba(255, 255, 255, 0.9); border-top-right-radius: 2px; border-bottom-left-radius: 2px; font-family: "Arial"; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none;';
	document.body.appendChild(search_panel);
	var search_top = document.createElement('div');
	search_top.style.cssText = 'height: 24px; line-height: 24px; font-size: 12px; overflow: hidden; margin: 0 auto; padding: 0 5px;';
	search_top.className = 'image-search-top';
	search_top.innerHTML = '<div class="search_top_url" style="overflow: hidden; white-space: nowrap; text-overflow: ellipsis; width: 100%; height: 24px;"></div><div class="search_top_file" style="width: 100%; height: 24px; line-height: 24px;" draggable="true"><label for="image-search-file">' + i18n[lang]['u2s'] + '</label><input type="file" id="image-search-file" accept="image/*" style="width: 0px; height: 0px; max-height: 0px; max-width: 0px; margin: 0; padding: 0;"></div><div class="search_top_progress"><progress style="width: 100%; height: 16px; vertical-align: middle; margin: 4px 0;" max="1"></progerss></div><style>.image-search-item{color: #000000; transition: all 0.2s linear; -webkit-transition: all 0.1s linear;}.image-search-item:hover{background: #eeeeee;}</style>';
	search_panel.appendChild(search_top);
	var search_item = document.createElement('div');
	search_item.style.cssText = 'width: 100%; height: 24px; line-height: 24px; cursor: pointer;';
	search_item.className = 'image-search-item';
	for (var i in setting.site_list) {
		var search_item_child = search_item.cloneNode(true);
		search_item_child.textContent = i;
		search_item_child.setAttribute('search-option', i);
		search_panel.appendChild(search_item_child);
	}
	search_item.textContent = 'All';
	search_item.setAttribute('search-option', 'all');
	search_panel.appendChild(search_item);
	var search_item_setting = search_item.cloneNode(true);
	search_item_setting.textContent = 'Setting';
	search_item_setting.setAttribute('search-option', 'setting');
	search_panel.appendChild(search_item_setting);
	search_top.getElementsByTagName('input')[0].onchange = function() {
		reader.readAsDataURL(this.files[0]);
	};
	search_panel.ondragenter = function(event) {
		event.preventDefault();
		search_top.getElementsByTagName('label')[0].textContent = i18n[lang]['dh'];
	};
	search_panel.ondragleave = function(event) {
		event.preventDefault();
		search_top.getElementsByTagName('label')[0].textContent = i18n[lang]['u2s'];
	};
	search_panel.ondragover = function(event) {
		search_top.getElementsByTagName('label')[0].textContent = i18n[lang]['dh'];
		event.preventDefault();
	};
	search_panel.ondrop = function(event) {
		event.stopPropagation();
		event.preventDefault();
		var files = event.target.files || event.dataTransfer.files;
		if (files[files.length - 1].type.indexOf('image') >= 0) reader.readAsDataURL(files[files.length - 1]);
	};
	search_top.getElementsByTagName('progress')[0].onclick = function() {
		if (xhr.readyState != 0 && confirm(i18n[lang]['ca']) == true) {
			xhr.abort();
			search_panel.getElementsByClassName('search_top_url')[0].style.marginTop = '-24px';
		}
	};
	if (navigator.userAgent.indexOf('Firefox') >= 0) {
		var paste_node_firefox = document.createElement('div');
		paste_node_firefox.setAttribute('contenteditable', 'true');
		paste_node_firefox.className = 'image-search-paste-node-firefox';
		paste_node_firefox.style.cssText = 'width: 0!important; height: 0!important; position: absolute; overflow: hidden;';
		paste_node_firefox.addEventListener('paste', get_clipboard, false);
		search_top.appendChild(paste_node_firefox);
	}
}

function call_setting() {
	var setting_panel = document.createElement('div');
	setting_panel.style.cssText = 'width: 520px; font-size: 14px; position: fixed; color: #000; z-index: 9999999999; box-shadow: 2px 2px 3px rgba(0, 0, 0, 0.5); border: 1px solid #CCC; background: rgba(255, 255, 255, 0.9); border-top-right-radius: 2px; border-bottom-left-radius: 2px; padding: 10px; left: 0; right: 0; top: 0; bottom: 0; margin: auto; font-family: "Arial"; height: 400px; max-height: 90%; overflow: auto; text-align: center; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none;';
	document.body.appendChild(setting_panel);
	var setting_header = document.createElement('div');
	setting_header.style.cssText = 'width: 100%; height: 32px; line-height: 32px; font-size: 18px; line-height: 32px;';
	setting_header.className = 'image-search-setting-header';
	setting_header.textContent = 'Search By Image Setting';
	setting_panel.appendChild(setting_header);
	var setting_item = document.createElement('div');
	setting_item.style.cssText = 'width: 100%; height: 24px; line-height: 24px; margin: 1px 0;';
	setting_item.className = 'image-search-setting-title';
	setting_item.innerHTML = '<div style="text-align: center; display: inline-block; width: 30px;">' + i18n[lang]['a'] + '</div><div style="width: 100px; text-align: center; display: inline-block;">' + i18n[lang]['n'] + '</div><div style="width: 350px; text-align: center; display: inline-block;">' + i18n[lang]['l'] + '</div><div style="width: 20px; display: inline-block;"></div>';
	setting_panel.appendChild(setting_item);
	for (var i in setting.site_list) {
		var setting_item_child = setting_item.cloneNode(true);
		setting_item_child.className = 'image-search-setting-item';
		setting_item_child.innerHTML = '<div style="text-align: center; display: inline-block; width: 30px; vertical-align: middle;"><input type="checkbox"' + (setting.site_option.join('\n').indexOf(i) >= 0 ? ' checked="checked"' : '') + '></div><div style="width: 100px; text-align: center; display: inline-block;"><input style="width: 90px;" type="text" value="' + i + '"></div><div style="width: 350px; text-align: center; display: inline-block;"><input style="width: 340px;" type="text" value="' + setting.site_list[i] + '"></div><div style="text-align: center; display: inline-block; cursor: pointer; width: 20px;">×</div>';
		setting_panel.appendChild(setting_item_child);
		setting_item_child.getElementsByTagName('div')[3].onclick = function() {
			var parent = this.parentElement;
			parent.parentElement.removeChild(parent);
		};
	}
	var setting_server = document.createElement('div');
	setting_server.className = 'image-search-setting-server';
	setting_server.innerHTML = 'Upload Server <input type="text" value="' + setting['server_url'] + '" placeholder="//sbi.ccloli.com/img/upload.php" style="width: 350px;">';
	setting_panel.appendChild(setting_server);
	var setting_footer = document.createElement('div');
	setting_footer.style.cssText = 'width: 100%; height: 32px; line-height: 32px; margin-top: 5px; text-align: right;';
	setting_footer.className = 'image-search-setting-footer';
	setting_panel.appendChild(setting_footer);
	var setting_hotkey = document.createElement('div');
	var setting_add = document.createElement('div');
	var setting_reset = document.createElement('div');
	var setting_save = document.createElement('div');
	var setting_cancel = document.createElement('div');
	setting_hotkey.style.cssText = 'height: 32px; display: inline-block; text-align: left; float: left;';
	setting_add.style.cssText = 'width: 90px; height: 32px; margin: 0 5px; background: #666; color: #FFF; display: inline-block; text-align: center; cursor: pointer;';
	setting_reset.style.cssText = 'width: 90px; height: 32px; background: #666; color: #FFF; display: inline-block; text-align: center; cursor: pointer;';
	setting_save.style.cssText = 'width: 90px; height: 32px; margin: 0 5px; background: #666; color: #FFF; display: inline-block; text-align: center; cursor: pointer;';
	setting_cancel.style.cssText = 'width: 90px; height: 32px; background: #666; color: #FFF; display: inline-block; text-align: center; cursor: pointer;';
	setting_add.textContent = i18n[lang]['sa'];
	setting_reset.textContent = i18n[lang]['sr'];
	setting_save.textContent = i18n[lang]['ss'];
	setting_cancel.textContent = i18n[lang]['sc'];
	setting_hotkey.innerHTML = i18n[lang]['sh'] + ' <select><option value="ctrlKey"' + (setting.hot_key == 'ctrlKey' ? ' selected' : '') + '>Ctrl</option><option value="shiftKey"' + (setting.hot_key == 'shiftKey' ? ' selected' : '') + '>Shift</option><option value="altKey"' + (setting.hot_key == 'altKey' ? ' selected' : '') + '>Alt</option></select>';
	setting_footer.appendChild(setting_hotkey);
	setting_footer.appendChild(setting_add);
	setting_footer.appendChild(setting_reset);
	setting_footer.appendChild(setting_save);
	setting_footer.appendChild(setting_cancel);
	setting_add.onclick = function() {
		var setting_item_child = setting_item.cloneNode(true);
		setting_item_child.className = 'image-search-setting-item';
		setting_item_child.innerHTML = '<div style="text-align: center; display: inline-block; width: 30px; vertical-align: middle;"><input type="checkbox"></div><div style="width: 100px; text-align: center; display: inline-block;"><input style="width: 90px;" type="text"></div><div style="width: 350px; text-align: center; display: inline-block;"><input style="width: 340px;" type="text"></div><div style="text-align: center; display: inline-block; cursor: pointer; width: 20px;">×</div>';
		setting_panel.insertBefore(setting_item_child, setting_footer);
		setting_item_child.getElementsByTagName('div')[3].onclick = function() {
			var parent = this.parentElement;
			parent.parentElement.removeChild(parent);
		};
		setting_panel.scrollTop = setting_panel.scrollHeight;
	};
	setting_reset.onclick = function() {
		if (confirm(i18n[lang]['cr']) == true) {
			setting = default_setting;
			set_setting(setting);
			setting_panel.outerHTML = '';
			if (search_panel != null) {
				search_panel.parentElement && search_panel.parentElement.removeChild(search_panel);
				search_panel = null;
			}
			call_setting();
		}
	};
	setting_save.onclick = function() {
		var setting_items = document.getElementsByClassName('image-search-setting-item');
		var setting_data = {
			"site_list": {},
			"site_option": [],
			"hot_key": null,
			"server_url": null
		};
		for (var i = 0; i < setting_items.length; i++) {
			if (setting_items[i].getElementsByTagName('input')[1].value != '') {
				if (setting_items[i].getElementsByTagName('input')[0].checked) setting_data.site_option.push(setting_items[i].getElementsByTagName('input')[1].value);
				setting_data.site_list[setting_items[i].getElementsByTagName('input')[1].value] = setting_items[i].getElementsByTagName('input')[2].value;
			}
		}
		setting_data.hot_key = setting_hotkey.getElementsByTagName('select')[0].value;
		setting_data.server_url = document.getElementsByClassName('image-search-setting-server')[0].getElementsByTagName('input')[0].value;
		if (setting_data.server_url == null || setting_data.server_url == '') {
			setting_data.server_url = default_setting.server_url;
		}
		setting = setting_data;
		server_url = setting.server_url;
		set_setting(setting);
		document.body.removeChild(setting_panel);
		if (search_panel != null) {
			search_panel.parentElement && search_panel.parentElement.removeChild(search_panel);
			search_panel = null;
		}
	};
	setting_cancel.onclick = function() {
		document.body.removeChild(setting_panel);
	};
}

function upload_file(data) {
	if (xhr.readyState != 0) xhr.abort();
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if (xhr.status == 200) {
				img_src = xhr.responseText;
				search_panel.getElementsByClassName('search_top_url')[0].style.marginTop = '0px';
				search_panel.getElementsByClassName('search_top_url')[0].textContent = i18n[lang]['us'];
			}
		}
	};
	xhr.upload.onprogress = function(event) {
		search_panel.getElementsByTagName('progress')[0].value = event.loaded / event.total;
	};
	xhr.onerror = function() {
		alert(i18n[lang]['uf']);
	};
	var form = new FormData();
	xhr.open('POST', server_url);
	form.append('imgdata', data);
	xhr.send(form);
	search_panel.getElementsByClassName('search_top_url')[0].style.marginTop = '-48px';
}

function get_clipboard(event) {
	var items = event.clipboardData.items;
	if (items[items.length - 1].type.indexOf('image') >= 0) reader.readAsDataURL(items[items.length - 1].getAsFile());
}

function hide_panel() {
	if (!search_panel || !search_panel.parentElement) return;
	img_src = null;
	search_panel.parentElement && search_panel.parentElement.removeChild(search_panel); // Remove search panel to fix the bug that it may be left in some WYSIWYG editor (eg. MDN WYSIWYG editor). See issue: http://tieba.baidu.com/p/3682475061
	document.removeEventListener('paste', get_clipboard, false);
}

function upload_blob_url(url) {
	if (!url) return;
	var req = new XMLHttpRequest();
	req.open('GET', url);
	req.responseType = 'blob';
	req.onload = function() {
		reader.readAsDataURL(req.response);
	};
	req.onerror = function() {
		alert(i18n[lang]['uf']);
	};
	req.send();
}

document.addEventListener('mousedown', function(event) {
	//console.log('Search Image >>\nevent.ctrlKey: '+event.ctrlKey+'\nevent.button: '+event.button+'\nevent.target:'+event.target+'\nevent.target.tagName: '+event.target.tagName+'\nevent.target.src: '+event.target.src+'\nevent.pageX: '+event.pageX+'\nevent.pageY: '+event.pageY+'\ndocument.documentElement.clientWidth: '+document.documentElement.clientWidth+'\ndocument.documentElement.clientHeight: '+document.documentElement.clientHeight+'\ndocument.documentElement.scrollWidth: '+document.documentElement.scrollWidth+'\ndocument.documentElement.scrollHeight: '+document.documentElement.scrollHeight+'\ndocument.documentElement.scrollLeft: '+document.documentElement.scrollLeft+'\ndocument.documentElement.scrollTop: '+document.documentElement.scrollTop);
	if (disable_contextmenu == true) {
		document.oncontextmenu = null;
		disable_contextmenu = false;
	}
	if (event[setting.hot_key] == true && event.button == 2) {
		if (search_panel == null) create_panel();
		// GM 4.x api is async, so we cannot update it in time
		else {
			if (!asyncGMAPI) {
				if (last_update != GM_getValue('timestamp', 0)) {
					last_update = GM_getValue('timestamp', 0);
					search_panel.parentElement && search_panel.parentElement.removeChild(search_panel);
					setting = GM_getValue('setting') ? JSON.parse(GM_getValue('setting')) : default_setting;
					create_panel();
				}
				else document.body.appendChild(search_panel);
			}
			else {
				document.body.appendChild(search_panel);
				GM_getValue('timestamp', 0).then(function (t) {
					if (last_update != t) {
						last_update = t;
						search_panel.parentElement && search_panel.parentElement.removeChild(search_panel);
						GM_getValue('setting').then(function (s) {
							setting = s ? JSON.parse(s) : default_setting;
						});
					}
				});
			}
		}
		search_panel.style.left = (document.documentElement.offsetWidth + (document.documentElement.scrollLeft || document.body.scrollLeft) - event.pageX >= 200 ? event.pageX : event.pageX >= 200 ? event.pageX - 200 : 0) + 'px';
		search_panel.style.top = (event.pageY + search_panel.offsetHeight < (document.documentElement.scrollTop || document.body.scrollTop) + document.documentElement.clientHeight ? event.pageY : event.pageY >= search_panel.scrollHeight ? event.pageY - search_panel.offsetHeight : 0) + 'px';
		// Firefox doesn't support getComputedStyle(element).marginLeft/marginRight and it would return "0px" while the element's margin is "auto". See bugzila/381328.
		//search_panel.style.marginLeft = '-' + (navigator.userAgent.indexOf('Firefox') < 0 ? getComputedStyle(document.body).marginLeft : (document.documentElement.offsetWidth - document.body.offsetWidth) / 2 + 'px');
		//search_panel.style.marginTop = '-' + getComputedStyle(document.body).marginTop;
		disable_contextmenu = true;
		document.oncontextmenu = function() {
			return false;
		};
		if (event.target.tagName.toLowerCase() == 'img' && event.target.src != null) {
			search_panel.getElementsByClassName('search_top_url')[0].style.marginTop = '0px';
			search_panel.getElementsByClassName('search_top_url')[0].textContent = event.target.src;
			if (/^data:\s*.*?;\s*base64,\s*/.test(event.target.src)) upload_file(event.target.src);
			else if (/^(?:blob:|filesystem:)/.test(event.target.src)) upload_blob_url(event.target.src);
			else img_src = event.target.src;
		}
		else {
			search_panel.getElementsByClassName('search_top_url')[0].style.marginTop = '-24px';
			var firefoxPasteNode = document.getElementsByClassName('image-search-paste-node-firefox')[0];
			if (navigator.userAgent.indexOf('Firefox') >= 0 && firefoxPasteNode) {
				firefoxPasteNode.innerHTML = '';
				firefoxPasteNode.focus();
			}
			else document.addEventListener('paste', get_clipboard, false);
		}
	}
	else if (search_panel != null) {
		if (event.target.compareDocumentPosition(search_panel) == 10 || event.target.compareDocumentPosition(search_panel) == 0) {
			if (event.target.className == 'image-search-item' && event.button == 0) {
				switch (event.target.getAttribute('search-option')) {
					case 'all':
						if (img_src != null) {
							for (var i = setting.site_option.length - 1; i >= 0; i--) {
								var rsrc = img_src;
								var turl = setting.site_list[setting.site_option[i]];
								if (turl.substr(0, turl.indexOf('{%s}')).indexOf('?') >= 0) {
									rsrc = encodeURIComponent(img_src);
								}
								GM_openInTab(turl.replace(/\{%s\}/, rsrc), event[setting.hot_key]);
							}
							hide_panel();
						}
						break;
					case 'setting':
						call_setting();
						hide_panel();
						break;
					default:
						if (img_src != null) {
							var rsrc = img_src;
							var turl = setting.site_list[event.target.getAttribute('search-option')];
							if (turl.substr(0, turl.indexOf('{%s}')).indexOf('?') >= 0) {
								rsrc = encodeURIComponent(img_src);
							}

							GM_openInTab(turl.replace(/\{%s\}/, rsrc), event[setting.hot_key]);
							hide_panel();
						}
				}
			}
			else if (event.button != 0) hide_panel();
		}
		else hide_panel();
	}
}, true);

if (typeof GM_registerMenuCommand !== 'undefined') {
	var gm_callsetting = GM_registerMenuCommand('Search By Image Setting', call_setting);
}
init();