/**
 * New node file
 */

var TAG = "paymentmodes.js";
var log = require('../../Environment/log4js.js');
var dbConfig = require('../../Environment/mongoDatabase.js');
var async = require('async');

//Function for the Reset Password.
exports.fetchPaymentModes = 
function fetchPaymentModes (req, callback){
		
		//Variable for Logging the messages to the file.
		var logger = log.logger_sp;	
	
		//Get the IP Address of the client.
		var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
		
		logger.info(ip + " " + TAG + " Request received for fetching the Payment Modes.");
		
		var resJson = {
		    "http_code" : "200",
			"message" : ["Cash", "Cheque", "Bank Transfer", "Internet Banking or NEFT", "Demand Draft", "Cash after delivery", "Digital Wallet", "Other payment modes"]
		 };
		
		logger.info(ip + " " + TAG + " Request processed sucessfully for fetching the Payment Modes.");
		
		callback(true,resJson);
};

//Function that will store the payment details of particular service provider.
exports.storePaymentinfo = 
function storePaymentinfo (req, callback){
	//Variable for Logging the messages to the file.
	var logger = log.logger_sp;

	//Declare the response
	var resJson;

	logger.info(TAG + " Request received for storing the Payment info.");

	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;

	if( !(req === null || req.body === null || req.body.serviceProviderId === undefined || req.body.transactionid === undefined || 
		req.body.first_name === undefined || req.body.last_name === undefined || req.body.city === undefined || req.body.mode_of_payment === undefined || 
		req.body.amount === undefined || req.body.serviceProviderId.toString().trim().length === 0 || req.body.transactionid.toString().trim().length === 0 || 
		req.body.first_name.toString().trim().length === 0 || req.body.last_name.toString().trim().length === 0|| req.body.city.toString().trim().length === 0 || req.body.mode_of_payment.toString().trim().length === 0 || 
		req.body.amount.toString().trim().length === 0)){

		//Handling payment mode. 
		if(req.body.mode_of_payment === "Cheque/Demand Draft" || req.body.mode_of_payment === "Cash"){
			var ServiceProvidercol = db.collection('ServiceProvider');
			ServiceProvidercol.update({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": req.body.serviceProviderId},
							{ 
								$set: {
										"serviceProviderEntity.profileInfo.accountInfo.paymentStatus": "Pending",
									 	"serviceProviderEntity.profileInfo.accountInfo.verificationPaymentMadeby": req.body.mode_of_payment
								}
							},  function(error, result){
							
							try{
								result = JSON.parse(result);
							}
							catch(err){
								resJson = {	
								    "http_code" : "500",
									"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
								};
								logger.error(TAG + " Exception - exception araised during Updating paymentStatus, verificationPaymentMadeby for serviceProviderId: "+req.body.serviceProviderId+" error: "+err);
								return callback(true, resJson);
							}
						  	
						  	if(error)
						  	{
						  		resJson = {	
								    "http_code" : "500",
									"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
								};
						  		logger.error(TAG + " Failed Updating paymentStatus, verificationPaymentMadeby for serviceProviderId: "+req.body.serviceProviderId);
						  		return callback(true, resJson);
						  	}
						  	else if(result.n < 1)
						  	{
						  		resJson = {	
								    "http_code" : "500",
									"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
								};
						  		logger.error(TAG + " Record Not Found - Failed Updating paymentStatus, verificationPaymentMadeby for serviceProviderId: "+req.body.serviceProviderId);
						  		return callback(true, resJson);
						  	} 
							else
							{
								resJson = {	
								    "http_code" : "200",
									"message" : "Payments information inserted sucessfully."
								};
								logger.debug(TAG + " Successfully updated paymentStatus, verificationPaymentMadeby for serviceProviderId: "+req.body.serviceProviderId);
						  		return callback(false, resJson);
							}
			});

		}
		else{
			var paymentDoc = {
				"paymentsInfo" : {
			        "serviceProviderId" : req.body.serviceProviderId, 
			        "paymentsDetails" : {
			            "transactionid" : req.body.transactionid, 
			            "first_name" : req.body.first_name, 
			            "last_name" : req.body.last_name, 
			            "city" : req.body.city, 
			            "mode_of_payment" : req.body.mode_of_payment, 
			            "amount" : req.body.amount, 
			            "payment_datetime" : new Date()
			        }
			    }
			};

			async.series([
				//Function to insert the payment information.
				function(asyncCallback){
					var paymentscol = db.collection('ServiceProviderPayments');

					paymentscol.insert(paymentDoc, {w:1}, function(err, result) {
						if (err) {
							resJson = {	
								    "http_code" : "500",
									"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
							};
							logger.error(TAG + " Unexpected Server Error while inserting Payments information for serviceProviderId: "+req.body.serviceProviderId+" ,error : "+JSON.stringify(err));
							return asyncCallback(true);
						}
						else{
							resJson = {	
								    "http_code" : "200",
									"message" : "Payments information inserted sucessfully."
							};
							logger.error(TAG + " Payments information inserted sucessfully. ");
							return asyncCallback(false);
						}
					});
					
				},
				//Function to update the "verificationStatus", "paymentStatus" field.
				function(asyncCallback){
					var ServiceProvidercol = db.collection('ServiceProvider');
					ServiceProvidercol.update({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": req.body.serviceProviderId},
							{ 
								$set: {
										"serviceProviderEntity.profileInfo.accountInfo.paymentStatus": "Completed",
									 	"serviceProviderEntity.profileInfo.accountInfo.verificationStatus": "Pending",
									 	"serviceProviderEntity.profileInfo.accountInfo.verificationPaymentMadeby": req.body.mode_of_payment
									 }
							},  function(error, result){
							
							try{
								result = JSON.parse(result);
							}
							catch(err){
								resJson = {	
								    "http_code" : "500",
									"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
								};
								logger.error(TAG + " Exception - exception araised during Updating paymentStatus, verificationStatus, verificationPaymentMadeby for serviceProviderId: "+req.body.serviceProviderId+" error: "+err);
								return asyncCallback(true);
							}
						  	
						  	if(error)
						  	{
						  		resJson = {	
								    "http_code" : "500",
									"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
								};
						  		logger.error(TAG + " Failed Updating paymentStatus, verificationStatus, verificationPaymentMadeby for serviceProviderId: "+req.body.serviceProviderId);
						  		return asyncCallback(true);
						  	}
						  	else if(result.n < 1)
						  	{
						  		resJson = {	
								    "http_code" : "500",
									"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
								};
						  		logger.error(TAG + " Record Not Found - Failed Updating paymentStatus, verificationStatus, verificationPaymentMadeby for serviceProviderId: "+req.body.serviceProviderId);
						  		return asyncCallback(true);
						  	} 
							else
							{
								resJson = {	
								    "http_code" : "200",
									"message" : "Payments information inserted sucessfully."
								};
								logger.debug(TAG + " Successfully updated paymentStatus, verificationStatus, verificationPaymentMadeby for serviceProviderId: "+req.body.serviceProviderId);
						  		return asyncCallback(false);
							}
						});
					
				}
			], function(error){
				if(error){
					return callback(true, resJson);
				}	
				else{
					return callback(false, resJson);
				}
			});
		}
	}
	else{
		resJson = {
			    "http_code" : "400",
				"message" : "Bad or ill-formed request.."
		};
		logger.error(TAG + " Bad or ill-formed request while inserting Payments information " + JSON.stringify(resJson));
		return callback(false, resJson);
	}
}

//Function that will store the payment details of particular service provider if he choose to pay by cash/cheque/dd.
exports.storecash_ddPaymentinfo = 
function storecash_ddPaymentinfo (req, callback){
	//Variable for Logging the messages to the file.
	var logger = log.logger_sp;

	//Declare the response
	var resJson;

	logger.info(TAG + " Request received for storing the Payment info.");

	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;

	if( !(req === null || req.body === null || req.body.serviceProviderId === undefined ||
		req.body.first_name === undefined || req.body.last_name === undefined || req.body.city === undefined || req.body.mode_of_payment === undefined || 
		req.body.city === undefined || req.body.serviceProviderId.toString().trim().length === 0 || 
		req.body.first_name.toString().trim().length === 0 || req.body.last_name.toString().trim().length === 0|| req.body.city.toString().trim().length === 0 || req.body.mode_of_payment.toString().trim().length === 0 || 
		req.body.city.toString().trim().length === 0)){

		var amountPayable = 0, paymentDoc = {};
		paymentDoc = {
					"paymentsInfo" : {
				        "serviceProviderId" : req.body.serviceProviderId, 
				        "paymentsDetails" : {
				            "transactionid" : "NA",
				            "first_name" : req.body.first_name, 
				            "last_name" : req.body.last_name, 
				            "city" : req.body.city, 
				            "mode_of_payment" : req.body.mode_of_payment, 
				            "payment_datetime" : new Date()
				        }
				    }
		};

		async.series([
			//Function to get amount based on city.
			function(asyncCallback){
				var feecol = db.collection('ServiceProviderFee');

				feecol.find({"city": req.body.city}).toArray(function(error, result){
					if(error){
						logger.error(TAG + " Error while fetching document in ServiceProviderFee for city: "+req.body.city+", Error :"+error);
						return asyncCallback(true);
					}
					else if(result.length < 1) {
						resJson = {
						    "http_code" : "500",
							"message" : "There are data with respect to ."+req.body.city
						};
						logger.error(TAG + "  There are data with respect to " + req.body.city);
						return asyncCallback(true);
					}
					else{
						amountPayable = result[0].fee;
						return asyncCallback(false);
					}
				});
			},
			//Function to insert the payment information.
			function(asyncCallback){
				var paymentscol = db.collection('ServiceProviderPayments');
				paymentDoc.paymentsInfo.paymentsDetails.amount = amountPayable;
				paymentscol.insert(paymentDoc, {w:1}, function(err, result) {
					if (err) {
						resJson = {	
							    "http_code" : "500",
								"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
						};
						logger.error(TAG + " Unexpected Server Error while inserting Payments information for serviceProviderId: "+req.body.serviceProviderId+" ,error : "+JSON.stringify(err));
						return asyncCallback(true);
					}
					else{
						resJson = {	
							    "http_code" : "200",
								"message" : "Payments information inserted sucessfully."
						};
						logger.error(TAG + " Payments information inserted sucessfully. ");
						return asyncCallback(false);
					}
				});
				
			},
			//Function to update the "verificationStatus", "paymentStatus" field.
			function(asyncCallback){
				var ServiceProvidercol = db.collection('ServiceProvider');
				ServiceProvidercol.update({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": req.body.serviceProviderId},
						{ $set: {"serviceProviderEntity.profileInfo.accountInfo.paymentStatus": "Completed", "serviceProviderEntity.profileInfo.accountInfo.verificationStatus": "Pending"}},  function(error, result){
						
						try{
							result = JSON.parse(result);
						}
						catch(err){
							resJson = {	
							    "http_code" : "500",
								"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
							};
							logger.error(TAG + " Exception - exception araised during Updating paymentStatus, verificationStatus, verificationPaymentMadeby for serviceProviderId: "+req.body.serviceProviderId+" error: "+err);
							return asyncCallback(true);
						}
					  	
					  	if(error)
					  	{
					  		resJson = {	
							    "http_code" : "500",
								"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
							};
					  		logger.error(TAG + " Failed Updating paymentStatus, verificationStatus,  verificationPaymentMadeby for serviceProviderId: "+req.body.serviceProviderId);
					  		return asyncCallback(true);
					  	}
					  	else if(result.n < 1)
					  	{
					  		resJson = {	
							    "http_code" : "500",
								"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
							};
					  		logger.error(TAG + " Record Not Found - Failed Updating paymentStatus, verificationStatus,  verificationPaymentMadeby for serviceProviderId: "+req.body.serviceProviderId);
					  		return asyncCallback(true);
					  	} 
						else
						{
							resJson = {	
							    "http_code" : "200",
								"message" : "Payments information inserted sucessfully."
							};
							logger.debug(TAG + " Successfully updated paymentStatus, verificationStatus,  verificationPaymentMadeby for serviceProviderId: "+req.body.serviceProviderId);
					  		return asyncCallback(false);
						}
					});
				
			}
		], function(error){
			if(error){
				return callback(true, resJson);
			}	
			else{
				return callback(false, resJson);
			}
		});
	}
	else{
		resJson = {
			    "http_code" : "400",
				"message" : "Bad or ill-formed request.."
		};
		logger.error(TAG + " Bad or ill-formed request while inserting Payments information " + JSON.stringify(resJson));
		return callback(true, resJson);
	}
}




//Function that will get the payment details of particular service provider.
exports.getPaymentinfo = 
function getPaymentinfo (req, callback){
	//Variable for Logging the messages to the file.
	var logger = log.logger_sp;
	//Declare the response
	var resJson;

	logger.info(TAG + " Request received for fetching the Payment info.");

	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;

	if( !(req === null || req.body === null || req.body.serviceProviderId === undefined || req.body.serviceProviderId.toString().trim().length === 0)){
		var paymentscol = db.collection('ServiceProviderPayments');

		var response_message = [];

		paymentscol.find({"paymentsInfo.serviceProviderId": req.body.serviceProviderId},{"_id": 0}).toArray(function(error, result){
			if(error){
				logger.error(TAG + " Error while fetching payments information for serviceProviderId: "+req.body.serviceProviderId);
				resJson = {
				    "http_code" : "500",
					"message" : "Error while fetching payments information. Please try later."
				};
				return callback(true, resJson);
			}
			else if(!error && result.length === 0){
				logger.debug(TAG + " payments information not found for serviceProviderId: "+req.body.serviceProviderId);
				resJson = {
				    "http_code" : "200",
					"message" : response_message
				};
				return callback(false, resJson);
			}
			else if(!error && result.length > 0){
				logger.debug(TAG + " Got payments information for serviceProviderId: "+req.body.serviceProviderId);
				resJson = {
				    "http_code" : "200",
					"message" : result
				};
				return callback(false, resJson);
			}
		});
	}
	else{
		resJson = {
			    "http_code" : "400",
				"message" : "Bad or ill-formed request.."
		};
		logger.error(ip + " " + TAG + " " + JSON.stringify(resJson));
		return callback(false,resJson);
	}
}	

