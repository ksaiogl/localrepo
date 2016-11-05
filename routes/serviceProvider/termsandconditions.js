/**
 * New node file
 */

var TAG = "termsandconditions.js";
var log = require('../../Environment/log4js.js');
var dbConfig = require('../../Environment/mongoDatabase.js');

//Function for the Reset Password.
exports.validateTerms = 
function validateTerms (req, callback){
		
		//Variable for Logging the messages to the file.
		var logger = log.logger_sp;
		
		//Variable for Mongo DB Connection. 
		var db = dbConfig.mongoDbConn;
		
		//Declare the response
		var resJson;
	
		//Get the IP Address of the client.
		var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
		
		logger.info(ip + " " + TAG + " Request received for validating the Terms and Conditions Acceptance.");
		
		//Validate the request.
		if ( !(	req === null || 
				req.body === null || 
				req.body.mobile === undefined || 
				req.body.termsAccepted === undefined || 
				req.body.mobile === null || 
				req.body.termsAccepted === null ||
				req.body.mobile.toString().trim().length === 0 || 
				req.body.termsAccepted.toString().trim().length === 0)) {
				
			var mobile = req.body.mobile;
			var terms = req.body.termsAccepted;

			var col = db.collection('ServiceProvider');
			
			if(terms){
				var acceptTime = new Date(); 
				col.update({"serviceProviderEntity.profileInfo.accountInfo.mobile": mobile},{$set : {"serviceProviderEntity.profileInfo.accountInfo.termsAccepted": terms,"serviceProviderEntity.profileInfo.accountInfo.termsAcceptedTime": acceptTime}},function(err, uresult) {
					if(!err){
						resJson = {
							    "http_code" : "200",
							     "message" : "Terms and Conditions are accepted." 
						};
						logger.debug(ip + " " + TAG + " user with mobile no "+ mobile + " Terms and Conditions are accepted.");
						return callback(false, resJson);
					}else{
						resJson = {
							    "http_code" : "500",
								"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
									
						};
						logger.error(ip + " " + TAG + " user with mobile no "+ mobile + " Terms and Conditions acceptance failed Error :" + JSON.stringify(err));
						return callback(true, resJson);
					}
				});
			}else{
				resJson = {
					    "http_code" : "500",
						"message" : "Terms and Conditions are not accepted...!!!"
				};
				logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
				return callback(false,resJson);
			}	
		} 
		else {
			resJson = {
				    "http_code" : "400",
					"message" : "Bad or ill-formed request.."
			};
			logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
			return callback(false,resJson);

		}
};