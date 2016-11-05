var TAG = "SupplierLogin";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var crypto = require('crypto');
var manageNotifications = require('./manageNotifications.js');
var decryption = require('../helpers/encryptDecryptFunction.js');
var async = require('async');

//Function for the Login.
exports.login = function login (req, sessionId, callback){
	
	var resJson = {
			"http_code" : "500",
		"message" : "Dear Supplier, \nWe are upgrading our App and will be back soon. Meanwhile, please visit mSupply.com for your requirements. Thank you for your support.\nTeam mSupply."
	};
	// logger.error(ip + " " + TAG + " user with mobile no "+ mobile + " login failed Exception :" + exception);
	return callback(true, resJson);

	/*
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	//Variable for Logging the messages to the file.
	var logger = log.logger_sup;
	//Log the request.
	logger.info("+++ " + TAG + " Request received for Login. +++ ");
	//Declare the response
	var resJson;

	logger.debug(TAG + " Info in headers: " + JSON.stringify(req.headers));
	//Validate the request.
	if ( !(	req.body === null || req.headers.appversion  === undefined || req.body.mobile === undefined || 
		req.body.password === undefined || req.body.mobile.toString().trim().length === 0 || 
		req.body.password.toString().trim().length === 0 || req.body.mobile === null ||
		req.body.password === null )) 
	{

		logger.debug(TAG + " Body: " + JSON.stringify(req.body));
		decryption.decrypt(req.body.password, function(err, decryptedPass){
			if(!err && decryptedPass != null)
			{
				var mobile = req.body.mobile;
				var pass = decryptedPass;
				var appVersion = req.headers.appversion; //Current user App version is sent in headers.
				var supplierColl = db.collection('Supplier');
				var unreadNotificaitons = 0;
				//Hash incoming password with md5
				var passwordHash = crypto.createHash('md5').update(pass).digest('hex');

				supplierColl.findOne({"supplierEntity.contactInfo.primaryMobile": mobile, "supplierEntity.passwords.passwordHash": passwordHash},
					{"_id": 0, "supplierEntity.passwords": 0, "supplierEntity.agreementInfo": 0, "supplierEntity.identifier.MagentoCustID" : 0, 
					"supplierEntity.contactInfo.secondaryFirstName": 0,"supplierEntity.contactInfo.secondaryLastName": 0,"supplierEntity.contactInfo.secondaryEmail": 0, "supplierEntity.appInfo": 0  }, function(err, result) {
					if(!err && (result !== null))
					{
						//**************To get the latest notifications count for Supplier and add new field "unreadNotificationsCount".
						try{
							//setting default count as 0;
							result.supplierEntity.unreadNotificationsCount = unreadNotificaitons;
							var sellerId = result.supplierEntity.identifier.sellerId;
							manageNotifications.unreadNotificaitonsCount(sellerId, function(error, notifyRes){
								if(!error)
								{
									result.supplierEntity.sessionId = sessionId;
									result.supplierEntity.unreadNotificationsCount = notifyRes.notificationCount;
									
									encryptKeys(result, function(err, encryptedResult){
										if(!err && encryptedResult != null)
										{
											resJson = {
											    "http_code" : "200",
												"message" : encryptedResult
											};
											logger.debug(TAG + "unreadNotificaitonsCount fetched for seller: "+sellerId+ ", notifyRes.notificationCount: "+ notifyRes.notificationCount);

											//Updating lastLoginTime field and Appversion f(Asyncronous call)
											supplierColl.update({"supplierEntity.contactInfo.primaryMobile": mobile, "supplierEntity.passwords.passwordHash": passwordHash}, {$set: {"supplierEntity.lastLoginTime": new Date(), "supplierEntity.appInfo.currentAppVersion":appVersion}}, function(error, results){
												if(error)
												{
													logger.error(TAG + " Error -lastLoginTime Updation failed for mobile number " + mobile);
												}	
											});

											logger.debug(TAG + " Supplier with mobile no: "+ mobile + " logged in successfully");
											return callback(false, resJson);
										}
										else
										{
											resJson = {
										    "http_code" : "500",
											"message" : "Login Failed, Server Error. Please try again"
											};
											logger.error(TAG + "Failed to encrypt result for, mobile: " + mobile);
											return callback(true, resJson);
										}
									});		
								}
							});
						}
						catch(exception){
							logger.error(TAG + " Exception araised while adding unreadNotificaitons count for "+ mobile + " login failed...!!!, err: " + exception);
							console.log(" Exception araised while adding unreadNotificaitons count for "+ mobile + " login failed...!!!, err: " + exception);
							resJson = {
							    "http_code" : "500",
								"message" : "Internal Server Error. Please try again"
								};	
							return callback(true, resJson);
						}
						//************** latest notifications count for Supplier ends here.			
					}
					else if(!err && (result === null))
					{
						resJson = {
							    "http_code" : "500",
								"message" : "Invalid Mobile Number or Password or both. Please try again"
						};
						logger.error(TAG + " Supplier login failed...!!!, mobile: " + mobile + "passwordHash:" + passwordHash);
						return callback(true, resJson);
					}
					else
					{
						resJson = {
							    "http_code" : "500",
								"message" : "Login Failed, Server Error. Please try again"
						};
						logger.error(TAG + "Login failed...!!!, Server Error: " + err);
						return callback(true, resJson);
					}
				});
			}
			else
			{
				resJson = {
						    "http_code" : "500",
							"message" : "Login Failed, Server Error. Please try again"
					};
					logger.error(TAG + "Error Decrypting Password for mobile: "+ mobile + "error: " +decryptedPass);
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
		logger.error(TAG + "Bad or ill-formed request.. reqBody: " +  JSON.stringify(req.body));
		return callback(true,resJson);
	}
	*/	
};

// Function to Encrypt important output fields of login
function encryptKeys(result, callback){
	
	var logger = log.logger_sup;
	try
	{	
		async.parallel([
			//Function to encrypt bankName.
			function(asyncCallback){
				var resJson ={};
				if (!(result.supplierEntity.bankInfo.bankName  === undefined || result.supplierEntity.bankInfo.bankName === null ||
					result.supplierEntity.bankInfo.bankName.toString().trim().length === 0))
				{
					var bankName = result.supplierEntity.bankInfo.bankName;	
					decryption.encrypt(bankName, function(err, encryptedBankName){
						if(!err && encryptedBankName != null)
						{
							resJson.bankName = encryptedBankName;
							return asyncCallback(false, resJson);	
						}
						else
						{
							logger.error(TAG + "Error encrypting bankName for mobile: "+ mobile + "error: " +encryptedBankName);
							return callback(true, resJson);
						}
					});
				}
				else
				{
					resJson.bankName = null;
					return asyncCallback(false, resJson);
				}	
			},
			//Function to get accountNumber.
			function(asyncCallback){
				var resJson ={};
				if (!(result.supplierEntity.bankInfo.accountNumber  === undefined || result.supplierEntity.bankInfo.accountNumber === null ||
					result.supplierEntity.bankInfo.accountNumber.toString().trim().length === 0))
				{
					var accountNumber = result.supplierEntity.bankInfo.accountNumber;
					decryption.encrypt(accountNumber, function(err, encryptedAccountNumber){
						if(!err && encryptedAccountNumber != null)
						{
							resJson.accountNumber = encryptedAccountNumber;
							return asyncCallback(false, resJson);	
						}
						else
						{
							logger.error(TAG + "Error encrypting accountNumber for mobile: "+ mobile + "error: " +encryptedAccountNumber);
							return callback(true, resJson);
						}
					});
				}
				else
				{
					resJson.accountNumber = null;
					return asyncCallback(false, resJson);
				}	
			},
			//Function to get VAT_TIN.
			function(asyncCallback){
				var resJson ={};
				
				if (!(result.supplierEntity.taxInfo.VAT_TIN  === undefined || result.supplierEntity.taxInfo.VAT_TIN === null ||
					result.supplierEntity.taxInfo.VAT_TIN.toString().trim().length === 0))
				{
					var VAT_TIN = result.supplierEntity.taxInfo.VAT_TIN;
					decryption.encrypt(VAT_TIN, function(err, encryptedVAT){
						if(!err && encryptedVAT != null)
						{
							resJson.VAT_TIN = encryptedVAT;
							return asyncCallback(false, resJson);	
						}
						else
						{
							resJson = {
									    "http_code" : "500",
										"message" : "Internal Server Error..Please retry.."
								};
								logger.error(TAG + "Error encrypting VAT for mobile: "+ mobile + "error: " +encryptedVAT);
								return callback(true, resJson);
						}
					});
				}
				else
				{
					resJson.VAT_TIN = null;
					return asyncCallback(false, resJson);
				}	
			},
			//Function to encrypt STNumber.
			function(asyncCallback){
				var resJson ={};
				if (!(result.supplierEntity.taxInfo.STNumber  === undefined || result.supplierEntity.taxInfo.STNumber === null ||
					result.supplierEntity.taxInfo.STNumber.toString().trim().length === 0))
				{
					var STNumber = result.supplierEntity.taxInfo.STNumber;
					decryption.encrypt(STNumber, function(err, encryptedTIN){
						if(!err && encryptedTIN != null)
						{
							resJson.STNumber = encryptedTIN;
							return asyncCallback(false, resJson);	
						}
						else
						{
							resJson = {
									    "http_code" : "500",
										"message" : "Internal Server Error..Please retry.."
								};
								logger.error(TAG + "Error encrypting STNumber for mobile: "+ mobile + "error: " +encryptedTIN);
								return callback(true, resJson);
						}
					});
				}
				else
				{
					resJson.STNumber = null;
					return asyncCallback(false, resJson);
				}	
			},
			//Function to get PAN.
			function(asyncCallback){
				var resJson ={};
				if (!(result.supplierEntity.taxInfo.PAN  === undefined || result.supplierEntity.taxInfo.PAN === null ||
					result.supplierEntity.taxInfo.PAN.toString().trim().length === 0))
				{
					var PAN = result.supplierEntity.taxInfo.PAN;
					decryption.encrypt(PAN, function(err, encryptedPAN){
						if(!err && encryptedPAN != null)
						{
							resJson.PAN = encryptedPAN;
							return asyncCallback(false, resJson);	
						}
						else
						{
							resJson = {
									    "http_code" : "500",
										"message" : "Internal Server Error..Please retry.."
								};
								logger.error(TAG + "Error encrypting PAN for mobile: "+ mobile + "error: " +encryptedPAN);
								return callback(true, resJson);
						}
					});
				}
				else
				{
					resJson.PAN = null;
					return asyncCallback(false, resJson);
				}	
			},
			//Function to get sessionId.
			function(asyncCallback){
				var resJson ={};
				if (!(result.supplierEntity.sessionId  === undefined || result.supplierEntity.sessionId === null ||
					result.supplierEntity.sessionId.toString().trim().length === 0))
				{
					var sessionId = result.supplierEntity.sessionId;
					decryption.encrypt(sessionId, function(err, encryptedSessionId){
						if(!err && encryptedSessionId != null)
						{
							resJson.sessionId = encryptedSessionId;
							return asyncCallback(false, resJson);	
						}
						else
						{
							resJson = {
									    "http_code" : "500",
										"message" : "Internal Server Error..Please retry.."
								};
								logger.error(TAG + "Error encrypting sessionId for mobile: "+ mobile + "error: " +encryptedSessionId);
								return callback(true, resJson);
						}
					});
				}
				else
				{
					resJson.sessionId = null;
					return asyncCallback(false, resJson);
				}	
			}
		],
		//Final function that will be called by functions defined in parallel.
		////Function to get all encrypted keys.
		function(error, results){															
			if(!error){
				logger.debug(TAG + " encrypted Result: " + JSON.stringify(results));
				
				for(var i = 0; i < results.length; i++)
				{
					if(!(results[i].bankName === undefined || results[i].bankName === null))
					{
						result.supplierEntity.bankInfo.bankName = results[i].bankName;
					}
					else if(!(results[i].accountNumber === undefined || results[i].accountNumber === null))
					{
						result.supplierEntity.bankInfo.accountNumber = results[i].accountNumber;
					}
					else if(!(results[i].VAT_TIN === undefined || results[i].VAT_TIN === null))
					{
						result.supplierEntity.taxInfo.VAT_TIN = results[i].VAT_TIN;
					}
					else if(!(results[i].STNumber === undefined || results[i].STNumber === null))
					{
						result.supplierEntity.taxInfo.STNumber = results[i].STNumber;
					}
					else if(!(results[i].PAN === undefined || results[i].PAN === null))
					{
						result.supplierEntity.taxInfo.PAN = results[i].PAN;
					}
					else if(!(results[i].sessionId === undefined || results[i].sessionId === null))
					{
						result.supplierEntity.sessionId = results[i].sessionId;
					}		
				}
				return callback(false, result);
			}
			else
			{
				logger.error(TAG + " error encrypting keys.");
				return callback(true, null);
			}
		});
	}
	catch(e)
  	{
    	console.log(TAG + "Exception in login - encryptKeys:  " + e);
    	logger.error(TAG + "Exception in login - encryptKeys :- error :" + e);
		return callback(true, null);
  	}
}