var TAG = "SupplierPOD- ";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');

//Function for the Forgot Password.
exports.updateSellerPOD= function updateSellerPOD (req, callback){
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;	
	//Variable for Logging the messages to the file.
	var logger = log.logger_sup;
	//Log the request.
	logger.info("+++ " + TAG + " Request received for updateSellerPOD. +++ ");
	logger.debug(TAG + "req.body :-" + JSON.stringify(req.body));
	//Declare the response
	var resJson;
	//Validate the request.
	if ( !(	req.body === null || req.body.sellerId === undefined || req.body.orderNumber === undefined || 
		req.body.podURL === undefined || req.body.sellerId === null || req.body.orderNumber === null || 
		req.body.podURL === null || req.body.sellerId.toString().trim().length === 0 ||
		req.body.orderNumber.toString().trim().length === 0 || req.body.podURL.toString().trim().length === 0)) 
	{

		var orderNumber = req.body.orderNumber;
		var sellerId = req.body.sellerId;
		var podURL = req.body.podURL;

		var ordersColl = db.collection('Orders');
		ordersColl.findOne({"orderEntity.orderInfo.orderNumber": orderNumber},{"_id": 0 },function(err, result) {	
			if(!err && (result !== null))
			{	
				ordersColl.update({"orderEntity.orderInfo.orderNumber": req.body.orderNumber,
						"orderEntity.orderInfo.sellerInfo": {$elemMatch: {"sellerId": req.body.sellerId}}},
						{ $push: {"orderEntity.orderInfo.sellerInfo.$.pod": req.body.podURL}}, function(error, result){
					try{
					result = JSON.parse(result);
					}
					catch(err){
						resJson = {
							    "http_code" : "500",
								"message" : "Error - update POD Failed. Please try again."
						};
						logger.error(TAG + " Exception - exception araised during parsing result in updateSellerPOD- "+err);
						return callback(true, resJson);
					}
					if(error)
					{
					
						logger.error(TAG + " Error updating podURL for orderNumber- "+ orderNumber +",sellerId: " + sellerId+ " err: " + err);
						resJson = {
							    "http_code" : "500",
								"message" : "Error updating podURL for orderNumber- "+ orderNumber +",sellerId: " + sellerId
						};
						return callback(true, resJson);
					}
					else if(result.n < 1)
				  	{
				  		resJson = {
							    "http_code" : "200",
								"message" : "Inputs does not match with our records.. Please retry.."
						};
				  		logger.debug(TAG + "Invalid Inputs, Inputs doesnt match with the database records, orderNumber- "+ orderNumber +"sellerId: " + sellerId);
				  		return callback(false, resJson);
				  	}
				  	else
				  	{
				  		logger.debug(TAG + " podURL update for orderNumber- "+ orderNumber +",sellerId: " + sellerId);
						resJson = {
							    "http_code" : "200",
								"message" : "podURL updated for orderNumber- "+ orderNumber +",sellerId: " + sellerId
						};
						return callback(false, resJson);
				  	}	
				});
			} 
			else if(!err && (result === null))
			{
				resJson = {
					    "http_code" : "500",
						"message" : "The inputs does not match with our records..Please retry.."
				};

				logger.error(TAG + "Invalid Inputs, Inputs doesnt match with the database records, orderNumber- "+ orderNumber +"sellerId: " + sellerId);
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
			    "http_code" : "400",
				"message" : "Bad or ill-formed request.."
		};
		logger.error(TAG + "Bad or ill-formed request. reqBody: " + JSON.stringify(req.body));
		return callback(true, resJson);
	}
};
