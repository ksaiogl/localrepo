//File that contains buisness logic for order API.
var TAG = "listOrders- ";

var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var decimalConv = require('../helpers/numberConversions.js');
var decryption = require('../helpers/encryptDecryptFunction.js');
var async = require('async');

exports.listOrders = function(req, callback){
	//Variable for Mongo DB Connection.
	var db = dbConfig.mongoDbConn;
	//Variable for Logging the messages to the file.
	var logger = log.logger_sup;
	//Log the request.

	var resJson;
	var finalJsonResult = {};

	logger.debug(TAG + " ------ Request recieved for listOrders. ------");
	logger.debug(TAG + "req.body :-" + JSON.stringify(req.body));
	//Validate the Input parameters.
	if( !(req.body === undefined || req.body.sellerId === undefined || req.body.sellerId === null ||
		req.body.orderNumber === undefined || req.body.orderNumber === null ||
		req.body.orderDisplayStatus === undefined || req.body.orderDisplayStatus === null ) ){

		var orderDisplayStatus;
		var sellerOrderStatus;
		// Map the Display Order Status with the Line Item Status.
		var ordersColl = db.collection('Orders');
		if (req.body.orderDisplayStatus === "Cancelled")
		{
			orderDisplayStatus = [req.body.orderDisplayStatus];	// Status are same.
			sellerOrderStatus = [req.body.orderDisplayStatus];
		}
		else if(req.body.orderDisplayStatus === "Delivered")
		{
			orderDisplayStatus = [req.body.orderDisplayStatus];	// Status are same.
			sellerOrderStatus = ["Delivered", "Partially delivered"];
		}
		else if(req.body.orderDisplayStatus === "New")
		{
			orderDisplayStatus = ["Confirmed"];
			sellerOrderStatus = ["Confirmed"];
		}
		else if (req.body.orderDisplayStatus === "In Progress")
		{
			orderDisplayStatus = ["Accepted", "Ready To Ship", "Shipped", "Delivered"];
			sellerOrderStatus = ["Accepted", "Partially Accepted", "Ready To Ship", "Ready to Ship - Partial", "Shipped", "Partially Shipped"];// To Omit Orders if the whole Order is Delivered.
		}
		else
		{
			logger.error(TAG + "Invalid orderDisplayStatus:" + req.body.orderDisplayStatus);
			resJson = {
					    "http_code" : "500",
						"message" : "Invalid orderDisplayStatus:" + req.body.orderDisplayStatus
				};
			return callback(true, resJson);
		}
		logger.debug(TAG + "orderDisplayStatus mapped :-" + orderDisplayStatus);

		var query = [
						{ $match : { "orderEntity.orderInfo.orderNumber": req.body.orderNumber}},
						{ $unwind : "$orderEntity.orderInfo.sellerInfo" },
						{ $unwind : "$orderEntity.financials.seller" },
						{ $unwind : "$orderEntity.orderInfo.sellerInfo.orderItemInfo"},
						{ $match : { "orderEntity.orderInfo.sellerInfo.sellerId": req.body.sellerId,
									 "orderEntity.financials.seller.sellerId": req.body.sellerId
									}}
					];

		query.push({ $match: {"orderEntity.orderInfo.sellerInfo.orderItemInfo.itemStatus": {$in : orderDisplayStatus}}});

		// Only if querying for Delivered, Query sellerOrderStatus.
		if(req.body.orderDisplayStatus === 'Delivered' || req.body.orderDisplayStatus === "In Progress"){
			query.push({ $match: {"orderEntity.orderInfo.sellerInfo.sellerOrderStatus": {$in : sellerOrderStatus}}});
		};

		// Fields to be retrieved from the DB.
		var fields = {"_id": 0,
					 "orderEntity.orderInfo.orderNumber":1,
					 "orderEntity.orderInfo.orderDate":1,
					 "orderEntity.orderInfo.orderPlatform":1,
					 "orderEntity.orderInfo.orderType":1,
					 "orderEntity.orderInfo.creditDays":1,
					 "orderEntity.orderInfo.orderDeliveryAddress":1,
					 "orderEntity.financials.seller.sellerTotal":1,
					 "orderEntity.financials.seller.sellerTotal_A":1,
					 "orderEntity.financials.seller.sellerFinancial.netPayableToSeller":1,
 					 "orderEntity.orderInfo.sellerInfo.pod": 1,
					 "orderEntity.orderInfo.sellerInfo.orderItemInfo.productName":1,
					 "orderEntity.orderInfo.sellerInfo.orderItemInfo.SKUId":1,
 					 "orderEntity.orderInfo.sellerInfo.orderItemInfo.SKUImage":1,
 					 "orderEntity.orderInfo.sellerInfo.orderItemInfo.itemStatus":1,
 					 "orderEntity.orderInfo.sellerInfo.orderItemInfo.minDeliveryDate":1,
					 "orderEntity.orderInfo.sellerInfo.orderItemInfo.deliveredOn":1,
 					 "orderEntity.orderInfo.sellerInfo.orderItemInfo.price":1,
 					 "orderEntity.orderInfo.sellerInfo.orderItemInfo.priceUnit":1,
 					 "orderEntity.orderInfo.sellerInfo.orderItemInfo.quantity":1,
 					 "orderEntity.orderInfo.sellerInfo.orderItemInfo.quantityUnit":1,
 					 "orderEntity.orderInfo.sellerInfo.orderItemInfo.total":1,
 					 "orderEntity.orderInfo.sellerInfo.orderItemInfo.shippedBySeller" :1,
 					 "orderEntity.orderInfo.sellerInfo.orderItemInfo.threePLName" :1,
 					 "orderEntity.orderInfo.orderTotals": 1,
 					 "orderEntity.orderInfo.orderTotals_A": 1
					 };
		query.push({"$project":fields});
		logger.debug(TAG + "Order List query :" + JSON.stringify(query));
		ordersColl.aggregate(query , function(error, orderResult){

			if(!error && orderResult.length > 0)
			{
				try
				{
					// get Orderlevel fields from the OrderResult.
					var orderDate = orderResult[0].orderEntity.orderInfo.orderDate; // Taking the first array element, as all array item will have the same values for an OrderNumber.
					var orderPlatform = orderResult[0].orderEntity.orderInfo.orderPlatform; // Taking the first array element, as all array item will have the same values for an orderPlatform.
					var orderType = null;
					if (!(orderResult[0].orderEntity.orderInfo.orderType === undefined))
					{
						orderType = orderResult[0].orderEntity.orderInfo.orderType;
					}
					var creditDays = null;
					if (!(orderResult[0].orderEntity.orderInfo.creditDays === undefined))
					{
						creditDays = orderResult[0].orderEntity.orderInfo.creditDays;
					}	
					var orderDeliveryAddress = orderResult[0].orderEntity.orderInfo.orderDeliveryAddress;
					var netPayableToSeller = orderResult[0].orderEntity.financials.seller.sellerFinancial.netPayableToSeller;
					// get seller level fields from OrderResult.
					var sellerInfo = orderResult[0].orderEntity.orderInfo.sellerInfo;
					var pod = sellerInfo.pod;
					// if Amended Block exist, consider it, else take the original block.
					if(orderResult[0].orderEntity.orderInfo.orderTotals_A === undefined)
					{
						var orderTotals = orderResult[0].orderEntity.orderInfo.orderTotals;
					}
					else
					{
						var orderTotals = orderResult[0].orderEntity.orderInfo.orderTotals_A;
					};
					// if Amended Block exist, consider it, else take the original block.
					if(orderResult[0].orderEntity.financials.seller.sellerTotal_A === undefined)
					{
						var shippingAndHandlingCost = orderResult[0].orderEntity.financials.seller.sellerTotal.shippingAndHandlingCharges;
					}
					else
					{
						var shippingAndHandlingCost = orderResult[0].orderEntity.financials.seller.sellerTotal_A.shippingAndHandlingCharges;
					};

					if (req.body.orderDisplayStatus === "Cancelled")
					{
						var shippingAndHandlingCost = 0;
					}

					logger.debug(TAG + "Result Retrived for the List Query:" + orderResult);
					//Get All line items in an array and orderTotal of the lineitems by passing the orderResult from the previous query.
					getLineItems(orderResult, function(err, lineItems){
						if(!err)
						{
							// Get the Order date and incriment the date by 1 Day.
					        var ConfirmByDate = new Date(orderDate);
					        var incrimentedDate = ConfirmByDate.getDate() + 1;
							ConfirmByDate.setDate(incrimentedDate);

							if(orderTotals.customerGatewayChargesBasis === "Percentage")
							{
								//var PenalityforOrderCancellation = decimalConv.get2Decimalpoint((totalValue * orderTotals.customerGatewayCharges)/100);
								var PenalityforOrderCancellation = 0;
							}
							/*else if (orderTotals.customerGatewayChargesBasis === "Value")
							{
								var PenalityforOrderCancellation = orderTotals.customerGatewayCharges;
							}*/
							else
							{
								var PenalityforOrderCancellation = 0;
							}
							// To encrypt the PAN and TIN
							for(var k = 0; k < orderDeliveryAddress.length; k++)
							{
								if(!(orderDeliveryAddress[k].PAN === undefined || orderDeliveryAddress[k].TIN === undefined))
								{
									var PAN = orderDeliveryAddress[k].PAN;
									var TIN = orderDeliveryAddress[k].TIN;
									encryptKeys(PAN, TIN, function(err, encryptedResult){
										if(!err && encryptedResult != null)
										{
											orderDeliveryAddress[k].PAN = encryptedResult.PAN;
											orderDeliveryAddress[k].TIN = encryptedResult.TIN;
											logger.debug(TAG + " PAN and TIN Encrypted successfully");
										}
										else
										{
											logger.debug(TAG + " Error encrypting PAN and TIN, error: "+ err);
										}
									});
								}
							}

							finalJsonResult ={"orderEntity": {
												"orderNumber": req.body.orderNumber,
												"orderPlatform": orderPlatform,
												"orderType": orderType,
												"creditDays": creditDays,
												"orderDate": orderDate,
												"ConfirmByDate": ConfirmByDate,
												"orderTotal": lineItems.orderTotal,
												"PenalityforOrderCancellation":PenalityforOrderCancellation,
												"netPayableToSeller" : netPayableToSeller,
												"orderDeliveryAddress" : orderDeliveryAddress,
												"shippingAndHandlingCost" : shippingAndHandlingCost,
												"pod" : pod,
												"orderItemInfo": lineItems.lineItemsArray
											   }};
							logger.debug(TAG + "finalJsonResult sent for the Order List request:" + finalJsonResult);
							resJson = {
								    	"http_code" : "200",
										"message" : finalJsonResult
							};

							//updating orderAcknowledged field of particualr order number and sellerid to true.
			 				ordersColl.update({"orderEntity.orderInfo.orderNumber": req.body.orderNumber,
								"orderEntity.orderInfo.sellerInfo": {$elemMatch: {"sellerId": req.body.sellerId}}},
								{ $set: {"orderEntity.orderInfo.sellerInfo.$.orderAcknowledged": true}},  function(error, result){

								try{
									result = JSON.parse(result);
								}
								catch(e) {
							    	console.log(TAG + "Exception in parse listOrders:  "+ e);
							    	logger.error(TAG + "Exception in parse listOrders:- error :" + e);
							    	resJson = {
											    "http_code" : "500",
												"message" : "Internal Server Error.."
											};
							    	return callback(true,resJson);
							  	}

							  	if(error)
							  	{
							  		logger.error(TAG + "Error in updating orderAcknowledged field in order collection for orderNumber: " + req.body.orderNumber + ", sellerid : " +req.body.sellerId);
							  	}
							  	else if(result.n < 1)
							  	{
							  		logger.debug(TAG + "Cannot update orderAcknowledged field in order collection for orderNumber " + req.body.orderNumber + ", sellerid : " +req.body.sellerId);
							  	}
							});

							//updating read flag for Order in SupplierNotification.
							var supplierNotificationsCol = db.collection('SupplierNotifications');
			 				supplierNotificationsCol.update({"notificationsInfo.sellerId": req.body.sellerId,
								"notificationsInfo.notifications": {$elemMatch: {"orderNumber": req.body.orderNumber}}},
								{ $set: {"notificationsInfo.notifications.$.read": true}},  function(error, result){
							  	if(error)
							  	{
							  		logger.error(TAG + "Error in updating SupplierNotifications for orderNumber: " + req.body.orderNumber + ", sellerid : " +req.body.sellerId);
							  	}
							  	else
							  	{
							  		logger.debug(TAG + "Updated SupplierNotifications field for orderNumber " + req.body.orderNumber + ", sellerid : " +req.body.sellerId);
							  	}
							});

							logger.debug(TAG + "----------Order retrieved successfully----------");
							return callback(false, resJson);
						}
						else
						{
							logger.error(TAG + "Error retrieving order for SellerId:" + req.body.sellerId + " err: " + err);
							resJson = {
									    "http_code" : "500",
										"message" : "Internal Server Error.."
									};
							return callback(true, resJson);
						}
					});
				}
			  	catch(e)
			  	{
			    	console.log(TAG + "Exception in listOrders:  "+ e);
			    	logger.error(TAG + "Exception in listOrders:- error :" + e);
			    	resJson = {
							    "http_code" : "500",
								"message" : "Internal Server Error.."
							};
					return callback(true, resJson);
			  	}
			}
			else if(!error && orderResult.length < 1)
			{
				resJson = {
					    "http_code" : "500",
						"message" : "No Orders found."
				};
				logger.error(TAG + "No Orders found for SellerId:" + req.body.sellerId);
				return callback(true, resJson);
			}
			else
			{
				resJson = {
					    "http_code" : "500",
						"message" : "Seller Orders cannot be retrieved. Please retry.."
				};
				logger.error(TAG + "Error retrieving order for SellerId:" + req.body.sellerId + " err: " + error);
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
};

function getLineItems(orderResult, callback){

	var logger = log.logger_sup;
	try
	{
		var orderTotal = 0;
		var orderItemInfo = [];
		//for each Order Item from aggregate function.
		for(var i=0; i<orderResult.length; i++)
		{
			var threePLLevel = {"shippedBySeller":"","threePLName":"","orderItem":[]};
			var singleLineItem = orderResult[i];
			var lineItem = singleLineItem.orderEntity.orderInfo.sellerInfo.orderItemInfo;
			var totalValue = lineItem.total;
			orderTotal = orderTotal + totalValue;
			lineItem["totalValue"] = totalValue;
			// build a temp object based on shippedBySeller is true or false.
			if(lineItem.shippedBySeller === true)
			{
				threePLLevel.shippedBySeller = true;
				threePLLevel.threePLName = null;
				//delete unwanted fields
				delete lineItem.total;
				delete lineItem.shippedBySeller;
				//delete lineItem.threePLName;
				threePLLevel.orderItem.push(lineItem);
			}
			else
			{
				threePLLevel.shippedBySeller = false;
				threePLLevel.threePLName = lineItem.threePLName;
				//delete unwanted fields
				delete lineItem.total;
				delete lineItem.shippedBySeller;
				//delete lineItem.threePLName;
				threePLLevel.orderItem.push(lineItem);
			}
			// for the first iteration, orderItemInfo will be blank array, so directly push the threePLLevel result to the array
			if(orderItemInfo.length > 0)
			{
				//if orderItemInfo array has already values, then see if it matches,
				//On matching add to the existing orderItem array else push threePLLevel object
				var orderItemInfoPushFalg = false;
				for(var j=0; j<orderItemInfo.length; j++)
				{
					if(orderItemInfo[j].shippedBySeller === threePLLevel.shippedBySeller &&
					   orderItemInfo[j].threePLName === threePLLevel.threePLName )
					{
						orderItemInfo[j].orderItem.push(threePLLevel.orderItem[0]);
						orderItemInfoPushFalg = true;
					}
				}
				// If there was no matching Item in the Existing Array, Then push the entire threePLLevel object into the array
				if(orderItemInfoPushFalg === false)
				{
					orderItemInfo.push(threePLLevel);
				}
			}
			else
			{
				//For the first iteration. directly push the object.
				orderItemInfo.push(threePLLevel);
			}
		};
		var lineItems = { "orderTotal": orderTotal, "lineItemsArray" : orderItemInfo};
		logger.debug(TAG + "Order lineItemsArray processed successfully: " + JSON.stringify(lineItems));
		return callback(false, lineItems);
	}
	catch(e)
  	{
    	console.log(TAG + "Exception in listOrders - getLineItems:  " + e);
    	logger.error(TAG + "Exception in listOrders - getLineItems :- error :" + e);
		return callback(true, null);
  	}
}

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
    	console.log(TAG + "Exception in listOrders - encryptKeys:  " + e);
    	logger.error(TAG + "Exception in listOrders - encryptKeys :- error :" + e);
		return callback(true, null);
  	}
}
