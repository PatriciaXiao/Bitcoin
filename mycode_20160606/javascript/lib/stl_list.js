//http://blog.csdn.net/anialy/article/details/7732652
var ListNode = function(newData){  
	this.next = null;  
	this.data = null;  
	this.Init = function(){  
		this.data = newData;  
	};  
	this.Init();  
}  
//definition of List class   
var List = function(){  
	this.head = null;  
	this.size = 0;  
	this.Init = function(){  
		this.head = null;  
		this.size = 0;  
	}  
	this.Init();  
		  	
	this.Insert = function(newData){  
		this.size += 1;  
		var newNode = new ListNode(newData);  
		if(this.head == null){  
			this.head = newNode;  
			return;  
		}  
		var tempNode = this.head;  
		while(tempNode.next != null)  
			tempNode = tempNode.next;  
		tempNode.next = newNode;  
	};  
		  
	this.GetData = function(pos){  
		if(pos >= this.size || pos < 0)  
			return null;	
		else {
			tempNode = this.head;  
			for(i = 0;i < pos;i++)	
				tempNode = tempNode.next;	
			return tempNode.data;	
		}
	}
		  
	//remove the element at pos  
	this.Remove = function(pos){  
		if(pos >= this.size || pos < 0)  
			return null;	  
		this.size -= 1;  
		tempNode = this.head;  
		if(pos == 0){  
			this.head = this.head.next;  
			return this.head;  
		}  
		for(i = 0;i < pos - 1;i++){  
			tempNode = tempNode.next;  
		}  
		tempNode.next = tempNode.next.next;  
		return tempNode.next;  		  
	}  
		  
	this.Print = function(){  
		console.log("elements in list as follows: \n");  
		tempNode = this.head;  
		while(tempNode != null){  
			console.log(tempNode.data + " ");  
			tempNode = tempNode.next;  
		}  
		console.log("\n");  
	};  
};  
	  
//RUN TEST:
function test_list() {}
	var array = new Array(1,2,3,4,5,6); 
	var list = new List();  
	var array = new Array(1,2,3,4,5,6);  
	for(i = 0;i < array.length;i++){  
		list.Insert(array[i]);  
	}  
	list.Print();  
	console.log("now remove action: \n");  
	list.Remove(5);  
	list.Print();  
	console.log("new size after Remove list[5]:  " + list.size);
}