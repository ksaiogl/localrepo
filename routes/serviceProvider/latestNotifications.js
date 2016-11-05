//This API will give the latest notifications list of serviceProvider.

var TAG = "serviceProviderLatestNotifications";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var timezoneConversions = require('../helpers/timezoneConversions.js');
var async = require('async');

//Function to get list of notifications.
exports.getNotifications = function getCustomerDetails (req, callback){
	//Variable for Logging the messages to the file.
	var logger = log.logger_sp;
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	
	logger.info(TAG + " Request received for serviceProvider latest notifications list.");

	validateInput(req, function(error){
		//Variable for Logging the messages to the file.
		var logger = log.logger_sp;
		
		//Declare the response
		var resJson;

		//Variable for Mongo DB Connection. 
		var db = dbConfig.mongoDbConn;

		if(error){
			resJson = {
			    "http_code" : "400",
				"message" : "Bad or ill-formed request.."
			};
			logger.error(TAG + " Invalid input recieved for serviceProvider latest notifications list. Inputs are as below: ");
			logger.error(TAG + req);
			return callback(true, resJson);
		}
		else{

			logger.debug(TAG + " Inputs for serviceProvider latest notifications list are valid, moving forward");
			//Number of notifications to be listed.
			var limit = 10, finalResult = [];
			var db = dbConfig.mongoDbConn;
			var logger = log.logger_sp;
			var notificationsCol = db.collection('ServiceProviderNotifications');
			response_message = "Notifications not found.";

			notificationsCol.aggregate([				
								  	{
										"$match": {
											"notificationsInfo.serviceProviderId": req.body.affiliateid
										}
									},
									{
										"$unwind": "$notificationsInfo.notifications"
									},
									{
										"$sort": {"notificationsInfo.notifications.notificationSentOn": -1}
									},
									{
										"$limit": limit
									},
									{
										"$project": {
											"_id": 0,
											"notificationsInfo.notifications.type": 1,
											"notificationsInfo.notifications.title": 1,
											"notificationsInfo.notifications.read": 1,
											"notificationsInfo.notifications.notificationSentOn": 1,
										}
									}], 
						function(error, result){
							if(error)
							{
								resJson = {
								    "http_code" : "500",
									"message" : "Error - Notifications listing Failed. Please try again."
								};
								logger.error(TAG + " notifications listing for service Provider: "+req.body.affiliateid+", failed. Error:" + result);
								return callback(true, resJson);
							}
							else if(!error && result.length > 0)
							{
								result.forEach(function(currentValue, index, array){
									finalResult.push(currentValue.notificationsInfo.notifications)
								});
								resJson = {
								    "http_code" : "200",
									"message" : finalResult
								};
								logger.debug(TAG + " notifications listing for service Provider: "+req.body.affiliateid+", successfull.");

								//Calling below function to udpate the "read" status to true.
								updateNotofications(req.body.affiliateid, finalResult, function(error, result){
									//Not handling error.
								});

								return callback(false, resJson);
							}
							else if(!error && result.length === 0)
							{
								resJson = {
								    "http_code" : "200",
									"message" : result
								};
								logger.error(TAG + " No matching notifications found for service Provider: "+req.body.affiliateid);
								return callback(true, resJson);
							}
						}
					);
				}
			});
}

//Function that will validate inputs.
function validateInput(req, callback){
	var logger = log.logger_sp;
	if( !( req.body === undefined || req.body.affiliateid === undefined || req.body.affiliateid.toString().trim().length === 0) ){
		
		if(typeof req.body.affiliateid === "string"){
			logger.debug(TAG + " Got serviceProviderId "+req.body.affiliateid+" as string, converting to number type.");
			req.body.affiliateid = parseInt(req.body.affiliateid);
			if(req.body.affiliateid === NaN){
				logger.debug(TAG + " Error while converting serviceProviderId "+req.body.affiliateid+" to number type.");
				return callback(true);
			}
			return callback(false);
		}
		else{
			return callback(false);
		}
	}
	else{
		return callback(true);
	}
}

//Funciton that will update the read status to true from false.
function updateNotofications(serviceProviderId, notifications, callback){
	var db = dbConfig.mongoDbConn;
	var logger = log.logger_sp;
	var notificationsCol = db.collection('ServiceProviderNotifications');

	try{

		//asynchronously updating the "read" field.
		async.each(notifications, function(element, asyncCallback){
			notificationsCol.update(
			{
				"notificationsInfo.serviceProviderId": serviceProviderId,
				"notificationsInfo.notifications": { $elemMatch: {type: element.type, title: element.title, read: element.read, notificationSentOn: element.notificationSentOn}}
			},
			{
				$set: {
			  	"notificationsInfo.notifications.$.read": true
			  }
			},
			function(error, result){ //Final function of update function.
				if(error){
					logger.error(TAG + " Error updating ServiceProviderNotifications for element: "+JSON.stringify(element)+", serviceProviderId:"+serviceProviderId);
					return asyncCallback(true);
				}
				else{
					return asyncCallback(false);
				}
			}
			)
		}, function(error){		//Final function to be called.
			if(error){
				logger.error(TAG + " Error updating ServiceProviderNotifications for serviceProviderId: "+serviceProviderId);
				return callback(true);
			}
			else{
				logger.debug(TAG + " Succesfully updated ServiceProviderNotifications for serviceProviderId: "+serviceProviderId);
				return callback(false);
			}
		});

	}
	catch(exception){
		logger.error(TAG + " Exception araised while updating notifications in ServiceProviderNotifications for serviceProviderId: "+serviceProviderId+", exception : "+exception);
		return callback(true);
	}

}