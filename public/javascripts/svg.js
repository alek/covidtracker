var xmax = window.innerWidth
var ymax = window.innerHeight

var addSVG = function(tag, attrs) {
	var el= document.createElementNS('http://www.w3.org/2000/svg', tag);
	for (var k in attrs) {
		el.setAttribute(k, attrs[k]);
	}
	return el;
}

createSVGContainer = function(name) {
	document.body.appendChild(addSVG("svg", { id: name}))
}

addMask = function(name) {
	var defs = document.getElementsByTagName("defs")
	if (defs.length > 0) {
		// check if exists first ?
		defs[0].appendChild(addSVG("mask", {id: name})).appendChild(addSVG("rect", { fill: "red", "x": 0, "y":0, "width": timeSlide(2000, length), "height": 500  }))
	}
}

path = function(params, domID) {
	document.getElementById(domID).appendChild(addSVG("path", params));
}

text = function(params, text, domID) {
	document.getElementById(domID).appendChild(addSVG('text', params)).appendChild(document.createTextNode(text.substring(0,120)))
}

circle = function(params, domID) {
	document.getElementById(domID).appendChild(addSVG("circle", params));
}

rect = function(params, domID) {
	document.getElementById(domID).appendChild(addSVG("rect", params));	
}

line = function(params, domID) {
	document.getElementById(domID).appendChild(addSVG("line", params));	
}

polygon = function(params, domID) {
	document.getElementById(domID).appendChild(addSVG("polygon", params));	
}

image = function(params, domID) {
	document.getElementById(domID).appendChild(addSVG("image", params));	
}

ellipse = function(params, domID) {
	document.getElementById(domID).appendChild(addSVG("ellipse", params));	
}

rndx = function() {
	return Math.floor(Math.random()*xmax);
}

rndxMargin = function(margin) {
	return Math.floor(xmax*(margin + Math.random()*(1-2*margin)))
}

rndy = function() {
	return Math.floor(Math.random()*ymax);
}

rndyMargin = function(margin) {
	return Math.floor(ymax*(margin + Math.random()*(1-2*margin)))
}

rndcoord = function() {
	return [rndx(), rndy()];
}

rndCoordMargin = function(margin) {
	return [rndxMargin(margin), rndyMargin(margin)]
}

randomID = function() {
	return Math.floor(Math.random()*Number.MAX_SAFE_INTEGER);
}

drawCircle = function(coord, r, fill, domID, id) {
		circle({
			cx: coord[0],
			cy: coord[1],
			r: r,
			stroke: "#fff",
			fill: fill,
			"transform": "rotate(0 0 0)",
			style: "stroke-width:0",
			id: (id == null) ? randomID(): id
		}, domID);	
}

drawEllipse = function(coord, rx, ry, fill, domID, angle, opacity, id) {
	if (angle == null) {
		angle = 0
	}
	if (opacity == null) {
		opacity = 1.0
	}
	ellipse({
		cx: coord[0],
		cy: coord[1],
		rx: rx,
		ry: ry,
		stroke: fill,
		fill: fill,
		opacity: opacity,
		"transform": "rotate(" + angle + " " + coord[0] + " " + coord[1] + ")",
		style: "stroke-width:0",
		id: (id == null) ? randomID(): id
	}, domID);	
}

drawCircleOutline = function(coord, r, fill, width, domID, id, dashed) {
	if (dashed == null) {
		dashed = false
	}
	circle({
		cx: coord[0],
		cy: coord[1],
		r: r,
		stroke: fill,
		fill: "none",
		"stroke-dasharray": dashed ? "4 2" : "0",		
		"transform": "rotate(0 0 0)",
		style: "stroke-width:" + width,
		id: (id == null) ? randomID(): id
	}, domID);	
}


drawRectangle = function(coord, width, height, fill, domID) {
		rect({
			x: coord[0],
			y: coord[1],
			width: width,
			height: height,
			stroke: fill,
			fill: fill,
			style: "stroke-width:1;"
		}, domID);	
}

drawSquare = function(coord, width, fill, domID, strokeWidth) {
	if (strokeWidth == null) {
		strokeWidth = 1
	}
		rect({
			x: coord[0],
			y: coord[1],
			width: width,
			height: width,
			stroke: fill,
			fill: fill,
			style: "stroke-width:" + strokeWidth + ";"
		}, domID);	
}

drawRectangleOutline = function(coord, width, height, stroke, domID, strokeWidth, opacity, round) {
	if (strokeWidth == null) {
		strokeWidth = 1
	}
	if (opacity == null) {
		opacity = 1
	}
	if (round == null) {
		round = 0
	}
		rect({
			x: coord[0],
			y: coord[1],
			width: width,
			height: height,
			stroke: stroke,
			rx: round,
			ry: round,
			fill: "none",
			"stroke-opacity": opacity,
			style: "stroke-width:" + strokeWidth
		}, domID);	
}

drawLine = function(start, end, stroke, width, domID, id, dashed, arrow, dashArray) {
	if (width == null) {
		width = 1
	}
	if (arrow == null) {
		arrow = false
	}
	if (dashed == null) {
		dashed = false
	}
	if (dashArray == null) {
		dashArray = "4 2"
	}
	line({
		x1: start[0],
		y1: start[1],
		x2: end[0],
		y2: end[1],
		stroke: stroke,
		"transform": "rotate(0 0 0)",
		"stroke-width": width,
		"stroke-dasharray": dashed ? dashArray : "0",
		"marker-end" : arrow ? "url(#arrow)" : "none",
		id: (id == null) ? randomID(): id
	}, domID);
}

drawText = function(coord, content, size, fill,weight, spacing, fontFamily, domID, align) {
	if (align == null) {
		align = "middle"
	}
	text( { 
		x: coord[0],
		y: coord[1],
		"fill": fill,
		"transform": "rotate(0 50 100)",
		"style": "font-size:" + size + ";text-align:center;alignment-baseline:" + align + ";text-anchor:" + align + ";opacity:1.0;font-family:" + fontFamily + ";sans-serif;font-weight:" + weight + ";letter-spacing:" + spacing + "px;"
	}, content.toString(), domID); 
}

drawPolygon = function(coords, fill, domID, strokeWidth) {
	if (strokeWidth == null) {
		strokeWidth = 0
	}
	polygon( {
		points: coords.join(" "),
		style: "fill:" + fill +";stroke:" + fill + ";stroke-width:" + strokeWidth
	}, domID)
}

drawPolygonOutline = function(coords, stroke, domID) {
	polygon( {
		points: coords.join(" "),
		style: "fill:none;stroke:" + stroke + ";stroke-width:1"
	}, domID)
}

drawCoordPolygon = function(coords, color, domID) {
	var points = []
	for (var i=0; i<coords.length; i++) {
		points.push([coords[i].x, coords[i].y])
	}
	drawPolygon(points, color, domID)
}

drawPath = function(coords, stroke, weight, domID) {
	path( {
		d: "M" + coords.map(x => x.join(" ")).join(" L") + "",
		style: "fill:none;stroke:" + stroke + ";stroke-width:" + weight
	}, domID)
}

drawImage = function(coords, src, width, height, domID) {
	image( {
		href: src,
		x: coords[0],
		y: coords[1],
		width: width,
		height: height
	}, domID)
}

radialPath = function(coordinates, fill, domID) {
	if (!fill) {
		fill = "none"
	}

	var pathEntries = ["M"].concat(coordinates[0])
	var arcPrefix = "A"

	for (var i=1; i<coordinates.length; i++) {
		pathEntries = pathEntries.concat([arcPrefix])
								 .concat(coordinates[i])
		arcPrefix = "a"
	}
	path( {
		d: pathEntries.join(" "),
		style: "fill:" + fill + ";stroke:" + fill + ";stroke-width:" + 0
	}, domID)
}	

// util methods

function toRadians (angle) {
  return angle * (Math.PI / 180);
}

function toDegrees (angle) {
  return angle * (180 / Math.PI);
}