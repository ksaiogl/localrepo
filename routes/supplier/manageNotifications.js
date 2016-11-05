//This file is used to manage notifications. [inserting, deleting, retrive]
var TAG = "manageNotifications- ";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var async = require('async');

//function to insert/delete notification for sellerId.
exports.insertNotificaiton = function(sellerId, notifications, callback){
	//Variable for Logging the messages to the file.
	var logger = log.logger_sup;
	//Variable for Mongo DB Connection.
	var db = dbConfig.mongoDbConn;

	var notificationsCol = db.collection('SupplierNotifications');
	var newDoc = {
			notificationsInfo : {
				sellerId: null,
				notifications: []
			}
	};

	try{

		async.series([
			function(asyncCallback){		//Finding existing document for sellerID, if not present create new document for seller/supplier.

				notificationsCol.find({"notificationsInfo.sellerId": sellerId}).toArray(function(error, result){
				if(error)
				{
					logger.error(TAG + " Error while fetching document in SupplierNotifications for sellerId: "+sellerId+", Error :"+error);
					return asyncCallback(true);
				}
				else if(result.length < 1)
				{
					newDoc.notificationsInfo.sellerId = sellerId;
					notificationsCol.insert(newDoc, function(error, result){
						if(error)
						{
							logger.error(TAG + " Error in insert to SupplierNotifications for sellerId: "+sellerId+", Error :"+error);
							return asyncCallback(true);
						}
						else
						{
							return asyncCallback(false);
						}
					});
				}
				else
				{

					return asyncCallback(false);
				}
				});
			},
			function(asyncCallback){		//Function to insert new notifications.
				var notificationsLimit = -20;	//*******IMP Leave '-' symbol as it is, it is the syntax for slice.
				notificationsCol.update({"notificationsInfo.sellerId": sellerId},
				{$push: {"notificationsInfo.notifications": {
				  		$each: notifications,
				  		$slice: notificationsLimit
				  	}
					}
				}, function(error, result){
					if(error)
					{
						logger.error(TAG + " Error inserting new notifications to SupplierNotifications for sellerId: "+sellerId);
						return asyncCallback(true);
					}
					else
					{
						return asyncCallback(false);
					}
				}
				);
			}
		], function(error){	//Final function to be called.
			if(error)
			{
				logger.error(TAG + " Error(final) -inserting new notifications to SupplierNotifications for sellerId: "+sellerId);
				return callback(true);
			}
			else
			{
				return callback(false);
			}
		});
	}
	catch(exception){
		logger.error(TAG + " Exception araised while inserting new notifications to SupplierNotifications for sellerId: "+sellerId+", exception : "+exception);
		return callback(true);
	}
}

//function to get total number of unread notifications for sellerId.
exports.unreadNotificaitonsCount = function(sellerId, callback){
	//Variable for Logging the messages to the file.
	var logger = log.logger_sup;
	//Variable for Mongo DB Connection.
	var db = dbConfig.mongoDbConn;
	var notificationsCol = db.collection('SupplierNotifications');
	var finalResult = {notificationCount : 0};

	notificationsCol.aggregate([
		{
			$match: {"notificationsInfo.sellerId": sellerId}
		},
		{
			$unwind: "$notificationsInfo.notifications"
		},
		{
			$match: {"notificationsInfo.notifications.read": false}
		}
	], function(error, result){
		if(error){
			logger.error(TAG + " counting unread notifications for sellerId: "+sellerId+", failed. Error:" + error);
			return callback(false , finalResult); // false, because error is not handled, on error will give out 0 count.
		}
		else if(!error && result.length > 0){
			finalResult.notificationCount = result.length;
			logger.debug(TAG + "unread notifications counts retrived for sellerId: "+sellerId);
			return callback(false, finalResult);
		}
		else if(!error && result.length === 0){
			finalResult.notificationCount = 0;
			logger.debug(TAG + " No matching unread notifications found for sellerId: "+sellerId);
			return callback(false, finalResult);
		}
	});
}


//Function to get list of notifications.
exports.getNotifications = function getNotifications (req, callback){
	//Variable for Logging the messages to the file.
	var logger = log.logger_sup;
	//Declare the response
	var resJson;
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	logger.info(TAG + " Request received for supplier latest notifications list." + JSON.stringify(req.body));

	validateInput(req, function(error){
		
		if(error){
			resJson = {
			    "http_code" : "400",
				"message" : "Bad or ill-formed request.."
			};
			logger.error(TAG + " Invalid input recieved for supplier latest notifications list. Inputs are as below: ");
			logger.error(TAG + req);
			return callback(true, resJson);
		}
		else
		{
			var finalResult = [];
			var notificationsCol = db.collection('SupplierNotifications');

			sellerId = req.body.sellerId;
			notificationsCol.findOne({"notificationsInfo.sellerId": sellerId},{"_id": 0, "notificationsInfo.notifications": 1},function(err, result) {	
				if(!err && (result !== null))
				{
					finalResult = result.notificationsInfo.notifications;
					resJson = {
							    "http_code" : "200",
								"message" : finalResult.reverse()
							};
					logger.debug(TAG + " notifications listing for sellerId: "+req.body.sellerId+", successfull.");
					return callback(false, resJson);
				}
				else if(!error && result === null)
				{
					resJson = {
					    "http_code" : "200",
						"message" : result
					};
					logger.debug(TAG + " No matching notifications found for sellerId: "+req.body.sellerId);
					return callback(false, resJson);
				}
				else
				{
					resJson = {
					    "http_code" : "500",
						"message" : "Error - Notifications listing Failed. Please try again."
					};
					logger.error(TAG + " notifications listing for supplier: "+req.body.sellerId+", failed. Error:" + error);
					return callback(true, resJson);
				}
			});
		}
	});
}

//Function that will validate inputs.
function validateInput(req, callback){
	var logger = log.logger_sp;
	if( !( req.body === undefined || req.body.sellerId === undefined || req.body.sellerId.toString().trim().length === 0) )
	{	
		logger.debug(TAG + "Input to the request validated successfully");
		return callback(false);
	}
	else
	{
		logger.error(TAG + "Error validating Input: "+ JSON.stringify(req.body));
		return callback(true);
	}
}