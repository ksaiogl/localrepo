//This file will give the summary of orders related to particular seller.
var TAG = "--- View Supplier Order List---    ";

var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var timezoneConversions = require('../helpers/timezoneConversions.js');

//Function that will list order related to particular seller.
exports.viewSupplierOrderList = function(req, callback){
	var db = dbConfig.mongoDbConn;
	var logger = log.logger_crm;
	var resJson;

  logger.info(TAG + "Request received for view supplier order list. REQ : " + req.url);

	if (req.query.sellerID)
	{
    var sellerId = req.query.sellerID;

    var query = [
      { $unwind : "$orderEntity.orderInfo.sellerInfo" },
			{ $match: {	"orderEntity.orderInfo.sellerInfo.sellerId": sellerId }},
			{ $unwind : "$orderEntity.financials.seller" },
			{ $match: {	"orderEntity.financials.seller.sellerId": sellerId }},
			{ $unwind : "$orderEntity.orderInfo.sellerInfo.orderItemInfo" },
      {
        $group: {
          _id: "$orderEntity.orderInfo.orderNumber",
          orderDate: {$first: "$orderEntity.orderInfo.orderDate"},
          confirmByDate: {$first : {$add: ["$orderEntity.orderInfo.orderDate", 1*24*60*60000]}},		//adding one day to orderDate.
          paymentMethod:{$first:"$orderEntity.paymentInfo.paymentMode"},
          orderTotal: {$first: "$orderEntity.financials.seller.sellerTotal.total"},
          orderAcknowledged: {$first : "$orderEntity.orderInfo.sellerInfo.orderAcknowledged"},
          lastUpdatedOn: {$first: "$orderEntity.orderInfo.sellerInfo.orderItemInfo.lastUpdatedOn"},
          orderLineItems: {$sum: 1},
          minDeliveryDate: {$min: "$orderEntity.orderInfo.sellerInfo.orderItemInfo.minDeliveryDate"},
          maxDeliveryDate: {$max: "$orderEntity.orderInfo.sellerInfo.orderItemInfo.maxDeliveryDate"},
          sellerOrderStatus: {$first: "$orderEntity.orderInfo.sellerInfo.sellerOrderStatus"},
          deliveredOn: {$first: "$orderEntity.orderInfo.sellerInfo.deliveredOn"},
          cancelledOn: {$first: "$orderEntity.orderInfo.sellerInfo.cancelledOn"},
					customerInfo: {$first: "$orderEntity.orderInfo.customerInfo"},
        }
      },
      {$sort : {"orderEntity.orderInfo.orderNumber": -1}}
    ];

		var ordersColl = db.collection('Orders');
		// console.log(TAG + "Order Summary Query: " + JSON.stringify(query));
		ordersColl.aggregate(query, function(error, result){
      if (error) {
        resJson = {
          "http_code" : "500",
          "message" : "Seller Order Summary cannot be retrieved. Please contact engineering team."
				};
        // console.log(error.stack);
				logger.error(TAG + " Error- Getting order summary for the seller: " + sellerId + ", Error: \n" + error.stack);
				callback(true, resJson);
      } else {
        if (result.length) {
          result.forEach(function(element){
            element.orderDate = timezoneConversions.toIST(element.orderDate);
            element.confirmByDate = timezoneConversions.toIST(element.confirmByDate);
            element.minDeliveryDate = timezoneConversions.toIST(element.minDeliveryDate);
            element.maxDeliveryDate = timezoneConversions.toIST(element.maxDeliveryDate);
          });
          resJson = {
            "http_code" : "200",
            "message" : {"orderEntity": result }
  				};
  				logger.debug(TAG + " Summary of order retrieved sucessfully for seller: " + sellerId );
  				callback(false,resJson);
        } else {
          resJson = {
            "http_code" : "404",
            "message" : "No Orders found."
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
