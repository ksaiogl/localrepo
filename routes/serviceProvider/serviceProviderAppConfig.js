var TAG = "ServiceProviderAppConfig";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var crypto = require('crypto');

//Function for the Loading Config.
exports.loadconfig = function loadconfig (req, callback){
    
    //Variable for Mongo DB Connection. 
    var db = dbConfig.mongoDbConn;
    
    //Variable for Logging the messages to the file.
    var logger = log.logger_sp;
    
  //Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
    
    //Log the request.
    logger.info(ip + " " + TAG + " Request received for Service Provider Config Service.");
    
    //Declare the response
    var resJson;
    
    var appConfigColl = db.collection('AppConfiguration');

    appConfigColl.findOne({"appConfig": "ServiceProvider"}, {"_id": 0}, function(err, result) {
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

//Function for the update App Version And Token.
exports.updateAppVerAndToken = function updateAppVerAndToken (req, callback){
    
    //Variable for Mongo DB Connection. 
    var db = dbConfig.mongoDbConn;
    //Variable for Logging the messages to the file.
    var logger = log.logger_sp;
    
  //Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
    
    //Log the request.
    logger.info(ip + " " + TAG + " Request received for Service Provider to update App Version And Token.");
    //Declare the response
    var resJson;
    
    logger.info(JSON.stringify(req.body));
    
    var col = db.collection('ServiceProvider');

  //Validate the request.
	if ( !(	req === null || 
			req.body === null || 
			req.body.currentAppVersion === undefined || 
			req.body.cloudTokenID === undefined ||
			req.body.mobile === undefined ||
			req.body.currentAppVersion === null || 
			req.body.cloudTokenID === null ||
			req.body.mobile === null ||
			req.body.currentAppVersion.toString().trim().length === 0 || 
			req.body.mobile.toString().trim().length === 0 || 
			req.body.cloudTokenID.toString().trim().length === 0)) {
    
			var appVersion = req.body.currentAppVersion;
			var tokenId = req.body.cloudTokenID;
			var mobile = req.body.mobile;
		
	col.findOne({"serviceProviderEntity.profileInfo.accountInfo.mobile": req.body.mobile},{"_id": 0,"serviceProviderEntity.profileInfo.accountInfo":1},function(err, presult){	
		if(!err && presult !== null){	
			col.update({"serviceProviderEntity.profileInfo.accountInfo.mobile": mobile}, 
			{"$addToSet": { "serviceProviderEntity.appInfo.cloudTokenID": tokenId },"$set" : {"serviceProviderEntity.appInfo.currentAppVersion":appVersion}}, function(err, result) {
			    
				if(!err && (result !== null))
			    {
			        resJson = {
			                "http_code" : "200",
			                "message" : "Update for App version Successful"
			        };
			        
			        return callback(false, resJson);
			    }
			    else
			    {
			        resJson = {
			                "http_code" : "500",
			                "message" : "Unexpected Server Error while updating the App Version and Token ID."
			        };
			        logger.error(ip + " " + TAG + " Error getting App Config, Server Error: " + err);
			        return callback(true, resJson);
			    }    
			});
		}else if(!err && presult === null){
			 resJson = {
		                "http_code" : "500",
		                "message" : "There is no user with this mobile number existing."
		        };
	        logger.error(ip + " " + TAG + " Error getting App Config.");
	        return callback(true, resJson);
		} else{
			resJson = {
	                "http_code" : "500",
	                "message" : "Unexpected Server Error while updating the App Version and Token ID."
	        };
	        logger.error(ip + " " + TAG + " Error getting App Config, Server Error: " + err);
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
