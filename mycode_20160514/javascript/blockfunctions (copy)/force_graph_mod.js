function Node(oldnode) {
	//
	console.log("hello?");
}

function Node(cnt_node) {
	this.name = NickName(0, cnt_node); 
	this.addr = cnt_node;
	this.time = [];
	this.status = [];
	this.color_val = false; //i,
	this.times = 1;
	this.amount=[];
	this._children=[];
}

Node.prototype.copy = function() {
	newNode = new Node(this.addr);
	return newNode;
}

function CollapsibleGraph() {
	var graph;
}