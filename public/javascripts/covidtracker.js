
//
// normalize different representations 
// of the same entity in the data
//
function normalize(entry) {
	if (entry == "Mainland China") {
		return "China"
	} else if (entry == "United Kingdom") {
		return "UK"
	} else if (entry == "Korea, South") {
		return "South Korea"
	} else if (entry == "Taiwan*") {
		return "Taiwan"
	}
}

function getLocation(entry) {
	var location = entry['Country/Region']
	if (!location) {
		location = entry['Country_Region']
	}
	// also Province/State || Province_State
	return normalize(location)
}

function randomColor(opacity) {
	if (!opacity) {
		opacity = 1.0
	}
	let scale = ["63,177,159", "244,190,44", "241,121,84", "192,69,116"]
	return "rgba(" + scale[Math.floor(Math.random()*scale.length)] + "," + opacity + ")"
}

$(document ).ready(function() {
	var data = getCovidData()
	var start = new Date()
	var cnt = 0

	// add the container grid
	var grid = $("<div>").attr('id', 'grid')
	grid.css({"grid-template-columns": "repeat(" + data.length + ", 10px)"})
	$("body").append(grid)


	for (var i=0; i<data.length; i++) {
		var date = data[i]['date']
		var entries = data[i]['entries']
		for (var j=0; j<entries.length; j++) {
			var location = getLocation(entries[i])
			var entry = $("<div>").addClass("grid-entry")
			var dim = 10*Math.random() + "px"
			entry.css("background-color", "#fff").css({"width": dim, "height": dim, "background-color": randomColor()})
			$("#grid").append(entry)
		}
	}

	// add the grid element

	console.log(new Date() - start + " ms")
})