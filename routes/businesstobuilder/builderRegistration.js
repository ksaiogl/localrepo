var TAG = "registration.js";

var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');

//Function for registering company.
exports.addBuilder =
function addBuilder (req, callback){
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;

	//Variable for Mongo DB Connection.
	var db = dbConfig.mongoDbConn;

	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;

	logger.info(ip + " " + TAG + " Entering comapany registration.");

	//Log the request.
	logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));

	//Declare the response
	var resJson;

	//Validate the request.
	validateInput(req, function(error){
		//Variable for Logging the messages to the file.
		var logger = log.logger_sp;

		//Declare the response
		var resJson;

		//Variable for Mongo DB Connection.
		var db = dbConfig.mongoDbConn;

		if(error){
			resJson = {
			    "http_code" : "400",
				"message" : "Bad or ill-formed request.."
			};
			logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
			return callback(true, resJson);
		}
		else
		{
			var col = db.collection('Builder');
			//Declare the response
			var resJson;
			var doc = {
				"builderEntity": {
					"profileInfo": {
						"accountInfo": {
							"companyId": parseInt(req.body.company_id)
						}
					},
					"projects": {
						"residential": [],
						"commercial": []
					},
					"mySuppliers": {
						"suppliersIds": []
					}
				}
			};

			col.findOne({"builderEntity.profileInfo.accountInfo.companyId": parseInt(req.body.company_id)},
				{}, function(error, result){
					if(!error && (result !== null))
					{
						resJson = {
							    "http_code" : "400",
								"message" : "Company is already registered."
						};

						logger.error(TAG + " Couldn't register comapany, since companyId: " + req.body.company_id + " is already in use.");
						return callback(true, resJson);
					}
					else if(!error && (result === null))
					{
						col.insert(doc, function(error, result) {
							if (error) {
								//JSON Structure to be formed for the response object.
								resJson = {
									    "http_code" : "500",
										"message" : "Error - Company Registration Failed. Please try again"
								};
								logger.error(TAG + " Error - Company Registration Failed. err: " + error);
								return callback(true, resJson);
							}
							else{
								resJson = {
									    "http_code" : "200",
										"message" : "Company Registration successful."
								};
								logger.debug(TAG + " Company Registration successful.");
								return callback(false, resJson);
							}
						});
					}
					else
					{
						resJson = {
							    "http_code" : "500",
								"message" : " Internal Server Error..Please retry.."
						};

						logger.error(TAG + " Internal Server Error. error: " + error);
						return callback(true, resJson);
					}
			});
		}
	});
}

//Function that will validate inputs.
function validateInput(req, callback){
	var logger = log.logger_sp;
	if( !( req.body === undefined || req.body.company_id === undefined || req.body.company_id === null || req.body.company_id.toString().trim().length === 0) ){

		// if((typeof req.body.company_id === 'number') && (req.body.company_id % 1 === 0) && (req.body.company_id > 0)){
		// 	return callback(false);
		// }
		// else{
		// 	return callback(true);
		// }
		return callback(false);
	}
	else{
		return callback(true);
	}
}
