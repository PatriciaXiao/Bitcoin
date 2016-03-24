

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
