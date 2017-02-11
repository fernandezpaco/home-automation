//npm install -g piscosour
//pisco recipe:create

//npm install --save jsonfile
var jsonfile = require('jsonfile')

//npm install node-hue-api
var hue = require("node-hue-api");
var hueApi = require("node-hue-api").HueApi;
var lightState = require("node-hue-api").lightState;

//npm install mqtt --save
var mqtt = require('mqtt');

/*var createPrefFile = function(file){
  	console.log("No preferences file found");
  	var obj = {name: 'Paco IOT'};
  	console.log("Creating...");
	jsonfile.writeFile(file, obj, function (err) {
		if(err)
	  		console.error(err);
	})
};

var savePreferences = function(file,obj){
	jsonfile.writeFile(file, obj, function (err) {
		if(err)
	  		console.error(err);
	});
};

*/
//Global params
var file = 'preferences.json';
var preferences;

var readPreferences = function(){
	return new Promise(function(resolve,reject){
		jsonfile.readFile(file, function(err, obj) {
		  if(obj){
		  	preferences=obj;
		  	console.log("Preferences loaded:");
		  	console.log(preferences);
		  	resolve();
		  }else{
		  	console.log("No preferences file found");
		  	preferences = {name: 'Paco IOT'};
		  	console.log("Creating...");
			jsonfile.writeFileSync(file, preferences);
		  	resolve();
		  }
		});	
	});

};

var checkBridge = function(){
	console.log("Checking Bridge");
	return new Promise(function(resolve,reject){
		if(preferences.bridgeip && preferences.hueuser){
			console.log("Connecting to:"+preferences.bridgeip+" with user:"+preferences.hueuser)
			var api = new hueApi(preferences.bridgeip, preferences.hueuser);
			api.version().then(
				function(val){
					console.log("Bridge OK! "+JSON.stringify(val));
					resolve(api);
				},
				function(){
					console.log("Connection rejected. Scanning for Bridges..");
					hue.nupnpSearch(function(err, result) {
						if (err){
							reject('NO_BRIDGE_FOUND');
						} 
						//si cambia la ip del bridge inicializamos las properties y 
						//llamamos de nuevo al checkBridge
						preferences={name: 'Paco IOT'};
						jsonfile.writeFileSync(file, preferences);	
						checkBridge().then(resolve,reject);
					});
				}
			);
		}else{
			hue.nupnpSearch(function(err, result) {
				if (err) reject(err);
				var hueip=result[0].ipaddress;
				console.log('Bridge found at:'+hueip);
				var api= new hueApi();
				// Using a callback (with default description and auto generated username)
				api.createUser(hueip, function(err, user) {
				    if (err){
				    	reject(err);
				    }else {
				    	console.log("User created: "+user);
				    	var obj=jsonfile.readFileSync(file, obj);
				    	obj['hueuser']=user;
				    	obj['bridgeip']=hueip;
						jsonfile.writeFileSync(file, obj);				    	
				    	resolve(new hueApi(hueip,user));
				    }
				});
			});
		}
	});
};

var readLights = function(api){
	console.log("Reading Lights");
	return new Promise(
		function(resolve,reject){
			api.lights(function(err, lights) {
			    if (err) reject(err);
			    console.log(lights.lights);
			    resolve([lights,api]);
			});
		}
	)
};

var waitForCommands = function(array){
	console.log("Wait For Commands");

	//mosquitto_pub -h 127.0.0.1 -t presence -m "PRESENCE SENSOR_1"
	var client  = mqtt.connect('tcp://localhost:1883');
	client.on('connect', function () {
	  client.subscribe('presence')
	});
	 
	client.on('message', function (topic, message) {
	  // message is Buffer 
	  console.log(message.toString());
	  if(message=="PRESENCE SENSOR_1"){
	  	//array[1] es el api ya que readLights resolve lights,api
	  	array[1].setLightState(2, lightState.create().on());

	  	var tm=setTimeout(function(){ 
	  		array[1].setLightState(2, lightState.create().off()); 
	  	}, 30000);

	  	//clearTimeout(tm);
	  }
	});
};

var starthere = function(){
	console.log("Paco's IOT starts.")

	//Load preferences
	readPreferences()
	//Check Bridge connectivity
	.then(checkBridge)
	//Read Ligt Info
	.then(readLights)
	//Wait MQTT Commands
	.then(waitForCommands)
	//handle errors
	.catch((err) => {console.log(err)});

	/*/read preferences file
	var file = 'preferences.json'
	var preferences;
	jsonfile.readFile(file, function(err, preferences) {
	  if(preferences){
	  	console.log("Preferences loaded",preferences);
		//
		if(preferences.hueuser){
			var api = new hueApi(preferences.bridgeip, preferences.hueuser);
			api.lights(function(err, lights) {
			    if (err) throw err;
			    console.log(lights.lights);
			});
		}else{
			var bridgeConnectionInfo=createHueUser();
	    	preferences['hueuser']=bridgeConnectionInfo.hueuser;
	    	preferences['bridgeip']=bridgeConnectionInfo.bridgeip;
	    	savePreferences(file,preferences);
		}
	  }else{
	  	createPrefFile(file);
	  }
	});*/

}();

/*var hostname, userDescription = "NodeJs Client";

var displayBridges = function(bridge) {
    console.log("Hue Bridges Found: " + JSON.stringify(bridge));
	hostnameO=bridge[0].ipaddress;

	var hueapi = new HueApi();

	// --------------------------
	// Using a promise
	hueapi.registerUser(hostname, userDescription)
	    .then(displayUserResult)
	    .fail(displayError)
	    .done();	
};

hue.nupnpSearch(function(err, result) {
    if (err) throw err;
    displayBridges(result);
});

var displayUserResult = function(result) {
    console.log("Created user: " + JSON.stringify(result));
};

var displayError = function(err) {
    console.log(err);
};*/





