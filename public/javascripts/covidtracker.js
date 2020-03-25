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
function getColor(intensity, forceVisible) {
	let scale = ["63,177,159", "244,190,44", "241,121,84", "192,69,116"]
	var color = scale[Math.min(scale.length-1, Math.floor(intensity/1000))]
	var opacity = ((intensity > 2 ? 0.5 : 0) + intensity/100)
	if (opacity < 0.1 && forceVisible) {
		opacity = 0.5
	}
	return "rgba(" + color + "," + opacity  +")"
}

//
// grid init etc.
//
$(document ).ready(function() {
	
	var data = getCovidData()
	var start = new Date()

	// add the container grid

	var cellIncrement = 80/(data.length*1.4)
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

	// render dates
	for (var i=1; i<data.length; i++) {
		var entry = $("<div>").addClass("grid-header").attr("id", "header-" + i)
		entry.text(data[i]['date'].split("-").slice(0,2).join(" "))		
		$("#grid").append(entry)
	}

	$("#grid").append($("<div>"))	// padding

	// render grid

	var rendered = 0	
	for (location in confirmedCounts) {
		
		if (rendered++ > 100) { break } // TODO: add proper pagination

		for (var i=1; i<confirmedCounts[location].length; i++) {
			var confirmed = (confirmedCounts[location][i] - confirmedCounts[location][i-1])
			var radius = Math.min(Math.ceil(1+confirmed/50),8) + "px"

			var entry = $("<div>").addClass("grid-entry").attr("index",i)
			entry.css({"width": radius, "height": radius, "background-color": getColor(confirmed)})

			// row entry hover
			entry.hover(function() { 		// mouseover
				let idx = $(this).attr("index")
				$("#header-" + idx).css({"color": "#fff"})
			},function() { 					// mouseout
				let idx = $(this).attr("index")
				$("#header-" + idx).css({"color": "rgba(255,255,255,0.4)"})
			})

			$("#grid").append(entry)
			lastConfirmed = confirmed
		}


		var lastVal = confirmedCounts[location].slice(-1)
		var color = getColor(lastVal, true)
		var entry = $("<div>" + location + " (" + lastVal.toLocaleString() + ")</div>")
						.addClass("row-label")
						.attr({"location": location, "color": color})
						.css({"color": color})


		// row label hover
		entry.hover(function() { 
			let l =  $(this).attr("location")
			let lastCount = confirmedCounts[l].slice(-1)
			var delta = confirmedCounts[l].slice(-1) - confirmedCounts[l].slice(-2)[0]
			$("#metadata-container").empty()
			$("#metadata-container").append($("<h2>").text(l).css("color", $(this).attr("color")))
									.append("<h4><b>" + confirmedCounts[l].slice(-1).toLocaleString() + "</b> cases confirmed</h4>")				
									.append($("<h5>").html("<b>" + ((delta > 0) ? "+" : "-") + " " + delta.toLocaleString() + "</b> new case" + ((delta > 1) ? "s" : "")).css("color", $(this).attr("color")))
									.append("<h4><b>" + deathCounts[l].slice(-1).toLocaleString() + "</b> deaths</h4>")
									.append("<h4><b>" + recoveredCounts[l].slice(-1).toLocaleString() + "</b> recovered</h4>")
		})

		$("#grid").append(entry)		
	}

	// add the grid element

	console.log(new Date() - start + " ms")

})