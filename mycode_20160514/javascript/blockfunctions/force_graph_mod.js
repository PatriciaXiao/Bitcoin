function Node() {
	this.name = ""; 
	this.addr = "";
	this.time = [];
	this.status = [];
	this.color_val = false; //i,
	this.times = 1;
	this.amount=[];
	this._children=[];
}

Node.prototype.copy = function() {
	newNode = new Node();
	return newNode;
}

function Graph(rawdata, id) {
	this.rawdata = rawdata;
	this.graph;
	this.force;
	this.svg;
	this.addr_list = new Map();
	this.width = document.getElementById(id).clientWidth;
	this.height = document.getElementById(id).clientHeight;
	this.graph_w = 0;
	this.graph_h = 0;
	this.edge_len;
	this.padding = 50;
	this.set_width_height = function () {
		this.width = document.getElementById(id).clientWidth;
		this.height = document.getElementById(id).clientHeight;
		//this.width = Math.max($(window).width(), this.graph_w + this.padding * 3);//960;
		//this.height = Math.max($(window).height() - this.padding, this.graph_h + this.padding * 3);//600;
	}
	this.calc_graph_w_h = function () {
		var n_nodes = this.graph.nodes.length;
		var x_list = [];
		var y_list = [];
		for (var i = 0; i < n_nodes; i++) {
			x_list.push(this.graph.nodes[i].x);
			y_list.push(this.graph.nodes[i].y);
		}
		this.graph_w = this.getMaxOfArray(x_list)-this.getMinOfArray(x_list);
		this.graph_h = this.getMaxOfArray(y_list)-this.getMinOfArray(y_list);
	}
	// parameters of node size
	this.param_r = new Object();
	this.param_r["c1"] = 2.2; // 2
	this.param_r["c2"] = AMOUNT_UNIT * 100; // 0.01 ~ 100
	this.param_r["k1"] = AMOUNT_UNIT * 120; //AMOUNT_UNIT * 100;
	this.param_r["k2"] = 1;
	this.set_param_r = function (c1, c2, k1, k2) {
		this.param_r["c1"] = c1;
		this.param_r["c2"] = AMOUNT_UNIT * c2;
		this.param_r["k1"] = AMOUNT_UNIT * k1;
		this.param_r["k2"] = k2;
	}
}

//[C1, C1 - k1 / C2] = [1, 2]
// C1 = 2
// k1 / C2 = 1 => k1 = C2
// k2 = 1 by default
Graph.prototype.reg_r = function(x) {
	// C1 - k1 / (C2 + amount^k2)
	// console.log(x);
	var y = this.param_r["c1"] - this.param_r["k1"] / (this.param_r["c2"] + Math.pow(x, this.param_r["k2"]));
	return y;
}
// according to amount of money
Graph.prototype.node_r = function(d) {
	//return SIZE_UNIT*Math.sqrt(d.times);
	return SIZE_UNIT * this.reg_r(d.sum_in);
}

//function color(d) {
Graph.prototype.color = function(d) {

	var color_val = "#000000";
	if (d.type == 1) {
		color_val = COLOR_ADDR;
	}
	else if (d.type == 0) {
		color_val = COLOR_PALE;
	}
	return color_val;
}

/*
Graph.prototype.node_r = function(d) {
	return SIZE_UNIT*Math.sqrt(d.times);
}
*/

Graph.prototype.update_distance = function() {
	graph = this.graph;
	var n_links = graph.links.length;
	var r_node_a;
	var r_node_b;
	for (var i = 0; i < n_links; i++) {
		if (graph.nodes[graph.links[i].source] != undefined) {
			r_node_a = this.node_r(graph.nodes[graph.links[i].source]);
			r_node_b = this.node_r(graph.nodes[graph.links[i].target]);
		}
		else {
			r_node_a = this.node_r(graph.links[i].source);
			r_node_b = this.node_r(graph.links[i].target);
		}
		
		graph.links[i].distance = r_node_a + r_node_b;
	}
	// possible promotion:
	// the nodes with more neighbours have longer distances for links attached to them
	return graph;
}

//Graph.prototype.InitCollapsibleGraph = function() {
Graph.prototype.init = function() {
	var rawdata = this.rawdata;
	// processing data
	// nodes: nodes shown on screen; links: links shown on screen; 
	// var graph = {"nodes": [], "links": [], "init_nodes": [], "init_links": []};
	this.graph = {"nodes": [], "links": []};
	var graph = this.graph;
	var input_list = [];
	var output_list = [];
	var color_val = []; // depend on tx_index
	var time_list = []; // time stamps
	var idx_input = -1;
	var idx_output = -1;
	var idx_link = -1;
	var sum_in = 0;
	var sum_out = 0;
	var idx_trans = -1; // equivalent to virtual_node_used = false;
	/////
	var total_in = 0;
	var total_out = 0;
	/////
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
		// virtual nodes for payers
		idx_trans = -1;
		if (input_list[i].length > 1) {
			graph.nodes[cnt_node] = 
				{"name": "transaction "+i, 
				"addr": i,
				"sum_in": 0,
				"sum_out": 0,
				"times": input_list[i].length, 
				"amount": [sum_in, sum_out], // sum_in? sum_out?
				"time": [time_list[i], time_list[i]], "status": [0, 1], "color_val": color_val[i],
				"from": [], // from what index of nodes (input), link info
				"to": [], // to what index of nodes (output)
				//"idx": cnt_node, // its own index
				"type": false // fake address, transaction
			};
			idx_trans = cnt_node;
			cnt_node++;
		}

		for (var j = 0; j < input_list[i].length; j++) {
			// input list (j)
			sum_in += input_list[i][j].prev_out.value;
			idx_input = this.addr_list.get(input_list[i][j].prev_out.addr);
			// haven't been included yet
			if (idx_input == undefined) {
				idx_input = cnt_node;
				this.addr_list.put(input_list[i][j].prev_out.addr, cnt_node);
				graph.nodes[cnt_node] = 
					{"name": input_list[i][j].prev_out.addr, 
					"addr": input_list[i][j].prev_out.addr, 
					"sum_in": 0,
					"sum_out": input_list[i][j].prev_out.value,
					"times": 1,
					"from": [], // from what index of nodes (input), link info
					"to": [], // to what index of nodes (output)
					//"idx": cnt_node, // its own index
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
				graph.nodes[idx_input].sum_out += input_list[i][j].prev_out.value;
			}
		}
		for (var j = 0; j < output_list[i].length; j++) {
			// output list (j)
			sum_out += output_list[i][j].value;
			idx_output = this.addr_list.get(output_list[i][j].addr);
			if (idx_output == undefined) {
				idx_output = cnt_node;
				this.addr_list.put(output_list[i][j].addr, cnt_node);
				graph.nodes[cnt_node] = 
					{"name": output_list[i][j].addr, 
					"addr": output_list[i][j].addr, 
					"sum_in": output_list[i][j].value,
					"sum_out": 0,
					"times": 1, 
					"from": [], // from what index of nodes (input), link info
					"to": [], // to what index of nodes (output)
					//"idx": cnt_node, // its own index
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
				graph.nodes[idx_output].sum_in += output_list[i][j].value;
			}
		}
		/*
		// virtual nodes for payers
		if (input_list[i].length > 1) {
			graph.nodes[idx_trans].amount =  [sum_in, sum_out];
			graph.nodes[idx_trans].sum_in = sum_in;
			graph.nodes[idx_trans].sum_out = sum_out;
		}
		*/
		total_in += sum_in;
		total_out += sum_out;
		// console.log([total_in, total_out]);
		// links
		if (idx_trans != -1) {
			graph.nodes[idx_trans].amount =  [sum_in, sum_out];
			graph.nodes[idx_trans].sum_in = sum_in;
			graph.nodes[idx_trans].sum_out = sum_out;
			// multiple inputs
			for (var j = 0; j < input_list[i].length; j++) {
				// input list (j)
				idx_input = this.addr_list.get(input_list[i][j].prev_out.addr);
				graph.links[cnt_link] = {"source": idx_input, "target": idx_trans, "times": 1, "value": 1, "distance": 0};
				graph.nodes[idx_input].to.push(idx_trans);
				graph.nodes[idx_trans].from.push(idx_input);
				cnt_link++;
			}
			for (var j = 0; j < output_list[i].length; j++) {
				// output list (k)
				idx_output = this.addr_list.get(output_list[i][j].addr);
				graph.links[cnt_link] = {"source": idx_trans, "target": idx_output, "times": 1, "value": 1, "distance": 0};
				graph.nodes[idx_trans].to.push(idx_output);
				graph.nodes[idx_output].from.push(idx_trans);
				cnt_link++;
			}
		}
		else {
			// one input
			idx_input = this.addr_list.get(input_list[i][0].prev_out.addr);
			for (var j = 0; j < output_list[i].length; j++) {
				// output list (k)
				idx_output = this.addr_list.get(output_list[i][j].addr);
				if (idx_input != idx_output) { // if the input and output links aren't the same
					idx_link = -1;
					for (var k = 0; k < cnt_link; k++) {
						if (graph.links[k].source == idx_input && graph.links[k].target == idx_output) {
							idx_link = k;
							break;
						}
					}
					if (idx_link == -1) {
						graph.links[cnt_link] = {"source": idx_input, "target": idx_output, "times": 1, "value": 1, "distance": 0};
						graph.nodes[idx_input].to.push(idx_output);
						graph.nodes[idx_output].from.push(idx_input);
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
	this.graph = graph;
	this.update();
	return graph;
}

Graph.prototype.update = function () {
	var graph = this.graph;
	var obj = this;
	//var width = this.width / currentZoom;//document.getElementById("block_graph").clientWidth;
	//var height = this.height / currentZoom;//document.getElementById("block_graph").clientHeight;
	var width = this.width;
	var height = this.height;
	// console.log([width, height]);
	var offset = 12; 
	this.update_distance();
	this.force = d3.layout.force()
				.charge(-60) // -120
				.chargeDistance(360)
				//.linkStrength()
				.linkDistance(function(d) {
					return 30 + d.distance; //d: link
				})
				.linkStrength(1) // 0.8
				.friction(0.9)
				.gravity(0.06) //.gravity(0.1) // important! make the groups distinguishable
				.theta(0.6) //.theta(0.8)
				//.alpha(0.1)
				.size([width, height]);

	d3.select("#block_graph_svg").remove();
	this.svg = d3.select("#block_graph").append("svg")
				.attr("width", width)
				.attr("height", height)
				.attr("id", "block_graph_svg");
	var force = this.force;
	var svg = this.svg;
	/*
	var svg = d3.select("#block_graph").append("svg")
				.attr("width", width)
				.attr("height", height)
				.attr("id", "block_graph_svg") //;
				.attr("viewBox", "0 0 " + width + " " + height)
				.attr("preserveAspectRatio", "xMidYMid meet");
				*/
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
		.alpha(0.1)
		.start();
	/// H for Highlight
	// preparation
	// this.pre_highlight_neighbor();
	this.pre_highlight_chain();
	/// H

	// set the links
	this.link = svg.selectAll(".link")
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

	this.node = svg.selectAll(".node")
				.data(graph.nodes)
				.enter().append("g")
				.attr("class", "node")
				.call(force.drag);
	var node = this.node;
	var link = this.link;

	node.append("circle")
		.attr("r", function(d) { 
			return obj.node_r(d); 
		})
		.on("click", function(d) {
			if (d3.event.defaultPrevented) return; // ignore drag
			/////
			/*
			console.log("click:" + d.index);
			console.log("in:");
			for (var i = 0; i < d.from.length; i++) {
				console.log(d.from[i]);
			}
			console.log("out:");
			for (var i = 0; i < d.to.length; i++) {
				console.log(d.to[i]);
			}*/
			/////
			ShowNodeInfo(d);
			//update_graph_dat_without_merge(graph);
		})
		/// H for highlight
		.on('dblclick', function (d) {
			//obj.connected_neighbor(d, obj);
			obj.connected_chain(d, obj);
		})//; //Added code 
		/// H
		.style("fill", function(d) { return obj.color(d); });

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
			//return d.name;
			return d.sum_in / AMOUNT_UNIT;
		});
	/// R for resize ///
	// this.resize(0);
	d3.select(window).on("resize", function () {
		return obj.resize(-1);
	});
	/// R ///
	// called everytime when the graph stops
	force.on("end", function(){
		obj.calc_graph_w_h();
		/*
		if (obj.graph_w + obj.padding * 2 > obj.width || obj.graph_h + obj.padding * 2 > obj.height) {
			obj.resize(-1, -1);
		}
		*/
		return;
	});
	function tick() {
		/*
		graph.nodes.forEach(function(d, i){
			// d: nodes (d.x, d.y could be set)
			var r = obj.node_r(d);
			d.x = d.x - r < 0	? r : d.x ;
			d.x = d.x + r > width ? (width - r) : d.x ;
			d.y = d.y - r < 0	? r : d.y ;
			d.y = d.y + r + offset > height ? (height - r - offset) : d.y ;
		});
		*/
		link.attr("x1", function(d) { return d.source.x; })
			.attr("y1", function(d) { return d.source.y; })
			.attr("x2", function(d) { return d.target.x; })
			.attr("y2", function(d) { return d.target.y; });
		node.attr("cx", function(d) { return d.x; })
			.attr("cy", function(d) { return d.y; });
		node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
		/// C for collision detection
		node.each(obj.collide(0.6)); //0.5 
		/// C
	}

	//console.log([document.getElementById("block_graph").clientWidth, document.getElementById("block_graph").clientHeight]);
	//console.log(node);
	/*
	console.log(svg);
	console.log(svg[0][0].clientWidth);
	console.log(svg[0][0].clientHeight);
	console.log(graph.nodes);
	console.log(graph.nodes[0].x);
	console.log(graph.nodes[1].x);
	*/

	this.force = force;
	this.svg = svg;
	this.node = node;
	this.link = link;
}

/// C for collision detection
Graph.prototype.collide = function(alpha) {
	var padding = 1, // separation between circles
		radius=8;
	var graph = this.graph;
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

/// H for Highlight
Graph.prototype.pre_highlight_chain = function() {
	var obj = this;
	obj.toggle = 0;
}
Graph.prototype.chaining = function(idx, type) {
	// calculate linked elements
	// console.log([d.index, type]);
	if (type != "from" && type != "to" && type != "both") {
		console.log("type unknown");
		return;
	}
	var d = this.graph.nodes[idx];
	// from
	if (type != "to") {
		for (var i = 0; i < d.from.length; i++) {
			if (this.chained_nodes[d.from[i]] == true && this.chained_links[[d.from[i], idx]] == true) {
				// visited by "from"
				continue;
			}
			this.chained_nodes[d.from[i]] = true;
			this.chained_links[[d.from[i], idx]] = true;
			this.chaining(d.from[i], type);
		}
	}
	// to
	if (type != "from") { //!= from
		for (var i = 0; i < d.to.length; i++) {
			//if (this.chained_nodes[d.to[i]] == true) {
			if (this.chained_nodes[d.to[i]] == true && this.chained_links[[idx, d.to[i]]] == true) {
				// visited
				continue;
			}
			this.chained_nodes[d.to[i]] = true;
			this.chained_links[[idx, d.to[i]]] = true;
			this.chaining(d.to[i], type);
		}
	}
	return;
}
Graph.prototype.connected_chain = function (d, obj) {
	if (obj.toggle == 0) {
		//Reduce the opacity of all but the chaining nodes
		this.chained_nodes = new Object();
		this.chained_links = new Object(); //new Object();
		for (var i = 0; i < obj.node[0].length; i++) {
			this.chained_nodes[i] = false;
		}
		this.chained_nodes[d.index] = true;
		var type = "both";//"to";//"from";
		obj.chaining(d.index, type); // type = "from" / "to" / "both"
		obj.node.style("opacity", function (o) {
			// linked together
			if (obj.chained_nodes[o.index]) {
				return 1; // highlighted
			}
			else {
				return 0.1; // hide
			}
		});
		obj.link.style("opacity", function (o) {
			//if (obj.chained_nodes[o.source.index] && obj.chained_nodes[o.target.index]) {
			if (obj.chained_links[[o.source.index, o.target.index]] == true 
				|| obj.chained_links[[o.target.index, o.source.index]] == true) {
				return 1;
			}
			else {
				return 0.1;
			}
		});
		obj.toggle = 1;
		delete obj.chained_nodes;
		delete obj.chained_links;
	}
	else {
		//Put them back to opacity=1
		obj.node.style("opacity", 1);
		obj.link.style("opacity", 1);
		obj.toggle = 0;
	}
} 
/////////
Graph.prototype.pre_highlight_neighbor = function() {
	//Toggle stores whether the highlighting is on
	var obj = this;
	obj.toggle = 0;
	//Create an array logging what is connected to what
	this.linkedByIndex = new Object();//{};
	for (i = 0; i < graph.nodes.length; i++) {
		this.linkedByIndex[i + "," + i] = 1;
	};
	this.graph.links.forEach(function (d) {
		obj.linkedByIndex[d.source.index + "," + d.target.index] = 1;
	});
}
Graph.prototype.neighboring = function (a, b) {
	return this.linkedByIndex[a.index + "," + b.index];
}
// This function looks up whether a pair are neighbours
/*
Graph.prototype.connectedNodes = function (d, obj) {
	// this = a node
	if (obj.toggle == 0) {
	//Reduce the opacity of all but the neighbouring nodes
		//d = d3.select(this).node().__data__;
		obj.node.style("opacity", function (o) {
			return obj.neighboring(d, o) | obj.neighboring(o, d) ? 1 : 0.1;
		});
		obj.link.style("opacity", function (o) {
			return d.index==o.source.index | d.index==o.target.index ? 1 : 0.1;
		});
		//Reduce the op
		obj.toggle = 1;
	}
	else {
		//Put them back to opacity=1
		obj.node.style("opacity", 1);
		obj.link.style("opacity", 1);
		obj.toggle = 0;
	}
}
*/
Graph.prototype.connected_neighbor = function (d, obj) {
	if (obj.toggle == 0) {
		//Reduce the opacity of all but the neighbouring nodes
		obj.node.style("opacity", function (o) {
			// linked together
			if (obj.neighboring(d, o) || obj.neighboring(o, d)) {
				return 1; // highlighted
			}
			else {
				return 0.1; // hide
			}
		});
		obj.link.style("opacity", function (o) {
			if (d.index==o.source.index || d.index==o.target.index) {
				return 1;
			}
			else {
				return 0.1;
			}
		});
		obj.toggle = 1;
	}
	else {
		//Put them back to opacity=1
		obj.node.style("opacity", 1);
		obj.link.style("opacity", 1);
		obj.toggle = 0;
	}
} 
/// highlight

/// R for resize ///
// Graph.prototype.resize = function(new_w, new_h) {
Graph.prototype.resize = function(type) {
	var new_w;
	var new_h;
	if (type == -1) {
		this.set_width_height();
		new_w = this.width; // this.edge_len
		new_h = this.height;
	}
	else if (type == 1) {
		this.calc_graph_w_h();
		new_w = Math.max(this.graph_w + 2 * this.padding, this.width);
		new_h = Math.max(this.graph_h + 2 * this.padding, this.height);
	}
	this.svg.attr("width", new_w).attr("height", new_h);
	this.force.size([new_w, new_h]).resume();
}
/// R ///

/// M for math ///
Graph.prototype.getMaxOfArray = function(numArray) {
	return Math.max.apply(null, numArray);
}
Graph.prototype.getMinOfArray = function(numArray) {
	return Math.min.apply(null, numArray);
}
/// M