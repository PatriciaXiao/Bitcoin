/* variables */
var FILE_DIR = "data/";
var G_WIDTH1 = $(window).width();//960;
var G_HEIGHT1 = $(window).height();//600;
//var width = document.getElementById("block_graph").clientWidth;
//var height = document.getElementById("block_graph").clientHeight;
var SIZE_UNIT = 5;
var AMOUNT_UNIT = 1000000;
// https://github.com/mbostock/d3/wiki/Ordinal-Scales#category20
var COLOR_ADDR = "#e7ba52";
var COLOR_PERSON = "#8ca252";//"#637939";
var COLOR_PALE = "#aaaaaa";
var COLOR_VIRTUAL = "#fdae6b"; // virtual nodes (stand for transaction)

var COLOR_HIGHLIGHT = "#d62728";

var LIST_LEN_THRESHOLD = 8;
//var UP_DOWN_SCROLL_STYLE = "width:100%;height:150px;line-height:3em;overflow:auto;padding:5px;";
var UP_DOWN_SCROLL_STYLE = "width:100%;height:150px;overflow:auto;padding:1px;";
var DATE_TYPE = 1;//0;

/* js could be loaded dynamically this way:
 * however after examine others' code carefully I didn't see any necessarity of doing such things
 */
/*
new_element=document.createElement("script");
new_element.setAttribute("type","text/javascript");
new_element.setAttribute("src", "./javascript/d3.js");
document.head.appendChild(new_element);
*/

// functions about block
//var RAW_DATA;
//var GRAPH_DAT;
//var ADDR_LIST = new Map(); // function included in mymap.js


/* functions */
// time-stamp
// reference: http://www.cnblogs.com/yjf512/p/3796229.html
function formatDate(now, type) { // type 0: newDate.toGMTString(), type 1:
	var newDate = new Date();
	newDate.setTime(now * 1000);
	var DateString = "";
	switch (type) {
		case 0:
			// Wed Jun 18 2014 
			// console.log(newDate.toDateString());
			// Wed, 18 Jun 2014 02:33:24 GMT 
			// console.log(newDate.toGMTString());
			DateString = newDate.toGMTString();
			break;
		case 1:
			var UTC_date = newDate.getUTCDate(); // int 1~31, in a month
			var UTC_day = newDate.getUTCDay(); // 0~6, 0 for sunday, 1 for monday, etc.
			var UTC_mon = newDate.getUTCMonth(); // month
			var UTC_year = newDate.getUTCFullYear();
			var UTC_hour = newDate.getUTCHours();
			// dateObj.getUTCMilliseconds()
			var UTC_min = newDate.getUTCMinutes();
			var UTC_sec = newDate.getUTCSeconds();
			DateString = UTC_year+"/"+UTC_mon+"/"+UTC_date+" "+UTC_hour+":"+UTC_min+":"+UTC_sec;
			break;
		//case 2:
		default: 
			DateString = "Unknown type";
			break;
	}
	return DateString;
}
function FormatDateList(array) {
	var date_list = [];
	for (var i = 0; i < array.length; i++) {
		date_list[i] = formatDate(array[i], DATE_TYPE);
	}
	return date_list;
}
function PrintDateList(array, iomark) {
	var print_list = [];
	var date_list = FormatDateList(array);
	var iostatus;
	switch(iomark[0]) {
		case 0: iostatus = "receive"; break; // in the output list
		case 1: iostatus = "pay"; break; // in the input list
		default: iostatus = "unknown"; break;
	}
	print_list[0] = iostatus + " at: " + formatDate(array[0], DATE_TYPE);
	for (var i = 1; i < array.length; i++) {
		switch(iomark[i]) {
			case 0: iostatus = "receive"; break; // in the output list
			case 1: iostatus = "pay"; break; // in the input list
			default: iostatus = "unknown"; break;
		}
		print_list[i] = "<br>" + iostatus + " at: " + formatDate(array[i], DATE_TYPE);
	}	
	return print_list;
}

function PrintValueList(time, amount) {
	var date_list = FormatDateList(time);
	var print_list = [];
	print_list[0] = "<br>" + "transact " + amount[0] / AMOUNT_UNIT + " at: " + date_list[0];
	for (var i = 1; i < time.length; i++) {
		print_list[i] = "<br>" + "transact " + amount[i] / AMOUNT_UNIT + " at: " + date_list[i];
	}
	return print_list;
}

// the entrance of drawing the block
function showblock() {
	var goal_block = block_height.value;
	var goal_file = FILE_DIR + goal_block + ".json";
	var block_view = $("input[name='block_view_type']:checked").val();
	var graph;
	var ADDR_LIST = new Map();
	d3.json(goal_file, function(error, rawdata) {
		if (error) throw error;
		ShowBlockInfo(rawdata);
		if(block_view == "merge") {
			//RAW_DATA = rawdata;
			//GRAPH_DAT = init_graph_data(rawdata);
			graph = init_graph_data(rawdata, ADDR_LIST);
			update(graph);			
		}
		else {
			// no_merge
			//graph = showblock_without_merge(rawdata);
			graph = init_graph_data_without_merge(rawdata);
			update_without_merge(graph);
			//update(graph);
		}
	});
}
/*
function hello() {
	//document.getElementById("graph_content").className = "col-md-12";
	//var hey = new Node();
	//Node("hey?");
}
//*/
function ShowNodeInfo(d) {
	var list_description_addr = document.getElementById("node_description_addr");
	var list_description_time = document.getElementById("node_description_time");
	var list_description_value = document.getElementById("node_description_value");
	if(d.time.length <= LIST_LEN_THRESHOLD) {
		list_description_time.setAttribute("style", "");
		list_description_value.setAttribute("style", "");
	}
	else {
		list_description_time.setAttribute("style", UP_DOWN_SCROLL_STYLE);
		list_description_value.setAttribute("style", UP_DOWN_SCROLL_STYLE);
	}
	list_description_addr.innerHTML = "address: "+d.addr;
	list_description_time.innerHTML = PrintDateList(d.time, d.status);
	list_description_value.innerHTML = PrintValueList(d.time, d.amount);
}

function ShowBlockInfo(rawdata) {
	var list_description_block = document.getElementById("block_basic_info");
	var block_hash = rawdata.blocks[0].hash;
	var block_time = rawdata.blocks[0].time;
	var block_fee = rawdata.blocks[0].fee;
	var block_n_tx = rawdata.blocks[0].n_tx;
	var block_time_type = "";
	if (DATE_TYPE == 0) {
		block_time_type = "GMT";
	}
	else if (DATE_TYPE == 1) {
		block_time_type = "UTC";
	}
	else {
		block_time_type = "unknown";
	}
	list_description_block.innerHTML = 
		"hash: "+block_hash+"<br>"
		+"time: "+formatDate(block_time, DATE_TYPE)+"<br>"
		+"fee: "+block_fee+"<br>"
		+"number of transactions: "+block_n_tx+"<br>"
		+"time format: "+block_time_type;
}