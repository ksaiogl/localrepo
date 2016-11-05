var TAG = "CRM - Seller OnBoarding";

var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var genSellerMasterID = require('./generateSellerMasterID.js');
var async = require('async');
var crypto = require('crypto');
var sellerNotification = require('./sellerNotification.js');
var timezoneConversions = require('../helpers/timezoneConversions.js');

//Function for Fetching the Seller Details from SellerLead.
exports.fetchSellerLeads = 
function fetchSellerLeads (req, callback){
	
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_seller;
	
	logger.info(ip + " " + TAG + " Entering seller onboarding get Seller Details - CRM.");

	//Log the request.
	logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));

	//Declare the response
	var resJson;
	
	//Validate the request.
	if ( !(	req === null || 
			req.body === null )) {
		
		var sellerLeadcol = db.collection('SellerLead');
		var query = [];

		//Sort the documents based on created time stamp.
		query.push({$sort : {"sellerLeadEntity.createdAt" : -1}});

		//match crmStatus to notVerified.
		query.push({$match : {"sellerLeadEntity.crmStatus": "notVerified"}});

		//Filter for search field based on company name and lead id.
		if(req.body.textSearch !== undefined){
			var textSearch = req.body.textSearch;
			if(textSearch !== null && textSearch.toString().trim().length !== 0){
				query.push({$match:{$or:[{"sellerLeadEntity.companyName":{$regex: new RegExp(textSearch,'i')}},{"sellerLeadEntity.sellerLeadId":{$regex: new RegExp(textSearch, 'i')}}]}});
			}
		}

		// If there is FromDate and ToDate fileters available. Apply the Filter.
		//FromDate filter
		if (!(req.body.fromDate === undefined || req.body.fromDate === null || 
			req.body.fromDate.toString().trim().length === 0))
		{
			

			if(/^\d{4}\-(0?[1-9]|1[012])\-(0?[1-9]|[12][0-9]|3[01])$/.test(req.body.fromDate)){
				
				var fromDate = new Date(req.body.fromDate);
				fromDate = new Date(timezoneConversions.toIST(fromDate).setHours(0, 0, 0, 0));
				fromDate = new Date(timezoneConversions.toUTC(fromDate));

				var date = new Date();
				date = new Date(timezoneConversions.toIST(date).setHours(0, 0, 0, 0));
				date = new Date(timezoneConversions.toUTC(date));
				
				if(fromDate.getTime() > date.getTime()) {
					resJson = {
					    "http_code" : "400",
						"message" : "Bad request - FromDate should be less than current Date"
					};
					logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
					return callback(true,resJson);
				} else {
					query.push({
						$match: {
							"sellerLeadEntity.createdAt": {
								$gte: fromDate
							}
						}
					});
				}	
			} else {
				resJson = {
				    "http_code" : "400",
					"message" : "Bad request - FromDate is invalid"
				};
				logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
				return callback(true,resJson);
			}	
		}

		//ToDate filter
		if (!(req.body.toDate === undefined || req.body.toDate === null || 
			req.body.toDate.toString().trim().length === 0))
		{
			
			
			if(/^\d{4}\-(0?[1-9]|1[012])\-(0?[1-9]|[12][0-9]|3[01])$/.test(req.body.toDate)){
				
				var toDate = new Date(req.body.toDate);
				toDate = new Date(timezoneConversions.toIST(toDate).setHours(23, 59, 59, 999));
		    	toDate = new Date(timezoneConversions.toUTC(toDate));

		    	var date = new Date();
				date = new Date(timezoneConversions.toIST(date).setHours(23, 59, 59, 999));
		    	date = new Date(timezoneConversions.toUTC(date));

				if(toDate.getTime() > date.getTime()) {
					resJson = {
					    "http_code" : "400",
						"message" : "Bad request - ToDate should be less than current Date"
					};
					logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
					return callback(true,resJson);
				} else {
					query.push({
						$match: {
							"sellerLeadEntity.createdAt": {
								$lte: toDate
							}
						}
					});
				}	
			} else {
				resJson = {
				    "http_code" : "400",
					"message" : "Bad request - ToDate is invalid"
				};
				logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
				return callback(true,resJson);
			}	
		}

		if (!(req.body.fromDate === undefined || req.body.fromDate === null || req.body.toDate === undefined || req.body.toDate === null)){
			if(req.body.toDate !== "" && req.body.fromDate !== ""){
				if(!(new Date(req.body.toDate).getTime() >= new Date(req.body.fromDate).getTime())){
					resJson = {
					    "http_code" : "400",
						"message" : "Bad request - ToDate should be greater than FromDate"
					};
					logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
					return callback(true,resJson);
				}
			}	
		}

		query.push({ $project : { "_id" : 0 , 
								 "sellerLeadEntity.sellerLeadId" : 1,
								 "sellerLeadEntity.companyName" : 1,
								 "sellerLeadEntity.emailId" : 1,
								 "sellerLeadEntity.mobile" : 1,
								 "sellerLeadEntity.VAT_TIN" : 1,
								 "sellerLeadEntity.leadSource" : 1,
								 "sellerLeadEntity.createdAt" : 1 }});
	
		if (req.body.itemsPerPage != null && req.body.page != null && !isNaN(parseInt(req.body.itemsPerPage)) && !isNaN(parseInt(req.body.page))) 
		{
			var limitCount = (req.body.page + 1) * req.body.itemsPerPage;
			var limit = {"$limit" : limitCount}
			query.push(limit);
		}
		else 
		{
			resJson = {
			    "http_code" : "500",
				"message" : "ItemsPerPage & page are mandatory parameters and should be of type integer."
			};
			logger.error(TAG + "itemsPerPage & page parameters in Filters of Seller - CRM. itemsPerPage: " + req.body.itemsPerPage + " , page: " + req.body.page);
			return callback(true, resJson);
		}

		//console.log(JSON.stringify(query));
		sellerLeadcol.aggregate(query,function(err, result){
		   	if(!err && (result !== null)){ 
			
			   	result = result.slice(req.body.page * req.body.itemsPerPage);
			   
			   	//remove the project,limit condition for count
			   	query.pop();
			   	query.pop();

			   	sellerLeadcol.aggregate(query, function(error, count) {
					if (error) {
						resJson = {	
						    "http_code" : "500",
							"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
						};
						logger.error(ip + " " + TAG + " " + JSON.stringify(error));
						return callback(true,resJson);
					} else {
						resJson = {
							    "http_code" : "200",
								"message" : result,
								"count" : count.length
						};
						logger.debug(ip + " " + TAG + " Fetching Sellers Successful." + JSON.stringify(resJson));
						return callback(false,resJson);
					}
				});		
		   	}else if(!err && (result === null)){
				resJson = {
					    "http_code" : "500",
						"message" : "Inputs Doesn't match with our records. Please Retry."
				};
				logger.debug(ip + " " + TAG + "Inputs Doesn't match with our records. Please Retry." + JSON.stringify(resJson));
				return callback(true,resJson);
			}else{
				resJson = {	
				    "http_code" : "500",
					"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
				};
				logger.error(ip + " " + TAG + " " + JSON.stringify(err));
				return callback(true,resJson);
			}
		});
	} else {
		resJson = {
		    "http_code" : "400",
			"message" : "Bad or ill-formed request.."
		};
		logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
		return callback(true,resJson);
	}
};

//Function for updating Seller Lead Details.
exports.updateSellerLeadDetails =
function updateSellerLeadDetails (req, callback){
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;

	//Variable for Mongo DB Connection.
	var db = dbConfig.mongoDbConn;

	var sellerLeadcol = db.collection('SellerLead');

	//Variable for Logging the messages to the file.
	var logger = log.logger_seller;

	logger.info(ip + " " + TAG + " Entering seller OnBoarding CRM Actions - updating SellerLead Details.");

	//Log the request.
	logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));

	//Declare the response
	var resJson;

	if( !( 	req === null ||
			req.body === undefined || 
			req.body.sellerLeadId === undefined || 
			req.body.sellerLeadId === null || 
			req.body.sellerLeadId.toString().trim().length === 0 ||
			req.body.companyName === undefined || 
			req.body.companyName === null || 
			req.body.companyName.toString().trim().length === 0 ||
			req.body.vat === undefined || 
			req.body.vat === null || 
			req.body.vat.toString().trim().length === 0 ||
			req.body.mobile === undefined || 
			req.body.mobile === null || 
			req.body.mobile.toString().trim().length === 0 ) ){

		var sellerLeadId = req.body.sellerLeadId;
		var companyName = req.body.companyName;
		var vat = req.body.vat;
		var mobile = req.body.mobile;

		var updateBlock = {$set: {"sellerLeadEntity.companyName": companyName, 
								  "sellerLeadEntity.VAT_TIN": vat,
								  "sellerLeadEntity.mobile": mobile}};

		sellerLeadcol.update({"sellerLeadEntity.sellerLeadId": sellerLeadId, "sellerLeadEntity.crmStatus": "notVerified"}, updateBlock, function(error, result){
				
			try {
				var mresult = JSON.parse(result);
			}
			catch(err) {
				resJson = {	
				    "http_code" : "500",
					"message" : "Unexpected Server Error while Updating seller Details in SellerLead collection."
				};
				logger.error(TAG + " in Try / catch of Updating seller Details in SellerLead collection." + JSON.stringify(err));
				return callback(true, resJson);
			}
			
			if(error){
				resJson = {	
				    "http_code" : "500",
					"message" : "Updating seller Details in SellerLead collection failed. Please Retry."
				};
				logger.error(TAG + " " + JSON.stringify(error));
				return callback(true, resJson);
			} else if(!error && mresult.nModified > 0) {
				resJson = {
				    "http_code" : "200",
					"message" : "Succesfully updated seller Details to SellerLead collection"
				};
				logger.debug(TAG + " Updating seller Details in SellerLead collection - CRM Succesfull");
				return callback(false, resJson);
			} else if(!error && mresult.nModified == 0 && mresult.n > 0){
				resJson = {
				    "http_code" : "500",
					"message" : "No changes are made to update Seller Details"
				};
				logger.error(TAG + " No changes are made to update Seller Details");
				return callback(true, resJson);
			} else if(!error && mresult.n == 0){
				resJson = {
				    "http_code" : "500",
					"message" : "Either Seller Details not found or crmStatus is not notVerified"
				};
				logger.error(TAG + " Either Seller Details not found or crmStatus is not notVerified in SellerLead collection.");
				return callback(true, resJson);
			}
		});
	}
	else{
		resJson = {
		    "http_code" : "400",
			"message" : "Bad or ill-formed request.."
		};
		logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
		return callback(true, resJson);
	}
};


//Function for rejecting seller lead entity.
exports.rejectSellerLead =
function rejectSellerLead (req, callback){
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;

	//Variable for Mongo DB Connection.
	var db = dbConfig.mongoDbConn;

	var sellerLeadcol = db.collection('SellerLead');

	//Variable for Logging the messages to the file.
	var logger = log.logger_seller;

	logger.info(ip + " " + TAG + " Entering seller OnBoarding CRM Actions - rejecting Seller.");

	//Log the request.
	logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));

	//Declare the response
	var resJson;

	if( !( 	req === null ||
			req.body === undefined || 
			req.body.sellerLeadId === undefined || 
			req.body.sellerLeadId === null || 
			req.body.sellerLeadId.toString().trim().length === 0 ) ){

		var sellerLeadId = req.body.sellerLeadId;

		rejectSeller(sellerLeadId, function(error, result){
			if(error){
				return callback(true, result);
			} else {
				return callback(false, result);
			}
		});
	}
	else{
		resJson = {
		    "http_code" : "400",
			"message" : "Bad or ill-formed request.."
		};
		logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
		return callback(true, resJson);
	}
};

//function that will change seller status to rejected from SellerLead collection.
function rejectSeller(sellerLeadId, callback){
	var db = dbConfig.mongoDbConn;

	var sellerLeadcol = db.collection('SellerLead');

	var logger = log.logger_seller;

	var resJson;

	sellerLeadcol.findAndModify({"sellerLeadEntity.sellerLeadId": sellerLeadId, "sellerLeadEntity.crmStatus": "notVerified"}, null, {$set: {"sellerLeadEntity.crmStatus": "rejected"}}, { new: true }, function(error, result){
		
		if(error){
			resJson = {	
			    "http_code" : "500",
				"message" : "Updating crmStatus to rejected in SellerLead collection failed. Please Retry."
			};
			logger.error(TAG + " " + JSON.stringify(error));
			return callback(true, resJson);
		} else if(!error && result.value !== null) {
			var data = {
				"emailId" : result.value.sellerLeadEntity.emailId
			};

			// Sending Notification rejection mail to the Seller.
			sellerNotification.sendNotificationSellerReject(data, function(err, status){
			    if(err){
			        resJson = {
		                "http_code" : "500",
		                "message" : "Error sending rejection mail to Seller, please try later.."
		            };
			        callback(true, resJson);
			    }
			    else{
			    	resJson = {  
					    "http_code" : "200",
						"message" : "Rejection mail sent to Seller Successfully.",
					}	
					callback(false, resJson);
			    }
			});	
		} else if(!error && result.value === null) {
			resJson = {
			    "http_code" : "500",
				"message" : "Either Seller Details not found or crmStatus is not notVerified"
			};
			logger.error(TAG + " Either Seller Details not found or crmStatus is not notVerified in SellerLead collection.");
			return callback(true, resJson);
		}	
	});
}

//Function for approving seller lead entity.
exports.approveSellerLead =
function approveSellerLead (req, callback){
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;

	//Variable for Mongo DB Connection.
	var db = dbConfig.mongoDbConn;

	var sellerLeadcol = db.collection('SellerLead');
	var sellerMastercol = db.collection('SellerMaster');

	//Variable for Logging the messages to the file.
	var logger = log.logger_seller;

	logger.info(ip + " " + TAG + " Entering seller OnBoarding CRM Actions - approving Seller.");

	//Log the request.
	logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));

	//Declare the response
	var resJson;

	if( !( 	req === null ||
			req.body === undefined || 
			req.body.sellerLeadId === undefined || 
			req.body.sellerLeadId === null || 
			req.body.sellerLeadId.toString().trim().length === 0 ) ){

		var sellerLeadId = req.body.sellerLeadId;

		//get Seller details using seller lead id
		sellerLeadcol.find({"sellerLeadEntity.sellerLeadId": sellerLeadId}).toArray(function(error, result){
			if(error){
				resJson = {
				    "http_code" : "500",
					"message" : "Error while fetching Seller Details in SellerLead. Please try later."
				};
				logger.error(TAG + " fetching Seller Details in SellerLead - CRM failed. Error:" + JSON.stringify(error));
				return callback(true, resJson);
			}
			else if(!error && result.length > 0){

				var sellerDetails = result[0];
				var vat = sellerDetails.sellerLeadEntity.VAT_TIN;
				var mobile = sellerDetails.sellerLeadEntity.mobile;
				var leadSource = sellerDetails.sellerLeadEntity.leadSource;

				if(sellerDetails.sellerLeadEntity.crmStatus === "notVerified"){
					
					if(vat !== ""){

						//check if seller's vat exists in SellerMaster
						sellerMastercol.find({"sellerEntity.profileInfo.financialInfo.taxInfo.VAT_TIN": vat}).toArray(function(errorc, resultc){	
							if(errorc){
								resJson = {
								    "http_code" : "500",
									"message" : "Error while fetching Seller Details in SellerMaster. Please try later."
								};
								logger.error(TAG + " fetching Seller Details in SellerMaster - CRM failed. Error:" + JSON.stringify(errorc));
								return callback(true, resJson);
							}
							//if seller's vat exists, no need to generate sellermasterid
							else if(!errorc && resultc.length > 0){

								sellerMastercol.find({"sellerEntity.profileInfo.accountInfo.userId": mobile}).toArray(function(errorb, resultb){	
									if(errorb){
										resJson = {
										    "http_code" : "500",
											"message" : "Error while fetching Seller Details in SellerMaster. Please try later."
										};
										logger.error(TAG + " fetching Seller Details in SellerMaster - CRM failed. Error:" + JSON.stringify(errorb));
										callback1(true, resJson);
									}
									//if seller's userId exists, need to set vat as userId
									else if(!errorb && resultb.length > 0){
										
										var sellerMasterId = resultc[0].sellerEntity.profileInfo.accountInfo.sellerId;
										var existsInMaster = true;
										var defaultUserId = vat;
										var defaultPassword = "Password123";
										var defaultPasswordHash = crypto.createHash('md5').update(defaultPassword).digest('hex');
										
										if(leadSource === "rfq"){
											var updateBlock = {$set: {"sellerLeadEntity.sellerId": sellerMasterId, 
																	  "sellerLeadEntity.userId": defaultUserId, 
																	  "sellerLeadEntity.passwordHash": defaultPasswordHash, 
																	  "sellerLeadEntity.crmStatus": "verified"}};
										} else if (leadSource === "sellerPanel" || leadSource === "sceta"){	
											var updateBlock = {$set: {"sellerLeadEntity.sellerId": sellerMasterId,
																	  "sellerLeadEntity.crmStatus": "verified"}};
										} else {
											resJson = {
											    "http_code" : "400",
												"message" : "Bad request - leadSource must be either sellerPanel or rfq or sceta"
											};
											logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
											return callback(true, resJson);
										}	

										approveSeller(sellerMasterId, updateBlock, sellerDetails, existsInMaster, defaultUserId, function(error, results){
											if(error){
												return callback(true, results);
											} else {
												return callback(false, results);
											}
										});
									}
									//if seller's userId doesn't exists, need to set mobile as userId
									else if(!errorb && resultb.length === 0){

										var sellerMasterId = resultc[0].sellerEntity.profileInfo.accountInfo.sellerId;
										var existsInMaster = true;
										var defaultUserId = mobile;
										var defaultPassword = "Password123";
										var defaultPasswordHash = crypto.createHash('md5').update(defaultPassword).digest('hex');
										
										if(leadSource === "rfq"){
											var updateBlock = {$set: {"sellerLeadEntity.sellerId": sellerMasterId, 
																	  "sellerLeadEntity.userId": defaultUserId, 
																	  "sellerLeadEntity.passwordHash": defaultPasswordHash, 
																	  "sellerLeadEntity.crmStatus": "verified"}};
										} else if (leadSource === "sellerPanel" || leadSource === "sceta"){	
											var updateBlock = {$set: {"sellerLeadEntity.sellerId": sellerMasterId,
																	  "sellerLeadEntity.crmStatus": "verified"}};
										} else {
											resJson = {
											    "http_code" : "400",
												"message" : "Bad request - leadSource must be either sellerPanel or rfq or sceta"
											};
											logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
											return callback(true, resJson);
										}	

										approveSeller(sellerMasterId, updateBlock, sellerDetails, existsInMaster, defaultUserId, function(error, results){
											if(error){
												return callback(true, results);
											} else {
												return callback(false, results);
											}
										});
									}
								});
							}
							//if seller's vat doesn't exists, need to generate seller master id
							else if(!errorc && resultc.length === 0){

								sellerMastercol.find({"sellerEntity.profileInfo.accountInfo.userId": mobile}).toArray(function(errorb, resultb){	
									if(errorb){
										resJson = {
										    "http_code" : "500",
											"message" : "Error while fetching Seller Details in SellerMaster. Please try later."
										};
										logger.error(TAG + " fetching Seller Details in SellerMaster - CRM failed. Error:" + JSON.stringify(errorb));
										callback1(true, resJson);
									}
									//if seller's userId exists, need to set vat as userId
									else if(!errorb && resultb.length > 0){
										
										//generates seller master id 
										genSellerMasterID.generateSellerMasterID(vat, function(errord, resultd){
											if(errord){
												logger.error(TAG + " Error while generating sellerMasterId.");
												resJson = {
												    "http_code" : "500",
													"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
												};
												return callback(true, resJson);
											}
											else{

												var sellerMasterId = resultd;
												var existsInMaster = false;
												var defaultUserId = vat;
												var defaultPassword = "Password123";
												var defaultPasswordHash = crypto.createHash('md5').update(defaultPassword).digest('hex');
												
												if(leadSource === "rfq"){
													var updateBlock = {$set: {"sellerLeadEntity.sellerId": sellerMasterId, 
																			  "sellerLeadEntity.userId": defaultUserId, 
																			  "sellerLeadEntity.passwordHash": defaultPasswordHash,
																			  "sellerLeadEntity.crmStatus": "verified"}};
												} else if (leadSource === "sellerPanel" || leadSource === "sceta"){	
													var updateBlock = {$set: {"sellerLeadEntity.sellerId": sellerMasterId, 
																			  "sellerLeadEntity.crmStatus": "verified"}};
												} else {
													resJson = {
													    "http_code" : "400",
														"message" : "Bad request - leadSource must be either sellerPanel or rfq or sceta"
													};
													logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
													return callback(true, resJson);
												}	

												approveSeller(sellerMasterId, updateBlock, sellerDetails, existsInMaster, defaultUserId, function(error, results){
													if(error){
														return callback(true, results);
													} else {
														return callback(false, results);
													}
												});
											}	
										});
									}
									//if seller's userId doesn't exists, need to set mobile as userId
									else if(!errorb && resultb.length === 0){

										//generates seller master id 
										genSellerMasterID.generateSellerMasterID(vat, function(errord, resultd){
											if(errord){
												logger.error(TAG + " Error while generating sellerMasterId.");
												resJson = {
												    "http_code" : "500",
													"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
												};
												return callback(true, resJson);
											}
											else{

												var sellerMasterId = resultd;
												var existsInMaster = false;
												var defaultUserId = mobile;
												var defaultPassword = "Password123";
												var defaultPasswordHash = crypto.createHash('md5').update(defaultPassword).digest('hex');
												
												if(leadSource === "rfq"){
													var updateBlock = {$set: {"sellerLeadEntity.sellerId": sellerMasterId, 
																			  "sellerLeadEntity.userId": defaultUserId, 
																			  "sellerLeadEntity.passwordHash": defaultPasswordHash,
																			  "sellerLeadEntity.crmStatus": "verified"}};
												} else if (leadSource === "sellerPanel" || leadSource === "sceta"){	
													var updateBlock = {$set: {"sellerLeadEntity.sellerId": sellerMasterId, 
																			  "sellerLeadEntity.crmStatus": "verified"}};
												} else {
													resJson = {
													    "http_code" : "400",
														"message" : "Bad request - leadSource must be either sellerPanel or rfq or sceta"
													};
													logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
													return callback(true, resJson);
												}	

												approveSeller(sellerMasterId, updateBlock, sellerDetails, existsInMaster, defaultUserId, function(error, results){
													if(error){
														return callback(true, results);
													} else {
														return callback(false, results);
													}
												});
											}	
										});
									}
								});
							}
						});
					} else if(vat === ""){
						resJson = {
						    "http_code" : "400",
							"message" : "Bad request - VAT is missing"
						};
						logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
						return callback(true, resJson);
					}
				} else {
					resJson = {
					    "http_code" : "500",
						"message" : "The Seller has been "+ sellerDetails.sellerLeadEntity.crmStatus + " by CRM"
					};
					logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
					return callback(true, resJson);
				}	
			}
			else if(!error && result.length === 0){
				resJson = {
				    "http_code" : "500",
					"message" : "Seller Details not found in SellerLead."
				};
				logger.error(TAG + " Seller Details not found in SellerLead.");
				return callback(true, resJson);
			}	
		});	
	}
	else{
		resJson = {
		    "http_code" : "400",
			"message" : "Bad or ill-formed request.."
		};
		logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
		return callback(true, resJson);
	}
};

//function that will add seller to SellerMaster and change the seller id in Builder, InquiryMaster and SellerLead collections.
function approveSeller(sellerMasterId, updateBlock, sellerDetails, existsInMaster, userId, callback){
	var db = dbConfig.mongoDbConn;

	var sellerLeadcol = db.collection('SellerLead');
	var buildercol = db.collection('Builder');
	var sellerMastercol = db.collection('SellerMaster');
	var inquiryMastercol = db.collection('InquiryMaster');

	var logger = log.logger_seller;

	var resJson;

	var sellerLeadId = sellerDetails.sellerLeadEntity.sellerLeadId;
	var leadSource = sellerDetails.sellerLeadEntity.leadSource;

	var defaultUserId = userId;
	var defaultPassword = "Password123";
	var defaultPasswordHash = crypto.createHash('md5').update(defaultPassword).digest('hex');

	async.series([
	    //function that will update the seller id in Builder collection.
	    function(callback) {

			if(leadSource == "rfq"){

		       	var customerIds = sellerDetails.sellerLeadEntity.customerIds;
						
				buildercol.find({ "builderEntity.profileInfo.accountInfo.companyId": { $in: customerIds } ,
				  				  "builderEntity.mySuppliers.suppliersIds.supplierId": sellerMasterId}).toArray(function(err, result){			  	
				  	if(err){
						resJson = {
						    "http_code" : "500",
							"message" : "Error while fetching Company Details. Please try later."
						};
						logger.error(TAG + " fetching Company Details - CRM failed. Error:" + JSON.stringify(err));
						return callback(true, resJson);
					}
					else if(!err && result.length > 0){
						
						var suppliers = result[0].builderEntity.mySuppliers.suppliersIds;

						for (var i = 0; i < suppliers.length; i++) {
						  if (suppliers[i]['supplierId'] == sellerLeadId) {
							suppliers.splice(i,1);
						  }
						}
						//{ $pull: { "builderEntity.mySuppliers.suppliersIds": { $elemMatch: { "supplierId": sellerLeadId } }
						buildercol.update({ "builderEntity.profileInfo.accountInfo.companyId": { $in: customerIds } },
										  { $set: { "builderEntity.mySuppliers.suppliersIds": suppliers }},	
									function(errorb, resultb){
							try {
								var mresult = JSON.parse(resultb);
							}
							catch(err) {
								resJson = {	
								    "http_code" : "500",
									"message" : "Unexpected Server Error while deleting sellerDetails in Builder collection."
								};
								logger.error(TAG + " in Try / catch of deleting sellerDetails in Builder collection." + JSON.stringify(err));
								return callback(true, resJson);
							}
							
							if(errorb){
								resJson = {	
								    "http_code" : "500",
									"message" : "Deleting sellerDetails in Builder collection failed. Please Retry."
								};
								logger.error(TAG + " " + JSON.stringify(errorb));
								return callback(true, resJson);
							} else if(!errorb && mresult.nModified > 0) {
								resJson = {
								    "http_code" : "200",
									"message" : "Succesfully deleted sellerDetails in Builder collection"
								};
								logger.debug(TAG + " Deleting sellerDetails in Builder collection - CRM Succesfull");
								return callback(false, resJson);
							} else if(!errorb && mresult.n == 0){

								buildercol.find({"builderEntity.profileInfo.accountInfo.companyId": { $in: customerIds }}).toArray(function(errorm, resultm){
									if(errorm){
										resJson = {
										    "http_code" : "500",
											"message" : "Error while fetching Company Details. Please try later."
										};
										logger.error(TAG + " fetching Company Details - CRM failed. Error:" + JSON.stringify(errorm));
										return callback(true, resJson);
									}
									else if(!errorm && resultm.length > 0){
										resJson = {
										    "http_code" : "200",
											"message" : "Seller Details not found in Builder - Need not update."
										};
										logger.debug(TAG + " SellerLead Details not found in Builder - Need not update (request is from rfq).");
										return callback(false, resJson);
									}
									else if(!errorm && resultm.length === 0){
										resJson = {
										    "http_code" : "500",
											"message" : "One of the Company id's doesn't exists in Builder."
										};
										logger.error(TAG + " Company Details not found in Builder (request is from rfq).");
										return callback(true, resJson);	
									}
								});
							}	
						});
					}
					else if(!err && result.length === 0){

						buildercol.update({ "builderEntity.profileInfo.accountInfo.companyId": { $in: customerIds } ,
									"builderEntity.mySuppliers.suppliersIds.supplierId": sellerLeadId },
									{ $set: { "builderEntity.mySuppliers.suppliersIds.$.supplierId" : sellerMasterId,
											  "builderEntity.mySuppliers.suppliersIds.$.supplierLeadId" : sellerLeadId,
											  "builderEntity.mySuppliers.suppliersIds.$.hasEnquiryAccess" : true } },
									function(errorb, resultb){
							try {
								var mresult = JSON.parse(resultb);
							}
							catch(err) {
								resJson = {	
								    "http_code" : "500",
									"message" : "Unexpected Server Error while Updating sellerId in Builder collection."
								};
								logger.error(TAG + " in Try / catch of Updating sellerId in Builder collection." + JSON.stringify(err));
								return callback(true, resJson);
							}
							
							if(errorb){
								resJson = {	
								    "http_code" : "500",
									"message" : "Updating Seller Id in Builder collection failed. Please Retry."
								};
								logger.error(TAG + " " + JSON.stringify(errorb));
								return callback(true, resJson);
							} else if(!errorb && mresult.nModified > 0) {
								resJson = {
								    "http_code" : "200",
									"message" : "Succesfully updated sellerId in Builder collection"
								};
								logger.debug(TAG + " Updating Seller Id in Builder collection - CRM Succesfull");
								return callback(false, resJson);
							} else if(!errorb && mresult.n == 0){

								buildercol.find({"builderEntity.profileInfo.accountInfo.companyId": { $in: customerIds }}).toArray(function(errorm, resultm){
									if(errorm){
										resJson = {
										    "http_code" : "500",
											"message" : "Error while fetching Company Details. Please try later."
										};
										logger.error(TAG + " fetching Company Details - CRM failed. Error:" + JSON.stringify(errorm));
										return callback(true, resJson);
									}
									else if(!errorm && resultm.length > 0){
										resJson = {
										    "http_code" : "200",
											"message" : "Seller Details not found in Builder - Need not update."
										};
										logger.debug(TAG + " SellerLead Details not found in Builder - Need not update (request is from rfq).");
										return callback(false, resJson);
									}
									else if(!errorm && resultm.length === 0){
										resJson = {
										    "http_code" : "500",
											"message" : "One of the Company id's doesn't exists in Builder."
										};
										logger.error(TAG + " Company Details not found in Builder (request is from rfq).");
										return callback(true, resJson);	
									}
								});
							}	
						});
					}			  	
				});	
			} else if(leadSource == "sellerPanel" || leadSource === "sceta"){
				resJson = {
				    "http_code" : "200",
					"message" : "No changes needed to be done in Builder collection."
				};
				logger.error(TAG + " No changes needed to be done in Builder collection (request is from sellerPanel or sceta).");
				return callback(false, resJson);
			}	
	    },
	    //function that will update the seller id in InquiryMaster collection.
	    function(callback) {

	    	if(leadSource == "rfq"){

		       	var customerIds = sellerDetails.sellerLeadEntity.customerIds;
						
				inquiryMastercol.update({ "inquiryEntity.associatedCompanyId": { $in: customerIds },
										  "inquiryEntity.suppliersChosen.0.supplierId": { $exists: true },
										  "inquiryEntity.suppliersChosen.supplierId": sellerLeadId },
										  { $set: { "inquiryEntity.suppliersChosen.$.supplierId" : sellerMasterId } },
										  { multi: true },
										  function(errorb, resultb){
					try {
						var mresult = JSON.parse(resultb);
					}
					catch(err) {
						resJson = {	
						    "http_code" : "500",
							"message" : "Unexpected Server Error while Updating sellerId in InquiryMaster collection."
						};
						logger.error(TAG + " in Try / catch of Updating sellerId in InquiryMaster collection." + JSON.stringify(err));
						return callback(true, resJson);
					}
					
					if(errorb){
						resJson = {	
						    "http_code" : "500",
							"message" : "Updating Seller Id in InquiryMaster collection failed. Please Retry."
						};
						logger.error(TAG + " " + JSON.stringify(errorb));
						return callback(true, resJson);
					} else {
						resJson = {
						    "http_code" : "200",
							"message" : "Succesfully updated sellerId in InquiryMaster collection"
						};
						logger.debug(TAG + " Updating Seller Id in InquiryMaster collection - CRM Succesfull");
						return callback(false, resJson);
					}	
				});
		    } else if(leadSource == "sellerPanel" || leadSource === "sceta"){
				resJson = {
				    "http_code" : "200",
					"message" : "No changes needed to be done in InquiryMaster collection."
				};
				logger.error(TAG + " No changes needed to be done in InquiryMaster collection (request is from sellerPanel or sceta).");
				return callback(false, resJson);
			}   
	    },
	    //function that will update the seller id in SellerLead collection.
	    function(callback) {

	        sellerLeadcol.update({"sellerLeadEntity.sellerLeadId": sellerLeadId, "sellerLeadEntity.crmStatus": "notVerified", "sellerLeadEntity.sellerId": ""}, updateBlock, function(error, result){
			
				try {
					var mresult = JSON.parse(result);
				}
				catch(err) {
					resJson = {	
					    "http_code" : "500",
						"message" : "Unexpected Server Error while Updating sellerId in SellerLead collection."
					};
					logger.error(TAG + " in Try / catch of Updating sellerId in SellerLead collection." + JSON.stringify(err));
					return callback(true, resJson);
				}
				
				if(error){
					resJson = {	
					    "http_code" : "500",
						"message" : "Updating Seller Id and sellerDetails in SellerLead collection failed. Please Retry."
					};
					logger.error(TAG + " " + JSON.stringify(error));
					return callback(true, resJson);
				} else if(!error && mresult.nModified > 0) {
					resJson = {
					    "http_code" : "200",
						"message" : "Succesfully updated sellerId and sellerDetails to SellerLead collection"
					};
					logger.debug(TAG + " Updating Seller Id and sellerDetails in SellerLead collection - CRM Succesfull");
					return callback(false, resJson);
				} else if(!error && mresult.nModified == 0){
					resJson = {
					    "http_code" : "500",
						"message" : "Seller id and sellerDetails has already been updated in SellerLead collection."
					};
					logger.error(TAG + " Seller id and sellerDetails has already been updated in SellerLead collection.");
					return callback(true, resJson);
				}
			});
	    },
	    //function that will add new document to SellerMaster.
	    function(callback) {

	       	if(!existsInMaster){

	       		var cities = [];
	       		var stateAndCity = [];
	       		var categoriesList = [];

	       		var mresult = sellerDetails;
				var emailId = mresult.sellerLeadEntity.emailId;
				var token = "";

				if(mresult.sellerLeadEntity.sellerVerificationInfo.token !== undefined && 
					mresult.sellerLeadEntity.sellerVerificationInfo.token !== null && 
					mresult.sellerLeadEntity.sellerVerificationInfo.token.length !== 0){

					token = mresult.sellerLeadEntity.sellerVerificationInfo.token;
				}

				if(leadSource == "rfq") {
					var state = mresult.sellerLeadEntity.state;
					cities.push(mresult.sellerLeadEntity.city);
					var categories = mresult.sellerLeadEntity.categories;

					stateAndCity.push({
						"state" : state,
						"city" : cities
					});

					for(var i=0; i<categories.length; i++){
						for(var j=0; j<categories[i].subCategories.length; j++){
							categoriesList.push({
								"category1" : categories[i].mainCategory,
								"category2" : categories[i].subCategories[j],
								"brands" : [],
								"newBrands" : []
							});
						}	
					}
				}	

				var doc = {
					"sellerEntity": {
						"profileInfo": {
							"accountInfo": {
								"sellerId": sellerMasterId,
								"userId": (leadSource == "rfq") ? defaultUserId : mresult.sellerLeadEntity.userId,
								"passwordHash": (leadSource == "rfq") ? defaultPasswordHash : mresult.sellerLeadEntity.passwordHash,
								"leadSource": mresult.sellerLeadEntity.leadSource,
								"crmId": ""
							},
							"basicInfo": {
								"email": mresult.sellerLeadEntity.emailId,
								"mobile": mresult.sellerLeadEntity.mobile,
								"contactPerson": "",
								"title": "",
								"telephoneNumber": "",
								"profileImageURL": "",
								"companyInfo": {
									"companyName": mresult.sellerLeadEntity.companyName,
									"displayName": "",
									"businessType": "",
									"establishment": "",
									"faxNo": "",
									"companyImageURL": "",
									"websiteURL": "",
									"wareHouseAddress": [],
									"invoiceAddress": []
								}
							},
							"financialInfo": {
								"taxInfo": {
									"state": "",
									"VAT_TIN": mresult.sellerLeadEntity.VAT_TIN,
									"VATDocumentURL": "",
									"PAN": "",
									"PANDocumentURL": "",
									"CST": "",
									"CSTDocumentURL": ""
								},
								"bankInfo": {
									"accountHolderName": "",
									"accountNumber": "",
									"IFSCCode": "",
									"accountType": "",
									"cancelledChequeDoucmentURL": ""
								},
								"paymentAndCreditInfo": {
									"paymentTerms": [],
									"paymentMode": [],
									"creditTermsProvided": false,
									"creditPeriod": "",
									"creditLimit": ""
								}
							},
							"enquiryAndCategoryInfo": {
								"minimumEnquiryValue": "",
								"maxEnquiryValue": "",
								"leadTime": "",
								"PANIndia": false,
								"stateAndCity": stateAndCity,
								"categories": categoriesList
							},
							"businessInfo": {
								"annualTurnOver": "",
								"productionTradeCapacity": "",
								"productionTradeCapacityUnit": "",
								"noOfEmployeees": "",
								"customerReference": [],
								"testReportOne": "",
								"testReportOneURL": "",
								"testReportTwo": "",
								"testReportTwoURL": "",
								"testReportThree": "",
								"testReportThreeURL": "",
								"certificateOne": "",
								"certificateOneURL": "",
								"certificateTwo": "",
								"certificateTwoURL": "",
								"certificateThree": "",
								"certificateThreeURL": "",
								"importMaterials": false,
								"importLicenseNumber": "",
								"hseFlag": false,
								"ehsFlag": false,
								"ohsasFlag": false,
								"workedWithEcommerce": false,
								"systemBillingName": "",
								"ownTransport": false,
								"noOfVehicles": "",
								"categoryDetails": ""
							}
						},
						"sellerTermsInfo": {
							"termsAccepted": (leadSource == "sceta") ? false : mresult.sellerLeadEntity.sellerVerificationInfo.termsAccepted,
							"termsAcceptedTimeStamp": (leadSource == "sceta") ? "" : mresult.sellerLeadEntity.sellerVerificationInfo.termsAcceptedTimeStamp,
							"firstTimeLogin": true,
							"lastLoginTime": "",
							"lastLoginSource": ""
						},
						"sellerVerificationInfo": {
							"emailVerified": mresult.sellerLeadEntity.sellerVerificationInfo.emailVerified,
							"emailVerifiedTimeStamp": mresult.sellerLeadEntity.sellerVerificationInfo.emailVerifiedTimeStamp,
							"token": token,
							"crmApprovedTimeStamp" : new Date()
						},
						"sellerAccessInfo": {
							"hasEnquiryAccess": (leadSource == "rfq") ? true : false,
							"hasQuoteAccess": (leadSource == "rfq") ? true : false,
							"hasPOAccess": (leadSource == "rfq") ? true : false
						},
						"sellerVerificationStatus": "notVerified"
					}
				};

				sellerMastercol.insert(doc, {w:1},function(errorb, resultb) {
					if (errorb) {
						resJson = {
						    "http_code" : "500",
							"message" : "Error - Adding seller to SellerMaster collection Failed. Please try again"
						};
						logger.error(TAG + " Inserting new document into SellerMaster collection Failed. err: " + JSON.stringify(errorb));
						return callback(true, resJson);
					} else {
						resJson = {
						    "http_code" : "200",
							"message" : "Succesfully added seller to SellerMaster collection"
						};
						logger.debug(TAG + " Adding seller to SellerMaster collection - CRM Succesfull");
						return callback(false, resJson);
					}
				});
	       	} else {
	       		resJson = {
				    "http_code" : "200",
					"message" : "Seller already exists in SellerMaster - No need to add document"
				};
				logger.debug(TAG + " Seller already exists in SellerMaster - No need to add document");
				return callback(false, resJson);
	       	}
	    }
	], function(err, results) {
		if(err){
			resJson = {
			    "http_code" : "500",
			    "message" : "Seller Approval failed.",
				"status" : results
			};
			return callback(true, resJson);
		} else {
			if(!existsInMaster){
				var data = {
					"emailId" : sellerDetails.sellerLeadEntity.emailId,
					"sellerMasterId" : sellerMasterId,
					"userId" : (leadSource == "rfq") ? defaultUserId : sellerDetails.sellerLeadEntity.userId,
					"leadSource" : sellerDetails.sellerLeadEntity.leadSource
				};

				// Sending Notification approved mail to the Seller.
				sellerNotification.sendNotificationSellerApprove(data, function(err, status){
				    if(err){
				        resJson = {
			                "http_code" : "500",
			                "message" : "Error sending approved mail to Seller, please try later.."
			            };
				        callback(true, resJson);
				    }
				    else{
				    	resJson = {  
						    "http_code" : "200",
							"message" : "Approved mail sent to Seller Successfully.",
						}	
						callback(false, resJson);
				    }
				});
			} else {
				resJson = {
				    "http_code" : "200",
					"message" : "VAT number is already registered"
				};
				logger.error(TAG + " Given vat already exists in SellerMaster");
				return callback(true, resJson);
			}	
		}
	});
}

//Function for adding seller to SellerMaster by OMS.
exports.addSellerOMS =
function addSellerOMS (req, callback){
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;

	//Variable for Mongo DB Connection.
	var db = dbConfig.mongoDbConn;

	var sellerLeadcol = db.collection('SellerLead');
	var sellerMastercol = db.collection('SellerMaster');

	//Variable for Logging the messages to the file.
	var logger = log.logger_seller;

	logger.info(ip + " " + TAG + " Entering seller OnBoarding CRM Actions - adding Seller to SellerMaster by OMS.");

	//Log the request.
	logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));

	//Declare the response
	var resJson;

	if( !( 	req === null ||
			req.body === undefined || 
			req.body.companyName === null ||
			req.body.mobile === null 	||
			req.body.emailId === null 	||
			req.body.state === null 	||
			req.body.city === null 	||
			req.body.pan === null 	||
			req.body.vat === null 	||
			req.body.companyName === undefined ||
			req.body.mobile === undefined 	||
			req.body.emailId === undefined 	||
			req.body.state === undefined ||
			req.body.city === undefined 	||
			req.body.pan === undefined 	||
			req.body.vat === undefined 	||
			req.body.companyName.toString().trim().length === 0 ||
			req.body.mobile.toString().trim().length === 0 	||
			req.body.emailId.toString().trim().length === 0 ||
			req.body.state.toString().trim().length === 0 ||
			req.body.city.toString().trim().length === 0 ||
			req.body.pan.toString().trim().length === 0 ||
			req.body.vat.toString().trim().length === 0 ) ){

		var companyName = req.body.companyName;
		var mobile = req.body.mobile;
		var emailId = req.body.emailId;
		var state = req.body.state;
		var city = req.body.city;
	    var pan = req.body.pan;
	    var vat = req.body.vat;

	    var accountHolderName = '';
		var accountNumber = '';
		var IFSCCode = '';
		var accountType = '';

	    if (!(req.body.accountHolderName === undefined || req.body.accountHolderName === null || 
			req.body.accountHolderName.toString().trim().length === 0))
		{
			var accountHolderName = req.body.accountHolderName;
		}	

		if (!(req.body.accountNumber === undefined || req.body.accountNumber === null || 
			req.body.accountNumber.toString().trim().length === 0))
		{
			var accountNumber = req.body.accountNumber;
		}

		if (!(req.body.IFSCCode === undefined || req.body.IFSCCode === null || 
			req.body.IFSCCode.toString().trim().length === 0))
		{
			var IFSCCode = req.body.IFSCCode;
		}

		if (!(req.body.accountType === undefined || req.body.accountType === null || 
			req.body.accountType.toString().trim().length === 0))
		{
			var accountType = req.body.accountType;
		}

		async.waterfall([
			//function to check if vat exists in seller master
			function(callback1){

				sellerMastercol.find({"sellerEntity.profileInfo.financialInfo.taxInfo.VAT_TIN": vat}).toArray(function(error, result){	
					if(error){
						resJson = {
						    "http_code" : "500",
							"message" : "Error while fetching Seller Details in SellerMaster. Please try later."
						};
						logger.error(TAG + " fetching Seller Details in SellerMaster - CRM failed. Error:" + JSON.stringify(error));
						callback1(true, resJson);
					}
					//if seller's vat exists, no need to generate sellermasterid throw error
					else if(!error && result.length > 0){

						var sellerDetails = result[0];

						var details = [];
						details.push({
							"sellerId" : sellerDetails.sellerEntity.profileInfo.accountInfo.sellerId,
							"companyName" : sellerDetails.sellerEntity.profileInfo.basicInfo.companyInfo.companyName,
							"PAN" : sellerDetails.sellerEntity.profileInfo.financialInfo.taxInfo.PAN,
							"VAT" : sellerDetails.sellerEntity.profileInfo.financialInfo.taxInfo.VAT_TIN
						});

						resJson = {
						    "http_code" : "500",
							"message" : "VAT number is already registered",
							"sellerDetails" : details
						};
						logger.error(TAG + " Given vat already exists in SellerMaster");
						callback1(true, resJson);
					}
					//if seller's vat doesn't exists, need to generate seller master id
					else if(!error && result.length === 0){
						callback1(false);
					}
				});	
			},
			//function to generate seller master id and check in seller lead for user, password details.
			function(callback1){
				
				//generates seller master id
				genSellerMasterID.generateSellerMasterID(vat, function(errorb, resultb){
					if(errorb){
						logger.error(TAG + " Error while generating sellerMasterId.");
						resJson = {
						    "http_code" : "500",
							"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
						};
						callback1(true, resJson);
					}
					else{				
						//get Seller details using vat 
						sellerLeadcol.findAndModify({"sellerLeadEntity.VAT_TIN": vat}, null, {$set: {"sellerLeadEntity.sellerId": resultb, "sellerLeadEntity.crmStatus": "verified"}}, { new: true }, function(errorc, resultc){
							if(errorc){
								resJson = {
								    "http_code" : "500",
									"message" : "Error while updating Seller Details in SellerLead. Please try later."
								};
								logger.error(TAG + " updating Seller Details in SellerLead - CRM failed. Error:" + JSON.stringify(errorc));
								callback1(true, resJson);
							}
							//if vat exists in lead send user id only
							else if(!errorc && resultc.value !== null){

								var sellerDetails = resultc.value;

								var data = {
									"emailId" : emailId,
									"sellerMasterId" : resultb,
									"userId" : sellerDetails.sellerLeadEntity.userId,
									"leadSource" : "oms",
									"existsInLead" : true
								};
							    var userId = sellerDetails.sellerLeadEntity.userId;
							    var passwordHash = sellerDetails.sellerLeadEntity.passwordHash;
							    callback1(false, resultb, data, userId, passwordHash);   
							}
							//if vat doesn't exists in lead send user id and default password
							else if(!errorc && resultc.value === null){
									
								sellerMastercol.find({"sellerEntity.profileInfo.accountInfo.userId": mobile}).toArray(function(error, result){	
									if(error){
										resJson = {
										    "http_code" : "500",
											"message" : "Error while fetching Seller Details in SellerMaster. Please try later."
										};
										logger.error(TAG + " fetching Seller Details in SellerMaster - CRM failed. Error:" + JSON.stringify(error));
										callback1(true, resJson);
									}
									//if seller's userId exists, need to set vat as userId
									else if(!error && result.length > 0){
										var data = {
											"emailId" : emailId,
											"sellerMasterId" : resultb,
											"userId" : vat,
											"leadSource" : "oms",
											"existsInLead" : false
										};
									    var userId = vat;
									    var password = 'Password123';
									    var passwordHash = crypto.createHash('md5').update(password).digest('hex');
									    callback1(false, resultb, data, userId, passwordHash);
									}
									//if seller's userId doesn't exists, need to set mobile as userId
									else if(!error && result.length === 0){
										var data = {
											"emailId" : emailId,
											"sellerMasterId" : resultb,
											"userId" : mobile,
											"leadSource" : "oms",
											"existsInLead" : false
										};
									    var userId = mobile;
									    var password = 'Password123';
									    var passwordHash = crypto.createHash('md5').update(password).digest('hex');
									    callback1(false, resultb, data, userId, passwordHash);
									}
								});
							}	
						});
					}
				});		
			},
			//function to insert new doc in seller master and trigger's notification to seller
			function(sellerMasterId, data, userId, passwordHash, callback1){
				
				var cities = [];
		   		var stateAndCity = [];
		   		cities.push(city);

				stateAndCity.push({
					"state" : state,
					"city" : cities
				});

				var doc = {
					"sellerEntity": {
						"profileInfo": {
							"accountInfo": {
								"sellerId": sellerMasterId,
								"userId": userId,
								"passwordHash": passwordHash,
								"leadSource": "oms",
								"crmId": ""
							},
							"basicInfo": {
								"email": emailId,
								"mobile": mobile,
								"contactPerson": "",
								"title": "",
								"telephoneNumber": "",
								"profileImageURL": "",
								"companyInfo": {
									"companyName": companyName,
									"displayName": "",
									"businessType": "",
									"establishment": "",
									"faxNo": "",
									"companyImageURL": "",
									"websiteURL": "",
									"wareHouseAddress": [],
									"invoiceAddress": []
								}
							},
							"financialInfo": {
								"taxInfo": {
									"state": "",
									"VAT_TIN": vat,
									"VATDocumentURL": "",
									"PAN": pan,
									"PANDocumentURL": "",
									"CST": "",
									"CSTDocumentURL": ""
								},
								"bankInfo": {
									"accountHolderName": accountHolderName,
									"accountNumber": accountNumber,
									"IFSCCode": IFSCCode,
									"accountType": accountType,
									"cancelledChequeDoucmentURL": ""
								},
								"paymentAndCreditInfo": {
									"paymentTerms": [],
									"paymentMode": [],
									"creditTermsProvided": false,
									"creditPeriod": "",
									"creditLimit": ""
								}
							},
							"enquiryAndCategoryInfo": {
								"minimumEnquiryValue": "",
								"maxEnquiryValue": "",
								"leadTime": "",
								"PANIndia": false,
								"stateAndCity": stateAndCity,
								"categories": []
							},
							"businessInfo": {
								"annualTurnOver": "",
								"productionTradeCapacity": "",
								"productionTradeCapacityUnit": "",
								"noOfEmployeees": "",
								"customerReference": [],
								"testReportOne": "",
								"testReportOneURL": "",
								"testReportTwo": "",
								"testReportTwoURL": "",
								"testReportThree": "",
								"testReportThreeURL": "",
								"certificateOne": "",
								"certificateOneURL": "",
								"certificateTwo": "",
								"certificateTwoURL": "",
								"certificateThree": "",
								"certificateThreeURL": "",
								"importMaterials": false,
								"importLicenseNumber": "",
								"hseFlag": false,
								"ehsFlag": false,
								"ohsasFlag": false,
								"workedWithEcommerce": false,
								"systemBillingName": "",
								"ownTransport": false,
								"noOfVehicles": "",
								"categoryDetails": ""
							}
						},
						"sellerTermsInfo": {
							"termsAccepted": false,
							"termsAcceptedTimeStamp": "",
							"firstTimeLogin": true,
							"lastLoginTime": "",
							"lastLoginSource": ""
						},
						"sellerVerificationInfo": {
							"emailVerified": false,
							"emailVerifiedTimeStamp": "",
							"crmApprovedTimeStamp" : new Date()
						},
						"sellerAccessInfo": {
							"hasEnquiryAccess": false,
							"hasQuoteAccess": false,
							"hasPOAccess": false
						},
						"sellerVerificationStatus": "notVerified"
					}
				};

				sellerMastercol.insert(doc, {w:1},function(errorm, resultm) {
					if (errorm) {
						resJson = {
						    "http_code" : "500",
							"message" : "Error - Adding seller to SellerMaster collection Failed. Please try again"
						};
						logger.error(TAG + " Inserting new document into SellerMaster collection Failed. err: " + JSON.stringify(errorm));
						callback1(true, resJson);
					} else {

						// Sending Notification approved mail to the Seller.
						sellerNotification.sendNotificationSellerApprove(data, function(err, status){
						    if(err){
						        resJson = {
					                "http_code" : "500",
					                "message" : "Error sending approved mail to Seller - from OMS, please try later.."
					            };
						        callback1(true, resJson);
						    }
						    else{
						    	resJson = {  
								    "http_code" : "200",
									"message" : "Approved mail sent to Seller Successfully - from OMS.",
									"sellerId" : sellerMasterId,
									"companyName" : companyName
								}	
								callback1(false, resJson);
						    }
						});	
					}
				});
			}	
		], function (err, result) {
		 	return callback(err, result);
		});		
	} else {
		resJson = {
		    "http_code" : "400",
			"message" : "Bad or ill-formed request.."
		};
		logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
		return callback(true, resJson);
	}
};

//Function for Fetching the Company Name using SellerId from SellerMaster.
exports.fetchCompanyName = 
function fetchCompanyName (req, callback){
	
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_seller;
	
	logger.info(ip + " " + TAG + " Entering seller onboarding get Seller Details - CRM.");

	//Log the request.
	logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));

	//Declare the response
	var resJson;

	if( !( 	req === null ||
			req.body === undefined || 
			req.body.sellerId === undefined || 
			req.body.sellerId === null || 
			req.body.sellerId.toString().trim().length === 0 ) ){

		var sellerId = req.body.sellerId;

		var sellerMastercol = db.collection('SellerMaster');

		sellerMastercol.find({"sellerEntity.profileInfo.accountInfo.sellerId": sellerId}).toArray(function(error, result){	
			if(error){
				resJson = {
				    "http_code" : "500",
					"message" : "Error while fetching Seller Details in SellerMaster. Please try later."
				};
				logger.error(TAG + " fetching Seller Details in SellerMaster - CRM failed. Error:" + JSON.stringify(error));
				return callback(true, resJson);
			}
			else if(!error && result.length > 0){

				var sellerDetails = result[0];

				resJson = {
				    "http_code" : "200",
					"message" : "Company details fetched Successfully",
					"companyName" : sellerDetails.sellerEntity.profileInfo.basicInfo.companyInfo.companyName
				};
				logger.error(TAG + " Company details fetched Successfully from SellerMaster");
				return callback(false, resJson);
			}
			else if(!error && result.length === 0){
				resJson = {
				    "http_code" : "500",
					"message" : "Seller Details not found."
				};
				logger.debug(TAG + " SellerId doesn't exists in SellerMaster.");
				return callback(true, resJson);
			}
		});	
	} else {
		resJson = {
		    "http_code" : "400",
			"message" : "Bad or ill-formed request.."
		};
		logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
		return callback(true, resJson);
	}
};	