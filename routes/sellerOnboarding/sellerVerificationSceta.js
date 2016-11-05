var TAG = "sellerVerification.js";

var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var s3 = require('../../Environment/s3configuration.js');
var sellerNotification = require('./sellerNotification.js');


//Function for Searching the Seller.
exports.searchSeller =
function searchSeller (req, callback){
	
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;

	//Variable for Mongo DB Connection.
	var db = dbConfig.mongoDbConn;

	//Variable for Logging the messages to the file.
	var logger = log.logger_seller;

	logger.info(ip + " " + TAG + " Entering Search Seller Service.");

	//Log the request.
	logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));

	//Declare the response
	var resJson;
	
	//Validate the request.
	if ( !(	req === null || 
			req.body === null ||
			req.body.searchText === null ||
			req.body.searchText === undefined ||
			req.body.searchText.toString().trim().length === 0)) {
		
		var searchText = req.body.searchText;
		
		var colSeller = db.collection("SellerMaster");
		
		var sellerDetails = [];
		
		colSeller.aggregate([{$match:{$or:[{"sellerEntity.profileInfo.basicInfo.companyInfo.companyName":{$regex: new RegExp(searchText,'i')}},
	                    	             	{"sellerEntity.profileInfo.accountInfo.sellerId":{$regex: new RegExp(searchText,'i')}}]}},
	                    	             	{$project :{"sellerEntity.profileInfo.basicInfo.companyInfo.companyName" : 1,
	                    	             	 "sellerEntity.profileInfo.accountInfo.sellerId" : 1,
	                    	             	 "sellerEntity.profileInfo.financialInfo.taxInfo.VAT_TIN" : 1,
	                    	             	 "sellerEntity.profileInfo.basicInfo.email" : 1,
	                    	             	 "sellerEntity.profileInfo.basicInfo.mobile" : 1,
	                    	             	 "sellerEntity.sellerTermsInfo.lastLoginTime" : 1}}], function(err, result){
			
			if(!err && result.length > 0){
				
				for(var i=0; i<result.length ; i++){
					
					sellerDetails.push({
						"sellerId" 	: result[i].sellerEntity.profileInfo.accountInfo.sellerId,
						"companyName" : result[i].sellerEntity.profileInfo.basicInfo.companyInfo.companyName,
						"vat" : result[i].sellerEntity.profileInfo.financialInfo.taxInfo.VAT_TIN,
						"email" : result[i].sellerEntity.profileInfo.basicInfo.email,
						"mobile" : result[i].sellerEntity.profileInfo.basicInfo.mobile,
						"lastLoginTime" : result[i].sellerEntity.sellerTermsInfo.lastLoginTime
					});
					
				}
				
				var resJson = {
        			"http_code" : "200",
        			"message" : sellerDetails
			    }
				logger.debug(TAG + " Search for Seller Details Successful.");
				return callback(false, resJson);
				
			}else if(!err && result.length === 0){
				resJson = {
				    "http_code" : "500",
					"message" : "Inputs doen't match with our records."
				};
			    logger.error(ip + " " +TAG + " No matching seller Search for Seller Details " + JSON.stringify(err));
			    return callback(true, resJson);
			}else{
				resJson = {
				    "http_code" : "500",
					"message" : "Unexpected Server Error while fulfilling the request. Please retry."
				};
			    logger.error(ip + " " +TAG + " Error for seller while Search for Seller Details " + JSON.stringify(err));
			    return callback(true, resJson);
			}		
		});
	}else {
		resJson = {
			    "http_code" : "400",
				"message" : "Bad or ill-formed request.."
		};
		logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
		return callback(true, resJson);
	}
}

//Function for Fetching the Seller Details.
exports.fetchSellerDetails =
function fetchSellerDetails (req, callback){
	
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;

	//Variable for Mongo DB Connection.
	var db = dbConfig.mongoDbConn;

	//Variable for Logging the messages to the file.
	var logger = log.logger_seller;

	logger.info(ip + " " + TAG + " Entering Fetch Seller Details.");

	//Log the request.
	logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));

	//Declare the response
	var resJson;
	
	//Validate the request.
	if ( !(	req === null || 
			req.body === null ||
			req.body.sellerId === null ||
			req.body.sellerId === undefined ||
			req.body.sellerId.toString().trim().length === 0)) {
		
		var sellerId = req.body.sellerId;
		
		var colSeller = db.collection("SellerMaster");
		
		colSeller.findOne({"sellerEntity.profileInfo.accountInfo.sellerId": sellerId}, 
				{"_id": 0, "sellerEntity.profileInfo.accountInfo.sellerId": 1, 
			"sellerEntity.profileInfo.basicInfo" : 1, "sellerEntity.profileInfo.financialInfo" : 1, 
			"sellerEntity.profileInfo.enquiryAndCategoryInfo" : 1, "sellerEntity.profileInfo.businessInfo" : 1,
			"sellerEntity.sellerVerificationStatus" : 1}, function(err, result){
			
			if(!err && result !== null){
				
				var resJson = {
        			"http_code" : "200",
        			"message" : result
			    }
				logger.debug(TAG + " Fetch for Seller Details Successful.");
				return callback(false, resJson);
				
			}else if(!err && result === null){
				resJson = {
				    "http_code" : "500",
					"message" : "Inputs doen't match with our records."
				};
			    logger.error(ip + " " +TAG + " No matching seller for Fetch for Seller Details " + JSON.stringify(err));
			    return callback(true, resJson);
			}else{
				resJson = {
				    "http_code" : "500",
					"message" : "Unexpected Server Error while fulfilling the request. Please retry."
				};
			    logger.error(ip + " " +TAG + " Error for seller while Fetch for Seller Details " + JSON.stringify(err));
			    return callback(true, resJson);
			}		
		});
	}else {
		resJson = {
			    "http_code" : "400",
				"message" : "Bad or ill-formed request.."
		};
		logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
		return callback(true, resJson);
	}
}

//Function for Approving the Seller.
exports.approveSeller =
function approveSeller (req, callback){
	
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;

	//Variable for Mongo DB Connection.
	var db = dbConfig.mongoDbConn;

	//Variable for Logging the messages to the file.
	var logger = log.logger_seller;

	logger.info(ip + " " + TAG + " Entering Approve Seller.");

	//Log the request.
	logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));

	//Declare the response
	var resJson;
	
	//Validate the request.
	if ( !(	req === null || 
			req.body === null ||
			req.body.sellerId === null ||
			req.body.sellerId === undefined ||
			req.body.sellerId.toString().trim().length === 0)) {
		
		var sellerId = req.body.sellerId;
		
		var colSeller = db.collection("SellerMaster");
		
		colSeller.findOne({"sellerEntity.profileInfo.accountInfo.sellerId": sellerId}, 
				{"_id": 0, "sellerEntity.sellerVerificationStatus" : 1, "sellerEntity.sellerAccessInfo" : 1, 
			"sellerEntity.profileInfo.basicInfo.email" : 1, "sellerEntity.profileInfo.accountInfo.userId" : 1}, function(err, result){
			
			if(!err && result !== null){
				
				var accessInfo = result.sellerEntity.sellerAccessInfo;
				
				accessInfo.hasEnquiryAccess = true;
				accessInfo.hasQuoteAccess = true;
				accessInfo.hasPOAccess = true;
				
				var email = result.sellerEntity.profileInfo.basicInfo.email;
				var userId = result.sellerEntity.profileInfo.accountInfo.userId;
				
				colSeller.update({"sellerEntity.profileInfo.accountInfo.sellerId": sellerId},
						{$set:{"sellerEntity.sellerVerificationStatus" : "verified", "sellerEntity.sellerAccessInfo" : accessInfo}}, function(uerr, uresult){
					
					if(!uerr){
						
						//Sending Notification mail to the Seller on Approval.
					    sellerNotification.sendNotificationDocumentsVerified(email, userId, function(err, status){
					    	if(!err){
								var resJson = {
				        			"http_code" : "200",
				        			"message" : "The Seller has been Approved."
							    }
								logger.debug(TAG + " The Seller has been approved Email triggered.");
								return callback(false, resJson);
					    	}else{
					    		resJson = {
								    "http_code" : "500",
									"message" : "Unexpected Server Error while Fulfilling the request."
								};
							    logger.error(ip + " " +TAG + " Approve of Seller Failed update Email Trigger failed." + JSON.stringify(uerr));
							    return callback(true, resJson);
					    	}	
					    });	
					}else{
						resJson = {
						    "http_code" : "500",
							"message" : "Unexpected Server Error while Fulfilling the request."
						};
					    logger.error(ip + " " +TAG + " Approve of Seller Failed update." + JSON.stringify(uerr));
					    return callback(true, resJson);
						
					}		
							
				});				
			}else if(!err && result === null){
				resJson = {
				    "http_code" : "500",
					"message" : "Inputs doen't match with our records."
				};
			    logger.error(ip + " " +TAG + " No matching seller for Approve of Seller " + JSON.stringify(err));
			    return callback(true, resJson);
			}else{
				resJson = {
				    "http_code" : "500",
					"message" : "Unexpected Server Error while fulfilling the request. Please retry."
				};
			    logger.error(ip + " " +TAG + " Error for seller while Approve of Seller " + JSON.stringify(err));
			    return callback(true, resJson);
			}		
		});
	}else {
		resJson = {
			    "http_code" : "400",
				"message" : "Bad or ill-formed request.."
		};
		logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
		return callback(true, resJson);
	}
}

//Function for Rejecting the Seller.
exports.rejectSeller =
function rejectSeller (req, callback){
	
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;

	//Variable for Mongo DB Connection.
	var db = dbConfig.mongoDbConn;

	//Variable for Logging the messages to the file.
	var logger = log.logger_seller;

	logger.info(ip + " " + TAG + " Entering Reject Seller.");

	//Log the request.
	logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));

	//Declare the response
	var resJson;
	
	//Validate the request.
	if ( !(	req === null || 
			req.body === null ||
			req.body.sellerId === null ||
			req.body.sellerId === undefined ||
			req.body.sellerId.toString().trim().length === 0)) {
		
		var sellerId = req.body.sellerId;
		
		var colSeller = db.collection("SellerMaster");
		
		colSeller.findOne({"sellerEntity.profileInfo.accountInfo.sellerId": sellerId}, 
				{"_id": 0, "sellerEntity.sellerVerificationStatus" : 1, "sellerEntity.sellerAccessInfo" : 1,
			"sellerEntity.profileInfo.basicInfo.email" : 1, "sellerEntity.profileInfo.accountInfo.userId" : 1}, function(err, result){
			
			if(!err && result !== null){
				
				var accessInfo = result.sellerEntity.sellerAccessInfo;
				
				accessInfo.hasEnquiryAccess = false;
				accessInfo.hasQuoteAccess = false;
				accessInfo.hasPOAccess = false;
				
				var email = result.sellerEntity.profileInfo.basicInfo.email;
				var userId = result.sellerEntity.profileInfo.accountInfo.userId;
				
				colSeller.update({"sellerEntity.profileInfo.accountInfo.sellerId": sellerId},
						{$set:{"sellerEntity.sellerVerificationStatus" : "rejected", "sellerEntity.sellerAccessInfo" : accessInfo}}, function(uerr, uresult){
					
					if(!uerr){
						
						//Sending Notification mail to the Seller on Approval.
					    sellerNotification.sendNotificationDocumentsRejected(email, userId, function(err, status){
					    	if(!err){
					    		var resJson = {
				        			"http_code" : "200",
				        			"message" : "The Seller has been Rejected."
							    }
								logger.debug(TAG + " The Seller has been Rejected.");
								return callback(false, resJson);
					    	}else{
					    		resJson = {
								    "http_code" : "500",
									"message" : "Unexpected Server Error while Fulfilling the request."
								};
							    logger.error(ip + " " +TAG + " Rejection of Seller Failed update Email Trigger failed." + JSON.stringify(uerr));
							    return callback(true, resJson);
					    	}	
					    });
					    
					}else{
						resJson = {
						    "http_code" : "500",
							"message" : "Unexpected Server Error while Fulfilling the request."
						};
					    logger.error(ip + " " +TAG + " seller for Reject Seller update Failed." + JSON.stringify(uerr));
					    return callback(true, resJson);
					}		
				});				
			}else if(!err && result === null){
				resJson = {
				    "http_code" : "500",
					"message" : "Inputs doen't match with our records."
				};
			    logger.error(ip + " " +TAG + " No matching seller for Reject Seller " + JSON.stringify(err));
			    return callback(true, resJson);
			}else{
				resJson = {
				    "http_code" : "500",
					"message" : "Unexpected Server Error while fulfilling the request. Please retry."
				};
			    logger.error(ip + " " +TAG + " Error for Reject Seller " + JSON.stringify(err));
			    return callback(true, resJson);
			}		
		});
	}else {
		resJson = {
			    "http_code" : "400",
				"message" : "Bad or ill-formed request.."
		};
		logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
		return callback(true, resJson);
	}
}