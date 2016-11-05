//This file is used to manage notifications. [inserting, deleting]

var TAG = "serviceProviderManageNotifications";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var async = require('async');

//function to insert/delete notification under particular service provider.
exports.insertNotificaiton = function(serviceProviderId, notifications, callback){
	//Variable for Logging the messages to the file.
	var logger = log.logger_sp;

	//Variable for Mongo DB Connection.
	var db = dbConfig.mongoDbConn;

	var notificationsCol = db.collection('ServiceProviderNotifications');
	var newDoc = {
			notificationsInfo : {
				serviceProviderId: null,
				notifications: []
			}
	}

	try{

		async.series([
			function(asyncCallback){		//Finding document related to service provider, if not present create new document for particular service provider.

				notificationsCol.find({"notificationsInfo.serviceProviderId": serviceProviderId}).toArray(function(error, result){
				if(error){
					logger.error(TAG + " Error while fetching document in ServiceProviderNotifications for serviceProviderId: "+serviceProviderId+", Error :"+result);
					return asyncCallback(true);
				}
				else if(result.length < 1){

					newDoc.notificationsInfo.serviceProviderId = serviceProviderId;
					notificationsCol.insert(newDoc, function(error, result){
						if(error){
							logger.error(TAG + " Error while inserting new document to ServiceProviderNotifications for serviceProviderId: "+serviceProviderId+", Error :"+result);
							return asyncCallback(true);
						}
						else{

							return asyncCallback(false);
						}
					});
				}
				else{

					return asyncCallback(false);
				}
				});
			},
			function(asyncCallback){		//Function to insert new notifications.
				var notificationsLimit = -50;	//*******IMP Leave '-' symbol as it is, it is the syntax for slice.
				notificationsCol.update(
				{
					"notificationsInfo.serviceProviderId": serviceProviderId
				},
				{
					$push: {

				  	"notificationsInfo.notifications": {
				  		$each: notifications,
				  		$slice: notificationsLimit
				  	}
					}
				}, function(error, result){
					if(error){
						logger.error(TAG + " Error inserting new notifications to ServiceProviderNotifications for serviceProviderId: "+serviceProviderId);
						return asyncCallback(true);
					}
					else{
						return asyncCallback(false);
					}
				}
				);
			}
		], function(error){	//Final function to be called.
			if(error){
				logger.error(TAG + " Error inserting new notifications to ServiceProviderNotifications for serviceProviderId: "+serviceProviderId);
				return callback(true);
			}
			else{
				return callback(false);
			}
		});

	}
	catch(exception){
		logger.error(TAG + " Exception araised while inserting new notifications to ServiceProviderNotifications for serviceProviderId: "+serviceProviderId+", exception : "+exception);
		return callback(true);
	}
}

//function to get total number of unread notifications for particular service provider.
exports.unreadNotificaitonsCount = function(serviceProviderId, callback){
	//Variable for Logging the messages to the file.
	var logger = log.logger_sp;

	//Variable for Mongo DB Connection.
	var db = dbConfig.mongoDbConn;

	var notificationsCol = db.collection('ServiceProviderNotifications');
	var finalResult = {
		notificationCount : 0
	};
	notificationsCol.aggregate([
		{
			$match: {
				"notificationsInfo.serviceProviderId": serviceProviderId
			}
		},
		{
			$unwind: "$notificationsInfo.notifications"
		},
		{
			$match: {
				"notificationsInfo.notifications.read": false
			}
		}
	], function(error, result){
		if(error){
			logger.error(TAG + " counting unread notifications for service Provider: "+serviceProviderId+", failed. Error:" + result);
			return callback(false);
		}
		else if(!error && result.length > 0){
			finalResult.notificationCount = result.length;
			return callback(false, finalResult);
		}
		else if(!error && result.length === 0){
			finalResult.notificationCount = 0;
			logger.error(TAG + " No matching unread notifications found for service Provider: "+serviceProviderId);
			return callback(false, finalResult);
		}
	});
}
