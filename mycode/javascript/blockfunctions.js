var FILE_DIR = "data/";
var G_WIDTH1 = 960;
var G_HEIGHT1 = 600;
var SIZE_UNIT = 5;

// functions about block
var RAW_DATA;
var GRAPH_DAT;

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

function update() {
	var rawdata = RAW_DATA;
	var graph = update_graph_data(GRAPH_DAT);
	// basic parameters settings
	var offset = 12;
	var width = G_WIDTH1, 
		height = G_HEIGHT1;
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
	// var graph = update_graph_data(GRAPH_DAT);
/*	test_child = {"name": "hello world", "color_val": 0};// debug01
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
			graph.nodes[cnt_node + j] = {"name": input_list[j].prev_out.addr, "color_val": color_val};
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
	}*/
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
		.on("click", click_node)
		.style("fill", function(d) { return color(d.color_val); });


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
		console.log(d.name + " children / _children"); //debug01
		console.log(d.children);
		console.log(d._children);
		update();
	}
}

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

function update_graph_data(graph) {
	var newgraph = graph;
	// modify the new graph
	return newgraph;
}