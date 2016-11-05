//File that contains buisness logic for order API.
var TAG = "getLatestOrderStatus- ";

var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var decimalConv = require('../helpers/numberConversions.js');

exports.getOrderStatus = function(req, callback){
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;	
	//Variable for Logging the messages to the file.
	var logger = log.logger_sup;
	//Log the request.
	try
	{
		var resJson;
		logger.debug(TAG + " ------ Request recieved for getOrderStatus. ------");
		logger.debug(TAG + "req.body :-" + JSON.stringify(req.body));
		//Validate the Input parameters.
		if( !(req.body === undefined || req.body.sellerId === undefined || req.body.sellerId === null ||
			req.body.orderNumber === undefined || req.body.orderNumber === null)){
			
			var sellerId = req.body.sellerId;
		    var orderNumber = req.body.orderNumber;

		    var supplierNotifyColl = db.collection('SupplierNotifications');

			supplierNotifyColl.findOne({"notificationsInfo.sellerId": sellerId,
				"notificationsInfo.notifications": {$elemMatch: {"orderNumber": orderNumber}}},{"notificationsInfo.notifications.$.orderDisplayStatus":1},function(error, result){
			  	if(!error && result != null)
			  	{	
			  		var orderStatus = {"orderDisplayStatus":""};
			  		orderStatus.orderDisplayStatus = result.notificationsInfo.notifications[0].orderDisplayStatus;
			  		logger.debug(TAG + "orderDisplayStatus fetched successfully for orderNumber: "+orderNumber);
			  		resJson = {
					    "http_code" : "200",
						"message" : orderStatus
						};
			  		return callback(false, resJson);
			  	}
			  	else if(!error && result === null)
			  	{	
			  		logger.error(TAG + "No Orders found for seller: " + sellerId + ", OrderNumber: "+ orderNumber);
			  		resJson = {
					    "http_code" : "500",
						"message" : "No Orders found for seller and OrderNumber"
					};
			  		return callback(true, resJson);
			  	}
			  	else
			  	{
			  		logger.error(TAG + "Error getting orderDisplayStatus for seller: " + sellerId + ", OrderNumber: "+ orderNumber+ ", error: "+ error);
			  		resJson = {
					    "http_code" : "500",
						"message" : "Internal Server Error, Please Try again"
					};
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
			logger.error(TAG + "Invalid inputs: " + JSON.stringify(req.body));
			return callback(true, resJson);
		}
	}
	catch(e)
	{
	  console.log(TAG + "Exception in getOrderStatus- " + e);
	  logger.error(TAG + "Exception in getOrderStatus- :- error :" + e);
	  return callback(true, "Exception error");
	}	
};
