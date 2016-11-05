//This file will give the summary of orders related to particular seller to be used in dashboards.
var TAG = "TodaysOrderDetails- ";

var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var timezoneConversions = require('../helpers/timezoneConversions.js');
var underscore = require('underscore');
var decryption = require('../helpers/encryptDecryptFunction.js');
var async = require('async');

//Function that will give summary of orders related to particular seller to be used in dashboards.
exports.getTodaysOrderDetails = function(req, callback){
	var db = dbConfig.mongoDbConn;
	var logger = log.logger_sup;
	var resJson;

	logger.debug(TAG + " ------ Request recieved for TodaysOrderDetails. ------");
	logger.debug(TAG + "req.body :-" + JSON.stringify(req.body));

	if (!(req.body === null || req.body.sellerId === undefined || 
		req.body.sellerId.toString().trim().length === 0 )) 
	{
		var currentStartDate = timezoneConversions.toIST(new Date());
		currentStartDate.setHours(0,0,0,0);	// ex: 2016-01-10T00:00:00.00
	    currentStartDate = timezoneConversions.toUTC(currentStartDate);
	    //(currentStartDate - ex: IST - 20-01-2016 02:00:00 ==> 20-01-2016 00:00:00  ==> set hours ==> 19-01-2016 18:30:00)
		
	    var orderStatus = ["Pending","OnHold","Failed","Cancelled"];
	    // exclude OrderItem Status in Shipped and not shipped by Seller.
		var query = [ 
				{ $match : {"orderEntity.orderInfo.orderDate": { $gte: currentStartDate}}},
				{ $unwind : "$orderEntity.orderInfo.sellerInfo" },
				{ $unwind : "$orderEntity.orderInfo.sellerInfo.orderItemInfo" },
				{ $match : {
					"orderEntity.orderInfo.orderDate": { $gte: currentStartDate},
				    "orderEntity.orderInfo.sellerInfo.sellerId": req.body.sellerId,
				    "orderEntity.orderInfo.sellerInfo.orderItemInfo.itemStatus": {$nin : orderStatus},
					"orderEntity.orderInfo.sellerInfo.orderItemInfo.cancelledBy": {$nin : ["Customer"]}
				}},
				{ $group: {
							_id: "$orderEntity.orderInfo.orderNumber", 
						    orderNumber: {$first: "$orderEntity.orderInfo.orderNumber"}, 
						    orderDate: {$first: "$orderEntity.orderInfo.orderDate"},
						    orderType:{$first: "$orderEntity.orderInfo.orderType"},
						    creditDays:{$first: "$orderEntity.orderInfo.creditDays"},
						    orderPlatform: {$first: "$orderEntity.orderInfo.orderPlatform"},
						    lastUpdatedOn: {$first: "$orderEntity.orderInfo.sellerInfo.orderItemInfo.lastUpdatedOn"},
						    confirmByDate: {$first : {$add: ["$orderEntity.orderInfo.orderDate", 1*24*60*60000]}},		//adding one day to orderDate.
						    orderLine: {$sum: 1}, 
						    deliveryDate: {$min: "$orderEntity.orderInfo.sellerInfo.orderItemInfo.minDeliveryDate"}, 
						    paymentMethod: {$first : "$orderEntity.paymentInfo.paymentMode"},
						    orderTotal: {$sum: "$orderEntity.orderInfo.sellerInfo.orderItemInfo.total"}, 
						    productName: {$push: "$orderEntity.orderInfo.sellerInfo.orderItemInfo.productName"},
						    orderDeliveryAddress: {$first : "$orderEntity.orderInfo.orderDeliveryAddress"},
						    lineItemStatus: {$push : "$orderEntity.orderInfo.sellerInfo.orderItemInfo.itemStatus"},
						    orderAcknowledged: {$first : "$orderEntity.orderInfo.sellerInfo.orderAcknowledged"},
						    deliveredOn: {$first : "$orderEntity.orderInfo.sellerInfo.deliveredOn"},
						    cancelledOn: {$first : "$orderEntity.orderInfo.sellerInfo.cancelledOn"}
					    }
				}
		];
		query.push({$sort : {"lastUpdatedOn": -1}});
		var ordersColl = db.collection('Orders');
		logger.debug(TAG + " TodaysOrderDetails 1st query: " + JSON.stringify(query));
		ordersColl.aggregate(query, function(error, result){
			if(!error)
			{
				if(result.length > 0)
				{	
					logger.debug(TAG + " result of 1st query: " + JSON.stringify(result));
					var orderDeliveryAddress = result[0].orderDeliveryAddress;
					for(var k = 0; k < orderDeliveryAddress.length; k++)
					{
						var PAN = orderDeliveryAddress[k].PAN;
						var TIN = orderDeliveryAddress[k].TIN;
						if(!(orderDeliveryAddress[k].PAN === undefined || orderDeliveryAddress[k].TIN === undefined))
						{	
							encryptKeys(PAN, TIN, function(err, encryptedResult){
								if(!err && encryptedResult != null)
								{
									result[0].orderDeliveryAddress[k].PAN = encryptedResult.PAN;
									result[0].orderDeliveryAddress[k].TIN = encryptedResult.TIN;
									logger.debug(TAG + " PAN and TIN Encrypted successfully");
								}
								else
								{
									logger.debug(TAG + " Error encrypting PAN and TIN, error: "+ err);
								}
							});
						}	
					}

					// The lineItemStatus is an Array of status, Need to find the min status for the Order.
					for(var j = 0; j < result.length; j++)
					{
						var StatusCode = {"Confirmed": 1,"Accepted": 2,
						"Ready To Ship": 3,"Shipped": 4,"Delivered": 5, "Cancelled": 6};
						var calarr = [];
						var itemStatusArray = result[j].lineItemStatus;
						underscore.each(itemStatusArray, function(element, index, list){
							calarr.push((StatusCode[element]));
						});
						var lineItemStatus = (underscore.invert(StatusCode))[underscore.min(calarr)];
						result[j].lineItemStatus = lineItemStatus;
					};
				};	

				// Now fire an other query to retrive just Cancelled Orders.
				var newMatch = { $match : {
					"orderEntity.orderInfo.orderDate": { $gte: currentStartDate},
				    "orderEntity.orderInfo.sellerInfo.sellerId": req.body.sellerId,
				    "orderEntity.orderInfo.sellerInfo.orderItemInfo.itemStatus": {$in : ["Cancelled"]},
					"orderEntity.orderInfo.sellerInfo.orderItemInfo.cancelledBy": {$nin : ["Customer"]}
				}}
				//Replace this new match condition with the existing match condition.
				query[3] = newMatch;
				logger.debug(TAG + " TodaysOrderDetails 2nd query for cancelled Orders: " + JSON.stringify(query));
				ordersColl.aggregate(query, function(err, cancelledResult){
					if(!err)
					{
						if(cancelledResult.length > 0)
						{	
							for(var j = 0; j < cancelledResult.length; j++)
							{
								cancelledResult[j].lineItemStatus = "Cancelled";
							};
						};

						var finalResult = result.concat(cancelledResult);
						if(finalResult.length > 0)
						{	
							resJson = {
								    "http_code" : "200",
									"message" : {"orderEntity": finalResult }
							};

							logger.debug(TAG + " TodaysOrderDetails retrieved sucessfully for input seller: " + req.body.sellerId);
							return callback(false,resJson);
						}
						else
						{
							resJson = {
							    	"http_code" : "500",
									"message" : "No Orders found."
							};
							logger.error(TAG + " No Orders found for TodaysOrderDetails for seller: " + req.body.sellerId);
							return callback(true, resJson);
						}
					}
					else
					{
						resJson = {
							    "http_code" : "500",
								"message" : "TodaysOrderDetails cannot be retrieved. Please retry.."
						};
						logger.error(TAG + " Error- Getting TodaysOrderDetails(Cancelled Orders) for the seller: " + req.body.sellerId + ", Error: " + err);
						return callback(true, resJson);
					}
				});				
			}
			else
			{
				resJson = {
					    "http_code" : "500",
						"message" : "TodaysOrderDetails cannot be retrieved. Please retry.."
				};
				logger.error(TAG + " Error- Getting TodaysOrderDetails for the seller: " + req.body.sellerId + ", Error: " + error);
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
		logger.error(TAG + " Invalid inputs - "+ JSON.stringify(req.body));		
		return callback(true, resJson);
	}
};


// Function to Encrypt important output fields of login
function encryptKeys(PAN, TIN, callback){
	
	var logger = log.logger_sup;
	try
	{	
		async.parallel([
			//Function to encrypt PAN.
			function(asyncCallback){
				var resJson ={};
				if (!(PAN === undefined || PAN === null || PAN.toString().trim().length === 0))
				{
					decryption.encrypt(PAN, function(err, encryptedPAN){
						if(!err && encryptedPAN != null)
						{
							resJson.PAN = encryptedPAN;
							return asyncCallback(false, resJson);	
						}
						else
						{
							logger.error(TAG + "Error encrypting PAN for PAN: "+ PAN + "error: " +encryptedPAN);
							return callback(true, resJson);
						}
					});
				}
				else
				{
					resJson.PAN = null;
					return asyncCallback(false, resJson);
				}	
			},
			//Function to get TIN.
			function(asyncCallback){
				var resJson ={};
				if (!(TIN === undefined || TIN === null || TIN.toString().trim().length === 0))
				{
					decryption.encrypt(TIN, function(err, encryptedTIN){
						if(!err && encryptedTIN != null)
						{
							resJson.TIN = encryptedTIN;
							return asyncCallback(false, resJson);	
						}
						else
						{
							logger.error(TAG + "Error encrypting TIN for TIN: "+ TIN + "error: " +encryptedTIN);
							return callback(true, resJson);
						}
					});
				}
				else
				{
					resJson.TIN = null;
					return asyncCallback(false, resJson);
				}	
			}
		],
		//Final function that will be called by functions defined in parallel.
		////Function to get all encrypted keys.
		function(error, results){															
			if(!error){
				logger.debug(TAG + " encrypted Result: " + JSON.stringify(results));
				var result = {"PAN":PAN, "TIN":TIN};
				for(var i = 0; i < results.length; i++)
				{
					if(!(results[i].PAN === undefined || results[i].PAN === null))
					{
						result.PAN = results[i].PAN;
					}
					else if(!(results[i].TIN === undefined || results[i].TIN === null))
					{
						result.TIN = results[i].TIN;
					}		
				}
				return callback(false, result);
			}
			else
			{
				logger.error(TAG + " error encrypting keys.");
				return callback(true, null);
			}
		});
	}
	catch(e)
  	{
    	console.log(TAG + "Exception in TodaysOrderDetails - encryptKeys:  " + e);
    	logger.error(TAG + "Exception in TodaysOrderDetails - encryptKeys :- error :" + e);
		return callback(true, null);
  	}
}  	