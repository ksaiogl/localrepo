//This file will give the summary of orders related to particular seller.
var TAG = "--- View Supplier Order ---    ";

var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var timezoneConversions = require('../helpers/timezoneConversions.js');

//Function that will list order related to particular seller.
exports.viewSupplierOrder = function(req, callback){
	var db = dbConfig.mongoDbConn;
	var logger = log.logger_crm;
	var resJson;

  logger.info(TAG + "Request received for view supplier order. REQ : " + req.url);

	if (req.query.orderID && req.query.sellerID)
	{
    var orderID = req.query.orderID;
    var sellerId = req.query.sellerID;

    var query = [
      // { $unwind : "$orderEntity.orderInfo.sellerInfo.orderItemInfo" },
			// { $project : { _id: 0 }},
      { $match: {	"orderEntity.orderInfo.orderNumber": orderID }},
			// { $project : {"_id": 0}},
      { $unwind : "$orderEntity.orderInfo.sellerInfo" },
      { $match: {	"orderEntity.orderInfo.sellerInfo.sellerId": sellerId }},
      { $unwind : "$orderEntity.financials.seller" },
      { $match: {	"orderEntity.financials.seller.sellerId": sellerId }},
			// { $project : { _id: 0 }},
      // {
      //   $group: {
      //     _id: "$orderEntity.orderInfo.orderNumber",
      //     orderDate: {$first: "$orderEntity.orderInfo.orderDate"},
      //     confirmByDate: {$first : {$add: ["$orderEntity.orderInfo.orderDate", 1*24*60*60000]}},		//adding one day to orderDate.
      //     paymentMethod:{$first:"$orderEntity.paymentInfo.paymentMode"},
      //     orderTotal: {$sum: "$orderEntity.orderInfo.sellerInfo.orderItemInfo.total"},
      //     orderAcknowledged: {$first : "$orderEntity.orderInfo.sellerInfo.orderAcknowledged"},
      //     lastUpdatedOn: {$first: "$orderEntity.orderInfo.sellerInfo.orderItemInfo.lastUpdatedOn"},
      //     orderLineItems: {$sum: 1},
      //     minDeliveryDate: {$min: "$orderEntity.orderInfo.sellerInfo.orderItemInfo.minDeliveryDate"},
      //     maxDeliveryDate: {$max: "$orderEntity.orderInfo.sellerInfo.orderItemInfo.maxDeliveryDate"},
      //   }
      // },

    ];

		var ordersColl = db.collection('Orders');
		// console.log(TAG + "Order Summary Query: " + JSON.stringify(query));
		ordersColl.aggregate(query, function(error, result){
      if (error) {
        resJson = {
          "http_code" : "500",
          "message" : "Order cannot be retrieved. Please contact engineering team."
				};
        // console.log(error.stack);
				logger.error(TAG + " Error- Getting order for seller: " + sellerId + ", Error: \n" + error.stack);
      } else {
				// console.log(result);
        if (result.length) {
					var order = result[0].orderEntity;
					// console.log(order);
					order.orderInfo.orderDate = timezoneConversions.toIST(order.orderInfo.orderDate);
					order.orderInfo.sellerInfo.orderItemInfo.forEach(function(element){
						if (element.lastUpdatedOn) element.lastUpdatedOn = timezoneConversions.toIST(element.lastUpdatedOn);
						if (element.deliveredOn) element.deliveredOn = timezoneConversions.toIST(element.deliveredOn);
						element.minDeliveryDate = timezoneConversions.toIST(element.minDeliveryDate);
						element.maxDeliveryDate = timezoneConversions.toIST(element.maxDeliveryDate);
					});

					if (order.orderInfo.orderTotals_A) order.orderInfo.orderTotals = order.orderInfo.orderTotals_A;
					
          // result.forEach(function(element){
          //   element.orderDate = timezoneConversions.toIST(element.orderDate);
          //   element.confirmByDate = timezoneConversions.toIST(element.confirmByDate);
          //   element.minDeliveryDate = timezoneConversions.toIST(element.minDeliveryDate);
          //   element.maxDeliveryDate = timezoneConversions.toIST(element.maxDeliveryDate);
          // });
          resJson = {
            "http_code" : "200",
            "message" : {"orderEntity": order }
  				};
  				logger.debug(TAG + " Order retrieved sucessfully for seller: " + sellerId );
  				callback(false,resJson);
        } else {
          resJson = {
            "http_code" : "404",
            "message" : "Order not found for sellerId : "
  				};
  				logger.error(TAG + " No Order found for seller: " + sellerId );
  				callback(true, resJson);
        }

      }
		});
	}
	else
	{
		resJson = {
      "http_code" : "400",
      "message" : "Bad or ill-formed request. Query param sellerID missing."
		};
		logger.error(TAG + " Invalid inputs - "+ JSON.stringify(req.body));
		callback(true, resJson);
	}
};
