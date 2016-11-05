//This API is used to notify service provider when customer shows interests on the service provided by this service provider.

var TAG = "serviceProviderNotifyLeads";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var pushNotification = require('../helpers/pushNotification.js');
var spNotifications = require('./serviceProviderNotifications.js');
var async = require('async');

//Function for notifying service provider.
exports.notifyServiceProvider = function notifyServiceProvider (req, callback){
	//Variable for Logging the messages to the file.
	var logger = log.logger_sp;
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Declare the response
	var resJson;
	var serviceProvider_cloudTokenID = [], response_message = null;

	logger.info(TAG + " Request received for notifyServiceProvider on leads.");

	validateInput(req, function(error){
		if(error){
			resJson = {
			    "http_code" : "400",
				"message" : "Bad or ill-formed request.."
			};
			logger.error(TAG + " Invalid input recieved for notify serviceProvider on leads. Inputs are as below: ");
			logger.error(TAG + req);
			return callback(true, resJson);
		}
		else{

			logger.debug(TAG + " Inputs for notify serviceProvider on leads are valid, moving forward");
		}
	});

	async.series([
		//Function that will get mobile/phone number based on serviceProviderId.
		function(asyncCallback){
			
			var db = dbConfig.mongoDbConn;
			var logger = log.logger_sp;
			var ServiceProviderCol = db.collection('ServiceProvider');
			response_message = "Service Provider information not found.";

			ServiceProviderCol.find({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": req.body.serviceProviderId}).toArray(function(error, result){
				if(error){
					logger.error(TAG + " Error while fetching serviceProvider information for serviceProviderId: "+req.body.serviceProviderId);
					return asyncCallback(true);
				}
				else if(!error && result.length === 0){
					logger.debug(TAG + " Service Provider information not found for serviceProviderId: "+req.body.serviceProviderId);
					return asyncCallback(true);
				}
				else if(!error && result.length > 0){
					logger.debug(TAG + " Got service provider information for serviceProviderId: "+req.body.serviceProviderId);
					serviceProvider_cloudTokenID = result[0].serviceProviderEntity.appInfo.cloudTokenID;
					return asyncCallback(false);
				}
			});
		},
		//Function that will get customer information based on serviceProviderId.
		function(asyncCallback){
			var logger = log.logger_sp;
			response_message = "cloudTokenID not found.";
			if(serviceProvider_cloudTokenID === null){
				logger.debug(TAG + " cloudTokenID empty for serviceProviderId: "+req.body.serviceProviderId);
				return asyncCallback(true);
			}
			else{
				response_message = "Cant send notifications. Please try later.";
				var customerInfo = {
					firstname: "",
					lastname: "",
					mobile: "",
					emailid: "",
					serviceNeeded: "",
					description: "",
					date: new Date()
				};
				var pushInfo = {
			        "title": "New customer shows interest on service provided by you.",
			        "desc": "New customer shows interest on service provided by you.",
			        "body": null,
			        "image": null
			    };
			    /*
			    pushNotification.sendNotifications(pushInfo, serviceProvider_cloudTokenID, function(error, result){  
				if(!error)
				{
					response_message = "Successfully sent notifications.";
				    logger.debug(TAG + " - Successfully sent new leads notification to service provider "+req.body.serviceProviderId);  
				    return asyncCallback(false);
				}
				else
				{
				    logger.error(TAG + "  - Error sending new leads notification to service provider "+req.body.serviceProviderId+". Error : " + result);
				    return asyncCallback(true);
				}
			    });*/
			    return asyncCallback(false);			
			}
		}
	],
	//Final function to be called.
	function(error){
		if(error){
			resJson = {
			    "http_code" : "500",
				"message" : response_message
			};
			return callback(true, resJson);
		}
		else{
			resJson = {
			    "http_code" : "200",
				"message" : response_message
			};
			return callback(false, resJson);
		}	
	}
	);

}


//Function that will validate inputs.
function validateInput(req, callback){
	var logger = log.logger_sp;
	if( req.body === undefined || req.body.serviceProviderId === undefined || req.body.serviceProviderId.toString().trim().length === 0){
		return callback(true);
	}
	//checking type of serviceProviderId, if string convert it to number, since in mongodb serviceProviderId is stored as number type.
	else if(typeof req.body.serviceProviderId === "string"){
		logger.debug(TAG + " Got serviceProviderId "+req.body.serviceProviderId+" as string, converting to number type.");
		req.body.serviceProviderId = parseInt(req.body.serviceProviderId);
		if(req.body.serviceProviderId === NaN){
			logger.debug(TAG + " Error while converting serviceProviderId "+req.body.serviceProviderId+" to number type.");
			return callback(true);
		}
		return callback(false);
	}
	else{
		return callback(false);
	}
}
