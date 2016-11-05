var TAG = "listInquiry.js - ";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var timezoneConversions = require('../helpers/timezoneConversions.js');

//Function to get inquiry summary for all suppliers.
exports.listInquiry = function listInquiry (req, callback){
	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;

	logger.info(TAG + " Entering listing all inquiries.");
	logger.info(TAG + " Request body :"+JSON.stringify(req.body));

	//Input validation.
	//Validate the request.
	if ( !(	req.body === null || 
			req.body.itemsPerPage === undefined ||
			req.body.itemsPerPage === null || 
			req.body.itemsPerPage.toString().trim().length === 0 ||
			isNaN(parseInt(req.body.itemsPerPage)) ||
			req.body.page === undefined ||
			req.body.page === null || 
			req.body.page.toString().trim().length === 0 ||
			isNaN(parseInt(req.body.page))
	)){
		var db = dbConfig.mongoDbConn;
		var logger = log.logger_rfq;
		var inquiryMasterColl = db.collection('InquiryMaster');
		var resJson;
		var query = [];	
		
		//Filtering all inquiry inactive status docs.
		// query.push({
		// 	$match: {
		// 		"inquiryEntity.inquiryStatus" : {
		// 			$ne: "Inactive"
		// 		}
		// 	}
		// });

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
		// If there is inquiry status filter available. Apply the Filter accordingly.
		if (!(req.body.inquiryStatus === undefined || req.body.inquiryStatus === null || 
			req.body.inquiryStatus.toString().trim().length === 0))
		{
			query.push({
				$match: {
					"inquiryEntity.inquiryStatus": req.body.inquiryStatus
				}
			});
		}

		//Filtering on dynamic search box based on textField selected in the UI.
		if (!(req.body.textField === undefined || req.body.textField === null || 
			req.body.textField.toString().trim().length === 0))
		{
			if(req.body.textSearch !== undefined){
				if(req.body.textSearch !== null){
					
					if(req.body.textField == "Enquiry Number" && req.body.textSearch.toString().trim().length !== 0)
					{
						query.push({
							$match: {
									"inquiryEntity.inquiryId": {
										$regex: new RegExp(req.body.textSearch, 'i')
									}
							}
						});
					}
					else if(req.body.textField == "Company Name" && req.body.textSearch.toString().trim().length !== 0)
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
					else if(req.body.textField == "Ship To" && req.body.textSearch.toString().trim().length !== 0)
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

		//Applying sorting on records.
		if (!(req.body.sortOn === undefined || req.body.sortOn === null || 
			req.body.sortOn.toString().trim().length === 0))
		{
			if(req.body.sortOn === "inquiryTime"){
				query.push({
					$sort: {
						"inquiryEntity.inquiryTimestamp": -1
					}
				});
			}
			else if(req.body.sortOn === "inquiryId"){
				query.push({
					$sort: {
						"inquiryEntity.inquiryId": 1
					}
				});
			}
			else if(req.body.sortOn === "customerName"){
				query.push({
					$sort: {
						"inquiryEntity.companyName": 1
					}
				});
			}
			else if(req.body.sortOn === "validityDate"){
				query.push({
					$sort: {
						"inquiryEntity.inquiryDeactivationDate": 1
					}
				});
			}
			else{
				query.push({
					$sort: {
						"inquiryEntity.inquiryTimestamp": -1
					}
				});
			}
		}
		else{
			query.push({
				$sort: {
					"inquiryEntity.inquiryTimestamp": -1
				}
			});
		}

		//projection.
		query.push(
			{ 
				$project : { 
					"_id": 0,
					"inquiryEntity.inquiryId" : 1 ,					
					"inquiryEntity.inquiryVersion" : 1 ,  
					"inquiryEntity.customerFirstName" : 1 ,
					"inquiryEntity.customerLastName" : 1 ,
					"inquiryEntity.companyName" : 1 , 
					"inquiryEntity.inquiryTimestamp" : 1 ,
					"inquiryEntity.inquiryAttachmentFilePathS3": 1,
					"inquiryEntity.inquiryDeactivationDate" : 1 ,
					"inquiryEntity.inquiryStatus" : 1 ,
                    "inquiryEntity.projectSelected" : 1 ,
                    "inquiryEntity.associatedProjectId" : 1 ,
                    "inquiryEntity.associatedProjectType" : 1 ,
                    "inquiryEntity.associatedProjectName" : 1 ,
                    "inquiryEntity.associatedbuilderId" : 1 ,
                    "inquiryEntity.associatedCompanyId" : 1 ,
					"inquiryEntity.shippingAddress" : 1 ,
					"inquiryEntity.paymentModes" : 1 ,
					"inquiryEntity.advancePayment" : 1 ,
					"inquiryEntity.advancePaymentAmount" : 1 ,
					"inquiryEntity.creditDaysNeeded" : 1 ,
					"inquiryEntity.suppliersChosen" : 1 ,
					"inquiryEntity.quoteFromMSupplySuppliers" : 1,
					"inquiryEntity.inquiryStructured" : 1,
					"inquiryEntity.respondByDate" : 1,
					"inquiryEntity.deliveryByDate" : 1,
					"inquiryEntity.shipToProjectAddress" : 1,
					"inquiryEntity.detailsOfRequirement":1,
					"inquiryEntity.noOfQuotationsDesiredRange":1, 
					"inquiryEntity.packingAndFreightRequirements":1,
					"inquiryEntity.targetPriceForQuotation":1,
					"inquiryEntity.inquiryCity":1,
					"inquiryEntity.packingAndFreightRequirements":1,
					"inquiryEntity.remarks":1
				}
			}
		);

		//Applying limit on result.
		var limitCount = (req.body.page + 1) * req.body.itemsPerPage;
		var limit = {"$limit" : limitCount}
		query.push(limit);
		logger.debug(" " + TAG + "query: " + JSON.stringify(query));
		inquiryMasterColl.aggregate(query, function(err, result){
	    if(!err && result.length > 0){

	    	result = result.slice(req.body.page * req.body.itemsPerPage);
	    	var suppliersSelected = [];
			for(var i = 0; i < result.length; i++){
				result[i].inquiryEntity.inquiryTimestamp = timezoneConversions.toIST(result[i].inquiryEntity.inquiryTimestamp);
				result[i].inquiryEntity.inquiryDeactivationDate = timezoneConversions.toIST(result[i].inquiryEntity.inquiryDeactivationDate);
				result[i].inquiryEntity.deliveryByDate = timezoneConversions.toIST(new Date(new Date(result[i].inquiryEntity.deliveryByDate)));

				if(result[i].inquiryEntity.inquiryStructured === undefined){
					result[i].inquiryEntity["structured"] = false;
					result[i].inquiryEntity.respondByDate = "";
				}
				else{
					//delete result[i].inquiryEntity.inquiryStructured;
					result[i].inquiryEntity["structured"] = true;

					if(result[i].inquiryEntity.respondByDate === undefined){
						result[i].inquiryEntity.respondByDate = "";
					}
					else{
						result[i].inquiryEntity.respondByDate = timezoneConversions.toIST(result[i].inquiryEntity.respondByDate);
					}
				}

				if(result[i].inquiryEntity.suppliersChosen.length > 0){
					for(var j = 0; j < result[i].inquiryEntity.suppliersChosen.length; j++){
						if(result[i].inquiryEntity.suppliersChosen[j] !== "")
							suppliersSelected.push(result[i].inquiryEntity.suppliersChosen[j].supplierId);
					}
				}
				result[i].inquiryEntity.suppliersChosen = suppliersSelected;
				suppliersSelected = [];
			}	    	

            var inquiryIdsArray = [];
            var inquiryVersionsArray = [];

            for(var idx = 0;idx<result.length;idx++){
                result[idx].inquiryEntity.totalSuppliers = 0;
                result[idx].inquiryEntity.numOfSuppliersQuoted = 0;
                result[idx].inquiryEntity.numOfSuppliersIntentToQuote = 0;
                result[idx].inquiryEntity.numOfSuppliersNotIntentToQuote = 0;

                var curInquiryId = result[idx].inquiryEntity.inquiryId;
                var curInquiryVersion = result[idx].inquiryEntity.inquiryVersion;

                inquiryIdsArray.push(curInquiryId);
                inquiryVersionsArray.push(curInquiryVersion);
            }

            //-----------------------------------------
            var sellerFloatFindQuery = {
                "inquirySellerEntity.inquiryId":{$in:inquiryIdsArray}
            };

            logger.debug(TAG + JSON.stringify(sellerFloatFindQuery));
            var colInquirySellerFloat = db.collection("InquirySellerFloat");
            colInquirySellerFloat.find(sellerFloatFindQuery).toArray(function (sf_error,sf_result) {
                if(!sf_error){
                    for(var curIdx = 0;curIdx<sf_result.length;curIdx++){
                        var curSellerInquiryId = sf_result[curIdx].inquirySellerEntity.inquiryId;
                        var curSellerInquiryVersion = sf_result[curIdx].inquirySellerEntity.inquiryVersion;

                        if(inquiryIdsArray.indexOf(curSellerInquiryId) !== -1 &&
                            inquiryVersionsArray[inquiryIdsArray.indexOf(curSellerInquiryId)] === curSellerInquiryVersion){

                            var inquiryArraysIdx = inquiryIdsArray.indexOf(curSellerInquiryId);
                            var suppliersArray = sf_result[curIdx].inquirySellerEntity.sellers;

                            var totalSuppliers = 0;
                            var numEnquirySent = 0;
                            var numIntentToQuote = 0;
                            var numNotIntentToQuote = 0;
                            var numQuoteSubmitted = 0;
                            var numQuoteAmended = 0;
                            var numExpired = 0;

                            suppliersArray.forEach(function (curSupplier) {
                                var supplierStatus = curSupplier.status;
                                if(supplierStatus !== "PendingApproval" && supplierStatus !== "EditInProgress"){
                                    totalSuppliers++;
                                }
                                switch(supplierStatus){
                                    case "EnquirySent":
                                        numEnquirySent++;
                                        break;
                                    case "IntentToQuote":
                                        numIntentToQuote++;
                                        break;
                                    case "NotIntentToQuote":
                                        numNotIntentToQuote++;
                                        break;
                                    case "QuoteSubmitted":
                                        numQuoteSubmitted++;
                                        break;
                                    case "QuoteAmended":
                                        numQuoteAmended++;
                                        break;
                                    case "Expired":
                                        numExpired++;
                                        break;
                                }
                            });

                            result[inquiryArraysIdx].inquiryEntity.totalSuppliers = totalSuppliers;
                            result[inquiryArraysIdx].inquiryEntity.numOfSuppliersQuoted = numQuoteAmended + numQuoteSubmitted;
                            result[inquiryArraysIdx].inquiryEntity.numOfSuppliersIntentToQuote = numIntentToQuote;
                            result[inquiryArraysIdx].inquiryEntity.numOfSuppliersNotIntentToQuote = numNotIntentToQuote;
                        }
                    }
                    resJson = {
                        "http_code" : "200",
                        "message" : {
                            "inquiryList": result
                        }
                    };
                    logger.debug(TAG + " fetched Quotation Statistics from Inquiry Seller Float Successfully");
                    return callback(false, resJson);
                }else {
                    resJson = {
                        "http_code" : "200",
                        "message" : {
                            "inquiryList": result
                        }
                    };
                    logger.debug(TAG + " Error while fetching Quotation Statistics from Inquiry Seller Float, Error : "+sf_error);
                    return callback(false, resJson);
                }
            });
	    }
	    else if(!err && result.length < 1){
			resJson = {
			    "http_code" : "404",
				"message" : {
					"inquiryList": []
				}
			};
			logger.debug(TAG + " No inquiries found for the selected match case" );
			return callback(true, resJson);
		}
		else{
			resJson = {
			    "http_code" : "500",
				"message" : {
					"inquiryList": []
				}
			};
			logger.error(TAG + " Unexpected Server Error while fetching inquiries for seller internal panel");
			return callback(true, resJson);
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