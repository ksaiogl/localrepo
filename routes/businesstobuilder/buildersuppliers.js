var TAG = "buildersuppliers.js";

var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var rfqNotifications = require('./rfqNotifications.js');
var magento = require('../magento/magentoAPI.js');
var genSellerId = require('../oms/util/generateSellerID.js');
var async = require('async');
var _ = require("underscore");
var emails = require('../helpers/emailIdConfig.js');
var env = require('../../Environment/env.js').env;
var fetchCompanyIds = require('./utility/getCompanyIds.js');


//Function for adding the New Project Details.
exports.addSupplier = 
function addSupplier (req, callback){
	
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;
	
	logger.info(ip + " " + TAG + " Entering addSupplier.");
	
	//Log the request.
	logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));

	//Declare the response
	var resJson;
	
	//Validate the request.
	if ( !(	req === null || 
			req.body === null ||
			req.body.companyId === null ||
			req.body.mobile === null 	||
			req.body.email === null 	||
			req.body.companyName === null 	|| 
			req.body.sellerName === null 	|| 
			req.body.city === null 	||
			req.body.state === null 	||
			req.body.pincode === null     ||
			req.body.categories === null     ||
			req.body.companyId === undefined ||
			req.body.mobile === undefined 	||
			req.body.email === undefined 	||
			req.body.companyName === undefined 	||
			req.body.sellerName === undefined 	|| 
			req.body.city === undefined 	||
			req.body.state === undefined 	||
			req.body.pincode === undefined        ||
			req.body.categories === undefined        ||
			req.body.companyId.toString().trim().length === 0 ||
			req.body.mobile.toString().trim().length === 0 	||
			req.body.email.toString().trim().length === 0 	||
			req.body.companyName.toString().trim().length === 0 ||
			req.body.sellerName.toString().trim().length === 0 	|| 
			req.body.city.toString().trim().length === 0 	||
			req.body.state.toString().trim().length === 0 	||
			req.body.pincode.toString().trim().length === 0 ||
			req.body.categories.length === 0 )) {
		
		var companyId = req.body.companyId;
		var mobile = req.body.mobile;
		var email = req.body.email;
		var companyName = req.body.companyName;
		var sellerName =  req.body.sellerName;
		var city = req.body.city;
		var state = req.body.state;
		var pincode = req.body.pincode;
		var categories = req.body.categories;
		
		var colSupplierLeads = db.collection("SellerLead");
		var colBuilder = db.collection("Builder");
		
		colBuilder.findOne({"builderEntity.profileInfo.accountInfo.companyId": companyId}, {"_id": 0, "builderEntity.profileInfo.accountInfo": 1}, function(berr, bresult){
			
		if(!berr && bresult !== null){
		
				var customerIds = [];
				
				customerIds.push(companyId);
				
				//Seller Onboarding Seller Lead Entry data.
				var doc = {
					"sellerLeadEntity":{
						"sellerLeadId" : "",
						"sellerId" : "",
						"companyName" : sellerName,
						"emailId" : email,
						"mobile" : mobile,
						"userId" : "",
						"passwordHash" : "",
						"VAT_TIN" : "",
						"leadSource" : "rfq",
						"customerIds" : customerIds,
						"createdAt" : new Date(),
						"city": city,
						"state": state,
						"categories": categories,
						"sellerVerificationInfo":{
							"termsAccepted": false,
							"termsAcceptedTimeStamp" : "",
							"token" : "",
							"emailVerified" : false,
							"emailVerifiedTimeStamp" : "",
							"OTP" : "",
							"otpVerified" : false,
							"otpVerifiedTimestamp" : ""
						},
						"crmStatus" : "notVerified"
					}	
				  };
					
				var sellerLeadId = "";		
						
				generateSellerLeadId(function(err, result){
					if(!err){		
						
						sellerLeadId = result;
						
						doc.sellerLeadEntity.sellerLeadId = sellerLeadId;
						
						colSupplierLeads.insert(doc, {w:1}, function(err, mresult) {
							if(err){
								resJson = {	
									    "http_code" : "500",
										"message" : "Add supplier failed. Please re-try.."
								};
								logger.error(ip + " " + TAG + " Add supplier failed. Lead" + JSON.stringify(err));
								return callback(false, resJson);
							}else {
								
								var array = {
									"supplierId": sellerLeadId,
									"mobileNumber": mobile,
									"email": email,
									"categories": categories,
									"companyName": sellerName,
									"city": city,
									"state": state,
									"pincode": pincode,
									"favourite": false,
									"hasEnquiryAccess": false
								};
								
								colBuilder.update({"builderEntity.profileInfo.accountInfo.companyId": companyId},
										{$push:{"builderEntity.mySuppliers.suppliersIds":array}},function(err, result){
										if(!err){
											
											var recipients = {
												"primaryEmail": emails.rfqEmailIds[env].supplierSceta
											}
												
											//Notification to SCETA.
											//Getting data of builder from magento, using api.
											array['associatedCompanyName'] = companyName;
		
											rfqNotifications.notifySCETAOnSupplierReference(array, recipients, function(error, result){
												if(error){
													logger.error(TAG + " Error while sending email to SCETA team. error: " + error);
												}
												else{
													logger.debug(TAG + " Successfully sent email to SCETA team.");
												}
											});
											
											//Send the notification to supplier and the API Success.
											resJson = {	
												    "http_code" : "200",
													"message" : "Supplier addition Successful."
											};
											logger.error(ip + " Add Supplier " + TAG + " " + JSON.stringify(resJson));
											return callback(false, resJson);
											
										}else{
											resJson = {	
												    "http_code" : "500",
													"message" : "Unexpected Server Error while Adding the supplier."
											};
											logger.error(ip + " " + TAG + " " + JSON.stringify(err));
											return callback(false, resJson);
									}
								});	
							}
						});
					}else{
						resJson = {	
						    "http_code" : "500",
							"message" : "Generating Seller Lead ID Failed RFQ Seller Lead."
						};
						logger.error(ip + " " + TAG + " Generating Seller Lead ID Failed RFQ Seller Lead. " + JSON.stringify(err));
						return callback(false, resJson);	
					}
				});
			} else if(!berr && bresult === null){
				resJson = {
				    "http_code" : "500",
					"message" : "Inputs doesn't match with our records. Please Retry."
				};
				logger.error(ip + " " + TAG + " Inputs doesn't match with our records. Please Retry. Add Supplier" + JSON.stringify(resJson));
				return callback(true,resJson);
			}else{
				resJson = {	
				    "http_code" : "500",
					"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
				};
				logger.error(ip + " " + TAG + " Add Supplier " + JSON.stringify(err));
				return callback(false,resJson);
			}
		});
} else {
	resJson = {
		    "http_code" : "400",
			"message" : "Bad or ill-formed request.."
	};
	logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
	return callback(false,resJson);
	}
};

//Function to generate Seller Lead id
function generateSellerLeadId(callback){
  var db = dbConfig.mongoDbConn;
  
  	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;

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

//Function for Editing the Project Details.
exports.updateSupplierDetails = 
function updateSupplierDetails (req, callback){
	
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;
	
	logger.info(ip + " " + TAG + " Entering updateSupplierDetails.");
	
	//Log the request.
	logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));

	//Declare the response
	var resJson;
	
	//Validate the request.
	if ( !(	req === null || 
			req.body === null ||
			req.body.companyId === null ||
			req.body.supplierId === null 	||
			req.body.email === null 	||
			req.body.mobile === null 	||
			req.body.sellerName === null 	|| 
			req.body.city === null 	||
			req.body.state === null 	||
			req.body.pincode === null     ||
			req.body.categories === null     ||

			req.body.companyId === undefined ||
			req.body.supplierId === undefined 	||
			req.body.email === undefined 	||
			req.body.mobile === undefined 	||
			req.body.sellerName === undefined 	||
			req.body.city === undefined 	||
			req.body.state === undefined 	||
			req.body.pincode === undefined        ||
			req.body.categories === undefined        ||
			
			req.body.companyId.toString().trim().length === 0 ||
			req.body.supplierId.toString().trim().length === 0 	||
			req.body.email.toString().trim().length === 0 	||
			req.body.mobile.toString().trim().length === 0 	||
			req.body.sellerName.toString().trim().length === 0 ||
			req.body.city.toString().trim().length === 0 	||
			req.body.state.toString().trim().length === 0 	||
			req.body.pincode.toString().trim().length === 0 ||
			req.body.categories.length === 0 )) {
		
		var companyId = req.body.companyId;
		var supplierId = req.body.supplierId;
		var email = req.body.email;
		var mobile = req.body.mobile;
		var sellerName = req.body.sellerName; 
		var city = req.body.city;
		var state = req.body.state;
		var pincode = req.body.pincode;
		var categories = req.body.categories;
		
		var colBuilder = db.collection("Builder");

	colBuilder.findOne({"builderEntity.profileInfo.accountInfo.companyId": companyId},
			{"builderEntity.mySuppliers.suppliersIds":1, "_id":0},function(err, result){
		
	   if(!err && (result !== null)){
		
		var suppliers = result.builderEntity.mySuppliers.suppliersIds;
		
		for(var i=0; i<suppliers.length; i++){
			if(suppliers[i].supplierId === supplierId){
				suppliers[i].email = email;
				suppliers[i].categories = categories;
				suppliers[i].companyName = sellerName;
				suppliers[i].mobileNumber = mobile;
				suppliers[i].city = city,
				suppliers[i].state = state,
				suppliers[i].pincode = pincode
			}
		}
		
		colBuilder.update({"builderEntity.profileInfo.accountInfo.companyId": companyId},
				{$set : {"builderEntity.mySuppliers.suppliersIds":suppliers}},function(err, result) {

			if (!err) {
				
				resJson = {
				    "http_code" : "200",
					"message" : "Supplier Updation Successful."
				};
				logger.debug(ip + " " + TAG + " " + JSON.stringify(resJson));
				return callback(true,resJson);
				
			} else {
				//JSON Structure to be formed for the response object.
				resJson = {	
					    "http_code" : "500",
						"message" : "Supplier Updation Failed. Please Retry."
				};
				logger.error(ip + " " + TAG + " " + JSON.stringify(err));
				return callback(false,resJson);
			}
		});
	   }else if(!err && (result === null)){
			resJson = {
				    "http_code" : "500",
					"message" : "Inputs doesn't match with our records. Please Retry."
			};
			logger.error(ip + " " + TAG + " Inputs doesn't match with our records. Please Retry." + JSON.stringify(resJson));
			return callback(true,resJson);
		}else{
			resJson = {	
				    "http_code" : "500",
					"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
			};
			logger.error(ip + " " + TAG + " " + JSON.stringify(err));
			return callback(false,resJson);
		}
	});  
} else {
	resJson = {
		    "http_code" : "400",
			"message" : "Bad or ill-formed request.."
	};
	logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
	return callback(false,resJson);
	}
};

//Function for Deleting the project.
exports.deleteSupplier = 
function deleteSupplier (req, callback){
	
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;
	
	logger.info(ip + " " + TAG + " Entering Deleting Supplier.");
	
	//Log the request.
	logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));

	//Declare the response
	var resJson;
	
	//Validate the request.
	if ( !(	req === null || 
			req.body === null || 
			req.body.companyId === null  	||
			req.body.supplierId === null 	||
			req.body.companyId === undefined  	|| 
			req.body.supplierId === undefined 	||		
			req.body.companyId.toString().trim().length === 0||	
			req.body.supplierId.toString().trim().length === 0)) {
		
			var companyId = req.body.companyId;
			var supplierId = req.body.supplierId;
		
			var colBuilder = db.collection("Builder");

	colBuilder.findOne({"builderEntity.profileInfo.accountInfo.companyId": companyId},
			{"builderEntity.mySuppliers.suppliersIds": 1},function(err, result){
		
	   if(!err && (result !== null)){ 

		   var supplierIds = result.builderEntity.mySuppliers.suppliersIds;
		   
		   var isDeleted = false;
		   
		   for(var i=0; i<supplierIds.length; i++){
			   if(supplierIds[i].supplierId === supplierId){
				   supplierIds.splice(i,1);
				   isDeleted = true;
				   break;
			   }
		   }
		   
		   if(isDeleted){
			   colBuilder.update({"builderEntity.profileInfo.accountInfo.companyId": companyId},
					   {$set:{"builderEntity.mySuppliers.suppliersIds": supplierIds}},function(err, result){
					
					if(!err){
						resJson = {
							    "http_code" : "200",
								"message" : "Supplier Deletion Successful."
						};
						logger.debug(ip + " " + TAG + " Deleting the Supplier." + JSON.stringify(resJson));
						return callback(false,resJson);
					}else{
						resJson = {
							    "http_code" : "500",
								"message" : "Supplier Deletion Failed. Please Retry."
						};
						logger.debug(ip + " " + TAG + " Deleting the Supplier Failed." + JSON.stringify(resJson));
						return callback(true,resJson);
					}
			   });
		   }else{
			   resJson = {
					    "http_code" : "500",
						"message" : "Inputs Doesn't match with our records. Please Retry."
				};
				logger.debug(ip + " " + TAG + " Deleting the Supplier Failed." + JSON.stringify(resJson));
				return callback(true,resJson);
		   }   
		
	   }else if(!err && (result === null)){
			resJson = {
				    "http_code" : "500",
					"message" : "There is no Supplier with this Data. Please Retry."
			};
			logger.debug(ip + " " + TAG + " Delecting Supplier there is no Supplier with this Data. Please Retry." + JSON.stringify(resJson));
			return callback(true,resJson);
		}else{
			resJson = {	
				    "http_code" : "500",
				    "message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
			};
			logger.error(ip + " " + TAG + " " + JSON.stringify(err));
			return callback(false,resJson);
		}
	});  
} else {
	resJson = {
		    "http_code" : "400",
			"message" : "Bad or ill-formed request.."
	};
	logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
	return callback(false,resJson);
	}
};

//Function for favouriting the Suppliers.
exports.favouriteSupplier = 
function favouriteSupplier (req, callback){
	
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;
	
	logger.info(ip + " " + TAG + " Entering Favourite Supplier.");
	
	//Log the request.
	logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));

	//Declare the response
	var resJson;
	
	//Validate the request.
	if ( !(	req === null || 
			req.body === null || 
			req.body.companyId === null  	|| 
			req.body.supplierId === null 	||
			req.body.favourite === null 	||
			req.body.companyId === undefined  	|| 
			req.body.supplierId === undefined 	||
			req.body.favourite === undefined 	||
			req.body.companyId.toString().trim().length === 0  	|| 
			req.body.supplierId.toString().trim().length === 0  ||
			req.body.favourite.toString().trim().length === 0)) {
		
			var companyId = req.body.companyId;
			var supplierId = req.body.supplierId;
			var fav = req.body.favourite;
			
			if(!(typeof fav === "boolean")){
				resJson = {
					    "http_code" : "400",
						"message" : "Bad or ill-formed request.."
				};
				logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
				return callback(false,resJson);
			}
			var colBuilder = db.collection("Builder");

	colBuilder.findOne({"builderEntity.profileInfo.accountInfo.companyId": companyId},
			{"builderEntity.mySuppliers.suppliersIds": 1},function(err, result){
		
	   if(!err && (result !== null)){ 
		
		   var supplierIds = result.builderEntity.mySuppliers.suppliersIds;
		   
		   var isModified = false;
		   
		   for(var i=0; i<supplierIds.length; i++){
			   if(supplierIds[i].supplierId === supplierId){
				   supplierIds[i].favourite = fav;
				   isModified = true;
				   break;
			   }
		   }
		   
		   if(isModified){
			   colBuilder.update({"builderEntity.profileInfo.accountInfo.companyId": companyId},
					   {$set:{"builderEntity.mySuppliers.suppliersIds": supplierIds}},function(err, result){
					
					if(!err){
						resJson = {
							    "http_code" : "200",
								"message" : "Making favourite or removing from favourite supplier is successful."
						};
						logger.debug(ip + " " + TAG + " favourite the Supplier." + JSON.stringify(resJson));
						return callback(false,resJson);
					}else{
						resJson = {
							    "http_code" : "500",
								"message" : "Supplier favourite Failed. Please Retry."
						};
						logger.debug(ip + " " + TAG + " favourite the Supplier Failed." + JSON.stringify(resJson));
						return callback(true,resJson);
					}
			   });
		   }else{
			   resJson = {
					    "http_code" : "500",
						"message" : "There is no Supplier with this Data. Please Retry."
				};
				logger.debug(ip + " " + TAG + " Favrouting Supplier there is no Supplier with this Data. Please Retry." + JSON.stringify(resJson));
				return callback(true,resJson);
		   }   
		
	   }else if(!err && (result === null)){
			resJson = {
				    "http_code" : "500",
					"message" : "Inputs doesn't match with our records. Please Retry."
			};
			logger.debug(ip + " " + TAG + " Delecting Supplier there is no Supplier with this Data. Please Retry." + JSON.stringify(resJson));
			return callback(true,resJson);
		}else{
			resJson = {	
				    "http_code" : "500",
					"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
			};
			logger.error(ip + " " + TAG + " " + JSON.stringify(err));
			return callback(false,resJson);
		}
	});  
} else {
	resJson = {
		    "http_code" : "400",
			"message" : "Bad or ill-formed request.."
	};
	logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
	return callback(false,resJson);
	}
};

//Function for Fetching the Suppliers.
exports.fetchFavouriteSuppliers = 
function fetchFavouriteSuppliers (req, callback){
	
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;
	
	logger.info(ip + " " + TAG + " Entering Fetch Favourite Suppliers.");
	
	//Log the request.
	logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));

	//Declare the response
	var resJson;
	
	//Validate the request.
	if ( !(	req === null || 
			req.body === null || 
			req.body.companyId === null  	|| 
			req.body.companyId === undefined  	|| 
			req.body.companyId.toString().trim().length === 0)) {

		var companyId = req.body.companyId;
		//var supplierId = req.body.supplierId;
		var colBuilder = db.collection("Builder");
	
	colBuilder.findOne({"builderEntity.profileInfo.accountInfo.companyId":companyId}, function(err, fResult){
		
		if(!err && fResult !== null){
			
				var query = [{$match :{"builderEntity.profileInfo.accountInfo.companyId":companyId}},
		                     {$unwind : "$builderEntity.mySuppliers.suppliersIds"},
		                     {$match  : {"builderEntity.mySuppliers.suppliersIds.favourite":true}},
		                     { $group : {_id: "$builderEntity.mySuppliers.suppliersIds"}}];
				
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
					logger.error(TAG + "itemsPerPage & page parameters in Filters of Suppliers. itemsPerPage: " + req.body.itemsPerPage + " , page: " + req.body.page);
					return callback(true, resJson);
				}
					
			colBuilder.aggregate(query, function(err, result){
				
			   if(!err && (result !== null)){ 
				   
				   result = result.slice(req.body.page * req.body.itemsPerPage);
				   
					resJson = {
						    "http_code" : "200",
							"message" : result
					};
					logger.debug(ip + " " + TAG + " Fetching Suppliers Successful." + JSON.stringify(resJson));
					return callback(false,resJson);
				
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
					return callback(false,resJson);
				}
			});
		}else if(!err && fResult === null){
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
			return callback(false,resJson);
		}
	});
} else {
	resJson = {
		    "http_code" : "400",
			"message" : "Bad or ill-formed request.."
	};
	logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
	return callback(false,resJson);
	}
};

//Function for Manipulating the categories.
function formCategories (callback){
	
	var result = {"http_code":200,"http_message":"Ok,  Success","status":1,"categories":[{"CategoryId":271,"positionNo":30,"CategoryName":"Building Material","ParentCategory":2,"icon_image":"http://www.msupply.com/media/mobile_icons/category_271.png","childCategory":[{"CategoryId":277,"positionNo":1,"CategoryName":"Blocks","ParentCategory":271},{"CategoryId":278,"positionNo":2,"CategoryName":"Bricks","ParentCategory":271},{"CategoryId":279,"positionNo":3,"CategoryName":"Cement","ParentCategory":271},{"CategoryId":280,"positionNo":4,"CategoryName":"Coarse Aggregate and Stones","ParentCategory":271},{"CategoryId":281,"positionNo":5,"CategoryName":"Ready Mix Concrete and Mortar","ParentCategory":271},{"CategoryId":282,"positionNo":6,"CategoryName":"TMT Steel","ParentCategory":271},{"CategoryId":283,"positionNo":7,"CategoryName":"Sand","ParentCategory":271},{"CategoryId":304,"positionNo":8,"CategoryName":"Cinder","ParentCategory":271},{"CategoryId":403,"positionNo":9,"CategoryName":"Consumable","ParentCategory":271},{"CategoryId":404,"positionNo":10,"CategoryName":"Structural Steel","ParentCategory":271,"childCategory":[{"CategoryId":405,"positionNo":1,"CategoryName":"ISA Angle","ParentCategory":404},{"CategoryId":406,"positionNo":2,"CategoryName":"ISMC Channel","ParentCategory":404},{"CategoryId":407,"positionNo":3,"CategoryName":"ISMC Beams","ParentCategory":404},{"CategoryId":408,"positionNo":4,"CategoryName":"MS Rods","ParentCategory":404},{"CategoryId":409,"positionNo":5,"CategoryName":"MS Plates","ParentCategory":404},{"CategoryId":410,"positionNo":6,"CategoryName":"Stud Rods","ParentCategory":404}]}]},{"CategoryId":272,"positionNo":31,"CategoryName":"Electrical","ParentCategory":2,"icon_image":"http://www.msupply.com/media/mobile_icons/category_272.png","childCategory":[{"CategoryId":284,"positionNo":1,"CategoryName":"Cables and Wires","ParentCategory":272},{"CategoryId":285,"positionNo":2,"CategoryName":"Circuit Breakers and Distribution Boards","ParentCategory":272},{"CategoryId":286,"positionNo":3,"CategoryName":"Lights and Bulbs","ParentCategory":272},{"CategoryId":299,"positionNo":4,"CategoryName":"Light Fittings","ParentCategory":272},{"CategoryId":287,"positionNo":5,"CategoryName":"Switches and Accessories","ParentCategory":272},{"CategoryId":297,"positionNo":6,"CategoryName":"Electrical Appliances","ParentCategory":272},{"CategoryId":311,"positionNo":7,"CategoryName":"Electrical Accessories","ParentCategory":272},{"CategoryId":394,"positionNo":8,"CategoryName":"Conduits","ParentCategory":272},{"CategoryId":396,"positionNo":10,"CategoryName":"Power Backup Systems","ParentCategory":272},{"CategoryId":397,"positionNo":11,"CategoryName":"Home Automation","ParentCategory":272}]},{"CategoryId":273,"positionNo":32,"CategoryName":"Plumbing","ParentCategory":2,"icon_image":"http://www.msupply.com/media/mobile_icons/category_273.png","childCategory":[{"CategoryId":288,"positionNo":1,"CategoryName":"Consumables","ParentCategory":273},{"CategoryId":289,"positionNo":2,"CategoryName":"Pipes and Fittings","ParentCategory":273},{"CategoryId":290,"positionNo":3,"CategoryName":"Valves and Accessories","ParentCategory":273},{"CategoryId":291,"positionNo":4,"CategoryName":"Water Tanks","ParentCategory":273},{"CategoryId":324,"positionNo":5,"CategoryName":"Solvent","ParentCategory":273}]},{"CategoryId":305,"positionNo":33,"CategoryName":"Kitchen","ParentCategory":2,"icon_image":"http://www.msupply.com/media/mobile_icons/category_305.png","childCategory":[{"CategoryId":315,"positionNo":1,"CategoryName":"Chimneys & Hobs","ParentCategory":305},{"CategoryId":319,"positionNo":4,"CategoryName":"Kitchen Sinks and Faucets","ParentCategory":305},{"CategoryId":320,"positionNo":5,"CategoryName":"Kitchen Accessories","ParentCategory":305},{"CategoryId":321,"positionNo":6,"CategoryName":"Kitchen Storage","ParentCategory":305},{"CategoryId":323,"positionNo":8,"CategoryName":"Wine Coolers and Cabinets","ParentCategory":305},{"CategoryId":325,"positionNo":9,"CategoryName":"Food Waste Disposer","ParentCategory":305},{"CategoryId":327,"positionNo":10,"CategoryName":"Kitchen Appliances","ParentCategory":305},{"CategoryId":328,"positionNo":11,"CategoryName":"Kitchen Hardware","ParentCategory":305},{"CategoryId":402,"positionNo":12,"CategoryName":"Modular Kitchen","ParentCategory":305}]},{"CategoryId":306,"positionNo":37,"CategoryName":"Tools and Spares","ParentCategory":2,"icon_image":"http://www.msupply.com/media/mobile_icons/category_306.png","childCategory":[{"CategoryId":307,"positionNo":1,"CategoryName":"Plumbing Tools","ParentCategory":306},{"CategoryId":308,"positionNo":2,"CategoryName":"Carpentry Tools","ParentCategory":306},{"CategoryId":309,"positionNo":3,"CategoryName":"Flooring Tools","ParentCategory":306},{"CategoryId":310,"positionNo":4,"CategoryName":"Gardening Tools","ParentCategory":306}]},{"CategoryId":312,"positionNo":38,"CategoryName":"Construction Equipment","ParentCategory":2,"icon_image":"http://www.msupply.com/media/mobile_icons/category_312.png","childCategory":[{"CategoryId":313,"positionNo":1,"CategoryName":"Tools","ParentCategory":312}]},{"CategoryId":314,"positionNo":39,"CategoryName":"Solutions","ParentCategory":2,"icon_image":"http://www.msupply.com/media/mobile_icons/category_314.png","childCategory":[{"CategoryId":318,"positionNo":1,"CategoryName":"Solar Products","ParentCategory":314},{"CategoryId":329,"positionNo":2,"CategoryName":"Water Proofing Products","ParentCategory":314},{"CategoryId":330,"positionNo":3,"CategoryName":"Fire and Safety Products","ParentCategory":314}]},{"CategoryId":332,"positionNo":40,"CategoryName":"Bathroom","ParentCategory":2,"icon_image":"http://www.msupply.com/media/mobile_icons/category_332.png","childCategory":[{"CategoryId":340,"positionNo":1,"CategoryName":"Bathroom Faucets","ParentCategory":332},{"CategoryId":341,"positionNo":2,"CategoryName":"Commodes","ParentCategory":332},{"CategoryId":342,"positionNo":3,"CategoryName":"Wash Basins","ParentCategory":332},{"CategoryId":343,"positionNo":4,"CategoryName":"Showers","ParentCategory":332},{"CategoryId":344,"positionNo":5,"CategoryName":"Wellness","ParentCategory":332},{"CategoryId":345,"positionNo":6,"CategoryName":"Bathroom Accessories","ParentCategory":332}]},{"CategoryId":333,"positionNo":41,"CategoryName":"Walls and Flooring","ParentCategory":2,"icon_image":"http://www.msupply.com/media/mobile_icons/category_333.png","childCategory":[{"CategoryId":346,"positionNo":1,"CategoryName":"Tiles","ParentCategory":333},{"CategoryId":347,"positionNo":2,"CategoryName":"Granite","ParentCategory":333},{"CategoryId":348,"positionNo":3,"CategoryName":"Marble","ParentCategory":333},{"CategoryId":349,"positionNo":4,"CategoryName":"Wooden Flooring","ParentCategory":333},{"CategoryId":351,"positionNo":6,"CategoryName":"Outdoor Flooring","ParentCategory":333}]},{"CategoryId":334,"positionNo":42,"CategoryName":"Carpentry","ParentCategory":2,"icon_image":"http://www.msupply.com/media/mobile_icons/category_334.png","childCategory":[{"CategoryId":353,"positionNo":1,"CategoryName":"Plywood","ParentCategory":334},{"CategoryId":354,"positionNo":2,"CategoryName":"MDF Board","ParentCategory":334},{"CategoryId":355,"positionNo":3,"CategoryName":"Blockboard","ParentCategory":334},{"CategoryId":357,"positionNo":5,"CategoryName":"Laminate","ParentCategory":334},{"CategoryId":358,"positionNo":6,"CategoryName":"Veneer","ParentCategory":334},{"CategoryId":362,"positionNo":10,"CategoryName":"Adhesive","ParentCategory":334}]},{"CategoryId":335,"positionNo":43,"CategoryName":"Doors and Windows","ParentCategory":2,"icon_image":"http://www.msupply.com/media/mobile_icons/category_335.png","childCategory":[{"CategoryId":363,"positionNo":1,"CategoryName":"Flush Door","ParentCategory":335},{"CategoryId":364,"positionNo":2,"CategoryName":"Skin Door","ParentCategory":335},{"CategoryId":365,"positionNo":3,"CategoryName":"Membrane Door","ParentCategory":335},{"CategoryId":366,"positionNo":4,"CategoryName":"Micro Coated Door","ParentCategory":335},{"CategoryId":368,"positionNo":6,"CategoryName":"Solid Wood Door","ParentCategory":335},{"CategoryId":369,"positionNo":7,"CategoryName":"UPVC Products","ParentCategory":335},{"CategoryId":370,"positionNo":8,"CategoryName":"Window Blinds","ParentCategory":335},{"CategoryId":399,"positionNo":10,"CategoryName":"Veneer Door","ParentCategory":335}]},{"CategoryId":336,"positionNo":44,"CategoryName":"Hardware","ParentCategory":2,"icon_image":"http://www.msupply.com/media/mobile_icons/category_336.png","childCategory":[{"CategoryId":372,"positionNo":1,"CategoryName":"Fittings","ParentCategory":336},{"CategoryId":373,"positionNo":2,"CategoryName":"Accessories","ParentCategory":336},{"CategoryId":374,"positionNo":3,"CategoryName":"Sliding Solutions","ParentCategory":336},{"CategoryId":375,"positionNo":4,"CategoryName":"Locks","ParentCategory":336},{"CategoryId":376,"positionNo":5,"CategoryName":"Consumables","ParentCategory":336},{"CategoryId":411,"positionNo":6,"CategoryName":"Curtain Fittings","ParentCategory":336}]},{"CategoryId":337,"positionNo":45,"CategoryName":"Paints","ParentCategory":2,"icon_image":"http://www.msupply.com/media/mobile_icons/category_337.png","childCategory":[{"CategoryId":377,"positionNo":1,"CategoryName":"Wall Putty","ParentCategory":337},{"CategoryId":378,"positionNo":2,"CategoryName":"Stainers","ParentCategory":337},{"CategoryId":379,"positionNo":3,"CategoryName":"Wood Finishes","ParentCategory":337},{"CategoryId":380,"positionNo":4,"CategoryName":"Emulsion","ParentCategory":337},{"CategoryId":381,"positionNo":5,"CategoryName":"Primer","ParentCategory":337},{"CategoryId":382,"positionNo":6,"CategoryName":"Enamel","ParentCategory":337},{"CategoryId":383,"positionNo":7,"CategoryName":"Distemper","ParentCategory":337},{"CategoryId":384,"positionNo":8,"CategoryName":"Fillers","ParentCategory":337},{"CategoryId":385,"positionNo":9,"CategoryName":"Melamyne","ParentCategory":337},{"CategoryId":386,"positionNo":10,"CategoryName":"Painting Consumables","ParentCategory":337},{"CategoryId":387,"positionNo":11,"CategoryName":"Painting Accessories","ParentCategory":337}]},{"CategoryId":338,"positionNo":46,"CategoryName":"Garden","ParentCategory":2,"icon_image":"http://www.msupply.com/media/mobile_icons/category_338.png","childCategory":[{"CategoryId":389,"positionNo":2,"CategoryName":"Pots and Planters","ParentCategory":338}]},{"CategoryId":339,"positionNo":47,"CategoryName":"Roofing","ParentCategory":2,"icon_image":"http://www.msupply.com/media/mobile_icons/category_339.png","childCategory":[{"CategoryId":392,"positionNo":1,"CategoryName":"Clay Roofing","ParentCategory":339}]}]};

	var categories = [];
	var subCategories = [];
	var emptyCategory;
	
	if(result !== null){
		var catgry = result.categories;
		
		for(var i=0; i<catgry.length; i++){
			emptyCategory = {"mainCategory":"", "subCategories":[]};
			for(var j=0; j<catgry[i].childCategory.length; j++){
				subCategories.push(catgry[i].childCategory[j].CategoryName);
			}
			emptyCategory.mainCategory = catgry[i].CategoryName;
			emptyCategory.subCategories = subCategories;
			categories.push(emptyCategory);
			subCategories = [];
		}
	}
	return callback(categories);
};


//Function for Fetching the Suppliers.
exports.fetchSuppliers = 
function fetchSuppliers (req, callback){
	
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;
	
	logger.info(ip + " " + TAG + " Entering Fetch Suppliers.");
	
	//Log the request.
	logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));

	//Declare the response
	var resJson;
	
	//Validate the request.
	if ( !(	req === null || 
			req.body === null || 
			req.body.companyId === null  	|| 
			req.body.companyId === undefined  	|| 
			req.body.companyId.toString().trim().length === 0)) {	

		var colBuilder = db.collection("Builder");
		//var companyIds = fetchCompanyIds.getCompanyIds(req.body.customerSession);
		
		colBuilder.find({"builderEntity.profileInfo.accountInfo.companyId": parseInt(req.body.companyId)}).toArray(function(err, fResult){ 
			
		if(err === null && fResult.length > 0){

			var query = [
		             	{$match :{"builderEntity.profileInfo.accountInfo.companyId": parseInt(req.body.companyId)}},
		             	{$unwind :"$builderEntity.mySuppliers.suppliersIds"}
					];
			
			if(req.body.textSearch !== undefined){
				
				var textSearch = req.body.textSearch;
				if(textSearch !== null){
					query.push({$match:{$or:[{"builderEntity.mySuppliers.suppliersIds.companyName":{$regex: new RegExp(textSearch,'i')}},{"builderEntity.mySuppliers.suppliersIds.mobileNumber":{$regex: new RegExp(textSearch)}}]}});
				}
			}
			
			if(req.body.city !== undefined){
				var city = req.body.city;
				
				if(city.length >= 0){
					query.push({$match :{"builderEntity.mySuppliers.suppliersIds.city":{"$in":city}}});
				}
			}
			
			query.push({$unwind :"$builderEntity.mySuppliers.suppliersIds.categories"});
			
			if(req.body.mainCategory !== undefined && req.body.subCategories !== undefined){
				
				var mainCategory = req.body.mainCategory;
				var subCategories = req.body.subCategories;
				
				//Query is built with the category and sub-category if the filter input exists.
				if(mainCategory.length >= 0 && subCategories.length >= 0){
					query.push({$match :{"builderEntity.mySuppliers.suppliersIds.categories.mainCategory":{"$in":mainCategory},"builderEntity.mySuppliers.suppliersIds.categories.subCategories":{"$in":subCategories}}});
				}
			}
			
			query.push({ $group: {_id: "$builderEntity.mySuppliers.suppliersIds.supplierId",  
				  categories: {$push : "$builderEntity.mySuppliers.suppliersIds.categories"},
				  supplierId:{$first : "$builderEntity.mySuppliers.suppliersIds.supplierId"},
				  email:{$first : "$builderEntity.mySuppliers.suppliersIds.email"},
				  mobileNumber:{$first : "$builderEntity.mySuppliers.suppliersIds.mobileNumber"},
				  city:{$first : "$builderEntity.mySuppliers.suppliersIds.city"},
				  state:{$first : "$builderEntity.mySuppliers.suppliersIds.state"},
				  pincode:{$first : "$builderEntity.mySuppliers.suppliersIds.pincode"},
				  favourite:{$first : "$builderEntity.mySuppliers.suppliersIds.favourite"},
				  hasEnquiryAccess:{$first : "$builderEntity.mySuppliers.suppliersIds.hasEnquiryAccess"},
				  companyName:{$first : "$builderEntity.mySuppliers.suppliersIds.companyName"},
				  companyId:{$first : "$builderEntity.profileInfo.accountInfo.companyId"}}});
			
			
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
				logger.error(TAG + "itemsPerPage & page parameters in Filters of Suppliers. itemsPerPage: " + req.body.itemsPerPage + " , page: " + req.body.page);
				return callback(true, resJson);
			}
			
			colBuilder.aggregate(query,function(err, result){
				
			   if(!err && (result !== null)){ 
				    
				    result = result.slice(req.body.page * req.body.itemsPerPage);
				   
					resJson = {
						    "http_code" : "200",
							"message" : result
					};
					logger.debug(ip + " " + TAG + " Fetching Suppliers Successful." + JSON.stringify(resJson));
					return callback(false,resJson);
				
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
					return callback(false,resJson);
				}
			});
		}else if(err === null && fResult.length === 0){
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
			return callback(false,resJson);
		}
	});
}
else {
	resJson = {
		    "http_code" : "400",
			"message" : "Bad or ill-formed request.."
	};
	logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
	return callback(false,resJson);
	}
}

//Function for Fetching the Suppliers.
exports.fetchSuppliersForInquiry = 
function fetchSuppliersForInquiry (req, callback){
	
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;
	
	logger.info(ip + " " + TAG + " Entering Fetch Suppliers for Inquiry.");
	
	//Log the request.
	logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));

	//Declare the response
	var resJson;
	
	//Validate the request.
	if ( !(	req === null || 
			req.body === null || 
			req.body.companyId === null  	|| 
			req.body.companyId === undefined  	|| 
			req.body.companyId.toString().trim().length === 0)) {
		
	var companyId = req.body.companyId;
	var colBuilder = db.collection("Builder");
	
	colBuilder.findOne({"builderEntity.profileInfo.accountInfo.companyId": companyId}, function(err, fResult){
		
	if(!err && fResult !== null){
		var query = [
	             	{$match :{"builderEntity.profileInfo.accountInfo.companyId": companyId}},
	             	{$unwind :"$builderEntity.mySuppliers.suppliersIds"}
				];
		
		if(req.body.mainCategory !== undefined && req.body.subCategories !== undefined){
			
			var mainCategory = req.body.mainCategory;
			var subCategories = req.body.subCategories;
			
			//Query is built with the category and sub-category if the filter input exists.
			if(mainCategory.length >= 0 && subCategories.length >= 0){
				query.push({$unwind :"$builderEntity.mySuppliers.suppliersIds.categories"});
				query.push({$match :{"builderEntity.mySuppliers.suppliersIds.categories.mainCategory":{"$in":mainCategory}}});
				query.push({$unwind :"$builderEntity.mySuppliers.suppliersIds.categories.subCategories"})
		        query.push({$match :{"builderEntity.mySuppliers.suppliersIds.categories.subCategories":{"$in":subCategories}}})
			}
		}
		
		query.push({ $group: {_id: "$builderEntity.mySuppliers.suppliersIds.categories.subCategories",
	          supplierDetails: {$addToSet: "$builderEntity.mySuppliers.suppliersIds"}}});
		
		
		/*if (req.body.itemsPerPage != null && req.body.page != null && !isNaN(parseInt(req.body.itemsPerPage)) && !isNaN(parseInt(req.body.page))) 
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
			logger.error(TAG + "itemsPerPage & page parameters in Filters of Suppliers. itemsPerPage: " + req.body.itemsPerPage + " , page: " + req.body.page);
			return callback(true, resJson);
		}*/
		
		colBuilder.aggregate(query,function(err, result){
			
		   if(!err && (result !== null)){ 

			   resJson = {
					    "http_code" : "200",
						"message" : result
				};
				logger.debug(ip + " " + TAG + " Fetching Suppliers for Inquiry Successful." + JSON.stringify(resJson));
				return callback(false,resJson);
			
		   }else if(!err && (result === null)){
				resJson = {
					    "http_code" : "500",
						"message" : "Inputs Doesn't match with our records. Please Retry."
				};
				logger.debug(ip + " " + TAG + "Inputs Doesn't match with our records in Fetching Suppliers for Inquiry. Please Retry." + JSON.stringify(resJson));
				return callback(true,resJson);
			}else{
				resJson = {	
					    "http_code" : "500",
						"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
				};
				logger.error(ip + " " + TAG + " Fetching Suppliers for Inquiry Failed. Unexpected Server Error." + JSON.stringify(err));
				return callback(false,resJson);
			}
		});
	}else if(!err && fResult === null){
		resJson = {
			    "http_code" : "500",
				"message" : "Inputs Doesn't match with our records. Please Retry."
		};
		logger.debug(ip + " " + TAG + "Inputs Doesn't match with our records in Fetching Suppliers for Inquiry. Please Retry." + JSON.stringify(resJson));
		return callback(true,resJson);
	}else{
		resJson = {	
			    "http_code" : "500",
				"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
		};
		logger.error(ip + " " + TAG + " in Fetching Suppliers for Inquiry.Unexpected Server Error while fulfilling the request Please Retry. " + JSON.stringify(err));
		return callback(false,resJson);
	}
});
} else {
	resJson = {
		    "http_code" : "400",
			"message" : "Bad or ill-formed request.."
	};
	logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
	return callback(false,resJson);
	}
};
