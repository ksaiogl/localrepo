var TAG = "SupplierConfigService- ";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var crypto = require('crypto');

//Function for the Login.
exports.loadconfig = function loadconfig (req, callback){
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	//Variable for Logging the messages to the file.
	var logger = log.logger_sup;
	//Log the request.
	logger.info("+++ " + TAG + " Request received for SupplierConfigService. +++ ");
	//Declare the response
	var resJson;
	
	var appConfigColl = db.collection('AppConfiguration');

	appConfigColl.findOne({"appConfig": "Supplier"}, {"_id": 0}, function(err, result) {
		if(!err && (result !== null))
		{
			resJson = {
				    "http_code" : "200",
					"message" : result
			};
			
			return callback(false, resJson);
		}
		else if(!err && (result === null))
		{
			resJson = {
				    "http_code" : "500",
					"message" : "No App config found. Please try again"
			};
			logger.error(TAG + " No App config found.");
			return callback(true, resJson);
		}
		else
		{
			resJson = {
				    "http_code" : "500",
					"message" : "Error getting App Config. Please try again"
			};
			logger.error(TAG + " Error getting App Config, Server Error: " + err);
			return callback(true, resJson);
		}	
	});	
};


//Function for the Forgot Password.
exports.updateAppinfo= function updateAppinfo (req, callback){
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;	
	//Variable for Logging the messages to the file.
	var logger = log.logger_sup;
	//Log the request.
	logger.info("+++ " + TAG + " Request received for updateUserConfig. +++ ");

	//Declare the response
	var resJson;
	//Validate the request.
	if ( !(	req.body === null || req.body.mobile === undefined || req.body.currentAppVersion === undefined || 
		req.body.cloudTokenID === undefined || req.body.mobile.toString().trim().length === 0 ||
		req.body.currentAppVersion.toString().trim().length === 0 || req.body.cloudTokenID.toString().trim().length === 0)) 
	{

		logger.debug(TAG + " Body: " + JSON.stringify(req.body));
		var mobile = req.body.mobile;
		var currentAppVersion = req.body.currentAppVersion;
		var cloudTokenID = req.body.cloudTokenID;

		var supplierColl = db.collection('Supplier');
		supplierColl.findOne({"supplierEntity.contactInfo.primaryMobile": mobile},{"_id": 0 },function(err, result) {	
			if(!err && (result !== null))
			{	
				//supplierColl.update({"supplierEntity.contactInfo.primaryMobile": mobile},{ $push: { "supplierEntity.appInfo": appInfo } },function(err, result) {
				supplierColl.update({"supplierEntity.contactInfo.primaryMobile": mobile},{"$addToSet": { "supplierEntity.appInfo.cloudTokenID": cloudTokenID },"$set" : {"supplierEntity.appInfo.currentAppVersion":currentAppVersion}},function(err, result) { 
				//supplierColl.update({"supplierEntity.contactInfo.primaryMobile": mobile},{"$push": { "supplierEntity.appInfo.cloudTokenID": {$each: [cloudTokenID], $slice: -10} },"$set" : {"supplierEntity.appInfo.currentAppVersion":currentAppVersion}},function(err, result) { 
					if(!err)
					{
						logger.debug(TAG + " Supplier's currentAppVersion and cloudTokenID are update for mobile no- "+ mobile);
						resJson = {
							    "http_code" : "200",
								"message" : "currentAppVersion and cloudTokenID are updated successfully."
						};
						return callback(false, resJson);
					}
					else
					{
						logger.error(TAG + " Error updating currentAppVersion and cloudTokenID for mobile no... " + mobile + " err: " + err);
						resJson = {
							    "http_code" : "500",
								"message" : "Error updating currentAppVersion and cloudTokenID"
						};
						return callback(true, resJson);
					}
				});
			} 
			else if(!err && (result === null))
			{
				resJson = {
					    "http_code" : "500",
						"message" : "The inputs does not match with our records..Please retry.."
				};

				logger.error(TAG + "Invalid Inputs, Inputs doesnt match with the database records, mobile: " + mobile);
				return callback(true, resJson);
			}
			else
			{
				resJson = {
					    "http_code" : "500",
						"message" : "Internal Server Error..Please retry.."
				};

				logger.error(TAG + "Internal Server Error. err: " + err);
				return callback(true, resJson);
			}	
		});
	}
	else 
	{
		resJson = {
			    "http_code" : "400",
				"message" : "Bad or ill-formed request.."
		};
		logger.error(TAG + "Bad or ill-formed request. reqBody: " + JSON.stringify(req.body));
		return callback(true, resJson);
	}
};
