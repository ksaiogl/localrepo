var TAG = "dailyNotificationNodeJobs - ";
// The JS file is required in app.js, so that the page is loaded on start and function is invoked for the First time.
var async = require('async');
var underscore = require('underscore');
var moment = require('moment-timezone');
var dbConfig = require('../Environment/mongoDatabase.js');
var log = require('../Environment/log4js.js');
var supNotify = require('../routes/supplier/supplierNotifications.js');
var CronJob = require('cron').CronJob;
var notifications = require('../routes/helpers/notifications.js');
var timezoneConversions = require('../routes/helpers/timezoneConversions.js');

//---------------------------------------------------------------------------
// "checkOrderDeliveryDate" -> Function gets all the Orders with deliverydate as today and sends the email to the corresponding sellers. 
// Scheduling the Function "checkOrderDeliveryDate" Everyday at 8 AM (Monday - Sunday)
// sec*  Min* Hours* dayofMonth* month* dayOfWeek*

var checkOrderDeliveryDate = new CronJob('45 00 02 * * *', function() {

	//Variable for logging the messages to the file.
	var logger = log.logger_jobs;
	logger.info("-------------------------------------------------------");
	logger.info(TAG + "Node CronJob 'checkOrderDeliveryDate'(Delivery Pending Today) started on: EST-> " + new Date() + ", IST-> " + timezoneConversions.toIST(new Date()));
    console.log("checkOrderDeliveryDate started");
	var db = dbConfig.mongoDbConn;	
	var ordersColl = db.collection("Orders");
	var supplierColl = db.collection("SellerMaster");

	// Fileds to be retrieved from Delayed Orders.
	var fields = {"_id": 0,
				"orderEntity.orderInfo.orderNumber":1,
			  	"orderEntity.orderInfo.sellerInfo":1};

	var currentStartDate = timezoneConversions.toIST(new Date());
	currentStartDate.setHours(0,0,0,0);	// ex: 2016-01-10T00:00:00.00
    currentStartDate = timezoneConversions.toUTC(currentStartDate);
    //(currentStartDate - ex: IST - 20-01-2016 02:00:00 ==> 20-01-2016 00:00:00  ==> set hours ==> 19-01-2016 18:30:00)
	var currentEndDate = timezoneConversions.toIST(new Date());
	currentEndDate.setHours(23,59,59,999); // ex: 2016-01-10T23:59:59.999
    currentEndDate = timezoneConversions.toUTC(currentEndDate);

	//(currentEndDate - ex: IST - 20-01-2016 02:00:00 ==> 20-01-2016 23:59:59  ==> set hours ==> 20-01-2016 18:29:59)

	//To compare weather notification already sent.
	var notificationCurrentDate = new Date(new Date().setHours(0, 0, 0, 0));

	// Order minimum delivery date is compared against the current start and end date.
	ordersColl.aggregate(
		{ $match: { "orderEntity.orderInfo.orderStatus":{"$nin": ["Pending","Failed","OnHold","Delivered","Cancelled"]}}},	
		{ $unwind: "$orderEntity.orderInfo.sellerInfo" },
		{ $unwind: "$orderEntity.orderInfo.sellerInfo.orderItemInfo" },
		{ $match: { "orderEntity.orderInfo.sellerInfo.orderItemInfo.itemStatus": {"$nin" : ["Pending","Failed","OnHold","Delivered","Cancelled"]}}},
		{ $group: {
			  	_id: {orderNumber: "$orderEntity.orderInfo.orderNumber", sellerId: "$orderEntity.orderInfo.sellerInfo.sellerId"},
			  	orderNumber: {$first: "$orderEntity.orderInfo.orderNumber"},
			  	sellerId: {$first: "$orderEntity.orderInfo.sellerInfo.sellerId"},
			  	minDeliveryDate: {$min: "$orderEntity.orderInfo.sellerInfo.orderItemInfo.minDeliveryDate"},
			  	pendingNotificationSentOn: {$min: "$orderEntity.orderInfo.sellerInfo.notifications.pendingNotificationSentOn"}
		  	} 
		},
  	    function(error, result){
		
		if(!error && result.length > 0)
		{
			logger.debug(TAG + "Retrieved today's Orders successfully on: " + new Date());

			// For each delayed Orders retrieve the corresponding sellers and send out an email.
			async.forEachSeries(result,
	 		function(delayedOrder, asyncCallback){

	 			var orderNumber = delayedOrder.orderNumber;
	 			var sellerId = delayedOrder.sellerId;
	 			var minDeliveryDate = delayedOrder.minDeliveryDate;
	 			var pendingNotificationSentOn = delayedOrder.pendingNotificationSentOn;
	 			var notificationObject = {};
	 			
	 			if( ( minDeliveryDate < currentEndDate ) && ( minDeliveryDate >= currentStartDate ) 
	 				&& ( pendingNotificationSentOn === null || pendingNotificationSentOn < notificationCurrentDate ) ){
	 				
	 				//Fetching supplier details for sending notifications.
 					supplierColl.findOne({"sellerEntity.profileInfo.accountInfo.sellerId": sellerId},{"_id": 0, "sellerEntity.profileInfo.basicInfo": 1,"sellerEntity.profileInfo.accountInfo.sellerId": 1}, function(err, contactInfo) {
						if(!err && (contactInfo !== null)){
							//Call email Service.. send email and sms to seller and email to fulfillment team.
							notificationObject.orderNumber = orderNumber;
							supNotify.sendTodayDeliveryOrderEmail(contactInfo, notificationObject, function(err, eResult){
							}); // not checking for errors, All errors will be logged into the log file.
			 			}
			 			else{
			 				logger.error(TAG + "Error retrieving ContactInfo for seller: " + sellerId + " err: " + JSON.stringify(err) + " contactInfo: " + JSON.stringify(contactInfo));
	                    }  	
			 		});

			 		//updating line items of particualr order number and sellerid.
	 				ordersColl.update({"orderEntity.orderInfo.orderNumber": orderNumber,
						"orderEntity.orderInfo.sellerInfo": {$elemMatch: {"sellerId": sellerId}}},
						{ $set: {"orderEntity.orderInfo.sellerInfo.$.notifications.pendingNotificationSentOn": new Date()}},  function(error, result){

					  	result = JSON.parse(result);
					  	if(error)
					  	{
					  		logger.error(TAG + " Error in updating notificationSentOn field in order collection for orderNumber: " + orderNumber + ", sellerid : " +sellerId);
					  	}
					  	else if(result.n < 1)
					  	{
					  		logger.debug(TAG + " Cannot update notificationSentOn field in order collection for orderNumber " + orderNumber + ", sellerid : " +sellerId);
					  	}
					});
	 			}
	 			asyncCallback();
	 			
	 		},
	 		//Final Function to be called upon completion of all functions.
			function(error)
			{
			 		
			}
			);
		}
		else if(!error && result.length < 1)
		{
			logger.debug(TAG + "No Orders found with with Pending Delivery for Date: " + new Date());
		}
		else
		{
			logger.error(TAG + "Error running OrderDeliveryDate on: " + new Date() + " err: " + error);
		}	
	});
});

checkOrderDeliveryDate.start();

//---------------------------------------------------------------------------
// "checkTomorrowDeliverableOrder" -> Function gets all the Orders that are deliverables tomorrow and sends the email to the corresponding sellers and fulfillment Team. 
// Scheduling the Function "checkTomorrowDeliverableOrder" Everyday at 8 AM (Monday - Sunday)
// sec*  Min* Hours* dayofMonth* month* dayOfWeek*

var checkTomorrowDeliverableOrder = new CronJob('45 30 02 * * *', function() {

	//Variable for logging the messages to the file.
	var logger = log.logger_jobs;
	logger.info("-------------------------------------------------------");
	logger.info(TAG + "Node CronJob 'checkTomorrowDeliverableOrder' started on: EST-> " + new Date() + ", IST-> " + timezoneConversions.toIST(new Date()));
	console.log("checkTomorrowDeliverableOrder started");
	var db = dbConfig.mongoDbConn;
	var ordersColl = db.collection("Orders");
	var supplierColl = db.collection("SellerMaster");

	// Fileds to be retrieved from Delayed Orders.
	var fields = {"_id": 0,
				"orderEntity.orderInfo.orderNumber":1,
			  	"orderEntity.orderInfo.sellerInfo":1
			  };

	// Set CurrentDay-1 with Max and Min Time.
    var tomorrow = new Date();
    tomorrow = new Date(timezoneConversions.toIST(tomorrow));
    tomorrow.setDate(tomorrow.getDate()+1);
    
    tomorrow = new Date(tomorrow).setHours(0, 0, 0, 0);
    var minDate = new Date(timezoneConversions.toUTC(tomorrow));
    //(minDate - ex: IST - 20-01-2016 02:00:00 ==> day-1 ==> 19-01-2016 02:00:00  ==> set hours ==> 19-01-2016 00:00:00 ==> UTC ==> 18-01-2016 18:30:00)

    tomorrow = new Date(tomorrow).setHours(23, 59, 59, 999);
    var maxDate = new Date(timezoneConversions.toUTC(tomorrow));
    
    //(maxDate - ex: IST - 20-01-2016 02:00:00 ==> day-1 ==> 19-01-2016 02:00:00  ==> set hours ==> 19-01-2016 23:59:59 ==> UTC ==> 19-01-2016 18:29:59)

	// Order minimum delivery date is compared against the current date. 
	//(current date - ex: IST - 20-01-2016 02:00:00 ==> 20-01-2016 00:00:00  ==> set hours ==> 19-01-2016 18:30:00)
	
	//To compare weather notification already sent.
	var notificationCurrentDate = new Date(new Date().setHours(0, 0, 0, 0));

	ordersColl.aggregate(
		{ $match: { "orderEntity.orderInfo.orderStatus":{"$nin": ["Pending","Failed","OnHold","Delivered","Cancelled"]}}},	
		{ $unwind: "$orderEntity.orderInfo.sellerInfo" },
		{ $unwind: "$orderEntity.orderInfo.sellerInfo.orderItemInfo" },
		{ $match: { "orderEntity.orderInfo.sellerInfo.orderItemInfo.itemStatus": {"$nin" : ["Pending","Failed","OnHold","Delivered","Cancelled"]}}},
		{ $group: {
			  	_id: {orderNumber: "$orderEntity.orderInfo.orderNumber", sellerId: "$orderEntity.orderInfo.sellerInfo.sellerId"},
			  	orderNumber: {$first: "$orderEntity.orderInfo.orderNumber"},
			  	sellerId: {$first: "$orderEntity.orderInfo.sellerInfo.sellerId"},
			  	minDeliveryDate: {$min: "$orderEntity.orderInfo.sellerInfo.orderItemInfo.minDeliveryDate"},
			  	tomorrowDeliverableOrderNotificationSentOn: {$min: "$orderEntity.orderInfo.sellerInfo.notifications.tomorrowDeliverableNotificationSentOn"}
		  	} 
		}, 
  		function(error, result){
		
		if(!error && result.length > 0)
		{
			logger.debug(TAG + "Retrieved tomorrow deliverable orders successfully on: " + new Date());
			
			// For each tomorrow deliverable Orders retrieve the corresponding sellers and send out an email.
			async.forEachSeries(result,
	 		function(tomorrowDeliverableOrder, asyncCallback){

	 			var orderNumber = tomorrowDeliverableOrder.orderNumber;
	 			var sellerId = tomorrowDeliverableOrder.sellerId;
	 			var minDeliveryDate = tomorrowDeliverableOrder.minDeliveryDate;
	 			var tomorrowDeliverableOrderNotificationSentOn = tomorrowDeliverableOrder.tomorrowDeliverableOrderNotificationSentOn;
	 			var notificationObject = {};
	 			
	 			if( ( ( minDeliveryDate >= minDate ) && ( minDeliveryDate <= maxDate ) )
	 				&& ( tomorrowDeliverableOrderNotificationSentOn === null || tomorrowDeliverableOrderNotificationSentOn < notificationCurrentDate ) ){
	 		
	 				//Fetching supplier details for sending notifications.
 					supplierColl.findOne({"sellerEntity.profileInfo.accountInfo.sellerId": sellerId},{"_id": 0, "sellerEntity.profileInfo.basicInfo": 1,"sellerEntity.profileInfo.accountInfo.sellerId": 1}, function(err, contactInfo) {
						if(!err && (contactInfo !== null)){
							//Call email Service.. send email and sms to seller and email to fulfillment team.
							notificationObject.orderNumber = orderNumber;
							supNotify.sendTomorrowDeliverableOrderEmail(contactInfo, notificationObject, function(err, eResult){
							}); // not checking for errors, All errors will be logged into the log file.
			 			}
			 			else{
			 				logger.error(TAG + "Error retrieving ContactInfo for seller: " + sellerId + " err: " + JSON.stringify(err) + " contactInfo: " + JSON.stringify(contactInfo));
	                    }  	
			 		});

			 		//updating line items of particualr order number and sellerid.
	 				ordersColl.update({"orderEntity.orderInfo.orderNumber": orderNumber,
						"orderEntity.orderInfo.sellerInfo": {$elemMatch: {"sellerId": sellerId}}},
						{ $set: {"orderEntity.orderInfo.sellerInfo.$.notifications.tomorrowDeliverableNotificationSentOn": new Date()}},  function(error, result){

					  	result = JSON.parse(result);
					  	if(error)
					  	{
					  		logger.error(TAG + " Error in updating tomorrow deliverabble notificationSentOn field in order collection for orderNumber: " + orderNumber + ", sellerid : " +sellerId);
					  	}
					  	else if(result.n < 1)
					  	{
					  		logger.debug(TAG + " Cannot update tomorrow deliverabble notificationSentOn field in order collection for orderNumber " + orderNumber + ", sellerid : " +sellerId);
					  	}
					}); 
	 			}
	 			asyncCallback();
	 			
	 		},
	 		//Final Function to be called upon completion of all functions.
			function(error)
			{
			 		
			}
			);
		}
		else if(!error && result.length < 1)
		{
			logger.debug(TAG + "No Delayed Orders found on: " + new Date());
		}
		else
		{
			logger.error(TAG + "Error running DeliveryDate Check on: " + new Date() + " err: " + JSON.stringify(error));
		}	
	});
	}, function () {
    /* This function is executed when the job stops */
  },
  false, /* Start the job right now */
  null /* Time zone of this job. */
);

checkTomorrowDeliverableOrder.start();

/*
// Disabled as requested from TGC to stop sending delayed order emails to support.
//---------------------------------------------------------------------------
// "checkDelayedOrderDeliveryDate" -> Function gets all the Delayed Orders and sends the email to the corresponding sellers and fulfillment Team. 
// Scheduling the Function "checkDelayedOrderDeliveryDate" Everyday at 8 AM (Monday - Sunday)
// sec*  Min* Hours* dayofMonth* month* dayOfWeek*

var checkDelayedOrderDeliveryDate = new CronJob('45 00 03 * * *', function() {

	//Variable for logging the messages to the file.
	var logger = log.logger_jobs;
	logger.info("-------------------------------------------------------");
	logger.info(TAG + "Node CronJob 'checkDelayedOrderDeliveryDate' started on: EST-> " + new Date() + ", IST-> " + timezoneConversions.toIST(new Date()));
	console.log("checkDelayedOrderDeliveryDate started");
	var db = dbConfig.mongoDbConn;
	var ordersColl = db.collection("Orders");
	var supplierColl = db.collection("Supplier");

	// Fileds to be retrieved from Delayed Orders.
	var fields = {"_id": 0,
				"orderEntity.orderInfo.orderNumber":1,
			  	"orderEntity.orderInfo.sellerInfo":1
			  };

	//To get accurate IST Date, Convert to IST timestamp, then convert back to equivalent UTC timestamp, set time to zero to fetch all orders with miminum delivery date as today IST.
	var currentDate = timezoneConversions.toIST(new Date());
	currentDate.setHours(0, 0, 0, 0);
	currentDate = timezoneConversions.toUTC(currentDate);
	//To compare weather notification already sent.
	var notificationCurrentDate = new Date(new Date().setHours(0, 0, 0, 0));

	ordersColl.aggregate(
		{ $match: { "orderEntity.orderInfo.orderStatus":{"$nin": ["Pending","Failed","OnHold","Delivered","Cancelled"]}}},	
		{ $unwind: "$orderEntity.orderInfo.sellerInfo" },
		{ $unwind: "$orderEntity.orderInfo.sellerInfo.orderItemInfo" },
		{ $match: { "orderEntity.orderInfo.sellerInfo.orderItemInfo.itemStatus": {"$nin" : ["Pending","Failed","OnHold","Delivered","Cancelled"]}}},
		{ $group: {
			  	_id: {orderNumber: "$orderEntity.orderInfo.orderNumber", sellerId: "$orderEntity.orderInfo.sellerInfo.sellerId"},
			  	orderNumber: {$first: "$orderEntity.orderInfo.orderNumber"},
			  	sellerId: {$first: "$orderEntity.orderInfo.sellerInfo.sellerId"},
			  	minDeliveryDate: {$min: "$orderEntity.orderInfo.sellerInfo.orderItemInfo.minDeliveryDate"},
			  	delayedNotificationSentOn: {$min: "$orderEntity.orderInfo.sellerInfo.notifications.delayedNotificationSentOn"}
		  	} 
		}, 
  		function(error, result){
		
		if(!error && result.length > 0)
		{
			logger.debug(TAG + "Retrieved delayed Orders successfully on: " + new Date());
			
			// For each delayed Orders retrieve the corresponding sellers and send out an email.
			async.forEachSeries(result,
	 		function(delayedOrder, asyncCallback){

	 			var orderNumber = delayedOrder.orderNumber;
	 			var sellerId = delayedOrder.sellerId;
	 			var minDeliveryDate = delayedOrder.minDeliveryDate;
	 			var delayedNotificationSentOn = delayedOrder.delayedNotificationSentOn;
	 			var notificationObject = {};
	 			if( ( ( minDeliveryDate < currentDate ) )
	 				&& ( delayedNotificationSentOn === null || delayedNotificationSentOn < notificationCurrentDate ) ){
	 				
	 				//Fetching supplier details for sending notifications.
 					supplierColl.findOne({"supplierEntity.identifier.sellerId": sellerId},{"_id": 0, "supplierEntity.contactInfo": 1,"supplierEntity.identifier.sellerId": 1}, function(err, contactInfo) {
						if(!err && (contactInfo !== null)){
							//Call email Service.. send email and sms to seller and email to fulfillment team.
							notificationObject.orderNumber = orderNumber;

							supNotify.sendDelayedOrderEmail(contactInfo, notificationObject, function(err, eResult){
							}); // not checking for errors, All errors will be logged into the log file.
			 			}
			 			else{
			 				logger.error(TAG + "Error retrieving ContactInfo for seller: " + sellerId + " err: " + JSON.stringify(err) + " contactInfo: " + JSON.stringify(contactInfo));
	                    }  	
			 		});

			 		//updating line items of particualr order number and sellerid.
	 				ordersColl.update({"orderEntity.orderInfo.orderNumber": orderNumber,
						"orderEntity.orderInfo.sellerInfo": {$elemMatch: {"sellerId": sellerId}}},
						{ $set: {"orderEntity.orderInfo.sellerInfo.$.notifications.delayedNotificationSentOn": new Date()}},  function(error, result){

					  	result = JSON.parse(result);
					  	if(error)
					  	{
					  		logger.error(TAG + " Error in updating notificationSentOn field in order collection for orderNumber: " + orderNumber + ", sellerid : " +sellerId);
					  	}
					  	else if(result.n < 1)
					  	{
					  		logger.debug(TAG + " Cannot update notificationSentOn field in order collection for orderNumber " + orderNumber + ", sellerid : " +sellerId);
					  	}
					}); 
	 			}
	 			asyncCallback();
	 			
	 		},
	 		//Final Function to be called upon completion of all functions.
			function(error)
			{
			 		
			}
			);
		}
		else if(!error && result.length < 1)
		{
			logger.debug(TAG + "No Delayed Orders found on: " + new Date());
		}
		else
		{
			logger.error(TAG + "Error running DeliveryDate Check on: " + new Date() + " err: " + JSON.stringify(error));
		}	
	});
	}, function () {
    //This function is executed when the job stops //
  },
  false, //Start the job right now
  null //Time zone of this job.
);

checkDelayedOrderDeliveryDate.start();
*/

//---------------------------------------------------------------------------
// "checkNewlyActivatedSuppliers" -> Function sends email and sms to newly activated suppliers.() 
// Scheduling the Function "checkNewlyActivatedSuppliers" Everydat at 10 AM (Monday - Sunday)
// sec*  Min* Hours* dayofMonth* month* dayOfWeek*

var checkNewlyActivatedSuppliers = new CronJob('45 30 03 * * *', function() {
 
    //Variable for logging the messages to the file.
    var logger = log.logger_jobs;
    logger.info("-------------------------------------------------------");
    logger.info(TAG + "Node CronJob 'checkNewlyActivatedSuppliers' started on: EST-> " + new Date() + ", IST-> " + timezoneConversions.toIST(new Date()));
    console.log("checkNewlyActivatedSuppliers started");
	var db = dbConfig.mongoDbConn;
    var supplierColl = db.collection("SellerMaster");

    var dbDate;

    //To compare weather notification already sent.
    var notificationCurrentDate = new Date(new Date().setHours(0, 0, 0, 0));
    
    // Set CurrentDay-1 with Max and Min Time.
    var previousDay = new Date();
    previousDay = new Date(timezoneConversions.toIST(previousDay));
    previousDay.setDate(previousDay.getDate()-1);
    
    previousDay = new Date(previousDay).setHours(0, 0, 0, 0);
    var minDate = new Date(timezoneConversions.toUTC(previousDay));
    //(minDate - ex: IST - 20-01-2016 02:00:00 ==> day-1 ==> 19-01-2016 02:00:00  ==> set hours ==> 19-01-2016 00:00:00 ==> UTC ==> 18-01-2016 18:30:00)

    previousDay = new Date(previousDay).setHours(23, 59, 59, 999);
    var maxDate = new Date(timezoneConversions.toUTC(previousDay));
    //(maxDate - ex: IST - 20-01-2016 02:00:00 ==> day-1 ==> 19-01-2016 02:00:00  ==> set hours ==> 19-01-2016 23:59:59 ==> UTC ==> 19-01-2016 18:29:59)

    // Set CurrentDay-15 with Max and Min Time.
    var previous15Day = new Date();
    previous15Day = new Date(timezoneConversions.toIST(previous15Day));
    previous15Day.setDate(previous15Day.getDate()-15);

    previous15Day = new Date(previous15Day).setHours(0, 0, 0, 0);
    var minDate15 = new Date(timezoneConversions.toUTC(previous15Day));
    //(minDate - ex: IST - 20-01-2016 02:00:00 ==> day-15 ==> 05-01-2016 02:00:00  ==> set hours ==> 05-01-2016 00:00:00 ==> UTC ==> 04-01-2016 18:30:00)

    previous15Day = new Date(previous15Day).setHours(23, 59, 59, 999);
    var maxDate15 = new Date(timezoneConversions.toUTC(previous15Day));
    //(maxDate - ex: IST - 20-01-2016 02:00:00 ==> day-15 ==> 05-01-2016 02:00:00  ==> set hours ==> 05-01-2016 23:59:59 ==> UTC ==> 05-01-2016 18:29:59)

    // Fileds to be retrieved from Delayed Orders.
    var fields = {"_id": 0,
                            "sellerEntity.profileInfo.basicInfo":1
                };

    supplierColl.find({"sellerEntity.sellerTermsInfo.firstTimeLogin": true, "sellerEntity.sellerVerificationStatus": {$ne : "disabled"}},{"_id": 0, "sellerEntity.profileInfo.accountInfo.sellerId": 1, "sellerEntity.profileInfo.basicInfo": 1, "sellerEntity.sellerTermsInfo.lastLoginTime": 1, "sellerEntity.notifications": 1}).toArray(function(error, result){
        if(!error && result.length > 0)
        {
            async.forEachSeries(result,
                function(supplierDetails, asyncCallback){
                    dbDate = supplierDetails.sellerEntity.sellerTermsInfo.lastLoginTime;
                    if( ((dbDate >= minDate && dbDate <= maxDate) ||  (dbDate >= minDate15 && dbDate <= maxDate15)) 
                    	&& ( supplierDetails.sellerEntity.notifications === undefined || supplierDetails.sellerEntity.notifications.userActivationNotificationSentOn === undefined || supplierDetails.sellerEntity.notifications.userActivationNotificationSentOn < notificationCurrentDate ) )
                    {
                        logger.debug(TAG + "Newly activated suppliers found on: " + new Date());
                        
                        supNotify.notifySupplierActivation(supplierDetails, function(err, result){
                        });

                        //Updating "notificationSentOn" field to current datetime.
                        supplierColl.update({"sellerEntity.profileInfo.accountInfo.sellerId": supplierDetails.sellerEntity.profileInfo.accountInfo.sellerId}, {$set: {"sellerEntity.notifications.userActivationNotificationSentOn": new Date()}}, function(error, result){

						  	result = JSON.parse(result);
						  	if(error)
						  	{
						  		logger.error(TAG + " Error in updating notificationSentOn field in supplier collection for supplierid " + supplierDetails.sellerEntity.profileInfo.accountInfo.sellerId);
						  	}
						  	else if(result.n < 1)
						  	{
						  		logger.debug(TAG + " Cannot update notificationSentOn field in supplier collection for supplierid " + supplierDetails.sellerEntity.profileInfo.accountInfo.sellerId);
						  	}
						});

                    }
                    return asyncCallback();
                },
                //Final Function to be called upon completion of all functions.
                function(error){

                }
            );
        }
        else if(!error && result.length < 1)
        {
            logger.debug(TAG + "No Newly activated suppliers found on "+new Date());
        }
        else
        {
            logger.error(TAG + "Error finding Newly activated suppliers, err: " + JSON.stringify(error));
        }
    });


  }, function () {
    /* This function is executed when the job stops */
  },
  false, /* Start the job right now */
  null /* Time zone of this job. */
);

checkNewlyActivatedSuppliers.start();

//---------------------------------------------------------------------------
//RFQ Suppliers
// "checkNewlyActivatedRFQSuppliers" -> Function sends email and sms to newly activated RFQ suppliers
// Scheduling the Function "checkNewlyActivatedRFQSuppliers" Everydat at 10.15 AM (Monday - Sunday)
// sec*  Min* Hours* dayofMonth* month* dayOfWeek*

var checkNewlyActivatedRFQSuppliers = new CronJob('45 45 03 * * *', function() {
 
    //Variable for logging the messages to the file.
    var logger = log.logger_jobs;
    logger.info("-------------------------------------------------------");
    logger.info(TAG + "Node CronJob for RFQ Auth 'checkNewlyActivatedRFQSuppliers' started on: EST-> " + new Date() + ", IST-> " + timezoneConversions.toIST(new Date()));
    console.log("checkNewlyActivatedRFQSuppliers started");
	var db = dbConfig.mongoDbConn;
    var supplierColl = db.collection("SellerMaster");
    var dbDate;

    //To compare weather notification already sent.
    var notificationCurrentDate = new Date(new Date().setHours(0, 0, 0, 0));
    
    // Set CurrentDay-1 with Max and Min Time.
    var previousDay = new Date();
    previousDay = new Date(timezoneConversions.toIST(previousDay));
    previousDay.setDate(previousDay.getDate()-1);
    
    previousDay = new Date(previousDay).setHours(0, 0, 0, 0);
    var minDate = new Date(timezoneConversions.toUTC(previousDay));
    //(minDate - ex: IST - 20-01-2016 02:00:00 ==> day-1 ==> 19-01-2016 02:00:00  ==> set hours ==> 19-01-2016 00:00:00 ==> UTC ==> 18-01-2016 18:30:00) 

    previousDay = new Date(previousDay).setHours(23, 59, 59, 999);
    var maxDate = new Date(timezoneConversions.toUTC(previousDay));
    //(maxDate - ex: IST - 20-01-2016 02:00:00 ==> day-1 ==> 19-01-2016 02:00:00  ==> set hours ==> 19-01-2016 23:59:59 ==> UTC ==> 19-01-2016 18:29:59)

    // Set CurrentDay-15 with Max and Min Time.
    var previous15Day = new Date();
    previous15Day = new Date(timezoneConversions.toIST(previous15Day));
    previous15Day.setDate(previous15Day.getDate()-15);

    previous15Day = new Date(previous15Day).setHours(0, 0, 0, 0);
    var minDate15 = new Date(timezoneConversions.toUTC(previous15Day));
    //(minDate - ex: IST - 20-01-2016 02:00:00 ==> day-15 ==> 05-01-2016 02:00:00  ==> set hours ==> 05-01-2016 00:00:00 ==> UTC ==> 04-01-2016 18:30:00)

    previous15Day = new Date(previous15Day).setHours(23, 59, 59, 999);
    var maxDate15 = new Date(timezoneConversions.toUTC(previous15Day));
    //(maxDate - ex: IST - 20-01-2016 02:00:00 ==> day-15 ==> 05-01-2016 02:00:00  ==> set hours ==> 05-01-2016 23:59:59 ==> UTC ==> 05-01-2016 18:29:59)

    // Fileds to be retrieved from Delayed Orders.
    var fields = {"_id": 0,
                            "sellerEntity.profileInfo.basicInfo":1
                };

    supplierColl.find({"sellerEntity.sellerTermsInfo.firstTimeLogin": true, "sellerEntity.sellerVerificationStatus": {$ne : "disabled"}, "sellerEntity.sellerAccessInfo.hasEnquiryAccess": true},{"_id": 0, "sellerEntity.profileInfo.accountInfo.sellerId": 1, "sellerEntity.profileInfo.basicInfo": 1, "sellerEntity.sellerTermsInfo.lastLoginTime": 1, "sellerEntity.notifications": 1}).toArray(function(error, result){
        if(!error && result.length > 0)
        {
            async.forEachSeries(result,
                function(supplierDetails, asyncCallback){
                    dbDate = supplierDetails.sellerEntity.sellerTermsInfo.lastLoginTime;
                    if( ((dbDate >= minDate && dbDate <= maxDate) ||  (dbDate >= minDate15 && dbDate <= maxDate15)) 
                    	&& ( supplierDetails.sellerEntity.notifications === undefined || supplierDetails.sellerEntity.notifications.userActivationNotificationSentOn === undefined || supplierDetails.sellerEntity.notifications.userActivationNotificationSentOn < notificationCurrentDate ) )
                    {
                        logger.debug(TAG + "Newly RFQ activated suppliers found on: " + new Date());
                        
                        supNotify.notifyRFQSupplierActivation(supplierDetails, function(err, result){
                        });

                        //Updating "notificationSentOn" field to current datetime.
                        supplierColl.update({"sellerEntity.profileInfo.accountInfo.sellerId": supplierDetails.sellerEntity.profileInfo.accountInfo.sellerId}, {$set: {"sellerEntity.notifications.userActivationNotificationSentOn": new Date()}}, function(error, result){

						  	result = JSON.parse(result);
						  	if(error)
						  	{
						  		logger.error(TAG + " Error in updating notificationSentOn field in supplier collection for supplierid " + supplierDetails.sellerEntity.profileInfo.accountInfo.sellerId);
						  	}
						  	else if(result.n < 1)
						  	{
						  		logger.debug(TAG + " Cannot update notificationSentOn field in supplier collection for supplierid " + supplierDetails.sellerEntity.profileInfo.accountInfo.sellerId);
						  	}
						});

                    }
                    return asyncCallback();
                },
                //Final Function to be called upon completion of all functions.
                function(error){

                }
            );
        }
        else if(!error && result.length < 1)
        {
            logger.debug(TAG + "No Newly RFQ activated suppliers found on "+new Date());
        }
        else
        {
            logger.error(TAG + "Error finding Newly RFQ activated suppliers, err: " + JSON.stringify(error));
        }
    });


  }, function () {
    /* This function is executed when the job stops */
  },
  false, /* Start the job right now */
  null /* Time zone of this job. */
);

checkNewlyActivatedRFQSuppliers.start();