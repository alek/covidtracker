var exclusionList = ["Others"]

var countrySynonyms = {
	"Mainland China" : "China",
	"United Kingdom" : "UK",
	"Korea, South" : "South Korea",
	"Taiwan*" : "Taiwan",
	"Iran (Islamic Republic of)": "Iran",
	"Taipei and environs": "Taiwan",
	"occupied Palestinian territory": "Israel",
	"Viet Nam": "Vietnam",
	"Russian Federation": "Russia"
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

	// var cellSize = window.innerWidth/(data.length*2.5)
	var cellIncrement = 80/(data.length*1.2)
	var cellSize = (cellIncrement/100)*window.innerWidth
	
	var grid = $("<div>").attr('id', 'grid')
	grid.css({"grid-template-columns": "repeat(" + (data.length-1) + ", "  + cellIncrement + "%) 20%"})
	$("#grid-container").append(grid)

	// aggregate counts per location

	var confirmedCounts = {}
	var deathCounts = {}
	var recoveredCounts = {}

	for (var i=0; i<data.length; i++) {
		var date = data[i]['date']
		var entries = data[i]['entries']
		for (var j=0; j<entries.length; j++) {
			var location = getLocation(entries[j])
			if (exclusionList.includes(location)) {
				continue
			}
			if (!confirmedCounts[location]) {
				confirmedCounts[location] = new Array(data.length).fill(0);
				deathCounts[location] = new Array(data.length).fill(0);
				recoveredCounts[location] = new Array(data.length).fill(0);
			}
			if (entries[j]["Confirmed"]) {
				confirmedCounts[location][i] += parseInt(entries[j]["Confirmed"])
			}
			if (entries[j]["Deaths"]) {
				deathCounts[location][i] += parseInt(entries[j]["Deaths"])
			}
			if (entries[j]["Recovered"]) {
				recoveredCounts[location][i] += parseInt(entries[j]["Recovered"])
			}
		}
	}

	// render grid

	var rendered = 0	
	for (location in confirmedCounts) {
		if (rendered++ > 100) {
			break
		}
		for (var i=1; i<confirmedCounts[location].length; i++) {
			// var confirmed = gridCounts[location][i]
			var confirmed = (confirmedCounts[location][i] - confirmedCounts[location][i-1])
			var dim = Math.min(1+confirmed/100,8) + "px"

			var entry = $("<div>").addClass("grid-entry")
			entry.css({"width": dim, "height": dim, "background-color": getColor(confirmed)})
			$("#grid").append(entry)
			lastConfirmed = confirmed
		}
		var lastVal = confirmedCounts[location].slice(-1)
		var entry = $("<div>" + location + " (" + lastVal.toLocaleString() + ")</div>").addClass("row-label").attr("location",location).css({"color": getColor(lastVal)})

		entry.hover(function() { 
			let l =  $(this).attr("location")
			let lastCount = confirmedCounts[l].slice(-1)
			$("#metadata-container").empty()
			$("#metadata-container").append("<h2>" + l + "</h2>")
									.append("<h4><b>" + confirmedCounts[l].slice(-1).toLocaleString() + "</b> cases confirmed</h4>")
									.append("<h4><b>" + deathCounts[l].slice(-1).toLocaleString() + "</b> deaths</h4>")
									.append("<h4><b>" + recoveredCounts[l].slice(-1).toLocaleString() + "</b> recovered</h4>")
		})

		$("#grid").append(entry)		
	}

	// add the grid element

	console.log(new Date() - start + " ms")

})