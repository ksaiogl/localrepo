var TAG = "SupplierLogin";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var crypto = require('crypto');
//Module for generating the OTP.
var otp = require('otplib/lib/totp');
var request = require("request");

//var manageNotifications = require('./manageNotifications.js');
var async = require('async');
var supplierLeadLoginManagement = require('./supplierLeadLoginManagement.js');
var magentoRegistration = require('../magento/magentoAPI.js');
var notifications = require('../helpers/notifications.js');
var supNotifications = require('../supplier/supplierNotifications.js');

//Function for the Login.
exports.login = function login (req, callback){
	
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
	if ( !(	req.body === null || req.body.userId === undefined || 
		req.body.password === undefined || req.body.userId.toString().trim().length === 0 || 
		req.body.password.toString().trim().length === 0 || req.body.userId === null ||
		req.body.password === null )) 
	{
		logger.debug(TAG + " Body: " + JSON.stringify(req.body));
		
		var userId = req.body.userId.toLowerCase();
		var appVersion = "webLogin"; //Current user App version is sent in headers.
		var sellerColl = db.collection('SellerMaster');
		//Hash incoming password with md5
		var passwordHash = crypto.createHash('md5').update(req.body.password).digest('hex');
		// Supplier should have the RFQAuthEnabled set to True.
		sellerColl.findOne({"sellerEntity.profileInfo.accountInfo.userId": userId, "sellerEntity.profileInfo.accountInfo.passwordHash": passwordHash, "sellerEntity.sellerVerificationStatus" : { $ne :"disabled"} },
							{"_id": 0, "sellerEntity.profileInfo.accountInfo.passwordHash" : 0, "sellerEntity.profileInfo.accountInfo.previousPasswordHash" : 0, "sellerEntity.profileInfo.accountInfo.leadSource" : 0,
							"sellerEntity.sellerTermsInfo.termsAcceptedTimeStamp" : 0, "sellerEntity.sellerVerificationInfo.crmApprovedTimeStamp": 0,
							"sellerEntity.sellerVerificationInfo.emailVerifiedTimeStamp" : 0 }, function(err, result) {
		
			if(!err && (result !== null))
			{
				var loginResult = result;
				loginResult.sellerEntity.termsAccepted = result.sellerEntity.sellerTermsInfo.termsAccepted;				
				loginResult.sellerEntity.emailVerified = result.sellerEntity.sellerVerificationInfo.emailVerified;
				delete result.sellerEntity.sellerTermsInfo.termsAccepted;
				loginResult.sellerEntity.loginInfo = result.sellerEntity.sellerTermsInfo;				
				delete result.sellerEntity.sellerTermsInfo;
				delete result.sellerEntity.sellerVerificationInfo;
				resJson = {
				    "http_code" : "200",
					"message" : loginResult
				};	
				//Updating lastLoginTime field and Appversion f(Asyncronous call)
				sellerColl.update({"sellerEntity.profileInfo.accountInfo.userId": userId, "sellerEntity.profileInfo.accountInfo.passwordHash": passwordHash }, {$set: {"sellerEntity.sellerTermsInfo.lastLoginTime": new Date(), "sellerEntity.sellerTermsInfo.firstTimeLogin" : false, "sellerEntity.sellerTermsInfo.lastLoginSource":appVersion}}, function(error, result){
					if(error)
					{
						logger.error(TAG + " Error -lastLoginTime Updation failed for User Id " + userId);
					}	
				});
				logger.debug(TAG + " Supplier with User Id: "+ userId + " logged in successfully");
				return callback(false, resJson);
					
			}
			else if(!err && (result === null))
			{
				//// Check Seller Lead collection ....
				var sellerLeadColl = db.collection('SellerLead');
				sellerLeadColl.findOne({"sellerLeadEntity.userId" : userId, "sellerLeadEntity.passwordHash" : passwordHash, "sellerLeadEntity.crmStatus" :  { $ne :"rejected"} }, function(lerr, lresult){
					if(lerr){
						resJson = {
					    "http_code" : "500",
						"message" : "Login Failed, Server Error. Please try again"
						};
						logger.error(TAG + "Login failed...!!!, Server Error: Seller Lead " + lerr);
						return callback(true, resJson);
					}
					else{
							if(!lerr && (lresult !== null))
							{
								resJson = {
								    "http_code" : "202",
									"message" : "Profile verification under process.."
								};	
								return callback(false, resJson);
							}
							else{
								resJson = {
										    "http_code" : "500",
											"message" : "Invalid User Id or Password or both. Please try again"
								};
								logger.error(TAG + " Supplier login failed...!!, userId: " + userId + "passwordHash:" + passwordHash);
								return callback(true, resJson);
							}
					}
				});				
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
			    "http_code" : "400",
				"message" : "Bad or ill-formed request.."
		};
		logger.error(TAG + "Bad or ill-formed request.. reqBody: " +  JSON.stringify(req.body));
		return callback(true, resJson);
	}
};

//Function for the Change Password.
exports.changePassword = function changePassword (req, callback){
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	//Variable for Logging the messages to the file.
	var logger = log.logger_sup;
	//Log the request.
	logger.info("+++ " + TAG + " Request received for changePassword. +++ ");
	//Declare the response
	var resJson;
	if ( !( req.body === null || req.body.currentPassword === undefined ||
	 req.body.newPassword === undefined || req.body.currentPassword.toString().trim().length === 0 ||
	 req.body.newPassword.toString().trim().length === 0 || req.body.currentPassword === null || 
	 req.body.newPassword === null ))
	{
    	logger.debug(TAG + " Body: " + JSON.stringify(req.body));
		var userId = req.body.supplierSession.sellerEntity.profileInfo.accountInfo.userId;
		var newPassword = req.body.newPassword;
		var currentPassword = req.body.currentPassword;
		//var sellerId = req.body.supplierSession.sellerEntity.profileInfo.accountInfo.sellerId;		
		var sellerMasterColl = db.collection('SellerMaster');

		var passwordHash = crypto.createHash('md5').update(newPassword).digest('hex');
		var currentPasswordHash = crypto.createHash('md5').update(currentPassword).digest('hex');
		sellerMasterColl.findOne({"sellerEntity.profileInfo.accountInfo.userId": userId, "sellerEntity.profileInfo.accountInfo.passwordHash" : currentPasswordHash, "sellerEntity.sellerVerificationStatus" : { $ne :"disabled"} },{"_id": 0, "sellerEntity.profileInfo.accountInfo" : 1, "sellerEntity.profileInfo.basicInfo" : 1 },function(err, result) {
			if(!err && (result !== null))
			{			
				var supplierInfo = {
					"supplierName": result.sellerEntity.profileInfo.basicInfo.contactPerson,
					"supplierPrimaryEmail": result.sellerEntity.profileInfo.basicInfo.email,
					"supplierPrimaryMobile": result.sellerEntity.profileInfo.basicInfo.mobile
				};
				// Update Password
				sellerMasterColl.update({"sellerEntity.profileInfo.accountInfo.userId": userId },{$set :{"sellerEntity.profileInfo.accountInfo.previousPasswordHash" : currentPasswordHash,"sellerEntity.profileInfo.accountInfo.passwordHash" : passwordHash }}, function(err, result) {
					if(!err)
					{
						//Calling function that will notify supplier regarding password change.
						supNotifications.notifyOnPasswordChange(supplierInfo, function(err, result){			
						});
						// Updating in seller Lead collection...
						var sellerLeadColl = db.collection('SellerLead');
						sellerLeadColl.update({"sellerLeadEntity.userId" : userId }, {$set : {"sellerLeadEntity.passwordHash" : passwordHash}}, function(lerr, lresult){
							if(!err){
								resJson = {
							    "http_code" : "200",
								"message" : "Password change successfull.."
								};
								logger.debug("Password changed successfully for userId : " + userId);
								return callback(false, resJson);
							}
							else{
								resJson = {
							    "http_code" : "500",
								"message" : "Password change failed. Please retry..."
								};
								logger.error(TAG + "Password change failed: " + err);
								return callback(true, resJson);
							}
						});
						
					}
					else
					{
						resJson = {
							    "http_code" : "500",
								"message" : "Password change failed. Please retry..."
						};
						logger.error(TAG + "Password change failed: " + err);
						return callback(true, resJson);
					}
				});			
			}
			else if(!err && (result === null))
			{				
				logger.error(TAG + " Supplier Change Password failed...!!!, user id: " + userId);
				resJson = {
						    "http_code" : "500",
							"message" : "Invalid user id/password. Please try again"
						};
				return callback(true, resJson);
			} 
			else
			{
				resJson = {
					    "http_code" : "500",
						"message" : "Internal Server Error..Please retry.."
				};
				logger.error(TAG + " Internal Server Error.. err: " + err);
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
		callback(true,resJson);
	}
};


////Get Supplier Details for Session Management
exports.getDetails =  function(req, callback){
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	//Variable for Logging the messages to the file.
	var logger = log.logger_sup;
	//Log the request.
	logger.info("+++ " + TAG + " Request received for Login Session Management. +++ ");
	//Declare the response
	var resJson;

	logger.debug(TAG + " Info in headers: " + JSON.stringify(req.headers));
	//Validate the request.
	if ( !(	req.body === null || req.body.userId === undefined || 
			req.body.userId.toString().trim().length === 0 || 
			req.body.userId === null
		)) 
	{
		logger.debug(TAG + " Body: " + JSON.stringify(req.body));
		
		var userId = req.body.userId;
		var sellerColl = db.collection('SellerMaster');
		
		// Supplier should have the RFQAuthEnabled set to True.
		sellerColl.findOne({"sellerEntity.profileInfo.accountInfo.userId": userId },
							{"_id": 0, "sellerEntity.profileInfo.accountInfo.passwordHash" : 0, "sellerEntity.profileInfo.accountInfo.previousPasswordHash" : 0,
							"sellerEntity.profileInfo.accountInfo.leadSource" : 0,
							"sellerEntity.sellerTermsInfo.termsAcceptedTimeStamp" : 0, "sellerEntity.sellerVerificationInfo.crmApprovedTimeStamp": 0,
							"sellerEntity.sellerVerificationInfo.emailVerifiedTimeStamp" : 0 }, function(err, result) {
		
			if(!err && (result !== null))
			{
				var loginResult = result;
				loginResult.sellerEntity.termsAccepted = result.sellerEntity.sellerTermsInfo.termsAccepted;				
				loginResult.sellerEntity.emailVerified = result.sellerEntity.sellerVerificationInfo.emailVerified;
				delete result.sellerEntity.sellerTermsInfo.termsAccepted;
				loginResult.sellerEntity.loginInfo = result.sellerEntity.sellerTermsInfo;				
				delete result.sellerEntity.sellerTermsInfo;
				delete result.sellerEntity.sellerVerificationInfo;
				resJson = {
				    "http_code" : "200",
					"message" : loginResult
				};				
				logger.debug(TAG + " Supplier with User Id: "+ userId + " Session successfull");
				return callback(false, resJson);
					
			}
			else if(!err && (result === null))
			{
				//// Check Seller Lead collection ....
				var sellerLeadColl = db.collection('SellerLead');
				sellerLeadColl.findOne({"sellerLeadEntity.userId" : userId }, {"_id": 0, "sellerLeadEntity.passwordHash" : 0}, function(lerr, lresult){
					if(lerr){
						resJson = {
					    "http_code" : "500",
						"message" : "Login Failed, Server Error. Please try again"
						};
						logger.error(TAG + "Login failed...!!!, Server Error: Seller Lead " + lerr);
						return callback(true, resJson);
					}
					else{
							if(!lerr && (lresult !== null))
							{
								resJson = {
								    "http_code" : "202",
									"message" : lresult
								};	
								return callback(false, resJson);
							}
							else{
								resJson = {
										    "http_code" : "500",
											"message" : "Invalid User Id or Password or both. Please try again"
								};
								logger.error(TAG + " Supplier login session failed...!!, userId: " + userId);
								return callback(true, resJson);
							}
					}
				});				
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
			    "http_code" : "400",
				"message" : "Bad or ill-formed request.."
		};
		logger.error(TAG + "Bad or ill-formed request.. reqBody: " +  JSON.stringify(req.body));
		return callback(true, resJson);
	}
};

//Function for the Forgot Password.
exports.forgotPassword = function forgotPassword (req, callback){
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;	
	//Variable for Logging the messages to the file.
	var logger = log.logger_sup;
	//Log the request.
	logger.info("+++ " + TAG + " Request received for forgotPassword. +++ ");

	//Declare the response
	var resJson;
	
	//Validate the request.
	if ( !(	req.params === null || req.params.userId === undefined || 
		req.params.userId.toString().trim().length === 0 || 
		req.params.userId === null )) 
	{
		
		logger.debug(TAG + " Body: " + JSON.stringify(req.params));
		var userId = req.params.userId.toLowerCase();
		var sellerMasterColl = db.collection('SellerMaster');
		//, "sellerEntity.sellerVerificationInfo.emailVerified": true
		sellerMasterColl.findOne({ "sellerEntity.profileInfo.accountInfo.userId": userId},{"_id": 0, "sellerEntity.profileInfo.basicInfo" : 1}, function(err, result) {	
			
			if(!err && (result !== null))
			{
				// Generating Token
			    var encryptedToken = crypto.randomBytes(64).toString('hex');
				logger.debug("Email with the token to mail : " + userId);
				// Sending token to registered mail id...
				supNotifications.sendForgotPassword(result.sellerEntity.profileInfo.basicInfo, userId, encryptedToken, function(err, status){
					if(err){
						logger.error(TAG + " Error sending Token for user with email... "+ userId);
			            resJson = {
							    "http_code" : "500",
								"message" : "Error sending Token Mail, Please retry"
						};
						return callback(true, resJson);
					}
					else{
						//Update Token to master...
						sellerMasterColl.update({ "sellerEntity.profileInfo.accountInfo.userId": userId }, { $set : {"sellerEntity.sellerVerificationInfo.forgotToken" : encryptedToken} }, function(uerr, uresult){
							if(uerr){
								resJson = {
									    "http_code" : "500",
										"message" : "Update forgot password token failed"
								};
								return callback(true, resJson);
							}
							else{
								logger.debug(TAG + " Token " + encryptedToken + " for User ID "+ userId + " is sent Sucessfully.");
					            resJson = {
									    "http_code" : "200",
										"message" : "Mail sent to registered Email id. Please reset the password."
								};
								return callback(false, resJson);
							}
						});
						
					}
				});				
			} 
			else if(!err && (result === null))
			{					
				logger.error(TAG + "No Results found.!" + userId);
				resJson = {
					    "http_code" : "500",
						"message" : "Invalid user Id, Error sending Mail, Please retry.."
				};
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
		logger.error(TAG + "Bad or ill-formed request. reqBody: " + JSON.stringify(req.params));
		return callback(true, resJson);
	}
};

exports.updateSupplierTerms = function (req, callback) {
    //Variable for Mongo DB Connection.
    var db = dbConfig.mongoDbConn;
    //Variable for Logging the messages to the file.
    var logger = log.logger_sup;
    //Log the request.
    logger.info("+++ " + TAG + " Request received for updateSupplierTerms. +++ ");

    //Declare the response
    var resJson;
    var sellerId = req.body.supplierSession.sellerEntity.profileInfo.accountInfo.sellerId;
    if ( !(sellerId === null ||
        sellerId.toString().trim().length === 0 ))
    {       
        logger.debug(TAG + " sellerId from Session: "+ sellerId);

        var supplierColl = db.collection('SellerMaster');

        supplierColl.update({"sellerEntity.profileInfo.accountInfo.sellerId" : sellerId },
        					{$set : { "sellerEntity.sellerTermsInfo.termsAccepted" : true, "sellerEntity.sellerTermsInfo.termsAcceptedTimeStamp" : new Date() }}, function (error,result) {
            if(!error && result.result.nModified != 0)
            {
                resJson = {
                    "http_code" : "200",
                    "message" : "Document updated Successfully"
                };

                logger.debug(TAG + " Document updated for "+ sellerId);
                return callback(false, resJson);
            }
            else if(!error && result.result.nModified == 0)
            {
                resJson = {
                    "http_code" : "500",
                    "message" : "Document is Already Updated"
                };
                logger.error(TAG + " Document is Already Updated");
                return callback(true, resJson);
            }
            else
            {
                resJson = {
                    "http_code" : "500",
                    "message" : "Update failed, Server Error. Please try again"
                };
                logger.error(TAG + " Update Failed, Server Error: " + error);
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

///// Verify token and Change password
exports.verifyToken =  function(req, callback){
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;	
	//Variable for Logging the messages to the file.
	var logger = log.logger_sup;
	//Log the request.
	logger.info("+++ " + TAG + " Request received for forgotPassword. +++ ");

	//Declare the response
	var resJson;
	
	//Validate the request.
	if ( !(	req.body === null || req.body.userId === undefined || 
		req.body.password === undefined || req.body.userId.toString().trim().length === 0 || 
		req.body.password.toString().trim().length === 0 || req.body.userId === null ||
		req.body.password === null || req.body.token === null || req.body.token.toString().trim().length === 0 || req.body.token === undefined )) 
	{		
		var userId = req.body.userId;
		var token = req.body.token;
		var password = req.body.password;
		var passwordHash = crypto.createHash('md5').update(password).digest('hex');

		logger.debug(TAG + " Body: " + JSON.stringify(req.body));
		var supplierColl = db.collection('SellerMaster');
		//, "sellerEntity.sellerVerificationInfo.emailVerified": true
		supplierColl.findOne({"sellerEntity.profileInfo.accountInfo.userId" : userId,"sellerEntity.sellerVerificationInfo.forgotToken" : token},
								{"sellerEntity.profileInfo.accountInfo.passwordHash" : 1}, function(err, result){
			if(!err && (result !== null))
			{
				var previousPasswordHash = result.sellerEntity.profileInfo.accountInfo.passwordHash;
				supplierColl.update({"sellerEntity.profileInfo.accountInfo.userId" : userId,"sellerEntity.sellerVerificationInfo.forgotToken" : token},
									{$set : {"sellerEntity.profileInfo.accountInfo.previousPasswordHash" : previousPasswordHash, "sellerEntity.profileInfo.accountInfo.passwordHash" : passwordHash, "sellerEntity.sellerVerificationInfo.forgotToken": "" }}, function(uerr, uresult){
										if(!uerr){
											
											// Updating in seller Lead collection...
											var sellerLeadColl = db.collection('SellerLead');
											sellerLeadColl.update({"sellerLeadEntity.userId" : userId }, {$set : {"sellerLeadEntity.passwordHash" : passwordHash}}, function(lerr, lresult){
												if(!err){
													resJson = {
												    "http_code" : "200",
													"message" : "Password change successfull.."
													};
													logger.debug("Password changed successfully for userId : " + userId);
													return callback(false, resJson);
												}
												else{
													resJson = {
												    "http_code" : "500",
													"message" : "Password change failed. Please retry..."
													};
													logger.error(TAG + "Password change failed: " + err);
													return callback(true, resJson);
												}
											});
											
										}
										else{
											resJson = {
												    "http_code" : "500",
													"message" : "Internal Server Error..Please retry.."
											};

											logger.error(TAG + "Internal Server Error. err: " + uerr);
											return callback(true, resJson);
										}
									});
			}
			else if(!err && (result === null)){
				resJson = {
						    "http_code" : "500",
							"message" : "Invalid userId or token. Please try again"
				};
				logger.error(TAG + " Supplier forgot password failed " + userId + " Token:" + token);
				return callback(true, resJson);
			}
			else{
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
}