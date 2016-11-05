var TAG = "serviceareas.js";

var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');


//Function for the Forgot Password.
exports.fetchServiceAreas = 
function fetchServiceAreas (req, callback){
	
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_sp;
	
	//Log the request.
	logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));
	
	logger.info(ip + " " + TAG + " Entering Fetch Service Areas");

	//Declare the response
	var resJson;
	
	//Validate the request.
	if ( !(	req === null || 
			req.body === null ||
			req.body.cityName === undefined ||
			req.body.cityName.toString().trim().length === 0 ||
			req.body.cityName === undefined)) {
	
	var cityName = req.body.cityName;
	
	var col = db.collection('ServiceAreas');
	col.findOne({"cityName": cityName},{"_id": 0,"serviceAreas":1},function(err, result) {
		if(!err && (result !== null)){
			resJson = {
				    "http_code" : "200",
					"message" : result
			};
			return callback(false, resJson);
		}else if(!err && (result === null)){
			resJson = {
				    "http_code" : "500",
					"message" : "There are no service areas for the city.."
			};
			logger.error(ip + " " + TAG + " There are no service areas for the city.");
			return callback(true, resJson);
		}else{
			resJson = {
				    "http_code" : "500",
					"message" : "Unexpected Server while fulfilling the request."
			};
			logger.error(ip + " " + TAG + " Unexpected Server while fulfilling the request.." + JSON.stringify(err));
			return callback(true, resJson);
			
		  }	
	});
  }	else {
		resJson = {
			    "http_code" : "400",
				"message" : "Bad or ill-formed request.."
		};
		logger.error(ip + " " + TAG + " " + JSON.stringify(resJson));
		return callback(false,resJson);
	}
};