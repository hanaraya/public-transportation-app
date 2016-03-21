var stationList = document.getElementById('station-list');

var stationTestArray = [{name: "Fremont", abbr: "FRMT"}, {name: "Oakland" , abbr: "12TH"}];

var optionHTML = '<option value="%value-data%" abbreviation="%abbr-data%"/>';

var stationInnerHTML = '';

var stationRequest = new Request('http://api.bart.gov/api/stn.aspx?cmd=stns&key=MW9S-E7SL-26DU-VV8V');
//var stationRequest = new Request('http://api.bart.gov/api/bsa.aspx?cmd=count&key=MW9S-E7SL-26DU-VV8V');
var stations = fetch(stationRequest).then(function(response){
	if(!response) return;
	var contentType = response.headers.get('content-type');
	console.log('content type ', contentType);

	response.text().then(function(textxml){
		var parser = new DOMParser();
		console.log(textxml);
	var xmlDoc = parser.parseFromString(textxml,"text/xml");
	console.log(xmlDoc);
	console.log(xmlDoc.getElementsByTagName('station'));
	// .forEach(function(station){
	// 	console.log(station);
	// });
	// console.log(xmlDoc.getElementsByTagName('traincount')[0].innerHTML);
	// console.log(xmlDoc.getElementsByTagName('root').nodeValue);
	});
	
	//console.log(response.arrayBuffer());
	// response.text().then(function(reader){
	// 	//console.log(reader.find('traincount'));
	// 	//var x = new XML(reader);
	// 	console.log(XML.parse(reader));
	// });
});

stationTestArray.forEach(function(station){
	stationInnerHTML += optionHTML.replace('%value-data%', station.name).replace('%abbr-data%', station.abbr);
});
console.log(stationInnerHTML);
stationList.innerHTML = stationInnerHTML;