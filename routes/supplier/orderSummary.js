//This file will give the summary of orders related to particular seller.
var TAG = "OrderSummary- ";

var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var underscore = require('underscore');
var timezoneConversions = require('../helpers/timezoneConversions.js');

//Function that will give summary of order related to particular seller with respect to line item status.
exports.getSummary = function(req, callback){
	var db = dbConfig.mongoDbConn;
	var logger = log.logger_sup;
	var resJson;

	logger.debug(TAG + " ------ Request recieved for OrderSummary. ------");
	logger.debug(TAG + "req.body :-" + JSON.stringify(req.body));

	if (!(req.body === null || req.body.sellerId === undefined || 
		req.body.orderDisplayStatus === undefined || req.body.sellerId.toString().trim().length === 0 || 
		req.body.orderDisplayStatus.toString().trim().length === 0 )) 
	{
		var orderDisplayStatus;
		// Map the Display Order Status with the Line Item Status.
		if (req.body.orderDisplayStatus === "Cancelled")
		{
			orderDisplayStatus = [req.body.orderDisplayStatus];	// Status are same.
			lineItemDisplayStatus = [req.body.orderDisplayStatus];
		}	
		else if(req.body.orderDisplayStatus === "Delivered")
		{
			orderDisplayStatus = ["Delivered", "Partially delivered"];
			lineItemDisplayStatus = ["Delivered"];
		}	 
		else if(req.body.orderDisplayStatus === "New")
		{
			orderDisplayStatus = ["Confirmed"];
			lineItemDisplayStatus = ["Confirmed"];
		}
		else if (req.body.orderDisplayStatus === "In Progress")
		{
			orderDisplayStatus = ["Accepted", "Partially Accepted", "Ready To Ship", "Ready to Ship - Partial", "Shipped", "Partially Shipped"];
			lineItemDisplayStatus = ["Accepted", "Ready To Ship", "Shipped", "Delivered"];
		}
		else
		{
			logger.error(TAG + " Invalid orderDisplayStatus:" + req.body.orderDisplayStatus);
			resJson = {
					    "http_code" : "500",
						"message" : "Invalid orderDisplayStatus:" + req.body.orderDisplayStatus
				};
			return callback(true, resJson);
		}

		logger.debug(TAG + "orderDisplayStatus mapped :- " + orderDisplayStatus);
		var query = [
						  { $unwind : "$orderEntity.orderInfo.sellerInfo" },
						  { $unwind : "$orderEntity.orderInfo.sellerInfo.orderItemInfo" }
					];

		// Add Match Condition to Query
		query.push({ $match: {
			"orderEntity.orderInfo.sellerInfo.sellerId": req.body.sellerId,
			//"orderEntity.orderInfo.sellerInfo.sellerOrderStatus": {$in : orderDisplayStatus},
			"orderEntity.orderInfo.sellerInfo.orderItemInfo.itemStatus": {$in : lineItemDisplayStatus}}});

		// Only if querying for Delivered and InProgress, Query sellerOrderStatus.
		if(req.body.orderDisplayStatus === 'Delivered' || req.body.orderDisplayStatus === "In Progress"){
			query.push({ $match: {"orderEntity.orderInfo.sellerInfo.sellerOrderStatus": {$in : orderDisplayStatus}}});
		};

		// For Cancelled and Delivered Orders, Optional From and To field might be selected. If no dates are available, Give entire result.
		if(req.body.orderDisplayStatus === 'Cancelled' || req.body.orderDisplayStatus === 'Delivered')
		{
			/*// Only if querying for Delivered, Query sellerOrderStatus.
			if(req.body.orderDisplayStatus === 'Delivered'){
				query.push({ $match: {"orderEntity.orderInfo.sellerInfo.sellerOrderStatus": {$in : orderDisplayStatus}}});
			};*/	

			if (!(req.body.fromDate === undefined && req.body.toDate === undefined))
			{
				if(!(req.body.fromDate === null || req.body.toDate === null || req.body.fromDate.toString().trim().length === 0 || req.body.toDate.toString().trim().length === 0))
				{
					var fromDate = new Date(req.body.fromDate);
					fromDate = new Date(timezoneConversions.toIST(fromDate).setHours(0, 0, 0, 0));
	      			fromDate = new Date(timezoneConversions.toUTC(fromDate));

	      			var toDate = new Date(req.body.toDate);
	      			toDate = new Date(timezoneConversions.toIST(toDate).setHours(23, 59, 59, 999));
			        toDate = new Date(timezoneConversions.toUTC(toDate));

			        if(req.body.orderDisplayStatus === 'Cancelled'){
						query.push({ $match: {"orderEntity.orderInfo.sellerInfo.cancelledOn": {"$gte": fromDate,"$lte": toDate}}});
					}
					else if(req.body.orderDisplayStatus === 'Delivered'){
						query.push({ $match: {"orderEntity.orderInfo.sellerInfo.deliveredOn": {"$gte": fromDate,"$lte": toDate}}});
					}
				}
				else
				{
					resJson = {
						    "http_code" : "400",
							"message" : "Bad or ill-formed request, fromDate and toDate cannot be NULL"
						};
					logger.error(TAG + " Invalid inputs - "+ JSON.stringify(req.body));		
					return callback(true, resJson);
				}	
			}
		}
		
		//Adding groupby query.
		query.push({ $group: {_id: "$orderEntity.orderInfo.orderNumber", 
						    orderNumber: {$first: "$orderEntity.orderInfo.orderNumber"},
						    orderType:{$first: "$orderEntity.orderInfo.orderType"},
						    creditDays:{$first: "$orderEntity.orderInfo.creditDays"},
						    orderPlatform: {$first: "$orderEntity.orderInfo.orderPlatform"}, 
						    orderDate: {$first: "$orderEntity.orderInfo.orderDate"},
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
						    }});
		// For Cancelled and Delivered Order, If the Min Max Value exist then Filter the results for the range provided.
		if(req.body.orderDisplayStatus === 'Cancelled' || req.body.orderDisplayStatus === 'Delivered')
		{
			if (!(req.body.minValue === undefined))
			{
				//If minValue exist, then filter the result for greater than minValue.
				if(!(req.body.minValue === null || req.body.minValue.toString().trim().length === 0))
				{	
					query.push({ $match: {"orderTotal": {"$gte": req.body.minValue}}});
				}
			}
			if (!(req.body.maxValue === undefined))
			{	
				//If maxValue exist, then filter the result for lesser than maxvalue.
				if(!(req.body.maxValue === null || req.body.maxValue.toString().trim().length === 0))
				{	
					query.push({ $match: {"orderTotal": {"$lte": req.body.maxValue}}});
				}
			}	
		}
		// sort the result based on lastUpdatedOn timestamp, So that the user sees the Order which he has taken action.
		query.push({$sort : {"lastUpdatedOn": -1}});

		//If orderDisplayStatus is Delivered Or Cancelled, then Include pagination and limit the number of Orders for each page.
		if(req.body.orderDisplayStatus === 'Cancelled' || req.body.orderDisplayStatus === 'Delivered')
		{
			if (req.body.itemsPerPage != null && req.body.page != null && !isNaN(parseInt(req.body.itemsPerPage)) && !isNaN(parseInt(req.body.page))) 
			{
				// on first call, dont have limit in the query, to calculate total count.
				if(req.body.page > 0)
				{
					var limitCount = (req.body.page + 1) * req.body.itemsPerPage;
					var limit = {"$limit" : limitCount}
					query.push(limit);
				}	
			}
			else 
			{
				  resJson = {
					    "http_code" : "500",
						"message" : "For Delivered or Cancelled Orders, itemsPerPage & page are mandatory parameters and should be of type integer."
					};
				logger.error(TAG + "Delivered or Cancelled Orders, invalid itemsPerPage & page parameters. itemsPerPage: " + req.body.itemsPerPage + " , page: " + req.body.page);
				return callback(true, resJson);
			}
		}	
		var ordersColl = db.collection('Orders');
		logger.debug(TAG + "Order Summary Query: " + JSON.stringify(query));
		ordersColl.aggregate(query, function(error, result){
			if(!error && result.length > 0 )
			{
				var totalRecordCount = null;
				if(req.body.orderDisplayStatus === 'Cancelled' || req.body.orderDisplayStatus === 'Delivered')
				{
					// If page is 0, then no limit is applied. Hence Slice only the first itemsPerPage. (This is added to give total count on first call)
					if(req.body.page === 0)
					{	
						//get only first itemsPerPage records.
						totalRecordCount = result.length;
						result = result.slice(0 , req.body.itemsPerPage);
					}
					else
					{
						result = result.slice(req.body.page * req.body.itemsPerPage);
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

					if(!(req.body.orderDisplayStatus === 'Cancelled' || req.body.orderDisplayStatus === 'Delivered'))
					{
						delete result[j].deliveredOn;
						delete result[j].cancelledOn;
					}

					// To delete PAN and TIN from orderDeliveryAddress
					var orderDeliveryAddress = result[j].orderDeliveryAddress;
					for(var k = 0; k < orderDeliveryAddress.length; k++)
					{
						delete orderDeliveryAddress[k].PAN;
						delete orderDeliveryAddress[k].TIN;
					}
					result[j].orderDeliveryAddress = orderDeliveryAddress;
				};
				if(totalRecordCount != null)
				{
					var finalResults = {"orderEntity": result, "totalRecordCount" :totalRecordCount};
				}
				else
				{
					var finalResults = {"orderEntity": result };
				}
				resJson = {
						    "http_code" : "200",
							"message" : finalResults
					};
				logger.debug(TAG + " Summary of order retrieved sucessfully for the combination of input seller: " + req.body.sellerId + " , orderDisplayStatus: " + req.body.orderDisplayStatus);
				return callback(false,resJson);
			}
			else if(!error && result.length < 1 )
			{

				resJson = {
					    "http_code" : "500",
						"message" : "No Orders found."
				};
				logger.error(TAG + " No Order found for the combination of input seller: " + req.body.sellerId + " , orderDisplayStatus: " + req.body.orderDisplayStatus);
				return callback(true, resJson);
			}
			else
			{
				resJson = {
					    "http_code" : "500",
						"message" : "Seller Order Summary cannot be retrieved. Please retry.."
				};
				logger.error(TAG + " Error- Getting order summary for the seller: " + req.body.sellerId + ", orderDisplayStatus: " + req.body.orderDisplayStatus + ", Error: " + error);
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