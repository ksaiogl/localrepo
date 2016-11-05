var TAG = "Login";

var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var crypto = require('crypto');
var manageNotifications = require('./manageNotifications.js');

//Function for the Login.
exports.login =
function login (req, callback){
	var resJson = {
			"http_code" : "500",
		"message" : "Dear Service Provider, \nWe are upgrading our App and will be back soon. Meanwhile, please visit mSupply.com for your requirements. Thank you for your support.\nTeam mSupply."
	};
	// logger.error(ip + " " + TAG + " user with mobile no "+ mobile + " login failed Exception :" + exception);
	return callback(true, resJson);

//
// 	//Get the IP Address of the client.
// 	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
//
// 	//Variable for Mongo DB Connection.
// 	var db = dbConfig.mongoDbConn;
//
// 	//Variable for Logging the messages to the file.
// 	var logger = log.logger_sp;
//
// 	logger.info(ip + " " + TAG + " Login Request Received.");
//
// 	//Log the request.
// 	logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));
//
// 	//Declare the response
// 	var resJson;
//
// 	//var appVersion = req.headers.appversion; //Current user App version is sent in headers.
//
//
// 	//Validate the request.
// 	if ( !(	req === null ||
// 			req.body === null ||
// 			req.body.mobile === undefined ||
// 			req.body.password === undefined ||
// 			req.body.mobile === null ||
// 			req.body.password === null ||
// 			req.body.mobile.toString().trim().length === 0 ||
// 			req.body.password.toString().trim().length === 0)) {
//
// 		var mobile = req.body.mobile;
// 		var pass = req.body.password;
// 		var unreadNotificaitons = 0;
// 		var col = db.collection('ServiceProvider');
// 		var passwordHash = crypto.createHash('md5').update(pass).digest('hex');
//
// 		col.findOne({"serviceProviderEntity.profileInfo.accountInfo.mobile": mobile, "serviceProviderEntity.passwords.passwordHash": passwordHash},{"_id": 0, "serviceProviderEntity.passwords": 0}, function(err, result) {
// 			if(!err && (result !== null))
// 			{
// 				if(result.serviceProviderEntity.profileInfo.accountInfo.isActive === false){
// 					resJson = {
// 						    "http_code" : "500",
// 							//"message" : "OTP Based registration process is not complete. Please do complete to login.",
// 							"message" : "Registration incomplete. Please enter the OTP sent to your registered mobile number for verification purpose."
// 					};
// 					logger.error(ip + " " +TAG + " user with mobile no "+ mobile + " login failed...!!!, err: " + err);
// 					return callback(true, resJson);
// 				}
//
// 				var lastLogin = new Date();
// 				col.update({"serviceProviderEntity.profileInfo.accountInfo.mobile": mobile},{$set : {"serviceProviderEntity.profileInfo.accountInfo.lastLogin": lastLogin}},function(err, uresult) {
// 					if(!err){
// 						logger.debug(ip + " " + TAG + " user with mobile no "+ mobile + " logged in time updated successfully");
// 						//************** Part that will get the latest notifications count for service provider and add new field "unreadNotificationsCount".
// 						try{
// 							//setting default count as 0;
// 							result.serviceProviderEntity.profileInfo.accountInfo.unreadNotificationsCount = unreadNotificaitons;
//
// 							var serprdrid = result.serviceProviderEntity.profileInfo.accountInfo.serviceProviderId;
// 							manageNotifications.unreadNotificaitonsCount(serprdrid, function(error, notifyRes){
// 								if(!error){
// 									result.serviceProviderEntity.profileInfo.accountInfo.unreadNotificationsCount = notifyRes.notificationCount;
// 									resJson = {
// 										    "http_code" : "200",
// 										     "message" : result
// 									};
// 									logger.debug(ip + " " + TAG + " user with mobile no "+ mobile + " logged in successfully");
// 									return callback(false, resJson);
// 								}
// 							});
// 						}
// 						catch(exception){
// 							logger.error(ip + " " +TAG + " exception araised while adding unreadNotificaitons count for mobile no: "+ mobile + ".login failed...!!!, Exception: " + exception);
// 							resJson = {
// 							    "http_code" : "500",
// 								"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
// 							};
// 							logger.error(ip + " " + TAG + " user with mobile no "+ mobile + " login failed Exception :" + exception);
// 							return callback(true, resJson);
// 						}
// 						//************** latest notifications count for service provider ends here.
// 					}else{
// 						logger.error(ip + " " + TAG + " user with mobile no "+ mobile + " logged in time update unsuccessful");
// 						resJson = {
// 							    "http_code" : "500",
// 								"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
// 						};
// 						logger.error(ip + " " + TAG + " user with mobile no "+ mobile + " login failed Error :" + err);
// 						return callback(true, resJson);
// 					}
// 				});
// 			}
// 			else if(!err && (result === null))
// 			{
// 				resJson = {
// 					    "http_code" : "500",
// 						"message" : "Invalid UserName or Password or both. Please try again"
// 				};
// 				logger.error(ip + " " +TAG + " user with mobile no "+ mobile + " login failed...!!!, err: " + err);
// 				return callback(true, resJson);
// 			}else {
// 				resJson = {
// 					    "http_code" : "500",
// 						"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
// 				};
// 				logger.error(ip + " " +TAG + " user with mobile no "+ mobile + " login failed...!!!, err: " + err);
// 				return callback(true, resJson);
// 			}
// 		});
// 	}
// 	else {
// 		resJson = {
// 			    "http_code" : "400",
// 				"message" : "Bad or ill-formed request.."
// 		};
// 		logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
// 		return callback(false,resJson);
//
// 	}
};
