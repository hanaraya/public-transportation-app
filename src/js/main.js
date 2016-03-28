var stationList = document.getElementById('station-list');
var optionHTML = '<option value="%value-data%" abbreviation="%abbr-data%">%abbr-data%</option>';
var stationInnerHTML = '';
var stationRequest = new Request('http://api.bart.gov/api/stn.aspx?cmd=stns&key=MW9S-E7SL-26DU-VV8V');

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
populateStations();

//Register service worker
if(navigator.serviceWorker){
	navigator.serviceWorker.register('sw.js', {scope:'/'}).then(function(registration){ 
	}).catch(function(error){ 
		console.log(error);
	});
}


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

openDatabase();

function openDatabase(){
	//If service worker is not supported return. No need to open database
	if(!navigator.serviceWorker){
		return Promise.resolve();
	}
	idb.open('bart',1 ,function(upgradeDb){
		var store = upgradeDb.createObjectStore('stations', {keyPath : 'abbr'})
	} );
}