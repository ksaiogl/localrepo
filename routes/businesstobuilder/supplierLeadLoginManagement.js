var TAG = "SupplierLeadLoginManagement- ";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
//Module for generating the OTP.
var otp = require('otplib/lib/totp');
var supNotifications = require('../supplier/supplierNotifications.js');
var notifications = require('../helpers/notifications.js');

//Function for the Login.
exports.supplierLeadlogin = function login (mobile, passwordHash, callback){
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	//Variable for Logging the messages to the file.
	var logger = log.logger_sup;
	//Log the request.
	logger.debug("+++ " + TAG + " Querying SupplierLead for Login. +++ ");
	//Declare the response
	var resJson;
	var supplierColl = db.collection('SupplierLead');

	supplierColl.findOne({"supplierLeadEntity.mobileNumber": mobile, "supplierLeadEntity.loginDetails.passwords.passwordHash": passwordHash},
		{"_id": 0}, function(err, result) {
		if(!err && (result !== null))
		{
			result.supplierType = "SupplierLeads";
					
			//Updating lastLoginTime field and Appversion f(Asyncronous call)
			supplierColl.update({"supplierLeadEntity.mobileNumber": mobile, "supplierLeadEntity.loginDetails.passwords.passwordHash": passwordHash}, {$set: {"supplierLeadEntity.loginDetails.lastLoginTime": new Date()}}, function(error, result){
				if(error)
				{
					logger.error(TAG + " Error -lastLoginTime Updation failed for mobile number " + mobile);
				}	
			});

			logger.debug(TAG + " Supplier with mobile no: "+ mobile + " logged in successfully");
			return callback(false, result);
		}
		else if(!err && (result === null))
		{
			logger.error(TAG + " Supplier login failed...!!!, mobile: " + mobile + "passwordHash:" + passwordHash);
			return callback(true, "Invalid Mobile Number or Password or both. Please try again");
		}
		else
		{
			logger.error(TAG + "Login failed...!!!, Server Error: " + err);
			return callback(true, "Login Failed, Server Error. Please try again");
		}	
	});
};


//Function for the forgotPassword supplierLead.
exports.supplierLeadforgotPassword = function supplierLeadforgotPassword (mobile, callback){
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	//Variable for Logging the messages to the file.
	var logger = log.logger_sup;
	//Log the request.
	logger.debug("+++ " + TAG + " Querying SupplierLead for forgotPassword. +++ ");
	//Declare the response
	var resJson;
	var supplierColl = db.collection('SupplierLead');

	supplierColl.findOne({"supplierLeadEntity.mobileNumber": mobile},{"_id": 0 },function(err, result) {	
		if(!err && (result !== null))
		{
			// user secret key 
			var secret = otp.utils.generateSecret();
			// OTP code 
			var code = otp.generate(secret);
			logger.debug("Phone Number for which OTP is sent: " + mobile);
				
			supplierColl.update({"supplierLeadEntity.mobileNumber": mobile},{$set : {"supplierLeadEntity.loginDetails.passwords.OTP":code}},function(err, result) {
				if(!err)
				{
					logger.debug(TAG + " Forgot Password Request for user with mobile no "+ mobile + " is Successfull.");
					
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
				        else
				        {
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
};


//Function for the resetPassword supplierLead.
exports.supplierLeadresetPassword = function supplierLeadresetPassword (mobile, OTP, passwordHash, callback){
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	//Variable for Logging the messages to the file.
	var logger = log.logger_sup;
	//Log the request.
	logger.debug("+++ " + TAG + " Querying SupplierLead for resetPassword. +++ ");
	//Declare the response
	var resJson;
	var supplierColl = db.collection('SupplierLead');

	supplierColl.findOne({"supplierLeadEntity.loginDetails.passwords.OTP": OTP,"supplierLeadEntity.mobileNumber": mobile},{"_id": 0 },function(err, result) {
		if(!err && (result !== null))
		{	
			var supplierInfo = {
				"supplierName": result.supplierLeadEntity.companyName,
				"supplierPrimaryEmail": result.supplierLeadEntity.email[0],
				"supplierPrimaryMobile": result.supplierLeadEntity.mobileNumber
			};
			//On successfull change password, otp will be set to blank string. 
			supplierColl.update({"supplierLeadEntity.loginDetails.passwords.OTP": OTP, 
				"supplierLeadEntity.mobileNumber": mobile},
				{$set :{"supplierLeadEntity.loginDetails.passwords.previousPasswordHash":result.supplierLeadEntity.loginDetails.passwords.passwordHash,
				"supplierLeadEntity.loginDetails.passwords.passwordHash":passwordHash, 
				"supplierLeadEntity.loginDetails.passwords.OTP": "",
				"supplierLeadEntity.loginDetails.passwords.firstTimeLogin" : false}},function(err, result) {
				if(!err)
				{
					//Calling function that will notify supplier regarding password reset.
					supNotifications.notifyOnPasswordReset(supplierInfo, function(err, result){			
					});

					resJson = {
						    "http_code" : "200",
							"message" : "Password Reset.."
					};
					logger.debug("Password Reset successfull for mobile : " + mobile);
					return callback(false, resJson);
				}
				else
				{

					resJson = {
						    "http_code" : "500",
							"message" : "Password reset failed. Please retry..."
					};
					logger.error("Error updating NewPassword for mobile : " + mobile + " err: " + err);
					return callback(true, resJson);
				}
			});
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
};


//Function for the changePassword supplierLead.
exports.supplierLeadchangePassword = function supplierLeadchangePassword (mobile, passwordHash, callback){
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	//Variable for Logging the messages to the file.
	var logger = log.logger_sup;
	//Log the request.
	logger.debug("+++ " + TAG + " Querying SupplierLead for changePassword. +++ ");
	//Declare the response
	var resJson;
	var supplierColl = db.collection('SupplierLead');

	supplierColl.findOne({"supplierLeadEntity.mobileNumber": mobile},{"_id": 0 },function(err, result) {
		if(!err && (result !== null))
		{				
			var supplierInfo = {
				"supplierName": result.supplierLeadEntity.companyName,
				"supplierPrimaryEmail": result.supplierLeadEntity.email[0],
				"supplierPrimaryMobile": result.supplierLeadEntity.mobileNumber
			};

			var currentPassword = result.supplierLeadEntity.loginDetails.passwords.passwordHash;
			supplierColl.update({"supplierLeadEntity.mobileNumber": mobile},{$set :{"supplierLeadEntity.loginDetails.passwords.previousPasswordHash":currentPassword,
				"supplierLeadEntity.loginDetails.passwords.passwordHash":passwordHash, "supplierLeadEntity.loginDetails.passwords.firstTimeLogin" : false}},function(err, result) {
				if(!err)
				{
					//Calling function that will notify supplier regarding password change.
					supNotifications.notifyOnPasswordChange(supplierInfo, function(err, result){			
					});

					resJson = {
						    "http_code" : "200",
							"message" : "Password change successfull.."
					};

					logger.debug("Password changed successfully for mobile : " + mobile);
					return callback(false, resJson);
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
};