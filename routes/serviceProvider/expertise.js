
var TAG = "paymentmodes.js";
var log = require('../../Environment/log4js.js');
var dbConfig = require('../../Environment/mongoDatabase.js');
var expert = require("./expertise.js")

//Function for the fetching the expertise.
exports.expertise =
function expertise (req, callback){

	//Variable for Logging the messages to the file.
	var logger = log.logger_sp;

	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;

	logger.info(ip + " " + TAG + " Request received for fetching the Expertise.");

	expert.expertiseFromDB(function(err,resJson){
		logger.info(ip + " " + TAG + " Request processed sucessfully for fetching the Experstise.");
		callback(err,resJson);
	});
};


//Function for the Fetching the expertise list from DB.
exports.expertiseFromDB =
function expertiseFromDB (callback){

	//Variable for Logging the messages to the file.
	var logger = log.logger_sp;

	//Variable for Mongo DB Connection.
	var db = dbConfig.mongoDbConn;

	var col = db.collection('Expertise');
	col.findOne({},{"_id":0},function(err, result) {
		if(!err && (result !== null)){
			resJson = {
				    "http_code" : "200",
					"message" : result
			};
			callback(false, resJson);
		}else if(!err && (result === null)){
			resJson = {
				    "http_code" : "500",
					"message" : "Couldn't fetch the expertise list."
			};
			logger.error(TAG + "Couldn't fetch the expertise list.");
			callback(true, resJson);
		}else{
			resJson = {
				    "http_code" : "500",
					"message" : "Unexpected Server while fulfilling the request."
			};
			logger.error(TAG + " Unexpected Server while fulfilling the request.fetching the expertise list from DB." + JSON.stringify(err));
			callback(true, resJson);

		  }
	});
};
