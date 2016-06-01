// only applied to person node, not address node
function UnionFindMap() {
	// union find algorithm implementation
	this.count_groups = 0; // number of groups
	this.group_id = [];
	this.group_size = [];
	this.addr_idx_map = new Map();
	this.addr_list = [];
}

UnionFindMap.prototype.init = function(N) {
	this.count_groups = N;
	for (var i = 0; i < N; i++){
		this.group_id[i] = i;
		this.group_size[i] = 1;
	}
}

UnionFindMap.prototype.insert = function(addr) {
	if (this.addr_idx_map.get(addr) == undefined) {
		// haven't been inserted yet
		var id_len = this.group_id.length;
		var addr_len = this.addr_list.length;
		this.count_groups++;
		this.group_id.push(id_len);
		this.group_size.push(1);
		this.addr_idx_map.put(addr, addr_len);
		this.addr_list.push(addr);
	}
}

UnionFindMap.prototype.find = function(idx) {
	var goal_id = idx
	while (goal_id != this.group_id[goal_id]) {    
		this.group_id[goal_id] = this.group_id[this.group_id[goal_id]];  
		goal_id = this.group_id[goal_id];  
	}
	return goal_id;
}

UnionFindMap.prototype.union = function(p, q) { 
	var group_idx_p = this.find(p);  
	var group_idx_q = this.find(q);  
	if (group_idx_p != group_idx_q) {
		// link the smaller one to the larger one
		if (this.group_size[group_idx_p] < this.group_size[group_idx_q]) {
			this.group_id[group_idx_p] = group_idx_q;
			this.group_size[group_idx_p] += this.group_size[group_idx_q];
		}
		else {
			this.group_id[group_idx_q] = group_idx_p;
			this.group_size[group_idx_q] += this.group_size[group_idx_p];
		}
		this.count_groups--;
	}
}



function UnionFind() {
	// union find algorithm implementation
	this.count_groups = 0; // number of groups
	this.group_id = [];
	this.group_size = [];
}

UnionFind.prototype.init = function(N) {
	this.count_groups = N;
	for (var i = 0; i < N; i++){
		this.group_id[i] = i;
		this.group_size[i] = 1;
	}
}

UnionFind.prototype.find = function(idx) {
	var goal_id = idx
	while (goal_id != this.group_id[goal_id]) {    
		this.group_id[goal_id] = this.group_id[group_id[goal_id]];  
		goal_id = this.group_id[goal_id];  
	}
	return goal_id;
}

UnionFind.prototype.union = function(p, q) { 
	var group_idx_p = this.find(p);  
	var group_idx_q = this.find(q);  
	if (group_idx_p != group_idx_q) {
		// link the smaller one to the larger one
		if (this.group_size[group_idx_p] < this.group_size[group_idx_q]) {
			this.group_id[group_idx_p] = group_idx_q;
			this.group_size[group_idx_p] += this.group_size[group_idx_q];
		}
		else {
			this.group_id[group_idx_q] = group_idx_p;
			this.group_size[group_idx_q] += this.group_size[group_idx_p];
		}
		count_groups--;
	}
}
