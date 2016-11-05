var TAG = "Supplier-Account";

var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var magentoRegistration = require('../magento/magentoAPI.js');
var supNotifications = require('./supplierNotifications.js');
var notifications = require('../helpers/notifications.js');
var decryption = require('../helpers/encryptDecryptFunction.js');

var crypto = require('crypto');
//Module for generating the OTP.
var otp = require('otplib/lib/totp');
var request = require("request");

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
	if ( !(	req.body === null || req.body.mobile === undefined || 
		req.body.PAN === undefined || req.body.mobile.toString().trim().length === 0 || 
		req.body.PAN.toString().trim().length === 0 || req.body.mobile === null || 
		req.body.PAN === null )) 
	{
		decryption.decrypt(req.body.PAN, function(err, decryptedPAN){
			if(!err && decryptedPAN != null)
			{

				logger.debug(TAG + " Body: " + JSON.stringify(req.body));
				var mobile = req.body.mobile;
				var PAN = decryptedPAN;
				var supplierColl = db.collection('Supplier');
				supplierColl.findOne({"supplierEntity.contactInfo.primaryMobile": mobile, "supplierEntity.taxInfo.PAN": PAN},{"_id": 0 },function(err, result) {	
					if(!err && (result !== null))
					{
						// user secret key 
						var secret = otp.utils.generateSecret();
						// OTP code 
						var code = otp.generate(secret);
						logger.debug("Phone Number for which OTP is sent: " + mobile);
							
						supplierColl.update({"supplierEntity.contactInfo.primaryMobile": mobile, "supplierEntity.taxInfo.PAN": PAN},{$set : {"supplierEntity.passwords.OTP":code}},function(err, result) {
							if(!err)
							{
								logger.debug(TAG + " Forgot Password Request for user with mobile no "+ mobile + " is Successful.");
								
								//Below function will send sms to supplier, notifying succesfull password change.
							    var smsMessage = "Hi! OTP for password change request is : " + code;

							    notifications.sendSms(mobile, smsMessage, function(error, result){
							        if(error){
							            logger.error(TAG + " Error sending OTP for user with mobile no... "+ mobile);
							            resJson = {
											    "http_code" : "500",
												"message" : "Error sending OTP, Please retry"
										};
										return callback(true, resJson);
							        }
							        else{
							            logger.debug(TAG + " OTP " + code + " for mobile no "+ mobile + " is sent Sucessfully.");
							            resJson = {
											    "http_code" : "200",
												"message" : "OTP sent to your mobile number. Please reset the password."
										};
										return callback(false, resJson);
							        }
							    });

							}
							else
							{
								logger.error(TAG + " Error updating OTP for mobile no... " + mobile + " err: " + err);
								resJson = {
									    "http_code" : "500",
										"message" : "Error sending OTP, Please retry.."
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

						logger.error(TAG + "Invalid Inputs, Inputs doesnt match with the database records, mobile: " + mobile + "PAN: " + PAN);
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
						    "http_code" : "500",
							"message" : "Internal Server Error..Please retry.."
					};
					logger.error(TAG + "Error Decrypting PAN for mobile: "+ mobile + "error: " +decryptedPAN);
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

//Function for the Reset Password.
exports.resetPassword = function resetPassword (req, callback){
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;

	//Variable for Logging the messages to the file.
	var logger = log.logger_sup;
	//Log the request.
	logger.info("+++ " + TAG + "Request Received for resetPassword. +++ ");

	//Declare the response
	var resJson;
	
	//Validate the request.
	if ( !(	req.body === null || req.body.OTP === undefined || 
	 req.body.mobile === undefined || req.body.newPassword === undefined || req.body.OTP.toString().trim().length === 0 || 
	 req.body.mobile.toString().trim().length === 0 || req.body.newPassword.toString().trim().length === 0 ||
	 req.body.OTP === null || req.body.mobile === null || req.body.newPassword === null)) 
	{

		logger.debug(TAG + " Body: " + JSON.stringify(req.body));
		decryption.decrypt(req.body.newPassword, function(err, decryptedPassword){
			if(!err && decryptedPassword != null)
			{	
				decryption.decrypt(req.body.OTP, function(err, decryptedOTP){
					if(!err && decryptedOTP != null)
					{	
						var OTP = decryptedOTP;
						var mobile = req.body.mobile;
						var newPassword = decryptedPassword;

						var supplierColl = db.collection('Supplier');
						var passwordHash = crypto.createHash('md5').update(newPassword).digest('hex');

						supplierColl.findOne({"supplierEntity.passwords.OTP": OTP,"supplierEntity.contactInfo.primaryMobile": mobile},{"_id": 0 },function(err, result) {
							if(!err && (result !== null))
							{	
								var customerId = result.supplierEntity.identifier.magentoCustID;
								var currentPassword = result.supplierEntity.passwords.passwordHash;
								var supplierInfo = {
									"supplierName": result.supplierEntity.contactInfo.primaryFirstName,
									"supplierPrimaryEmail": result.supplierEntity.contactInfo.primaryEmail,
									"supplierPrimaryMobile": result.supplierEntity.contactInfo.primaryMobile
								};
								//var customer_id = 581;
								/*magentoRegistration.updatePasswordInMagento(customerId, passwordHash, function(merr, mresult){	
									if(!merr)
									{*/
										//On successfull change password, otp will be set to blank string. 
										supplierColl.update({"supplierEntity.passwords.OTP": OTP, "supplierEntity.contactInfo.primaryMobile": mobile},{$set :{"supplierEntity.passwords.previousPasswordHash":result.supplierEntity.passwords.passwordHash,"supplierEntity.passwords.passwordHash":passwordHash, "supplierEntity.passwords.OTP": "","supplierEntity.firstTimeLogin" : false}},function(err, result) {
											if(!err)
											{
												//Calling function that will notify supplier regarding password reset.
												supNotifications.notifyOnPasswordReset(supplierInfo, function(err, result){			
												});

												// Set Magento Password Asynchronously.
												magentoRegistration.updatePasswordInMagento(customerId, passwordHash, function(merr, mresult){	
													if(merr)
													{
														logger.error("Error setting Magento Password for mobile : " + mobile+ ", merr: "+ merr);
													}
												});

												resJson = {
													    "http_code" : "200",
														"message" : "Password Reset.."
												};
												logger.debug("Password Reset Successul for mobile : " + mobile);
												return callback(false, resJson);
											}
											else
											{
												//magentoRegistration.updatePasswordInMagento(customerId, currentPassword, function(merr, mresult){
												//});

												resJson = {
													    "http_code" : "500",
														"message" : "Password reset failed. Please retry..."
												};
												logger.error("Error updating NewPassword for mobile : " + mobile + " err: " + err);
												return callback(true, resJson);
											}
										});
									/*}
									else
									{
										resJson = {
											    "http_code" : "500",
												"message" : "Password reset failed. Please retry..."
										};
										logger.error("Error updating NewPassword in MYSQL for mobile : " + mobile + "err: " + merr);
										return callback(true, resJson);
									}	
								});*/	
							} 
							else if(!err && (result === null))
							{
								resJson = {
									    "http_code" : "500",
										"message" : "Invalid OTP..Please request for a new OTP by clicking the Forgot Password Link.."
								};
								logger.error(TAG + " Update Newpassword failed, Invalid OTP. OTP: " + OTP + " mobile: " + mobile);
								return callback(true, resJson);
							}
							else
							{
								resJson = {
									    "http_code" : "500",
										"message" : "Internal Server Error..Please request for a new OTP by clicking the Forgot Password Link.."
								};
								logger.error(TAG + " Internal Server Error: " + err);
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
							logger.error(TAG + "Error Decrypting OTP for mobile: "+ mobile + "error: " +decryptedOTP);
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
					logger.error(TAG + "Error Decrypting Password for mobile: "+ mobile + "error: " +decryptedPassword);
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
		return callback(true,resJson);
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
	if ( !( req.body === null || req.body.mobile === undefined ||
	 req.body.newPassword === undefined || req.body.mobile.toString().trim().length === 0 ||
	 req.body.newPassword.toString().trim().length === 0 ||req.body.mobile === null || 
	 req.body.newPassword === null )) 
	{
		decryption.decrypt(req.body.newPassword, function(err, decryptedPassword){
			if(!err && decryptedPassword != null)
			{
				logger.debug(TAG + " Body: " + JSON.stringify(req.body));
				var mobile = req.body.mobile;
				var newPassword = decryptedPassword;
				var supplierColl = db.collection('Supplier');

				var passwordHash = crypto.createHash('md5').update(newPassword).digest('hex');

				supplierColl.findOne({"supplierEntity.contactInfo.primaryMobile": mobile},{"_id": 0 },function(err, result) {
					if(!err && (result !== null))
					{				
						var supplierInfo = {
							"supplierName": result.supplierEntity.contactInfo.primaryFirstName,
							"supplierPrimaryEmail": result.supplierEntity.contactInfo.primaryEmail,
							"supplierPrimaryMobile": result.supplierEntity.contactInfo.primaryMobile
						};
						
						var customer_id = result.supplierEntity.identifier.magentoCustID;
						/*magentoRegistration.updatePasswordInMagento(customer_id, passwordHash, function(merr, mresult){	
							if(!merr)
							{*/
								var currentPassword = result.supplierEntity.passwords.passwordHash;
								supplierColl.update({"supplierEntity.contactInfo.primaryMobile": mobile},{$set :{"supplierEntity.passwords.previousPasswordHash":currentPassword,"supplierEntity.passwords.passwordHash":passwordHash, "supplierEntity.firstTimeLogin" : false}},function(err, result) {
									if(!err)
									{
										//Calling function that will notify supplier regarding password change.
										supNotifications.notifyOnPasswordChange(supplierInfo, function(err, result){			
										});
										// Set Magento Password Asynchronously.
										magentoRegistration.updatePasswordInMagento(customer_id, passwordHash, function(merr, mresult){	
											if(merr)
											{
												logger.error("Error setting Magento Password for mobile : " + mobile+ ", merr: "+ merr);
											}
										});
										resJson = {
											    "http_code" : "200",
												"message" : "Password change successful.."
										};

										logger.debug("Password changed successfully for mobile : " + mobile);
										return callback(false, resJson);
									}
									else{
										
										//magentoRegistration.updatePasswordInMagento(customer_id, currentPassword, function(merr, mresult){
										//});

										resJson = {
											    "http_code" : "500",
												"message" : "Password change failed. Please retry..."
										};
										logger.error(TAG + "Password change failed: " + err);
										return callback(true, resJson);
									}
								});
							/*}
							else
							{
								resJson = {
									    "http_code" : "500",
										"message" : "Password change failed. Please retry..."
								};
								logger.error("Error updating NewPassword in MYSQL for mobile : " + mobile + " err: " + merr);
								return callback(true, resJson);
							}
						});*/			
					}
					else if(!err && (result === null))
					{
						resJson = {
							    "http_code" : "500",
								"message" : "The mobile number entered does not match with our records..Please retry.."
						};
						logger.error(TAG + " The mobile number entered does not match with our records: mobile: " + mobile);
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
						    "http_code" : "500",
							"message" : "Login Failed, Server Error. Please try again"
					};
					logger.error(TAG + "Error Decrypting Password for mobile: "+ mobile + "error: " +decryptedPassword);
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

