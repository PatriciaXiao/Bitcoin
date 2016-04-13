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

var COLOR_HIGHLIGHT = "#d62728";

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
var RAW_DATA;
var GRAPH_DAT;
var ADDR_LIST = new Map(); // function included in mymap.js


/* functions */
// time-stamp
// reference: http://www.cnblogs.com/yjf512/p/3796229.html
function formatDate(now) {
	var newDate = new Date();
	newDate.setTime(now * 1000);
	// Wed Jun 18 2014 
	// console.log(newDate.toDateString());
	// Wed, 18 Jun 2014 02:33:24 GMT 
	// console.log(newDate.toGMTString());
	return newDate.toGMTString();
}
function FormatDateList(array) {
	var date_list = [];
	for (var i = 0; i < array.length; i++) {
		date_list[i] = formatDate(array[i]);
	}
	return date_list;
}
function PrintDateList(array, iomark) {
	var print_list = [];
	var date_list = FormatDateList(array);
	for (var i = 0; i < array.length; i++) {
		var iostatus;
		switch(iomark[i]) {
			case 0: iostatus = "input"; break; // in the output list
			case 1: iostatus = "output"; break; // in the input list
			default: iostatus = "unknown"; break;
		}
		print_list[i] = "<br>" + iostatus + " at: " + formatDate(array[i]);
	}	
	return print_list;
}

function PrintValueList(time, amount) {
	var date_list = FormatDateList(time);
	var print_list = [];
	for (var i = 0; i < time.length; i++) {
		print_list[i] = "<br>" + "transact " + amount[i] / AMOUNT_UNIT + " at: " + date_list[i];
	}
	return print_list;
}

function showblock() {
	var goal_block = block_height.value;
	var goal_file = FILE_DIR + goal_block + ".json";
	var block_view = $("input[name='block_view_type']:checked").val();
	d3.json(goal_file, function(error, rawdata) {
		if (error) throw error;
		if(block_view == "merge") {
			RAW_DATA = rawdata;
			GRAPH_DAT = init_graph_data(rawdata);
			update();			
		}
		else {
			// no_merge
			showblock_without_merge(rawdata);
		}
	});
}