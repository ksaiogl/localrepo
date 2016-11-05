var TAG = "submitQuotation.js - ";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var underscore = require('underscore');
var http = require('http');
var request = require("request");
var async = require('async');
var quotationFootprint = require('./quotationFootprint.js');
var rfqNotifications = require('./rfqNotifications.js');
var hostDetails = require('../../Environment/notificationServiceHostDetails.js');

//Function to get inquiry List for Suppliers.
exports.insertQuotation = function insertQuotation (req, callback){
//try
//{	
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	//Variable for Mongo DB Connection.
	var db = dbConfig.mongoDbConn;
	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;
	logger.info(ip + " " + TAG + "#####Request for insertQuotation.######");
	//Log the request.
	logger.info(ip + " " + TAG + "Input body: " + JSON.stringify(req.body));
	//Declare the response
	var resJson;
	var sellerId = req.body.supplierSession.sellerEntity.profileInfo.accountInfo.sellerId;
    logger.debug(TAG + " sellerId from Session: "+ sellerId);

	validateInput(req, function(error, validateResJson){
		if(!error)
		{
			logger.debug(TAG + " Inputs for quotation insert are valid, moving forward");

			var inputQuotations = req.body.quotations;
			var quotationAmmendedStatus = "";

			async.forEachSeries(inputQuotations, function(inputQuotation, asyCallback)
				{
					processQuoations(req, inputQuotation, function(error, result){
						if(!error)
						{
							//If even One of the quotation is Amended, Update the Status as Quotation Amended.
							if(result === "Ammended")
							{	
								quotationAmmendedStatus = result;
							}	
							logger.debug(ip + " " + TAG + "Quotation processed successfully.");
							return asyCallback();
						}
						else
						{
							logger.error(ip + " " + TAG + " Failed to process Quotations for seller: " + sellerId + " and InquiryId: " + req.body.inquiryId);
							return asyCallback(true);
						}
					});
				},
				function(error)
				{
				 	if(!error)
				 	{
				 		logger.debug(TAG + "updateInquiryFloatStatus for inquiryId: " + req.body.inquiryId + " ,inquiryVersion: " + req.body.inquiryVersion);
				 		updateInquiryFloatStatus(req , quotationAmmendedStatus, function(err, results){
							if(!error)
							{
								logger.debug(ip + " " + TAG + "---All Quoations processed successfully.---");

								//Function to trigger notifications to seller and purchase manager. 
								sendNotificationsOnSubmitQuotation(req, function(error, result){

								});
								resJson = {
										    "http_code" : "200",
											"message" : "Quotation created successfully."
								};
								return callback(false,resJson);
							}
							else
							{
								logger.error(TAG + "Error -Failed to update Inquiry Status in updateInquiryFloatStatus for inquiryId: " + req.body.inquiryId + " ,inquiryVersion: " + req.body.inquiryVersion);
								resJson = {
								    "http_code" : "500",
									"message" : "Error submitting Quotations, Please retry.."
								};
								return callback(true, resJson);
							}
						});
				 	}
				 	else
				 	{
				 		logger.error(ip + " " + TAG + " Failed to process Quotations for seller: " + sellerId + " and InquiryId: " + req.body.inquiryId);
							resJson = {
						    "http_code" : "500",
							"message" : "Internal Server Error. Please retry."
						};
				 	}
				}
			);
		}
		else
		{
			logger.error(TAG + " Invalid input recieved for insert/update quotation.");
			return callback(true, validateResJson);
		}
	});
/*}
catch(e)
{
  console.log(TAG + "Exception in floatInquiryToSuppliers- " + e);
  logger.error(TAG + "Exception in floatInquiryToSuppliers:- error :" + e);
  resJson = {
			    "http_code" : "500",
				"message" : "Server Error. Please try again."
		};
  return callback(true, resJson);
}*/
};

//Function that will validate the input fields.
function validateInput(req, callback){
	//valid line item status.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;
    var sellerId = req.body.supplierSession.sellerEntity.profileInfo.accountInfo.sellerId;
    logger.debug(TAG + " sellerId from Session: "+ sellerId);
	//Variable for Mongo DB Connection.
	var db = dbConfig.mongoDbConn;

	if(!( req.body === undefined || req.body.sellerId === undefined || req.body.sellerId === null || req.body.sellerId.toString().trim().length === 0 ||
		  req.body.inquiryId === undefined || req.body.inquiryId === null || req.body.inquiryId.toString().trim().length === 0 ||
		  req.body.inquiryVersion === undefined || req.body.inquiryVersion === null || req.body.inquiryVersion.length === 0 ||
		  req.body.sellerquotationId === undefined || req.body.sellerquotationId === null || req.body.sellerquotationId.length === 0 ||
		  req.body.deliveryCharges === undefined ||
		  req.body.quoteValidUpTo === undefined || req.body.quoteValidUpTo === null ||
		  req.body.deliveryTime === undefined ||
		  req.body.CSTCharges === undefined ||
		  req.body.sellerRemarks === undefined ||
		  req.body.termsAndConditions === undefined ||
		  req.body.quotations === undefined || req.body.quotations === null ||req.body.quotations.length === 0 ))
	{
		logger.debug(ip + " " + TAG + "First Level quotation validation completed for seller: " + req.body.sellerId + " and InquiryId: " + req.body.inquiryId);
		//checking for incoming line item status, which are not valid.
  		var suppliersQuotations = req.body.quotations;
  		var validated = true;
  		for(var i = 0; i < suppliersQuotations.length; i++)
  		{
  			if( suppliersQuotations[i].productId === undefined ||
  				suppliersQuotations[i].productIdentifier === undefined || suppliersQuotations[i].productIdentifier.toString().trim().length === 0 ||
		  		suppliersQuotations[i].manufacturer === undefined ||
		  		suppliersQuotations[i].brand === undefined || 
		  		suppliersQuotations[i].subcategory === undefined ||
		  		suppliersQuotations[i].quantity === undefined ||
		  		suppliersQuotations[i].quantityUnit === undefined ||
		  		suppliersQuotations[i].priceValidityDays === undefined ||
		  		suppliersQuotations[i].paymentMode === undefined
		  		)
			{
				logger.error(ip + " " + TAG + "quotations array validation failed for seller: " + req.body.sellerId + " and InquiryId: " + req.body.inquiryId);
				logger.error(ip + " " + TAG + "suppliersQuotations[i]: " + JSON.stringify(suppliersQuotations[i]));
				resJson = {
			    "http_code" : "400",
				"message" : "Bad or ill-formed request in Quotations.."
				};
				validated = false; //Set the falg as the next check is skipped.
				return callback(true, resJson);
				break;
			}
  		}
  		logger.debug(ip + " " + TAG + "quotations inputs validated successfully for seller: " + sellerId + " and InquiryId: " + req.body.inquiryId);

  		if(validated === true)
  		{
  			logger.debug(ip + " " + TAG + "Validating Seller edit rule for seller: " + sellerId + " and InquiryId: " + req.body.inquiryId);
  			colInquirySellerFloat = db.collection("InquirySellerFloat");

	        var findOneQuery = {
	            "inquirySellerEntity.inquiryId": req.body.inquiryId,
	            "inquirySellerEntity.inquiryVersion": req.body.inquiryVersion,
	            "inquirySellerEntity.sellers.sellerId": sellerId
	        };

	        colInquirySellerFloat.findOne(findOneQuery, function (error, result) {
	            logger.info(ip + " " + TAG + " Query in InquirySellerFloat.");
	            if (!error && (result !== null)) {
	            	
	            	var isValidProduct = true;
	            	//checking weather valid product details are given in input.
	            	for(var i = 0; i < result.inquirySellerEntity.sellers.length; i++){
	            		if(result.inquirySellerEntity.sellers[i].sellerId === sellerId){
		            		var sellerDetails = result.inquirySellerEntity.sellers;
		            		
		            		for(var j = 0; j < req.body.quotations.length; j++){
		            			
		            			if(req.body.quotations[j].productId.toString().trim().length == 0){
		            				productIdArray = 1;
		            			}
		            			else{
		            				var productIdArray = underscore.where(sellerDetails[i].products, {"productId": req.body.quotations[j].productId});
		            			}

		            			var productIdentifierArray = underscore.where(sellerDetails[i].products, {"productIdentifier": req.body.quotations[j].productIdentifier});
		            			
		            			if(productIdArray.length === 0 || productIdentifierArray.length === 0){
		            				isValidProduct = false;
		            				break;
		            			}

		            		}	
	            		}
	            	}

	            	if(!isValidProduct){
        				resJson = {
						    "http_code" : "400",
							"message" : "cannot insert/update quotation since productid and product identifier dosen't match with our records."
						};
						logger.error(ip + " " + TAG + "Update/Insert Quotation validation failed for seller: " + sellerId + " and InquiryId: " + req.body.inquiryId);
						return callback(true, resJson);
	            	}

	                var inquiryStatus = result.inquirySellerEntity.inquiryStatus;
	                //Check inquiry is expired
	                var expired = false;
	                if(inquiryStatus === "Expired"){
	                    expired = true;
	                }

	                //Check all suppliers related to the inquiry have quoted
	                var sellersArray = result.inquirySellerEntity.sellers;
	                var allQuoted = true;
	                for(var i = 0;i<sellersArray.length;i++){
	                    if(sellersArray[i].status !== "QuoteSubmitted" && sellersArray[i].status !== "QuoteAmended" && sellersArray[i].status !== "NotIntentToQuote"){
	                        allQuoted = false;
	                        break;
	                    }
	                }
	                //edit is true if all Suppliers quoted and inquiry is not expired
	                //else edit is false
	                var edit = true;
	                if(allQuoted || expired){
	                    edit = false;
	                    logger.debug(ip + " " + TAG + " allQuoted/expired is true.");
	                }

	                var sellerDetails = {};
	                for(var i = 0;i<sellersArray.length;i++){
	                    if(sellersArray[i].sellerId === sellerId){
	                        sellerDetails = sellersArray[i];
	                        break;
	                    }
	                }

	                //If over Ride Edit quote is true then allow to edit
	                //else don't CHANGE the edit
	                var editQuoteCount = sellerDetails.editQuoteCount;
	                if(editQuoteCount >= 5){
	                    edit = false;
	                    logger.debug(ip + " " + TAG + " editQuoteCount is greater than 5 times.");
	                }

	                //If status is NotIntentToQuote, then dont allow to edit.
	                var intentToQuote = sellerDetails.status;
	                if(intentToQuote === "NotIntentToQuote"){
	                    edit = false;
	                    logger.debug(ip + " " + TAG + " seller has opted to NotIntentToQuote.");
	                }

	                //If supplier has not performed IntentToQuote, then do not Allow to edit/submit Quotations..
	                var intentToQuote = sellerDetails.status;
	                if(intentToQuote !== "IntentToQuote" && intentToQuote !== "QuoteSubmitted" && intentToQuote !== "QuoteAmended"){
	                    edit = false;
	                    logger.debug(ip + " " + TAG + " Cannot update/submit as the status is not in IntentToQuote,QuoteSubmitted,QuoteAmended. intentToQuote:: " + intentToQuote);
	                }

	                var overRideEditQuoteRule = sellerDetails.overRideEditQuoteRule;
	                if(overRideEditQuoteRule){
	                    edit = true;
	                    logger.debug(ip + " " + TAG + " overRideEditQuoteRule Active.");
	                }

	               // If status is in EditInProgress or PendingApproval, then do not allow to Submit Quottaion.
	                var status = sellerDetails.status;
	                if(status === "EditInProgress" || status === "PendingApproval"){
	                    edit = false;
	                    logger.debug(ip + " " + TAG + " status is either in EditInProgress or PendingApproval, Not Yet Assigned to Supplier.");
	                }

	                logger.debug(ip + " " + TAG + "Edit status for seller: " + sellerId + " and InquiryId: " + req.body.inquiryId + ", edit: " + edit);
	                // check id the supplier can edit or not.
	                if(edit === true)
	                {
						return callback(false, "Valid");
					}
					else
					{
						logger.error(ip + " " + TAG + "Edit disabled for seller: " + sellerId + " and InquiryId: " + req.body.inquiryId + ", edit: " + edit);
						resJson = {
					    "http_code" : "500",
						"message" : "Enquiry is either Expired or disabled to quote."
						};
						return callback(true, resJson);
					}
	            }
	            else
	            {
	            	logger.error(ip + " " + TAG + "Error querying float collection for seller: " + sellerId + " and InquiryId: " + req.body.inquiryId);
	            	resJson = {
				    "http_code" : "500",
					"message" : "Internal Server Error. Please Retry.."
					};
					return callback(true, resJson);
	            }
	        });
  		}
	}
	else
	{
		resJson = {
			    "http_code" : "400",
				"message" : "Bad or ill-formed request.."
			};
		logger.error(ip + " " + TAG + "Update/Insert Quotation validation failed for seller: " + sellerId + " and InquiryId: " + req.body.inquiryId);
		return callback(true, resJson);
	}
};


//Function that will validate the input fields.
function processQuoations(req, inputQuotation, callback){

	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	//Variable for Mongo DB Connection.
	var db = dbConfig.mongoDbConn;
	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;

	var inquiryQuotationColl = db.collection("InquiryQuotation");

	var inquiryId = req.body.inquiryId;
	var inquiryVersion = req.body.inquiryVersion;
	var sellerquotationId = req.body.sellerquotationId;
	//var sellerId = req.body.sellerId;
	var sellerId = req.body.supplierSession.sellerEntity.profileInfo.accountInfo.sellerId;
    logger.debug(TAG + " sellerId from Session: "+ sellerId);
	var productId = inputQuotation.productId;
	var productIdentifier = inputQuotation.productIdentifier;

	inquiryQuotationColl.findOne({"quotationEntity.inquiryId": inquiryId, "quotationEntity.inquiryVersion": inquiryVersion,
	"quotationEntity.sellerquotationId": sellerquotationId, "quotationEntity.sellerId": sellerId,
	"quotationEntity.productId": productId, "quotationEntity.productIdentifier": productIdentifier}, function(error, result){
	  	if(!error)
	  	{	
	  		if(result === null)
	  		{
	  			logger.debug(ip + " " + TAG + " inquiry NOT found for inquiryId : "+ inquiryId + " ,sellerId: " + sellerId + " ,sellerquotationId: " + sellerquotationId + " ,productId: " + productId);
	  			logger.debug(ip + " " + TAG + " Call function to create new Quotation");
	  			createQuotationWithNewVersion(req, inputQuotation, function(error, newQuotation){
					if(!error)
					{
						logger.debug(ip + " " + TAG + "newQuotation: " + JSON.stringify(newQuotation));
						inquiryQuotationColl.insert(newQuotation,function(err, result) {
							if(!err)
							{
								logger.debug(ip + " " + TAG + "New Quotation added for inquiryId : "+ inquiryId + " ,sellerId: " + sellerId + " ,sellerquotationId: " + sellerquotationId + " ,productId: " + productId);
								
								return callback(false, null);
							}
							else
							{
								logger.error(ip + " " + TAG + "Error creating Quotation for inquiryId : "+ inquiryId + " ,sellerId: " + sellerId + " ,sellerquotationId: " + sellerquotationId + " ,productId: " + productId);
								return callback(true, null);
							}
						});
					}
					else
					{
						logger.error(ip + " " + TAG + "Error in createQuotationWithNewVersion for inquiryId : "+ inquiryId + " ,sellerId: " + sellerId + " ,sellerquotationId: " + sellerquotationId + " ,productId: " + productId);
						return callback(true, null);
					}
				});
	  		}
	  		else
	  		{
	  			logger.debug(ip + " " + TAG + " inquiry found for inquiryId : "+ inquiryId + " ,sellerId: " + sellerId + " ,sellerquotationId: " + sellerquotationId + " ,productId: " + productId);
	  			logger.debug(ip + " " + TAG + " Call function to Update the existing Quotation");
	  			updateQuotation(req, inputQuotation, result, function(error, updatedQuotation){
					if(!error)
					{
						logger.debug(ip + " " + TAG + "updatedQuotation: " + JSON.stringify(updatedQuotation));
						inquiryQuotationColl.update({"quotationEntity.inquiryId": inquiryId, "quotationEntity.inquiryVersion": inquiryVersion,
						"quotationEntity.sellerquotationId": sellerquotationId, "quotationEntity.sellerId": sellerId, "quotationEntity.productId": productId, "quotationEntity.productIdentifier": productIdentifier},
						{ $set: {"quotationEntity": updatedQuotation}},
						function(error, result){
						  	if(!error)
						  	{
						  		quotationAmmendedStatus = "Ammended";
						  		logger.debug(TAG + "quotation updated successfully for inquiryId: "+ inquiryId + " ,sellerId: " + sellerId + " ,sellerquotationId: " + sellerquotationId + " ,productId: " + productId);
						  		
						  		return callback(false, quotationAmmendedStatus);
						  	}
						  	else
						  	{
						  		logger.error(TAG + "error updating quotation for inquiryId: "+ inquiryId + " ,sellerId: " + sellerId + " ,sellerquotationId: " + sellerquotationId + " ,productId: " + productId);
						  		return callback(true, error);
						  	}
						});
					}
					else
					{
						logger.error(ip + " " + TAG + "Error in updateQuotation for inquiryId : "+ inquiryId + " ,sellerId: " + sellerId + " ,sellerquotationId: " + sellerquotationId + " ,productId: " + productId);
						return callback(true, error);
					}
				});
	  		}
		}
		else
		{
			logger.error(ip + " " + TAG + "Error querying Inquiry for inquiryId : "+ inquiryId + " ,sellerId: " + sellerId + " ,sellerquotationId: " + sellerquotationId + " ,productId: " + productId);
			return callback(true, error);
		}
	});
}

//Function that will create new version of the quotations using the input fields.
function createQuotationWithNewVersion(req, inputQuotation, callback){

	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;

	var inquiryId = req.body.inquiryId;
	var inquiryVersion = req.body.inquiryVersion;
	var sellerquotationId = req.body.sellerquotationId;
	//var sellerId = req.body.sellerId;
	var sellerId = req.body.supplierSession.sellerEntity.profileInfo.accountInfo.sellerId;
    logger.debug(TAG + " sellerId from Session: "+ sellerId);
	var status = "Active";
	if(inputQuotation.quotedPrice === null || inputQuotation.quotedPrice === '' || inputQuotation.quotedPrice === 0)
	{
		status = "InActive";
		logger.debug(TAG + "quotedPrice is zero, Quotion Created as Inactive");
	}
	
	generateQuotationId(function(err, quotationId){
		if(!err)
		{
			var quotations = {
									"quotationId": quotationId,
									"quotationVersion": 1,
									"inquiryId": inquiryId,
									"inquiryVersion": inquiryVersion,
									"sellerquotationId": sellerquotationId,
									"sellerId": sellerId,
									"status": status
								};

				var quotFields = {  "msupplyMargin": "",
									"selectedForCC": false,
									"lastUpdatedAt": new Date()
								 };
								 
			// Calculate the VAT Amount, VATValue = VAT * quotedPrice * quantity					 
			if(!( inputQuotation.VAT === undefined || inputQuotation.VAT === null || inputQuotation.VAT.toString().trim().length === 0 ||
		  			inputQuotation.quotedPrice === undefined || inputQuotation.quotedPrice === null || inputQuotation.quotedPrice.toString().trim().length === 0 ||
		  			inputQuotation.quantity === undefined || inputQuotation.quantity === null || inputQuotation.quantity.toString().trim().length === 0 ))
			{
				var VATAmt = (inputQuotation.VAT * inputQuotation.quotedPrice * inputQuotation.quantity)/100;
				inputQuotation.VATAmt = VATAmt;
				var totalPrice = (inputQuotation.quantity * inputQuotation.quotedPrice) + VATAmt;
				inputQuotation.totalPrice = totalPrice;
			}		 

			// check if there is a Seller Suggested Product with productId as null,
			//then create new product id and assign it to Supplier in Float table.
			if(inputQuotation.productId === null || inputQuotation.productId === "" ||
				inputQuotation.productId.toString().trim().length === 0)
			{
				logger.debug(TAG + "In Seller Suggested Product block");

				//Fething product id using brand and product identifier.

				getProductDeatils(req, inputQuotation, function(error, existingProductId){
					if(error || existingProductId === null){

						generateSuggestedProductId(function(error, productId){
							if(!error)
							{
								inputQuotation.productId = productId;

								//Append the input block as iss with other fields.
								var updatedQuotations = underscore.extend(quotations, inputQuotation);
								var appendedQuotation = underscore.extend(updatedQuotations, quotFields);
								var finalQuotation = {"quotationEntity": appendedQuotation};
								logger.debug(TAG + "New Quotation structure created successfully");
								updatedSuggestedProductIdInFloat(inquiryId, inquiryVersion, sellerId, productId, inputQuotation.productIdentifier, inputQuotation.brand, function(errs, results){
									if(!errs)
									{
										logger.debug(TAG + "updatedSuggestedProductIdInFloat created successfully");
									}
									else
									{
										logger.error(TAG + "Error creating quotationFootprint, errs: " + errs);
									}
								});
								return callback(false, finalQuotation);
							}
							else
							{
								logger.error(TAG + "error in generateSuggestedProductId, err: " + error);
								return callback(true, error);
							}
						});

					}
					else
					{
						inputQuotation.productId = existingProductId;
						//Append the input block as iss with other fields.
						var updatedQuotations = underscore.extend(quotations, inputQuotation);
						var appendedQuotation = underscore.extend(updatedQuotations, quotFields);
						var finalQuotation = {"quotationEntity": appendedQuotation};
						logger.debug(TAG + "New Quotation structure created successfully with existing product id.");

						return callback(false, finalQuotation);
					}
				});
			}
			else
			{
				//Append the input block as iss with other fields.
				var updatedQuotations = underscore.extend(quotations, inputQuotation);
				var appendedQuotation = underscore.extend(updatedQuotations, quotFields);
				var finalQuotation = {"quotationEntity": appendedQuotation};
				logger.debug(TAG + "New Quotation structure created successfully");
				return callback(false, finalQuotation);
			}
		}
		else
		{
			logger.error(TAG + "error in generateQuotationId, err: " + err);
			return callback(true, err);
		}
	});
};

//Function to get product details.
function getProductDeatils(req, inputQuotation, callback){
	//Variable for Mongo DB Connection.
	var db = dbConfig.mongoDbConn;
	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;
	var inquiryId = req.body.inquiryId;
	var inquiryVersion = req.body.inquiryVersion;

	var inquiryMasterColl = db.collection("InquiryMaster");
	var findOneQuery = {
        "inquiryEntity.inquiryId": inquiryId,
        "inquiryEntity.inquiryVersion": inquiryVersion
    };
	inquiryMasterColl.findOne(findOneQuery, function (error, result) {
        if (!error && (result !== null)) {
            logger.debug(TAG + "Data fetched from inquiryMaster Successfully...");

            var products = [];
            products = result.inquiryEntity.inquiryStructured.inquiryParams;

            for(var i = 0; i < products.length; i++){
            	if(inputQuotation.productIdentifier === products[i].productIdentifier && inputQuotation.brand === products[i].brand){

            		return callback(false, products[i].productId);
            	}
            }

            return callback(false, null);
            
        }
        else if (!error && (result === null)) {
            logger.error(TAG + " Record Not Found in InquiryMaster for inquiryId: " + inquiryId + ", inquiryVersion: " + inquiryVersion);
            return callback(true, "Record Not Found");
        }
        else {
            logger.error(TAG + " Error fetching inquiryDetails in InquiryMaster collection for inquiryId: " + inquiryId + ", inquiryVersion: " + inquiryVersion + " err: " + error);
            return callback(true, "Record Not Found");
        }
    });
}

//Function that will update the new quotation array in to DB.
function updateQuotation(req, inputQuotation, result, callback){

	//Variable for Mongo DB Connection.
	var db = dbConfig.mongoDbConn;
	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;

	var inquiryId = req.body.inquiryId;
	var inquiryVersion = req.body.inquiryVersion;
	var sellerquotationId = req.body.sellerquotationId;
	//var sellerId = req.body.sellerId;
	var sellerId = req.body.supplierSession.sellerEntity.profileInfo.accountInfo.sellerId;
    logger.debug(TAG + " sellerId from Session: "+ sellerId);
	var status = "Active";
	if(inputQuotation.quotedPrice === null || inputQuotation.quotedPrice === '' || inputQuotation.quotedPrice === 0)
	{
		status = "InActive";
		logger.debug(TAG + "quotedPrice is zero, Quotion updated as Inactive");
	}

	var quotations = {
						"quotationId": result.quotationEntity.quotationId,
						"quotationVersion": result.quotationEntity.quotationVersion,
						"inquiryId": result.quotationEntity.inquiryId,
						"inquiryVersion": result.quotationEntity.inquiryVersion,
						"sellerquotationId": result.quotationEntity.sellerquotationId,
						"sellerId": result.quotationEntity.sellerId,
						"status": status
					};

	var quotFields = {  "msupplyMargin": "",
						"selectedForCC": false,
						"lastUpdatedAt": new Date()
					 };

	// Calculate the VAT Amount, VATValue = VAT * quotedPrice * quantity					 
	if(!( inputQuotation.VAT === undefined || inputQuotation.VAT === null || inputQuotation.VAT.toString().trim().length === 0 ||
  			inputQuotation.quotedPrice === undefined || inputQuotation.quotedPrice === null || inputQuotation.quotedPrice.toString().trim().length === 0 ||
  			inputQuotation.quantity === undefined || inputQuotation.quantity === null || inputQuotation.quantity.toString().trim().length === 0 ))
	{
		var VATAmt = (inputQuotation.VAT * inputQuotation.quotedPrice)/100;
		inputQuotation.VATAmt = VATAmt;
		var totalPrice = (inputQuotation.quantity * (inputQuotation.quotedPrice + VATAmt))
		inputQuotation.totalPrice = totalPrice;
	}			 

	var updatedQuotations = underscore.extend(quotations, inputQuotation);
	var finalQuotation = underscore.extend(updatedQuotations, quotFields);

	var updatedQuotation = finalQuotation;
	var existingQuotation = result.quotationEntity;
	logger.debug(TAG + "update Quotation structure created successfully");
	quotationFootprint.addQuotationEvent(existingQuotation, updatedQuotation, function(err, quotationId){
		if(!err)
		{
			logger.debug(TAG + "quotationFootprint created successfully");
		}
		else
		{
			logger.error(TAG + "Error creating quotationFootprint, err: " + err);
		}
	});
	return callback(false, finalQuotation);
}

//Function to generate QuotationId
function generateQuotationId(callback){
  var db = dbConfig.mongoDbConn;

  //Variable for Logging the messages to the file.
	var logger = log.logger_rfq;

	db.collection('counters').findAndModify({ _id: 'quotationId'},null, { $inc: { seq: 1 } }, {new: true}, function(err, result){
    if (err) {
      logger.error(TAG + "Fetching the counters value for sellerquotationId Failed.");
      callback(true);
    } else {
      logger.debug(TAG + "Fetching the counters value for sellerquotationId Sucess.");

      callback(false, result.value.seq);
    }
  });
}

//Function to generate SuggestedProductId
function generateSuggestedProductId(callback){
  var db = dbConfig.mongoDbConn;

  //Variable for Logging the messages to the file.
	var logger = log.logger_rfq;

	db.collection('counters').findAndModify({ _id: 'suggestedProductId'},null, { $inc: { seq: 1 } }, {new: true}, function(err, result){
    if (err) {
      logger.error(TAG + "Fetching the counters value for generateSuggestedProductId Failed.");
      callback(true);
    } else {
      logger.debug(TAG + "Fetching the counters value for generateSuggestedProductId Sucess.");

      callback(false, "S-" + result.value.seq);
    }
  });
}


//Function to inquiryStatus in InquirySellerFloat after Floating to Supplier.
function updatedSuggestedProductIdInFloat(inquiryId, inquiryVersion, sellerId, productId, productIdentifier, brand, callback){
  	var db = dbConfig.mongoDbConn;
  	var inquirySellerFloatColl = db.collection("InquirySellerFloat");
  	//Variable for Logging the messages to the file.
  	var logger = log.logger_rfq;

  	inquirySellerFloatColl.findOne({"inquirySellerEntity.inquiryId": inquiryId, "inquirySellerEntity.inquiryVersion": inquiryVersion,
	"inquirySellerEntity.sellers.sellerId": sellerId},{"inquirySellerEntity.sellers.$":1}, function(error, results){
	  	if(!error && results !== null)
	  	{
	  		var sellers = results.inquirySellerEntity.sellers[0];
	  		var products = sellers.products;
	  		var suggestedProduct =
  					{
  						"productId" : productId,
                        "productIdentifier" : "",
                        "productName" : "",
                        "relatedProduct" : "",
                        "newBrandSuggested": brand
  					}

	  		for(var i = 0; i < products.length; i++)
  			{
  				if(products[i].productIdentifier === productIdentifier)
  				{
  					suggestedProduct.productIdentifier =  products[i].productIdentifier;
  					suggestedProduct.productName = products[i].productName;
  					suggestedProduct.relatedProduct =  products[i].productId;
  					break;
  				}
  			}

		  //update the Inquiry collection with Seller Details to whom Inquiry will be sent.
			inquirySellerFloatColl.update({"inquirySellerEntity.inquiryId": inquiryId, "inquirySellerEntity.inquiryVersion": inquiryVersion,
				 "inquirySellerEntity.sellers": {$elemMatch: {"sellerId": sellerId}}},
				{"$push": {"inquirySellerEntity.sellers.$.products": suggestedProduct}},function(upderr, result) {
				if(!upderr && result.result.n > 0)
				{
					logger.debug(TAG + "suggested product details updated in InquirySellerFloat successfully for inquiryId: " + inquiryId + " ,inquiryVersion:" + inquiryVersion + " ,sellerId: " + sellerId);
					return callback(false, null);
				}
				else if(!upderr && result.result.n < 1)
			  	{
			  		logger.error(TAG + " Record Not Found - Failed Updating inquiryStatus in InquirySellerFloat for inquiryId: "+ inquiryId + " ,inquiryVersion:" + inquiryVersion + " ,sellerId: " + sellerId);
					return callback(true, "Record Not Found");
			  	}
				else
				{
					logger.error(TAG + " Error updating inquiryStatus in InquirySellerFloat collection for inquiryId: " + inquiryId + " ,inquiryVersion:" + inquiryVersion + " ,sellerId: " + sellerId + " ,err: " + upderr);
					return callback(true, upderr);
				}
			});
		}
		else
		{
			logger.error(TAG + " Error finding inquiry in InquirySellerFloat collection for inquiryId: " + inquiryId + " ,inquiryVersion:" + inquiryVersion + " ,sellerId: " + sellerId + " ,err: " + error);
			logger.error(TAG + " Results: " + JSON.stringify(results));
			return callback(true, upderr);
		}
	});
}


//Function to inquiryStatus in InquirySellerFloat after Floating to Supplier.
function updateInquiryFloatStatus(req, quotationAmmendedStatus, callback){
  var db = dbConfig.mongoDbConn;
  var inquirySellerFloatColl = db.collection("InquirySellerFloat");
  //Variable for Logging the messages to the file.
  var logger = log.logger_rfq;

  var inquiryId = req.body.inquiryId;
  var inquiryVersion = req.body.inquiryVersion;
  //var sellerId = req.body.sellerId;
  var sellerId = req.body.supplierSession.sellerEntity.profileInfo.accountInfo.sellerId;
  logger.debug(TAG + " sellerId from Session: "+ sellerId);
  var deliveryCharges = req.body.deliveryCharges;
  var sellerRemarks = req.body.sellerRemarks;
  var termsAndConditions = req.body.termsAndConditions;
  var quoteValidUpTo = req.body.quoteValidUpTo;
  var deliveryTime = req.body.deliveryTime;
  var CSTCharges = req.body.CSTCharges;

  if (quotationAmmendedStatus === "Ammended")
  {
  	var status = "QuoteAmended"
  }
  else
  {
  	var status = "QuoteSubmitted";
  }

  	inquirySellerFloatColl.findOne({"inquirySellerEntity.inquiryId": inquiryId, "inquirySellerEntity.inquiryVersion": inquiryVersion,
	"inquirySellerEntity.sellers.sellerId": sellerId},{"inquirySellerEntity.sellers.$":1}, function(error, results){
	  	if(!error && results !== null)
	  	{
	  		var existingSellerParams = 
	  		{
	  			"inquiryId": inquiryId,
	            "inquiryVersion": inquiryVersion,
	            "sellerquotationId": results.inquirySellerEntity.sellers[0].sellerquotationId,
	            "sellerId": results.inquirySellerEntity.sellers[0].sellerId,
	            "productId": "",
	            "productIdentifier": "",
	            "quotationId" : "",
	            "quotationVersion" : "",
	            "deliveryCharges": results.inquirySellerEntity.sellers[0].deliveryCharges,
	            "sellerRemarks": results.inquirySellerEntity.sellers[0].sellerRemarks,
	            "termsAndConditions": results.inquirySellerEntity.sellers[0].termsAndConditions,
	            "quoteValidUpTo": results.inquirySellerEntity.sellers[0].quoteValidUpTo,
	            "deliveryTime": results.inquirySellerEntity.sellers[0].deliveryTime,
	            "CSTCharges": results.inquirySellerEntity.sellers[0].CSTCharges
	  		};

	  		var updatedSellerParams = 
	  		{
	  			"inquiryId": inquiryId,
	            "inquiryVersion": inquiryVersion,
	            "sellerquotationId": results.inquirySellerEntity.sellers[0].sellerquotationId,
	            "sellerId": results.inquirySellerEntity.sellers[0].sellerId,
	            "productId": "",
	            "productIdentifier": "",
	            "quotationId" : "",
	            "quotationVersion" : "",
	            "deliveryCharges": deliveryCharges,
	            "sellerRemarks": sellerRemarks,
	            "termsAndConditions": termsAndConditions,
	            "quoteValidUpTo": quoteValidUpTo,
	            "deliveryTime": deliveryTime,
	            "CSTCharges": CSTCharges
	  		};

	  		// Asyncronous call to have the change event logged in
	  		quotationFootprint.addQuotationEvent(existingSellerParams, updatedSellerParams, function(upderror, res){
				if(!upderror)
				{
					logger.debug(TAG + "quotationFootprint created successfully");
				}
				else
				{
					logger.error(TAG + "Error creating quotationFootprint, err: " + upderror);
				}
			});

		    //update the Inquiry collection with Seller Details to whom Inquiry will be sent.
			inquirySellerFloatColl.update({"inquirySellerEntity.inquiryId": inquiryId, "inquirySellerEntity.inquiryVersion": inquiryVersion,
				 "inquirySellerEntity.sellers": {$elemMatch: {"sellerId": sellerId}}},
				{"$set": {"inquirySellerEntity.sellers.$.lastUpdatedDate": new Date(),
						  "inquirySellerEntity.sellers.$.status": status,
						  "inquirySellerEntity.sellers.$.deliveryCharges": deliveryCharges,
						  "inquirySellerEntity.sellers.$.sellerRemarks": sellerRemarks,
						  "inquirySellerEntity.sellers.$.termsAndConditions": termsAndConditions,
						  "inquirySellerEntity.sellers.$.quoteValidUpTo": quoteValidUpTo,
						  "inquirySellerEntity.sellers.$.deliveryTime": deliveryTime,
						  "inquirySellerEntity.sellers.$.CSTCharges": CSTCharges }},function(err, result) {
				if(!err && result.result.n > 0)
				{
					// updating editQuoteCount counter. Should see if we can do it in same query.
					inquirySellerFloatColl.update({"inquirySellerEntity.inquiryId": inquiryId, "inquirySellerEntity.inquiryVersion": inquiryVersion,
					 "inquirySellerEntity.sellers": {$elemMatch: {"sellerId": sellerId}}},
					{"$inc":{"inquirySellerEntity.sellers.$.editQuoteCount": 1}},function(error, results) {
						if(!error && results.result.n > 0)
						{
							logger.debug(TAG + "counter updated in InquirySellerFloat successfully for inquiryId: " + inquiryId + " ,inquiryVersion:" + inquiryVersion);
						}
						else
						{
							logger.error(TAG + "counter updated in InquirySellerFloat successfully for inquiryId: " + inquiryId + " ,inquiryVersion:" + inquiryVersion);
						}
					});
					logger.debug(TAG + "inquiryStatus updated in InquirySellerFloat successfully for inquiryId: " + inquiryId + " ,inquiryVersion:" + inquiryVersion);
					return callback(false, null);
				}
				else if(!err && result.result.n < 1)
			  	{
			  		logger.error(TAG + " Record Not Found - Failed Updating inquiryStatus in InquirySellerFloat for inquiryId: "+ inquiryId + " ,inquiryVersion:" + inquiryVersion);
					return callback(true, "Record Not Found");
			  	}
				else
				{
					logger.error(TAG + " Error updating inquiryStatus in InquirySellerFloat collection for inquiryId: " + inquiryId + " ,inquiryVersion:" + inquiryVersion + " ,err: " + err);
					return callback(true, err);
				}
			});	
		}
		else
		{
			logger.error(TAG + " Error querying InquirySellerFloat collection for inquiryId: " + inquiryId + " ,inquiryVersion:" + inquiryVersion + " ,err: " + error);
			return callback(true, error);
		}
	});		
}

//Function to trigger notifications to seller and purchase manager regarding succesfull quotation submit.
function sendNotificationsOnSubmitQuotation(req, callback){

	var db = dbConfig.mongoDbConn;
	var inquiryMasterColl = db.collection("InquiryMaster");
	var inquirySellerFloatColl = db.collection("InquirySellerFloat");
	var inquiryQuotationColl = db.collection("InquiryQuotation");
	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;

	var inquiryId = req.body.inquiryId;
	var inquiryVersion = req.body.inquiryVersion;
	var sellerquotationId = req.body.sellerquotationId;
	//var sellerId = req.body.sellerId;
	var sellerId = req.body.supplierSession.sellerEntity.profileInfo.accountInfo.sellerId;
    logger.debug(TAG + " sellerId from Session: "+ sellerId);

	inquiryMasterColl.findOne({"inquiryEntity.inquiryId": inquiryId, "inquiryEntity.inquiryVersion": inquiryVersion}, {}, function(error, result){
		if(!error && result !== null)
	  	{	
	  		var inquiryMasterDetails = result;

	  		inquirySellerFloatColl.findOne({"inquirySellerEntity.inquiryId": inquiryId, "inquirySellerEntity.inquiryVersion": inquiryVersion},{"inquirySellerEntity": 1, "_id": 0}, function(error, results){
			  	if(!error && results !== null)
			  	{	
			  		var inquirySellerFloatDetails = results;

				  	inquiryQuotationColl.find({"quotationEntity.inquiryId": inquiryId, "quotationEntity.inquiryVersion": inquiryVersion,
					"quotationEntity.sellerquotationId": sellerquotationId, "quotationEntity.sellerId": sellerId, "quotationEntity.status": "Active" }).toArray(function(error, result){
					  	if(!error && result !== null)
					  	{
					  		var quotationDetails = result;

						  	async.parallel([
								//Function to trigger notification to seller.
								function(asyncCallback){
									//Send Notifications to Supplier on Submitting the Quotations.
								  	rfqNotifications.notifySuppliersOnQuoteSubmission(req.body, inquirySellerFloatDetails, quotationDetails, inquiryMasterDetails, function(err, results){
										if(!err)
										{
											logger.debug(TAG + " notifySuppliersOnQuoteSubmission Notification Triggered successfully");
											return asyncCallback(false, null);
										}
										else
										{
											logger.error(TAG + " Error triggering  notifySuppliersOnQuoteSubmission Notifications, err: " + err);
											return asyncCallback(true, err);
										}
									});
								},
								//Function to trigger notification to internal team.
								function(asyncCallback){
									// Send Notifications to City Purshase Managers on Submitting the Quote.
									rfqNotifications.notifyPurchaseManager(req.body, inquirySellerFloatDetails, quotationDetails, inquiryMasterDetails, function(err, quotationId){
										if(!err)
										{
											logger.debug(TAG + " notifymSupplyTeam Notification Triggered successfully");
											return asyncCallback(false, null);
										}
										else
										{
											logger.error(TAG + " Error triggering notifymSupplyTeam Notifications, err: " + err);
											return asyncCallback(true, err);
										}
									});
								}
							],
							//Final function that will be called by functions defined in Parallel.
							function(error, results){
								if(!error)
								{	
									var reqObj = {
										"sellerId": sellerId,
										"sellerNotification": "quotation submitted/updated for inquiry id :"+req.body.inquiryId
									};

									//logging notifications. 
									logNotifications(reqObj, function(error, result){

									});

									logger.debug(TAG + " All Notifications Triggered successfully");
									return callback(false, "Notifications Triggered successfully");
								}
								else
								{
									logger.error(TAG + " Error triggering in Notifications.");
									return callback(true, results);
								}
							});
						}
						else
						{
							logger.error(TAG + " Error querying InquiryQuotation for Sending Notifications,  for inquiryId: " + inquiryId + " ,inquiryVersion:" + inquiryVersion + ", sellerId: " + sellerId + " ,err: " + error);
							logger.error(TAG + " result : " + result);
							console.log(TAG + " Error in Notification Trigger");
							return callback(true, error);
						}
					});
				}
				else
				{
					logger.error(TAG + " Error querying InquirySellerFloat for Sending Notifications, for inquiryId: " + inquiryId + " ,inquiryVersion:" + inquiryVersion + ", sellerId: " + sellerId + " ,err: " + error);
					logger.error(TAG + " results : " + results);
					console.log(TAG + " Error in Notification Trigger");
					return callback(true, error);
				}
			});
	  	}
	  	else
		{
			logger.error(TAG + " Error querying InquiryMaster for Sending Notifications, for inquiryId: " + inquiryId + " ,inquiryVersion:" + inquiryVersion + ", sellerId: " + sellerId + " ,err: " + error);
			logger.error(TAG + " results : " + result);
			console.log(TAG + " Error in Notification Trigger");
			return callback(true, error);
		}
	});
}


//Function Calls POST API service for logging notifications info.
function logNotifications(emailBodyParameters, callback){
    //Variable for Logging the messages to the file.
    var logger = log.logger_rfq;

    //emailBodyParameters = JSON.parse(emailBodyParameters);
    var WHICH_HOST = hostDetails.WHICH_HOST;
    var postData = JSON.stringify({
        "sellerId" : emailBodyParameters.sellerId,
        "sellerNotification" : emailBodyParameters.sellerNotification
    });
    var finalResponse = '';
    var postOptions = {
        path: '/rfqSupplier/api/v1.0/insertSellerInquiryNotifications/',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };
    postOptions.host = WHICH_HOST.host; //setting host and port dynamically based on environment.
    postOptions.port = WHICH_HOST.port;

    var postReq = http.request(postOptions, function(res){
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            finalResponse = finalResponse + chunk;
        });
        res.on('end', function () {
            var result = JSON.parse(finalResponse);

            if(result.http_code === "200")
            {
                logger.debug(TAG + " quotation insertion/updation changes log inserted successfully: ");
                return callback(false, result);
            }
            else
            {
                logger.error(TAG + " Error in inserting quotation insertion/updation changes log");
                return callback(true, result);
            }
        });
        res.on('error', function (error) {
            logger.error(TAG + " Error in inserting quotation insertion/updation changes log" + error);
            return callback(true, error);
        });
    });
    // post the data
    postReq.write(postData);
    postReq.end();
};





  

					