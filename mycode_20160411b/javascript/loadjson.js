

/*
<h1 id = "test" onclick = "TestLoadJsonFile('data/test.json');">Click Here</h1>
*/
function TestLoadJsonFile(filename) {
	var data = $.getJSON(
		filename,
		function(jsondata){
			console.log(jsondata);
			console.log(jsondata.blocks[0].hash)
			data = jsondata;
		}
	);
	console.log(data);
	return data;
}

/// S for search
function searchNode() {

d3.json("data/test.json", function(error, graph) {
  if (error) throw error;

var optArray = [];
for (var i = 0; i < graph.nodes.length - 1; i++) {
    optArray.push(graph.nodes[i].name);
}
optArray = optArray.sort();
$(function () {
    $("#search").autocomplete({
        source: optArray
    });
});

    //find the node
    var selectedVal = document.getElementById('search').value;
    var node = svg.selectAll(".node");
    if (selectedVal == "none") {
        node.style("stroke", "white").style("stroke-width", "1");
    } else {
        var selected = node.filter(function (d, i) {
            return d.name != selectedVal;
        });
        selected.style("opacity", "0");
        var link = svg.selectAll(".link")
        link.style("opacity", "0");
        d3.selectAll(".node, .link").transition()
            .duration(5000)
            .style("opacity", 1);
    }
});

}

// test

function callit() {

var width = 960,
    height = 500;

    
var color = d3.scale.category20();

var force = d3.layout.force()
    .charge(-120)
    .linkDistance(30)
    .size([width, height]);

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);


d3.json("data/test.json", function(error, graph) {
  if (error) throw error;

  force
      .nodes(graph.nodes)
      .links(graph.links)
      .start();

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
/// A for Arrows
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
    } else {
        //Put them back to opacity=1
        node.style("opacity", 1);
        link.style("opacity", 1);
        toggle = 0;
    }
}
/// H




  var link = svg.selectAll(".link")
      .data(graph.links)
    .enter().append("line")
      .attr("class", "link")
      /// A for Arrows
      .style("marker-end",  "url(#suit)")// Modified line 
      /// A for Arrows
      .style("stroke-width", function(d) { return Math.sqrt(d.value); });


  var node = svg.selectAll(".node")
      .data(graph.nodes)
    .enter().append("circle")
      .attr("class", "node")
      .attr("r", 5)
      .style("fill", function(d) { return color(d.group); })
      .call(force.drag)//;
      /// H for highlight
      .on('dblclick', connectedNodes)//; //Added code 
      /// H
      .call(force.drag);




  node.append("title")
      .text(function(d) { return d.name; });

  force.on("tick", function() {
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
    /// C for collision detection
    node.each(collide(0.5)); //Added 
    /// C
  });


var fisheye = d3.fisheye.circular()
    .radius(200)
    .distortion(2);


svg.on("mousemove", function() {
  fisheye.focus(d3.mouse(this));

  node.each(function(d) { d.fisheye = fisheye(d); })
      .attr("cx", function(d) { return d.fisheye.x; })
      .attr("cy", function(d) { return d.fisheye.y; })
      .attr("r", function(d) { return d.fisheye.z * 4.5; });

  link.attr("x1", function(d) { return d.source.fisheye.x; })
      .attr("y1", function(d) { return d.source.fisheye.y; })
      .attr("x2", function(d) { return d.target.fisheye.x; })
      .attr("y2", function(d) { return d.target.fisheye.y; });
});



});



}
