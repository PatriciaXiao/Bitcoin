	function timeConverter(UNIX_timestamp){
	 var a = new Date(UNIX_timestamp*1000);
	 var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
	     var year = a.getFullYear();
	     var month = months[a.getMonth()];
	     var date = a.getDate();
	     var hour = a.getHours();
	     var min = a.getMinutes();
	     var sec = a.getSeconds();
	     var time = date+' '+month+' '+year+' '+hour+':'+min+':'+sec ;
	     return time;
	 }

	d3.json("data/block.json",function(originalData){
	  	var data=originalData.blocks[0].tx
	  	console.log(data)
	  	minList=0
	  	maxList=data.length
	  	rangeList=maxList-minList
	  	console.log(window.screen.availWidth)
	  	console.log("dddddddd")
	  	var width = 1200;
	  	var height = 150;
	  	//在 body 里添加一个 SVG 画布	
	  	var svg = d3.select(".timeLine")
	  		.append("svg")
	  		.attr("width", width)
	  		.attr("height", height);
	  	//画布周边的空白
	  	var padding = {left:50, right:5, top:5, bottom:60};
	  	//x轴的比例尺
	  	var xScale = d3.scale.linear()
	  		.domain([minList,maxList])
	  		.rangeRound([0, width - padding.left - padding.right]);

	  	console.log(d3.max(data, function(d) { return d.output; }))

	  	var yScale = d3.scale.linear()
	  		.domain([0, d3.max(data, function(d) { return d.output; })])
	  		.range([height - padding.top - padding.bottom, 0]);
	  	//定义x轴
	  	var xAxis = d3.svg.axis()
	  		.scale(xScale)
	  		.orient("bottom")
	  		.ticks(rangeList/20)
	 
	  	var yAxis = d3.svg.axis()
	  		.scale(yScale)
	  		.orient("left")
	  		.ticks(10)
	  		.tickSubdivide(5);
	  	//矩形之间的空白
	  	var rectPadding = 1;
	  	//添加矩形元素
	  	var rects = svg.selectAll(".MyRect")
	  		.data(data)
	  		.enter()
	  		.append("rect")
	  		.attr("class","MyRect")
	  		.attr("transform","translate(" + padding.left + "," + padding.top + ")")
	  		.attr("x", function(d,i){
	  			//console.log(d.date)
	  			return xScale(i);
	  		})
	  		.attr("y",function(d){
	  			return yScale(d.output);
	  		})
	  		.attr("width",(width - padding.left - padding.right)*0.9/rangeList)
	  		.attr("height", function(d){
	  			return height - padding.top - padding.bottom - yScale(d.output);
	  		})
	  		.attr("fill","black")		//填充颜色不要写在CSS里
	  		.on("mouseover",function(d,i){
	  			d3.select(this)
	  				.attr("fill","grey");
	  		})
	  		.on("mouseout",function(d,i){
	  			d3.select(this)
	  				.transition()
	  		        .duration(500)
	  				.attr("fill","black");
	  		});
	  		maxTotal=d3.max(data, function(d) { return d.output; })

	  		var rects = svg.selectAll(".moveBar")
	  			.data([2])
	  			.enter()
	  			.append("rect")
	  			.attr("class","moveBar")
	  			.attr("transform","translate(" + padding.left + "," + padding.top + ")")
	  			.attr("x", function(d,i){
	  				//console.log(xScale(new Date(data[0].date)))
	  				return xScale(minList);
	  			})
	  			.attr("y",function(d){
	  				//console.log(yScale(maxTotal))
	  				return yScale(maxTotal);
	  			})
	  			.attr("width",(width - padding.left - padding.right)*0.9/rangeList)
	  			.attr("height", function(d){
	  				//console.log(height- padding.top - padding.bottom - yScale(maxTotal))
	  				return height- padding.top - padding.bottom - yScale(maxTotal);
	  			})
	  			.attr("opacity",0.5)
	  			.attr("fill","white")
	  			.attr("stroke","black")		//填充颜色不要写在CSS里
	  		speed=200
	  		var interval=minList;
	  		var startPlay=function(){
	  			interval+=1
	  			interval=minList+(interval-minList)%rangeList
	  			d3.select('.moveBar').attr("x",xScale(interval))
	  			
	  			drawPoint(data[interval].lat,data[interval].lon)
	  			console.log(data[interval].relayed_by)

	  			amount=data[interval].output
	  			nowTime=timeConverter(data[interval].time)
	  			myip=data[interval].relayed_by
	  			country=data[interval].country

	  			detailInfo="Amount: "+amount+"BTC<br>Time: "+nowTime+"<br>Relayed by: "+myip+"<br>Country: "+country;
   				document.getElementById("detial").innerHTML= detailInfo;
	  		}
	  		d3.select('#playButton').on('click',function(d){
	  			var state=$("#playSpan").attr("class")
	  			if(state=="glyphicon glyphicon-play")
	  			{
	  				timeControl = self.setInterval(startPlay,200);
	  				$("#playSpan").attr("class","glyphicon glyphicon-pause");
	  			}
	  			else
	  			{
	  				timeControl = window.clearInterval(timeControl);
	  				$("#playSpan").attr("class","glyphicon glyphicon-play");
	  			}		
	  		});	
	  	
	  	//添加x轴
	  	svg.append("g")
	  		.attr("class","axis")
	  		.attr("transform","translate(" + padding.left + "," + (height - padding.bottom) + ")")
	  		.call(xAxis); 
	  	//添加y轴
	  	svg.append("g")
	  		.attr("class","axis")
	  		.attr("transform","translate(" + padding.left + "," + padding.top + ")")
	  		.call(yAxis);
	});

