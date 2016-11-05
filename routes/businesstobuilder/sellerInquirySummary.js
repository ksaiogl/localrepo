var TAG = "sellerInquirySummary.js - ";
var async = require('async');
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var timezoneConversions = require('../helpers/timezoneConversions.js');
var underscore = require('underscore');

//Function to get inquiry summary for Suppliers.
exports.inquirySummary = function inquirySummary (req, callback){
	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;

	logger.info(TAG + " Entering inquiry summary.");
	logger.info(TAG + " Request body :"+JSON.stringify(req.body));
	//Local variables.
	var inquiryDetails = {
		    "inquiryIds" : [],			//stores inquiryids returned from "InquirySellerFloat" collection.
			"inquiryFloatDocs" : [],	//stores results from "InquirySellerFloat" collection.
			"inquiriesList": []			//stores results from "Inquiry" collection.
	};
	var myArray = [];
	var inquiryFloatHashMap = {};

	//Input validation.
	//Validate the request.
	if ( !(	req.body === null || 
		    req.body.sellerId === undefined || 
		    req.body.sellerId === null || 
			req.body.sellerId.toString().trim().length === 0 ||
			req.body.itemsPerPage === undefined ||
			req.body.itemsPerPage === null || 
			req.body.itemsPerPage.toString().trim().length === 0 ||
			isNaN(parseInt(req.body.itemsPerPage)) ||
			isNaN(parseInt(req.body.page))
	)){
		var sellerId = req.body.supplierSession.sellerEntity.profileInfo.accountInfo.sellerId;
        logger.debug(TAG + " sellerId from Session: "+ sellerId);

		async.series([
			//Function to get data from seller floats collection.
			function(asyncCallback){
				getSellerFloats(req, function(error, result){
					if(error){
						logger.debug(TAG + " No matching docs found in seller floats, moving forward");
						inquiryDetails.inquiryIds = result.inquiryIds;
						inquiryDetails.inquiryFloatDocs = result.inquiryFloatDocs;
						return asyncCallback(true);
					}
					else{
						inquiryDetails.inquiryIds = result.inquiryIds;
						inquiryDetails.inquiryFloatDocs = result.inquiryFloatDocs;

						//creating new field to store docs returned from supplier float collection.
						req["inquiryFloatResult"] = inquiryDetails;

						//creating new object with inquiryid as key and its details as values.[Helps for fetching inquiry details fast] 
						result.inquiryFloatDocs.forEach(function(element, index, array){
							inquiryFloatHashMap[element.inquirySellerEntity.inquiryId] = element
						});

						logger.debug(TAG + " Fetched seller floats successfully, moving forward");
						return asyncCallback();
					}
				});
			},
			//Function to get data from inquiry collection.
			function(asyncCallback){
				getInquiries(req, function(error, result){
					if(error){
						inquiryDetails.inquiriesList = result;
						logger.debug(TAG + " No matching docs found in inquiry, moving forward");
						return asyncCallback(true);
					}
					else{
						inquiryDetails.inquiriesList = result;
						logger.debug(TAG + " Fetched inquiries successfully, moving forward");
						return asyncCallback();
					}
				});
			}],
			function(error){
				if(error){	

					//checking inquiry float array to show proper message.
					if(inquiryDetails.inquiryIds.length < 1){
							
						var res = {
							"inquiriesTotalCount": 0,
							"inquiryList": []
						}
						resJson = {
						    "http_code" : "404",
							"message" : res
						};
						logger.debug(TAG + " Inquiries float not found for seller "+ sellerId);
						return callback(false, resJson);
					}

					//checking inquiry list array to show proper message.
					if(inquiryDetails.inquiriesList.length < 1){
						var res = {
							"inquiriesTotalCount": 0,
							"inquiryList": []
						}
						resJson = {
						    "http_code" : "404",
							"message" : res
						};
						logger.debug(TAG + " Inquiries not found for seller "+sellerId);
						return callback(false, resJson);
					}

					resJson = {
					    "http_code" : "500",
						"message" : "Unexpected Server Error while fetching inquiry."
					};
					logger.debug(TAG + " Unexpected Server Error while fetching inquiry floats.");
					return callback(false, resJson);
				}
				else{

					//Creating final result my merging results from "InquirySellerFloat" and "Inquiry" collections.
					var finalResultList = [];
					var finalResultObj = {};

					//map that holds sorting rule.
					/*var sortMapping = {
						"EnquirySent": 1,
						"IntentToQuote": 2,
						"QuoteSubmitted": 3,
						"QuoteAmended": 4,
						"NotIntentToQuote": 5,
						"Expired": 6
					};

					//Used to store results for sorting.
					var sortingObj = {
						"1": [],
						"2": [],
						"3": [],
						"4": [],
						"5": [],
						"6": []
					};*/

					inquiryDetails.inquiriesList.forEach(function(element, index, array){

						if(element.inquiryEntity.inquiryId in inquiryFloatHashMap){
							var sellerStatus = inquiryFloatHashMap[element.inquiryEntity.inquiryId].inquirySellerEntity.sellers.status;
							if( !(sellerStatus === 'PendingApproval' || sellerStatus === 'EditInProgress') ){

								finalResultObj["inquiryId"] = element.inquiryEntity.inquiryId;
								finalResultObj["inquiryVersion"] = element.inquiryEntity.inquiryVersion;
								finalResultObj["inquiryRaisedTimestamp"] = timezoneConversions.toIST(element.inquiryEntity.inquiryTimestamp);
								finalResultObj["inquiryDeactivationDate"] = timezoneConversions.toIST(element.inquiryEntity.inquiryDeactivationDate);
							
								if(element.inquiryEntity.respondByDate === undefined){
									finalResultObj["respondByDate"] = "";
									finalResultObj["daysRemaining"] = "";
								}
								else{
									finalResultObj["respondByDate"] = timezoneConversions.toIST(element.inquiryEntity.respondByDate);
									//var timeDiff = (element.inquiryEntity.respondByDate.getTime() - new Date().getTime());
									var now = timezoneConversions.toIST(new Date());
									var respByDate = timezoneConversions.toIST(element.inquiryEntity.respondByDate);
									var timeDiff = (respByDate.getTime() - now.getTime());

									if(timeDiff < 0){
										finalResultObj["daysRemaining"] = "Respond By Date is Expired";
									}	
									else{
										timeDiff = Math.abs(timeDiff);
										finalResultObj["daysRemaining"] = Math.ceil(timeDiff / (1000 * 3600 * 24));
									}
								}
								
								finalResultObj["builderId"] = element.inquiryEntity.associatedbuilderId;
								finalResultObj["associatedCompanyId"] = element.inquiryEntity.associatedCompanyId;
								finalResultObj["customerFirstName"] = element.inquiryEntity.customerFirstName;
								finalResultObj["companyName"] = element.inquiryEntity.companyName;
								finalResultObj["customerLastName"] = element.inquiryEntity.customerLastName;

                                finalResultObj["projectSelected"] = element.inquiryEntity.projectSelected;
                                finalResultObj["associatedProjectName"] = element.inquiryEntity.associatedProjectName;
                                finalResultObj["associatedProjectId"] = element.inquiryEntity.associatedProjectId;
                                finalResultObj["associatedProjectType"] = element.inquiryEntity.associatedProjectType;

								finalResultObj["shippingAddress"] = element.inquiryEntity.shippingAddress;
								finalResultObj["paymentModes"] = element.inquiryEntity.paymentModes;
								finalResultObj["creditDaysNeeded"] = element.inquiryEntity.creditDaysNeeded;
								finalResultObj["targetPriceForQuotation"] = element.inquiryEntity.targetPriceForQuotation;
								finalResultObj["packingAndFreightRequirements"] = element.inquiryEntity.packingAndFreightRequirements;
								finalResultObj["advancePayment"] = element.inquiryEntity.advancePayment;
								finalResultObj["advancePaymentAmount"] = element.inquiryEntity.advancePaymentAmount;
								finalResultObj["shipToProjectAddress"] = element.inquiryEntity.shipToProjectAddress;
								finalResultObj["inquiryCity"] = element.inquiryEntity.inquiryCity;
								//Fetching product details.
								var sellerProducts = inquiryFloatHashMap[element.inquiryEntity.inquiryId].inquirySellerEntity.sellers.products;
								var productDetails = {}, products = [];
								
								if(element.inquiryEntity.inquiryStructured !== undefined){
									for(var i = 0; i < element.inquiryEntity.inquiryStructured.inquiryParams.length; i++){
										for(var j = 0; j < sellerProducts.length; j++){
											if(element.inquiryEntity.inquiryStructured.inquiryParams[i].productId == sellerProducts[j].productId){
												productDetails["productId"] = element.inquiryEntity.inquiryStructured.inquiryParams[i].productId;
												productDetails["productName"] = element.inquiryEntity.inquiryStructured.inquiryParams[i].productName;
												productDetails["quantity"] = element.inquiryEntity.inquiryStructured.inquiryParams[i].quantity;
												productDetails["quantityUnit"] = element.inquiryEntity.inquiryStructured.inquiryParams[i].quantityUnit;
												productDetails["subcategory"] = element.inquiryEntity.inquiryStructured.inquiryParams[i].subCategory;
												products.push(productDetails);
												productDetails = {};
											}
										}
									}
								}

								finalResultObj["products"] = products;
								products = [];

								finalResultObj["status"] = inquiryFloatHashMap[element.inquiryEntity.inquiryId].inquirySellerEntity.sellers.status;
								finalResultObj["inquiryStatus"] = inquiryFloatHashMap[element.inquiryEntity.inquiryId].inquirySellerEntity.inquiryStatus;
								finalResultObj["sellerquotationId"] = inquiryFloatHashMap[element.inquiryEntity.inquiryId].inquirySellerEntity.sellers.sellerquotationId;

								//Inserting inquiry into appropriate array in "sortingObj".
								//sortingObj[sortMapping[finalResultObj["status"]]].push(finalResultObj);

								finalResultList.push(finalResultObj);

								finalResultObj = {};
							}
						}
					});
					
					/*
					//sorting inquiries based on inquiryRaisedTimestamp.
					for(var i = 1; i < 7; i++ ){
						underscore.sortBy(sortingObj[i], 'inquiryRaisedTimestamp').reverse().forEach(function(element, index, array){
							finalResultList.push(element);
						});
					}*/

					var totalInquiriesCount = finalResultList.length;

					//slicing the final array to implement pagination.
					finalResultList = finalResultList.slice((req.body.page * req.body.itemsPerPage), ((req.body.page * req.body.itemsPerPage) + req.body.itemsPerPage));

					var res = {
						"inquiriesTotalCount": totalInquiriesCount,
						"inquiryList": finalResultList
					}
					resJson = {
					    "http_code" : "200",
						"message" : res
					};
					logger.debug(TAG + " inquiry Summary fetched Successfully.");
					return callback(false, resJson);
				}
			}
		);
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

//Function to get data from seller floats collection.
function getSellerFloats(req, callback){

	var db = dbConfig.mongoDbConn;
	var logger = log.logger_rfq;
	var inquiryIds = [];
	var query = [];
	var sellerId = req.body.supplierSession.sellerEntity.profileInfo.accountInfo.sellerId;

	logger.debug(TAG + " Fetching docs from InquirySellerFloat collection for sellerId "+sellerId);

	var sellerFloatColl = db.collection('InquirySellerFloat');

	//Filtering all inquiry inactive status docs.
	query.push({
		$match: {
			"inquirySellerEntity.inquiryStatus" : {
				$ne: "Inactive"
			}
		}
	});

	/*//Filtering on inquiry id if inquiry id is given in search box.
	if(req.body.textSearch !== undefined){
		if(req.body.textSearch !== null){
			query.push({
				$match: {
						"inquirySellerEntity.inquiryId": {
							$regex: new RegExp(req.body.textSearch, 'i')
						}
				}
			});
		}
	}*/

	//Unwinding inquirySellerEntity.sellers array.
	query.push({
		$unwind: "$inquirySellerEntity.sellers"
	});

	//Filtering all docs not related to this particular seller.
	query.push({
		$match: {
			"inquirySellerEntity.sellers.sellerId" : sellerId
		}
	});

	//Filter1
	// If there is inquirystatus filter available. Apply the Filter accordingly.
	if (!(req.body.inquirystatus === undefined || req.body.inquirystatus === null || 
		req.body.inquirystatus.toString().trim().length === 0))
	{	
		if(req.body.inquirystatus === "QuoteSubmitted" || req.body.inquirystatus === "QuoteAmended"){
			query.push({
				$match: {
					"inquirySellerEntity.sellers.status" : {"$in": ["QuoteSubmitted","QuoteAmended"]}
				}
			});
		}
		else{
			query.push({
				$match: {
					"inquirySellerEntity.sellers.status" : req.body.inquirystatus
				}
			});
		}	
	}

	logger.debug(TAG + "Seller Float Query: "+ JSON.stringify(query));
	sellerFloatColl.aggregate(query, function(err, result){
	    if(!err && result.length > 0){

	    	//fetching all inquiry ids and storing in separate array, this array will be used to fetch inquiries from "inquiry" collection.	
	    	result.forEach(function(element, index, array){
	    		inquiryIds.push(element.inquirySellerEntity.inquiryId);
	    	});

			resJson = {
				    "inquiryIds" : inquiryIds,
					"inquiryFloatDocs" : result
			};
			logger.debug(TAG + " Inquiry Summary fetched successfully inquiries floats for seller "+sellerId);
			return callback(false, resJson);
	    }
	    else if(!err && result.length < 1){
			resJson = {
				    "inquiryIds" : inquiryIds,
					"inquiryFloatDocs" : []
			};
			logger.debug(TAG + " No inquiries found for the selected seller: " + sellerId);
			return callback(true, resJson);
		}
		else{
			resJson = {
				    "inquiryIds" : inquiryIds,
					"inquiryFloatDocs" : []
			};
			logger.error(TAG + " Unexpected Server Error while fetching inquiries floats for seller "+sellerId+", err: -" + JSON.stringify(err));
			return callback(true, resJson);
		}
	});
}

//Function to get data from inquiry collection.
function getInquiries(req, callback){
	var db = dbConfig.mongoDbConn;
	var logger = log.logger_rfq;
	var query = [];
	var sellerId = req.body.supplierSession.sellerEntity.profileInfo.accountInfo.sellerId;

	logger.debug(TAG + " Fetching docs from Inquiry collection for sellerId "+sellerId);

	var inquiryColl = db.collection('InquiryMaster');

	query.push({
		$match: {
			"inquiryEntity.inquiryId": {
				$in: req.inquiryFloatResult.inquiryIds
			}
		}
	});

	//Filtering all inquiry inactive status docs.
	query.push({
		$match: {
			"inquiryEntity.inquiryStatus" : {
				$ne: "Inactive"
			}
		}
	});

	//Filter1
	// If there is FromDate and ToDate fileters available. Apply the Filter.
	if (!(req.body.fromDate === undefined || req.body.fromDate === null || 
		req.body.fromDate.toString().trim().length === 0))
	{
		var fromDate = new Date(req.body.fromDate);
		fromDate = new Date(timezoneConversions.toIST(fromDate).setHours(0, 0, 0, 0));
		fromDate = new Date(timezoneConversions.toUTC(fromDate));
		query.push({
			$match: {
				"inquiryEntity.inquiryTimestamp": {
					$gte: fromDate
				}
			}
		});
	}

	//Filter2
	if (!(req.body.toDate === undefined || req.body.toDate === null || 
		req.body.toDate.toString().trim().length === 0))
	{
		var toDate = new Date(req.body.toDate);
		toDate = new Date(timezoneConversions.toIST(toDate).setHours(23, 59, 59, 999));
    	toDate = new Date(timezoneConversions.toUTC(toDate));
		query.push({
			$match: {
				"inquiryEntity.inquiryTimestamp": {
					$lte: toDate
				}
			}
		});
	}

	//Filter3
	// If there is shipTo filter available. Apply the filter accordingly.
	if (!(req.body.shipTo === undefined || req.body.shipTo === null || 
		req.body.shipTo.toString().trim().length === 0))
	{
		query.push({
			$match: {
				"inquiryEntity.shippingAddress.city": req.body.shipTo
			}
		});
	}

	//Filter4
	// If there is paymentMode filter available. Apply the Filter accordingly.
	if (!(req.body.paymentMode === undefined || req.body.paymentMode === null || 
		req.body.paymentMode.toString().trim().length === 0))
	{
		//converting payments mode input coming from UI to actual payment mode stored in inquiry. 
		if(req.body.paymentMode === "Credit"){
			req.body.paymentMode = "onCredit"
		}

		if(req.body.paymentMode === "On Delivery"){
			req.body.paymentMode = "onDelivery"
		}

		query.push({
			$match: {
				"inquiryEntity.paymentModes": req.body.paymentMode
			}
		});
	}

	//Filtering on dynamic search box based on textField selected in the UI.
	if (!(req.body.textField === undefined || req.body.textField === null || 
		req.body.textField.toString().trim().length === 0))
	{
		if(req.body.textSearch !== undefined){
			if(req.body.textSearch !== null){
				
				if(req.body.textField == "Enquiry Number")
				{
					query.push({
						$match: {
								"inquiryEntity.inquiryId": {
									$regex: new RegExp(req.body.textSearch, 'i')
								}
						}
					});
				}
				else if(req.body.textField == "Company Name")
				{
					query.push({
						$match: {
								"inquiryEntity.companyName": {
									$regex: new RegExp(req.body.textSearch, 'i')
								}
						}
					});
					/*query.push({
						$match: {
								"inquiryEntity.customerFirstName": {
									$regex: new RegExp(req.body.textSearch, 'i')
								}
						}
					});*/
				}
				else if(req.body.textField == "Ship To")
				{
					query.push({
						$match: {
								"inquiryEntity.shippingAddress.city": {
									$regex: new RegExp(req.body.textSearch, 'i')
								}
						}
					});
				}			
			}
		}
	}

	//sorting on inquiry timestamp.
	query.push({
		$sort: {
			"inquiryEntity.inquiryTimestamp" : -1
		}
	});

	logger.debug(TAG + "InquiryMaster Query: "+ JSON.stringify(query));
	inquiryColl.aggregate(query, function(err, result){
	    if(!err && result.length > 0){
			logger.debug(TAG + " fetched successfully inquiries for seller "+sellerId);
			return callback(false, result);
	    }
	    else if(!err && result.length < 1){
			logger.debug(TAG + " No inquiries found for the selected seller: " + sellerId);
			return callback(true, []);
		}
		else{
			logger.error(TAG + " Unexpected Server Error while fetching inquiries for seller "+sellerId+", err: -" + JSON.stringify(err));
			return callback(true, []);
		}
	});
}