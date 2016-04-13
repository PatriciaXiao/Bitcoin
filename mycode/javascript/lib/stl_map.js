Array.prototype.remove = function(s) {
	for (var i = 0; i < this.length; i++) {
		if (s == this[i])
			this.splice(i, 1);
	}
}
 
/**
 * Simple Map
 * 
 * 
 * var m = new Map();
 * m.put('key','value');
 * ...
 * var s = "";
 * m.each(function(key,value,index){
 *	  s += index+":"+ key+"="+value+"\n";
 * });
 * alert(s);
 * 
 * @author dewitt
 * @date 2008-05-24
 * Last modified by Patricia Xiao
 * Date 2016-04-13
 */
function Map() {
	/** keys and data */
	this.keys = new Array();
	this.data = new Object();
	 
	/**
	 * put in a pair of <key, value>
	 * @param {String} key
	 * @param {Object} value
	 */
	this.put = function(key, value) {
		if(this.data[key] == null){
			this.keys.push(key);
		}
		this.data[key] = value;
	};
	 
	/**
	 * get the value of pair <key, value> with key
	 * @param {String} key
	 * @return {Object} value
	 */
	this.get = function(key) {
		return this.data[key];
	};
	 
	/**
	 * delete one
	 * @param {String} key
	 */
	this.remove = function(key) {
		this.keys.remove(key);
		this.data[key] = null;
	};
	 
	/**
	 * iterate through the who map and apply function fn to all the elements
	 * 
	 * @param {Function} callback function function(key,value,index){..}
	 */
	this.each = function(fn){
		if(typeof fn != 'function'){
			return;
		}
		var len = this.keys.length;
		for(var i=0;i<len;i++){
			var k = this.keys[i];
			fn(k,this.data[k],i);
		}
	};
	 
	/**
	 * get the keys array (likeas Java - entrySet())
	 * @return {key,value}'s array
	 */
	this.entrys = function() {
		var len = this.keys.length;
		var entrys = new Array(len);
		for (var i = 0; i < len; i++) {
			entrys[i] = {
				key : this.keys[i],
				value : this.data[i]
			};
		}
		return entrys;
	};
	 
	/**
	 * judge if the Map is an empty one
	 */
	this.isEmpty = function() {
		return this.keys.length == 0;
	};
	 
	/**
	 * amount of keys
	 */
	this.size = function(){
		return this.keys.length;
	};
	 
	/**
	 * rewrite toString 
	 */
	this.toString = function(){
		var s = "{";
		for(var i=0;i<this.keys.length;i++,s+=','){
			var k = this.keys[i];
			s += k+"="+this.data[k];
		}
		s+="}";
		return s;
	};

	this.clear = function(){
		delete this.keys;
		delete this.data;
		this.keys = new Array();
		this.data = new Object();
		return this.keys.length;
	}
}
 
 
function testMap(){
	var m = new Map();
	m.put('key1','hey');
	m.put('key2','hello');
	m.put('key3','world');
	alert("init:"+m);
	 
	m.put('key1','Heeeeey');
	alert("set key1:"+m);
	 
	m.remove("key2");
	alert("remove key2: "+m);
	 
	var s ="";
	m.each(function(key,value,index){
		s += index+":"+ key+"="+value+"\n";
	});
	alert(s);
}