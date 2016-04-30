var vis = d3.select("#content").append("svg")
    .attr("width", width)
    .attr("height", height);
var force = d3.layout.force()
    .nodes(nodes)
    .links([])
    .size([width, height]);
force.on("tick", function(e) {
  vis.selectAll("path")
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
});
