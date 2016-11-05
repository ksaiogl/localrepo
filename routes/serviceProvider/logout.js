var TAG = "Logout";

var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');

//Function for the Logout.
exports.logout = 
function logout(req, callback){
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_sp;
	
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	logger.info(ip + " " + TAG + " Logout Request Received.");

	//Declare the response
	var resJson;

	//Validate the request.
	if ( !(	req === null || 
			req.body === null || 
			req.body.customerID === undefined || 
			req.body.token_id === undefined || 
			req.body.customerID.toString().trim().length === 0 || 
			req.body.token_id.toString().trim().length === 0)) {

		var col = db.collection('ServiceProvider');
		col.update({"serviceProviderEntity.profileInfo.accountInfo.customerId": req.body.customerID},
									  { 
									  	$pull: { "serviceProviderEntity.appInfo.cloudTokenID": req.body.token_id} 
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
													"message" : "ServiceProvider data not found."
											};
									  		logger.debug(TAG + " Record Not Found - Failed logout for serviceprovider : "+req.body.customerID);
									  		return callback(false, resJson);
									  	} 
										else
										{
											resJson = {
												    "http_code" : "200",
													"message" : "Logout successfull."
											};
											logger.debug(TAG + " logout successful for serviceprovider : "+req.body.customerID);
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