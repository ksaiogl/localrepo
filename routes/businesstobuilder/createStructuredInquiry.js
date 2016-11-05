var TAG = "createStructuredInquiry.js - ";
var async = require('async');
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var underscore = require('underscore');

//Function to create structured enquiry for Suppliers.
exports.structureEnquiry = function structureEnquiry (req, callback){
	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;

	logger.info(TAG + " Entering creating structured inquiry.");
	logger.info(TAG + " Request body :"+JSON.stringify(req.body));

	//Global varisbles.
	var inquiryDetails = {
		"inquiry": null,
		"canUpdate": true
	}
	//Input validation.
	//Validate the request.
	if ( !(	req.body === null || 
		    req.body.inquiryId === undefined || 
		    req.body.inquiryId === null || 
			req.body.inquiryId.toString().trim().length === 0 ||
			req.body.products === undefined || 
		    req.body.products === null ||
		    req.body.remarks === undefined || 
		    //req.body.remarks === null ||
		    req.body.respondByDate === undefined || 
		    req.body.packingAndFreightRequirements === undefined ||
		    req.body.respondByDate === null || 
			req.body.respondByDate.toString().trim().length === 0 ||
			req.body.inquiryCity === undefined || 
		    req.body.inquiryCity === null || 
			req.body.inquiryCity.toString().trim().length === 0 	
	)){

		//validating products.
		if(req.body.products.length === 0){
			resJson = {
			    "http_code" : "400",
				"message" : "Bad or ill-formed request, products cannot be empty."
			};
			logger.error(TAG + "Bad or ill-formed request, products cannot be empty."+JSON.stringify(req.body));
			return callback(true, resJson);
		}

		//validating fields inside produts.
		for(var i = 0; i < req.body.products.length; i++){
			if(req.body.products[i].productIdentifier === undefined || req.body.products[i].productIdentifier === null || req.body.products[i].productIdentifier.toString().trim().length === 0 ){
				resJson = {
				    "http_code" : "400",
					"message" : "Bad or ill-formed request, productIdentifier is a mandatory field."
				};
				logger.error(TAG + "Bad or ill-formed request, either productIdentifier is not given or its value is empty or null."+JSON.stringify(req.body));
				return callback(true, resJson);
			}

			if(req.body.products[i].quantityUnit === undefined || req.body.products[i].quantityUnit === null || req.body.products[i].quantityUnit.toString().trim().length === 0 ){
				resJson = {
				    "http_code" : "400",
					"message" : "Bad or ill-formed request, quantityUnit is a mandatory field."
				};
				logger.error(TAG + "Bad or ill-formed request, quantityUnit is not given or its value is empty or null."+JSON.stringify(req.body));
				return callback(true, resJson);
			}

			if(req.body.products[i].quantity === undefined || req.body.products[i].quantity === null || req.body.products[i].quantity.toString().trim().length === 0 ){
				resJson = {
				    "http_code" : "400",
					"message" : "Bad or ill-formed request, quantity is a mandatory field."
				};
				logger.error(TAG + "Bad or ill-formed request, quantity is not given or its value is empty or null."+JSON.stringify(req.body));
				return callback(true, resJson);
			}

			if(req.body.products[i].brand === undefined && req.body.products[i].subCategory === undefined){
				resJson = {
				    "http_code" : "400",
					"message" : "Bad or ill-formed request, brand or subCategory is mandatory."
				};
				logger.error(TAG + "Bad or ill-formed request, brand or subCategory is not given."+JSON.stringify(req.body));
				return callback(true, resJson);
			}
			//Either od Subcategory or Brand Value should exist.
			// If subCategory Doesnt Exist and Also Brand Doesnt Exist, Give out error.
			if(req.body.products[i].subCategory === undefined || req.body.products[i].subCategory === null || req.body.products[i].subCategory.toString().trim().length === 0 ){
				if(req.body.products[i].brand === undefined || req.body.products[i].brand === null || req.body.products[i].brand.toString().trim().length === 0 ){
					resJson = {
					    "http_code" : "400",
						"message" : "Bad or ill-formed request, either brand/subCategory should be entered."
					};
					logger.error(TAG + "Bad or ill-formed request, either brand/subCategory should be entered.."+JSON.stringify(req.body));
					return callback(true, resJson);
				}
			}

			/*if(req.body.products[i].subCategory !== undefined){
				if(req.body.products[i].subCategory !== undefined || req.body.products[i].subCategory === null || req.body.products[i].subCategory.toString().trim().length === 0 ){
					resJson = {
					    "http_code" : "400",
						"message" : "Bad or ill-formed request, subCategory value is empty or null, please give proper subCategory name."
					};
					logger.error(TAG + "Bad or ill-formed request, subCategory value is empty or null, please give proper subCategory name."+JSON.stringify(req.body));
					return callback(true, resJson);
				}
			}*/
		}

		//validating 

		async.series([
			//Function to get data from inquiry master collection.
			function(asyncCallback){
				getInquiryMaster(req, function(error, result){
					if(error){
						logger.debug(TAG + " No matching docs found in inquiry master, moving forward");
						return asyncCallback(true);
					}
					else{
						inquiryDetails.inquiry = result[0];
						req["inquiryMasterDetails"] = result[0];

						//checking inquiry status to update product details.
						if(result[0].inquiryEntity.inquiryStatus === "Open" || result[0].inquiryEntity.inquiryStatus === "EditInProgress"
							|| result[0].inquiryEntity.inquiryStatus === "PendingApproval"){
							logger.debug(TAG + " Fetched inquiries master successfully, moving forward");
							return asyncCallback();
						}
						else{
							inquiryDetails.canUpdate = false;
							logger.debug(TAG + " Fetched inquiries master successfully, but can't update because of inquiry status.");
							return asyncCallback(true);
						}
					}
				});
			},
			//Function to create structured inquiry.
			function(asyncCallback){
				updateInquiryStructure(req, function(error, result){
					if(error){
						logger.debug(TAG + " error while structuring inquiry, moving forward");
						return asyncCallback(true);
					}
					else{
						logger.debug(TAG + " structuring inquiries successfully, moving forward");
						return asyncCallback();
					}
				});
			}
		],
		function(error){
			if(error){

				if(inquiryDetails.inquiry === null){
					resJson = {
					    "http_code" : "404",
						"message" : "No inquiries found for the inquiryid. Please Retry."
					};
					logger.debug(TAG + " Inquiries not found for inquiryId "+req.body.inquiryId);
					return callback(false, resJson);
				}

				if(inquiryDetails.canUpdate === false){
					resJson = {
					    "http_code" : "500",
						"message" : "Cannot edit inquiry as it is floated to supplier."
					};
					logger.debug(TAG + " Cannot edit inquiry with inquiryid: "+req.body.inquiryId+" as it is floated to supplier.");
					return callback(true, resJson);
				}

				resJson = {
				    "http_code" : "500",
					"message" : "Unexpected Server Error while updating inquiry details."
				};
				logger.debug(TAG + " Unexpected Server Error while updating inquiry details.");
				return callback(true, resJson);
			}
			else{
				resJson = {
				    "http_code" : "200",
					"message" : "successfully updated inquiry."
				};
				logger.debug(TAG + " successfully updated inquiry.");
				return callback(false, resJson);
			}
		});
	}
	else{
		resJson = {
		    "http_code" : "400",
			"message" : "Bad or ill-formed request.."
		};
		logger.error(TAG + "Bad or ill-formed request.."+JSON.stringify(req.body));
		return callback(true, resJson);
	}
}

//Function to create structured inquiry with respect to given inquiryid.
function updateInquiryStructure(req, callback){
	var db = dbConfig.mongoDbConn;
	var logger = log.logger_rfq;

	logger.debug(TAG + " updating/creating new docs in InquiryMaster collection for inquiryId "+req.body.inquiryId);

	var inquiryMasterColl = db.collection('InquiryMaster');

	//Getting inquiry city.
	var inquiryCity = req.body.inquiryCity;

	//Getting inquiry respondByDate date.
	var respondByDate = "";
	respondByDate = new Date(req.body.respondByDate).setHours(18, 29, 29, 999);
	respondByDate = new Date(respondByDate);

	//checking weather "inquiryStructured" field is present or not.
	//If present update status of latest document to inactive, create new document with product details given.
	if( "inquiryStructured" in req.inquiryMasterDetails.inquiryEntity ){

		//Adding product id's. 
		var products = [];
		var checkDuplicates = [];

		for(var i = 0 ; i < req.body.products.length; i++){
			req.body.products[i]["productId"] = (i+1).toString();

			//converting date string to date object.
			if(req.body.products[i].deliveryByDate === undefined || req.body.products[i].deliveryByDate === null || req.body.products[i].deliveryByDate.toString().trim().length === 0)
			{
				req.body.products[i].deliveryByDate = "";
			}
			else
			{
				req.body.products[i].deliveryByDate = new Date(req.body.products[i].deliveryByDate);
			}

			//products.push(req.body.products[i]);
			//checking for duplicate brand and product identifier.
			var duplicateCount = underscore.where(checkDuplicates, {brand: req.body.products[i].brand, productIdentifier: req.body.products[i].productIdentifier});
			if(duplicateCount.length === 0){
				checkDuplicates.push({brand: req.body.products[i].brand, productIdentifier: req.body.products[i].productIdentifier});
				products.push(req.body.products[i]);
			}

		}

		//Updating latest document status to inactive. 
		inquiryMasterColl.update({"inquiryEntity.inquiryId": req.body.inquiryId, "inquiryEntity.inquiryStatus": { $ne: "Inactive"}},
			{ $set: { "inquiryEntity.inquiryStructured.inquiryParams": products,  "inquiryEntity.inquiryCity": inquiryCity, "inquiryEntity.remarks": req.body.remarks, "inquiryEntity.packingAndFreightRequirements": req.body.packingAndFreightRequirements, "inquiryEntity.respondByDate": respondByDate, "inquiryEntity.lastUpdatedDate": new Date()} },function(error, result) {
			if (error) {
				logger.error(TAG + " can't update inquiryVersion, inquiryParams, inquiryCity, remarks field in InquiryMaster collection, error :"+JSON.stringify(error));
				return callback(true);
			} else {
				logger.error(TAG + " updated inquiryVersion, inquiryParams, inquiryCity, remarks field in InquiryMaster collection successfully.");
				return callback(false);
			}
		});
	}
	else{//If not present create field and add product values also add inquiry version field and set to 1.

		//checking wether to get project address details from builder collection.
		if(req.inquiryMasterDetails.inquiryEntity.shipToProjectAddress === true){
			//Getting project details.
			var reqObj = {
				"companyId": req.inquiryMasterDetails.inquiryEntity.associatedCompanyId,
				"projectType": req.inquiryMasterDetails.inquiryEntity.associatedProjectType,
				"projectId": req.inquiryMasterDetails.inquiryEntity.associatedProjectId
			};

			var shippingAddress = {
	            "addressLine1" : "", 
	            "addressLine2" : "", 
	            "city" : "", 
	            "state" : "", 
	            "pincode" : ""
	        }

			//function to get project details.
			getProjectDetails(reqObj, function(error, projectDetails){
				if(!error){
					
					//If project is removed from collection.
					if(projectDetails === null){
						logger.error(TAG + " project not found for companyId: "+reqObj.companyId+", projectType: "+reqObj.projectType+", projectId: "+reqObj.projectId);
						logger.error(TAG + " continuing without updating project address.");
					}
					else{
						shippingAddress.addressLine1 = projectDetails.address1;
						shippingAddress.addressLine2 = projectDetails.address2;
						shippingAddress.city = projectDetails.city;
						shippingAddress.state = projectDetails.state;
						shippingAddress.pincode = projectDetails.pincode;
					}
					//Adding product id's. 
					var products = [];
					var checkDuplicates = [];
					for(var i = 0 ; i < req.body.products.length; i++){
						req.body.products[i]["productId"] = (i+1).toString();

						//converting date string to date object.
						if(req.body.products[i].deliveryByDate === undefined || req.body.products[i].deliveryByDate === null || req.body.products[i].deliveryByDate.toString().trim().length === 0)
						{
							req.body.products[i].deliveryByDate = "";
						}
						else
						{
							req.body.products[i].deliveryByDate = new Date(req.body.products[i].deliveryByDate);
						}

						//products.push(req.body.products[i]);
						//checking for duplicate brand and product identifier.
						var duplicateCount = underscore.where(checkDuplicates, {brand: req.body.products[i].brand, productIdentifier: req.body.products[i].productIdentifier});
						if(duplicateCount.length === 0){
							checkDuplicates.push({brand: req.body.products[i].brand, productIdentifier: req.body.products[i].productIdentifier});
							products.push(req.body.products[i]);
						}
					}

					//Updating inquiryId, adding given input products, remarks and references.
					inquiryMasterColl.update({"inquiryEntity.inquiryId": req.body.inquiryId},
						{ $set: {"inquiryEntity.inquiryVersion": 1, "inquiryEntity.inquiryStructured.inquiryParams": products, "inquiryEntity.remarks": req.body.remarks, "inquiryEntity.packingAndFreightRequirements": req.body.packingAndFreightRequirements, "inquiryEntity.shippingAddress": shippingAddress, "inquiryEntity.inquiryCity": inquiryCity, "inquiryEntity.respondByDate": respondByDate, "inquiryEntity.lastUpdatedDate": new Date()}},function(error, result) {
						if (error) {
							logger.error(TAG + " can't update inquiryVersion, inquiryParams,  references in InquiryMaster collection, error :"+JSON.stringify(error));
							return callback(true);
						} else {
							logger.error(TAG + " updation of InquiryMaster collection successfull.");
							return callback(false);
						}
					});
				}
				else{
					return callback(true);
				}
			});
		}
		else{
			//Adding product id's. 
			var products = [];
			var checkDuplicates = [];
			for(var i = 0 ; i < req.body.products.length; i++){
				req.body.products[i]["productId"] = (i+1).toString();

				//converting date string to date object.
				if(req.body.products[i].deliveryByDate === undefined || req.body.products[i].deliveryByDate === null || req.body.products[i].deliveryByDate.toString().trim().length === 0)
				{
					req.body.products[i].deliveryByDate = "";
				}
				else
				{
					req.body.products[i].deliveryByDate = new Date(req.body.products[i].deliveryByDate);
				}

				//products.push(req.body.products[i]);
				//checking for duplicate brand and product identifier.
				var duplicateCount = underscore.where(checkDuplicates, {brand: req.body.products[i].brand, productIdentifier: req.body.products[i].productIdentifier});
				if(duplicateCount.length === 0){
					checkDuplicates.push({brand: req.body.products[i].brand, productIdentifier: req.body.products[i].productIdentifier});
					products.push(req.body.products[i]);
				}
			}

			//Updating inquiryId, adding given input products, remarks and references.
			inquiryMasterColl.update({"inquiryEntity.inquiryId": req.body.inquiryId},
				{ $set: {"inquiryEntity.inquiryVersion": 1, "inquiryEntity.inquiryStructured.inquiryParams": products, "inquiryEntity.remarks": req.body.remarks, "inquiryEntity.packingAndFreightRequirements": req.body.packingAndFreightRequirements, "inquiryEntity.respondByDate": respondByDate, "inquiryEntity.inquiryCity": inquiryCity, "inquiryEntity.lastUpdatedDate": new Date()}},function(error, result) {
				if (error) {
					logger.error(TAG + " can't update inquiryVersion, inquiryParams,  references in InquiryMaster collection, error :"+JSON.stringify(error));
					return callback(true);
				} else {
					logger.error(TAG + " updation of InquiryMaster collection successfull.");
					return callback(false);
				}
			});
		}
	}
}

//Function to get latest inquiry details with respect to given inquiryid with inquiry status other than inactive.
function getInquiryMaster(req, callback){

	var db = dbConfig.mongoDbConn;
	var logger = log.logger_rfq;

	logger.debug(TAG + " Fetching docs from InquiryMaster collection for inquiryId "+req.body.inquiryId);

	var inquiryMasterColl = db.collection('InquiryMaster');

	inquiryMasterColl.find({"inquiryEntity.inquiryId": req.body.inquiryId, "inquiryEntity.inquiryStatus": { $ne: "Inactive"}}).toArray(function(error, result){
		if(error){
			logger.error(TAG + " Fetching inquiry from inquiryMaster collection failed for inquiry id: "+req.body.inquiryId+". Error:" + JSON.stringify(error));
			return callback(true);
		}
		else if(!error && result.length > 0){
			return callback(false, result);
		}
		else if(!error && result.length === 0){
			logger.error(TAG + " inquiry not found in inquiryMaster collection for inquiry id: "+req.body.inquiryId);
			return callback(true);
		}
	});
}

//Function to get project details.
function getProjectDetails(reqObj, callback){
	var db = dbConfig.mongoDbConn;
	var logger = log.logger_rfq;

	logger.debug(TAG + " Fetching docs from builder collection for companyId "+reqObj.companyId);

	var BuilderColl = db.collection('Builder');
	var projectDetails = null;
	BuilderColl.find({"builderEntity.profileInfo.accountInfo.companyId": reqObj.companyId}).toArray(function(error, result){
		if(error){
			logger.error(TAG + " Fetching project details from builder collection failed for companyId: "+reqObj.companyId+". Error:" + JSON.stringify(error));
			return callback(true);
		}
		else if(!error && result.length > 0){
			var projectType = reqObj.projectType;
			var projectsArray = result[0].builderEntity.projects[projectType];
			
			for(var i = 0; i < projectsArray.length; i++){
				if(projectsArray[i].projectId === reqObj.projectId){
					projectDetails = projectsArray[i].address.projectAddress;
					break;
				}
			}
			logger.debug(TAG + " successfully got project details from builder collection for companyId: "+reqObj.companyId);
			return callback(false, projectDetails);
		}
		else if(!error && result.length === 0){
			logger.error(TAG + " builder details not found in builder collection for companyId: "+reqObj.companyId);
			return callback(true);
		}
	});
}