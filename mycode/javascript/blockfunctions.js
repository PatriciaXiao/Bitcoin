var FILE_DIR = "data/";
var G_WIDTH1 = $(window).width();//960;
var G_HEIGHT1 = $(window).height();//600;
var SIZE_UNIT = 5;

// functions about block
var RAW_DATA;
var GRAPH_DAT;
var ADDR_LIST = new Map(); // function included in mymap.js

function showblock() {
	var goal_block = block_height.value;
	var goal_file = FILE_DIR + goal_block + ".json";
	d3.json(goal_file, function(error, rawdata) {
		if (error) throw error;
		RAW_DATA = rawdata;
		GRAPH_DAT = init_graph_data(rawdata);
		update();
	});
}

function mycolor(d, color, colorB){
	var colorRGB = "#000000";
	if (d._children) {
		// totally collapsed
		colorRGB = colorB(d.color_val);
	}
	else if (d.children) {
		// have expanded leafs
		colorRGB = "#aaaaaa";
	}
	else {
		// leaf
		colorRGB = color(d.color_val);
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
	var width = G_WIDTH1, 
		height = G_HEIGHT1;
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
	// draw the force-layout graph
	force
		.nodes(graph.nodes) //debug01
		.links(graph.links)
		.on("tick", tick) 
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
}
/*
function init_graph_data(rawdata) {
	test_child = {"name": "hello world", "color_val": 0};// debug01
	var graph = {"nodes": [], "links": []};
	for (var i = 0, cnt_node = 0, cnt_link = 0; i < rawdata.blocks[0].tx.length; i++) {
		var input_list;
		var output_list;
		var color_val = rawdata.blocks[0].tx[i].tx_index;
		if (i != 0) {
			// not the first tx
			input_list = rawdata.blocks[0].tx[i].inputs;
			output_list = rawdata.blocks[0].tx[i].out;
		}
		else {
			// the first tx
			input_list = [{ "prev_out": {"addr": "0000000000000000000000000000000000"}, "color_val": color_val}];
			output_list = rawdata.blocks[0].tx[i].out;
		}
		// input list
		for (var j = 0; j < input_list.length; j++) {
			//graph.nodes[cnt_node + j] = {"name": input_list[j].prev_out.addr, "color_val": color_val}; // debug01
			graph.nodes[cnt_node + j] = {"name": input_list[j].prev_out.addr, "color_val": color_val, "children": [test_child, test_child]};
		}
		// output list
		for (var j = 0; j < output_list.length; j++) {
			graph.nodes[cnt_node + input_list.length + j] = {"name": output_list[j].addr, "color_val": color_val};
		}
		// links
		for (var j = 0; j < input_list.length; j++) {
			for (var k = 0; k < output_list.length; k++) {
				// if haven't been recorded already
				graph.links[cnt_link] = {"source": cnt_node + j, "target": cnt_node + input_list.length + k,"value": 1};
				cnt_link++;
			}
		}
		cnt_node += (input_list.length + output_list.length);
	}
	return graph;
}
*/

function init_graph_data(rawdata) {
	test_child = {"name": "hello world", "color_val": 0};// debug01
	var graph = {"nodes": [], "links": [], "init_nodes": [], "init_links": [], "child_nodes": [], "child_links": []};
	// general count
	var cnt_node = 0, cnt_link = 0;
	// for each i
	var input_list = [];
	var output_list = [];
	var color_val = []; // depend on tx_index
	// the first tx
	input_list[0] = [{ "prev_out": {"addr": "0000000000000000000000000000000000"}, "color_val": color_val}];
	output_list[0] = rawdata.blocks[0].tx[0].out;
	color_val[0] = rawdata.blocks[0].tx[0].tx_index;
	// not the first tx
	for (var i = 1; i < rawdata.blocks[0].tx.length; i++) {
		color_val[i] = rawdata.blocks[0].tx[i].tx_index;
		input_list[i] = rawdata.blocks[0].tx[i].inputs;
		output_list[i] = rawdata.blocks[0].tx[i].out;
	}
	// process data
	for (var i = 0; i < rawdata.blocks[0].tx.length; i++) { // for each tx
		// input list
		for (var j = 0; j < input_list[i].length; j++) {
			// decide the node's index (parent-child)
			//if (ADDR_LIST.get(input_list[i][j].prev_out.addr) == undefined) {
				// not yet inserted
			//}
			graph.init_nodes[cnt_node + j] = {"name": input_list[i][j].prev_out.addr, "color_val": color_val[i], "times": 1, "amount": 1, "children": [test_child, test_child]};
		}
		// output list
		for (var j = 0; j < output_list[i].length; j++) {
			// decide the nodes's index
			graph.init_nodes[cnt_node + input_list[i].length + j] = {"name": output_list[i][j].addr, "color_val": color_val[i], "times": 1, "amount": 1, "children": [test_child]};
		}
		// links
		for (var j = 0; j < input_list[i].length; j++) {
			for (var k = 0; k < output_list[i].length; k++) {
				// if haven't been recorded already
				graph.init_links[cnt_link] = {"source": cnt_node + j, "target": cnt_node + input_list[i].length + k,"value": 1};
				cnt_link++;
			}
		}
		cnt_node += (input_list[i].length + output_list[i].length);
	}
	// transform data into graph.nodes and graph.links
	var idx_parent = -1;
	for (var i = 0; i < rawdata.blocks[0].tx.length; i++) {
		// iterate through all the tx records in a block
		if (ADDR_LIST.get("000") == undefined)
			console.log("hello world");
	}

	// tmpchild = [test_child];
	// graph.init_nodes = graph.init_nodes.concat(tmpchild);//debug01

	graph.nodes = graph.init_nodes;
	graph.links = graph.init_links;

	return graph;
}

function update_graph_data(graph) {
	var newgraph = graph;
	// modify the new graph
	graph.child_nodes = [];
	graph.child_links = [];
	for (var i = 0; i < graph.init_nodes.length; i++) {
		if (graph.init_nodes[i].children) {
			for (var j = 0; j < graph.init_nodes[i].children.length; j++) {
				graph.child_links[graph.child_links.length] = {"source": i, "target": graph.init_nodes.length + graph.child_nodes.length + j,"value": 1};
			}
			graph.child_nodes = graph.child_nodes.concat(graph.init_nodes[i].children);
		}
	}
	// combine together
	newgraph.nodes = graph.init_nodes.concat(graph.child_nodes);
	newgraph.links = graph.init_links.concat(graph.child_links); // link needs to be modified for it is marked as index
	return newgraph;
}