//
// Interactive grid rendering of the JHU CSSE data
//

const renderConfig = {
	TYPE: {
		TOTAL: "Total",
		DELTA: "New"
	},
	VARIABLE: {
		CONFIRMED: "Confirmed",
		// ACTIVE: "Active",		// sparse coverage - disable for now
		RECOVERED: "Recovered",
		DEATHS: "Deaths"
	},
	FIELDS : {
		COUNTRY: "Country/Region",
		STATE: "Province/State",
		COUNTY: "County"
	},
	SORT: {
		TIME: "Time",
		CASES: "Cases"
	}
}

// load-time defaults
var renderType = renderConfig.TYPE.DELTA
var renderVariable = renderConfig.VARIABLE.CONFIRMED
var aggregateField = renderConfig.FIELDS.COUNTRY
var sortCriteria = renderConfig.SORT.TIME

//
// get color corresponding to the given intensity value
//
function getColor(intensity, forceVisible) {
	let scale = ["63,177,159", "244,190,44", "241,121,84", "192,69,116"]
	let color = scale[Math.min(scale.length-1, Math.floor(intensity/1000))]
	let opacity = ((intensity > 2 ? 0.5 : 0) + intensity/100)
	if (opacity < 0.1 && forceVisible) {
		opacity = 0.5
	}
	return "rgba(" + color + "," + opacity  +")"
}

//
// render metadata section
//
function renderMetadata(location, confirmed, deaths, recovered, date, delta, color) {
	$("#location-metadata").empty()
	$("#location-metadata").append("<h6>" + date + "</h6>")				
							.append($("<h2>").text(location).css("color", color))
							.append("<h4><b>" + confirmed.toLocaleString() + "</b> cases confirmed</h4>")				
							.append($("<h5>").html("<b>" + ((delta >= 0) ? "+" : "-") + " " + delta.toLocaleString() + "</b> new case" + ((delta > 1) ? "s" : "")).css("color", color))
							.append("<h4><b>" + deaths.toLocaleString() + "</b> deaths</h4>")
							.append("<h4><b>" + recovered.toLocaleString() + "</b> recovered</h4>")

}

//
// get total count for a given index value
//
function getCount(dict, index) {
	let result = 0
	for (let key in dict) {
		result += dict[key][index]
	}
	return result
}

//
// find last nonzero value in the array
//
function getLastNonzero(array) {
	if (array.length > 0) {
		for (let i=array.length-1; i>0; i--) {
			if (array[i] != 0) {
				return {"index": i, "value": array[i]}
			}
		}
	} 
	return 0
}

//
// find the last available change in the array
//
function getLastDelta(array) {
	let last = null
	if (array.length > 1) {
		for (let i=array.length-1; i>0; i--) {
			if (array[i] != 0) {
				if (!last) {
					last = array[i]
				} else {
					return last - array[i]
				}
			}
		}

	}
	return 0
}

//
// render main infographics grid
//
function renderGrid(data, counts, gridWidth, start, end) {

	if (!start) { start = 0 }
	if (!end) { end = 100 }

	var locations = {}

	// explicit url param location list override

	let searchParams = new URLSearchParams(window.location.search)
	if (searchParams.has("locations")) {
		let parts = searchParams.get("locations").split(",")
		for (let i in parts) {
			locations[parts[i]] = i
		}
	} else {
		locations = counts[renderVariable]		
	}

	// location resorting
	if (searchParams.has("sort") && (searchParams.get("sort").toLowerCase() == "cases")) {
		let keys = Object.keys(locations)
		keys = keys.sort(function(a,b) { 
			return getLastNonzero(counts[renderVariable][b])["value"] - getLastNonzero(counts[renderVariable][a])["value"]
		})
		let result = {}
		for (let i in keys) {
			result[keys[i]] = locations[keys[i]]
		}
		locations = result
	}

	$("#grid").empty() 	// clear any existing grid

	// render dates
	for (let i=0; i<data.length; i++) {
		let entry = $("<div>").addClass("grid-header").attr("id", "header-" + i)
		entry.text(data[i]['date'].split("-").slice(0,2).join(" "))		
		$("#grid").append(entry)
	}

	$("#grid").append($("<div>"))	// padding

	let rendered = 0	
	for (let location in locations) {
		
		if (rendered++ > end) { break } // TODO: add proper pagination
		if (rendered < start) { continue }

		if (!counts[renderVariable][location]) {
			continue
		}

		for (let i=0; i<counts[renderVariable][location].length; i++) {

			let metric = null
			let radius = null

			switch(renderType) {
				case renderConfig.TYPE.DELTA:
					metric = (counts[renderVariable][location][i] - (i > 0 ? counts[renderVariable][location][i-1] : 0))
					break
				case renderConfig.TYPE.TOTAL:
					metric = counts[renderVariable][location][i]
			}

			radius = Math.min(Math.ceil(1+metric/50),7) + "px"

			let entry = $("<div>").addClass("grid-entry").attr("index",i).attr("location",location)
			entry.css({"width": radius, "height": radius, "background-color": getColor(metric)})

			// row entry hover
			entry.hover(function() { 		// mouseover

				let idx = $(this).attr("index")
				let location = $(this).attr("location")
				$("#header-" + idx).css({"color": "#fff"})

				let delta = 0
				if (idx > 0) {
					delta = counts["Confirmed"][location][idx] - counts["Confirmed"][location][idx-1]
				}

				renderMetadata(location, 
							counts["Confirmed"][location][idx], 
							counts["Deaths"][location][idx],
							counts["Recovered"][location][idx],
							data[idx]["date"], 
							delta,
							getColor(delta, true))

			},function() { 					// mouseout
				let idx = $(this).attr("index")
				$("#header-" + idx).css({"color": "rgba(255,255,255,0.4)"})
			})

			$("#grid").append(entry)
		}

		let lastVal = getLastNonzero(counts[renderVariable][location])["value"]
		if (!lastVal) { lastVal = 0 } // for grid consistency

		let color = getColor(lastVal, true)		
		let entry = $("<div>" + location + " (" + lastVal.toLocaleString() + ")</div>")
						.addClass("row-label")
						.attr({"location": location, "color": color})
						.css({"color": color})


		// row label hover
		entry.hover(function() { 
			let l =  $(this).attr("location")
			let lastEntry = getLastNonzero(counts[renderVariable][l])
			let lastCount = lastEntry["value"]
			let lastIndex = lastEntry["index"]			
			let delta = getLastDelta(counts[renderVariable][l])
			renderMetadata(l, counts, data[lastIndex]["date"], delta, getColor(delta),data.length-1)

			renderMetadata(l, 
							counts["Confirmed"][l][lastIndex], 
							counts["Deaths"][l][lastIndex],
							counts["Recovered"][l][lastIndex],
							data[lastIndex]["date"], 
							delta,
							getColor(delta, true))
		})

		// row label click
		if (!searchParams.has("country")) {
			entry.click(function() {
				let searchParams = new URLSearchParams(window.location.search)
				searchParams.set("country", $(this).attr("location"))				
				window.location.href = "?" + searchParams
			})
		} else if (searchParams.get("country") == "US" && !searchParams.has("state")) {	// US state drilldown
			entry.click(function() {
				let searchParams = new URLSearchParams(window.location.search)
				searchParams.set("state", $(this).attr("location"))				
				window.location.href = "?" + searchParams
			})
		}

		$("#grid").append(entry)	


	}

	// add global stats
	
	// hack for the nytimes 1 day time slip
	let index = data.length-1
	if (getCount(counts["Confirmed"], index) == 0) {
		index = index -1
	}

	let delta = getCount(counts["Confirmed"], index) - getCount(counts["Confirmed"], index-1)

	renderMetadata(searchParams.has("country") ? (searchParams.has("state") ? searchParams.get("state") : searchParams.get("country")) : "Worldwide", 
					getCount(counts["Confirmed"], index), 
					getCount(counts["Deaths"], index),
					getCount(counts["Recovered"], index),
					data[index] ? data[index]["date"] : "", 
					delta,
					getColor(delta))	

	// reveal the legend section
	$(".legend-entries").css("width", gridWidth + "px")
	$("#legend").show()
	$("#loader").hide()

}

function updateFilters() {
	let variableText = renderVariable.replace("Confirmed", "Cases") 
	$("#type-label").text(renderType)		
	$("#main-title").text("COVID-19 Daily " + renderType + " " + variableText)
	$("#variable-label").text(variableText)		
	$("#main-title").text("COVID-19 Daily " + renderType + " " + variableText)
	$("#sort-label").text(sortCriteria)		
}

//
// grid init, rendering, etc.
//
$(document).ready(function() {

	let searchParams = new URLSearchParams(window.location.search)
	let countryFilter = null
	var locationList = null

	var queryFilters = []

	if (searchParams.has("country")) {
		countryFilter = searchParams.get("country")
		queryFilters.push("country=" + countryFilter)
		$("#filter-container").html(countryFilter + ' Only' + '<a href="/" id="remove-filter">Remove Filter</a>')
	}

	if (searchParams.has("state")) {
		stateFilter = searchParams.get("state")
		queryFilters.push("state=" + stateFilter)
		$("#filter-container").html(stateFilter + ' Only' + '<a href="/">Remove Filter</a>')
	}

	if (searchParams.has("type")) {
		renderType = searchParams.get("type")
	}

	if (searchParams.has("variable")) {
		renderVariable = searchParams.get("variable")
	}

	if (searchParams.has("sort")) {
		sortCriteria = searchParams.get("sort")
	}

	updateFilters()

	var queryParams = (queryFilters.length > 0) ? "?" + queryFilters.join("&") : ""

	$.get("/data" + queryParams, function( results ) {			

		let counts = results["counts"]
		let data = results["data"]

		let xmax = window.innerWidth
		let cellIncrement = 55/(data.length*1.3)
		let gridWidth = (data.length*cellIncrement/100)*xmax + 4*(data.length-1)
		let labelSpace = (xmax - gridWidth)*0.9

		// let grid = $("<div>").attr('id', 'grid')
		let grid = $("#grid")
		grid.css({"grid-template-columns": "repeat(" + data.length + ", "  + cellIncrement + "%) " + labelSpace + "px"})
		$("#grid-container").append(grid)

		// render the grid
		renderGrid(data, counts, gridWidth)

		// add filter toggles

		$("#type-select").click(function() {
			let avail = Object.values(renderConfig.TYPE)
			
			renderType = avail[(avail.indexOf(renderType) + 1)%avail.length]
			searchParams.set("type", renderType)
			window.history.pushState('', '', '?' + searchParams)

			renderGrid(data, counts, gridWidth)
			updateFilters()
		})

		$("#variable-select").click(function() {
			let avail = Object.values(renderConfig.VARIABLE)
			
			renderVariable = avail[(avail.indexOf(renderVariable) + 1)%avail.length]
			searchParams.set("variable", renderVariable)
			window.history.pushState('', '', '?' + searchParams)

			renderGrid(data, counts, gridWidth)
			updateFilters()
		})

		$("#sort-select").click(function() {
			let avail = Object.values(renderConfig.SORT)
			
			sortCriteria = avail[(avail.indexOf(sortCriteria) + 1)%avail.length]
			searchParams.set("sort", sortCriteria)
			window.history.pushState('', '', '?' + searchParams)

			renderGrid(data, counts, gridWidth)
			updateFilters()
		})

	})

})