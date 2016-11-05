//File that contains buisness logic for updating status of order.
var TAG = "updateOrder- ";

var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var async = require('async');
var underscore = require('underscore');
var request = require("request");
var supNotifications = require('./supplierNotifications.js');
var cusNotifications = require('../customer/customerNotifications.js');
var host_detail = require('../../Environment/hostDetails.js');
var orderEvent = require('../oms/orderEvents').orderEvents;
var orderFootprint = require('../oms/orderFootprint');

//Function that will update status of line item with respecte to orderid, sellerid, skuid.
exports.updateOrders = function(req, callback){
	var db = dbConfig.mongoDbConn;
	var logger = log.logger_sup;
	var resJson;
	var finalOrderStatus;
	var cancelledLineItems = {skuidList: []};
	var otherLineItems = {skuidList: []};
	var orderResult;

	logger.info("++++++++++ " + TAG + " Request received for Update Order. +++++++++ ");
	logger.debug(TAG + "req.body :-" + JSON.stringify(req.body));
	async.series([
		//Function to validate the input fields.
		function(asyncCallback){

			validateInput(req, function(error){
				if(error){
					resJson = {
					    "http_code" : "400",
						"message" : "Bad or ill-formed request.."
					};
					logger.error(TAG + " Invalid input recieved for Supplier Order Updation. Inputs are as below: ");
					logger.error(TAG + req);
					return asyncCallback(true);
				}
				else{
					logger.debug(TAG + " Inputs for Order Updation are valid, moving forward");
					return asyncCallback();
				}
			});
		},
		//Function to check weather status update request received for already cancelled items.
		function(asyncCallback){

			getCurrentLineItemStatus(req, function(error, result){
				if(error){
					resJson = {
					    "http_code" : "500",
						"message" : "Error - Updation Failed. Please try again."
					};
					logger.error(TAG + " Failed to get current LineItems status to verify status validation, error: " + error);

					return asyncCallback(true);
				}
				else
				{
					logger.debug(TAG + " Checking status update request for already cancelled line items ok, moving forward");
					cancelledLineItems.skuidList = result.cancelledLineItems.skuidList;
					otherLineItems.skuidList = result.otherLineItems.skuidList;
					return asyncCallback();
				}
			});
		},
		//Function to check weather status update request received for already cancelled items.
		function(asyncCallback){

			validateItemStatus(req, cancelledLineItems, otherLineItems, function(error, result){
				if(error){
					resJson = {
					    "http_code" : "500",
						"message" : result
					};
					logger.error(TAG + "Validation Failed - ItemStatus to be updated doesnt compile with the business rules , error: " + result);
					return asyncCallback(true);
				}
				else{
					logger.debug(TAG + "ItemStatus Validation Successfull, moving forward");
					return asyncCallback();
				}
			});
		},
		//Function to update OrderFinace and SellerFinance on Cancellation of Order.
		function(asyncCallback){

			updateFincanceOnCancellation(req, function(error, result){
				if(error)
				{
					resJson = {
					    "http_code" : "500",
						"message" : "Error - Update Order Failed. Please try again."
					};
					logger.error(TAG + "Update of Order Finance details Failed");
					return asyncCallback(true);
				}
				else
				{
					logger.debug(TAG + " Order Finance details calculated successfully, moving forward");
					orderResult = result;
					return asyncCallback();
				}
			});
		},
		//Function to update status of line items.
		function(asyncCallback){

			updateLineItems(req, orderResult, function(error){
				if(error){
					logger.error(TAG + " Line Items Updation Failed. " + error);
					return asyncCallback(true);
				}
				else{
					logger.debug(TAG + " All Line items updated successfully, moving forward");
					return asyncCallback();
				}
			});
		},
		//Function to get order status of lineitems.
		function(asyncCallback){
			getStatus(req.body.orderNumber, req.body.sellerId, function(error, result){
				if(error){
					resJson = {
					    "http_code" : "500",
						"message" : "Error - Updation Failed. Please try again."
					};
					logger.error(TAG + " Calculating order status Failed. error:" + error);
					return asyncCallback(true);
				}
				else{
					finalOrderStatus = result.orderStatus;
					finalSellerOrderStatus = result.sellerOrderStatus;
					logger.debug(TAG + " Order Status calculated successfully, moving forward");
					return asyncCallback();
				}
			});
		},
		//Function to update main order status.
		function(asyncCallback){
			updateOrderStatus(req.body.orderNumber, req.body.sellerId, finalOrderStatus, finalSellerOrderStatus, function(error, result){
				if(error){
					resJson = {
					    "http_code" : "500",
						"message" : "Error - Updation Failed. Please try again."
					};
					logger.error(TAG + "Error - Updating Order status Failed");
					return asyncCallback(true);
				}
				else{
					logger.debug(TAG + " Order Status updated successfully, moving forward");
					return asyncCallback();
				}
			});
		},
		//Function to take backup of existing lineitems and stores it in OrderHistory collection.
		function(asyncCallback){

			backupLineItems(req, function(error, result){
				if(error){
					resJson = {
					    "http_code" : "500",
						"message" : "Error - Updation Failed. Please try again."
					};
					logger.error(TAG + " Taking Line items Backup Failed.");
					return asyncCallback(true);
				}
				else{
					logger.debug(TAG + " Backup taken successfully, moving forward");
					return asyncCallback();
				}
			});
		}
	],
	//Final function that will be called by functions defined in series.
	function(error){
		if(!error){
			resJson = {
					    "http_code" : "200",
						"message" : "Updation successfull."
			};
			logger.debug(TAG + " Order Updation successfull.");
			orderFootprint.addOrderEvent(orderEvent.ORDER_UPDATION, req.body.orderNumber, req);
			return callback(false, resJson);
		}
		logger.error(TAG + " Order Updation not successfull.");
		return callback(true, resJson);
	});
};


//Function that will validate the input fields.
function validateInput(req, callback){
	//valid line item status.
	var lineItemStatus = ['Confirmed', 'Accepted', 'Ready To Ship', 'Shipped', 'Delivered', 'Cancelled'];
	if( !( req.body === undefined || req.body.sellerId === undefined || req.body.sellerId.toString().trim().length === 0 ||
		  req.body.orderNumber === undefined || req.body.orderNumber.toString().trim().length === 0 ||
		  req.body.updateOrderItem === undefined || req.body.updateOrderItem.length === 0) ){

		//checking for incoming line item status, which are not valid.
  		for(var i = 0; i < req.body.updateOrderItem.length; i++)
  		{
  			if(underscore.indexOf(lineItemStatus, req.body.updateOrderItem[i].status) === -1)
  			{
  				return callback(true);
  			}
  		}
		return callback();
	}
	else
	{
		return callback(true);
	}
}
//Function that will validate the input fields.
function getCurrentLineItemStatus(req, callback){
	var db = dbConfig.mongoDbConn;
	var logger = log.logger_sup;
	var skuids = [];
	//object that stores line items that are already cancelled, but got request to update there status.
	var cancelledLineItems = {skuidList: []};
	var otherLineItems = {skuidList: []};

	for(var i = 0; i < req.body.updateOrderItem.length; i++){
		skuids.push(req.body.updateOrderItem[i].skuid);
	}

	var ordersColl = db.collection('Orders');

	var fields = {"_id": 0,
				"orderEntity.orderInfo.sellerInfo.sellerId":1,
				"orderEntity.orderInfo.sellerInfo.orderItemInfo":1
			};

	ordersColl.aggregate(
			  { $unwind : "$orderEntity.orderInfo.sellerInfo" },
			  { $unwind : "$orderEntity.orderInfo.sellerInfo.orderItemInfo" },
			  { $unwind : "$orderEntity.financials.seller" },
			  { $match : {
			     "orderEntity.orderInfo.orderNumber": req.body.orderNumber,
			     "orderEntity.orderInfo.sellerInfo.sellerId": req.body.sellerId,
			     "orderEntity.orderInfo.sellerInfo.orderItemInfo.SKUId" : {$in: skuids},
			     "orderEntity.financials.seller.sellerId": req.body.sellerId}},
			    {"$project": fields}, function(error, result){
					if(error)
					{
						logger.error(TAG + " fetching lineitems to check 'cancelled line items' failed for order no: "+req.body.orderNumber+", sellerID: "+req.body.sellerId+" and skuids: "+skuids+" Error:" + error);
						return callback(true);
					}
					else if(!error && result.length > 0)
					{
						var currentItemStatus = {};
						for(var i = 0; i < result.length; i++)
						{
							//checking the status of line item. If cancelled, store that into cancelledLineItems.
							if(result[i].orderEntity.orderInfo.sellerInfo.orderItemInfo.itemStatus === 'Cancelled')
							{
								cancelledLineItems.skuidList.push(result[i].orderEntity.orderInfo.sellerInfo.orderItemInfo.SKUId);
								logger.debug(TAG + " Cant update status of skuid: "+result[i].orderEntity.orderInfo.sellerInfo.orderItemInfo.SKUId+", since its status is already updated to Cancelled.");
							}
							else
							{
								var itemStatus = {"SKUId": result[i].orderEntity.orderInfo.sellerInfo.orderItemInfo.SKUId,
												  "itemStatus":result[i].orderEntity.orderInfo.sellerInfo.orderItemInfo.itemStatus};
								otherLineItems.skuidList.push(itemStatus);
							}
						}
						// cancelledLineItems to validate if there was a Item which was already cancelled.
						// otherLineItems to validate if the current Item status is higher that requested itemstatus for update.
						currentItemStatus = {"cancelledLineItems": cancelledLineItems,
											 "otherLineItems" : otherLineItems};
						return callback(false, currentItemStatus);
					}
					else if(!error && result.length === 0)
					{
						logger.error(TAG + " fetching lineitems to check cancelled line items failed, No mathcing records found for order no: "+req.body.orderNumber+", sellerID: "+req.body.sellerId+" and skuids: "+skuids);
						return callback(true);
					}
				}
			);
}

//Function that will make a back up of updated line items.
function backupLineItems(req, callback){
	var db = dbConfig.mongoDbConn;
	var logger = log.logger_sup;
	var skuids = [];

	for(var i = 0; i < req.body.updateOrderItem.length; i++){
		skuids.push(req.body.updateOrderItem[i].skuid);
	}

	var ordersColl = db.collection('Orders');
	var ordersBackupCol = db.collection('OrdersHistory');
	//Query to get line items data to store in OrdersHistory collection, before updating.
	var fields = {"_id": 0,
					"orderEntity.orderInfo.orderNumber":1,
					"orderEntity.orderInfo.orderDate":1,
					"orderEntity.orderInfo.orderStatus":1,
					"orderEntity.orderInfo.reasonForCancellation":1,
					"orderEntity.orderInfo.orderDeliveryAddress":1,
					"orderEntity.paymentInfo":1,
					"orderEntity.orderInfo.sellerInfo.sellerId":1,
					"orderEntity.financials.seller.sellerTotal.shippingAndHandlingCharges":1,
					"orderEntity.orderInfo.sellerInfo.orderItemInfo.productName":1,
					"orderEntity.orderInfo.sellerInfo.orderItemInfo.SKUId":1,
					"orderEntity.orderInfo.sellerInfo.orderItemInfo.SKUImage":1,
					"orderEntity.orderInfo.sellerInfo.orderItemInfo.itemStatus":1,
					"orderEntity.orderInfo.sellerInfo.orderItemInfo.reasonForCancellation":1,
					"orderEntity.orderInfo.sellerInfo.orderItemInfo.cancelledBy":1,
					"orderEntity.orderInfo.sellerInfo.orderItemInfo.minDeliveryDate":1,
					"orderEntity.orderInfo.sellerInfo.orderItemInfo.maxDeliveryDate":1,
					"orderEntity.orderInfo.sellerInfo.orderItemInfo.total":1,
					"orderEntity.orderInfo.sellerInfo.orderItemInfo.shippedBySeller":1,
					"orderEntity.orderInfo.sellerInfo.orderItemInfo.courierName":1,
					"orderEntity.orderInfo.sellerInfo.orderItemInfo.shipmentNo":1,
					"orderEntity.orderInfo.sellerInfo.orderItemInfo.threePLName":1
			};

	ordersColl.aggregate(
	  { $unwind : "$orderEntity.orderInfo.sellerInfo" },
	  { $unwind : "$orderEntity.financials.seller" },
	  { $unwind : "$orderEntity.orderInfo.sellerInfo.orderItemInfo" },
	  { $match : {
	     "orderEntity.orderInfo.orderNumber": req.body.orderNumber,
	     "orderEntity.orderInfo.sellerInfo.sellerId": req.body.sellerId,
	     "orderEntity.financials.seller.sellerId": req.body.sellerId,
	     "orderEntity.orderInfo.sellerInfo.orderItemInfo.SKUId" : {$in: skuids}}},
	    {"$project": fields}, function(error, result){
			if(error)
			{
				logger.error(TAG + " Fetching lineitems to store in OrderHistory collection Failed");
				return callback(true);
			}
			else if(!error && result.length > 0)
			{
				for(var i = 0; i < result.length; i++)
				{
					result[i].orderEntity.orderInfo['updatedOn'] = new Date();
					ordersBackupCol.insert(result[i], function(error, result){
						if(error)
						{
							logger.error(TAG + " storing lineitems to OrderHistory collection Failed");
							return callback(true);
						}
						else
						{
							logger.debug(TAG + " storing lineitems to orderHistory collection successfull.");
						}
					});
				}
				return callback(false);
			}
			else if(!error && result.length === 0)
			{
				logger.error(TAG + " Fetching lineitems to store in OrderHistory collection Failed, No mathcing records found.");
				return callback(true);
			}
		}
	);
}

//Function to validate the ItemStatus and Reject the Update if it doesnt compile with the business rules..
function validateItemStatus(req, cancelledLineItems, otherLineItems, callback){
	var db = dbConfig.mongoDbConn;
	var logger = log.logger_sup;
	// To check If there are any Cancelled Item Status for update
	var errorString = '';
	for(var i = 0; i < req.body.updateOrderItem.length; i++){
		if(underscore.indexOf(cancelledLineItems.skuidList, req.body.updateOrderItem[i].skuid) !== -1){
			errorString = cancelledLineItems.skuidList.join();
			logger.error(TAG + " Error - Cannot update Item status as skuid's: "+ errorString +" have already been cancelled");
			return callback(true, "Error - Cannot update Item status as skuid's: "+ errorString +" have already been cancelled.");
		}
	}
	// To validate that The Current Item status is not at a higher state thant the to be updated Item status.
	var StatusCode = {"Confirmed": 1,"Accepted": 2,
	"Ready To Ship": 3,"Shipped": 4, "Delivered": 5, "Cancelled": 6};
	var invalidItemStatusFlag = false;
	var detailedErrorString = '';
	// ItemStatus from Input of Update Order
	for(var i = 0; i < req.body.updateOrderItem.length; i++)
	{
		var updatedStatus = req.body.updateOrderItem[i].status;
		// ItemStatus from current OrderItemInfo
		for(var j = 0; j < otherLineItems.skuidList.length; j++)
		{
 			if(req.body.updateOrderItem[i].skuid === otherLineItems.skuidList[j].SKUId)
 			{
	 			var currentStatus = otherLineItems.skuidList[j].itemStatus;
				if (StatusCode[currentStatus] > StatusCode[updatedStatus]){
					invalidItemStatusFlag = true;
					errorString = errorString + otherLineItems.skuidList[j].SKUId+", ";
					detailedErrorString = detailedErrorString + otherLineItems.skuidList[j].SKUId+"(From '"+currentStatus+"' To '"+updatedStatus+"' status)"+", ";
				}
			}
		}
	}
	if(invalidItemStatusFlag === true)
	{
		logger.error(TAG + " Error updating Item status, as skuid's: "+ errorString +" have already been updated to a higher status. Cannot update skuid's:"+detailedErrorString);
		return callback(true, " Error updating Item status, as skuid's: "+ errorString +" have already been updated to a higher status. Cannot update skuid's:"+detailedErrorString);
	}
	else
	{
		logger.debug(TAG + " Item Status successfully validated");
		return callback(false, null);
	}
}

//Function that will update line items.
function updateLineItems(req, orderResult, callback){
	var db = dbConfig.mongoDbConn;
	var logger = log.logger_sup;
	var updateDocument = {};
	var ordersColl = db.collection('Orders');
	var supplierColl = db.collection('Supplier');

	var cancelledOrders = [];		//array that contains all cancelled line items.
	var shippedOrders = [];			//array that contains all shipped line items.
	var deliveredOrders = [];		//array that contains all delivered line items.
	var readyToshipOrders = [];		//array that contains all ready to ship line items.
	var orderitemInfo;
	// Get orderitemInfo for the required SellerID.
	var sellerInfoArray = orderResult.orderEntity.orderInfo.sellerInfo;
	for(var j = 0; j < sellerInfoArray.length; j++)
	{
		if(sellerInfoArray[j].sellerId === req.body.sellerId)
		{
			orderitemInfo = sellerInfoArray[j].orderItemInfo;
		}
	};

	//Looping through each line item in the list and updating status.
	async.forEachSeries(req.body.updateOrderItem, function(OrderItem, asyncCallback)
	{
		for(var i = 0; i < orderitemInfo.length; i++)
		{
			if (OrderItem.skuid === orderitemInfo[i].SKUId)
			{
				//Updating reasonOfRejection, if reasonOfRejection is non empty.
				if(OrderItem.reasonOfRejection.toString().trim().length > 0 )
					orderitemInfo[i].reasonForCancellation = OrderItem.reasonOfRejection;

				//Updating shipMedium, courierName, shipmentNo if any one of these are non empty.
				if(OrderItem.threePLName.toString().trim().length > 0 || OrderItem.shipmentNo.toString().trim().length > 0){
					//updateDocument["orderEntity.sellerInfo.$.orderItemInfo.$.shipMedium"] = OrderItem.shipMedium;
					orderitemInfo[i].courierName = OrderItem.threePLName; // Its actually courierName, but its passed as threePLName from UI.
					orderitemInfo[i].shipmentNo = OrderItem.shipmentNo;
				}

				if(OrderItem.status === "Delivered")
				{
					orderitemInfo[i].deliveredOn = new Date();
				}
				if(OrderItem.status === "Cancelled")
				{
					orderitemInfo[i].cancelledBy = "Supplier";
				}
					orderitemInfo[i].itemStatus = OrderItem.status;
					orderitemInfo[i].lastUpdatedOn = new Date();
			}
		}

		if(OrderItem.status === 'Cancelled')
		{
			cancelledOrders.push(OrderItem.skuid);//Adding cancelled line items to cancelledOrders array.
		}
		else if(OrderItem.status === 'Shipped')
		{
			shippedOrders.push(OrderItem.skuid);//Adding shipped line items to shippedOrders array.
		}
		else if(OrderItem.status === 'Delivered')
		{
			deliveredOrders.push(OrderItem.skuid);//Adding delivered line items to deliveredOrders array.
		}
		else if(OrderItem.status === 'Ready To Ship')
		{
			readyToshipOrders.push(OrderItem.skuid);//Adding ready to ship line items to readyToshipOrders array.
		}
		return asyncCallback();
		},
		 //Final Function to be called upon completion of all functions.
		function(error)
		{
		 	if(!error)
		 	{
			 	// Append the updated orderitemInfo back to the order store.
			 	var sellerInfoArray = orderResult.orderEntity.orderInfo.sellerInfo;
			 	for(var j = 0; j < sellerInfoArray.length; j++)
				{
					if(sellerInfoArray[j].sellerId === req.body.sellerId)
					{
						orderResult.orderEntity.orderInfo.sellerInfo[j].orderItemInfo = orderitemInfo;
						// update deliveredOn at seller level, if any of the line item is delivered.
						if(deliveredOrders.length > 0){
							orderResult.orderEntity.orderInfo.sellerInfo[j].deliveredOn = new Date();
						};
						// update cancelledOn at seller level, if any of the line item is Cancelled.
						if(cancelledOrders.length > 0){
							orderResult.orderEntity.orderInfo.sellerInfo[j].cancelledOn = new Date();
						};
					}
				};

				//update the order store, which matches with order number.
				ordersColl.update({"orderEntity.orderInfo.orderNumber": req.body.orderNumber},
					{$set: {"orderEntity.financials.seller": orderResult.orderEntity.financials.seller,
						"orderEntity.orderInfo": orderResult.orderEntity.orderInfo,
					 	"orderEntity.financials.orderFinancials": orderResult.orderEntity.financials.orderFinancials}},function(error, result){
					try{
						result = JSON.parse(result);
					}
					catch(err){
						logger.error(TAG + " Exception - exception araised during parsing result - "+err);
						return asyncCallback(true);
					}

				  	if(error)
				  	{
				  		logger.error(TAG + " Error while updating Order - "+error);
				  		return asyncCallback(true);
				  	}
				  	else if(result.n < 1)
				  	{
				  		logger.error(TAG + " Record Not Found - Failed Updating line item status for ordernumber: "+req.body.orderNumber+", sellerid: "+req.body.sellerId+", skuid: "+OrderItem.skuid);
				  		return asyncCallback(true);
				  	}
					else
					{
				 		//Sending email, SMS for supplier and msupply support team if line item status is updated to Cancelled.
				 		if(cancelledOrders.length > 0){			//checking length of particular array. If array length is greater than 0, send particular notification.

					 		//Get particular object related to order number, seller id.
							ordersColl.aggregate([
						        { $match: { "orderEntity.orderInfo.orderNumber": req.body.orderNumber}},
						        { $unwind: "$orderEntity.orderInfo.sellerInfo"},
						        { $match: { "orderEntity.orderInfo.sellerInfo.sellerId": req.body.sellerId}},
							], function(error, result){
								if(!error && result.length > 0)
								{
									supNotifications.OrderCancellationEmail( result[0], cancelledOrders, req.body.orderLevelUpdation,
									function(err, result){

									});
									// To send email to customer on cancellation of the Order Line Item.
									cusNotifications.OrderCancellationEmail(req.body.orderNumber, cancelledOrders,
									function(err, result){

									});
								}
								else
								{
									logger.error(TAG + " Error - Fetching customer Details from orders collection, for orderNumber "+ req.body.orderNumber +" Failed");
								}
							});
				 		}
				 		//Sending email, SMS for supplier if line item status is updated to Ready To Ship.
				 		if(readyToshipOrders.length > 0){			//checking length of particular array. If array length is greater than 0, send particular notification.

					 		//Get particular object related to order number, seller id.
							ordersColl.aggregate([
						        { $match: { "orderEntity.orderInfo.orderNumber": req.body.orderNumber}},
						        { $unwind: "$orderEntity.orderInfo.sellerInfo"},
						        { $match: { "orderEntity.orderInfo.sellerInfo.sellerId": req.body.sellerId}},
							], function(error, result){
								if(!error && result.length > 0)
								{
									supNotifications.notifySupplierOnReadyToShip( result[0], readyToshipOrders,
									function(err, result){

									});

									supNotifications.notifyFulfillmentTeamOnReadyToShip( result[0], readyToshipOrders,
									function(err, result){

									});
								}
								else
								{
									logger.error(TAG + " Error - Fetching customer Details from orders collection, for orderNumber "+ req.body.orderNumber +" Failed");
								}
							});
				 		}
				 		//Sending email for supplier if line item status is updated to Shipped.
				 		if(shippedOrders.length > 0){

				 			//Get particular object related to order number, seller id.
							/*ordersColl.aggregate([
						        { $match: { "orderEntity.orderInfo.orderNumber": req.body.orderNumber}},
						        { $unwind: "$orderEntity.orderInfo.sellerInfo"},
						        { $match: { "orderEntity.orderInfo.sellerInfo.sellerId": req.body.sellerId}},
							], function(error, result){
								if(!error && result.length > 0)
								{
									supNotifications.notifySupplierOnOrderShippment( result, shippedOrders,
									function(err, result){

									});
								}
								else
								{
									logger.error(TAG + " Error - Fetching customer Details from orders collection, for orderNumber "+ req.body.orderNumber +" Failed");
								}
							});

				 			//Get email id and mobile number of customer to send notification.
							ordersColl.find({"orderEntity.orderInfo.orderNumber": req.body.orderNumber},{"orderEntity.orderInfo.customerInfo.firstName": 1, "orderEntity.orderInfo.customerInfo.emailId": 1, "orderEntity.orderInfo.customerInfo.mobile": 1})
							.toArray(function(error, result)
							{
								if(!error)
								{
									if(result.length > 0)
									{
										result[0].orderNumber = req.body.orderNumber;

										supNotifications.notifyCustomerOnOrderShippment( result[0], shippedOrders,
										function(err, result){

										});
									}
									else if(result.length === 0){
										logger.error(TAG + " Record Not Found - Fetching Customer Details from Orders collection, for ordernumber "+ req.body.orderNumber);
									}
								}
								else
								{
									logger.error(TAG + " Error - Fetching customer Details from orders collection, for orderNumber "+ req.body.orderNumber +" Failed");
								}
							});*/
				 		}
				 		//Sending email, sms for customer if line item staus is updated to Delivered.
				 		if(deliveredOrders.length > 0){
				 			// To send email to Customer Only on Whole Order is marked as Delivered. (Not to send email on each induvidual)
				 		}
				 		return callback();
					}
				});
		 	}
		 	else
		 	{
		 		return callback(true);
		 	}
		}
	);
}

//Function that will update Order Finance and Order Total on Order Cancellation.
function updateFincanceOnCancellation(req, callback){

	var db = dbConfig.mongoDbConn;
	var logger = log.logger_sup;
	var ordersColl = db.collection('Orders');
	try
	{
		//Verify if there is Cancelled Line Items.
		var CancelledOrder = false;
		var cancelledSKUIdList = [];
		for(var i = 0; i < req.body.updateOrderItem.length; i++)
		{
			if(req.body.updateOrderItem[i].status === "Cancelled")
			{
				CancelledOrder = true;
				cancelledSKUIdList.push(req.body.updateOrderItem[i].skuid);
			}
		};
		//Fetch Full Order store with All Sellers.
		ordersColl.findOne({"orderEntity.orderInfo.orderNumber": req.body.orderNumber}, function(error, orderResult){
			if(error || orderResult === null)
			{
				logger.error(TAG + " Failed fetching Order for orderNumber : "+req.body.orderNumber + "error: " + error);
				return callback(true, null);
			}
			else
			{
				//Update Finance Details, Only if the line item is cancelled.
				if(CancelledOrder === true)
				{
					// Assign penaltyCharges if it exists.
					if(req.body.penaltyCharges === undefined || req.body.penaltyCharges === null){
						penaltyCharges = 0;
					}else{
						penaltyCharges = req.body.penaltyCharges;
					};

					//get the customer shipping Pincode
					var orderDeliveryAddress = orderResult.orderEntity.orderInfo.orderDeliveryAddress;
					for(var k = 0; k < orderDeliveryAddress.length; k++)
					{
						if(orderDeliveryAddress[k].addressType === "Shipping")
						{
							var pincode = orderDeliveryAddress[k].pinCode;
						}
					};

					if(req.body.orderLevelUpdation === true)
					{
						logger.debug(TAG + "orderLevelUpdation starts for OrderNumber: "+req.body.orderNumber+", sellerid: "+req.body.sellerId);
						getupdatedFinanceDetailsOrderLevel(req, orderResult, penaltyCharges, pincode, function(err, kartFinanceResult){
							if(!err && kartFinanceResult !== null)
							{
								logger.debug(TAG + "updated Kart Finance Result (Order Level) obtained for OrderNumber: "+req.body.orderNumber+", sellerid: "+req.body.sellerId +"kartResult: " + kartFinanceResult);
								return callback(false, kartFinanceResult);
							}
							else
							{
								logger.error(TAG + "Error in getupdatedFinanceDetailsOrderLevel for OrderNumber: "+req.body.orderNumber+", sellerid: "+req.body.sellerId);
							    return callback(true, null);
							}
						});
					}
					else
					{
						logger.debug(TAG + "LineItemLevelUpdation starts for OrderNumber: "+req.body.orderNumber+", sellerid: "+req.body.sellerId);
						//Line Item Level Cancellation get kart Charges by passing all valid Line items for all seller.
						logger.debug(TAG + "Update Order received for cancellation at LineItemLevel for OrderNumber: "+req.body.orderNumber+", sellerid: "+req.body.sellerId);
						var sellerInfo = orderResult.orderEntity.orderInfo.sellerInfo;
						var orderTotals = orderResult.orderEntity.orderInfo.orderTotals;

						var kartArrayValues =  [];
						// get the Skuid,qty,price for non cancelled Order Item for All sellers.
						for(var i = 0; i < sellerInfo.length; i++)
						{
							var sellerID = sellerInfo[i].sellerId;
							var orderItemInfo = sellerInfo[i].orderItemInfo;
							for(var j = 0; j < orderItemInfo.length; j++)
							{
								// get the skuid's only for Non Cancelled Items from Order store.
								if(orderItemInfo[j].itemStatus !== "Cancelled" && orderItemInfo[j].price > 0){
									//Ignore the skuid's which will be cancelled in this request. cancelledSKUIdList has all cancelled Skus from Input.
									if(underscore.contains(cancelledSKUIdList, orderItemInfo[j].SKUId) === false)
									{
										var items = {"sellerId": sellerID,
													"sku" : orderItemInfo[j].SKUId,
													"qty" : orderItemInfo[j].quantity,
													"unitPrice" : orderItemInfo[j].price};
										kartArrayValues.push(items);
									}
								}
							}
						};
						var kartInput = {};
						kartInput.pincode = pincode;
						//kartInput.gatewayPaymentMode = orderResult.orderEntity.paymentInfo.paymentMode;
						kartInput.gatewayPaymentMode = "NA";
						kartInput.kartInfo = kartArrayValues;
						kartInput.discountCouponCode = orderTotals.discountCouponCode;
						kartInput.discountAmount = orderTotals.discountAmount;
						logger.debug(TAG + " Input for KartCharges: " + JSON.stringify(kartInput));

						//if there is no info available for the kartinfo input, then call OrderLevel update.
						if(kartArrayValues.length > 0)
						{
							//Line Item Level Cancellation get kart Charges for valid Line items.
							getKartCharges(kartInput, function(err, kartResult){
								if(!err && kartResult !== null)
								{
									logger.debug(TAG + "Kart Result obtained for OrderNumber: "+req.body.orderNumber+", sellerid: "+req.body.sellerId +"kartResult: " + kartResult);
									// Calculate Finance from Kart Results and append the results in orderResult (Order Store).
									getupdatedFinanceDetailsItemLevel(req, orderResult, kartResult, pincode, function(err, kartFinanceResult){
										if(!err && kartFinanceResult !== null)
										{
											logger.debug(TAG + "updated Kart Finance Result obtained for OrderNumber: "+req.body.orderNumber+", sellerid: "+req.body.sellerId +"kartResult: " + kartFinanceResult);


											return callback(false, kartFinanceResult);
										}
										else
										{
											logger.error(TAG + "Error in getupdatedFinanceDetails for OrderNumber: "+req.body.orderNumber+", sellerid: "+req.body.sellerId);
										    return callback(true, null);
										}
									});
								}
								else
								{
									logger.error(TAG + "Error in KartCharges for OrderNumber: "+req.body.orderNumber+", sellerid: "+req.body.sellerId);
									logger.error(TAG + "KartCharges input: kartInput: "+ JSON.stringify(kartInput));
								    return callback(true, null);
								}
							});
						}
						else
						{
							logger.debug(TAG + "In LineItemLevelUpdation no kartInput Available, Hence calling OrderLevelUpdation for OrderNumber: "+req.body.orderNumber+", sellerid: "+req.body.sellerId);
							getupdatedFinanceDetailsOrderLevel(req, orderResult, penaltyCharges, pincode, function(err, kartFinanceResult){
								if(!err && kartFinanceResult !== null)
								{
									logger.debug(TAG + "updated Finance Result (Order Level) obtained for OrderNumber: "+req.body.orderNumber+", sellerid: "+req.body.sellerId +"kartResult: " + kartFinanceResult);
									return callback(false, kartFinanceResult);
								}
								else
								{
									logger.error(TAG + "Error in getupdatedFinanceDetailsOrderLevel(In LineItem Call) for OrderNumber: "+req.body.orderNumber+", sellerid: "+req.body.sellerId);
								    return callback(true, null);
								}
							});
						}
					}
				}
				else
				{
					logger.debug(TAG + "Order Store retreived for Order Number: "+req.body.orderNumber+", sellerid: "+req.body.sellerId);
					return callback(false, orderResult);
				}
			}
		});
	}
	catch(e)
	{
	  console.log(TAG + "Exception in UpdateOrder- updateFincanceOnCancellation - " + e);
	  logger.error(TAG + "Exception in UpdateOrder- updateFincanceOnCancellation- :- error :" + e);
	  return callback(true);
	}
}

function getKartCharges(kartInput, callback){
	var logger = log.logger_sup;
	var HOST = host_detail.HOST;

	//get the host details depending on the environment.
	var cartURL = HOST.host+"/PlatformServices/api/v2.0/kartCharges/";
	var reqUrl = cartURL+JSON.stringify(kartInput);
	var encodedURI = encodeURI(reqUrl);
	logger.debug(TAG + "encoded URL for KartCharges: " + JSON.stringify(encodedURI));

	//Making Request
	request({url:encodedURI, method:'GET'},function(error,response,result){
		try{
			result = JSON.parse(result);
		}
		catch(err){
			logger.error(TAG + " Exception - getKartCharges -exception araised during parsing result - "+err);
			return callback(true, err);
		}

		if(!error && result.http_code === 200) //Java API output has http_code in number.
		{
			logger.debug(TAG + "KartCharges fetched successfully for KartInput : " + JSON.stringify(kartInput));
			return callback(false, result);
		}
		else if(!error && result.http_code !== 200)
		{
			logger.error(TAG + "Error fetching KartCharges. error: " + JSON.stringify(result));
			return callback(true, error);
		}
		else
		{
			logger.error(TAG + "Error fetching KartCharges. error: " + error);
			return callback(true, error);
		}
	});
};

function getupdatedFinanceDetailsOrderLevel(req, orderResult, penaltyCharges, pincode, callback) {
try
{
	var logger = log.logger_sup;
	//get various taxes from the external API.
	paymentInfo = orderResult.orderEntity.paymentInfo.paymentMode;
	getTaxes(pincode, paymentInfo, function(err, taxResult){
		if(!err && taxResult !== null)
		{
			for(var i = 0; i < taxResult.taxes.length; i++)
			{
				if(taxResult.taxes[i].taxType === "ST")
				{
					var taxST = taxResult.taxes[i].taxPercentage;
				}
				if(taxResult.taxes[i].taxType === "SBC")
				{
					var taxSBC = taxResult.taxes[i].taxPercentage;
				}
				if(taxResult.taxes[i].taxType === "KKC")
				{
					var taxKKC = taxResult.taxes[i].taxPercentage;
				}
				if(taxResult.taxes[i].taxType === "CONV")
				{
					var taxCONV = taxResult.taxes[i].taxPercentage;
				}
				if(taxResult.taxes[i].taxType === "CONVLimit")
				{
					var taxCONVLimit = taxResult.taxes[i].taxPercentage;
				}
			};
			logger.debug(TAG + "OrderLevel Cancellation- Taxdetail retrived, taxST: " + taxST + ", taxSBC: "+taxSBC+", taxKKC : "+ taxKKC + "taxCONV: " + taxCONV + "taxCONVLimit: " + taxCONVLimit);
			//**** Assign sellerTotal_A to the seller block ****//////
			var sellerArray = orderResult.orderEntity.financials.seller;
			var customerRefund = {"VAT":"",
							     "subtotal":"",
							     "shippingAndHandlingAnd3PLCharges":"",
							     "totalRefund":"",
							    };
			//get the sellerFinancial and customerRefund for the required SellerID.
			for(var i = 0; i < sellerArray.length; i++)
			{
				if(sellerArray[i].sellerId === req.body.sellerId)
				{
					sellerArray[i].sellerTotal_A={};
					sellerArray[i].sellerTotal_A.total = 0;
					sellerArray[i].sellerTotal_A.threePLCharges = 0;
					sellerArray[i].sellerTotal_A.shippingAndHandlingCharges = 0;
					sellerArray[i].sellerTotal_A.excise = 0;
					sellerArray[i].sellerTotal_A.shippingCharges = 0;
					sellerArray[i].sellerTotal_A.handlingCharges = 0;
					sellerArray[i].sellerTotal_A.VAT = 0;
					sellerArray[i].sellerTotal_A.subtotal = 0;
					sellerArray[i].sellerTotal_A.shippingAndHandlingAnd3PLCharges = 0;
					// Calculate customerRefund at Seller Level
					customerRefund.VAT = sellerArray[i].sellerTotal.VAT;
					customerRefund.subtotal = sellerArray[i].sellerTotal.subtotal;
					customerRefund.shippingAndHandlingAnd3PLCharges = sellerArray[i].sellerTotal.shippingAndHandlingAnd3PLCharges;
					customerRefund.totalRefund = customerRefund.VAT + customerRefund.subtotal + customerRefund.shippingAndHandlingAnd3PLCharges;
					sellerArray[i].customerRefunds = customerRefund;
					// Calculate sellerFinancial at Seller Level
					sellerArray[i].sellerFinancial.marginFromSeller = 0;
					sellerArray[i].sellerFinancial.tsfFromSeller = 0;
					sellerArray[i].sellerFinancial.totalServiceTaxFromSeller = 0;
					sellerArray[i].sellerFinancial.sellerTotal = 0;
					sellerArray[i].sellerFinancial.serviceTaxOnTsfFromSeller = 0;
					sellerArray[i].sellerFinancial.serviceTaxOnMarginFromSeller = 0;
					sellerArray[i].sellerFinancial.netPayableTo3PL = 0;
					sellerArray[i].sellerFinancial.netPayableToSeller = 0 - penaltyCharges;
					// traverse through all threePL and make it zero and assign it back.
					var sellerThreePL = sellerArray[i].sellerFinancial.threePL;
					for(var k = 0; k < sellerThreePL.length; k++)
					{
						sellerThreePL[k].netPayable = 0;
					}
					sellerArray[i].sellerFinancial.threePL = sellerThreePL;
				}
			};
			logger.debug(TAG + "OrderLevel Cancellation- sellerArray calculated Successfully");
			// Assign the calculated sellerArray and customerRefund back to the OrderResult.
			orderResult.orderEntity.financials.seller = sellerArray;

			//**** Assign orderFinancials to the seller block ****//////
			var orderFinancials = {"marginFromSeller":0,
									"tsfFromSeller" :0,
					                "totalServiceTaxFromSeller" :0,
					                "sellerTotal":0,
					                "serviceTaxOnTsfFromSeller":0,
					                "serviceTaxOnMarginFromSeller":0,
					                "discountCouponCode":0,
					                "netPayableTo3PL":0,
					                "netPayableToSeller":0,
					                "threePL" : [],
					                "discountAmount":0
					            };

			var threePLArray = [];
			for(var i = 0; i < sellerArray.length; i++)
			{
				orderFinancials.marginFromSeller = orderFinancials.marginFromSeller + sellerArray[i].sellerFinancial.marginFromSeller;
				orderFinancials.tsfFromSeller = orderFinancials.tsfFromSeller + sellerArray[i].sellerFinancial.tsfFromSeller;
				orderFinancials.totalServiceTaxFromSeller = orderFinancials.totalServiceTaxFromSeller + sellerArray[i].sellerFinancial.totalServiceTaxFromSeller;
				orderFinancials.sellerTotal = orderFinancials.sellerTotal + sellerArray[i].sellerFinancial.sellerTotal;
				orderFinancials.serviceTaxOnTsfFromSeller = orderFinancials.serviceTaxOnTsfFromSeller + sellerArray[i].sellerFinancial.serviceTaxOnTsfFromSeller;
				orderFinancials.serviceTaxOnMarginFromSeller = orderFinancials.serviceTaxOnMarginFromSeller + sellerArray[i].sellerFinancial.serviceTaxOnMarginFromSeller;
				orderFinancials.discountCouponCode = orderResult.orderEntity.financials.orderFinancials.discountCouponCode;
				orderFinancials.netPayableTo3PL = orderFinancials.netPayableTo3PL + sellerArray[i].sellerFinancial.netPayableTo3PL;
				orderFinancials.netPayableToSeller = orderFinancials.netPayableToSeller + sellerArray[i].sellerFinancial.netPayableToSeller;
				orderFinancials.discountAmount = orderResult.orderEntity.financials.orderFinancials.discountAmount;
				// If ThreePL Name already Exist in orderFinancials then add the netPayable, else push the new ThreePL info.
				var sellerThreePL = sellerArray[i].sellerFinancial.threePL;
				for(var k = 0; k < sellerThreePL.length; k++)
				{
					var threePLFoundFlag = false;
					for(var l = 0; l < threePLArray.length; l++)
					{
						if(sellerThreePL[k].name === threePLArray[l].name)
						{
							threePLArray[l].netPayable = threePLArray[l].netPayable + sellerThreePL[k].netPayable;
							threePLFoundFlag = true;
						}
					}
					if(threePLFoundFlag === false)
					{
						threePLArray.push(sellerThreePL[k]);
					}
				}
			}
			orderFinancials.threePL = threePLArray;

			logger.debug(TAG + "OrderLevel Cancellation- orderFinancials calculated Successfully");
		    // Assign the calculated orderFinancials back to the OrderResult.
			orderResult.orderEntity.financials.orderFinancials = orderFinancials;

			//**** Assign orderTotals_A and customerRefunds to the Order block ****//////
			var sellerArray = orderResult.orderEntity.financials.seller;
			var orderTotals = orderResult.orderEntity.orderInfo.orderTotals;

			var orderTotals_A ={
                "grossTotal" : 0, 
                "total" : 0, 
                "excise" : 0, 
                "serviceTaxOnConvenienceFee" : 0, 
                "discountAmount" : 0,
                "swachhBharatCessOnConvenienceFee":0,
                "krishiKalyanCessOnConvenienceFee":0,
                "discountCouponCode" : "", 
                "shippingAndHandlingAnd3PLCharges" : 0, 
                "convenienceFee" : 0, 
                "ActualSubtotal" : 0, 
                "ActualVAT" : 0, 
                "gatewayChargesOnTotal" : 0, 
                "grossTotalWithGatewayCharges" : 0, 
                "customerGatewayCharges" : 0,
                "customerGatewayChargesBasis" : ""
            };
            //If Amended block exists take it, else take the original sellerTotal block
			for(var i = 0; i < sellerArray.length; i++)
			{
				if(sellerArray[i].sellerTotal_A === undefined)
				{
					orderTotals_A.excise = orderTotals_A.excise + sellerArray[i].sellerTotal.excise;
					orderTotals_A.shippingAndHandlingAnd3PLCharges = orderTotals_A.shippingAndHandlingAnd3PLCharges + sellerArray[i].sellerTotal.shippingAndHandlingAnd3PLCharges;
					orderTotals_A.ActualSubtotal = orderTotals_A.ActualSubtotal + sellerArray[i].sellerTotal.subtotal;
					orderTotals_A.ActualVAT = orderTotals_A.ActualVAT + sellerArray[i].sellerTotal.VAT;
				}
				else
				{
					orderTotals_A.excise = orderTotals_A.excise + sellerArray[i].sellerTotal_A.excise;
					orderTotals_A.shippingAndHandlingAnd3PLCharges = orderTotals_A.shippingAndHandlingAnd3PLCharges + sellerArray[i].sellerTotal_A.shippingAndHandlingAnd3PLCharges;
					orderTotals_A.ActualSubtotal = orderTotals_A.ActualSubtotal + sellerArray[i].sellerTotal_A.subtotal;
					orderTotals_A.ActualVAT = orderTotals_A.ActualVAT + sellerArray[i].sellerTotal_A.VAT;
				}
			};

			orderTotals_A.discountAmount = orderTotals.discountAmount;
			orderTotals_A.discountCouponCode = orderTotals.discountCouponCode;
			orderTotals_A.total = orderTotals_A.ActualSubtotal + orderTotals_A.ActualVAT + orderTotals_A.shippingAndHandlingAnd3PLCharges;
			// limit the convenienceFee to a cap.
			var convenienceFee = (taxCONV * orderTotals_A.total)/100;
			if(convenienceFee < taxCONVLimit)
			{
				orderTotals_A.convenienceFee = convenienceFee;
			}
			else
			{
				orderTotals_A.convenienceFee = taxCONVLimit;
			}

			//orderTotals_A.serviceTaxOnConvenienceFee = (taxST * orderTotals_A.convenienceFee)/100; 
			orderTotals_A.swachhBharatCessOnConvenienceFee = (taxSBC * orderTotals_A.convenienceFee)/100;
			orderTotals_A.krishiKalyanCessOnConvenienceFee = (taxKKC * orderTotals_A.convenienceFee)/100;
			orderTotals_A.serviceTaxOnConvenienceFee = ((taxST * orderTotals_A.convenienceFee)/100) + orderTotals_A.swachhBharatCessOnConvenienceFee + orderTotals_A.krishiKalyanCessOnConvenienceFee;
			// If grossTotal is negative then make it zero.
			//var grossTotal = (orderTotals_A.total+orderTotals_A.convenienceFee+orderTotals_A.serviceTaxOnConvenienceFee+orderTotals_A.swachhBharatCessOnConvenienceFee+orderTotals_A.krishiKalyanCessOnConvenienceFee)-orderTotals_A.discountAmount;
		    var grossTotal = (orderTotals_A.total+orderTotals_A.convenienceFee+orderTotals_A.serviceTaxOnConvenienceFee)-orderTotals_A.discountAmount;
		    if(grossTotal > 0)
		    {
		    	orderTotals_A.grossTotal = grossTotal;
		    }
		    else
		    {
		    	orderTotals_A.grossTotal = 0;
		    };
			orderTotals_A.gatewayChargesOnTotal = (orderTotals.customerGatewayCharges * orderTotals_A.grossTotal)/100;
			orderTotals_A.grossTotalWithGatewayCharges =orderTotals_A.grossTotal + orderTotals_A.gatewayChargesOnTotal;
			orderTotals_A.customerGatewayCharges = orderTotals.customerGatewayCharges;
			orderTotals_A.customerGatewayChargesBasis = orderTotals.customerGatewayChargesBasis;
			logger.debug(TAG + "OrderLevel Cancellation- orderTotals_A calculated Successfully");

			//customerRefund Section
			var customerRefund = {"VAT":0,
							     "subtotal":0,
							     "shippingAndHandlingAnd3PLCharges":0,
							     "convenienceFee":0,
							     "serviceTaxOnConvenienceFee":0,
							     "gatewayChargesOnTotal":0,
							     "totalRefund": 0
							    };

			customerRefund.VAT = orderTotals.ActualVAT - orderTotals_A.ActualVAT;
			customerRefund.subtotal = orderTotals.ActualSubtotal - orderTotals_A.ActualSubtotal;
			customerRefund.shippingAndHandlingAnd3PLCharges = orderTotals.shippingAndHandlingAnd3PLCharges - orderTotals_A.shippingAndHandlingAnd3PLCharges;
			customerRefund.convenienceFee = orderTotals.convenienceFee - orderTotals_A.convenienceFee;
			customerRefund.serviceTaxOnConvenienceFee = orderTotals.serviceTaxOnConvenienceFee - orderTotals_A.serviceTaxOnConvenienceFee;
			//customerRefund.swachhBharatCessOnConvenienceFee = orderTotals.swachhBharatCessOnConvenienceFee - orderTotals_A.swachhBharatCessOnConvenienceFee;
			//customerRefund.krishiKalyanCessOnConvenienceFee = orderTotals.krishiKalyanCessOnConvenienceFee - orderTotals_A.krishiKalyanCessOnConvenienceFee;
			customerRefund.gatewayChargesOnTotal = orderTotals.gatewayChargesOnTotal - orderTotals_A.gatewayChargesOnTotal;
			//sum of all customer refunds.
			customerRefund.totalRefund = orderTotals.grossTotalWithGatewayCharges - orderTotals_A.grossTotalWithGatewayCharges;
			//customerRefund.totalRefund = customerRefund.VAT+customerRefund.subtotal+customerRefund.shippingAndHandlingAnd3PLCharges+customerRefund.convenienceFee+
				//customerRefund.serviceTaxOnConvenienceFee+/*customerRefund.swachhBharatCessOnConvenienceFee+customerRefund.krishiKalyanCessOnConvenienceFee+*/
				//customerRefund.gatewayChargesOnTotal;
			// In Order Cancellation, if grossTotal == 0 (If all the seller Orders have been cancelled, then subtract discount from Refund)	
			/*if(orderTotals_A.grossTotal === 0)
			{	
				customerRefund.discountAmount = orderTotals.discountAmount;
			    customerRefund.totalRefund = customerRefund.totalRefund - customerRefund.discountAmount;
			};    

			// IF totalRefund is negative (Less than the discount amount, then set it to 0) 	
			if(customerRefund.totalRefund < 0)
		    {
		    	customerRefund.totalRefund = 0;
		    };*/

			// Assign both calculated orderTotals_A and customerRefund to Order store.
			orderResult.orderEntity.orderInfo.orderTotals_A = orderTotals_A;
			orderResult.orderEntity.orderInfo.customerRefunds = customerRefund;
			logger.debug(TAG + "Order financials calculated successfully for Order Level Cancellation");
			return callback(false, orderResult);
		}
		else
		{
			logger.error(TAG + "Error fetching Various taxes from the external API, error: " + err);
			return callback(true, "Error fetching Various taxes from the external API");
		}
	});
}
catch(e)
{
  console.log(TAG + "Exception in UpdateOrder - getupdatedFinanceDetailsOrderLevel-" + e);
  logger.error(TAG + "Exception in UpdateOrder - getupdatedFinanceDetailsOrderLevel- :- error :" + e);
  return callback(true, null);
}
};

function getupdatedFinanceDetailsItemLevel( req, orderResult, kartResult, pincode, callback) {
try
{
	var logger = log.logger_sup;
	var kartInfo = kartResult.message.KartInfo;
	var SellerChargesConsolidation = kartResult.message.SellerChargesConsolidation;
	var ShippingChargesSummary = kartResult.message.ShippingChargesSummary;
	var KartChargesConsolidation = kartResult.message.KartChargesConsolidation;

	//get various taxes from the external API.
	paymentInfo = orderResult.orderEntity.paymentInfo.paymentMode;
	getTaxes(pincode, paymentInfo, function(err, taxResult){
		if(!err && taxResult !== null)
		{
			for(var i = 0; i < taxResult.taxes.length; i++)
			{
				if(taxResult.taxes[i].taxType === "ST")
				{
					var taxST = taxResult.taxes[i].taxPercentage;
				}
				if(taxResult.taxes[i].taxType === "SBC")
				{
					var taxSBC = taxResult.taxes[i].taxPercentage;
				}
				if(taxResult.taxes[i].taxType === "KKC")
				{
					var taxKKC = taxResult.taxes[i].taxPercentage;
				}
				if(taxResult.taxes[i].taxType === "CONV")
				{
					var taxCONV = taxResult.taxes[i].taxPercentage;
				}
				if(taxResult.taxes[i].taxType === "CONVLimit")
				{
					var taxCONVLimit = taxResult.taxes[i].taxPercentage;
				}
			};
			logger.debug(TAG + "OrderLevel Cancellation- Taxdetail retrived, taxST: " + taxST + ", taxSBC: "+taxSBC+", taxKKC : "+ taxKKC + "taxCONV: " + taxCONV + "taxCONVLimit: " + taxCONVLimit);

		   //*****To get SellerTotal and SellerFinance From SellerChargesConsolidation*****//
		    var sellerArray = orderResult.orderEntity.financials.seller;
		    var customerRefund = {"VAT":"",
							     "subtotal":"",
							     "shippingAndHandlingAnd3PLCharges":"",
							     "totalRefund":""
							    };
			//get the sellerFinancial for the required SellerID.
			for(var i = 0; i < sellerArray.length; i++)
			{
				if(sellerArray[i].sellerId === req.body.sellerId)
				{
					var sellerIdFoundInKart = false;
					for(var j = 0; j < SellerChargesConsolidation.length; j++)
					{
						if(sellerArray[i].sellerId === SellerChargesConsolidation[j].sellerId)
						{
							sellerIdFoundInKart = true;
							//Update the new Seller Total to sellerTotal_A (Amedment block) If the new shippingAndHandlingCharges are same or lesser than before cancellation
							sellerArray[i].sellerTotal_A = SellerChargesConsolidation[j].Customer;
							sellerArray[i].sellerFinancial = SellerChargesConsolidation[j].Finance;

							if(SellerChargesConsolidation[j].Customer.shippingAndHandlingCharges > sellerArray[i].sellerTotal.shippingAndHandlingCharges)
							{
								//If New shippingAndHandlingCharges is higher than old, then retain the old shippingandHandling charges and re-calculate other dependent fields.
								sellerArray[i].sellerTotal_A.shippingAndHandlingCharges = sellerArray[i].sellerTotal.shippingAndHandlingCharges;
								sellerArray[i].sellerTotal_A.shippingCharges = sellerArray[i].sellerTotal.shippingCharges;
								sellerArray[i].sellerTotal_A.handlingCharges = sellerArray[i].sellerTotal.handlingCharges;
								sellerArray[i].sellerTotal_A.shippingAndHandlingAnd3PLCharges = sellerArray[i].sellerTotal_A.shippingAndHandlingCharges + sellerArray[i].sellerTotal_A.threePLCharges;
								sellerArray[i].sellerTotal_A.total = sellerArray[i].sellerTotal_A.subtotal + sellerArray[i].sellerTotal_A.VAT + sellerArray[i].sellerTotal_A.shippingAndHandlingAnd3PLCharges;

								sellerArray[i].sellerFinancial.sellerTotal = sellerArray[i].sellerTotal_A.subtotal + sellerArray[i].sellerTotal_A.VAT + sellerArray[i].sellerTotal_A.shippingAndHandlingCharges;
								sellerArray[i].sellerFinancial.netPayableToSeller = sellerArray[i].sellerFinancial.sellerTotal - sellerArray[i].sellerFinancial.marginFromSeller - sellerArray[i].sellerFinancial.tsfFromSeller - sellerArray[i].sellerFinancial.totalServiceTaxFromSeller;
							}

							customerRefund.VAT = sellerArray[i].sellerTotal.VAT - sellerArray[i].sellerTotal_A.VAT;
							customerRefund.subtotal = sellerArray[i].sellerTotal.subtotal - sellerArray[i].sellerTotal_A.subtotal;
							customerRefund.shippingAndHandlingAnd3PLCharges = sellerArray[i].sellerTotal.shippingAndHandlingAnd3PLCharges - sellerArray[i].sellerTotal_A.shippingAndHandlingAnd3PLCharges;
							customerRefund.totalRefund = customerRefund.subtotal + customerRefund.VAT + customerRefund.shippingAndHandlingAnd3PLCharges;
							sellerArray[i].customerRefunds = customerRefund;
						}
					};
					// If no other valid sku's exist for seller, then kart charges will have no values for this seller.
					if(sellerIdFoundInKart !== true)
					{
						sellerArray[i].sellerTotal_A = {
							"total":0,
							"threePLCharges":0,
							"shippingAndHandlingCharges":0,
							"excise":0,
							"shippingCharges":0,
							"handlingCharges":0,
							"VAT": 0,
							"subtotal":0,
							"shippingAndHandlingAnd3PLCharges":0
						};

						customerRefund.VAT = sellerArray[i].sellerTotal.VAT;
						customerRefund.subtotal = sellerArray[i].sellerTotal.subtotal;
						customerRefund.shippingAndHandlingAnd3PLCharges = sellerArray[i].sellerTotal.shippingAndHandlingAnd3PLCharges;
						customerRefund.totalRefund = customerRefund.subtotal + customerRefund.VAT + customerRefund.shippingAndHandlingAnd3PLCharges;
						sellerArray[i].customerRefunds = customerRefund;
					}
				}
			};

			//SellerTotal and SellerFinance Retreived from Kart Charges, Now append it to the Order Store.
			orderResult.orderEntity.financials.seller = sellerArray;
			logger.debug(TAG + "LineItem - sellerArray calculated successfully");
			//*****End of Seller Total and Seller Finance From SellerChargesConsolidation*****//

			//*****To Calculate orderTotals from KartChargesConsolidation*****//
			//Rename the fields as required in the order store
		    KartChargesConsolidation.Customer.ActualSubtotal = KartChargesConsolidation.Customer.subtotal;
		    KartChargesConsolidation.Customer.ActualVAT = KartChargesConsolidation.Customer.VAT;

		    // Setting order totals
		    delete KartChargesConsolidation.Customer.subtotalWithVAT;
		    delete KartChargesConsolidation.Customer.threePLCharges;
		    delete KartChargesConsolidation.Customer.shippingAndHandlingCharges;
		    delete KartChargesConsolidation.Customer.shippingCharges;
		    delete KartChargesConsolidation.Customer.handlingCharges;
		    delete KartChargesConsolidation.Customer.VAT;
		    delete KartChargesConsolidation.Customer.subtotal;
		    delete KartChargesConsolidation.Customer.priceDisplayInclVAT;

		    var orderTotals = KartChargesConsolidation.Customer;

		    //Iterating Customer Block to get gatewayChargesOnTotal, grossTotalWithGatewayCharges.
		    var tempCustomerGatewayCharges;
		    // depnding on the paymentMode, Select the appropriate customerGatewayCharges
		    for (var i in KartChargesConsolidation.Customer.customerGatewayCharges) {
		      if (orderResult.orderEntity.paymentInfo.paymentMode == KartChargesConsolidation.Customer.customerGatewayCharges[i].gatewayPaymentMode) {
		        tempCustomerGatewayCharges = KartChargesConsolidation.Customer.customerGatewayCharges[i];
		      }
		    }

		    if (tempCustomerGatewayCharges) {
		      orderTotals.gatewayChargesOnTotal = tempCustomerGatewayCharges.gatewayCharges;
		      orderTotals.grossTotalWithGatewayCharges = tempCustomerGatewayCharges.grossTotalWithGatewayCharges;
		    } else {
		      orderTotals.gatewayChargesOnTotal = 0;
		      orderTotals.grossTotalWithGatewayCharges = orderTotals.grossTotal;
		    }

		    delete orderTotals.customerGatewayCharges;

		    // Iterating information Block to get customerGatewayCharges, customerGatewayChargesBasis.
		    var tempCustomerGatewayChargesInfo;

		    for (var i in KartChargesConsolidation.Information.customerGatewayChargesInfo) {
		      if (orderResult.orderEntity.paymentInfo.paymentMode == KartChargesConsolidation.Information.customerGatewayChargesInfo[i].gatewayPaymentMode) {
		        tempCustomerGatewayChargesInfo = KartChargesConsolidation.Information.customerGatewayChargesInfo[i];
		      }
		    }

		    if (tempCustomerGatewayChargesInfo) {
		      orderTotals.customerGatewayCharges = tempCustomerGatewayChargesInfo.customerGatewayCharges;
		      orderTotals.customerGatewayChargesBasis = tempCustomerGatewayChargesInfo.customerGatewayChargesBasis;
		    } else {
		      orderTotals.customerGatewayCharges = 0;
		      orderTotals.customerGatewayChargesBasis = "";
		    }
		    // Order Totals Retrived from Kart Charges, Now append it to the Order Store.
			// shippingAndHandlingAnd3PLCharges is sum of all seller shippingAndHandlingAnd3PLCharges.
		    logger.debug(TAG + "LineItem - Order Totals Retrived from Kart Charges successfully: " + JSON.stringify(orderTotals));

			//Fileds from Kartcharges to be recalculated before Appending.
			orderTotals.shippingAndHandlingAnd3PLCharges = 0;
			orderTotals.serviceTaxOnConvenienceFee = 0;
			orderTotals.swachhBharatCessOnConvenienceFee = 0;
			orderTotals.convenienceFee = 0;
			orderTotals.krishiKalyanCessOnConvenienceFee = 0;
			orderTotals.gatewayChargesOnTotal = 0;
			orderTotals.grossTotalWithGatewayCharges = 0;
			orderTotals.total = 0;
			orderTotals.grossTotal = 0;

			var sellerArray = orderResult.orderEntity.financials.seller;
			for(var i = 0; i < sellerArray.length; i++)
			{
				if(sellerArray[i].sellerTotal_A === undefined)
				{
					orderTotals.shippingAndHandlingAnd3PLCharges = orderTotals.shippingAndHandlingAnd3PLCharges + sellerArray[i].sellerTotal.shippingAndHandlingAnd3PLCharges;
				}
				else
				{
					orderTotals.shippingAndHandlingAnd3PLCharges = orderTotals.shippingAndHandlingAnd3PLCharges + sellerArray[i].sellerTotal_A.shippingAndHandlingAnd3PLCharges;
				}
			};

		    orderTotals.total = orderTotals.ActualSubtotal + orderTotals.ActualVAT + orderTotals.shippingAndHandlingAnd3PLCharges;
		    //get the convenienceFee with a cap of higher limit.
		    var convenienceFee = (taxCONV * orderTotals.total)/100;
			if(convenienceFee < taxCONVLimit)
			{
				orderTotals.convenienceFee = convenienceFee;
			}
			else
			{
				orderTotals.convenienceFee = taxCONVLimit;
			}

			//orderTotals.serviceTaxOnConvenienceFee = (taxST * orderTotals.convenienceFee)/100; 
			orderTotals.swachhBharatCessOnConvenienceFee = (taxSBC * orderTotals.convenienceFee)/100;
			orderTotals.krishiKalyanCessOnConvenienceFee = (taxKKC * orderTotals.convenienceFee)/100;
			orderTotals.serviceTaxOnConvenienceFee = ((taxST * orderTotals.convenienceFee)/100) + orderTotals.swachhBharatCessOnConvenienceFee + orderTotals.krishiKalyanCessOnConvenienceFee;

		    //var grossTotal = (orderTotals.total + orderTotals.convenienceFee + orderTotals.serviceTaxOnConvenienceFee + orderTotals.swachhBharatCessOnConvenienceFee + orderTotals.krishiKalyanCessOnConvenienceFee) - orderTotals.discountAmount;
		    var grossTotal = (orderTotals.total + orderTotals.convenienceFee + orderTotals.serviceTaxOnConvenienceFee) - orderTotals.discountAmount;
		    if(grossTotal > 0)
		    {
		    	orderTotals.grossTotal = grossTotal;
		    }
		    else
		    {
		    	orderTotals.grossTotal = 0;
		    };
		    orderTotals.gatewayChargesOnTotal = (orderTotals.customerGatewayCharges * orderTotals.grossTotal)/100;
		    orderTotals.grossTotalWithGatewayCharges = orderTotals.grossTotal + orderTotals.gatewayChargesOnTotal;
		    //Assign the New calculated orderTotals into Amended block (orderTotals_A) in Order Store;
		    logger.debug(TAG + "LineItem - orderTotals calculated successfully");
		    orderResult.orderEntity.orderInfo.orderTotals_A = orderTotals;
		    //Start CustomerRefund at Order Level.
		    var customerRefund = {"VAT":"",
							     "subtotal":"",
							     "shippingAndHandlingAnd3PLCharges":"",
							     "convenienceFee":"",
							     "serviceTaxOnConvenienceFee":"",
							     "gatewayChargesOnTotal":"",
							     "totalRefund":""
							    };

			customerRefund.VAT = orderResult.orderEntity.orderInfo.orderTotals.ActualVAT - orderResult.orderEntity.orderInfo.orderTotals_A.ActualVAT;
			customerRefund.subtotal = orderResult.orderEntity.orderInfo.orderTotals.ActualSubtotal - orderResult.orderEntity.orderInfo.orderTotals_A.ActualSubtotal;
			customerRefund.shippingAndHandlingAnd3PLCharges = orderResult.orderEntity.orderInfo.orderTotals.shippingAndHandlingAnd3PLCharges - orderResult.orderEntity.orderInfo.orderTotals_A.shippingAndHandlingAnd3PLCharges;
			customerRefund.convenienceFee = orderResult.orderEntity.orderInfo.orderTotals.convenienceFee - orderResult.orderEntity.orderInfo.orderTotals_A.convenienceFee;				    
			//customerRefund.swachhBharatCessOnConvenienceFee = orderResult.orderEntity.orderInfo.orderTotals.swachhBharatCessOnConvenienceFee - orderResult.orderEntity.orderInfo.orderTotals_A.swachhBharatCessOnConvenienceFee;
			//customerRefund.krishiKalyanCessOnConvenienceFee = orderResult.orderEntity.orderInfo.orderTotals.krishiKalyanCessOnConvenienceFee - orderResult.orderEntity.orderInfo.orderTotals_A.krishiKalyanCessOnConvenienceFee;
			//customerRefund.discountAmount = orderResult.orderEntity.orderInfo.orderTotals.discountAmount;
			customerRefund.serviceTaxOnConvenienceFee = orderResult.orderEntity.orderInfo.orderTotals.serviceTaxOnConvenienceFee - orderResult.orderEntity.orderInfo.orderTotals_A.serviceTaxOnConvenienceFee;
			customerRefund.gatewayChargesOnTotal = orderResult.orderEntity.orderInfo.orderTotals.gatewayChargesOnTotal - orderResult.orderEntity.orderInfo.orderTotals_A.gatewayChargesOnTotal;
			// sum of all fields in CustomerRefund.
			customerRefund.totalRefund = orderResult.orderEntity.orderInfo.orderTotals.grossTotalWithGatewayCharges - orderResult.orderEntity.orderInfo.orderTotals_A.grossTotalWithGatewayCharges;

			//customerRefund.totalRefund = customerRefund.VAT+customerRefund.subtotal+customerRefund.shippingAndHandlingAnd3PLCharges+
				//customerRefund.convenienceFee+/*customerRefund.swachhBharatCessOnConvenienceFee+customerRefund.krishiKalyanCessOnConvenienceFee+*/
				//customerRefund.serviceTaxOnConvenienceFee+customerRefund.gatewayChargesOnTotal;

			/*// IF totalRefund is negative (Less than the discount amount, then set it to 0) 	
			if(customerRefund.totalRefund < 0)
		    {
		    	customerRefund.totalRefund = 0;
		    };*/

		    orderResult.orderEntity.orderInfo.customerRefunds = customerRefund;
		    //********End Of Calculate orderTotals from KartChargesConsolidation********//

			//*****To get Order Financials from KartChargesConsolidation*****//
			var orderFinancials;
			orderFinancials = KartChargesConsolidation.Finance;

			var sellerArray = orderResult.orderEntity.financials.seller;
			//All other values would remain same from kart charges, only below fields might vary depnding on Shiiping and Handling charges.
			orderFinancials.sellerTotal = 0;
			orderFinancials.netPayableToSeller = 0;
			for(var i = 0; i < sellerArray.length; i++)
			{
				orderFinancials.sellerTotal = orderFinancials.sellerTotal + sellerArray[i].sellerFinancial.sellerTotal;
				orderFinancials.netPayableToSeller = orderFinancials.netPayableToSeller + sellerArray[i].sellerFinancial.netPayableToSeller;
			}

			orderResult.orderEntity.financials.orderFinancials = orderFinancials;
			logger.debug(TAG + "LineItem - orderFinancials calculated successfully");
			//*****End of Order Financials from KartChargesConsolidation*****//
		    return callback(false, orderResult);
		}
		else
		{
			logger.error(TAG + "LineItem -Error fetching Various taxes from the external API, error: " + err);
			return callback(true, "Error fetching Various taxes from the external API");
		}
	});
}
catch(e)
{
  console.log(TAG + " Exception in UpdateOrder - getupdatedFinanceDetailsItemLevel-" + e);
  logger.error(TAG + "Exception in UpdateOrder - getupdatedFinanceDetailsItemLevel- :- error :" + e);
  return callback(true, null);
}
};

// To get Various Taxes from External API.
function getTaxes(pincode, paymentMode, callback){
	var logger = log.logger_sup;
	var HOST = host_detail.HOST;

	async.parallel([
			//Function to get Service Tax.
			function(asyncCallback){
				var resJson ={};
				resJson.taxType = "ST";
				resJson.taxPercentage = 0;
				var type = "Service";
				var paymentMode = 'ANY';

				var reqUrl = HOST.host+"/PlatformServices/api/v1.0/platformCharges?entity=Customer&type="+type+"&transactionMode="+paymentMode+"&pincode="+pincode;
				var encodedURI = encodeURI(reqUrl);
				request({url:encodedURI, method:'GET'},function(error,response,result){
					try{
						result = JSON.parse(result);
					}
					catch(err){
						logger.error(TAG + " Exception - ST getTaxes -exception araised during parsing result - "+err);
						return asyncCallback(true, null);
					}

					if(!error && result.http_code === 200) //Java API output has http_code in number.
					{
						logger.debug(TAG + "ST getTaxes fetched successfully" + JSON.stringify(result));
						resJson.taxPercentage = result.message.platformChargesEntity.charges;
						return asyncCallback(false, resJson);
					}
					else if(!error && result.http_code !== 200)
					{
						logger.error(TAG + "Error fetching ST getTaxes. error: " + JSON.stringify(result));
						return asyncCallback(false, resJson);
					}
					else
					{
						logger.error(TAG + "Error fetching ST getTaxes. error: " + error);
						return asyncCallback(false, resJson);
					}
				});
			},
			//Function to get swachhBharatCess.
			function(asyncCallback){
				var resJson ={};
				resJson.taxType = "SBC";
				resJson.taxPercentage = 0;
				var type = "SwachhBharatCess";
				var paymentMode = 'ANY';

				var reqUrl = HOST.host+"/PlatformServices/api/v1.0/platformCharges?entity=Customer&type="+type+"&transactionMode="+paymentMode+"&pincode="+pincode;
				var encodedURI = encodeURI(reqUrl);
				request({url:encodedURI, method:'GET'},function(error,response,result){
					try{
						result = JSON.parse(result);
					}
					catch(err){
						logger.error(TAG + " Exception - SBC getTaxes -exception araised during parsing result - "+err);
						return asyncCallback(true, null);
					}

					if(!error && result.http_code === 200) //Java API output has http_code in number.
					{
						logger.debug(TAG + "SBC getTaxes fetched successfully");
						resJson.taxPercentage = result.message.platformChargesEntity.charges;
						return asyncCallback(false, resJson);
					}
					else if(!error && result.http_code !== 200)
					{
						logger.error(TAG + "Error fetching SBC getTaxes. error: " + JSON.stringify(result));
						return asyncCallback(false, resJson);
					}
					else
					{
						logger.error(TAG + "Error fetching SBC getTaxes. error: " + error);
						return asyncCallback(false, resJson);
					}
				});
			},
			//Function to get KrishiKalyanCess.
			function(asyncCallback){
				var resJson ={};
				resJson.taxType = "KKC";
				resJson.taxPercentage = 0;
				var type = "KrishiKalyanCess";
				var paymentMode = 'ANY';

				var reqUrl = HOST.host+"/PlatformServices/api/v1.0/platformCharges?entity=Customer&type="+type+"&transactionMode="+paymentMode+"&pincode="+pincode;
				var encodedURI = encodeURI(reqUrl);
				request({url:encodedURI, method:'GET'},function(error,response,result){
					try{
						result = JSON.parse(result);
					}
					catch(err){
						logger.error(TAG + " Exception - KKC getTaxes -exception araised during parsing result - "+err);
						return asyncCallback(true, null);
					}

					if(!error && result.http_code === 200) //Java API output has http_code in number.
					{
						logger.debug(TAG + "KKC getTaxes fetched successfully");
						resJson.taxPercentage = result.message.platformChargesEntity.charges;
						return asyncCallback(false, resJson);
					}
					else if(!error && result.http_code !== 200)
					{
						logger.error(TAG + "Error fetching KKC getTaxes. error: " + JSON.stringify(result));
						return asyncCallback(false, resJson);
					}
					else
					{
						logger.error(TAG + "Error fetching KKC getTaxes. error: " + error);
						return asyncCallback(false, resJson);
					}
				});
			},
			//Function to get ConvFee.
			function(asyncCallback){
				var resJson ={};
				resJson.taxType = "CONV";
				resJson.taxPercentage = 0;
				var type = "ConvFee";
				var paymentMode = 'ANY';

				var reqUrl = HOST.host+"/PlatformServices/api/v1.0/platformCharges?entity=Customer&type="+type+"&transactionMode="+paymentMode+"&pincode="+pincode;
				var encodedURI = encodeURI(reqUrl);
				request({url:encodedURI, method:'GET'},function(error,response,result){
					try{
						result = JSON.parse(result);
					}
					catch(err){
						logger.error(TAG + " Exception - CONV getTaxes -exception araised during parsing result - "+err);
						return asyncCallback(true, null);
					}

					if(!error && result.http_code === 200) //Java API output has http_code in number.
					{
						logger.debug(TAG + "CONV getTaxes fetched successfully");
						resJson.taxPercentage = result.message.platformChargesEntity.charges;
						return asyncCallback(false, resJson);
					}
					else if(!error && result.http_code !== 200)
					{
						logger.error(TAG + "Error fetching CONV getTaxes. error: " + JSON.stringify(result));
						return asyncCallback(false, resJson);
					}
					else
					{
						logger.error(TAG + "Error fetching CONV getTaxes. error: " + error);
						return asyncCallback(false, resJson);
					}
				});
			},
			//Function to get HigherLimit of ConvFee.
			function(asyncCallback){
				var resJson ={};
				resJson.taxType = "CONVLimit";
				resJson.taxPercentage = 0;
				var type = "ConvFee_HigherLimit";
				var paymentMode = 'ANY';

				var reqUrl = HOST.host+"/PlatformServices/api/v1.0/platformCharges?entity=Customer&type="+type+"&transactionMode="+paymentMode+"&pincode="+pincode;
				var encodedURI = encodeURI(reqUrl);
				request({url:encodedURI, method:'GET'},function(error,response,result){
					try{
						result = JSON.parse(result);
					}
					catch(err){
						logger.error(TAG + " Exception - CONVLimit getTaxes -exception araised during parsing result - "+err);
						return asyncCallback(true, null);
					}

					if(!error && result.http_code === 200) //Java API output has http_code in number.
					{
						logger.debug(TAG + "CONVLimit getTaxes fetched successfully");
						resJson.taxPercentage = result.message.platformChargesEntity.charges;
						return asyncCallback(false, resJson);
					}
					else if(!error && result.http_code !== 200)
					{
						logger.error(TAG + "Error fetching CONVLimit getTaxes. error: " + JSON.stringify(result));
						return asyncCallback(false, resJson);
					}
					else
					{
						logger.error(TAG + "Error fetching CONVLimit getTaxes. error: " + error);
						return asyncCallback(false, resJson);
					}
				});
			}
		],
		//Final function that will be called by functions defined in series.
		function(error, results){
			if(!error){
				var finalres = {};
				finalres.taxes = results;
				logger.debug(TAG + " Tax Result: " + JSON.stringify(finalres));
				return callback(false, finalres);
			}
			else
			{
				logger.error(TAG + " error getting taxes.");
				return callback(true, null);
			}
		});
};

//Function that will get Order Status.
function getStatus(orderNumber, sellerid, callback){
	var resJson = {};
	var logger = log.logger_sup;
	// Get the minimum status of the Line items, irespective of seller ID.
	getMinStatus(orderNumber, sellerid, function(error, statusResult){
			if(!error)
			{
				var resJson = {"orderStatus":"","sellerOrderStatus":""};
				for(var i = 0; i < statusResult.length; i++)
				{
					if(statusResult[i].level === "Order")
					{
						resJson.orderStatus = statusResult[i].status;
						if(statusResult[i].isCancelled)
						{
							// get main Order status (status as Partially) even if one of the Line Item is cancelled.
							getStatusWhenCancelled(statusResult[i].status, function(orderStatus){
								resJson.orderStatus = orderStatus;
							});
						}
					};

					if(statusResult[i].level === "Seller")
					{
						resJson.sellerOrderStatus = statusResult[i].status;
						if(statusResult[i].isCancelled)
						{
							// get seller Order status (status as Partially) even if one of the Line Item is cancelled for that seller.
							getStatusWhenCancelled(statusResult[i].status, function(orderStatus){
								resJson.sellerOrderStatus = orderStatus;
							});
						}
					}
				}
				logger.debug(TAG + "Result from getStatus: "+ JSON.stringify(resJson));
				return callback(false, resJson);
			}
			else
			{
				logger.error(TAG + "Error getting Result from getStatus, error: "+ error);
				return callback(true, resJson);
			}
	});
}

//Function that will update Order Status.
function updateOrderStatus(orderNumber, sellerId, status, sellerOrderStatus, callback){
	var db = dbConfig.mongoDbConn;
	var ordersColl = db.collection('Orders');
	var logger = log.logger_sup;

	ordersColl.update({"orderEntity.orderInfo.orderNumber": orderNumber,
					   "orderEntity.orderInfo.sellerInfo": {$elemMatch: {"sellerId": sellerId}}},
	  	{ $set: {"orderEntity.orderInfo.orderStatus": status, "orderEntity.orderInfo.sellerInfo.$.sellerOrderStatus": sellerOrderStatus}},
	  	function(error, result){
	  	if(error)
	  	{
	  		return callback(true);
	  	}
	  	else
	  	{
	  		// update SellerOrder status in SupplierNotification Table to have the current status.
	  		updateOrderStatusNotification(orderNumber, sellerId, sellerOrderStatus, function(error, statusResult){
	  		});

	  		// To send email to Customer Only on Whole Order is marked as Delivered. (Not to send email on each induvidual)
			if(status === "Delivered" || status === "Partially delivered")
			{
				ordersColl.find({"orderEntity.orderInfo.orderNumber": orderNumber, "orderEntity.orderInfo.orderStatus": {$in: ["Delivered", "Partially delivered"]}})
				.toArray(function(error, result)
				{
					if(!error)
					{
						if(result.length > 0)
						{
							logger.debug(TAG + "order Delivered notification sent successfully to customer, for ordernumber "+ orderNumber);
							cusNotifications.customerOrderDeliveryNotification( result[0], function(err, result){
							});
						}
						else if(result.length === 0){
							//when a single Supplier Updates to Delivered, OrderStatus will not be updated to Delivered.
							logger.debug(TAG + "order with orderStatus as Delivered, Partially delivered is not Found, for ordernumber "+ orderNumber);
						}
					}
					else
					{
						logger.error(TAG + " Error - Fetching order with orderStatus as Delivered, Partially delivered from orders collection, for orderNumber "+ orderNumber +" error: "+error);
					}
				});
			}
	  		return callback(false);
	  	}
	});
}

//Function that will update Order Status.
function updateOrderStatusNotification(orderNumber, sellerId, sellerOrderStatus, callback){
	var db = dbConfig.mongoDbConn;
	var notiColl = db.collection('SupplierNotifications');
	var logger = log.logger_sup;

	var orderDisplayStatus = "Not Available";
	if (sellerOrderStatus === "Cancelled" )
	{
		orderDisplayStatus = "Cancelled";	// Status are same.
	}
	else if(sellerOrderStatus === "Delivered" || sellerOrderStatus === "Partially delivered")
	{
		orderDisplayStatus = "Delivered";	// Status are same.
	}
	else if(sellerOrderStatus === "Confirmed")
	{
		orderDisplayStatus = "New";
	}
	else if (sellerOrderStatus === "Accepted" || sellerOrderStatus === "Partially Accepted" ||sellerOrderStatus === "Ready To Ship" ||
		sellerOrderStatus === "Ready to Ship - Partial" ||sellerOrderStatus === "Shipped"||sellerOrderStatus === "Partially Shipped")
	{
		orderDisplayStatus = "In Progress";
	}

	notiColl.update({"notificationsInfo.sellerId": sellerId,
					 "notificationsInfo.notifications": {$elemMatch: {"orderNumber": orderNumber}}},
	  	{ $set: {"notificationsInfo.notifications.$.orderDisplayStatus": orderDisplayStatus}},
	  	function(error, result){
	  	if(error)
	  	{
	  		logger.error(TAG + "Error updating orderDisplayStatus in updateOrderStatusNotification, error: "+ error);
	  		return callback(true, null);
	  	}
	  	else
	  	{
	  		logger.debug(TAG + "orderDisplayStatus updated successfully in updateOrderStatusNotification");
	  		return callback(false, null);
	  	}
	});
}

//Function to get minimum line status.
function getMinStatus(orderNumber, sellerid, callback){
	var db = dbConfig.mongoDbConn;
	var ordersColl = db.collection('Orders');
	var logger = log.logger_sup;

	async.parallel([
		// Function to get Order Status
		function(asyncCallback){
			var arr = [];
			ordersColl.aggregate([{$match: {"orderEntity.orderInfo.orderNumber": orderNumber}},
							{$unwind: "$orderEntity.orderInfo.sellerInfo"},
							{$unwind: "$orderEntity.orderInfo.sellerInfo.orderItemInfo"},
							{$project: {"orderEntity.orderInfo.sellerInfo.orderItemInfo.itemStatus": 1}}
		 	]).toArray(function(error, result){
				if(!error && result.length > 0){

					for(var i = 0; i < result.length; i++){
						arr.push(result[i].orderEntity.orderInfo.sellerInfo.orderItemInfo.itemStatus);
					}

					var isCancelled = false;

					Array.prototype.allValuesSame = function() {

					    for(var i = 1; i < this.length; i++)
					    {
					        if(this[i] !== this[0]){
					        	return false;
					        }
					    }

					    return true;
					};
					//If all line items status are same, return the same status.
					if(arr.allValuesSame()){
						var res =  {
							"level" : "Order",
							"status": arr[0],
							"isCancelled": isCancelled
						};
						return asyncCallback(false, res);
					}
					// Mapping Status with Hierarchy numbers to calculate minimum status.
					var StatusCode = {
						"Confirmed": 1,
						"Accepted": 2,
						"Ready To Ship": 3,
						"Shipped": 4,
						"Delivered": 5
					};

					var calarr = [];
					underscore.each(arr, function(element, index, list){
						if(element === 'Cancelled'){
							isCancelled = true;
						}
						else{
							calarr.push((StatusCode[element]));
						}
					});
					var status = (underscore.invert(StatusCode))[underscore.min(calarr)];
					var res =  {
						"level" : "Order",
						"status": status,
						"isCancelled": isCancelled
					};
					return asyncCallback(false, res);
				}
				else if(!error && result.length < 1){
					logger.error(TAG + " Record Not Found for OrderNumber: "+orderNumber+", in Orders collection.");
					return asyncCallback(true, null);
				}
				else if (error){
					logger.error(TAG + " Error in Fetching record of OrderNumber: "+orderNumber+", in Orders collection.");
					return asyncCallback(true, null);
				}
			});
		},
		//Function to get SellerLevelOrder status.
		function(asyncCallback){
			var arr = [];
			ordersColl.aggregate([{$match: {"orderEntity.orderInfo.orderNumber": orderNumber}},
							{$unwind: "$orderEntity.orderInfo.sellerInfo"},
							{$unwind: "$orderEntity.orderInfo.sellerInfo.orderItemInfo"},
							{$match: {"orderEntity.orderInfo.sellerInfo.sellerId": sellerid}},
							{$project: {"orderEntity.orderInfo.sellerInfo.orderItemInfo.itemStatus": 1}}
		 	]).toArray(function(error, result){
				if(!error && result.length > 0){

					for(var i = 0; i < result.length; i++){
						arr.push(result[i].orderEntity.orderInfo.sellerInfo.orderItemInfo.itemStatus);
					}

					var isCancelled = false;

					Array.prototype.allValuesSame = function() {

					    for(var i = 1; i < this.length; i++)
					    {
					        if(this[i] !== this[0]){
					        	return false;
					        }
					    }

					    return true;
					};
					//If all line items status are same, return the same status.
					if(arr.allValuesSame()){
						var res =  {
							"level" : "Seller",
							"status": arr[0],
							"isCancelled": isCancelled
						};
						return asyncCallback(false, res);
					}
					// Mapping Status with Hierarchy numbers to calculate minimum status.
					var StatusCode = {
						"Confirmed": 1,
						"Accepted": 2,
						"Ready To Ship": 3,
						"Shipped": 4,
						"Delivered": 5
					};

					var calarr = [];
					underscore.each(arr, function(element, index, list){
						if(element === 'Cancelled'){
							isCancelled = true;
						}
						else{
							calarr.push((StatusCode[element]));
						}
					});
					var status = (underscore.invert(StatusCode))[underscore.min(calarr)];
					var res =  {
						"level" : "Seller",
						"status": status,
						"isCancelled": isCancelled
					};
					return asyncCallback(false, res);
				}
				else if(!error && result.length < 1){
					logger.error(TAG + " Record Not Found for OrderNumber: "+orderNumber+", in Orders collection.");
					return asyncCallback(true, null);
				}
				else if (error){
					logger.error(TAG + " Error in Fetching record of OrderNumber: "+orderNumber+", in Orders collection.");
					return asyncCallback(true, null);
				}
			});
		}
	],
	//Final function that will be called by functions defined in parallel.
	function(error, results){
		if(!error){
			logger.debug(TAG + " OrderStatus and SellerLevel OrderStatus calculated :"+ JSON.stringify(results));
			return callback(false, results);
		}
		else
		{
			logger.error(TAG + "Error getting OrderStatus and SellerLevel OrderStatus, error:"+ error);
			return callback(true, null);
		}
	});
}

//Function to get minimum line status when one of item is cancelled.
function getStatusWhenCancelled(status, callback){
	if(status === 'Confirmed')
	{
		return callback('Confirmed');
	}
	else if(status === 'Accepted')
	{
		return callback('Partially Accepted');
	}
	else if(status === 'Ready To Ship')
	{
		return callback('Ready to Ship - Partial');
	}
	else if(status === 'Shipped')
	{
		return callback('Partially Shipped');
	}
	else if(status === 'Delivered')
	{
		return callback('Partially delivered');
	}
}
