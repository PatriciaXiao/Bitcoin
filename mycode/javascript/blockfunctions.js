var FILE_DIR = "data/";
var G_WIDTH1 = $(window).width();//960;
var G_HEIGHT1 = $(window).height();//600;
//var width = document.getElementById("block_graph").clientWidth;
//var height = document.getElementById("block_graph").clientHeight;
var SIZE_UNIT = 5;
// https://github.com/mbostock/d3/wiki/Ordinal-Scales#category20
var COLOR_ADDR = "#e7ba52";
var COLOR_PERSON = "#8ca252";//"#637939";
var COLOR_PALE = "aaaaaa";

// functions about block
var RAW_DATA;
var GRAPH_DAT;
var ADDR_LIST = new Map(); // function included in mymap.js

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
		date_list[i] = "<br>" + formatDate(array[i]);
	}
	return date_list;
}

// the slider
function refreshBlockSwatch() {
	//debuging
	/*
	var tmp = $("#block_slider").slider("value");
	if (tmp%5==0)
		console.log("temp value of the slider is: "+ tmp);
	*/
	var value = $("#block_slider").slider("value");
	document.getElementById("slider_information_debug").innerHTML = "slider value: "+value;
}

$(function() {
	$("#block_slider").slider({
      orientation: "horizontal",
      //range: "max",
      min: 0,
      max: 1000,
      value: 0,
      slide: refreshBlockSwatch,
      change: refreshBlockSwatch
    });
});


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

function mycolor(d, color, colorB){
	var colorRGB = "#000000";
	if (d._children && d._children.length > 0) {
		// totally collapsed
		colorRGB = COLOR_PERSON;//colorB(d.color_val);
	}
	else if (d.children && d.children.length > 0) {
		// have expanded leafs
		colorRGB = COLOR_PALE;//"#aaaaaa";
	}
	else {
		// leaf
		colorRGB = COLOR_ADDR;//color(d.color_val);
	}
	return colorRGB;
}

function update() {
	var rawdata = RAW_DATA;
	var graph = update_graph_data(GRAPH_DAT);
	var color = d3.scale.category20();
	var colorB = d3.scale.category20b();
	// basic parameters settings
	var offset = 12;
	var width = document.getElementById("block_graph").clientWidth;
	var height = width;//document.getElementById("block_graph").clientHeight;
	// width:500, height:600, distance(auto), linkStrength:2, charge: (-10 / k)*1.5 , gravity: 100 * k
	// var k = Math.sqrt(nodes.length / (width * height));
	var force = d3.layout.force()
				.charge(-60) // -120
				.linkDistance(30)
				.size([width, height]);

	d3.select("#block_graph_svg").remove();

	var svg = d3.select("#block_graph").append("svg")
				.attr("width", width)
				.attr("height", height)
				//.attr("class", "outlined")//debug
				.attr("viewBox", "0 0 " + width + " " + height) //try
				.attr("preserveAspectRatio", "xMidYMid meet")//try
				.attr("id", "block_graph_svg");
	// for arrow
	svg.append("defs").selectAll("marker")
				.data(["suit", "licensing", "resolved"])
				.enter().append("marker")
				.attr("id", function(d) { return d; })
				.attr("viewBox", "0 -5 10 10")
				.attr("refX", 25)
				.attr("refY", 0)
				.attr("markerWidth", 6)
				.attr("markerHeight", 6)
				.attr("orient", "auto")
				.append("path")
				.attr("d", "M0,-5L10,0L0,5 L10,0 L0, -5")
				.style("stroke", "#4679BD")
				.style("opacity", "0.6");
	// draw the force-layout graph
	force
		.nodes(graph.nodes)
		.links(graph.links)
		.on("tick", tick) 
		.start();
	// set the links
	var link = svg.selectAll(".link")
			.data(graph.links)
			.enter().append("line")
			.attr("class", "link")
			//.style("marker-end",  "url(#suit)") // arrows
			//.style("marker-end",  "") // no arrows
			.style("marker-end", function(d) {
				var arrows;
				if (d.type == 1) {
					arrows = "url(#suit)";
				}
				else {
					arrows = "";
				}
				return arrows;
			})
			.style("stroke-width", function(d) {
				return Math.sqrt(d.value); 
			});
	// set the nodes
	var node = svg.selectAll(".node")
				.data(graph.nodes)
				.enter().append("g")
				.attr("class", "node")
				.call(force.drag);

	node.append("circle")
		.attr("r", function(d) { return SIZE_UNIT*Math.sqrt(d.times); }) // SIZE_UNIT*d.times? *d.amount?
		.on("click", click_node)
		.style("fill", function(d) {
			return mycolor(d, color, colorB); //debug02
		});

	node.append("title")
			.text(function(d) {
				return d.name;
			});

	// show text when hovering over it
	node.append("svg:text")
		.attr("class", "nodetext")
		.attr("dx", offset) //12
		.attr("dy", offset)
		.text(function(d) { 
			return d.name; 
		});
	// force.on("tick", tick) // or can be expressed as force.on("tick", function() {
	function tick() {
		link.attr("x1", function(d) { return d.source.x; })
			.attr("y1", function(d) { return d.source.y; })
			.attr("x2", function(d) { return d.target.x; })
			.attr("y2", function(d) { return d.target.y; });
		node.attr("cx", function(d) { return d.x; })
			.attr("cy", function(d) { return d.y; });
		node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
	}
}

// Toggle children on click.
function click_node(d) {
	// change color
	if (!d3.event.defaultPrevented) {
		if (d.children) {
			d._children = d.children;
			d.children = null;
		}
		else {
			d.children = d._children;
			d._children = null;
		}
		update();
	}
	//alert(d.addr);// unexpected phenomenon: reshaped too much?
	//console.log(window.document);
	document.getElementById("node_description_addr").innerHTML = "address: "+d.addr;
	document.getElementById("node_description_time").innerHTML = "time: "+FormatDateList(d.time);
}

function NickName(type, value) {
	var name;
	switch(type) {
		case 0: // var = number
			name = "Node" + value;
			break;
		case 1: // value = address
			name = "addr: " + value;
			break;
		default:
			name = "EMANON";
			break;
	}
	return name;
}

function init_graph_data(rawdata) {
	var graph = {"nodes": [], "links": [], "init_nodes": [], "init_links": [], "child_nodes": [], "child_links": []};
	ADDR_LIST.clear(); // important
	// general count
	var cnt_node = 0, cnt_link = 0;
	// for each i
	var input_list = [];
	var output_list = [];
	var color_val = []; // depend on tx_index
	var time_list = []; // time stamps
	var time_max, time_min;
	// the first tx
	input_list[0] = [{ "prev_out": {"addr": "0000000000000000000000000000000000"}}];
	output_list[0] = rawdata.blocks[0].tx[0].out;
	color_val[0] = rawdata.blocks[0].tx[0].tx_index;
	time_list[0] = time_list[i] = rawdata.blocks[0].tx[0].time;
	// not the first tx
	for (var i = 1; i < rawdata.blocks[0].tx.length; i++) {
		color_val[i] = rawdata.blocks[0].tx[i].tx_index;
		input_list[i] = rawdata.blocks[0].tx[i].inputs;
		output_list[i] = rawdata.blocks[0].tx[i].out;
		time_list[i] = rawdata.blocks[0].tx[i].time;
	}
	// set the range of the slider
	
	time_min = time_max = time_list[0];
	for (var i = 1; i < time_list.length; i++) {
		if (time_list[i] > time_max) {
			time_max = time_list[i];
		}
		else if (time_list[i] < time_min) {
			time_min = time_list[i];
		}
	}
	//$("#block_slider").slider("min") = time_min;
	//$("#block_slider").slider("max") = time_max;
	
	// process data
	for (var i = 0; i < rawdata.blocks[0].tx.length; i++) { // for each tx
		var idx_input = -1;
		var idx_output = -1;
		// input list
		// judge if the person already exists // IMPORTANT: will consider merging two different points latter
		var cand_nodelist = []; // candidate node list
		var tmp_map = new Map();
		//if (graph.init_nodes.length > 155) // debug
		//	console.log(graph.init_nodes[155]); // it works here
		for (var j = 0; j < input_list[i].length; j++) {
			// decide the node's index (parent-child)
			//console.log("input i="+i+" j="+j+ "\naddr: " + input_list[i][j].prev_out.addr + "\nindex:"+ADDR_LIST.get(input_list[i][j].prev_out.addr)+"\n");
			var tmp = ADDR_LIST.get(input_list[i][j].prev_out.addr);
			var cand_nodelist_idx = tmp_map.get(tmp);
			if (tmp != undefined && cand_nodelist_idx == undefined) {
				tmp_map.put(tmp, cand_nodelist.length);
				//if (tmp == 155)
				//	console.log([tmp, cand_nodelist.length]);//debug
				cand_nodelist.push(tmp);
			}
			/*
			if (tmp == 155) {
				//debug
				console.log(graph.init_nodes[155]); // it works here
				// it was alright when 155 is inserted
			}
			*/
		}
		//delete tmp_map;
		// merge the nodes
		//if (graph.init_nodes.length > 155) // debug
		//	console.log(graph.init_nodes[155]); // it works here
		if (cand_nodelist.length > 0) {
			var tmp_idx = 0;
			idx_input = cand_nodelist[0];
			for (var j = 1; j < cand_nodelist.length; j++) {
				if (cand_nodelist[j] < idx_input) {
					idx_input = cand_nodelist[j];
					tmp_idx = j;
				}
			}
			if (tmp_idx != 0) {
				//console.log("switching two elements in cand_nodelist: [0]"+cand_nodelist[0]+", with ["+tmp_idx+"]"+cand_nodelist[tmp_idx]);
				var tmp_elem = cand_nodelist[0];
				cand_nodelist[0] = cand_nodelist[tmp_idx];
				cand_nodelist[tmp_idx] = tmp_elem;
				tmp_map.put(cand_nodelist[0], 0);
				tmp_map.put(cand_nodelist[tmp_idx], tmp_idx);
				//console.log("...... Done. Now it is: [0]"+cand_nodelist[0]+", with ["+tmp_idx+"]"+cand_nodelist[tmp_idx]);
			} // idx_input should be kept unchanged and by default it is the 0-th element
		}
		else{
			idx_input = -1;
		}
		for (var j = 1; j < cand_nodelist.length; j++) { // for each candicate // notice: what if two candidates are the same?
			// merge all of them onto idx_input by:
			//console.log("Merging......"+"Node"+cand_nodelist[j]+".......to: Node"+idx_input);
			//if (graph.init_nodes.length > 155) // debug
			//	console.log(graph.init_nodes[155]); // it works here
			// 1. passing all the children
			for (var k = 0; k < graph.init_nodes[cand_nodelist[j]]._children.length; k++) { // for each child
				//console.log("k:"+k+"\n");
				ADDR_LIST.put(graph.init_nodes[cand_nodelist[j]]._children[k].addr, idx_input);
				graph.init_nodes[idx_input]._children.push(graph.init_nodes[cand_nodelist[j]]._children[k]);
			}
			//    check 1
			/*
			for (var k = 0; k < graph.init_nodes[cand_nodelist[j]]._children.length; k++) { // for each child
				console.log(idx_input+"=="+ADDR_LIST.get(graph.init_nodes[cand_nodelist[j]]._children[k].addr));
				console.log(graph.init_nodes[idx_input]._children);
			}	
			*/		
			// 2. re-calculate: e.g. accumulate times (and latter on, amount)
			graph.init_nodes[idx_input].times += graph.init_nodes[cand_nodelist[j]].times;
			//		check 2
			// console.log(graph.init_nodes[idx_input].times);
			// 3. for now, don't really remove the node in the init_node array, instead, I choose to take the tail to replace their blanks
			// ATTENTION: what if the element to be get rid of is the very last one for now?
			if (graph.init_nodes.length-1 != cand_nodelist[j]) {
				//console.log(graph.init_nodes.length);
				//graph.init_nodes[cand_nodelist[j]] = graph.init_nodes[graph.init_nodes.length - 1];
				graph.init_nodes[cand_nodelist[j]] = graph.init_nodes[graph.init_nodes.length - 1];
				for (var k = 0; k < graph.init_nodes[graph.init_nodes.length-1]._children.length; k++) { // for each child
					ADDR_LIST.put(graph.init_nodes[graph.init_nodes.length-1]._children[k].addr, cand_nodelist[j]);
				}
			}
			/*console.log("trying to ...... move node (idx in graph.init_nodes) "+cand_nodelist[j] + " to idx "+idx_input
				+"\nand move idx "+(graph.init_nodes.length-1)+" to idx "+ cand_nodelist[j]);
				*/
			//graph.init_nodes.remove(graph.init_nodes.length - 1);
			//graph.init_nodes.length--;
			/*
			console.log(graph.init_nodes.length);
			console.log(cand_nodelist[j]);
			console.log(graph.init_nodes[cand_nodelist[j]]);
			*/
			graph.init_nodes.pop();
			cnt_node--; // very very important
			/*
			console.log(graph.init_nodes.length);
			console.log(cand_nodelist[j]);
			console.log(graph.init_nodes[cand_nodelist[j]]);
			*/
			// 4. change all the links involving 
			//		(mainly: cand_nodelist[j] -> idx_input; graph.init_nodes.length-1 -> cand_nodelist[j])
			for (var k = 0; k < graph.init_links.length; k++) {
				if (graph.init_links[k].source == cand_nodelist[j]) {
					graph.init_links[k].source = idx_input;
				}
				if (graph.init_links[k].target == cand_nodelist[j]) {
					graph.init_links[k].target = idx_input;
				}
			}
			if (graph.init_nodes.length != cand_nodelist[j]) {
				for (var k = 0; k < graph.init_links.length; k++) {
					if (graph.init_links[k].source == graph.init_nodes.length) {
						graph.init_links[k].source = cand_nodelist[j];
					}
					if (graph.init_links[k].target == graph.init_nodes.length) {
						graph.init_links[k].target = cand_nodelist[j];
					}
				}
			}
			// 5. change the rest of cand_nodelist if influenced
			
			var cand_nodelist_idx;
			/*
			cand_nodelist_idx = tmp_map.get(cand_nodelist[j]);
			if (cand_nodelist_idx != undefined) {
				// cand_nodelist[j] -> idx_input
				cand_nodelist[cand_nodelist_idx] = idx_input;
			}
			*/
			cand_nodelist_idx = tmp_map.get(graph.init_nodes.length);
			//console.log("hello "+cand_nodelist_idx +","+cand_nodelist[cand_nodelist_idx]);
			if (cand_nodelist_idx != undefined) {
				// graph.init_nodes.length-1 -> cand_nodelist[j]
				cand_nodelist[cand_nodelist_idx] = cand_nodelist[j];
			}

		}
		
		if (idx_input == -1) { // not yet inserted
			graph.init_nodes[cnt_node] = 
					{"name": NickName(0, cnt_node), 
					"addr": cnt_node,
					"time": [],
					"color_val": i, "times": 1, "amount": 1, "_children": []};
			idx_input = cnt_node;
			for (var j = 0; j < input_list[i].length; j++) {
				// update information for each node
				ADDR_LIST.put(input_list[i][j].prev_out.addr, cnt_node);
				//console.log(ADDR_LIST.get(input_list[i][j].prev_out.addr));
				graph.init_nodes[cnt_node].time.push(time_list[i]);
				graph.init_nodes[cnt_node]._children[j] = 
						{"name": NickName(1, input_list[i][j].prev_out.addr), 
						"addr": input_list[i][j].prev_out.addr,
						"time": [time_list[i]],
						"color_val": color_val[i], "times": 1, "amount": 1, "_children": []};
			}
			cnt_node++;
		}
		else {
			// insert into graph.init_nodes[idx_input]
			for (var j = 0; j < input_list[i].length; j++) {
				// count++
				graph.init_nodes[idx_input].times++;
				graph.init_nodes[idx_input].time.push(time_list[i]); // moved here
				// judge if the node did exist
				var tmp = ADDR_LIST.get(input_list[i][j].prev_out.addr);
				if (tmp == idx_input) {
					// already exist; very IMPORTANT: latter this would be used for "merge"; for now, we agree for sure that merge isn't required
					//    that is to say, tmp == idx_input
					// find the corresponding child node
					var idx_addr = -1;
					for (var k = 0; k < graph.init_nodes[idx_input]._children.length; k++) {
						if (graph.init_nodes[idx_input]._children[k].addr == input_list[i][j].prev_out.addr) {
							idx_addr = k;
							break;
						}
					}
					graph.init_nodes[idx_input]._children[idx_addr].times++;
					graph.init_nodes[idx_input]._children[idx_addr].time.push(time_list[i]);//don't forget
				}
				else {
					ADDR_LIST.put(input_list[i][j].prev_out.addr, idx_input);
					graph.init_nodes[idx_input]._children.push(
							{"name": NickName(1, input_list[i][j].prev_out.addr),
							"addr": input_list[i][j].prev_out.addr,
							"time": [time_list[i]],
							"color_val": color_val[i], "times": 1, "amount": 1, "_children": []});
				}
			}			
		}
		// output list
		/*
		console.log("i="+i);
		console.log("ADDR_LIST");
		ADDR_LIST.each(function(a,b,c){
			console.log(a+"\n"+b+"\n"+c+"\n")
		});
		console.log("end ADDR_LIST");
		*/
		for (var j = 0; j < output_list[i].length; j++) { // for each output
			// decide the nodes's index
			// graph.init_nodes[cnt_node] = {"name": output_list[i][j].addr, "color_val": color_val[i], "times": 1, "amount": 1, "children": []};
			// check if it's been existed
			idx_output = ADDR_LIST.get(output_list[i][j].addr);
			//console.log("j="+j+"\n"+"addr="+output_list[i][j].addr+"\n"+"idx_output="+idx_output);
			if (idx_output == undefined) {
				// not existed yet
				graph.init_nodes[cnt_node] = 
						{"name": NickName(0, cnt_node),
						"addr": cnt_node,
						"time": [time_list[i]],
						"color_val": i, "times": 1, "amount": 1, "_children": []};
				graph.init_nodes[cnt_node]._children[0] = 
						{"name": NickName(1, output_list[i][j].addr),
						"addr": output_list[i][j].addr,
						"time": [time_list[i]],
						"color_val": color_val[i], "times": 1, "amount": 1, "_children": []};
				ADDR_LIST.put(output_list[i][j].addr, cnt_node);
				idx_output = cnt_node;
				cnt_node++;
			}
			else {
				// has already existed
				var idx_addr = -1;
				for(var k = 0; k < graph.init_nodes[idx_output]._children.length; k++) {
					// find the goal addr
					if (graph.init_nodes[idx_output]._children[k].addr == output_list[i][j].addr) {
						idx_addr = k;
						break;
					}
				}
				//if (idx_addr == -1) {
					// has no such child here:: regarded as impossible
				//}
				graph.init_nodes[idx_output].time.push[time_list[i]];
				graph.init_nodes[idx_output]._children[idx_addr].time.push(time_list[i]);
				graph.init_nodes[idx_output]._children[idx_addr].times++;
			}
			// links
			//console.log("linking......"+graph.init_nodes[idx_input].addr+" with "+graph.init_nodes[idx_output].addr);
			if (idx_input != idx_output) {
				var idx_link = -1;
				for (var k = 0; k < cnt_link; k++) {
					// already existed
					if (graph.init_links[k].source == idx_input && graph.init_links[k].target == idx_output) {
						idx_link = k;
						graph.init_links[k].value++;
						break;
					}
				}
				if (idx_link == -1) {
					graph.init_links[cnt_link] = {"source": idx_input, "target": idx_output, "value": 1, "type": 1};
					cnt_link++;
				}
			}
		}
		delete tmp_map;
	}
	/*
	// debug
	ADDR_LIST.each(function(a,b,c){
		console.log(a+"\n"+b+"\n"+c+"\n")
	});
	*/
	graph.nodes = graph.init_nodes;
	graph.links = graph.init_links;
	return graph;
}

function update_graph_data(graph) {
	var newgraph = graph;
	// modify the new graph
	
	graph.child_nodes = [];
	graph.child_links = [];

	//console.log("length="+graph.init_nodes.length);
	//console.log(graph.init_nodes[5]);
	//console.log(graph.init_nodes[6]);
	//graph.init_nodes[5] = graph.init_nodes[6]; //debug
	for (var i = 0; i < graph.init_nodes.length; i++) {
		//console.log("i="+i);
		//console.log(graph.init_nodes[i]);
		if (graph.init_nodes[i].children) {
			for (var j = 0; j < graph.init_nodes[i].children.length; j++) {
				graph.child_links[graph.child_links.length] = 
							{"source": i, "target": graph.init_nodes.length + graph.child_nodes.length + j,
							"value": 1, "type": 0};
			}
			graph.child_nodes = graph.child_nodes.concat(graph.init_nodes[i].children);
		}
	}
	// combine together
	newgraph.nodes = graph.init_nodes.concat(graph.child_nodes);
	newgraph.links = graph.init_links.concat(graph.child_links); // link needs to be modified for it is marked as index
	return newgraph;
}

// without merge
function showblock_without_merge(rawdata) {
	// console.log("load data");
	// basic parameters settings
	var offset = 12;
	//var width = G_WIDTH1, height = G_HEIGHT1;
	var width = document.getElementById("block_graph").clientWidth;
	var height = width;
	var color = d3.scale.category20();
	var force = d3.layout.force()
				.charge(-120)
				.linkDistance(30)
				.size([width, height]);
	d3.select("#block_graph_svg").remove();
	var svg = d3.select("#block_graph").append("svg")
				.attr("width", width)
				.attr("height", height)
				.attr("id", "block_graph_svg");
	// for arrow
	svg.append("defs").selectAll("marker")
				.data(["suit", "licensing", "resolved"])
				.enter().append("marker")
				.attr("id", function(d) { return d; })
				.attr("viewBox", "0 -5 10 10")
				.attr("refX", 25)
				.attr("refY", 0)
				.attr("markerWidth", 6)
				.attr("markerHeight", 6)
				.attr("orient", "auto")
				.append("path")
				.attr("d", "M0,-5L10,0L0,5 L10,0 L0, -5")
				.style("stroke", "#4679BD")
				.style("opacity", "0.6");
	// processing data
	var graph = {"nodes": [], "links": []};
	var input_list = [];
	var output_list = [];
	var color_val = []; // depend on tx_index
	var time_list = []; // time stamps
	// the first tx
	input_list[0] = [{ "prev_out": {"addr": "0000000000000000000000000000000000"}}];
	output_list[0] = rawdata.blocks[0].tx[0].out;
	color_val[0] = rawdata.blocks[0].tx[0].tx_index;
	time_list[0] = time_list[i] = rawdata.blocks[0].tx[0].time;
	// not the first tx
	for (var i = 1; i < rawdata.blocks[0].tx.length; i++) {
		color_val[i] = rawdata.blocks[0].tx[i].tx_index;
		input_list[i] = rawdata.blocks[0].tx[i].inputs;
		output_list[i] = rawdata.blocks[0].tx[i].out;
		time_list[i] = rawdata.blocks[0].tx[i].time;
	}
	// start processing the data
	for (var i = 0, cnt_node = 0, cnt_link = 0; i < rawdata.blocks[0].tx.length; i++) {
		// input list
		for (var j = 0; j < input_list.length; j++) {
			graph.nodes[cnt_node + j] = 
					{"name": input_list[i][j].prev_out.addr, 
					"addr": input_list[i][j].prev_out.addr, 
					"time": [time_list[i]], "color_val": color_val[i]};
		}
		// output list
		for (var j = 0; j < output_list.length; j++) {
			graph.nodes[cnt_node + input_list.length + j] = 
					{"name": output_list[i][j].addr, 
					"addr": output_list[i][j].addr, 
					"time": [time_list[i]], "color_val": color_val[i]};
		}
		// links
		for (var j = 0; j < input_list.length; j++) {
			for (var k = 0; k < output_list.length; k++) {
				// if haven't been recorded already
				graph.links[cnt_link] = {"source": cnt_node + j, "target": cnt_node + input_list.length + k, "value": 1};
				cnt_link++;
			}
		}
		cnt_node += (input_list.length + output_list.length);
	}
	/////
	// draw the force-layout graph
	force
		.nodes(graph.nodes)
		.links(graph.links)
		.on("tick", tick) // debug add
		.start();
	// set the links
	var link = svg.selectAll(".link")
			.data(graph.links)
			.enter().append("line")
			.attr("class", "link")
			.style("marker-end",  "url(#suit)") // arrows
			.style("stroke-width", function(d) {
				return Math.sqrt(d.value); 
			});
	// set the nodes
	var node = svg.selectAll(".node")
				.data(graph.nodes)
				.enter().append("g")
				.attr("class", "node")
				.call(force.drag);
	node.append("circle")
		.attr("r", function(d) { return SIZE_UNIT; })
		.on("click", function(d) {
			document.getElementById("node_description_addr").innerHTML = "address: "+ d.addr;
			document.getElementById("node_description_time").innerHTML = "time: "+ FormatDateList(d.time);
		})
		.style("fill", function(d) { return color(d.color_val); });

	node.append("title")
			.text(function(d) { return d.name; });
	// show text when hovering over it
	node.append("svg:text")
		.attr("class", "nodetext")
		.attr("dx", offset) //12
		.attr("dy", offset)
		.text(function(d) { 
			return d.name; 
		});
	// force.on("tick", tick) // or can be expressed as force.on("tick", function() {
	function tick() {
		link.attr("x1", function(d) { return d.source.x; })
			.attr("y1", function(d) { return d.source.y; })
			.attr("x2", function(d) { return d.target.x; })
			.attr("y2", function(d) { return d.target.y; });
		node.attr("cx", function(d) { return d.x; })
			.attr("cy", function(d) { return d.y; });
		node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
	}
}