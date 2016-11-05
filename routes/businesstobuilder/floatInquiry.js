var TAG = "floatInquiry.js - ";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var async = require('async');
var timezoneConversions = require('../helpers/timezoneConversions.js');
var underscore = require('underscore');

//Function for Fetching the mSupply Suppliers.
exports.floatInquiryToSuppliers = function floatInquiryToSuppliers (req, callback){	
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;
	logger.info(ip + " " + TAG + "#####Request for floatInquiryToSuppliers.######");
	//Log the request.
	logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));
	//Declare the response
	var resJson;
try
{	
	//Validate the request.
	if ( !(	req.body === null || req.body.inquiryId === undefined || 
			req.body.inquiryId === null || req.body.inquiryId.toString().trim().length === 0 || 
			req.body.floatToSupplier === undefined || req.body.floatToSupplier === null || 
			req.body.floatToSupplier.toString().trim().length === 0 ||  req.body.inquiryVersion === undefined || req.body.inquiryVersion === null || 
			req.body.inquiryVersion.toString().trim().length === 0 || 
			req.body.status === undefined || req.body.status === null ||
			req.body.status.toString().trim().length === 0 
			))
	{
		var inquiryId = req.body.inquiryId;
		var floatToSupplier = req.body.floatToSupplier;
		var inquiryVersion = req.body.inquiryVersion;
		var status = req.body.status;

		validateAndAssignSuppliers(inquiryId, inquiryVersion, floatToSupplier, status, function(error, resJson){
			if(!error)
			{
				logger.debug(TAG + "sellers details updated and inquiry floated successfully for inquiryId: " + inquiryId + " ,inquiryVersion: " + inquiryVersion);
				updateInquiryStatus(inquiryId, inquiryVersion, status, function(err, results){
					if(!error)
					{
						logger.debug(TAG + "Inquiry Status updated and inquiry floated successfully for inquiryId: " + inquiryId + " ,inquiryVersion: " + inquiryVersion);
						return callback(false, resJson);
					}
					else
					{
						logger.error(TAG + "Error -Failed to update Inquiry Status for inquiryId: " + inquiryId + " ,inquiryVersion: " + inquiryVersion);
						resJson = {
						    "http_code" : "500",
							"message" : "Error updating inquiry status, Please retry.."
						};
						return callback(true, resJson);
					}	
				});		
			}
			else
			{
				/*resJson = {
				    "http_code" : "500",
					"message" : "Error updating inquiry status, Please retry.."
				};*/
				logger.error(TAG + "Error - error updating sellers details and floating inquiries for inquiryId: " + inquiryId + " ,inquiryVersion: " + inquiryVersion +" error: " + error);
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
  console.log(TAG + "Exception in floatInquiryToSuppliers- " + e);
  logger.error(TAG + "Exception in floatInquiryToSuppliers:- error :" + e);
  resJson = {
			    "http_code" : "500",
				"message" : "Server Error. Please try again."
		};
  return callback(true, resJson);
}
};


//Function to generate Inquiry id
function validateAndAssignSuppliers(inquiryId, inquiryVersion, floatToSupplier, status, callback){
  
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;

	var inquirySellerFloatColl = db.collection("InquirySellerFloat");
	var inquiryMasterColl = db.collection("InquiryMaster");
	var supplierArray = [];

	if (status === "EditInProgress" || status === "PendingApproval")
	{

		inquiryMasterColl.findOne({"inquiryEntity.inquiryId": inquiryId, "inquiryEntity.inquiryVersion": inquiryVersion}, function(error, inqResults){
		  	if(!error)
		  	{
		  		if(inqResults === null || inqResults.inquiryEntity.inquiryStructured === undefined)
		  		{
		  			logger.error(TAG + "Structured Inquiry doesnt exist for inquiryId: " + inquiryId + " err: " + error);
					resJson = {
						    "http_code" : "500",
							"message" : "Inquiry cannot be floated to Suppliers ,Please add products details and retry.."
					};
					return callback(true, resJson);
				}
				else
				{
					validateSuppliers(inquiryId, inquiryVersion, floatToSupplier, function(errs, resJson){
						if(!errs)
						{	
							var updatedFloatToSupplier = resJson;
							logger.debug(TAG + "Suppliers Validated Successfully for inquiryId: " + inquiryId + ",inquiryVersion: " + inquiryVersion);
							inquirySellerFloatColl.findOne({"inquirySellerEntity.inquiryId": inquiryId, "inquirySellerEntity.inquiryVersion": inquiryVersion},
								{"inquirySellerEntity.inquiryStatus":1, "inquirySellerEntity.sellers":1}, function(error, qryResults){
							  	if(!error)
							  	{
							  		// If the Inquiry Status is already 
						  			if( qryResults !== null && qryResults.inquirySellerEntity.inquiryStatus === "PendingApproval")
						  			{
						  				logger.error(TAG + "Validation- inquiry is Pending for Approval, Cannot update inquiryId: " + inquiryId + " err: " + error);
										resJson = {
											    "http_code" : "500",
												"message" : "Inquiry Cannot be updated, Inquiry is already submitted for Approval."
										};
										return callback(true, resJson);
						  			}
						  			else
						  			{	
										// If supplierType is SupplierLeads, then perform operations in SupplierLead table.
										assignSuppliers(updatedFloatToSupplier, qryResults, status, function(error, createSchemaFlag, existingSellers){
											if(error)
											{
												logger.error(TAG + "Error in assignSuppliers, existingSellers: " + JSON.stringify(existingSellers));
												resJson = {
												    "http_code" : "500",
													"message" : "Internal Server Error, Please retry.."
													};
												return callback(true, resJson);
											}
											else
											{
												logger.debug(TAG + "final Seller block formed for update." + JSON.stringify(existingSellers));
												
												if(createSchemaFlag === false)
												{	
													//update the Inquiry collection with Seller Details to whom Inquiry will be sent.
													inquirySellerFloatColl.update({"inquirySellerEntity.inquiryId": inquiryId, "inquirySellerEntity.inquiryVersion": inquiryVersion},
														{"$set": {"inquirySellerEntity.sellers": existingSellers, "inquirySellerEntity.inquiryStatus": status}},function(err, result) {
														if(!err && result.result.n > 0)
														{
															logger.debug(TAG + "sellers details updated and inquiry floated successfully for inquiryId: " + inquiryId);
												            resJson = {
																    "http_code" : "200",
																	"message" : "inquiry assignment to all sellers saved/submited successfully."
															};
															return callback(false, resJson);
														}
														else if(!err && result.result.n < 1)
													  	{
													  		logger.error(TAG + " Record Not Found - Failed Updating seller Details to inquiry for inquiryId: "+ inquiryId);
													  		resJson = {
																    "http_code" : "500",
																	"message" : "Record Not Found - Error updating inquiry, Please retry.."
															};
															return callback(true, resJson);
													  	}
														else
														{
															logger.error(TAG + " Error updating sellers details in inquiry collection for inquiryId: " + inquiryId + " err: " + err);
															resJson = {
																    "http_code" : "500",
																	"message" : "Error updating inquiry, Please retry.."
															};
															return callback(true, resJson);
														}
													});
												}
												else
												{
							        				var insertJSON = {
														"inquirySellerEntity": 
														{
															"inquiryId": inquiryId,
															"inquiryVersion": inquiryVersion,
															"inquiryStatus": status,
															"sellers": existingSellers
														}
													};
													//update the Inquiry collection with Seller Details to whom Inquiry will be sent.
													inquirySellerFloatColl.insert(insertJSON,function(err, result) {
														if(!err)
														{
															logger.debug(TAG + "inquiry floated successfully for inquiryId: " + inquiryId);
												            resJson = {
																    "http_code" : "200",
																	"message" : "inquiry assignment to all sellers saved/submited successfully."
															};
															return callback(false, resJson);
														}
														else
														{
															logger.error(TAG + " Error creating inquiry for inquiryId: " + inquiryId + " err: " + err);
															resJson = {
																    "http_code" : "500",
																	"message" : "Error updating inquiry, Please retry.."
															};
															return callback(true, resJson);
														}
													});
												}	
											}
										});	
									}
								}
								else
								{
									logger.error(TAG + " Error querying sellers details in inquiry collection for inquiryId: " + inquiryId + " err: " + error);
									resJson = {
										    "http_code" : "500",
											"message" : "Error updating inquiry, Please retry.."
									};
									return callback(true, resJson);
								}
							});	
						}
						else
						{	
							logger.error(TAG + " Failed validating Suppliers for inquiryId: " + inquiryId);
							return callback(true, resJson);
						}	
					});
				}
			}
			else
			{
				logger.error(TAG + " Error querying InquiryMaster collection for inquiryId: " + inquiryId + " err: " + error);
				resJson = {
					    "http_code" : "500",
						"message" : "Error updating inquiry, Please retry.."
				};
				return callback(true, resJson);
			}
		});	
	}
	else
	{
		logger.error(TAG + " Error-Invalid status received for inquiryId: " + inquiryId + "inquiryVersion: " + inquiryVersion + ", status: " + status);
		resJson = {
			    "http_code" : "500",
				"message" : "Error- ,status: " + status + " is not a valid status , Please retry.."
		};
		return callback(true, resJson);
	}
}


//Function that will update the new quotation array in to DB.
function validateSuppliers(inquiryId, inquiryVersion, floatToSupplier, callback){

	/// Need to validateSuppliers by running in Parallel.
		//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;

	var sellerMasterColl = db.collection("SellerMaster");

	var productsRepeated = false;
	validatedFlag = true;
	for(var i = 0; i < floatToSupplier.length; i++)
	{
		var productIds = [];
		var products = floatToSupplier[i].products;
		var suppliers = floatToSupplier[i].suppliers;
		//if(products.length < 1 || suppliers.length < 1 )
        if(products.length < 1)
		{
			logger.error(TAG + " Error no products details exist for inquiryId: " + inquiryId + "floatToSupplier: " + floatToSupplier[i]);
			validatedFlag = false;
			break;
			//return callback(true, resJson);
		}

		for(var j = 0; j < products.length; j++){
			if(!underscore.contains(productIds, products[j].productId)){
				productIds.push(products[j].productId);
			}
			else{
				logger.error(TAG + " Error products repeated for inquiryId: " + inquiryId + "floatToSupplier: " + floatToSupplier[i]);
				productsRepeated = true;
				break;
			}
		}
	};

	if(productsRepeated){
		logger.error(TAG + " Error- product details repeated for inquiryId: " + inquiryId);
		resJson = {
		    "http_code" : "500",
			"message" : "Error assigning suppliers to inquiry, product details repeated, Please retry.."
		};
		return callback(true, resJson);
	}

	logger.debug(TAG + "validatedFlag: " + validatedFlag);
	if(validatedFlag === false)
	{
		logger.error(TAG + " Error- No products details available for inquiryId: " + inquiryId);
		resJson = {
		    "http_code" : "500",
			"message" : "Error assigning suppliers to inquiry, No products details available, Please retry.."
		};
		return callback(true, resJson);
	}
	else
	{
		var floatToSupplierArray = [];
		var nonValidatedSupplier = [];
		async.eachSeries(floatToSupplier, function(floatToSupplierSingle, asyncCallback){
			var taskArray = [];
			var suppliers = floatToSupplierSingle.suppliers;

			suppliers.forEach(function(element, index, array){	

				taskArray.push(function(tCallback){	

					sellerMasterColl.findOne({"sellerEntity.profileInfo.accountInfo.sellerId": element.supplierId, "sellerEntity.sellerVerificationStatus": {$ne : "disabled"}, "sellerEntity.sellerAccessInfo.hasEnquiryAccess": true}, function(error, results){
					  	if(!error && results !== null)
					  	{
					  		var supplierDetails = {
					  			"supplierId": element.supplierId,
					  			"companyName":results.sellerEntity.profileInfo.basicInfo.companyInfo.companyName
					  		};
					  		tCallback(false, supplierDetails);
					  	}
					  	else
					  	{
					  		nonValidatedSupplier.push(element.supplierId);
					  		logger.error(TAG + "Could not validate the Supplier: " + element.supplierId + ", for inquiryId: " + inquiryId);
							tCallback(true);	
					  	}
					});	
				});	
			});

			//Finally executing tasks in parallel.
			async.parallelLimit(taskArray, 10, function(error, result){
				if(!error)
				{
					floatToSupplierSingle.suppliers = result;
					floatToSupplierArray.push(floatToSupplierSingle);
					logger.debug(TAG + " succesfully executed all tasks in array parallelly.");
					asyncCallback(false, result);
				}
				else
				{
					//nonValidatedSupplier.push(result);
					logger.error(TAG + " Atleast One Supplier was not validated. Supplier: " + nonValidatedSupplier);
					logger.error(TAG + " error in executing tasks in array parallelly.");
					asyncCallback(true, result);
				}
			});
		}, function(error){
			if(error)
			{
				logger.error(TAG + " Failed validating Suppliers: "+ nonValidatedSupplier + " . for inquiryId: " + inquiryId);
				resJson = {
							    "http_code" : "500",
								"message" : "Could not validate SupplierId : "+ nonValidatedSupplier+ ". Please verify.."
						};
				callback(true, resJson);
			}
			else
			{
				logger.debug(TAG + " successfully validated all suppliers.");
				callback(false, floatToSupplierArray);
			}
		});
	}	
}


//Function that will update the new quotation array in to DB.
function assignSuppliers(floatToSupplier, qryResults, status, callback){
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;
	// variable to hold new seller deatils in suppliersQuotations

	// Do identify, If we need to Create a new document or Update the Document.
	var createSchemaFlag = false;
	if(qryResults === null)
	{
		var existingSellers = [];
		createSchemaFlag = true;
	}
	else
	{
		var existingSellers = qryResults.inquirySellerEntity.sellers;
		createSchemaFlag = false;
	}
	// Run a loop to go through each of the group and assign respective suppliers.
	async.forEachSeries(floatToSupplier, function(floatSuppliers, asyncCallback)
	{	
		var products = floatSuppliers.products;
		var suppliers = floatSuppliers.suppliers;

		// Loop for each of the suppliers in the group.
		async.forEachSeries(suppliers, function(supplier, asyCallback)
			{
				// check if Suppliers already exist for the Inquiry.
				var supplierId = supplier.supplierId;
				var companyName = supplier.companyName;
				var supplierExist = false;
				for(var j = 0; j < existingSellers.length; j++)
				{
					if(supplierId === existingSellers[j].sellerId)
					{
						supplierExist = true;
					}	
				};
				logger.debug(TAG + "supplierExist: " + supplierExist);
				// if supplier doesnt exist, create the supplier entry with all Products assigned to him.
				if(supplierExist === false)
				{
					// variable to hold new quotations array.	
					var sellerProducts = [];
					for(var k = 0; k < products.length; k++)
					{
						sellerProducts.push({"productId" : products[k].productId, 
			        		 "productIdentifier" : products[k].productIdentifier,
			        		 "productName" : products[k].productName
			        		});
					}
					
					logger.debug(TAG + "sellerProducts added: " +  JSON.stringify(sellerProducts));	
					generateSellerQuotationId(supplierId, function(err, result){
		  				if(!err)
		  				{
							var sellerDetails = 
							{
						        "sellerId" : supplierId, 
						        "companyName" : companyName,
						        "sellerquotationId": result,
						        "status" : status,
						        "overRideEditQuoteRule": false,
						        "editQuoteCount": 0,
						        "mSupplySupplier" : false,
						        "mySupplier" : false,
						        "lastUpdatedDate" : new Date(),
						        "deliveryCharges": "",
						        "sellerRemarks": "",
						        "termsAndConditions": false,
						        "CSTCharges": "",
						        "quoteValidUpTo": "",
						        "deliveryTime": "", 
						        "products" : sellerProducts
					    	};
							existingSellers.push(sellerDetails);
							logger.debug(TAG + "sellerDetails added to seller Array: " +  JSON.stringify(sellerDetails));
							return asyCallback();
						}
						else
						{
							logger.error(TAG + "error in generateSellerQuotation, err: " + err);	
							return asyCallback(true);
						}
					});		
				}
				else
				// if supplier exist, update supplier with all non exissting Products.	
				{
					// get the location of exsisting supplierid.
					for(var l = 0; l < existingSellers.length; l++)
					{
						if(supplierId === existingSellers[l].sellerId)
						{	
							logger.debug(TAG + "supplierId matched for: " + supplierId);
							var existingSellerProducts = existingSellers[l].products;
							for(var k = 0; k < products.length; k++)
							{
								// check if the productId already exist.
								var productIdExist = false;
								for(var q = 0; q < existingSellerProducts.length; q++)
								{
									if(products[k].productId == existingSellerProducts[q].productId)
									{	
										productIdExist = true;
						        	}	
								}
								if(productIdExist === false)
								{ 	
									existingSellerProducts.push({"productId" : products[k].productId, 
					        		 "productIdentifier" : products[k].productIdentifier,
					        		 "productName" : products[k].productName
					        		});
					        		existingSellers[l].products = existingSellerProducts;
								}	
							}
							// update the status and lastUpdated Time for the supplier.
							existingSellers[l].lastUpdatedDate = new Date();
			        		existingSellers[l].status = status;
			        		logger.debug(TAG + "existingSellers: " + JSON.stringify(existingSellers));
						}	
					};
					return asyCallback();
				}	
			},
			function(error)
			{
			 	if(!error)
			 	{
				 	return asyncCallback();
			 	}
			 	else
			 	{
			 		return asyncCallback(true);
			 	}
			}
		);
	},
	function(error)
		{
		 	if(!error)
		 	{
				//creating input structure.
				var inputStructureArray = [], suppliers  = [];
				var finalArray = [];
				for(var i = 0; i < floatToSupplier.length; i++){
					for(var j = 0; j < floatToSupplier[i].suppliers.length; j++){
						//checking weather seller is already added in array.If not adding seller and coresponding products to him.
						if(!(underscore.contains(suppliers, floatToSupplier[i].suppliers[j].supplierId))){
							suppliers.push(floatToSupplier[i].suppliers[j].supplierId);

							var supData = {};
							supData["supplierID"] = floatToSupplier[i].suppliers[j].supplierId;
							supData["products"] = [];
							//adding products.
							for(var k = 0; k < floatToSupplier[i].products.length; k++){
								supData["products"].push(floatToSupplier[i].products[k]);
							}

							inputStructureArray.push(supData);
						} // If seller already added, only adding coresponding products to him.
						else{
							for(var a = 0; a < inputStructureArray.length; a++){
								if(inputStructureArray[a].supplierID === floatToSupplier[i].suppliers[j].supplierId){
									//adding products.
									for(var b = 0; b < floatToSupplier[i].products.length; b++){
										inputStructureArray[a].products.push(floatToSupplier[i].products[b]);
									}
								}
							}
						}
					}
				}

				//Removing unwanted suppliers and corresponding products by comparing inputstructure created and result returned.
				for(var i = 0; i < inputStructureArray.length; i++){
					for(var j = 0; j < existingSellers.length; j++){
						//Adding suppliers if only supplier id present in input, discarding other suppliers.
						if(inputStructureArray[i].supplierID === existingSellers[j].sellerId){
							
							var products = [];

							//Adding products if only product id present in input, discarding other products.
							for(var k = 0; k < inputStructureArray[i].products.length; k++){
								for(var l = 0; l < existingSellers[j].products.length; l++){
									if( inputStructureArray[i].products[k].productId === existingSellers[j].products[l].productId){
										products.push(existingSellers[j].products[l]);
									}
								}
							}
							existingSellers[j].products = products;
							finalArray.push(existingSellers[j]);
						}
					}
				}

			 	return callback(null, createSchemaFlag, finalArray);
		 	}
		 	else
		 	{
		 		return callback(true, null, null);
		 	}
		}
	);   	
}


//Function to generate Inquiry id
function generateSellerQuotationId(supplierId, callback){
  var db = dbConfig.mongoDbConn;

  //Variable for Logging the messages to the file.
	var logger = log.logger_rfq;

	db.collection('counters').findAndModify({ _id: 'sellerquotationId'},null, { $inc: { seq: 1 } }, {new: true}, function(err, result){
    if (err) {
      logger.error(TAG + "Fetching the counters value for sellerquotationId Failed.");
      callback(true);
    } else {
      logger.debug(TAG + "Fetching the counters value for sellerquotationId Sucess.");

      callback(false, "Q" + new Date().getFullYear() + supplierId + ('00000' + result.value.seq).slice(-6));
    }
  });
}

//Function to updateInquiryStatus in InquiryMaster after Floating to Supplier.
function updateInquiryStatus(inquiryId, inquiryVersion, status, callback){
  
  var db = dbConfig.mongoDbConn;

  var inquiryMasterColl = db.collection("InquiryMaster");
  var inquiryFloatColl = db.collection("InquirySellerFloat");
  //Variable for Logging the messages to the file.
  var logger = log.logger_rfq;

	async.parallel([
		//Function to get Service Tax.
		function(asyncCallback){

			//update the Inquiry collection with Seller Details to whom Inquiry will be sent.
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
					return asyncCallback(true, "Record Not Found");
				}
			});
		},
		//Function to get swachhBharatCess.
		function(asyncCallback){
			//update the previous version of the Inquiry to Inactive.
			if(inquiryVersion > 1)
			{	
				var previousInquiryVersion = inquiryVersion -1;
				inquiryFloatColl.update({"inquiryEntity.inquiryId": inquiryId, "inquiryEntity.inquiryVersion": previousInquiryVersion},
					{"$set": {"inquiryEntity.inquiryStatus": "InActive"}},function(err, result) {
					if(!err && result.result.n > 0)
					{
						logger.debug(TAG + "inquiryStatus updated in InquiryMaster successfully for inquiryId: " + inquiryId);
						return asyncCallback(false, null);
					}
					else if(!err && result.result.n < 1)
				  	{
				  		logger.error(TAG + " Record Not Found - Failed Updating inquiryStatus in InquiryMaster for inquiryId: "+ inquiryId);
						return asyncCallback(false, null);
				  	}
					else
					{
						logger.error(TAG + " Error updating inquiryStatus in InquiryMaster collection for inquiryId: " + inquiryId + " err: " + err);
						return asyncCallback(true, err);
					}
				});
			}
			else
			{
				return asyncCallback(false, null);
			}	
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