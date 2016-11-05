var TAG = "serviceCities.js";

var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');

//Function to get list of all cities which are currently supported by msupply.
exports.getServiceCities = 
function getServiceCities (req, callback){
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_sp;

	//Declare the response
	var resJson;

	var col = db.collection('ServiceAreas');

	col.find({}, {"_id": 0, "cityName": 1}).toArray(function(error, result){
		if(error){
			resJson = {
				    "http_code" : "500",
					"message" : "Error while listing service cities. Please try later."
			};
			logger.error(TAG + " listing service cities failed. Error:" + result);
			return callback(true, resJson);
		}
		else if(!error && result.length > 0){
			resJson = {
				    "http_code" : "200",
					"message" : result
			};
			return callback(false, resJson);
		}
		else if(!error && result.length === 0){
			resJson = {
				    "http_code" : "500",
					"message" : result
			};
			logger.error(TAG + " No service cities found.");
			return callback(true, resJson);
		}
	});

}