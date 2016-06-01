// without merge
function block_no_merge_color(d, color_funct) {
	var color_val = "#000000";
	if (d.type == 1) {
		color_val = COLOR_ADDR;
	}
	else if (d.type == 0) {
		color_val = COLOR_PALE;
	}
	return color_val;
}

//function showblock_without_merge(graph) {
function update_without_merge(graph) {
	//var graph = init_graph_data_without_merge(rawdata);
	// basic parameters settings
	var color = d3.scale.category20();
	//var width = G_WIDTH1, height = G_HEIGHT1;
	var width = document.getElementById("block_graph").clientWidth;
	var height = width;
	var offset = 12; //width / 2;
	//var no_merge_color = d3.scale.category20();
	var force = d3.layout.force()
				.charge(-60) // -120
				.linkDistance(30)
				.size([width, height]);
	d3.select("#block_graph_svg").remove();
	var svg = d3.select("#block_graph").append("svg")
				.attr("width", width)
				.attr("height", height)
				.attr("id", "block_graph_svg") //;
				.attr("viewBox", "0 0 " + width + " " + height)
				.attr("preserveAspectRatio", "xMidYMid meet");
	/// A for arrows
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
	/// A
	// draw the force-layout graph
	force
		.nodes(graph.nodes)
		.links(graph.links)
		.on("tick", tick) // debug add
		.start();
	/*
	/// C for collision detection
	var padding = 1, // separation between circles
		radius=8;
	function collide(alpha) {
		var quadtree = d3.geom.quadtree(graph.nodes);
		return function(d) {
			var rb = 2*radius + padding,
			nx1 = d.x - rb,
			nx2 = d.x + rb,
			ny1 = d.y - rb,
			ny2 = d.y + rb;
			quadtree.visit(function(quad, x1, y1, x2, y2) {
				if (quad.point && (quad.point !== d)) {
					var x = d.x - quad.point.x,
					y = d.y - quad.point.y,
					l = Math.sqrt(x * x + y * y);
					if (l < rb) {
						l = (l - rb) / l * alpha;
						d.x -= x *= l;
						d.y -= y *= l;
						quad.point.x += x;
						quad.point.y += y;
					}
				}
				return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
			});
		};
	}
	/// C
	*/
	/// H for Highlight
	//Toggle stores whether the highlighting is on
	var toggle = 0;
	//Create an array logging what is connected to what
	var linkedByIndex = {};
	for (i = 0; i < graph.nodes.length; i++) {
		linkedByIndex[i + "," + i] = 1;
	};
	graph.links.forEach(function (d) {
		linkedByIndex[d.source.index + "," + d.target.index] = 1;
	});
	//This function looks up whether a pair are neighbours
	function neighboring(a, b) {
		return linkedByIndex[a.index + "," + b.index];
	}
	function connectedNodes() {
		if (toggle == 0) {
			//Reduce the opacity of all but the neighbouring nodes
			d = d3.select(this).node().__data__;
			node.style("opacity", function (o) {
				return neighboring(d, o) | neighboring(o, d) ? 1 : 0.1;
			});
			link.style("opacity", function (o) {
				return d.index==o.source.index | d.index==o.target.index ? 1 : 0.1;
			});
			//Reduce the op
			toggle = 1;
		}
		else {
			//Put them back to opacity=1
			node.style("opacity", 1);
			link.style("opacity", 1);
			toggle = 0;
		}
	} 
	/// H

	// set the links
	var link = svg.selectAll(".link")
			.data(graph.links)
			.enter().append("line")
			.attr("class", "link")
			/// A for arrows ///
			.style("marker-end",  "url(#suit)") // arrows
			/// A ///
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
		//.attr("r", function(d) { return SIZE_UNIT; })
		.attr("r", function(d) { return SIZE_UNIT*Math.sqrt(d.times); })
		.on("click", function(d) {
			ShowNodeInfo(d);
		})
		/// H for highlight
		.on('dblclick', connectedNodes)//; //Added code 
		/// H
		.style("fill", function(d) { return block_no_merge_color(d, color); });

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
		/// C for collision detection
		// node.each(collide(0.5)); //Added 
		/// C
	}
}

function init_graph_data_without_merge(rawdata) {
	// processing data
	var node_addr_list = new Map();
	// nodes: nodes shown on screen; links: links shown on screen; 
	var graph = {"nodes": [], "links": [], "init_nodes": [], "init_links": []};
	var input_list = [];
	var output_list = [];
	var color_val = []; // depend on tx_index
	var time_list = []; // time stamps
	var idx_input = -1;
	var idx_output = -1;
	var idx_link = -1;
	var sum_in = 0;
	var sum_out = 0;
	var idx_trans = -1;
	// the first tx
	input_list[0] = [{ "prev_out": {"addr": "0000000000000000000000000000000000", "value": rawdata.blocks[0].tx[0].out[0].value}}];
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
		sum_in = sum_out = 0;
		// for each transaction
		for (var j = 0; j < input_list[i].length; j++) {
			// input list (j)
			sum_in += input_list[i][j].prev_out.value;
			idx_input = node_addr_list.get(input_list[i][j].prev_out.addr);
			if (idx_input == undefined) {
				idx_input = cnt_node;
				node_addr_list.put(input_list[i][j].prev_out.addr, cnt_node);
				graph.nodes[cnt_node] = 
					{"name": input_list[i][j].prev_out.addr, 
					"addr": input_list[i][j].prev_out.addr, 
					"times": 1,
					"amount": [input_list[i][j].prev_out.value], 
					"time": [time_list[i]], "status": [1], "color_val": color_val[i],
					"type": true // address
				};
				cnt_node++;
			}
			else {
				// already exist
				graph.nodes[idx_input].times++;
				graph.nodes[idx_input].time.push(time_list[i]);
				graph.nodes[idx_input].status.push(1);
				graph.nodes[idx_input].amount.push(input_list[i][j].prev_out.value);
			}
		}
		for (var j = 0; j < output_list[i].length; j++) {
			// output list (j)
			sum_out += output_list[i][j].value;
			idx_output = node_addr_list.get(output_list[i][j].addr);
			if (idx_output == undefined) {
				idx_output = cnt_node;
				node_addr_list.put(output_list[i][j].addr, cnt_node);
				graph.nodes[cnt_node] = 
					{"name": output_list[i][j].addr, 
					"addr": output_list[i][j].addr, 
					"times": 1, 
					"amount": [output_list[i][j].value],
					"time": [time_list[i]], "status": [0], "color_val": color_val[i],
					"type": true // address
				};
				cnt_node++;
			}
			else {
				graph.nodes[idx_output].times++;
				graph.nodes[idx_output].time.push(time_list[i]);
				graph.nodes[idx_output].status.push(0);
				graph.nodes[idx_output].amount.push(output_list[i][j].value);
			}
		}
		// virtual nodes for payers
		idx_trans = -1;
		if (input_list[i].length > 1) {
			graph.nodes[cnt_node] = 
				{"name": "transaction "+i, 
				"addr": i,
				"times": input_list[i].length, 
				"amount": [sum_in, sum_out], // sum_in? sum_out?
				"time": [time_list[i], time_list[i]], "status": [0, 1], "color_val": color_val[i],
				"type": false // fake address, transaction
			};
			idx_trans = cnt_node;
			cnt_node++;
		}
		// links
		if (idx_trans != -1) {
			// multiple inputs
			for (var j = 0; j < input_list[i].length; j++) {
				// input list (j)
				idx_input = node_addr_list.get(input_list[i][j].prev_out.addr);
				graph.links[cnt_link] = {"source": idx_input, "target": idx_trans, "times": 1, "value": 1};
				cnt_link++;
			}
			for (var j = 0; j < output_list[i].length; j++) {
				// output list (k)
				idx_output = node_addr_list.get(output_list[i][j].addr);
				graph.links[cnt_link] = {"source": idx_trans, "target": idx_output, "times": 1, "value": 1};
				cnt_link++;
			}
		}
		else {
			// one input
			idx_input = node_addr_list.get(input_list[i][0].prev_out.addr);
			for (var j = 0; j < output_list[i].length; j++) {
				// output list (k)
				idx_output = node_addr_list.get(output_list[i][j].addr);
				if (idx_input != idx_output) { // if the input and output links aren't the same
					idx_link = -1;
					for (var k = 0; k < cnt_link; k++) {
						if (graph.links[k].source == idx_input && graph.links[k].target == idx_output) {
							idx_link = k;
							break;
						}
					}
					if (idx_link == -1) {
						graph.links[cnt_link] = {"source": idx_input, "target": idx_output, "times": 1, "value": 1};
						cnt_link++;
					}
					else { // if have been recorded
						graph.links[idx_link].times++;
					}
				}
			}
		}
	}
	/////
	// clear the address list
	node_addr_list.clear();
	return graph;
}

function update_graph_dat_without_merge(graph) {
	// 
}