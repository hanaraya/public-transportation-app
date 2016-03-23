var stationList = document.getElementById('station-list');

var stationTestArray = [{name: "Fremont", abbr: "FRMT"}, {name: "Oakland" , abbr: "12TH"}];

var optionHTML = '<option value="%value-data%" abbreviation="%abbr-data%">%abbr-data%</option>';

var stationInnerHTML = '';

var stationRequest = new Request('http://api.bart.gov/api/stn.aspx?cmd=stns&key=MW9S-E7SL-26DU-VV8V');
//var stationRequest = new Request('http://api.bart.gov/api/bsa.aspx?cmd=count&key=MW9S-E7SL-26DU-VV8V');
// var stations = fetch(stationRequest).then(function(response){
// 	if(!response) return;
// 	var contentType = response.headers.get('content-type');
// 	console.log('content type ', contentType);

// 	response.text().then(function(textxml){
// 		var parser = new DOMParser();
// 		console.log(textxml);
// 	var xmlDoc = parser.parseFromString(textxml,"text/xml");
// 	console.log(xmlDoc);
// 	console.log(xmlDoc.getElementsByTagName('station'));
	// .forEach(function(station){
	// 	console.log(station);
	// });
	// console.log(xmlDoc.getElementsByTagName('traincount')[0].innerHTML);
	// console.log(xmlDoc.getElementsByTagName('root').nodeValue);
	// });

	//console.log(response.arrayBuffer());
	// response.text().then(function(reader){
	// 	//console.log(reader.find('traincount'));
	// 	//var x = new XML(reader);
	// 	console.log(XML.parse(reader));
	// });
// });

function getXML(request){
	return fetch(request).then(function(response){
		return	 response.text().then(function(responseText){
			var parser = new DOMParser();
			return parser.parseFromString(responseText, 'text/xml');
		});
	});
}

function getJSON(request){
	return getXML(request).then(function(responseXML){
		return xmlToJson(responseXML);
	});
}

function populateStations(){
	return getJSON(stationRequest).then(function(responseJSON){ 
		console.log(responseJSON);
		console.log(responseJSON.root.stations);		
		console.log(responseJSON.root.stations.station[0].name['#text']);
		console.log(JSON.stringify(responseJSON));
		responseJSON.root.stations.station.forEach(function(station){
			stationInnerHTML+=optionHTML.replace('%value-data%', station.name['#text']).replaceAll('%abbr-data%',station.abbr['#text']);
		});
		stationList.innerHTML = stationInnerHTML;
	});
}

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

// stationTestArray.forEach(function(station){
// 	stationInnerHTML += optionHTML.replace('%value-data%', station.name).replace('%abbr-data%', station.abbr);
// });
populateStations();
console.log(stationInnerHTML);


// Changes XML to JSON
function xmlToJson(xml) {
	
	// Create the return object
	var obj = {};

	if (xml.nodeType == 1) { // element
		// do attributes
		if (xml.attributes.length > 0) {
			obj["@attributes"] = {};
			for (var j = 0; j < xml.attributes.length; j++) {
				var attribute = xml.attributes.item(j);
				obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
			}
		}
	} else if (xml.nodeType == 3) { // text
		obj = xml.nodeValue;
	}

	// do children
	if (xml.hasChildNodes()) {
		for(var i = 0; i < xml.childNodes.length; i++) {
			var item = xml.childNodes.item(i);
			var nodeName = item.nodeName;
			if (typeof(obj[nodeName]) == "undefined") {
				obj[nodeName] = xmlToJson(item);
			} else {
				if (typeof(obj[nodeName].push) == "undefined") {
					var old = obj[nodeName];
					obj[nodeName] = [];
					obj[nodeName].push(old);
				}
				obj[nodeName].push(xmlToJson(item));
			}
		}
	}
	return obj;
};