import idb from 'idb';
//var idb = require('idb');

var fromStationInput = document.getElementById('from-station');
var toStationInput = document.getElementById('to-station');

var stationList = document.getElementById('station-list');
var optionHTML = '<option value="%value-data%" abbreviation="%abbr-data%">%abbr-data%</option>';
var stationInnerHTML = '';
var stationRequest = new Request('http://api.bart.gov/api/stn.aspx?cmd=stns&key=MW9S-E7SL-26DU-VV8V');
var stationsLookup = {};
var scheduleDepartTemplate = 'http://api.bart.gov/api/sched.aspx?cmd=depart&orig=%orig%&dest=%dest%&key=MW9S-E7SL-26DU-VV8V';

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

function populateAndShowStations(){
	return getJSON(stationRequest).then(function(responseJSON){ 
		showStations(responseJSON.root.stations.station);
		openDatabase().then(function(db){
			if(!db) return;

			var objectStore = db.transaction('stations', 'readwrite').objectStore('stations');
			//delete all old entries
			objectStore.clear().then(function(){
				responseJSON.root.stations.station.forEach(function(station){
					station.id = station.abbr['#text'];
					objectStore.put(station);
				});
				
			});
		});
	});
}

String.prototype.replaceAll = function(search, replacement) {
	var target = this;
	return target.replace(new RegExp(search, 'g'), replacement);
};


function showOfflineStations(){
	return openDatabase().then(function(db){
		if(!db) return;
		var objectStore = db.transaction('stations').objectStore('stations');
		objectStore.getAll().then(function(stations){
			showStations(stations);
		});
	});
}
function getKeyByValueOrKey(dict, value){
	if(!dict || !value) return null;
	if(dict[value.toUpperCase()]) return value.toUpperCase();
	for(var key in dict){
		if(dict[key].toUpperCase() === value.toUpperCase())
			return key;
	}
	return null;	
}

function showStations(stations){
	stationInnerHTML = '';
	stationsLookup = {};
	stations.forEach(function(station){
		stationInnerHTML+=optionHTML.replace('%value-data%', station.name['#text']).replaceAll('%abbr-data%',station.abbr['#text']);
		stationsLookup[station.abbr['#text']] = station.name['#text'];
	});
	stationList.innerHTML = stationInnerHTML;
}

//Register service worker
function registerServiceWorker(){
if(navigator.serviceWorker){
	navigator.serviceWorker.register('sw.js', {scope:'/'}).then(function(registration){ 
	}).catch(function(error){ 
		console.log(error);
	});
}
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


function openDatabase(){
	//If service worker is not supported return. No need to open database
	if(!navigator.serviceWorker){
		return Promise.resolve();
	}
	return idb.open('bart',2 ,function(upgradeDb){
		switch(upgradeDb.version){
		case 0:
			upgradeDb.createObjectStore('stations', {keyPath : 'id'});
		case 2:
			var store = upgradeDb.createObjectStore('schedule', {keyPath : ['from', 'to'] });
			store.createIndex('byStation', ['from', 'to'], {unique: true});
	}
	} );
}


showOfflineStations().then(function(){
	populateAndShowStations();
}).catch(function(error){
	console.log('Error showing offline stations: ', error);
	populateAndShowStations();
});

function showSchedule(){
	var scheduleRequest = new Request(scheduleDepartTemplate.replace('%orig%', '24th').replace('%dest%', 'rock'));
	getJSON(scheduleRequest).then(function(response){
		console.log('schedule response ', response);
	});
}

function showPopulateSchedule(origin, destination){
	showOfflineSchedule(origin, destination).then(function(){
		populateSchedule(origin, destination);
	})
}

function fromStationChange(event){
	var fromStation = fromStationInput.value;
	var toStation = toStationInput.value;
	if(!fromStation || !toStation) return;
	var fromStatAbbr = getKeyByValueOrKey(stationsLookup, fromStation);
	var toStatAbbr = getKeyByValueOrKey(stationsLookup, toStation);
	console.log('from station ',fromStatAbbr);
	console.log('to station ',toStatAbbr);
	showPopulateSchedule(fromStatAbbr, toStatAbbr);
}

function populateSchedule(origin, destination){
	if(!origin || !destination) return;
	var scheduleRequest = new Request(scheduleDepartTemplate.replace('%orig%', origin).replace('%dest%', destination));
	getJSON(scheduleRequest).then(function(responseJSON){
		showSchedule(responseJSON.root.schedule.request.trip);
		console.log('schedule response ', responseJSON);
		return openDatabase().then(function(db){
			if(!db) return;
			var trips = responseJSON.root.schedule.request.trip;
			trips.from = origin;
			trips.to = destination;
			var store = db.transaction('schedule', 'readwrite').objectStore('schedule');
			store.put(trips);
			console.log('trips ', trips);
		});
		responseJSON.root.schedule.request.trip.forEach(function(trip){
			console.log(trip);
		});
	});
}

function showOfflineSchedule(origin, destination){
	return openDatabase().then(function(db){
		if(!db) return;
		var store = db.transaction('schedule').objectStore('schedule');
		var key = [origin, destination];
		return store.get(key).then(function(trips){
			showSchedule(trips);
		});
	});	
}

function showSchedule(trips){
	if(!trips) return;

}

function toStationChange(event){
	var fromStation = fromStationInput.value;
	var toStation = toStationInput.value;
	if(!fromStation || !toStation) return;
	var fromStatAbbr = getKeyByValueOrKey(stationsLookup, fromStation);
	var toStatAbbr = getKeyByValueOrKey(stationsLookup, toStation);
	console.log('from station ',fromStatAbbr);
	console.log('to station ',toStatAbbr);
	showPopulateSchedule(fromStatAbbr, toStatAbbr);
}

function addEventListeners(){
	fromStationInput.addEventListener('input', fromStationChange);
	toStationInput.addEventListener('input', toStationChange);
}


addEventListeners();