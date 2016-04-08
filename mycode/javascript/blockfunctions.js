var FILE_DIR = "data/";
var G_WIDTH1 = $(window).width();//960;
var G_HEIGHT1 = $(window).height();//600;
//var width = document.getElementById("block_graph").clientWidth;
//var height = document.getElementById("block_graph").clientHeight;
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
	if (d._children && d._children.length > 0) {
		// totally collapsed
		colorRGB = colorB(d.color_val);
	}
	else if (d.children && d.children.length > 0) {
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
	//var width = G_WIDTH1, 
	//	height = G_HEIGHT1;
	var width = document.getElementById("block_graph").clientWidth;
	var height = width;//document.getElementById("block_graph").clientHeight;
	//console.log(G_WIDTH1, G_HEIGHT1, width, height);
	var force = d3.layout.force()
				.charge(-120)
				.linkDistance(30)
				.size([width, height]);
	d3.select("#block_graph_svg").remove();

	var svg = d3.select("#block_graph").append("svg")
				.attr("width", width)
				.attr("height", height)
				//.attr("class", "outlined")//debug
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
		.attr("r", function(d) { return SIZE_UNIT; }) // SIZE_UNIT*d.times? *d.amount?
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
	// the first tx
	input_list[0] = [{ "prev_out": {"addr": "0000000000000000000000000000000000"}}];
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
		var idx_input = -1;
		var idx_output = -1;
		// input list
		// judge if the person already exists // IMPORTANT: will consider merging two different points latter
		var cand_nodelist = []; // candidate node list
		var tmp_map = new Map();
		for (var j = 0; j < input_list[i].length; j++) {
			// decide the node's index (parent-child)
			//console.log("input i="+i+" j="+j+ "\naddr: " + input_list[i][j].prev_out.addr + "\nindex:"+ADDR_LIST.get(input_list[i][j].prev_out.addr)+"\n");
			var tmp = ADDR_LIST.get(input_list[i][j].prev_out.addr);
			var cand_nodelist_exist = tmp_map.get(tmp);
			if (tmp != undefined && cand_nodelist_exist != true) {
				cand_nodelist.push(tmp);
				tmp_map.put(tmp, true);
			}
		}
		delete tmp_map;
		// merge the nodes
		if (cand_nodelist.length > 0) {
			idx_input = cand_nodelist[0];
		}
		else{
			idx_input = -1;
		}
		/*
		console.log(cand_nodelist);
		for (var j = 0; j < cand_nodelist.length; j++) {
			console.log(cand_nodelist[j]);
			console.log(graph.init_nodes[cand_nodelist[j]]);
		}
		*/
		/*
		console.log("i="+i);
		ADDR_LIST.each(function(a,b,c){
			console.log(a+"\n"+b+"\n"+c+"\n")
		});*/

		// judge if there are same candidates within the candidate list
		/*
		for (var j = 0; j < cand_nodelist.length; j++) {
			for (var k = j + 1; k < cand_nodelist.length; k++) {
				if (cand_nodelist[j] == cand_nodelist[k]) {
					console.log("brilliant\n");
				}
			}
		}*/
		//console.log("i:"+i+"\n");
		for (var j = 1; j < cand_nodelist.length; j++) { // for each candicate // notice: what if two candidates are the same?
			// merge all of them onto idx_input by:
			console.log("Merging......"+"Node"+cand_nodelist[j]+".......to: Node"+idx_input)
			// 1. passing all the children
			//console.log("j:"+j+"\n");
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
				console.log(graph.init_nodes.length);
				//graph.init_nodes[cand_nodelist[j]] = graph.init_nodes[graph.init_nodes.length - 1];
				graph.init_nodes[cand_nodelist[j]] = graph.init_nodes[graph.init_nodes.length - 1];
				for (var k = 0; k < graph.init_nodes[graph.init_nodes.length-1]._children.length; k++) { // for each child
					ADDR_LIST.put(graph.init_nodes[graph.init_nodes.length-1]._children[k].addr, cand_nodelist[j]);
				}
			}
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
		}
		
		if (idx_input == -1) { // not yet inserted
			graph.init_nodes[cnt_node] = 
					{"name": NickName(0, cnt_node), 
					"addr": cnt_node,
					"color_val": i, "times": 1, "amount": 1, "_children": []};
			idx_input = cnt_node;
			for (var j = 0; j < input_list[i].length; j++) {
				// update information for each node
				ADDR_LIST.put(input_list[i][j].prev_out.addr, cnt_node);
				//console.log(ADDR_LIST.get(input_list[i][j].prev_out.addr));
				graph.init_nodes[cnt_node]._children[j] = 
						{"name": NickName(1, input_list[i][j].prev_out.addr), 
						"addr":input_list[i][j].prev_out.addr, 
						"color_val": color_val[i], "times": 1, "amount": 1, "_children": []};
			}
			cnt_node++;
		}
		else {
			// insert into graph.init_nodes[idx_input]
			for (var j = 0; j < input_list[i].length; j++) {
				// count++
				graph.init_nodes[idx_input].times++;
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
					//console.log(idx_addr+"\n"+input_list[i][j].prev_out.addr);
					//bug:block height200000 addr:17NKcZNXqAbxWsTwB1UJHjc9mQG3yjGALA,idx=-1
					//it must be that the addr isn't really pointing to this node
					graph.init_nodes[idx_input]._children[idx_addr].times++;
				}
				else {
					ADDR_LIST.put(input_list[i][j].prev_out.addr, idx_input);
					graph.init_nodes[idx_input]._children.push(
							{"name": NickName(1, input_list[i][j].prev_out.addr),
							"addr": input_list[i][j].prev_out.addr, 
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
						"color_val": i, "times": 1, "amount": 1, "_children": []};
				graph.init_nodes[cnt_node]._children[0] = 
						{"name": NickName(1, output_list[i][j].addr),
						"addr": output_list[i][j].addr,
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
				graph.init_nodes[idx_output]._children[idx_addr].times++;
			}
			// links
			//console.log("linking......"+graph.init_nodes[idx_input].addr+" with "+graph.init_nodes[idx_output].addr);
			var idx_link = -1;
			for (var k = 0; k < cnt_link; k++) {
				//
			}
			graph.init_links[cnt_link] = {"source": idx_input, "target": idx_output,"value": 1};
			cnt_link++;
		}
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