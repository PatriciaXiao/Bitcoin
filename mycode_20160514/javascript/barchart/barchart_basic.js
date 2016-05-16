function bar_chart_data(rawdata) {
	// input_list
	var input_list = [];
	var data = [];
	var sum_in;
	input_list[0] = [{ "prev_out": {"addr": "0000000000000000000000000000000000", "value": rawdata.blocks[0].tx[0].out[0].value}}];
	for (var i = 1; i < rawdata.blocks[0].tx.length; i++) {
		input_list[i] = rawdata.blocks[0].tx[i].inputs;
	}
	// each element
	for (var i = 0; i < rawdata.blocks[0].tx.length; i++) {
		sum_in = 0;
		for (var j = 0; j < input_list[i].length; j++) {
			sum_in += input_list[i][j].prev_out.value;
		}
		sum_in /= 1000000;
		data[i] = {"index": i, "input": sum_in};
	}
	return data;
}

var BAR_WIDTH = 30;

function showbarchart_basic(data) {

	// console.log(d3.max(data, function(d) { return d.input;}));
	var biasY_ratio = 0.1;
	var maxY = d3.max(data, function(d) { return d.input;});
	var bias = maxY * biasY_ratio;
	var ratio = 0.3;
	var margin = {top: 20, right: 20, bottom: 30, left: 40};
	//var width = document.getElementById("block_slider").clientWidth - margin.left - margin.right;
	//var height = width * ratio - margin.top - margin.bottom;
	var width = data.length * BAR_WIDTH - margin.left - margin.right;
	var height = document.getElementById("block_slider").clientWidth * ratio - margin.top - margin.bottom;

	var x = d3.scale.ordinal()
				.rangeRoundBands([0, width], .1);

	var y = d3.scale.linear()
				.range([height, 0]);

	var xAxis = d3.svg.axis()
				.scale(x)
				.orient("bottom");

	var yAxis = d3.svg.axis()
				.scale(y)
				.orient("left")//;
				//.ticks(10, "%");
				.tickFormat(d3.format(".2s"));

	d3.select("#block_slider_svg").remove();
	var svg = d3.select("#block_slider").append("svg")
				.attr("id", "block_slider_svg") //;
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom)
				.append("g")
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	x.domain(data.map(function(d) { return d.index; }));
	y.domain([0, d3.max(data, function(d) { 
		//return d.input;
		return d.input + bias;
	})]);

	svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis);

	svg.append("g")
			.attr("class", "y axis")
			.call(yAxis)
		.append("text")
			.attr("transform", "rotate(-90)")
			.attr("y", 6)
			.attr("dy", ".71em")
			.style("text-anchor", "end")
			.text("Input Bitcoins");

	svg.selectAll(".bar")
		.data(data)
		.enter().append("rect")
		.attr("class", "bar")
		.attr("width", x.rangeBand())
		.attr("x", function(d) { return x(d.index); })
		.attr("y", function(d) { 
			//return y(d.input);
			return y(d.input + bias); 
		})
		.attr("height", function(d) { 
			// return height - y(d.input);
			return height - y(d.input + bias);  
		})//;
		.on("click", function(d) {
			// do something
			console.log(d.input);
		});

	function type(d) {
		// d.input = +d.input;
		d.input = +(d.input + bias);
		return d;
	}

}