var TAG = "supplierLogout- ";

var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');

//Function for the Logout.
exports.logout = 
function logout(req, callback){
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	//Variable for Logging the messages to the file.
	var logger = log.logger_sup;
	//Declare the response
	var resJson;
	logger.debug(TAG + "req.body :-" + JSON.stringify(req.body));
	
	//Validate the request.
	if ( !(	req === null || 
			req.body === null || 
			req.body.sellerId === undefined || 
			req.body.tokenId === undefined || 
			req.body.sellerId.toString().trim().length === 0 || 
			req.body.tokenId.toString().trim().length === 0)) {

		var col = db.collection('Supplier');

		col.update({"supplierEntity.identifier.sellerId": req.body.sellerId},
			  { 
			  	$pull: { "supplierEntity.appInfo.cloudTokenID": req.body.tokenId} 
			  }, function(error, result){
			  	try{
					result = JSON.parse(result);
				}
				catch(err){
					resJson = {
						    "http_code" : "500",
							"message" : "Error - Logout Failed. Please try again."
					};
					logger.error(TAG + " Exception - exception araised during parsing result in logout- "+err);
					return callback(true, resJson);
				}
			  	
			  	if(error)
			  	{
			  		resJson = {
						    "http_code" : "500",
							"message" : "Error - Logout Failed. Please try again."
					};
					logger.error(TAG + " Error - error occured during logout- "+err);
			  		return callback(true, resJson);
			  	}
			  	else if(result.n < 1)
			  	{
			  		resJson = {
						    "http_code" : "200",
							"message" : "supplier details not found. Please try again."
					};
			  		logger.debug(TAG + " Record Not Found - Failed to logout for supplier : "+req.body.sellerId);
			  		return callback(false, resJson);
			  	} 
				else
				{
					resJson = {
						    "http_code" : "200",
							"message" : "Logout successfull."
					};
					logger.debug(TAG + " supplier logged out successfully: "+req.body.sellerId);
					return callback(false, resJson);
				}
			});
	}
	else{
		resJson = {
			    "http_code" : "400",
				"message" : "Bad or ill-formed request.."
		};
		logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
		return callback(true, resJson);
	}	
}