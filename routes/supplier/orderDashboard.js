//To populate Seller Dashboard with his Order Information.
var TAG = "orderDashboard- ";

var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var async = require('async');
var timezoneConversions = require('../helpers/timezoneConversions.js');

//Function that will get data populated for the Supplier dashboard.
exports.getDashboardData = function(req, callback){

	var db = dbConfig.mongoDbConn;
	var ordersColl = db.collection('Orders');
	var logger = log.logger_sup;

	logger.debug(TAG + " ------ Request recieved for getDashboardData. ------");
	logger.debug(TAG + "req.body: " + JSON.stringify(req.body));
	//Validate the Input for all mandatory values. and get the currentDate in EST.
	validateInput(req, function(valid, currentDate){
		if(valid)
		{	//On successfull validation, proceed further. 
				async.parallel([
				/*Function to get number of orders and value of orders which have 
				order date as today's date and are not in 'Pending' or 'On hold' status
				or 'Cancelled' status and Cancelled by as customer.*/
				function(asyncCallback){
					var resJson = {};
					//default values when there is no result.
					resJson.reportType = "TodaysOrder";
					resJson.orderValues = 0;
					resJson.totalOrders = 0;
					var query = []; 
					
					query.push({ $match : {"orderEntity.orderInfo.orderDate": {$gte:currentDate}}});
					query.push({ $unwind : "$orderEntity.orderInfo.sellerInfo" });
					query.push({ $match : {"orderEntity.orderInfo.sellerInfo.sellerId": req.body.sellerId}});
					query.push({ $unwind : "$orderEntity.financials.seller" });
					query.push({ $match : {"orderEntity.financials.seller.sellerId": req.body.sellerId}});
					query.push({ $unwind : "$orderEntity.orderInfo.sellerInfo.orderItemInfo" });
					query.push({ $match :
							{
								"orderEntity.orderInfo.sellerInfo.orderItemInfo.itemStatus": {$nin : ["Pending","OnHold","Failed"]},
								"orderEntity.orderInfo.sellerInfo.orderItemInfo.cancelledBy": {$nin : ["Customer"]},
								/*"$or": 
								[
									{"$and": 
										[
											{"orderEntity.orderInfo.sellerInfo.orderItemInfo.itemStatus": {"$in": ["Shipped"]}},
											{"orderEntity.orderInfo.sellerInfo.orderItemInfo.shippedBySeller": true }
										]
									}, 
									{
										"orderEntity.orderInfo.sellerInfo.orderItemInfo.itemStatus": {"$in": ["Accepted", "Confirmed", "Ready To Ship","Delivered","Cancelled"]}
									}
								]*/
							}
						});
					//get first value of orderValues, as it is grouped by orderItemInfo and orderValues is from any one of the financials for a seller.
					query.push({
							$group: {_id: "$orderEntity.orderInfo.orderNumber",
							orderNumber: {$first: "$orderEntity.orderInfo.orderNumber"},
							orderValues: {$sum: "$orderEntity.orderInfo.sellerInfo.orderItemInfo.total"}
							}
					});

					logger.debug(TAG + " query for TodaysOrder : " + JSON.stringify(query));
					ordersColl.aggregate(query, function(error, result){
						if(!error && result.length > 0 )
						{
							logger.debug(TAG + " got results for TodaysOrder Dashboard. - " + result);
							var orderValues = 0;
						    var totalOrders = 0;
							for (var i = 0; i < result.length; i++) 
						    {						
						    	totalOrders = totalOrders + 1;
						    	orderValues = orderValues + result[i].orderValues;
						    }
							resJson.orderValues = orderValues;
							resJson.totalOrders = totalOrders;
							return asyncCallback(false, resJson);
						}
						else if(!error && result.length < 1 )
						{
							logger.error(TAG + " No results for TodaysOrder Dashboard found for seller: " + req.body.sellerId);
							return asyncCallback(false, resJson);
						}
						else
						{
							logger.error(TAG + "Error- getting TodaysOrder Dashboard for the seller: " + req.body.sellerId + " , Error: " + error);
							return asyncCallback(true, resJson);
						}
					});
				},
				/* Function to get the number of orders and value of orders 
				irrespective of order date which are not in 'Pending' or 'On hold'
				status or 'Cancelled' status and Cancelled by as customer.
				*/
				function(asyncCallback){
					var resJson = {};
					//default values when there is no result.
					resJson.reportType = "TotalOrders";
					resJson.orderValues = 0;
					resJson.totalOrders = 0;

					var query = []; 
					
					query.push({ $unwind : "$orderEntity.orderInfo.sellerInfo" });
					query.push({ $match : {"orderEntity.orderInfo.sellerInfo.sellerId": req.body.sellerId}});
					query.push({ $unwind : "$orderEntity.financials.seller" });
					query.push({ $match : {"orderEntity.financials.seller.sellerId": req.body.sellerId}});
					query.push({ $unwind : "$orderEntity.orderInfo.sellerInfo.orderItemInfo" });
					query.push({ $match : {
								//"orderEntity.orderInfo.sellerInfo.orderItemInfo.itemStatus": {$nin : ["Pending","OnHold","Failed"]},
								"orderEntity.orderInfo.sellerInfo.orderItemInfo.cancelledBy": {$nin : ["Customer"]},
								"$or": 
								[
									{"$and": 
										[
											{"orderEntity.orderInfo.sellerInfo.orderItemInfo.itemStatus": {"$in": ["Cancelled"]}},
											{"orderEntity.orderInfo.sellerInfo.sellerOrderStatus": {"$in": ["Cancelled"]} }
										]
									}, 
									{
										"orderEntity.orderInfo.sellerInfo.orderItemInfo.itemStatus": {$nin : ["Pending","OnHold","Failed","Cancelled"]}
									}
								]
							  	/*"$or": 
								[
									{"$and": 
										[
											{"orderEntity.orderInfo.sellerInfo.orderItemInfo.itemStatus": {"$in": ["Shipped"]}},
											{"orderEntity.orderInfo.sellerInfo.orderItemInfo.shippedBySeller": true }
										]
									}, 
									{
										"orderEntity.orderInfo.sellerInfo.orderItemInfo.itemStatus": {"$in": ["Accepted", "Confirmed", "Ready To Ship","Delivered","Cancelled"]}
									}
								]*/
							  }
							});
					//get first value of orderValues, as it is grouped by orderItemInfo and orderValues is from any one of the financials for a seller.
					query.push({
							$group: {_id: "$orderEntity.orderInfo.orderNumber",
							orderNumber: {$first: "$orderEntity.orderInfo.orderNumber"},
							orderValues: {$sum: "$orderEntity.orderInfo.sellerInfo.orderItemInfo.total"}
							}
					});

					logger.debug(TAG + " query for TotalOrders : " + JSON.stringify(query));
					ordersColl.aggregate(query, function(error, result){
						if(!error && result.length > 0 )
						{
							logger.debug(TAG + "got results for TotalOrders Dashboard. - " + result);
							var orderValues = 0;
						    var totalOrders = 0;
							for (var i = 0; i < result.length; i++)
						    {						
						    	totalOrders = totalOrders + 1;
						    	orderValues = orderValues + result[i].orderValues;
						    }
							resJson.orderValues = orderValues;
							resJson.totalOrders = totalOrders;
							return asyncCallback(false, resJson);
						}
						else if(!error && result.length < 1 )
						{
							logger.error(TAG + " No results found for TotalOrders Dashboard for the seller: " + req.body.sellerId);
							return asyncCallback(false, resJson);
						}
						else
						{
							logger.error(TAG + "Error- getting TotalOrders Dashboard for the seller: " + req.body.sellerId + " , Error: " + error);
							return asyncCallback(true, resJson);
						}	
					});
				},
				/*Pending for Acceptance: Send the number of orders which are in confirmed status. */
				function(asyncCallback){
					var resJson = {};
					//default values when there is no result.
					resJson.reportType = "PendingForAcceptance";
					resJson.orderValues = 0;
					resJson.totalOrders = 0;
					var query = [];
					
					query.push({ $unwind : "$orderEntity.orderInfo.sellerInfo" });
					query.push({ $match : {"orderEntity.orderInfo.sellerInfo.sellerId": req.body.sellerId}});
					query.push({ $unwind : "$orderEntity.orderInfo.sellerInfo.orderItemInfo" });
					query.push({ $match : {"orderEntity.orderInfo.sellerInfo.orderItemInfo.itemStatus": {$in : ["Confirmed"]}}
							});
					//Sum orderValues, as it is grouped by orderItemInfo and orderValues is sum of all line item.
					query.push({
							$group: {_id: "$orderEntity.orderInfo.orderNumber",
  							orderNumber: {$first: "$orderEntity.orderInfo.orderNumber"},
  							orderValues: {$sum: "$orderEntity.orderInfo.sellerInfo.orderItemInfo.total"}
							}
					});

					logger.debug(TAG + " query for PendingForAcceptance : " + JSON.stringify(query));
					ordersColl.aggregate(query, function(error, result){
						if(!error && result.length > 0 )
						{
							logger.debug(TAG + "got results for PendingForAcceptance Dashboard. - " + result);
							var orderValues = 0;
						    var totalOrders = 0;
							for (var i = 0; i < result.length; i++)
						    {						
						    	totalOrders = totalOrders + 1;
						    	orderValues = orderValues + result[i].orderValues;
						    }
							resJson.orderValues = orderValues;
							resJson.totalOrders = totalOrders;
							return asyncCallback(false, resJson);
						}
						else if(!error && result.length < 1)
						{
							logger.error(TAG + "No results found for PendingForAcceptance Dashboard for the seller: " + req.body.sellerId);
							return asyncCallback(false, resJson);
						}
						else
						{
							logger.error(TAG + "Error- getting PendingForAcceptance Dashboard for the seller: " + req.body.sellerId + " , Error: " + error);
							return asyncCallback(true, resJson);
						}	
					});
				},
				/* Pending for Shipping: Send the number of orders
				 which are in Accepted/Ready to Ship status */
				function(asyncCallback){
					var resJson = {};
					//default values when there is no result.
					resJson.reportType = "PendingForShipping";
					resJson.orderValues = 0;
					resJson.totalOrders = 0;
					var query = []; 
					
					query.push({ $unwind : "$orderEntity.orderInfo.sellerInfo" });
					query.push({ $match : {"orderEntity.orderInfo.sellerInfo.sellerId": req.body.sellerId}});
					query.push({ $unwind : "$orderEntity.orderInfo.sellerInfo.orderItemInfo" });
					query.push({ $match : {"orderEntity.orderInfo.sellerInfo.orderItemInfo.itemStatus": {$in : ["Accepted", "Ready To Ship"]}}
							});
					//Sum orderValues, as it is grouped by orderItemInfo and orderValues is sum of all line item total.
					query.push({
							$group: {_id: "$orderEntity.orderInfo.orderNumber",
  							orderNumber: {$first: "$orderEntity.orderInfo.orderNumber"},
  							orderValues: {$sum: "$orderEntity.orderInfo.sellerInfo.orderItemInfo.total"}
							}
					});

					logger.debug(TAG + " query for PendingForShipping : " + JSON.stringify(query));
					ordersColl.aggregate(query, function(error, result){
						if(!error && result.length > 0 )
						{
							logger.debug(TAG + "got results for PendingForShipping Dashboard. - " + result);
							var orderValues = 0;
						    var totalOrders = 0;
							for (var i = 0; i < result.length; i++)
						    {						
						    	totalOrders = totalOrders + 1;
						    	orderValues = orderValues + result[i].orderValues;
						    }
							resJson.orderValues = orderValues;
							resJson.totalOrders = totalOrders;
							return asyncCallback(false, resJson);
						}
						else if(!error && result.length < 1 )
						{
							logger.error(TAG + " No results found for PendingForShipping Dashboard for the seller: " + req.body.sellerId);
							return asyncCallback(false, resJson);
						}
						else
						{
							logger.error(TAG + "Error- getting PendingForShipping Dashboard for the seller: " + req.body.sellerId + " , Error: " + error);
							return asyncCallback(true, resJson);
						}	
					});
				}
			],
			//Final function that will be called by functions defined in parallel. 
			function(error, results){															
				if(!error)
				{
					var finalRes = {};
					finalRes.dashboard = results;
					resJson = {
							    "http_code" : "200",
								"message" : finalRes
						};
					logger.debug(TAG + " got final result." + finalRes);
					return callback(false, resJson);
				}
				resJson = {
							    "http_code" : "500",
								"message" : "Seller Report cannot be retrieved. Please retry.."
						};
				logger.debug(TAG + " error getting result.");
				return callback(true, resJson);
			});
		}
		else{//If returned valid field is false, show error message. 
			resJson = {
			    "http_code" : "400",
				"message" : "Bad or ill-formed request.."
			};
			logger.error(TAG + " Invalid inputs");
			return callback(true, resJson);
		}
	});
}

function validateInput(req, callback){
	var valid = false;
	var currentDate;

	if(!(req.body === null || req.body.sellerId === undefined || 
	req.body.sellerId.toString().trim().length === 0)){

		currentDate = timezoneConversions.toIST(new Date());
		currentDate.setHours(0,0,0,0);	// ex: 2016-01-10T00:00:00.00
		currentDate = timezoneConversions.toUTC(currentDate);

		//checking fromDate, toDate is valid date.
		if(timezoneConversions.validateDate(currentDate)){
			valid = true;
		}
		else
		{
			valid = false;
		}
	}
	callback(valid, currentDate);
}