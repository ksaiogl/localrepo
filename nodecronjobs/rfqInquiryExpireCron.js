var TAG = "rfqInquiryExpireCron - ";
// The JS file is required in app.js, so that the page is loaded on start and function is invoked for the First time.
var async = require('async');
var CronJob = require('cron').CronJob;

var emailsConfig = require('../routes/helpers/emailIdConfig.js');
var env = require('../Environment/env.js').env;
var dbConfig = require('../Environment/mongoDatabase.js');
var log = require('../Environment/log4js.js');
var timezoneConversions = require('../routes/helpers/timezoneConversions.js');

//---------------------------------------------------------------------------
// "expireInquiry" -> Function gets all the inquiries raised till now and check for deactivation datetime, if deactivation datetime
// is less than time at which this cron jobs runs that particualr enquiry status will be updated to "Expired" same will be updated for
// enquiry in InquirySellerFloat collection. 
// Scheduling the Function "rfqInquiryExpireCron" Everyday at 1:00 AM (Monday - Sunday)
// sec*  Min* Hours* dayofMonth* month* dayOfWeek*

var expireInquiry = new CronJob('00 30 19 * * *', function() {

	var logger = log.logger_jobs;
	logger.info("-------------------------------------------------------");
	logger.info(TAG + "Node CronJob 'rfqInquiryExpireCron' started on: EST-> " + new Date() + ", IST-> " + timezoneConversions.toIST(new Date()));
	
	var db = dbConfig.mongoDbConn;	
	var inquiryMasterColl = db.collection("InquiryMaster");
	var notifyCol = db.collection("RfqCronJobsCounter");

	//To compare weather notification already sent.
	var notificationCurrentDate = new Date(new Date().setHours(0, 0, 0, 0));

	notifyCol.find({}).toArray(function(error, result){
		if(error)
		{
			logger.error(TAG + " data access from RfqCronJobsCounter collection failed.");
			logger.info(TAG + " Node CronJob 'rfqInquiryExpireCron' stopped.");
		}
		else if(!error && result.length > 0)
		{
			logger.debug(TAG + " data access from RfqCronJobsCounter collection successfull.");
			logger.debug(TAG + " checking weather cron job is alredy executed or not.");

			if(result[0].CronJobsCounter.rfqInquiryExpireCron === null || result[0].CronJobsCounter.rfqInquiryExpireCron < notificationCurrentDate){
				
				logger.debug(TAG + " cron job not yet executed.");
				logger.debug(TAG + " started executing rfqInquiryExpireCron.");
				//updating field rfqInquiryExpireCron to keep track of weather this report is alredy sent or not. 
				notifyCol.update({}, {$set :{"CronJobsCounter.rfqInquiryExpireCron": new Date()}}, function(error, result){
					if(error){
						logger.error(TAG + " error in updating rfqInquiryExpireCron field in RfqCronJobsCounter.");
					}
					else{
						logger.debug(TAG + " rfqInquiryExpireCron field in RfqCronJobsCounter updated successfull.");
					}
				});

				logger.debug(TAG + " fetching all records from InquiryMaster collection.");
				
				var currentDate = new Date();
				//date.setDate(date.getDate() + 1);
				currentDate.setHours(18, 30, 30, 999);
				var currentDatePlusOne = new Date();
				currentDatePlusOne.setDate(currentDate.getDate() + 1);
				currentDatePlusOne.setHours(18, 30, 30, 999);

				console.log("In filtering.");
				console.log("currentDate :"+currentDate);
				console.log("currentDate :"+currentDatePlusOne);

				inquiryMasterColl.find({
				  $and:
				  [
					  {
						"inquiryEntity.respondByDate" : {
							$lte: currentDatePlusOne
						}
					  },
					  {
						"inquiryEntity.inquiryStatus": {
						  $ne: "Inactive"
						 }	
					  },
					  {
						"inquiryEntity.inquiryStatus": {
						  $ne: "Expired"
						 }	
					  }
				  ]
				}).toArray(function(error, result){
					if(error){
						logger.error(TAG + " Error while fetching inquiry details from InquiryMaster collection, Error :"+error);
						logger.info(TAG + " Node CronJob 'rfqInquiryExpireCron' stopped.");
					}
					else if(result.length < 1) {
						logger.error(TAG + "  There is no data in InquiryMaster collection.");
						logger.info(TAG + " Node CronJob 'rfqInquiryExpireCron' stopped.");
					}
					else{
						logger.info(TAG + " Data found in InquiryMaster collection.");
						
						async.eachSeries(result, function(inquiryDoc, asyncCallback){
							udpateInquiryMasterCollection(inquiryDoc, function(error, result){
								if(error){
									//If error occured for this inquiryid while updating in InquiryMaster collection,
									//Not updating status in InquirySellerFloat collection, continuing with next inquiryid.
									return asyncCallback();
								}
								else{
									inquiryDoc.inquiryEntity["expiringToday"] = result.expiringToday;
									udpateInquirySellerFloatCollection(inquiryDoc, function(error, result){
										return asyncCallback();
									});
								}
							});
						}, function(error){   //Final function of async eachSeries.
							if(error){
								logger.error(TAG + "  Node CronJob 'rfqInquiryExpireCron' stopped by error.");
							}
							else{
								logger.debug(TAG + "  Node CronJob 'rfqInquiryExpireCron' executed successfully.");
							}
						});
					}
				});
			}
			else{
				logger.debug(TAG + " cron job alredy executed.");
				logger.info(TAG + " Node CronJob 'rfqInquiryExpireCron' stopped.");
			}
		}
	});	
});

//Function that will update fields in InquiryMaster collection.
function udpateInquiryMasterCollection(obj, callback){
	var logger = log.logger_jobs;
	var db = dbConfig.mongoDbConn;	
	var inqMasterResObj = {
		"expiringToday": false
	}

	logger.debug(TAG +"started updating InquiryMaster collection.");

	var inquiryMasterColl = db.collection("InquiryMaster");	

	var currentDate = new Date();
	//date.setDate(date.getDate() + 1);
	currentDate.setHours(18, 30, 30, 999);
	var currentDatePlusOne = new Date();
	currentDatePlusOne.setDate(currentDate.getDate() + 1);
	currentDatePlusOne.setHours(18, 30, 30, 999);

	console.log("In update inquiry master, "+obj.inquiryEntity.inquiryId);
	console.log("currentDate :"+currentDate);
	console.log("currentDate :"+currentDatePlusOne);

	if(obj.inquiryEntity.respondByDate <= currentDate){
		//updating inquiry status to expired and lastupdated timestamp.
		inquiryMasterColl.update({
		  "inquiryEntity.inquiryId": obj.inquiryEntity.inquiryId,
		  "inquiryEntity.inquiryVersion": obj.inquiryEntity.inquiryVersion
		}, 
		{
		  $set: {
		  	"inquiryEntity.expiringToday": false,
			"inquiryEntity.inquiryStatus": "Expired",
			"inquiryEntity.lastUpdatedDate": new Date()	
		  }
		}, function(error, result){
			if(error){
				logger.error(TAG + " error in updating inquiryStatus,lastUpdatedDate field in InquiryMaster for inquiryId :"+obj.inquiryEntity.inquiryId+", version: "+obj.inquiryEntity.inquiryVersion);
				return callback(true);
			}
			else{
				inqMasterResObj.expiringToday = false;
				logger.debug(TAG + " inquiryStatus,lastUpdatedDate field in InquiryMaster updated successfull for inquiryId :"+obj.inquiryEntity.inquiryId+", version: "+obj.inquiryEntity.inquiryVersion);
				return callback(false, inqMasterResObj);
			}
		});
	}
	


	if(currentDate < obj.inquiryEntity.respondByDate && obj.inquiryEntity.respondByDate <= currentDatePlusOne){
		//updating inquiry status to expired and lastupdated timestamp.
		inquiryMasterColl.update({
		  "inquiryEntity.inquiryId": obj.inquiryEntity.inquiryId,
		  "inquiryEntity.inquiryVersion": obj.inquiryEntity.inquiryVersion
		}, 
		{
		  $set: {
			"inquiryEntity.expiringToday": true,
			"inquiryEntity.lastUpdatedDate": new Date()	
		  }
		}, function(error, result){
			if(error){
				logger.error(TAG + " error in updating inquiryStatus,lastUpdatedDate field in InquiryMaster for inquiryId :"+obj.inquiryEntity.inquiryId+", version: "+obj.inquiryEntity.inquiryVersion);
				return callback(true);
			}
			else{
				inqMasterResObj.expiringToday = true;
				logger.debug(TAG + " inquiryStatus,lastUpdatedDate field in InquiryMaster updated successfull for inquiryId :"+obj.inquiryEntity.inquiryId+", version: "+obj.inquiryEntity.inquiryVersion);
				return callback(false, inqMasterResObj);
			}
		});
	}
}

//Function that will update fields in InquirySellerFloat collection.
function udpateInquirySellerFloatCollection(obj, callback){
	var logger = log.logger_jobs;
	var db = dbConfig.mongoDbConn;	

	logger.debug(TAG +" started updating InquirySellerFloat collection.");

	var inquirySellerFloatColl = db.collection("InquirySellerFloat");	

	inquirySellerFloatColl.find({
	 $and: [
		  {
			"inquirySellerEntity.inquiryId" : obj.inquiryEntity.inquiryId
		  },
		  {
			"inquirySellerEntity.inquiryVersion" : obj.inquiryEntity.inquiryVersion
		  }
	  ]
	}).toArray(function(error, result){
		if(error){
			logger.error(TAG + " Error while fetching inquiry details from InquirySellerFloat collection, Error :"+error);
			return callback(true);
		}
		else if(result.length < 1) {
			logger.error(TAG + "  There is no data in InquirySellerFloat collection.");
			return callback(true);
		}
		else{
			logger.info(TAG + " Data found in InquirySellerFloat collection.");

			if(obj.inquiryEntity.expiringToday){

				//updating inquiry status to expired and lastupdated timestamp.
				inquirySellerFloatColl.update(
				{
				  "inquirySellerEntity.inquiryId": obj.inquiryEntity.inquiryId,
				  "inquirySellerEntity.inquiryVersion": obj.inquiryEntity.inquiryVersion
				}, 
				{
				  $set: {
					"inquirySellerEntity.expiringToday": obj.inquiryEntity.expiringToday,
					"inquirySellerEntity.lastUpdatedDate": new Date()	
				  }
				}, function(error, result){
					if(error){
						logger.error(TAG + " error in updating lastUpdatedDate,expiringToday field in InquirySellerFloat for inquiryId :"+obj.inquiryEntity.inquiryId+", inquiry version :"+obj.inquiryEntity.inquiryVersion);
						return callback(true);
					}
					else{
						logger.debug(TAG + " lastUpdatedDate,expiringToday field in InquirySellerFloat updated successfull for inquiryId :"+obj.inquiryEntity.inquiryId+", inquiry version :"+obj.inquiryEntity.inquiryVersion);
						return callback(false);
					}
				});
			}
			else{
				//updating seller status.
				// var sellers = result[0].inquirySellerEntity.sellers;
				// for(var i = 0; i < sellers.length; i++){
				// 	if(sellers[i].status === "New" || sellers[i].status === "IntentToQuote"){
				// 		sellers[i].status = "Expired";
				// 	}
				// }

				//updating inquiry status to expired and lastupdated timestamp.
				inquirySellerFloatColl.update(
				{
				  "inquirySellerEntity.inquiryId": obj.inquiryEntity.inquiryId,
				  "inquirySellerEntity.inquiryVersion": obj.inquiryEntity.inquiryVersion
				}, 
				{
				  $set: {
					"inquirySellerEntity.inquiryStatus": "Expired",
					//"inquirySellerEntity.sellers": sellers,
					"inquirySellerEntity.expiringToday": obj.inquiryEntity.expiringToday,
					"inquirySellerEntity.lastUpdatedDate": new Date()	
				  }
				}, function(error, result){
					if(error){
						logger.error(TAG + " error in updating inquiryStatus,lastUpdatedDate,expiringToday field in InquirySellerFloat for inquiryId :"+obj.inquiryEntity.inquiryId+", inquiry version :"+obj.inquiryEntity.inquiryVersion);
						return callback(true);
					}
					else{
						logger.debug(TAG + " inquiryStatus,lastUpdatedDate,expiringToday field in InquirySellerFloat updated successfull for inquiryId :"+obj.inquiryEntity.inquiryId+", inquiry version :"+obj.inquiryEntity.inquiryVersion);
						return callback(false);
					}
				});
			}
		}
	});	
}
expireInquiry.start();

