var TAG = "supplierReviewsRatings.js";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var async = require('async');

//Function for Fetching the consolidated reviews.
exports.addReviewForSeller = function addReviewForSeller (req, callback){
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_sup;
	
	//Log the request.
	logger.info("+++ " + TAG + " Request received adding a review for the seller. +++ ");
	
	//Declare the response
	var resJson;
	
	//Validate the request.
	if ( !(	req.body === null || req.body.sellerId === undefined || 
			req.body.sellerId.toString().trim().length === 0 || 
			req.body.sellerId === null || req.body.customerId === undefined || 
			req.body.customerId.toString().trim().length === 0 || 
			req.body.customerId === null || req.body.customerName === undefined || 
			req.body.customerName.toString().trim().length === 0 || 
			req.body.customerName === null || req.body.reviewStars === undefined || 
			req.body.reviewStars.toString().trim().length === 0 || 
			req.body.reviewStars === null || req.body.dateOfReview === undefined || 
			req.body.dateOfReview.toString().trim().length === 0 || 
			req.body.dateOfReview === null || req.body.descriptionGiven === undefined ||
			req.body.orderId === undefined || req.body.orderId.toString().trim().length === 0 || 
			req.body.orderId === null || req.body.reviewTitle === undefined)) 
	{
		var sellerId = req.body.sellerId;
		
		var supplierReviewCol = db.collection('SupplierReviewRatings');

		supplierReviewCol.findOne({"supplierReviewEntity.consolidatedReviewDetails.sellerId": sellerId},
				{"_id": 0}, function(err, Reviewresult) {
			if(!err && (Reviewresult !== null)){
				
				var arrayLength = Reviewresult.supplierReviewEntity.customerSellerReviews.length;
				
				for(var i=0; i < arrayLength; i++){
					if(Reviewresult.supplierReviewEntity.customerSellerReviews[i].orderId === req.body.orderId){
						resJson = {
							    "http_code" : "500",
								"message" : "Seller Review for the specific Order Exists. Please Provide Review for other orders."
						};
						logger.debug(TAG + "Seller Review for the specific Order Exists. Please Review for other orders.");
						return callback(true, resJson);
					}
				}
				
				var custDoc = {
							"customerId": req.body.customerId,
							"orderId": req.body.orderId,
							"customerName": req.body.customerName,
							"reviewStars": req.body.reviewStars,
							"reviewTitle":req.body.reviewTitle,
							"dateOfReview": req.body.dateOfReview,
							"descriptionGiven": req.body.descriptionGiven,
							"reviewApproved": false
					};
				
				
				Reviewresult.supplierReviewEntity.customerSellerReviews.push(custDoc);
				
				supplierReviewCol.update({"supplierReviewEntity.consolidatedReviewDetails.sellerId": sellerId},{$set :  
						{"supplierReviewEntity.customerSellerReviews":Reviewresult.supplierReviewEntity.customerSellerReviews}}, function(err, result) {
					
					if(!err){
						resJson = {
							    "http_code" : "200",
								"message" : " Review has been sent for approval, it will be live shortly."
						};
						logger.error(TAG + "Review for the seller sucessful.");
						return callback(false, resJson);
					}else{
						resJson = {
							    "http_code" : "500",
								"message" : "Seller Review Failed, Server Error. Please try again"
						};
						logger.error(TAG + "Review for the seller Failed : " + err);
						return callback(true, resJson);
					}
					
				});
				
			}else if(!err && (Reviewresult === null)){
				var doc = {
						"supplierReviewEntity": {
	
							"consolidatedReviewDetails": {
								"sellerId": sellerId,
								"consolidatedStars": req.body.reviewStars,
								"totalReviews": 0
							},
	
							"customerSellerReviews": [{
								"customerId": req.body.customerId,
								"orderId": req.body.orderId,
								"customerName": req.body.customerName,
								"reviewStars": req.body.reviewStars,
								"reviewTitle":req.body.reviewTitle,
								"dateOfReview": req.body.dateOfReview,
								"descriptionGiven": req.body.descriptionGiven,
								"reviewApproved": false
							}]
						}
					};
					
					supplierReviewCol.insert(doc, function(err, result) {
						
						if(!err){
							resJson = {
								    "http_code" : "200",
									"message" : " Review has been sent for approval, it will be live shortly."
							};
							logger.error(TAG + "Review for the seller sucessful.");
							return callback(false, resJson);
						}else{
							resJson = {
								    "http_code" : "200",
									"message" : "Seller Review Failed, Server Error. Please try again"
							};
							logger.error(TAG + "Review for the seller Failed : " + err);
							return callback(true, resJson);
						}
						
					});
			}
			else{
				resJson = {
					    "http_code" : "500",
						"message" : "Seller Review Failed, Server Error. Please try again"
				};
				logger.error(TAG + "Seller Review Failed, Server Error. Please try again : " + err);
				return callback(true, resJson);
			}	
		});	
	} 
	else 
	{
		resJson = {
			    "http_code" : "400",
				"message" : "Bad or ill-formed request."
		};
		logger.error(TAG + "Bad or ill-formed request.");
		return callback(true,resJson);
	}	
};

//Function for Fetching the consolidated reviews.
exports.fetchConsolidatedReviews = function fetchConsolidatedReviews (req, callback){
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	//Variable for Logging the messages to the file.
	var logger = log.logger_sup;
	//Log the request.
	logger.info("+++ " + TAG + " Request received for fetching the consolidated Reviews. +++ ");
	//Declare the response
	var resJson;
	
	//Validate the request.
	if ( !(	req.body === null || req.body.sellerId === undefined || 
			req.body.sellerId.toString().trim().length === 0 || 
			req.body.sellerId === null)) 
	{
		var sellerId = req.body.sellerId;
		
		var supplierReviewCol = db.collection('SupplierReviewRatings');
	
		supplierReviewCol.findOne({"supplierReviewEntity.consolidatedReviewDetails.sellerId":sellerId}, {"_id":0, "supplierReviewEntity.consolidatedReviewDetails":1}, function(err, gresult){
			if(!err && (gresult !== null)){
				resJson = {
					    "http_code" : "200",
						"message" : gresult
				};
				logger.error(TAG + "Fetching of consolidated reviews for the seller sucessful.");
				return callback(false, resJson);
			}else if(!err && (gresult === null)){
				resJson = {
					    "http_code" : "500",
						"message" : "No Customer reviews for the Seller."
				};
				logger.error(TAG + " ");
				return callback(true, resJson);
			}
			else{
				resJson = {
					    "http_code" : "500",
						"message" : "Fetching the consolidated Reviews Failed, Server Error. Please try again"
				};
				logger.error(TAG + "Fetching the consolidated Reviews Failed, Server Error. Please try again : " + err);
				return callback(true, resJson);
			}
		});
	} 
	else 
	{
		resJson = {
			    "http_code" : "400",
				"message" : "Bad or ill-formed request."
		};
		logger.error(TAG + "Bad or ill-formed request.");
		return callback(true,resJson);
	}	
};

//Function for Fetching all the reviews for the seller.
exports.fetchReviewsForSeller = function fetchReviewsForSeller (req, callback){
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_sup;
	
	//Log the request.
	logger.info("+++ " + TAG + " Request received for fetching the Reviews for the seller. +++ ");
	
	//Declare the response
	var resJson;
	
	//Validate the request.
	if ( !(	req.body === null || req.body.sellerId === undefined || 
			req.body.sellerId.toString().trim().length === 0 || 
			req.body.sellerId === null)) 
	{
		var sellerId = req.body.sellerId;
		
		var supplierReviewCol = db.collection('SupplierReviewRatings');
				
		supplierReviewCol.aggregate({ $project : {
	        "_id" : 0 ,
	        "supplierReviewEntity.customerSellerReviews" : 1,
	        "supplierReviewEntity.consolidatedReviewDetails.sellerId":1
	    }},
	    {$unwind: "$supplierReviewEntity.customerSellerReviews"},
	    {$match: {"supplierReviewEntity.customerSellerReviews.reviewApproved": true,"supplierReviewEntity.consolidatedReviewDetails.sellerId":sellerId}}, function(err, gresult){
	    	if(!err && (gresult !== null)){
				resJson = {
					    "http_code" : "200",
						"message" : gresult
				};
				logger.error(TAG + "Fetching of All reviews for the seller sucessful.");
				return callback(false, resJson);
			}else if(!err && (gresult === null)){
				resJson = {
					    "http_code" : "500",
						"message" : "No Customer reviews for the Seller."
				};
				logger.error(TAG + " ");
				return callback(true, resJson);
			}
			else{
				resJson = {
					    "http_code" : "500",
						"message" : "Fetching All the Reviews Failed, Server Error. Please try again"
				};
				logger.error(TAG + "Fetching All the Reviews Failed, Server Error. Please try again : " + err);
				return callback(true, resJson);
			}
		});
	} 
	else 
	{
		resJson = {
			    "http_code" : "400",
				"message" : "Bad or ill-formed request."
		};
		logger.error(TAG + "Bad or ill-formed request.");
		return callback(true,resJson);
	}	
};

//Function for Fetching all the reviews for the coma separated seller input.
exports.fetchReviewsForAllSeller = function fetchReviewsForAllSeller (req, callback){
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_sup;
	
	//Log the request.
	logger.info("+++ " + TAG + " Request received for fetching all the reviews for the coma separated seller input. +++ ");
	
	//Declare the response
	var resJson;
	
	//Validate the request.
	if ( !(	req.body === null || req.body.sellerIds === undefined || 
			req.body.sellerIds.toString().trim().length === 0 || 
			req.body.sellerIds === null)) 
	{
		var sellerIds = req.body.sellerIds;
		
		var supplierReviewCol = db.collection('SupplierReviewRatings');
		
		supplierReviewCol.find({"supplierReviewEntity.consolidatedReviewDetails.sellerId":{$in: sellerIds}},
				{"_id":0, "supplierReviewEntity.consolidatedReviewDetails":1}).toArray(function(err, result){
			if(!err && (result !== null)){
				resJson = {
					    "http_code" : "200",
						"message" : result
				};
				logger.debug(TAG + "Fetching of All reviews for the seller sucessful.");
				return callback(false, resJson);
					
			}else if(!err && (result === null)){
				resJson = {
					    "http_code" : "500",
						"message" : "No Customer reviews for the Sellers."
				};
				logger.error(TAG + "No Customer reviews for the seller. " + resJson);
				return callback(true, resJson);
			}
			else{
				resJson = {
					    "http_code" : "500",
						"message" : "Fetching All the Reviews Failed, Server Error. Please try again"
				};
				logger.error(TAG + "Fetching All the Reviews Failed, Server Error. Please try again : " + err);
				return callback(true, resJson);
			}
		});
	} 
	else 
	{
		resJson = {
			    "http_code" : "400",
				"message" : "Bad or ill-formed request."
		};
		logger.error(TAG + "Bad or ill-formed request.");
		return callback(true,resJson);
	}	
};

//Function for Fetching all the reviews to be approved from the admin.
exports.fetchUnapprovedReviews = function fetchUnapprovedReviews (req, callback){
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_sup;
	
	//Log the request.
	logger.info("+++ " + TAG + " Request received for fetching the Unapproved Reviews for the seller from Admin. +++ ");
	
	//Declare the response
	var resJson;
	
	var supplierReviewCol = db.collection('SupplierReviewRatings');
	
	supplierReviewCol.aggregate({ $project : {
        "_id" : 0,
		"supplierReviewEntity.customerSellerReviews":1,
		"supplierReviewEntity.consolidatedReviewDetails":1
    }},
    {$unwind: "$supplierReviewEntity.customerSellerReviews"},
    {$match: {"supplierReviewEntity.customerSellerReviews.reviewApproved": false}}, function(err, gresult){
    	if(!err && (gresult !== null)){
			resJson = {
				    "http_code" : "200",
					"message" : gresult
			};
			logger.error(TAG + "Fetching of All Unapproved reviews for the seller's sucessful.");
			return callback(false, resJson);
		}else if(!err && (gresult === null)){
			resJson = {
				    "http_code" : "500",
					"message" : "No Unapproved Customer reviews for the Seller."
			};
			logger.error(TAG + "No Unapproved Customer reviews for the Seller. ");
			return callback(true, resJson);
		}
		else{
			resJson = {
				    "http_code" : "500",
					"message" : "Fetching All Unapproved Customer reviews Failed, Server Error. Please try again"
			};
			logger.error(TAG + "Fetching All Unapproved Customer reviews Failed, Server Error. Please try again : " + err);
			return callback(true, resJson);
		}
	});
};


//Function to approve the review specific to seller.
exports.approveReviewsForSellers = function approveReviewsForSellers (req, callback){
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_sup;
	
	//Log the request.
	logger.info("+++ " + TAG + " Request received to approve the reviews for seller's. +++ ");
	
	//Declare the response
	var resJson;
	
	//Validate the request.
	if ( !(	req.body === null || req.body.approveReviews === undefined || 
			req.body.approveReviews.length === 0 || 
			req.body.approveReviews === null)) 
	{
		var approveReviews = req.body.approveReviews;
		
		var supplierReviewCol = db.collection('SupplierReviewRatings');
		
		var uniqueSellerArray = [];
		
		async.forEachSeries(approveReviews,
	 		function(csObj, callback){
			  if(csObj.status === "approve"){
					supplierReviewCol.findOne({"supplierReviewEntity.consolidatedReviewDetails.sellerId":csObj.sellerId},
							{"_id":0}, function(err, result){
						if(!err && (result !== null)){
							
							supplierReviewCol.update({"supplierReviewEntity.consolidatedReviewDetails.sellerId":csObj.sellerId,
								"supplierReviewEntity.customerSellerReviews": {$elemMatch: {"customerId":csObj.customerId,"orderId":csObj.orderId,
								"reviewApproved":false } }},{$set: { "supplierReviewEntity.customerSellerReviews.$.reviewApproved" : true}}, function(err, result){
									
									if(!err){
										if(uniqueSellerArray.indexOf(csObj.sellerId) === -1){
											uniqueSellerArray.push(csObj.sellerId);
										}	
										return callback(false);
									}else{
										return callback(true);
									}
							});
						}else if(!err && (result === null)){
							
							return callback(true);
						}
						else{
							return callback(true);
						}
					});
		   }else if(csObj.status === "reject"){
				   supplierReviewCol.findOne({"supplierReviewEntity.consolidatedReviewDetails.sellerId":csObj.sellerId},
							{"_id":0}, function(err, result){
						if(!err && (result !== null)){
							
							supplierReviewCol.update({"supplierReviewEntity.consolidatedReviewDetails.sellerId":csObj.sellerId,
								"supplierReviewEntity.customerSellerReviews": {$elemMatch: {"customerId":csObj.customerId,"orderId":csObj.orderId,
								"reviewApproved":false } }},{$set: { "supplierReviewEntity.customerSellerReviews.$.reviewApproved" : null}}, function(err, result){
									
									if(!err){	
										return callback(false);
									}else{
										return callback(true);
									}
							});
						}else if(!err && (result === null)){
							
							return callback(true);
						}
						else{
							return callback(true);
						}
					});
		   }else if(csObj.status === "delete"){
			   supplierReviewCol.findOne({"supplierReviewEntity.consolidatedReviewDetails.sellerId":csObj.sellerId},
						{"_id":0}, function(err, result){
					if(!err && (result !== null)){
						
						var customerReviews = result.supplierReviewEntity.customerSellerReviews;
						
						for(var i=0; i<customerReviews.length; i++){
							if(csObj.customerId === customerReviews[i].customerId && csObj.orderId === customerReviews[i].orderId){
								customerReviews.splice(i, 1);
							}else{
								continue;
							}
						}
						
						supplierReviewCol.update({"supplierReviewEntity.consolidatedReviewDetails.sellerId":csObj.sellerId},
								{$set: { "supplierReviewEntity.customerSellerReviews" : customerReviews}}, function(err, result){
								
								if(!err){	
									return callback(false);
								}else{
									return callback(true);
								}
						});
						
					}else if(!err && (result === null)){
						
						return callback(true);
					}
					else{
						return callback(true);
					}
				});
		   }
	 	},
 		//Final Function to be called upon completion of all functions.
		function(error)
		{
	 		if(!error){
	 			
	 			async.forEachSeries(uniqueSellerArray,
	 			 		function(csObj, callback){
	 						
	 						supplierReviewCol.findOne({"supplierReviewEntity.consolidatedReviewDetails.sellerId":csObj},
	 								{"_id":0}, function(err, result){
	 							if(!err && (result !== null)){
	 								
	 								var consolidatedStars = 0;
	 								var consolidatedRating = 0;
	 								
	 								var arrayLength = result.supplierReviewEntity.customerSellerReviews.length;
	 								
	 								var count = 0;
	 								
	 								for(var i=0; i< arrayLength; i++){
	 									
	 									if(result.supplierReviewEntity.customerSellerReviews[i].reviewApproved === true){
	 										consolidatedStars = consolidatedStars + result.supplierReviewEntity.customerSellerReviews[i].reviewStars;
	 										consolidatedRating = consolidatedRating + 1;
	 										count = count + 1;
	 									}
	 									
	 								}
	 								
	 								if(count !==0){
	 									consolidatedStars = consolidatedStars/count;
	 								}	
	 								
	 								supplierReviewCol.update({"supplierReviewEntity.consolidatedReviewDetails.sellerId":csObj}
	 									,{$set: {"supplierReviewEntity.consolidatedReviewDetails.consolidatedStars" : consolidatedStars,
	 										"supplierReviewEntity.consolidatedReviewDetails.totalReviews" : consolidatedRating}}, function(err, result){
	 										
	 										if(!err){	
	 											return callback(false);
	 										}else{
	 											return callback(true);
	 										}
	 								});
	 							}else if(!err && (result === null)){
	 								
	 								return callback(true);
	 							}
	 							else{
	 								return callback(true);
	 							}
	 					});

	 			 	},
	 		 		//Final Function to be called upon completion of all functions.
	 				function(error)
	 				{
	 			 		if(!error){
	 			 			resJson = {
	 							    "http_code" : "200",
	 								"message" : "Customer Reviews approved sucessfully."
	 						};
	 						logger.error(TAG + "Customer Reviews approved sucessfully." + resJson);
	 			 			return callback(false, resJson);	
	 			 			
	 			 		}else{
	 			 			resJson = {
	 							    "http_code" : "500",
	 								"message" : "Unexpected Server Error while approving the reviews."
	 						};
	 						logger.error(TAG + "Unexpected Server Error while approving the reviews." + resJson);
	 						return callback(true, resJson);
	 			 		}
	 				});	
	 		}else{
	 			resJson = {
					    "http_code" : "500",
						"message" : "Unexpected Server Error while approving the reviews."
				};
				logger.error(TAG + "Unexpected Server Error while approving the reviews." + resJson);
				return callback(true, resJson);
	 		}
		});
	} 
	else 
	{
		resJson = {
			    "http_code" : "400",
				"message" : "Bad or ill-formed request."
		};
		logger.error(TAG + "Bad or ill-formed request.");
		return callback(true,resJson);
	}	
};

//Function for Fetching the Seller Name.
exports.fetchSellerName = function fetchSellerName (req, callback){
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_sup;
	
	//Log the request.
	logger.info("+++ " + TAG + " Request received for fetching the Seller Name. +++ ");
	
	//Declare the response
	var resJson;
	
	var sellerId = req.body.sellerId;
	
	var supplierReviewCol = db.collection('Seller');
	
	supplierReviewCol.findOne({"sellerEntity.identifier.sellerId":sellerId},{"_id":0}, function(err, gresult){
    	if(!err && (gresult !== null)){
			resJson = {
				    "http_code" : "200",
					"message" : gresult
			};
			logger.error(TAG + "Fetching of Seller Name successful.");
			return callback(false, resJson);
		}else if(!err && (gresult === null)){
			resJson = {
				    "http_code" : "500",
					"message" : "Fetching Seller Name Failed."
			};
			logger.error(TAG + "Fetching Seller Name Failed. ");
			return callback(true, resJson);
		}
		else{
			resJson = {
				    "http_code" : "500",
					"message" : "Fetching Seller Name Failed, Server Error. Please try again"
			};
			logger.error(TAG + "Fetching Seller Name Failed, Server Error. Please try again : " + err);
			return callback(true, resJson);
		}
	});
};

//Function for checking whether the specific order is reviewed.
exports.isOrderReviewed = function isOrderReviewed (req, callback){
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_sup;
	
	//Log the request.
	logger.info("+++ " + TAG + " Request received for validating whether the specific order is reviewed or not. +++ ");
	
	//Declare the response
	var resJson;
	
	//Validate the request.
	if ( !(	req.body === null || req.body.sellerAndOrderIds === undefined || 
			req.body.sellerAndOrderIds.toString().trim().length === 0 || 
			req.body.sellerAndOrderIds === null)) 
	{
		var sellerIdOrderArray = req.body.sellerAndOrderIds;
		
		var supplierReviewCol = db.collection('SupplierReviewRatings');
		
		var reviewExists = [];
		
		async.forEachSeries(sellerIdOrderArray,
			 		function(csObj, callback){
				supplierReviewCol.findOne({"supplierReviewEntity.consolidatedReviewDetails.sellerId":csObj.sellerId,
					"supplierReviewEntity.customerSellerReviews":{$elemMatch:{"orderId":csObj.orderId}}},
						{"_id":0, "supplierReviewEntity.consolidatedReviewDetails":1},function(err, result){

					if(!err && (result !== null)){
						reviewExists.push({"sellerId":csObj.sellerId,"orderId":csObj.orderId,"reviewExists":true});
						return callback(false);
					}else if(!err && (result === null)){
						reviewExists.push({"sellerId":csObj.sellerId,"orderId":csObj.orderId,"reviewExists":false});
						return callback(false);
					}else{
						return callback(true);
					}
				});
		
		},
	 		//Final Function to be called upon completion of all functions.
			function(error)
			{
		 		if(!error){
		 			resJson = {
						    "http_code" : "200",
							"message" : reviewExists
					};
					logger.error(TAG + "Seller's and Order's Combination Validated Successful" + resJson);
		 			return callback(false, resJson);	
		 			
		 		}else{
		 			resJson = {
						    "http_code" : "500",
							"message" : "Unexpected Server Error while Seller's and Order's Combination Validating."
					};
					logger.error(TAG + "Unexpected Server Error while Seller's and Order's Combination Validating." + resJson);
					return callback(true, resJson);
		 		}
		});
	} 
	else 
	{
		resJson = {
			    "http_code" : "400",
				"message" : "Bad or ill-formed request."
		};
		logger.error(TAG + "Bad or ill-formed request.");
		return callback(true,resJson);
	}	
};