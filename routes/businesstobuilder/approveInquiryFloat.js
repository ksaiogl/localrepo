var TAG = "approveInquiryFloat.js - ";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var async = require('async');
var timezoneConversions = require('../helpers/timezoneConversions.js');
var rfqNotifications = require('./rfqNotifications.js');

//Function to approve Inquiry floated to Supplier.
exports.approveFloat = function approveFloat (req, callback){	
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;
	logger.info(ip + " " + TAG + "#####Request for approveFloat.######");
	//Log the request.
	logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));
	//Declare the response
	var resJson;
try
{	
	//Validate the request.
	if ( !(	req.body === null || req.body.inquiryId === undefined || 
			req.body.inquiryId === null || req.body.inquiryId.toString().trim().length === 0 || 
			req.body.inquiryVersion === undefined || req.body.inquiryVersion === null || 
			req.body.inquiryVersion.toString().trim().length === 0 
			))
	{
		var inquiryId = req.body.inquiryId;
		var inquiryVersion = req.body.inquiryVersion;

		var inquirySellerFloatColl = db.collection("InquirySellerFloat");

	  	inquirySellerFloatColl.findOne({"inquirySellerEntity.inquiryId": inquiryId, "inquirySellerEntity.inquiryVersion": inquiryVersion},{}, function(error, results){
		  	if(!error && results !== null)
		  	{
				var inquiryStatus = results.inquirySellerEntity.inquiryStatus;
				var assignedSellersCount = results.inquirySellerEntity.sellers.length;

				//validate inquiryStatus before approval.
		  		if( inquiryStatus === "EditInProgress" || inquiryStatus === "PendingApproval" || assignedSellersCount > 0)
		  		{	
		  			if(assignedSellersCount > 0){
		  				//update InquiryStatus
		  				updateInquiryStatus(inquiryId, inquiryVersion, function(err, results){
							if(!err)
							{
								logger.debug(TAG + "Inquiry Status updated and inquiry floated successfully for inquiryId: " + inquiryId + " ,inquiryVersion: " + inquiryVersion);
								resJson = {
								    "http_code" : "200",
									"message" : "Inquiry approved successfully."
								};

								//calling function that will notify all sellers associated with inquiry.
								NotifySeller(req, function(){

								});

								return callback(false, resJson);
							}
							else
							{
								logger.error(TAG + "Error -Failed to update Inquiry Status for inquiryId: " + inquiryId + " ,inquiryVersion: " + inquiryVersion + ", err: " + err);
								resJson = {
								    "http_code" : "500",
									"message" : "Error updating Enquiry status, Please retry.."
								};
								return callback(true, resJson);
							}	
						});
		  			}
		  			else{
		  				logger.error(TAG + "Error - sellers not yet assigned, Inquiry Status for inquiryId: " + inquiryId + " ,inquiryVersion: " + inquiryVersion);
						resJson = {
						    "http_code" : "500",
							"message" : "Enquiry not assigned to Suppliers, Please add suppliers and retry.."
						};
						return callback(true, resJson);
		  			}
				}
				else
				{
					logger.error(TAG + "Error - Inquirystatus is not in EditInProgress or  PendingApproval or sellers not yet assigned, Inquiry Status for inquiryId: " + inquiryId + " ,inquiryVersion: " + inquiryVersion + ", inquiryStatus: " + inquiryStatus);
					resJson = {
					    "http_code" : "500",
						"message" : "Enquiry is already Approved or not assigned to Suppliers, Please retry.."
					};
					return callback(true, resJson);
				}	
			}
			else
			{
				logger.error(TAG + "Error -Failed to query Inquiry Status for inquiryId: " + inquiryId + " ,inquiryVersion: " + inquiryVersion + ", error: " + error);
				resJson = {
				    "http_code" : "500",
					"message" : "Error updating Enquiry status, Please retry.."
				};
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
		logger.error(TAG + "Bad or ill-formed request. reqBody: " + JSON.stringify(req.body));
		return callback(true, resJson);
	}	
}
catch(e)
{
  console.log(TAG + "Exception in approveFloat- " + e);
  logger.error(TAG + "Exception in approveFloat:- error :" + e);
  resJson = {
			    "http_code" : "500",
				"message" : "Server Error. Please try again."
		};
  return callback(true, resJson);
}
};


//Function to updateInquiryStatus in InquiryMaster and InquirySellerFloat after Floating to Supplier.
function updateInquiryStatus(inquiryId, inquiryVersion, callback){
  
  var db = dbConfig.mongoDbConn;

  var inquiryMasterColl = db.collection("InquiryMaster");
  var inquiryFloatColl = db.collection("InquirySellerFloat");
  //Variable for Logging the messages to the file.
  var logger = log.logger_rfq;
  //Update status post Approval of Supplier Float.
  var status = "EnquirySent";
  var floatstatus = "EnquirySent";
	async.parallel([
		function(asyncCallback){

			//update the status in MasterInquiry collection
			inquiryMasterColl.update({"inquiryEntity.inquiryId": inquiryId, "inquiryEntity.inquiryVersion": inquiryVersion},
				{"$set": {"inquiryEntity.inquiryStatus": status}},function(err, result) {
				if(!err && result.result.n > 0)
				{
					logger.debug(TAG + "inquiryStatus updated in InquiryMaster successfully for inquiryId: " + inquiryId);
					return asyncCallback(false, null);
				}
				else if(!err && result.result.n < 1)
			  	{
			  		logger.error(TAG + " Record Not Found - Failed Updating inquiryStatus in InquiryMaster for inquiryId: "+ inquiryId);
					return asyncCallback(false, "Record Not Found");
			  	}
				else
				{
					logger.error(TAG + " Error updating inquiryStatus in InquiryMaster collection for inquiryId: " + inquiryId + " err: " + err);
					return asyncCallback(true, err);
				}
			});
		},
		function(asyncCallback){
			//update the status in InquirySellerFloat collection
			inquiryFloatColl.findOne({"inquirySellerEntity.inquiryId": inquiryId, "inquirySellerEntity.inquiryVersion": inquiryVersion},
					{"inquirySellerEntity.sellers": 1},function(error, results) {
				if(!error && results !== null)
				{			
					var sellers = results.inquirySellerEntity.sellers;
					for(var i = 0; i < sellers.length; i++)
					{
						sellers[i].status = floatstatus;
					}	

					inquiryFloatColl.update({"inquirySellerEntity.inquiryId": inquiryId, "inquirySellerEntity.inquiryVersion": inquiryVersion},
						{"$set": {"inquirySellerEntity.inquiryStatus": floatstatus, "inquirySellerEntity.sellers": sellers}},function(err, result) {
						if(!err && result.result.n > 0)
						{
							logger.debug(TAG + "inquiryStatus updated in inquiryFloatColl successfully for inquiryId: " + inquiryId);
							return asyncCallback(false, null);
						}
						else if(!err && result.result.n < 1)
					  	{
					  		logger.error(TAG + " Record Not Found - Failed Updating inquiryStatus in inquiryFloatColl for inquiryId: "+ inquiryId);
							return asyncCallback(false, "Record Not Found");
					  	}
						else
						{
							logger.error(TAG + " Error updating inquiryStatus in inquiryFloatColl collection for inquiryId: " + inquiryId + " err: " + err);
							return asyncCallback(true, err);
						}
					});	
				}
				else
				{
					logger.error(TAG + " Error updating inquiryStatus in inquiryFloatColl collection for inquiryId: " + inquiryId + " err: " + error);
					return asyncCallback(true, error);
				}
			});		
		}
	],
	//Final function that will be called by functions defined in Parallel.
	function(error, results){
		if(!error)
		{
			return callback(false, "Updated successfully");
		}
		else
		{
			return callback(true, results);
		}
	});
}

//Function that will trigger notifications to seller regarding inquiry float.
function NotifySeller(req, callback){
	var db = dbConfig.mongoDbConn;

	var inquiryMasterColl = db.collection("InquiryMaster");
	var inquiryFloatColl = db.collection("InquirySellerFloat");
	var rfqCityPurchaseManagersEmailsColl = db.collection("RfqCityPurchaseManagersEmails");

	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;

	//Get inquiry master data.
	inquiryMasterColl.findOne({"inquiryEntity.inquiryId": req.body.inquiryId, "inquiryEntity.inquiryVersion": req.body.inquiryVersion},
			{},function(error, result) {
		if(!error && result !== null)
		{			
			logger.debug(TAG + " successfully fetched data from InquiryMaster collection for inquiryId: " + req.body.inquiryId + ", inquiryVersion "+req.body.inquiryVersion);
			var inquiryDetails = result;

			//Get inquiry seller data.
			inquiryFloatColl.findOne({"inquirySellerEntity.inquiryId": req.body.inquiryId, "inquirySellerEntity.inquiryVersion": req.body.inquiryVersion},
				{},function(error, sellerResult) {
				if(!error && sellerResult !== null)
				{
					logger.debug(TAG + " successfully fetched data from InquirySellerFloat collection for inquiryId: " + req.body.inquiryId + ", inquiryVersion "+req.body.inquiryVersion);
					
					//Get city purchase managers email id's.
					rfqCityPurchaseManagersEmailsColl.findOne({"contanctInfo.city": inquiryDetails.inquiryEntity.inquiryCity}, {}, function(error, result){
						var purchaseManagersEmail = [];
						if(!error && result !== null){
							purchaseManagersEmail = result.contanctInfo.emailids;
						}
						else{
							logger.error(TAG + " Error while fetching purchase manager emails from RfqCityPurchaseManagersEmails collection for city: " + inquiryDetails.inquiryEntity.inquiryCity);
						}

						async.each(sellerResult.inquirySellerEntity.sellers,
						function(sellerData, callback){

							rfqNotifications.notifySuppliersOnFloatEnquiry(inquiryDetails, sellerData, purchaseManagersEmail, function(error, result){
								if(error){
									return callback(false);
								}
								else{
									return callback(false);
								}		
							});
							
						}, function(error){
							logger.debug(TAG + " sending notifications for sellers on inquiry float is completed for inquiryId " + req.body.inquiryId + ", inquiryVersion "+req.body.inquiryVersion);
						});
					});
				}
				else
				{
					logger.error(TAG + " Error Fetching data from InquirySellerFloat collection for inquiryId: " + req.body.inquiryId + ", inquiryVersion "+req.body.inquiryVersion+", err: " + error);
					
				}
			});	
		}
		else
		{
			logger.error(TAG + " Error Fetching data from InquiryMaster collection for inquiryId: " + req.body.inquiryId + ", inquiryVersion "+req.body.inquiryVersion+", err: " + error);
			return callback(true);
		}
	});		
}