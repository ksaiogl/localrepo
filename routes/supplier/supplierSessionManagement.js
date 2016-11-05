var TAG = "supplierSessionManagement- ";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var crypto = require('crypto');

//Function to validate Supplier SessionID.
exports.validateSupplierSession = function validateSupplierSession (req, callback){
try
{	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	//Variable for Logging the messages to the file.
	var logger = log.logger_sup;
	//Log the request.
	logger.info("+++ " + TAG + " Request received for validateSupplierSession. +++ ");
	//Declare the response
	var resJson;
	var sellerId = req.body.sellerId;
	var sessionId = req.headers.sessionid;
	logger.debug(TAG + " sellerId: " + req.body.sellerId + ",sessionId: " + req.headers.sessionid);
	//Validate the request.	
	if (!(req.body.sellerId === undefined || req.headers.sessionid === undefined || req.body.sellerId === null || req.headers.sessionid === null || req.body.sellerId.toString().trim().length === 0 || 
		req.headers.sessionid.toString().trim().length === 0))
	{
		var supplierSessionColl = db.collection('SupplierSessions');
		supplierSessionColl.findOne({"sellerId": sellerId}, function(err, result) {
			logger.debug(TAG + "Result from DB for sellerId: "+ sellerId +" result: "+ JSON.stringify(result));
			if(!err && (result !== null))
			{
				if(result.sellerSessionId === sessionId)
				{
					logger.debug(TAG + " Supplier session validates successfully for sellerId: "+ sellerId);
					supplierSessionColl.update({"sellerId": sellerId, "sellerSessionId" : result.sellerSessionId}, {$set: {"createdAt": new Date()}}, function(err, result) {
						if(!err)
						{
							logger.debug(TAG + " Supplier session expiry updated successfully for sellerId: "+ sellerId);	
						}
						else
						{
							logger.error(TAG + "Error updating session for sellerId: "+sellerId+" ,sessionId: "+result.sellerSessionId+" ,Server Error: " + err);
						}	
					});
					return callback(false, "Supplier Validated Successfully");
				}
				else
				{
					logger.error(TAG + "Failed Validating Supplier session for sellerId: "+ sellerId +" ,sessionId: "+sessionId);
					resJson = {
					    "http_code" : "401",
						"message" : "Invalid Session. Please Login again or contact support team"
					};
					return callback(true, resJson);
				}	
			}
			else if(!err && (result === null))
			{
				resJson = {
					    "http_code" : "401",
						"message" : "Session timed out. Please Login again"
				};
				logger.error(TAG + "Session timed out, Session has expired, Login to create new session for sellerId:" + sellerId);
				return callback(true, resJson);
			}
			else
			{
				resJson = {
					    "http_code" : "500",
						"message" : "Error validating session, Server Error. Please try again"
				};
				logger.error(TAG + "Error validating session for sellerId: "+sellerId+" ,sessionId: "+sessionId+" ,Server Error: " + err);
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
		logger.error(TAG + "Bad or ill-formed request.. req.body: " + JSON.stringify(req.body)+" req.headers: " + JSON.stringify(req.headers));
		return callback(true,resJson);
	}
}
catch(e)
{
  console.log(TAG + "Exception in validateSupplierSession- " + e);
  logger.error(TAG + "Exception in validateSupplierSession:- error :" + e);
  resJson = {
			    "http_code" : "500",
				"message" : "Server Error. Please try again."
		};
  return callback(true, resJson);
}

};

//Function to validate Supplier SessionID.
exports.validateSupplierSessionWithMobile = function validateSupplierSessionWithMobile (req, callback){
try
{	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	//Variable for Logging the messages to the file.
	var logger = log.logger_sup;
	//Log the request.
	logger.info("+++ " + TAG + " Request received for validateSupplierSessionWithMobile. +++ ");
	//Declare the response
	var resJson;
	var mobile = req.body.mobile;
	var sessionId = req.headers.sessionid;
	logger.debug(TAG + " mobile: " + req.body.mobile + ",sessionId: " + req.headers.sessionid);
	//Validate the request.
	if (!(req.body.mobile === undefined || req.headers.sessionid === undefined || req.body.mobile === null || req.headers.sessionid === null || req.body.mobile.toString().trim().length === 0 || 
		req.headers.sessionid.toString().trim().length === 0))
	{
		
		var supplierColl = db.collection('Supplier');
		supplierColl.findOne({"supplierEntity.contactInfo.primaryMobile": mobile},{"supplierEntity.identifier.sellerId" : 1}, function(err, results) {
			logger.debug(TAG + "Result from supplier DB for mobile: "+ mobile +" result: "+ JSON.stringify(results));
			if(!err && (results !== null))
			{
				var sellerId = results.supplierEntity.identifier.sellerId;
				var supplierSessionColl = db.collection('SupplierSessions');
				supplierSessionColl.findOne({"sellerId": sellerId}, function(err, result) {
					logger.debug(TAG + "Result from DB for sellerId: "+ sellerId +" result: "+ JSON.stringify(result));
					if(!err && (result !== null))
					{
						if(result.sellerSessionId === sessionId)
						{
							logger.debug(TAG + " Supplier session validates successfully for sellerId: "+ sellerId);
							supplierSessionColl.update({"sellerId": sellerId, "sellerSessionId" : result.sellerSessionId}, {$set: {"createdAt": new Date()}}, function(err, result) {
								if(!err)
								{
									logger.debug(TAG + " Supplier session expiry updated successfully for sellerId: "+ sellerId);	
								}
								else
								{
									logger.error(TAG + "Error updating session for sellerId: "+sellerId+" ,sessionId: "+result.sellerSessionId+" ,Server Error: " + err);
								}	
							});
							return callback(false, "Supplier Validated Successfully");
						}
						else
						{
							logger.error(TAG + "Failed Validating Supplier session for sellerId: "+ sellerId +" ,sessionId: "+sessionId);
							resJson = {
							    "http_code" : "401",
								"message" : "Invalid Session. Please Login again or contact support team"
							};
							return callback(true, resJson);
						}	
					}
					else if(!err && (result === null))
					{
						resJson = {
							    "http_code" : "401",
								"message" : "Session timed out. Please Login again"
						};
						logger.error(TAG + "Session timed out, Session has expired, Login to create new session for sellerId:" + sellerId);
						return callback(true, resJson);
					}
					else
					{
						resJson = {
							    "http_code" : "500",
								"message" : "Error validating session, Server Error. Please try again"
						};
						logger.error(TAG + "Error validating session for sellerId: "+sellerId+" ,sessionId: "+sessionId+" ,Server Error: " + err);
						return callback(true, resJson);
					}	
				});
			}
			else if(!err && (results === null))
			{
				logger.error(TAG + "No Seller found for mobile: "+mobile+" in SupplierDB.");
				resJson = {
							    "http_code" : "500",
								"message" : "Could not find supplier profile registered with mobile:"+mobile+". Please try again"
						};
				return callback(true, resJson);		
			}
			else
			{
				logger.error(TAG + "Error fetching Seller details for mobile: "+mobile+" in SupplierDB. err: "+err);
				resJson = {
							    "http_code" : "500",
								"message" : "Server Error. Please try again."
						};
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
		logger.error(TAG + "Bad or ill-formed request.. req.body: " + JSON.stringify(req.body)+" req.headers: " + JSON.stringify(req.headers));
		return callback(true,resJson);
	}
}
catch(e)
{
  console.log(TAG + "Exception in validateSupplierSessionWithMobile- " + e);
  logger.error(TAG + "Exception in validateSupplierSessionWithMobile:- error :" + e);
  resJson = {
			    "http_code" : "500",
				"message" : "Server Error. Please try again."
		};
  return callback(true, resJson);
}

};

//Function to create Supplier SessionId.
exports.createSupplierSession = function createSupplierSession (mobile, callback){
try{	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	//Variable for Logging the messages to the file.
	var logger = log.logger_sup;
	//Log the request.
	logger.info("+++ " + TAG + " Request received for createSupplierSession. +++ ");
	//Declare the response
	var resJson;

	logger.debug(TAG + " mobile: " + mobile);
	//Validate the request.
	if (!(mobile === null || mobile.toString().trim().length === 0))
	{
		var supplierColl = db.collection('Supplier');
		supplierColl.findOne({"supplierEntity.contactInfo.primaryMobile": mobile},{"supplierEntity.identifier.sellerId" : 1}, function(err, results) {
			logger.debug(TAG + "Result from supplier DB for mobile: "+ mobile +" result: "+ JSON.stringify(results));
			if(!err && (results !== null))
			{

				var sellerId = results.supplierEntity.identifier.sellerId;
				var supplierSessionColl = db.collection('SupplierSessions');
				//Check if the Session is already created. If exist, Do not create a new session, send the existing session. (Session Expires in 30 days)
				supplierSessionColl.findOne({"sellerId": sellerId}, function(err, existingSession) {
					logger.debug(TAG + "Result from SupplierSessions DB for sellerId: "+ sellerId +" result: "+ JSON.stringify(existingSession));
					if(!err && (existingSession === null))
					{
						var recordTime = new Date();
						var sellerSessionId = crypto.createHash('sha256').update(recordTime.getTime().toString() + sellerId).digest('base64')
						supplierSessionColl.insert({"sellerId": sellerId, "sellerSessionId" : sellerSessionId,"createdAt": new Date()}, function(err, result) {
							if(!err)
							{
								logger.debug(TAG + " Supplier session created successfully for sellerId: "+ sellerId);
								return callback(false, sellerSessionId);	
							}
							else
							{
								resJson = {
									    "http_code" : "500",
										"message" : "Error establishing user session, Server Error. Please try again"
								};
								logger.error(TAG + "Error creating session for sellerId: "+sellerId+" ,sessionId: "+sellerSessionId+" ,Server Error: " + err);
								return callback(true, resJson);
							}	
						});
					}
					else if(!err && (existingSession !== null))	
					{
						logger.debug(TAG + " Supplier session already exists for sellerId: "+ sellerId);
						var sellerSessionId = existingSession.sellerSessionId;
						return callback(false, sellerSessionId);
					}
					else
					{
						logger.error(TAG + "Error fetching details from SupplierSessions for SellerId: "+sellerId);
						resJson = {
									    "http_code" : "500",
										"message" : "Server Error. Please try again."
								};
						return callback(true, resJson);
					}
				});
			}
			else if(!err && (results === null))
			{
				logger.error(TAG + "No Seller found for mobile: "+mobile+" in SupplierDB.");
				resJson = {
							    "http_code" : "500",
								"message" : "Could not find supplier profile registered with mobile:"+mobile+". Please try again"
						};
				return callback(true, resJson);		
			}
			else
			{
				logger.error(TAG + "Error fetching Seller details for mobile: "+mobile+" in SupplierDB. err: "+err);
				resJson = {
							    "http_code" : "500",
								"message" : "Server Error. Please try again."
						};
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
		logger.error(TAG + "Bad or ill-formed request.. mobile: " + mobile);
		return callback(true,resJson);
	}	
}
catch(e)
{
  console.log(TAG + "Exception in createSupplierSession- " + e);
  logger.error(TAG + "Exception in createSupplierSession:- error :" + e);
  resJson = {
			    "http_code" : "500",
				"message" : "Server Error. Please try again."
		};
  return callback(true, resJson);
}

};