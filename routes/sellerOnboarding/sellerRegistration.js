var TAG = "sellerRegistration.js";

var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var crypto = require('crypto');
var request = require("request");
var sellerNotification = require('./sellerNotification.js');
var sellerRegistration = require('./sellerRegistration.js');

//Function for registering builder.
exports.register =
function register (req, callback){
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;

	//Variable for Mongo DB Connection.
	var db = dbConfig.mongoDbConn;

	//Variable for Logging the messages to the file.
	var logger = log.logger_seller;

	logger.info(ip + " " + TAG + " Entering seller onboarding registration.");

	//Log the request.
	logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));

	//Declare the response
	var resJson;

	//Validate the request.
	if ( !(	req === null || 
			req.body === null ||
			req.body.companyName === null ||
			req.body.mobile === null 	||
			req.body.emailId === null 	||
			req.body.userId === null 	|| 
			req.body.password === null 	||
			req.body.vat === null 	||
			req.body.leadSource === null     ||
			req.body.termsAccepted === null     ||
			req.body.companyName === undefined ||
			req.body.mobile === undefined 	||
			req.body.emailId === undefined 	||
			req.body.userId === undefined 	||
			req.body.password === undefined 	||
			req.body.vat === undefined 	||
			req.body.leadSource === undefined	||
			req.body.termsAccepted === undefined	||
			req.body.companyName.toString().trim().length === 0 ||
			req.body.mobile.toString().trim().length === 0 	||
			req.body.emailId.toString().trim().length === 0 	||
			req.body.userId.toString().trim().length === 0 ||
			req.body.password.toString().trim().length === 0 	||
			req.body.vat.toString().trim().length === 0 	||
			req.body.leadSource.toString().trim().length === 0 ||
			req.body.termsAccepted.toString().trim().length === 0 )) {
		
			var termsAccepted = req.body.termsAccepted;
			
			if(typeof(termsAccepted) === "boolean"){
				
				if(!termsAccepted){
				
					resJson = {
						    "http_code" : "500",
							"message" : "The terms and conditions should be accepted by supplier."
					};
					logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
					return callback(false,resJson);
				}	
				
			}else{
				resJson = {
					    "http_code" : "500",
						"message" : "terms and conditions should be a proper input."
				};
				logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
				return callback(false,resJson);
			}
			
			
			var companyName = req.body.companyName;
			var mobile = req.body.mobile;
			var emailId = req.body.emailId;
			var userIdInput = req.body.userId;
			var userId = userIdInput.toLowerCase();
		    var pass = req.body.password;
		    var vat = req.body.vat;
		    var pincode = req.body.pincode;
		    var leadSource = req.body.leadSource;
		    var termsAccepted = req.body.termsAccepted;
		    
		    var passwordHash = crypto.createHash('md5').update(pass).digest('hex');
		    
		    var sellerLeadId;
		    
		    var colSellerLead = db.collection("SellerLead");
		    var colSellerMaster = db.collection("SellerMaster");
	
     colSellerMaster.findOne({"sellerEntity.profileInfo.financialInfo.taxInfo.VAT_TIN" : vat}, 
    		 {"_id":0, "sellerEntity.profileInfo.financialInfo.taxInfo": 1}, function(merr, mresult){
    			     
		if(!merr && mresult === null){
			  
				 colSellerLead.findOne({"sellerLeadEntity.VAT_TIN" : vat}, {"_id":0}, function(verr, vresult){
					 if(!verr && vresult === null){
					    sellerRegistration.generateSellerLeadId(function(err, result){
					    	if(!err){
					    		
					    		// Generating Token
							    var encryptedToken = crypto.randomBytes(64).toString('hex');
					    		
					    		sellerLeadId = result;
					    		
							    var doc = {
					    			"sellerLeadEntity":{
					    				"sellerLeadId" : sellerLeadId,
					    				"sellerId" : "",
					    				"companyName" : companyName,
					    				"emailId" : emailId,
					    				"mobile" : mobile,
					    				"userId" : userId,
					    				"passwordHash" : passwordHash,
					    				"VAT_TIN" : vat,
					    				"leadSource" : leadSource,
					    				"customerIds" : [],
					    				"createdAt" : new Date(),
					    				"sellerVerificationInfo":{
					    					"termsAccepted": termsAccepted,
					    					"termsAcceptedTimeStamp" : new Date(),
					    					"token" : encryptedToken,
					    					"emailVerified" : false,
					    					"emailVerifiedTimeStamp" : "",
					    					"OTP" : "",
					    					"otpVerified" : false,
					    					"otpVerifiedTimestamp" : ""
					    				},
					    				"crmStatus" : "notVerified"
					    			}	
							    };
							  
							  //Before inserting to the seller lead collection we need have a check in the master whether the VAT already exists.  
							    
							  colSellerLead.insert(doc, function(err, sresult){
								  
								  if(!err){
								
								    // Sending Notification mail to the user
								    sellerNotification.sendNotificationSeller(req, encryptedToken, function(err, status){
								        if(err){
								            resJson = {
								                        "http_code" : "500",
								                        "message" : "Error sending mail, please try later.."
								                };
								            callback(true, resJson);
								        }
								        else{
								        	resJson = {  
												    "http_code" : "200",
													"message" : "Registration for Seller Panel Successful.",
											}	
											callback(false, resJson);
								        }
								    });  
								  }else{
									  resJson = {
										    "http_code" : "500",
											"message" : "Registration for Seller Panel Failed."
									  };
									  logger.error(ip + " " +TAG + " Insert to DB Failed while registering " + JSON.stringify(err));
									  return callback(false,resJson); 
								  }
							  });  
							    
					    	}else{
					    		resJson = {
									    "http_code" : "500",
										"message" : "Generating the Seller Lead ID Failed."
								};
								logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
								return callback(false,resJson);
					    	}    
					    });
					 }else if(!verr && vresult !== null){
						 resJson = {
							    "http_code" : "500",
								"message" : "Seller with this VAT_TIN Already Exists Lead."
							};
							logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
							return callback(false,resJson);
					 }else{
						 resJson = {
							    "http_code" : "500",
								"message" : "Unexpected Server Error while fulfilling the request.Please retry."
							};
							logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
							return callback(false,resJson);
					 }   
				 });
			}else if(!merr && mresult !== null){
				resJson = {
				    "http_code" : "500",
					"message" : "Seller with this VAT_TIN Already Exists."
				};
				logger.error(ip + " " +TAG + " Seller Master VAT TIN Exists Master." + JSON.stringify(resJson));
				return callback(false,resJson);
			}else {
				resJson = {
					    "http_code" : "500",
						"message" : "Unexpected Server Error while fulfilling the request.Please retry."
				};
				logger.error(ip + " " +TAG + " Seller Master Find One" + JSON.stringify(resJson));
				return callback(false,resJson);
			}
    	});	
	}else {
		resJson = {
			    "http_code" : "400",
				"message" : "Bad or ill-formed request.."
		};
		logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
		return callback(false,resJson);
	}
}

//Function to generate Seller Lead id
exports.generateSellerLeadId =
function generateSellerLeadId(callback){
  var db = dbConfig.mongoDbConn;
  
  	//Variable for Logging the messages to the file.
	var logger = log.logger_seller;

	db.collection('counters').findAndModify({ _id: 'sellerLead' },null, { $inc: { seq: 1 } }, {new: true}, function(err, result){
    if (err) {
      logger.error(TAG + "Fetching the counters value for Seller Lead Failed.");
      callback(true);
    } else {
      logger.debug(TAG + "Fetching the counters value for Seller Lead Sucess.");
      callback(false, "L" + ('000000' + result.value.seq).slice(-7));
    }
  });
}

//Function for the Validating the Registration OTP.
exports.validateOTP = 
function validateOTP (req, callback){
	
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_seller;
	
	logger.info(ip + " " + TAG + " Entering Validate OTP.");
	
	//Log the request.
	logger.info(ip + " " + TAG  + " " + JSON.stringify(req.body));
	
	//Declare the response
	var resJson;
	
	//Validate the request.
	if ( !(	req === null || 
			req.body === null ||
			req.body.OTP === undefined || 
			req.body.sellerLeadId === undefined ||
			req.body.OTP === null || 
			req.body.sellerLeadId === null ||
			req.body.OTP.toString().trim().length === 0 ||
			req.body.sellerLeadId.toString().trim().length === 0)) {
		
	var OTP = req.body.OTP;
	var sellerLeadId = req.body.sellerLeadId;
	
	var colSellerLead = db.collection('SellerLead');
	
	colSellerLead.findOne({"sellerLeadEntity.sellerVerificationInfo.OTP": OTP,"sellerLeadEntity.sellerLeadId": sellerLeadId},{"_id": 0 },function(err, nresult) {
		if(!err && (nresult !== null)){
			
		colSellerLead.update({"sellerLeadEntity.sellerLeadId": sellerLeadId},
				{$set :{"sellerLeadEntity.sellerVerificationInfo.otpVerified": true,"sellerLeadEntity.sellerVerificationInfo.otpVerifiedTimestamp": new Date()}},function(err, result) {
			if(!err){
				resJson = {
					    "http_code" : "200",
						"message" : "OTP Verification Successful"
				};
				logger.debug(ip + " " + TAG + " Validate OTP Successful for registration.");
				return callback(false, resJson);
			}else{
				resJson = {
					    "http_code" : "500",
						"message" : "OTP Verification Failed."
				};
				logger.error(ip + " " + TAG + " Validate OTP Failed for Registration: " + err);
				return callback(true, resJson);
			}
		});
			
		} else if(!err && (nresult === null)) {
			resJson = {
				    "http_code" : "500",
					"message" : "Inputs Doesn't match with our records.Please retry.."
			};
			logger.error(ip + " " + TAG + " OTP and Seller Lead ID didn't match : " + err);
			return callback(true, resJson);
		}else {
			resJson = {
				    "http_code" : "500",
					"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
			};
			logger.error(ip + " " + TAG + " Validate OTP Failed : " + err);
			return callback(true, resJson);
		}
	});		
	}else {
		resJson = {
			    "http_code" : "400",
				"message" : "Bad or ill-formed request.."
		};
		logger.error(ip + " " + TAG + " " + JSON.stringify(resJson));
		return callback(false,resJson);
	}
};


//Function for the regenerating the Registration OTP.
exports.regenerateOTP = 
function regenerateOTP (req, callback){
	
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_seller;
	
	logger.info(ip + " " + TAG + " Entering Regenerate OTP.");
	
	//Log the request.
	logger.info(ip + " " + TAG  + " " + JSON.stringify(req.body));
	
	//Declare the response
	var resJson;
	
	//Validate the request.
	if ( !(	req === null || 
			req.body === null ||
			req.body.sellerLeadId === undefined ||
			req.body.sellerLeadId === null ||
			req.body.sellerLeadId.toString().trim().length === 0)) {
		
	var sellerLeadId = req.body.sellerLeadId;
	
	var colSellerLead = db.collection('SellerLead');
	
	colSellerLead.findOne({"sellerLeadEntity.sellerLeadId": sellerLeadId},{"_id": 0 },function(err, nresult) {
		if(!err && (nresult !== null)){
			
		//user secret key 
		var secret = otp.utils.generateSecret();
		// OTP code 
		var otpCode = otp.generate(secret);	
		
		var mobile = nresult.sellerLeadEntity.mobile;
		
		colSellerLead.update({"sellerLeadEntity.sellerLeadId": sellerLeadId},
				{$set :{"sellerLeadEntity.sellerVerificationInfo.OTP": otpCode}},function(err, result) {
			if(!err){
				
				request("http://smsc.smsconnexion.com/api/gateway.aspx?action=send&username=msupply&passphrase=123456&message=Hi! OTP for Registering as Seller with mSupply.com : " + otpCode + "    -Team mSupply" +"&phone=" + mobile, function(err, response, body) {
					if(!err){  
						resJson = {
							    "http_code" : "200",
								"message" : "OTP Regenerated."
						};
						logger.debug(ip + " " + TAG + " OTP Regenerated.");
						return callback(false, resJson);
					}else{
						resJson = {
						    "http_code" : "500",
							"message" : "OTP Regeneration Failed."
						};
						logger.error(ip + " " + TAG + " OTP not sent for user with mobile no..." + mobile + " Problem with the gateway");
						callback(true, resJson);
					}	
				});
			}else{
				resJson = {
					    "http_code" : "500",
						"message" : "OTP Regeneration Failed."
				};
				logger.error(ip + " " + TAG + " Update OTP to DB Failed: " + err);
				return callback(true, resJson);
			}
		});
			
		} else if(!err && (nresult === null)) {
			resJson = {
				    "http_code" : "500",
					"message" : "Inputs Doesn't match with our records.Please retry.."
			};
			logger.error(ip + " " + TAG + " OTP and Seller Lead ID didn't match : " + err);
			return callback(true, resJson);
		}else {
			resJson = {
				    "http_code" : "500",
					"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
			};
			logger.error(ip + " " + TAG + " Validate OTP Failed : " + err);
			return callback(true, resJson);
		}
	});		
	}else {
		resJson = {
			    "http_code" : "400",
				"message" : "Bad or ill-formed request.."
		};
		logger.error(ip + " " + TAG + " " + JSON.stringify(resJson));
		return callback(false,resJson);
	}
};

//Function for the Validating the user ID.
exports.validateUserId = 
function validateUserId (req, callback){
	
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_seller;
	
	logger.info(ip + " " + TAG + " Entering Validate User ID.");
	
	//Log the request.
	logger.info(ip + " " + TAG  + " " + JSON.stringify(req.body));
	
	//Declare the response
	var resJson;
	
	//Validate the request.
	if ( !(	req === null || 
			req.body === null ||
			req.params.userId === undefined || 
			req.params.userId === null || 
			req.params.userId.toString().trim().length === 0)) {
		
	var userId = req.params.userId;
	
	var caseUserId = userId.toLowerCase();
	
	var colSellerLead = db.collection('SellerLead');
	
	colSellerLead.findOne({"sellerLeadEntity.userId": caseUserId},{"_id": 0 },function(err, nresult) {
		if(!err && (nresult !== null)){
	
			resJson = {
				    "http_code" : "400",
					"message" : "User Id is already used.Please choose different User Id."
			};
			logger.debug(ip + " " + TAG + " User Id is already used.Please choose different User Id.");
			return callback(true, resJson);
			
		} else if(!err && (nresult === null)) {
			resJson = {
				    "http_code" : "200",
					"message" : "User Id is valid."
			};
			logger.error(ip + " " + TAG + " User Id is valid : " + err);
			return callback(false, resJson);
		}else {
			resJson = {
				    "http_code" : "500",
					"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
			};
			logger.error(ip + " " + TAG + " Validate USER ID Failed : " + err);
			return callback(true, resJson);
		}
	});		
	}else {
		resJson = {
			    "http_code" : "400",
				"message" : "Bad or ill-formed request.."
		};
		logger.error(ip + " " + TAG + " " + JSON.stringify(resJson));
		return callback(true,resJson);
	}
};