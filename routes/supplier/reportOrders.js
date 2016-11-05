//This file will help to get data for reports, graphs.
var TAG = "reportOrders- ";

var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var async = require('async');
var timezoneConversions = require('../helpers/timezoneConversions.js');

//Function that will get order reports.
exports.getreportOrders = function(req, callback){

	var db = dbConfig.mongoDbConn;
	var ordersColl = db.collection('Orders');
	var logger = log.logger_sup;

	//calling input validation function.
	validateInput(req, function(valid, fromDate, toDate){
		if(valid){	//If returned valid field is true, proceed forward. 
				async.parallel([
				//Function to get ReceivedOrder.
				function(asyncCallback){
					var resJson = {};
					//default values when there is no result.
					resJson.reportType = "ReceivedOrder";
					resJson.orderValues = 0;
					resJson.totalOrders = 0;
					resJson.avgOrderValue = 0;

					var query = [];
					var validReceivedOrderStatus = ["Accepted", "Confirmed", "Ready To Ship", "Shipped", "Delivered"];
					
					query.push({ $unwind : "$orderEntity.orderInfo.sellerInfo" });
					query.push({ $match : {"orderEntity.orderInfo.sellerInfo.sellerId": req.body.sellerId}});
					query.push({ $unwind : "$orderEntity.orderInfo.sellerInfo.orderItemInfo" });

					//Based on fromDate field, inserting orderEntity.orderInfo.orderDate field to match condition. 
					if(req.body.fromDate === null){
						query.push({ $match : {
								"$or": 
									[
										{"$and": 
											[
												{"orderEntity.orderInfo.sellerInfo.orderItemInfo.itemStatus": {"$in": ["Cancelled"]}},
												{"orderEntity.orderInfo.sellerInfo.orderItemInfo.cancelledBy": {"$nin": ["Customer"]}}
											]
										}, 
										{
											"orderEntity.orderInfo.sellerInfo.orderItemInfo.itemStatus": {"$in": validReceivedOrderStatus}
										}
									]
							 	}
						});
					}
					else
					{
						query.push({ $match : {
								"$or": 
									[
										{"$and": 
											[
												{"orderEntity.orderInfo.sellerInfo.orderItemInfo.itemStatus": {"$in": ["Cancelled"]}},
												{"orderEntity.orderInfo.sellerInfo.orderItemInfo.cancelledBy": {"$nin": ["Customer"]}}
											]
										}, 
										{
											"orderEntity.orderInfo.sellerInfo.orderItemInfo.itemStatus": {"$in": validReceivedOrderStatus}
										}
									],
								"orderEntity.orderInfo.orderDate": { $gte:fromDate, $lt: toDate }
							}
						});
					}

					query.push({
							$group: {_id: "orderEntity.orderInfo.sellerInfo.sellerId",
							orderValues: {$sum: "$orderEntity.orderInfo.sellerInfo.orderItemInfo.total"},
							//totalOrders: {$sum: 1},
							totalOrders: {$addToSet: "$orderEntity.orderInfo.orderNumber"}}
							//avgOrderValue: { $avg: "$orderEntity.orderInfo.sellerInfo.orderItemInfo.total" }}
					});

					logger.debug(TAG + "query for ReceivedOrder : " + JSON.stringify(query));
					ordersColl.aggregate(query,
						function(error, result){
							if(!error && result.length > 0 )
							{
								logger.debug(TAG + " got results for ReceivedOrder Report. - " + result[0]);
								resJson.orderValues = result[0].orderValues;
								//resJson.totalOrders = result[0].totalOrders;
								resJson.totalOrders = result[0].totalOrders.length;
								//resJson.avgOrderValue = result[0].avgOrderValue;
								resJson.avgOrderValue = result[0].orderValues/result[0].totalOrders.length;
								return asyncCallback(false, resJson);
							}
							else if(!error && result.length < 1)
							{
								logger.error(TAG + " no results for ReceivedOrder Report err: " + error);
								return asyncCallback(false, resJson);
							}
							else
							{
								logger.error(TAG + "Error- getting ReceivedOrder Report for the seller: " + req.body.sellerId + " , Error: " + error);
								return asyncCallback(true, resJson);
							}	
					});
				},
				//Function to get DeliveredOrders.
				function(asyncCallback){
					var resJson = {};
					//default values when there is no result.
					resJson.reportType = "DeliveredOrders";
					resJson.orderValues = 0;
					resJson.totalOrders = 0;
					resJson.avgOrderValue = 0;

					var query = []; 
					
					query.push({ $unwind : "$orderEntity.orderInfo.sellerInfo" });
					query.push({ $match : {"orderEntity.orderInfo.sellerInfo.sellerId": req.body.sellerId}});
					query.push({ $match : {"orderEntity.orderInfo.sellerInfo.sellerOrderStatus": {$in : ["Delivered", "Partially delivered"]}}});
					query.push({ $unwind : "$orderEntity.orderInfo.sellerInfo.orderItemInfo" });

					//Based on fromDate field, inserting orderEntity.orderInfo.orderDate field to match condition. 
					if(req.body.fromDate === null){
						query.push({ $match : {
								"orderEntity.orderInfo.sellerInfo.orderItemInfo.itemStatus": {$in : ["Delivered"]}}
						});
					}
					else{
						query.push({ $match : {
								"orderEntity.orderInfo.sellerInfo.orderItemInfo.itemStatus": {$in : ["Delivered"]},
								"orderEntity.orderInfo.sellerInfo.orderItemInfo.deliveredOn": { $gte:fromDate, $lt: toDate }
							  }
						});
					}

					query.push({
							$group: {_id: "orderEntity.orderInfo.sellerInfo.sellerId",
							orderValues: {$sum: "$orderEntity.orderInfo.sellerInfo.orderItemInfo.total"},
							//totalOrders: {$sum: 1},
							totalOrders: {$addToSet: "$orderEntity.orderInfo.orderNumber"}}
							//avgOrderValue: { $avg: "$orderEntity.orderInfo.sellerInfo.orderItemInfo.total" }}
					});
					
					logger.debug(TAG + "query for DeliveredOrders : " + JSON.stringify(query));
					ordersColl.aggregate(query, function(error, result){
						if(!error && result.length > 0 )
						{
							logger.debug(TAG + " got results for DeliveredOrders Report. - " + result[0]);
							resJson.orderValues = result[0].orderValues;
							//resJson.totalOrders = result[0].totalOrders;
							resJson.totalOrders = result[0].totalOrders.length;
							//resJson.avgOrderValue = result[0].avgOrderValue;
							resJson.avgOrderValue = result[0].orderValues/result[0].totalOrders.length;
							return asyncCallback(false, resJson);
						}
						else if(!error && result.length < 1 )
						{
							logger.error(TAG + " no results for DeliveredOrders Report err: " + error);
							return asyncCallback(false, resJson);
						}
						else
						{
							logger.error(TAG + "Error- getting DeliveredOrders Report for the seller: " + req.body.sellerId + " , Error: " + error);
							return asyncCallback(true, resJson);
						}	
					});
				},
				//Function to get TopValuedSKU.
				function(asyncCallback){
					var resJson = {};
					//default values when there is no result.
					resJson.reportType = "TopValuedSKU";
					resJson.SKUInfo = null;

					if(req.body.fromDate === null){

						ordersColl.aggregate([
							{ $match : {"orderEntity.orderInfo.sellerInfo.orderItemInfo.itemStatus": {$nin : ["Pending","OnHold","Failed","Cancelled"]}}},
							{ $unwind : "$orderEntity.orderInfo.sellerInfo" },
							{ $match : {"orderEntity.orderInfo.sellerInfo.sellerId": req.body.sellerId}},
							{ $unwind : "$orderEntity.orderInfo.sellerInfo.orderItemInfo" },
							{$group: {_id: "$orderEntity.orderInfo.sellerInfo.orderItemInfo.SKUId",
							SKUId: {$first: "$orderEntity.orderInfo.sellerInfo.orderItemInfo.SKUId"},
							productDescription: {$first: "$orderEntity.orderInfo.sellerInfo.orderItemInfo.productName"},
							rowTotal: {$sum: "$orderEntity.orderInfo.sellerInfo.orderItemInfo.total"}
							}},
							{ $sort : { rowTotal : -1 } },
							{ $limit : 5 }],
							function(error, result){
								if(!error && result.length > 0 )
								{
									logger.debug(TAG + " got results for TopValuedSKU Report. - " + result);
									var skuInfo = [];
									for(var i = 0; i < result.length; i++){
										skuInfo.push({"SKUId": result[i].SKUId, "productDescription": result[i].productDescription, "rowTotal": result[i].rowTotal});
									}
									resJson.SKUInfo = skuInfo;
									return asyncCallback(false, resJson);
								}
								else if(!error && result.length < 1 )
								{
									logger.error(TAG + " no results for TopValuedSKU Report err: " + error);
									return asyncCallback(false, resJson);
								}
								else
								{
									logger.error(TAG + "Error- getting TopValuedSKU Report for the seller: " + req.body.sellerId + " , Error: " + error);
									return asyncCallback(true, resJson);
								}	
						});
					}
					else{
						return asyncCallback(false, null);
					}
				},
				//Function to get TopCancelledSKU.
				function(asyncCallback){
					var resJson = {};
					//default values when there is no result.
					resJson.reportType = "TopCancelledSKU";
					resJson.SKUInfo = null;

					if(req.body.fromDate === null){

						ordersColl.aggregate([
							{ $unwind : "$orderEntity.orderInfo.sellerInfo" },
							{ $match : {"orderEntity.orderInfo.sellerInfo.sellerId": req.body.sellerId}},
							{ $unwind : "$orderEntity.orderInfo.sellerInfo.orderItemInfo" },
							{ $match : {"orderEntity.orderInfo.sellerInfo.orderItemInfo.itemStatus": {$in : ["Cancelled"]},
							"orderEntity.orderInfo.sellerInfo.orderItemInfo.cancelledBy": {$nin : ["Customer"]}
							}},
							{$group: {_id: "$orderEntity.orderInfo.sellerInfo.orderItemInfo.reasonForCancellation",
							reasonForCancellation: {$first: "$orderEntity.orderInfo.sellerInfo.orderItemInfo.reasonForCancellation"},
							rowTotal: {$sum: "$orderEntity.orderInfo.sellerInfo.orderItemInfo.total"}
							}},
							{ $sort : { rowTotal : -1 } },
							{ $limit : 5 }],
							function(error, result){
								if(!error && result.length > 0 )
								{
									logger.debug(TAG + " got results for TopCancelledSKU Report. - " + result);
									var skuInfo = [];
									for(var i = 0; i < result.length; i++){
										skuInfo.push({"rowTotal": result[i].rowTotal, "reasonOfCancellation": result[i].reasonForCancellation});
									}
									resJson.SKUInfo = skuInfo;
									return asyncCallback(false, resJson);
								}
								else if(!error && result.length < 1 )
								{
									logger.error(TAG + " no results for TopCancelledSKU Report err: " + error);
									return asyncCallback(false, resJson);
								}
								else
								{
									logger.error(TAG + "Error- getting TopCancelledSKU Report for the seller: " + req.body.sellerId + " , Error: " + error);
									return asyncCallback(true, resJson);
								}	
						});
					}
					else{
						return asyncCallback(false, null);
					}
				}
			],
			//Final function that will be called by functions defined in series. 
			function(error, results){															
				if(!error){
					var finalres = {};
					finalres.reports = results;
					resJson = {
							    "http_code" : "200",
								"message" : finalres
						};
					logger.debug(TAG + " got final result.");
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
	var fromDate, toDate;

	if( !( req.body === undefined || req.body.sellerId === undefined || req.body.sellerId.toString().trim().length === 0 || 
	  req.body.fromDate === undefined || req.body.toDate === undefined ||
	  req.body.toDate.toString().trim().length === 0) ){

		//Other than fromDate, all have some values.

		//checking value of fromDate is null or any valid date.
		if(req.body.fromDate === null){
			valid = true;
		}
		else{
			if(req.body.fromDate.toString().trim().length !== 0){
				
				fromDate = new Date(req.body.fromDate);
				toDate = new Date(req.body.toDate);

				var fromDate = timezoneConversions.toIST(fromDate);
				fromDate.setHours(0,0,0,0);	// ex: 2016-01-10T00:00:00.00
    			fromDate = timezoneConversions.toUTC(fromDate);

			    var toDate = timezoneConversions.toIST(toDate);
				toDate.setHours(23,59,59,999); // ex: 2016-01-10T23:59:59.999
			    toDate = timezoneConversions.toUTC(toDate);

				//checking fromDate, toDate is valid date.
				if(timezoneConversions.validateDate(fromDate) && timezoneConversions.validateDate(toDate)){
					valid = true;
				}
				else{
					valid = false;
				}
			}
			else{
				valid = false;
			}
		}
	}
	callback(valid, fromDate, toDate);
}