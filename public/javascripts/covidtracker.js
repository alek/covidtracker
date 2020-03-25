var exclusionList = ["Others"]

var countrySynonyms = {
	"Mainland China" : "China",
	"United Kingdom" : "UK",
	"Korea, South" : "South Korea",
	"Taiwan*" : "Taiwan",
	"Iran (Islamic Republic of)": "Iran",
	"Taipei and environs": "Taiwan",
	"occupied Palestinian territory": "Israel"
}

//
// normalize different representations 
// of the same entity in the data
//
function normalize(entry) {
	if (countrySynonyms[entry]) {
		return countrySynonyms[entry]
	} else {
		return entry
	}
}

//
// get location for a given entry
// (warning: CSSE data is messy/inconsistent - hacks are needed)
//
function getLocation(entry) {

	// march 23 format change hack
	if (entry['Country_Region']) {		
		entry['Country/Region'] =entry['Country_Region']
	}

	if (entry['Province_State']) {		
		entry['Province/State'] = entry['Province_State']
	}

	var location = entry['Country/Region']

	if (entry['Province/State'] == "Hong Kong") {
		location = "Hong Kong"
	}
	if (entry['Province/State'] == "Macau") {
		location = "Macau"
	}

	return normalize(location)
}

//
// get color corresponding to the given intensity value
//
function getColor(intensity) {
	let scale = ["63,177,159", "244,190,44", "241,121,84", "192,69,116"]
	return "rgba(" + scale[Math.min(scale.length-1, Math.floor(intensity/1000))] + "," + (0.2 + intensity/100)  +")"
}


//
// grid init etc.
//
$(document ).ready(function() {
	
	var data = getCovidData()
	var start = new Date()

	// add the container grid
	
	var grid = $("<div>").attr('id', 'grid')
	grid.css({"grid-template-columns": "repeat(" + data.length + ", 8px) 20%"})
	$("body").append(grid)

	// aggregate counts per location

	var gridCounts = {}

	for (var i=0; i<data.length; i++) {
		var date = data[i]['date']
		var entries = data[i]['entries']
		for (var j=0; j<entries.length; j++) {
			var location = getLocation(entries[j])
			if (exclusionList.includes(location)) {
				continue
			}
			if (!gridCounts[location]) {
				gridCounts[location] = new Array(data.length).fill(0);
			}
			if (entries[j]["Confirmed"]) {
				gridCounts[location][i] += parseInt(entries[j]["Confirmed"])
			}
		}
	}

	// render grid
	
	for (location in gridCounts) {
		for (var i=0; i<gridCounts[location].length; i++) {
			var confirmed = gridCounts[location][i]
			var dim = Math.min(1+confirmed/100,8) + "px"

			var entry = $("<div>").addClass("grid-entry")
			entry.css({"width": dim, "height": dim, "background-color": getColor(confirmed)})
			$("#grid").append(entry)
			lastConfirmed = confirmed
		}
		var entry = $("<div>" + location + "</div>").addClass("row-label").css({"color": getColor(gridCounts[location].slice(-1)[0])})
		$("#grid").append(entry)		
	}

	// add the grid element

	console.log(new Date() - start + " ms")

})