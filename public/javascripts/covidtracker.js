//
// Interactive grid rendering of the JHU CSSE data
//

import { getCovidData } from './covid-data.js'

const exclusionList = ["Others", "null", "undefined", "None", "Unassigned Location (From Diamond Princess)", 
						"Unassigned Location (From Diamond Princess)", "Recovered", "Grand Princess Cruise Ship",
						"Wuhan Evacuee", "Grand Princess", "Diamond Princess" ]

const countrySynonyms = {
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
		STATE: "Province/State"
	}	
}

// load-time defaults
var renderType = renderConfig.TYPE.DELTA
var renderVariable = renderConfig.VARIABLE.CONFIRMED
var aggregateField = renderConfig.FIELDS.COUNTRY

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
// patch up records based on inconsistencies
// occuring in the data over time
//
function cleanLocation(entry) {

	// march 23 format change hack
	if (entry['Country_Region']) {		
		entry['Country/Region'] = entry['Country_Region']
	}

	if (entry['Province_State']) {		
		entry['Province/State'] = entry['Province_State']
	}

	// consistency hacks / no politics
	if (entry['Province/State'] == "Hong Kong") {
		entry['Country/Region'] = "Hong Kong"
	}
	if (entry['Province/State'] == "Macau") {
		entry['Country/Region'] = "Macau"
	}

	if (entry['Province/State'] == "Chicago") {
		entry['Province/State'] = "Illinois"
	}

	if (entry['Province/State'] == "District Of Columbia") {
		entry['Province/State'] = "District of Columbia"
	}

	// weird records should be ignored
	if (entry['Province/State'] == "US") {
		entry['Province/State'] = "None"
	}

	// more hacks
	if (!entry['Province/State'] || entry['Province/State'] === undefined) {
		entry['Province/State'] = entry['Country/Region']
	}

	// us [ city, state ] format hack

	if (entry['Country/Region'] == "US" && entry['Province/State'].indexOf(",") > 0) {
		var state = entry['Province/State'].split(",")[1]
		state = state.replace("(From Diamond Princess)","").replace(/\./g, '').trim()
		if (usStateMapping[state]) {
			entry['Province/State'] = usStateMapping[state]
		} else {
			entry['Province/State'] = entry['Province/State'].split(",")[0]
		}
	}

	return entry

}


//
// get location for a given entry
// (warning: CSSE data is messy/inconsistent - hacks are needed)
//
function getLocation(entry, key) {
	entry = cleanLocation(entry)
	return normalize(entry[key])
}


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
// render main infographics grid
//
function renderGrid(data, counts, gridWidth, start, end) {

	if (!start) { start = 0 }
	if (!end) { end = 100 }

	$("#grid").empty() 	// clear any existing grid

	// render dates
	for (let i=0; i<data.length; i++) {
		let entry = $("<div>").addClass("grid-header").attr("id", "header-" + i)
		entry.text(data[i]['date'].split("-").slice(0,2).join(" "))		
		$("#grid").append(entry)
	}

	$("#grid").append($("<div>"))	// padding

	let rendered = 0	
	for (let location in counts[renderVariable]) {
		
		if (rendered++ > end) { break } // TODO: add proper pagination
		if (rendered < start) { continue }

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

			radius = Math.min(Math.ceil(1+metric/50),8) + "px"

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


		let lastVal = counts[renderVariable][location].slice(-1)
		let color = getColor(lastVal, true)
		let entry = $("<div>" + location + " (" + lastVal.toLocaleString() + ")</div>")
						.addClass("row-label")
						.attr({"location": location, "color": color})
						.css({"color": color})


		// row label hover
		entry.hover(function() { 
			let l =  $(this).attr("location")
			let lastCount = counts[renderVariable][l].slice(-1)
			let delta = counts[renderVariable][l].slice(-1) - counts[renderVariable][l].slice(-2)[0]
			renderMetadata(l, counts, data.slice(-1)[0]["date"], delta, getColor(delta),data.length-1)

			renderMetadata(l, 
							counts["Confirmed"][l].slice(-1), 
							counts["Deaths"][l].slice(-1),
							counts["Recovered"][l].slice(-1),
							data.slice(-1)[0]["date"], 
							delta,
							getColor(delta, true))
		})

		// row label click

		var searchParams = new URLSearchParams(window.location.search)
		if (!searchParams.has("country")) {
			entry.click(function() {
				let searchParams = new URLSearchParams(window.location.search)
				searchParams.set("country", $(this).attr("location"))				
				window.location.href = "?" + searchParams
			})
		}

		$("#grid").append(entry)	

	}

	// add worldwide stats
	let delta = getCount(counts["Confirmed"], data.length-1) - getCount(counts["Confirmed"], data.length-2)
	let index = data.length-1

	renderMetadata(searchParams.has("country") ? searchParams.get("country") : "Worldwide", 
					getCount(counts["Confirmed"], index), 
					getCount(counts["Deaths"], index),
					getCount(counts["Recovered"], index),
					data.slice(-1)[0]["date"], 
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
}

//
// grid init, rendering, etc.
//
$(document).ready(function() {

	let data = getCovidData()

	let searchParams = new URLSearchParams(window.location.search)
	let countryFilter = null

	if (searchParams.has("country")) {
		countryFilter = searchParams.get("country")
		$("#filter-container").html(countryFilter + ' Only' + '<a href="/">Remove Filter</a>')
	}

	if (searchParams.has("type")) {
		renderType = searchParams.get("type")
	}

	if (searchParams.has("variable")) {
		renderVariable = searchParams.get("variable")
	}

	updateFilters()

	// init the container grid

	let xmax = window.innerWidth
	let cellIncrement = 80/(data.length*1.3)
	let gridWidth = (data.length*cellIncrement/100)*xmax + 4*(data.length-1) - 20
	let labelSpace = (xmax - gridWidth)*0.9

	let grid = $("<div>").attr('id', 'grid')
	grid.css({"grid-template-columns": "repeat(" + data.length + ", "  + cellIncrement + "%) " + labelSpace + "px"})
	$("#grid-container").append(grid)


	// aggregate counts per location

	let counts = {
		"Confirmed": {},
		"Active": {},
		"Deaths": {},
		"Recovered": {}
	}

	for (let i=0; i<data.length; i++) {
		let date = data[i]['date']
		let entries = data[i]['entries']
		for (let j=0; j<entries.length; j++) {

			let location = getLocation(entries[j], aggregateField)

			if (countryFilter) {
				 if (getLocation(entries[j], renderConfig.FIELDS.COUNTRY) != countryFilter) {
					continue	// not matching the requested country - skip
				 } else {		// country selected - aggregate by state
				 	location = getLocation(entries[j], renderConfig.FIELDS.STATE) 
				 }
			}

			if (exclusionList.includes(location)) {
				continue
			}

			if (!counts["Confirmed"][location]) {
				for (let key in counts) {
					counts[key][location] = new Array(data.length).fill(0);
				}
			}

			for (let key in counts) {
				if (entries[j][key]) {
					counts[key][location][i] += parseInt(entries[j][key])
				}
			}
		}
	}

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

})