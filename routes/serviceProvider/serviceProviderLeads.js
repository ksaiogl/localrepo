//This API will give the customer details who are interested in this serviceProvider.

var TAG = "serviceProviderLeads";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var async = require('async');

//Function for the customer details.
exports.getCustomerDetails = function getCustomerDetails (req, callback){
	//Variable for Logging the messages to the file.
	var logger = log.logger_sp;
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Declare the response
	var resJson;

	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	
	logger.info(TAG + " Request received for serviceProvider leads.");

	var response_message = null;

	validateInput(req, function(error){
		if(error){
			resJson = {
			    "http_code" : "400",
				"message" : "Bad or ill-formed request.."
			};
			logger.error(TAG + " Invalid input recieved for serviceProvider leads. Inputs are as below: ");
			logger.error(TAG + req);
			return callback(true, resJson);
		}
		else{

			logger.debug(TAG + " Inputs for serviceProvider leads are valid, moving forward");
		}
	});

	//code that will get customer information based on serviceProviderId.
	var logger = log.logger_sp;
	
	var db = dbConfig.mongoDbConn;
	var CustomerRequestsCol = db.collection('CustomerRequests');
	var response_message = [];

	CustomerRequestsCol.find({"serviceProviderChosen.serviceProviderId": req.body.serviceProviderId},{"_id": 0, "serviceProviderChosen": 0}).sort( { requestTimeStamp: -1 } ).toArray(function(error, result){
		if(error){
			logger.error(TAG + " Error while fetching Customer Requests information for serviceProviderId: "+req.body.serviceProviderId);
			resJson = {
			    "http_code" : "500",
				"message" : "Error while fetching customer requests. Please try later."
			};
			return callback(true, resJson);
		}
		else if(!error && result.length === 0){
			logger.debug(TAG + " Customer Requests not found for serviceProviderId: "+req.body.serviceProviderId);
			resJson = {
			    "http_code" : "200",
				"message" : response_message
			};
			return callback(false, resJson);
		}
		else if(!error && result.length > 0){
			logger.debug(TAG + " Got Customer Requests for serviceProviderId: "+req.body.serviceProviderId);
			resJson = {
			    "http_code" : "200",
				"message" : result
			};
			return callback(false, resJson);
		}
	});
}

//Function that will validate inputs.
function validateInput(req, validatecallback){
	var logger = log.logger_sp;
	if( req.body === undefined || req.body.serviceProviderId === undefined || req.body.serviceProviderId.toString().trim().length === 0){
		return validatecallback(true);
	}
	//checking type of serviceProviderId, if string convert it to number, since in mongodb serviceProviderId is stored as number type.
	else if(typeof req.body.serviceProviderId === "string"){
		logger.debug(TAG + " Got serviceProviderId "+req.body.serviceProviderId+" as string, converting to number type.");
		req.body.serviceProviderId = parseInt(req.body.serviceProviderId);
		if(req.body.serviceProviderId === NaN){
			logger.debug(TAG + " Error while converting serviceProviderId "+req.body.serviceProviderId+" to number type.");
			return validatecallback(true);
		}
		return validatecallback(false);
	}
	else{
		return validatecallback(false);
	}
}