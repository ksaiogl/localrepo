var TAG = "updateSellerQuotationStatus.js - ";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');

//Function for Fetching the mSupply Suppliers.
exports.updateQuotationStatus = function updateQuotationStatus (req, callback){	
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;
	logger.info(ip + " " + TAG + "#####Request for updateQuotationStatus.######");
	//Log the request.
	logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));
	//Declare the response
	var resJson;
	var inquirySellerFloatColl = db.collection("InquirySellerFloat");

	try
	{	
		//Validate the request.
		if ( !(	req.body === null || req.body.inquiryId === undefined || req.body.inquiryId === null || 
				req.body.inquiryId.toString().trim().length === 0 || 
				req.body.inquiryVersion === undefined || req.body.inquiryVersion === null || 
				req.body.inquiryVersion.toString().trim().length === 0 ||
				req.body.sellerId === undefined || req.body.sellerId === null || 
				req.body.sellerId.toString().trim().length === 0 || req.body.sellerQuotationStatus === undefined || 
				req.body.sellerQuotationStatus === null || 
				req.body.sellerQuotationStatus.toString().trim().length === 0
			))
		{
			//validate the status before updating.
			if(req.body.sellerQuotationStatus === "IntentToQuote" || 
				req.body.sellerQuotationStatus === "NotIntentToQuote")
			{	
				var inquiryId = req.body.inquiryId;
				var inquiryVersion = req.body.inquiryVersion;
				//var sellerId = req.body.sellerId;
				var sellerId = req.body.supplierSession.sellerEntity.profileInfo.accountInfo.sellerId;
        		logger.debug(TAG + " sellerId from Session: "+ sellerId);
				var sellerQuotationStatus = req.body.sellerQuotationStatus;

				inquirySellerFloatColl.findOne({"inquirySellerEntity.inquiryId": inquiryId, "inquirySellerEntity.inquiryVersion": inquiryVersion,
				"inquirySellerEntity.sellers.sellerId": sellerId},{"inquirySellerEntity.sellers.$":1}, function(error, results){
				  	if(!error && results !== null)
				  	{
				  		var sellers = results.inquirySellerEntity.sellers[0];
				  		var currentStatus = sellers.status;
				  		if(currentStatus === "EnquirySent")
				  		{	
							//update the Inquiry collection with Seller Details to whom Inquiry will be sent.
							inquirySellerFloatColl.update({"inquirySellerEntity.inquiryId": inquiryId, "inquirySellerEntity.inquiryVersion": inquiryVersion,
								"inquirySellerEntity.sellers": {$elemMatch: {"sellerId": sellerId}}},
								{"$set": {"inquirySellerEntity.sellers.$.lastUpdatedDate": new Date(), "inquirySellerEntity.sellers.$.status": sellerQuotationStatus}},function(err, result) {
								if(!err && result.result.n > 0)
								{
									logger.debug(TAG + "sellers Quotation status updated successfully for inquiryId: " + inquiryId + " ,inquiryVersion: " + inquiryVersion + " ,sellerId: " + sellerId);
						            resJson = {
										    "http_code" : "200",
											"message" : "sellers Quotation status updated successfully."
									};
									return callback(false, resJson);
								}
								else if(!err && result.result.n < 1)
							  	{
							  		logger.error(TAG + " Record Not Found - Failed Updating Quotation status for inquiryId: "+ inquiryId  + " ,inquiryVersion: " + inquiryVersion + " ,sellerId: " + sellerId);
							  		resJson = {
										    "http_code" : "500",
											"message" : "Record Not Found - Error updating Quotation status, Please retry.."
									};
									return callback(true, resJson);
							  	}
								else
								{
									logger.error(TAG + " Error updating Quotation status for inquiryId: " + inquiryId +  + " ,inquiryVersion: " + inquiryVersion + " ,sellerId: " + sellerId + " err: " + err);
									resJson = {
										    "http_code" : "500",
											"message" : "Error updating Quotation status, Please retry.."
									};
									return callback(true, resJson);
								}
							});
						}
						else
						{
							logger.error(ip + " " + TAG + "Inquiry status is not in 'New'. seller: " + sellerId + " and InquiryId: " + inquiryId + ", Current Inquiry Status: " + currentStatus);
							resJson = {
						    "http_code" : "500",
							"message" : "Enquiry is either expired or disabled to quote."
							};
							return callback(true, resJson);
						}	
					}
					else
					{
						logger.error(TAG + " Error quirying Float collection, for inquiryId: " + inquiryId +  + " ,inquiryVersion: " + inquiryVersion + " ,sellerId: " + sellerId + " err: " + error);
						resJson = {
							    "http_code" : "500",
								"message" : "Error updating Quotation status, Please retry.."
						};
						return callback(true, resJson);
					}	
				});	
			}
			else
			{
				resJson = {
				    "http_code" : "400",
					"message" : "Bad request, " + req.body.sellerQuotationStatus +" is not a valid status."
				};
				logger.error(TAG + "Bad or ill-formed request, " + req.body.sellerQuotationStatus +" is not a valid status." + "reqBody: " + JSON.stringify(req.body));
				return callback(true, resJson);
			}	
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
	  console.log(TAG + "Exception in updateQuotationStatus- " + e);
	  logger.error(TAG + "Exception in updateQuotationStatus:- error :" + e);
	  resJson = {
				    "http_code" : "500",
					"message" : "Server Error. Please try again."
			};
	  return callback(true, resJson);
	}
};	