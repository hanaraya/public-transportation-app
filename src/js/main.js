/*eslint-disable */
import idb from 'idb';

/*eslint-enable */

var fromStationInput = document.getElementById('from-station');
var toStationInput = document.getElementById('to-station');
var displaScheduleOutput = document.getElementById('replace-me');

var stationList = document.getElementById('station-list');
var optionHTML = '<option value="%value-data%" abbreviation="%abbr-data%">%abbr-data%</option>';
var stationInnerHTML = '';
var stationRequest = new Request('http://api.bart.gov/api/stn.aspx?cmd=stns&key=MW9S-E7SL-26DU-VV8V');
var stationsLookup = {};
var scheduleDepartTemplate = 'http://api.bart.gov/api/sched.aspx?cmd=depart&orig=%orig%&dest=%dest%&key=MW9S-E7SL-26DU-VV8V';
var scheduleHTML = '';
var noScheduleHTML = '<div>Schedule not available</div>';
var scheduleAvailable = true;
var tripStartHTML = '<div class="display-section">';
var tripEndHTML = '</div>';
var lineHTML = '<div><strong>Leg %leg-number%</strong></div>'+
				'<div class="flex-container flex-horizontal">'+
					'<div class = "flex-2">'+
						'<div><strong>From:</strong> %from-station% (%from-abbr%)</div>'+
						'<div><strong>Departure:</strong> %depart-time%</div>'+
					'</div>'+
					'<div class = "flex-1">'+
						'<div><strong>To:</strong> %to-station% (%to-abbr%)</div>'+
						'<div><strong>Arrival:</strong> %arrival-time%</div>'+
					'</div>'+
				'</div>';
var breakHTML = '<hr>';

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
		var defaultStore = db.transaction('default').objectStore('default');
		var origin, destination;
		defaultStore.get('from').then(function(valueObj){
			origin = valueObj.value;
			if(valueObj){
				fromStationInput.value = valueObj.displayValue;
			}
			if(origin && destination)
				showPopulateSchedule(origin, destination);
		});
		defaultStore.get('to').then(function(valueObj){
			destination = valueObj.value;
			if(valueObj){
				toStationInput.value = valueObj.displayValue;
			}
			if(origin && destination)
				showPopulateSchedule(origin, destination);
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
			obj['@attributes'] = {};
			for (var j = 0; j < xml.attributes.length; j++) {
				var attribute = xml.attributes.item(j);
				obj['@attributes'][attribute.nodeName] = attribute.nodeValue;
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
			if (typeof(obj[nodeName]) == 'undefined') {
				obj[nodeName] = xmlToJson(item);
			} else {
				if (typeof(obj[nodeName].push) == 'undefined') {
					var old = obj[nodeName];
					obj[nodeName] = [];
					obj[nodeName].push(old);
				}
				obj[nodeName].push(xmlToJson(item));
			}
		}
	}
	return obj;
}


function openDatabase(){
	//If service worker is not supported return. No need to open database
	if(!navigator.serviceWorker){
		return Promise.resolve();
	}
	return idb.open('bart',1 ,function(upgradeDb){
		switch(upgradeDb.version){
		case 1:
			upgradeDb.createObjectStore('stations', {keyPath : 'id'});
			upgradeDb.createObjectStore('schedule', {keyPath : ['from', 'to'] });
			upgradeDb.createObjectStore('default', {keyPath: 'id'});
		}
	} );
}

function showPopulateSchedule(origin, destination){
	if(!origin || !destination) return;
	showOfflineSchedule(origin, destination).then(function(){
		populateSchedule(origin, destination);
	});
}

function fromStationChange(event){
	var fromStation = fromStationInput.value;
	var toStation = toStationInput.value;
	if(!fromStation || !toStation) return;
	var fromStatAbbr = getKeyByValueOrKey(stationsLookup, fromStation);
	if(fromStatAbbr)
		setValidity(fromStationInput, false);
	else
		setValidity(fromStationInput, true);
	var toStatAbbr = getKeyByValueOrKey(stationsLookup, toStation);
	if(fromStatAbbr && toStatAbbr){
		showPopulateSchedule(fromStatAbbr, toStatAbbr);		
		storeDefaultValues(fromStation, toStation);
	}
	else
		showNoSchedule();
}

function storeDefaultValues(origin, destination){
	openDatabase().then(function(db){
		var defaultStore = db.transaction('default', 'readwrite').objectStore('default');
		var fromObject = {id : 'from', displayValue : origin, value : getKeyByValueOrKey(stationsLookup, origin)};
		var toObject = {id : 'to', displayValue : destination, value : getKeyByValueOrKey(stationsLookup, destination)};
		defaultStore.put(fromObject);
		defaultStore.put(toObject);
	});
}

function populateSchedule(origin, destination){
	if(!origin || !destination) return;
	var scheduleRequest = new Request(scheduleDepartTemplate.replace('%orig%', origin).replace('%dest%', destination));
	getJSON(scheduleRequest).then(function(responseJSON){
		if(!responseJSON.root.schedule.request) return;
		showSchedule(responseJSON.root.schedule.request.trip);
		return openDatabase().then(function(db){
			if(!db) return;
			var trips = responseJSON.root.schedule.request.trip;
			trips.from = origin;
			trips.to = destination;
			var store = db.transaction('schedule', 'readwrite').objectStore('schedule');
			store.put(trips);
		});
	}).catch(function(error){
	});
}

function showOfflineSchedule(origin, destination){
	return openDatabase().then(function(db){
		if(!db) return;
		var store = db.transaction('schedule').objectStore('schedule');
		var key = [origin, destination];
		return store.get(key).then(function(trips){
			if(trips)
				showSchedule(trips);
			else
				showNoSchedule();
		}).catch(function(error){
			showNoSchedule();
		});
	});	
}

function generateLegHTML(leg){
	if(!leg) return;
	return	lineHTML.replace('%depart-time%', leg['@attributes'].origTimeMin)
							.replace('%arrival-time%', leg['@attributes'].destTimeMin)
							.replace('%from-station%', stationsLookup[leg['@attributes'].origin])
							.replace('%to-station%', stationsLookup[leg['@attributes'].destination])
							.replace('%from-abbr%', leg['@attributes'].origin)
							.replace('%to-abbr%', leg['@attributes'].destination);
}

function showSchedule(trips){
	scheduleAvailable = true;
	scheduleHTML = '';
	trips.forEach(function(trip){
		var scheduleLine = '';
		if(trip.leg.forEach){
			trip.leg.forEach(function(leg){
				if(scheduleLine!=='')
					scheduleLine += breakHTML;
				var line = generateLegHTML(leg).replace('%leg-number%', leg['@attributes'].order);
				scheduleLine += line;
			});

		}
		else {
			var line = generateLegHTML(trip.leg).replace('<strong>Leg %leg-number%</strong>', '');
			scheduleLine += line;
		}
		scheduleHTML+=tripStartHTML + scheduleLine + tripEndHTML;
	});
	displaScheduleOutput.innerHTML = scheduleHTML;


}

function showNoSchedule(){
	if(scheduleAvailable){
		scheduleAvailable = false;
		displaScheduleOutput.innerHTML = noScheduleHTML;
	}
}

function toStationChange(event){
	var fromStation = fromStationInput.value;
	var toStation = toStationInput.value;
	if(!fromStation || !toStation) return;
	var fromStatAbbr = getKeyByValueOrKey(stationsLookup, fromStation);
	var toStatAbbr = getKeyByValueOrKey(stationsLookup, toStation);
	if(toStatAbbr)
		setValidity(toStationInput, false);
	else
		setValidity(toStationInput, true);
	if(fromStatAbbr && toStatAbbr){
		showPopulateSchedule(fromStatAbbr, toStatAbbr);		
		storeDefaultValues(fromStation, toStation);
	}
	else
		showNoSchedule();
}

function addEventListeners(){
	fromStationInput.addEventListener('input', fromStationChange);
	toStationInput.addEventListener('input', toStationChange);
}


addEventListeners();
registerServiceWorker();
showOfflineStations().then(function(){
	populateAndShowStations();
}).catch(function(error){
	populateAndShowStations();
});

function setValidity(input, invalid){
	if(!invalid && input.getAttribute('aria-invalid')){
		input.removeAttribute('aria-invalid');
	}
	else if(invalid && !input.getAttribute('aria-invalid') ){
		input.setAttribute('aria-invalid', 'true');
	}
}