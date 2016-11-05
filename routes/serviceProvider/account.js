var TAG = "Account";

var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var magento = require('../magento/magentoAPI.js');
var spNotifications = require('./serviceProviderNotifications.js');

var crypto = require('crypto');
//Module for generating the OTP.
var otp = require('otplib/lib/totp');
var request = require("request");

//Function for the Forgot Password.
exports.forgotPassword = 
function forgotPassword (req, callback){
	
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_sp;
	
	//Log the request.
	logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));
	
	logger.info(ip + " " + TAG + " Entering FORGOT Password");

	//Declare the response
	var resJson;
	
	//Validate the request.
	if ( !(	req === null || 
			req.body === null ||
			req.body.mobile === undefined ||
			req.body.mobile === null ||
			req.body.mobile.toString().trim().length === 0)) {
	
	var mobile = req.body.mobile;
	
	var col = db.collection('ServiceProvider');
	col.findOne({"serviceProviderEntity.profileInfo.accountInfo.mobile": mobile},{"_id": 0 },function(err, result) {
		if(!err && (result !== null)){
			// user secret key 
			var secret = otp.utils.generateSecret();
			// OTP code 
			var code = otp.generate(secret);
			var phoneNumber = result.serviceProviderEntity.profileInfo.accountInfo.mobile;
			logger.debug(ip + " " + TAG + "Phone Number for which OTP will be sent: " + phoneNumber);
				
			col.update({"serviceProviderEntity.profileInfo.accountInfo.mobile": mobile},{$set : {"serviceProviderEntity.passwords.lastGeneratedOTP":code}},function(err, result) {
				if(!err)
				{
					logger.debug(ip + " " + TAG +  " Forgot Password Request for user with mobile no "+ phoneNumber + " is Sucessful," + JSON.stringify(result));
					request("http://smsc.smsconnexion.com/api/gateway.aspx?action=send&username=msupply&passphrase=123456&message=Hi! OTP for password change request is : " + code + "    -Team mSupply" +"&phone=" + phoneNumber, function(err, response, body) {
						if(!err){  
							logger.debug(ip + " " + TAG +  " OTP " + code + " for mobile no "+ phoneNumber + " sent Sucessfully,");
							resJson = {
								    "http_code" : "200",
									"message" : " OTP sent to your mobile number. Please reset the password..."
							};
							return callback(false, resJson);
						}else{
							resJson = {
								    "http_code" : "500",
									"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
							};
							logger.error(ip + " " + TAG + " OTP not sent for user with mobile no..." + phoneNumber + " Problem with the gateway");
							return callback(true, resJson);
						}	
					});
				}
				else
				{
					resJson = {
						    "http_code" : "500",
							"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
					};
					logger.error(ip + " " + TAG + " OTP not sent for user with mobile no... "+ phoneNumber + " Update of OTP to Mongo DB Failed.");
					return callback(true, resJson);
				}
			});
		} else if(!err && (result === null)) {
			resJson = {
				    "http_code" : "500",
					"message" : "Inputs Doesn't Match with our records. Please re-try.."
			};
			logger.error(ip + " " + TAG + " PAN or Mobile doesn't match with our records in DB " + JSON.stringify(resJson));
			return callback(true, resJson);
		}else {
			resJson = {
				    "http_code" : "500",
					"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
			};
			logger.error(ip + " " + TAG + " Update OTP to DB failed: " + err);
			return callback(true, resJson);
			}
	});		
	}else {
		resJson = {
			    "http_code" : "400",
				"message" : "Bad or ill-formed request.."
		};
		logger.error(TAG + " " + JSON.stringify(resJson));
		return callback(false,resJson);
	}	
};	


//Function for the Reset Password.
exports.resetPassword = 
function resetPassword (req, callback){
	
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_sp;
	
	logger.info(ip + " " + TAG + " Entering RESET Password");
	
	//Log the request.
	logger.info(ip + " " + TAG  + " " + JSON.stringify(req.body));
	
	//Declare the response
	var resJson;
	
	//Validate the request.
	if ( !(	req === null || 
			req.body === null ||
			req.body.OTP === undefined || 
			req.body.newPassword === undefined ||
			req.body.mobile === undefined ||
			req.body.OTP === null || 
			req.body.newPassword === null ||
			req.body.mobile === null ||
			req.body.OTP.toString().trim().length === 0 ||
			req.body.mobile.toString().trim().length === 0 ||
			req.body.newPassword.toString().trim().length === 0)) {
		
	var OTP = req.body.OTP;
	var newPassword = req.body.newPassword;
	var mobile = req.body.mobile;
	
	var col = db.collection('ServiceProvider');
	var passwordHash = crypto.createHash('md5').update(newPassword).digest('hex');
	col.findOne({"serviceProviderEntity.passwords.lastGeneratedOTP": OTP,"serviceProviderEntity.profileInfo.accountInfo.mobile": mobile},{"_id": 0 },function(err, nresult) {
		if(!err && (nresult !== null)){
			var customer_id = nresult.serviceProviderEntity.profileInfo.accountInfo.customerId;
			var previousPass = nresult.serviceProviderEntity.passwords.passwordHash;
			magento.updatePasswordInMagento(customer_id, passwordHash, function(output, mresult){
				if(!output) {
					col.update({"serviceProviderEntity.passwords.lastGeneratedOTP": OTP,"serviceProviderEntity.profileInfo.accountInfo.mobile": mobile},{$set :{"serviceProviderEntity.passwords.previousPasswordHash":previousPass,"serviceProviderEntity.passwords.passwordHash":passwordHash,"serviceProviderEntity.passwords.lastGeneratedOTP": 0}},function(err, result) {
						if(!err)
						{
							var email = nresult.serviceProviderEntity.profileInfo.accountInfo.email;
							var mobile = nresult.serviceProviderEntity.profileInfo.accountInfo.mobile;
							var firstName = nresult.serviceProviderEntity.profileInfo.accountInfo.firstName;
							
							spNotifications.notifyOnPasswordChange(email, firstName, mobile, function(err, result){
								
							});
							
							resJson = {
								    "http_code" : "200",
									"message" : "Password reset successful."
							};
							return callback(false, resJson);
						}
						else {
							magento.updatePasswordInMagento(customer_id, previousPass, function(output, mresult){});
							resJson = {
								    "http_code" : "500",
									"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
							};
							logger.error(ip + " " + TAG + " RESET Password failed: " + err);
							return callback(true, resJson);
						}
					});
			   } else {
				   resJson = {
						    "http_code" : "500",
							"message" : "Unexpected Server Error while fulfilling the request."
					};
					logger.error(ip + " " + TAG + " RESET Password failed MYSQL ERROR: " + mresult);
					return callback(true, resJson);
			   }
			});	
		} else if(!err && (nresult === null)) {
			resJson = {
				    "http_code" : "500",
					"message" : "Inputs Doesn't match with our records.Please retry.."
			};
			logger.error(ip + " " + TAG + " RESET Password failed inputs OTP/PAN doesn't match with the records in MONGO DB : " + err);
			return callback(true, resJson);
		}else {
			resJson = {
				    "http_code" : "500",
					"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
			};
			logger.error(ip + " " + TAG + " RESET Password failed: " + err);
			return callback(true, resJson);
		}
	});		
	}else {
		resJson = {
			    "http_code" : "400",
				"message" : "Bad or ill-formed request.."
		};
		logger.error(ip + " " + TAG + " " + JSON.stringify(resJson));
		return callback(false,resJson);
	}
};


//Function for the Reset Password.
exports.changePassword = 
function changePassword (req, callback){
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_sp;
	
	logger.info(ip + " " + TAG + " Entering CHANGE Password");
	
	//Log the request.
	logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));

	//Declare the response
	var resJson;
	
	//Validate the request.
	if ( !(	req === null || 
			req.body === null ||
			req.body.serviceProviderId === undefined || 
			req.body.newPassword === undefined ||
			req.body.serviceProviderId === null || 
			req.body.newPassword === null ||
			req.body.serviceProviderId.toString().trim().length === 0 || 
			req.body.newPassword.toString().trim().length === 0 )) {
		
	var serviceProviderId = req.body.serviceProviderId;
	var newPassword = req.body.newPassword;	
	
	var col = db.collection('ServiceProvider');
	var passwordHash = crypto.createHash('md5').update(newPassword).digest('hex');
	col.findOne({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": serviceProviderId},{"_id": 0 },function(err, result) {
		if(!err && (result !== null)){
			var customer_id = result.serviceProviderEntity.profileInfo.accountInfo.customerId;
			var previousPass = result.serviceProviderEntity.passwords.passwordHash;
			magento.updatePasswordInMagento(customer_id, passwordHash, function(output, mresult){
				if(!output) {
					col.update({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": serviceProviderId},{$set :{"serviceProviderEntity.passwords.previousPasswordHash":previousPass,"serviceProviderEntity.passwords.passwordHash":passwordHash}},function(err, presult) {
						if(!err)
						{
							var email = result.serviceProviderEntity.profileInfo.accountInfo.email;
							var mobile = result.serviceProviderEntity.profileInfo.accountInfo.mobile;
							var firstName = result.serviceProviderEntity.profileInfo.accountInfo.firstName;
							
							spNotifications.notifyOnPasswordChange(email, firstName, mobile, function(err, result){
								
							});
							
							resJson = {
								    "http_code" : "200",
									"message" : "Password change successful."
							};
							return callback(false, resJson);
						}
						else{
							magento.updatePasswordInMagento(customer_id, passwordHash, function(output, mresult){});
							resJson = {
								    "http_code" : "500",
									"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
							};
							logger.error(ip + " " + TAG + " CHANGE Password failed MONGO DB: " + err);
							return callback(true, resJson);
						}
					});
				} else {
					resJson = {
						    "http_code" : "500",
							"message" : "Unexpected Server Error while fulfilling the request."
					};
					logger.error(TAG + " Change Password failed MYSQL ERROR : " + mresult);
					return callback(true, resJson);
				}	
			});	
		} else if(!err && (result === null)) {
			resJson = {
				    "http_code" : "500",
					"message" : "The inputs does not match with our records..Please retry.."
			};
			logger.error(TAG + " change Password failed inputs does not match with our records : " + JSON.stringify(resJson));
			return callback(true, resJson);
		}else {
			resJson = {
				    "http_code" : "500",
					"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
			};
			logger.error(TAG + " change Password failed: " + err);
			return callback(true, resJson);
		}
	});		
	}else {
		resJson = {
			    "http_code" : "400",
				"message" : "Bad or ill-formed request.."
		};
		logger.error(TAG + " " + JSON.stringify(resJson));
		return callback(true,resJson);
	}
};	
		
