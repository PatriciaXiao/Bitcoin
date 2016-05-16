function Node() {
	this.name = ""; 
	this.addr = "";
	this.time = [];
	this.status = [];
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
	//return SIZE_UNIT * this.reg_r(d.sum_in);
	return SIZE_UNIT * this.reg_r(d.sum_out); // received
}

//function color(d) {
Graph.prototype.color = function(d) {
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

function NickName(type, value) {
	var name;
	switch(type) {
		case 0: // var = number
			name = "node" + value;
			break;
		case 1: // value = address
			name = "addr: " + value;
			break;
		default:
			name = value;
			break;
	}
	return name;
}

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

Graph.prototype.click_node = function(d) {
	if (!d3.event.defaultPrevented) {
		if (d.children) {
			d._children = d.children;
			d.children = null;
		}
		else {
			d.children = d._children;
			d._children = null;
		}
		//console.log(d);
		//console.log(this);
		this.update_graph_data();
		this.update();
	}
	// show information
	ShowNodeInfo(d);
}

//Graph.prototype.InitCollapsibleGraph = function() {
Graph.prototype.init = function() {
	var rawdata = this.rawdata;
	// processing data
	// nodes: nodes shown on screen; links: links shown on screen; 
	// var graph = {"nodes": [], "links": [], "init_nodes": [], "init_links": []};
	this.graph = {"nodes": [], "links": [], "init_nodes": [], "init_links": [], "child_nodes": [], "child_links": []};
	var graph = this.graph;
	var input_list = [];
	var output_list = [];
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
	var cand_nodelist = []; // candidate node list
	var tmp_map = new Map();
	// the first tx
	input_list[0] = [{ "prev_out": {"addr": "0000000000000000000000000000000000", "value": rawdata.blocks[0].tx[0].out[0].value}}];
	output_list[0] = rawdata.blocks[0].tx[0].out;
	time_list[0] = time_list[i] = rawdata.blocks[0].tx[0].time;
	// not the first tx
	for (var i = 1; i < rawdata.blocks[0].tx.length; i++) {
		input_list[i] = rawdata.blocks[0].tx[i].inputs;
		output_list[i] = rawdata.blocks[0].tx[i].out;
		time_list[i] = rawdata.blocks[0].tx[i].time;
	}
	// start processing the data
	for (var i = 0, cnt_node = 0, cnt_link = 0; i < rawdata.blocks[0].tx.length; i++) {
		cand_nodelist = []; // candidate node list
		tmp_map.clear();
		sum_in = sum_out = 0;
		for (var j = 0; j < input_list[i].length; j++) {
			// decide the node's index (parent-child)
			//console.log("input i="+i+" j="+j+ "\naddr: " + input_list[i][j].prev_out.addr + "\nindex:"+this.addr_list.get(input_list[i][j].prev_out.addr)+"\n");
			var tmp = this.addr_list.get(input_list[i][j].prev_out.addr);
			var cand_nodelist_idx = tmp_map.get(tmp);
			if (tmp != undefined && cand_nodelist_idx == undefined) {
				tmp_map.put(tmp, cand_nodelist.length);
				cand_nodelist.push(tmp);
			}
		}
		// merge the nodes
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
			// 1. passing all the children
			for (var k = 0; k < graph.init_nodes[cand_nodelist[j]]._children.length; k++) { // for each child
				//console.log("k:"+k+"\n");
				this.addr_list.put(graph.init_nodes[cand_nodelist[j]]._children[k].addr, idx_input);
				graph.init_nodes[idx_input]._children.push(graph.init_nodes[cand_nodelist[j]]._children[k]);
			}
			//    check 1
			/*
			for (var k = 0; k < graph.init_nodes[cand_nodelist[j]]._children.length; k++) { // for each child
				console.log(idx_input+"=="+this.addr_list.get(graph.init_nodes[cand_nodelist[j]]._children[k].addr));
				console.log(graph.init_nodes[idx_input]._children);
			}	
			*/		
			// 2. re-calculate: e.g. accumulate times (and latter on, amount)
			graph.init_nodes[idx_input].times += graph.init_nodes[cand_nodelist[j]].times;
			graph.init_nodes[idx_input].amount = graph.init_nodes[cand_nodelist[j]].amount.concat(graph.init_nodes[idx_input].amount);
			graph.init_nodes[idx_input].from = graph.init_nodes[cand_nodelist[j]].from.concat(graph.init_nodes[idx_input].from);
			graph.init_nodes[idx_input].to = graph.init_nodes[cand_nodelist[j]].to.concat(graph.init_nodes[idx_input].to);
			graph.init_nodes[idx_input].sum_in += graph.init_nodes[cand_nodelist[j]].sum_in;
			graph.init_nodes[idx_input].sum_out += graph.init_nodes[cand_nodelist[j]].sum_out;
			//		check 2
			// console.log(graph.init_nodes[idx_input].times);
			// 3. for now, don't really remove the node in the init_node array, instead, I choose to take the tail to replace their blanks
			// ATTENTION: what if the element to be get rid of is the very last one for now?
			if (graph.init_nodes.length-1 != cand_nodelist[j]) {
				//console.log(graph.init_nodes.length);
				//graph.init_nodes[cand_nodelist[j]] = graph.init_nodes[graph.init_nodes.length - 1];
				graph.init_nodes[cand_nodelist[j]] = graph.init_nodes[graph.init_nodes.length - 1];
				for (var k = 0; k < graph.init_nodes[graph.init_nodes.length-1]._children.length; k++) { // for each child
					this.addr_list.put(graph.init_nodes[graph.init_nodes.length-1]._children[k].addr, cand_nodelist[j]);
				}
			}
			/*console.log("trying to ...... move node (idx in graph.init_nodes) "+cand_nodelist[j] + " to idx "+idx_input
				+"\nand move idx "+(graph.init_nodes.length-1)+" to idx "+ cand_nodelist[j]);
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
					"time": [], "status": [],
					"color_val": false, //i,
					"times": 1,
					"amount": [],
					"sum_in": 0,
					"sum_out": 0,
					"from": [], //idx
					"to": [],
					"_children": []};

			idx_input = cnt_node;
			for (var j = 0; j < input_list[i].length; j++) {
				// update information for each node
				this.addr_list.put(input_list[i][j].prev_out.addr, cnt_node);
				//console.log(this.addr_list.get(input_list[i][j].prev_out.addr));
				graph.init_nodes[cnt_node].time.push(time_list[i]);
				graph.init_nodes[cnt_node].status.push(1); // input
				graph.init_nodes[cnt_node].amount.push(input_list[i][j].prev_out.value);
				graph.init_nodes[cnt_node].sum_in += input_list[i][j].prev_out.value;
				graph.init_nodes[cnt_node]._children[j] = 
						{"name": NickName(1, input_list[i][j].prev_out.addr), 
						"addr": input_list[i][j].prev_out.addr,
						"time": [time_list[i]], "status": [1],
						"color_val": false, //color_val[i], 
						"times": 1, "amount": [input_list[i][j].prev_out.value],
						"sum_in": input_list[i][j].prev_out.value,
						"sum_out": 0, 
						"from": [], //idx
						"to": [],
						"_children": []};
			}
			cnt_node++;
		}
		else {
			// insert into graph.init_nodes[idx_input]
			for (var j = 0; j < input_list[i].length; j++) {
				// count++
				graph.init_nodes[idx_input].times++;
				graph.init_nodes[idx_input].time.push(time_list[i]); // moved here
				graph.init_nodes[idx_input].status.push(1);
				graph.init_nodes[idx_input].amount.push(input_list[i][j].prev_out.value);
				graph.init_nodes[idx_input].sum_in += input_list[i][j].prev_out.value;
				// judge if the node did exist
				var tmp = this.addr_list.get(input_list[i][j].prev_out.addr);
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
					graph.init_nodes[idx_input]._children[idx_addr].status.push(1);
					graph.init_nodes[idx_input]._children[idx_addr].amount.push(input_list[i][j].prev_out.value);
					graph.init_nodes[idx_input]._children[idx_addr].sum_in += input_list[i][j].prev_out.value;
				}
				else {
					this.addr_list.put(input_list[i][j].prev_out.addr, idx_input);
					graph.init_nodes[idx_input]._children.push(
							{"name": NickName(1, input_list[i][j].prev_out.addr),
							"addr": input_list[i][j].prev_out.addr,
							"time": [time_list[i]], "status": [1],
							"color_val": false, //color_val[i], 
							"times": 1, "amount": [input_list[i][j].prev_out.value], 
							"sum_in": input_list[i][j].prev_out.value,
							"sum_out": 0,
							"from": [], //idx
							"to": [],
							"_children": []});
				}
			}			
		}
		// output list
		for (var j = 0; j < output_list[i].length; j++) { // for each output
			// decide the nodes's index
			// graph.init_nodes[cnt_node] = {"name": output_list[i][j].addr, "color_val": color_val[i], "times": 1, "amount": 1, "children": []};
			// check if it's been existed
			idx_output = this.addr_list.get(output_list[i][j].addr);
			//console.log("j="+j+"\n"+"addr="+output_list[i][j].addr+"\n"+"idx_output="+idx_output);
			if (idx_output == undefined) {
				// not existed yet
				graph.init_nodes[cnt_node] = 
						{"name": NickName(0, cnt_node),
						"addr": cnt_node,
						"time": [time_list[i]], "status": [0],
						"color_val": false, //i, 
						"times": 1, "amount": [output_list[i][j].value], 
						"sum_in": 0,
						"sum_out": output_list[i][j].value,
						"from": [], //idx
						"to": [],
						"_children": []};
				graph.init_nodes[cnt_node]._children[0] = 
						{"name": NickName(1, output_list[i][j].addr),
						"addr": output_list[i][j].addr,
						"time": [time_list[i]], "status": [0],
						"color_val": false, //color_val[i], 
						"times": 1, "amount": [output_list[i][j].value], 
						"sum_in": 0,
						"sum_out": output_list[i][j].value,
						"from": [], //idx
						"to": [],
						"_children": []};
				this.addr_list.put(output_list[i][j].addr, cnt_node);
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
				if (idx_addr == -1) {
					// has no such child here:: regarded as impossible
					console.log("error: child-parent mapping error");
				}
				graph.init_nodes[idx_output].time.push[time_list[i]];
				graph.init_nodes[idx_output].status.push(0); // output
				graph.init_nodes[idx_output].amount.push(output_list[i][j].value);
				graph.init_nodes[idx_output].sum_out += output_list[i][j].value;
				graph.init_nodes[idx_output]._children[idx_addr].time.push(time_list[i]);
				graph.init_nodes[idx_output]._children[idx_addr].status.push(0);//output
				graph.init_nodes[idx_output]._children[idx_addr].amount.push(output_list[i][j].value);
				graph.init_nodes[idx_output]._children[idx_addr].sum_out = output_list[i][j].value;
				//graph.init_nodes[idx_output]._children[idx_addr].from.push(idx_output);
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
				// haven't included
				if (idx_link == -1) {
					//graph.init_nodes[idx_input].to.push(idx_output);
					//graph.init_nodes[idx_output].from.push(idx_input);
					graph.init_links[cnt_link] = {"source": idx_input, "target": idx_output, "value": 1, "type": 1, "distance": 0};
					cnt_link++;
				}
			}
		}
	}
	/////
	delete tmp_map;
	graph.nodes = graph.init_nodes;
	graph.links = graph.init_links;
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
	this.pre_highlight_neighbor();
	// this.pre_highlight_chain();
	// this.pre_highlight_subgraph();
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
			/*
			if (d3.event.defaultPrevented) return; // ignore drag
			obj.click_node(d);
			console.log("click:" + d.index);
			console.log("in:");
			for (var i = 0; i < d.from.length; i++) {
				console.log(d.from[i]);
			}
			console.log("out:");
			for (var i = 0; i < d.to.length; i++) {
				console.log(d.to[i]);
			}
			*/
			return obj.click_node(d);
		})
		/// H for highlight
		.on('dblclick', function (d) {
			obj.connected_neighbor(d, obj);
			//obj.connected_chain(d, obj);
			//obj.connected_subgraph(d, obj);
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

Graph.prototype.update_graph_data = function () {
	var graph = this.graph;
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
							"value": 1, "type": 0, "distance": 0};
			}
			graph.child_nodes = graph.child_nodes.concat(graph.init_nodes[i].children);
		}
	}
	// combine together
	graph.nodes = graph.init_nodes.concat(graph.child_nodes);
	graph.links = graph.init_links.concat(graph.child_links); // link needs to be modified for it is marked as index
	this.graph = graph;
	return graph;
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
Graph.prototype.pre_highlight_subgraph = function() {
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
Graph.prototype.linking = function (a, b) {
	return this.linkedByIndex[a.index + "," + b.index];
}
Graph.prototype.connected_subgraph = function (d, obj) {
	if (obj.toggle == 0) {
		//Reduce the opacity of all but the neighbouring nodes
		obj.node.style("opacity", function (o) {
			// linked together
			if (obj.linking(d, o) || obj.linking(o, d)) {
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
/////////
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