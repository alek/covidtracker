var express = require('express');
var router = express.Router();
var data = require('../public/javascripts/covid-data.js');

// render exclusion list
const exclusionList = ["Others", "null", "undefined", "None", "Unassigned Location (From Diamond Princess)", 
						"Unassigned Location (From Diamond Princess)", "Recovered", "Grand Princess Cruise Ship",
						"Wuhan Evacuee", "Grand Princess", "Diamond Princess", "Cruise Ship" ]

// for data consistency - no politics
const countrySynonyms = {
	"Mainland China" : "China",
	"United Kingdom" : "UK",
	"Korea, South" : "South Korea",
	"Republic of Korea": "South Korea",
	"Taiwan*" : "Taiwan",
	"Iran (Islamic Republic of)": "Iran",
	"Taipei and environs": "Taiwan",
	"occupied Palestinian territory": "Israel",
	"Viet Nam": "Vietnam",
	"Russian Federation": "Russia"
}

// us state code -> mapping 
const usStateMapping = {
	    "AL": "Alabama",
	    "AK": "Alaska",
	    "AS": "American Samoa",
	    "AZ": "Arizona",
	    "AR": "Arkansas",
	    "CA": "California",
	    "CO": "Colorado",
	    "CT": "Connecticut",
	    "DE": "Delaware",
	    "DC": "District Of Columbia",
	    "FM": "Federated States Of Micronesia",
	    "FL": "Florida",
	    "GA": "Georgia",
	    "GU": "Guam",
	    "HI": "Hawaii",
	    "ID": "Idaho",
	    "IL": "Illinois",
	    "IN": "Indiana",
	    "IA": "Iowa",
	    "KS": "Kansas",
	    "KY": "Kentucky",
	    "LA": "Louisiana",
	    "ME": "Maine",
	    "MH": "Marshall Islands",
	    "MD": "Maryland",
	    "MA": "Massachusetts",
	    "MI": "Michigan",
	    "MN": "Minnesota",
	    "MS": "Mississippi",
	    "MO": "Missouri",
	    "MT": "Montana",
	    "NE": "Nebraska",
	    "NV": "Nevada",
	    "NH": "New Hampshire",
	    "NJ": "New Jersey",
	    "NM": "New Mexico",
	    "NY": "New York",
	    "NC": "North Carolina",
	    "ND": "North Dakota",
	    "MP": "Northern Mariana Islands",
	    "OH": "Ohio",
	    "OK": "Oklahoma",
	    "OR": "Oregon",
	    "PW": "Palau",
	    "PA": "Pennsylvania",
	    "PR": "Puerto Rico",
	    "RI": "Rhode Island",
	    "SC": "South Carolina",
	    "SD": "South Dakota",
	    "TN": "Tennessee",
	    "TX": "Texas",
	    "UT": "Utah",
	    "VT": "Vermont",
	    "VI": "Virgin Islands",
	    "VA": "Virginia",
	    "WA": "Washington",
	    "WV": "West Virginia",
	    "WI": "Wisconsin",
	    "WY": "Wyoming"
}

// render / aggregation config 

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

	if (entry['Province/State'] == "Chicago" && !entry['County']) {
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
	if (!entry['County'] && !entry['Province/State'] || entry['Province/State'] === undefined) {
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

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/data/', function(req, res, next) {

	let countryFilter = req.query['country']
	let stateFilter = req.query['state']
	var locationList = req.query['location']

	// aggregate counts per location
	let aggregateField = renderConfig.FIELDS.COUNTRY
	if (stateFilter) {
		aggregateField = renderConfig.FIELDS.COUNTY
	}

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

			// show new york times data for US states		
			if (!stateFilter) {
				if (entries[j]['Source'] != "jhu") {	
					continue
				}
			} else if (countryFilter == "US" && stateFilter) {
				if (entries[j]['Source'] != "nytimes") {	
					continue
				}
			}

			// if (!entries[j]['County']) {
			// 	continue
			// }

			let location = getLocation(entries[j], aggregateField)

			if (countryFilter) {				// filter out all except for selected country / state 
				 if (getLocation(entries[j], renderConfig.FIELDS.COUNTRY) != countryFilter) {
					continue	
				 } else {		
				 	if (stateFilter) {
				 		if (getLocation(entries[j], renderConfig.FIELDS.STATE) != stateFilter) {
							continue
						} else {
							location = getLocation(entries[j], renderConfig.FIELDS.COUNTY) 
						}
				 	} else {
					 	location = getLocation(entries[j], renderConfig.FIELDS.STATE) 
					 }
				 }
			}

			if (exclusionList.includes(location)) {
				continue
			}

			// lazy counter init
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

	let dateData = []
	for (var i=0; i<data.length; i++) {
		dateData.push({"date": data[i]["date"]})
	}

	res.send({
		"data": dateData,
		"counts": counts
	});

});

module.exports = router;
