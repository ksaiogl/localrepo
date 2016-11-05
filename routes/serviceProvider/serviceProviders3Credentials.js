var TAG = "ServiceProviders3Credentials.js";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');

//Function for the fetching the s3 credentials.
exports.fetchCredentials = function fetchCredentials (req, callback){
    
    //Variable for Mongo DB Connection. 
    var db = dbConfig.mongoDbConn;
    
    //Variable for Logging the messages to the file.
    var logger = log.logger_sp;
    
  //Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
    
    //Log the request.
    logger.info(ip + " " + TAG + " Request received for Fetching the s3 credentials.");
    
    //Declare the response
    var resJson;
    
    var s3ConfigColl = db.collection('S3Credentials');
    
    var col = db.collection('ServiceProvider');

  //Validate the request.
	if ( !(	req === null || 
			req.body === null || 
			req.body.serviceProviderId === undefined || 
			req.body.mobile === undefined ||
			req.body.serviceProviderId === null || 
			req.body.mobile === null ||
			req.body.serviceProviderId.toString().trim().length === 0 || 
			req.body.mobile.toString().trim().length === 0)) {
    
			var serviceProviderId = req.body.serviceProviderId;
			var mobile = req.body.mobile;
		
	col.findOne({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": serviceProviderId, "serviceProviderEntity.profileInfo.accountInfo.mobile": mobile},{"_id": 0},function(err, presult){	
		if(!err && presult !== null){	
			
			s3ConfigColl.findOne({},{"_id":0},function(err, result){
				if(!err && result !== null){
					resJson = {
			                "http_code" : "200",
			                "message" : result
			        };
				        
				   return callback(false, resJson);
					
				}else if(!err && presult === null){
					 resJson = {
				                "http_code" : "500",
				                "message" : "Image Upload Failed."
				        };
			        logger.error(ip + " " + TAG + " Not able to fetch the credentials so image upload failed.");
			        return callback(true, resJson);
				} else{
					resJson = {
			                "http_code" : "500",
			                "message" : "Unexpected Server Error while fetching the s3 credentials."
			        };
			        logger.error(ip + " " + TAG + " Error while fetching the s3 credentials. " + err);
			        return callback(true, resJson);
				}
			});
		}else if(!err && presult === null){
			 resJson = {
		                "http_code" : "500",
		                "message" : "Image Upload Failed."
		        };
	        logger.error(ip + " " + TAG + " Error getting s3 credentials because the mobile no or service provider id didn't match.");
	        return callback(true, resJson);
		} else{
			resJson = {
	                "http_code" : "500",
	                "message" : "Unexpected Server Error while fetching the s3 credentials."
	        };
	        logger.error(ip + " " + TAG + " Error while fetching the s3 credentials. Because of mobile no or Service Provider ID." + err);
	        return callback(true, resJson);
		}	
	});
	}else {
		resJson = {
			    "http_code" : "400",
				"message" : "Bad or ill-formed request.."
		};
		logger.error(" " +TAG + " " + JSON.stringify(resJson));
		return callback(false,resJson);
	}    
};
