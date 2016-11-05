var TAG = "sellerProfile.js";

var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var s3 = require('../../Environment/s3configuration.js');
var moment = require('moment');
var s3Upload = require('../businesstobuilder/s3Upload.js');
var path = require('path');
var fileOperations = require('../businesstobuilder/utility/FileOperations.js');
var supplierCrm = require('../crm/supplierCrm');
//Function for Financial Information.
exports.addFinancialInfo =
function addFinancialInfo (req, callback){
	
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;

	//Variable for Mongo DB Connection.
	var db = dbConfig.mongoDbConn;

	//Variable for Logging the messages to the file.
	var logger = log.logger_seller;

	logger.info(ip + " " + TAG + " Entering seller onboarding Profile.");

	//Log the request.
	logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));
	
	//Declare the response
	var resJson;
	
	//Picking the seller id from session.
	var sellerIdSession = req.body.supplierSession.sellerEntity.profileInfo.accountInfo.sellerId;
	
	//Validate the request.
	if ( !(	req === null || 
			req.body === null ||
			sellerIdSession === null ||
			req.body.state === null ||
			req.body.VAT === null 	||
			req.body.PAN === null 	|| 
			req.body.accountHolderName === null 	||
			req.body.accountNumber === null 	||
			req.body.IFSCCode === null     ||
			req.body.accountType === null     ||
			req.body.state === undefined ||
			req.body.VAT === undefined 	||
			req.body.PAN === undefined 	||
			req.body.accountHolderName === undefined 	||
			req.body.accountNumber === undefined 	||
			req.body.IFSCCode === undefined	||
			req.body.accountType === undefined	||
			sellerIdSession.toString().trim().length === 0 ||
			req.body.state.toString().trim().length === 0 ||
			req.body.VAT.toString().trim().length === 0 	||
			req.body.PAN.toString().trim().length === 0 	||
			req.body.accountHolderName.toString().trim().length === 0 	||
			req.body.accountNumber.toString().trim().length === 0 	||
			req.body.IFSCCode.toString().trim().length === 0 ||
			req.body.accountType.toString().trim().length === 0 )) {
		
		var sellerId = sellerIdSession;
		var state = req.body.state;
		var VAT = req.body.VAT;
		var PAN = req.body.PAN;
		var CST = "";
		var accountHolderName = req.body.accountHolderName;
		var accountNumber = req.body.accountNumber;
		var IFSCCode = req.body.IFSCCode;
		var accountType = req.body.accountType;
		
		var vatFile = "";
		var panFile = "";
		var cstFile = "";
		var chequeFile = "";
		
		var paymentTerms = "";
		var paymentModes = "";
		var creditPeriod = "";
		var creditLimit = "";
		var creditTermsProvided = false;

		if(req.body.CST !== undefined && req.body.CST !== null &&
				   req.body.CST.length !== 0){

			CST = req.body.CST;
		}
		
		if(req.body.paymentTerms !== undefined && req.body.paymentTerms !== null &&
				   req.body.paymentTerms.length !== 0){

			paymentTerms = req.body.paymentTerms;
		}
		
		if(req.body.paymentModes !== undefined && req.body.paymentModes !== null &&
				   req.body.paymentModes.toString().trim().length !== 0){

			paymentModes = req.body.paymentModes;
		}
				
		if(req.body.creditTermsProvided !== undefined && req.body.creditTermsProvided !== null &&
				req.body.creditTermsProvided.length !== 0){

			creditTermsProvided = JSON.parse(req.body.creditTermsProvided);
			
			if(creditTermsProvided){
				creditPeriod = req.body.creditPeriod;
				creditLimit = req.body.creditLimit;
			}
		}
		
		var colSeller = db.collection("SellerMaster");
		
		colSeller.findOne({"sellerEntity.profileInfo.accountInfo.sellerId": sellerId}, 
				{"_id":0, "sellerEntity.profileInfo.financialInfo" : 1}, function(err, result){
			
			if(!err && result!== null){
				
				var docFinancialInfo = {
					"taxInfo": {
						"state": state,
						"VAT_TIN": result.sellerEntity.profileInfo.financialInfo.taxInfo.VAT_TIN,
						"VATDocumentURL": result.sellerEntity.profileInfo.financialInfo.taxInfo.VATDocumentURL,
						"PAN": PAN,
						"PANDocumentURL": result.sellerEntity.profileInfo.financialInfo.taxInfo.PANDocumentURL,
						"CST": CST,
						"CSTDocumentURL": result.sellerEntity.profileInfo.financialInfo.taxInfo.CSTDocumentURL
					},
					"bankInfo": {
						"accountHolderName": accountHolderName,
						"accountNumber": accountNumber,
						"IFSCCode": IFSCCode,
						"accountType": accountType,
						"cancelledChequeDoucmentURL": result.sellerEntity.profileInfo.financialInfo.bankInfo.cancelledChequeDoucmentURL
					},
					"paymentAndCreditInfo": {
						"paymentTerms": paymentTerms,
						"paymentModes": paymentModes,
						"creditTermsProvided": creditTermsProvided,
						"creditPeriod": creditPeriod,
						"creditLimit": creditLimit
					}
				};
				
				var filesToUpload = [];
				
				if(req.files !== undefined){
					
					var todaysDate = moment().format("DD-MM-YYYY");
						
					if(req.files.vatfile !== undefined && req.files.vatfile.size !== 0){
						
						var extName = path.extname(req.files.vatfile.name);
                        var uploadedFileName = path.basename(req.files.vatfile.name, extName);
						
						var fileName = uploadedFileName + "_" + todaysDate + extName;
						

						var pathToUpload = "/"+ s3.BUCKET_NAME_Seller + "/seller - " + sellerId + "/" + "Financial Documents";
						
						filesToUpload.push({
						   "typeOfFile": "vatfile",
						   "pathToUpload": pathToUpload,
						   "acl": "public-read",
						   "filePath": req.files.vatfile.path,
						   "fileName": fileName
						});
						
					}
					
					if(req.files.panfile !== undefined && req.files.panfile.size !== 0){
						
						var extName = path.extname(req.files.panfile.name);
                        var uploadedFileName = path.basename(req.files.panfile.name, extName);
						
						var fileName = uploadedFileName + "_" + todaysDate + extName;
						
						var pathToUpload = "/"+ s3.BUCKET_NAME_Seller + "/seller - " + sellerId + "/" + "Financial Documents";
						
						filesToUpload.push({
						   "typeOfFile": "panfile",
						   "pathToUpload": pathToUpload,
						   "acl": "public-read",
						   "filePath": req.files.panfile.path,
						   "fileName": fileName
						});
						
					}
					
					if(req.files.cstfile !== undefined && req.files.cstfile.size !== 0){
						
						var extName = path.extname(req.files.cstfile.name);
                        var uploadedFileName = path.basename(req.files.cstfile.name, extName);

						var fileName = uploadedFileName + "_" + todaysDate + extName;
						
						var pathToUpload = "/"+ s3.BUCKET_NAME_Seller + "/seller - " + sellerId + "/" + "Financial Documents";
						
						filesToUpload.push({
						   "typeOfFile": "cstfile",
						   "pathToUpload": pathToUpload,
						   "acl": "public-read",
						   "filePath": req.files.cstfile.path,
						   "fileName": fileName
						});
						
					}
					
					if(req.files.chequefile !== undefined && req.files.chequefile.size !== 0){
						
						var extName = path.extname(req.files.chequefile.name);
                        var uploadedFileName = path.basename(req.files.chequefile.name, extName);
						
						var fileName = uploadedFileName + "_" + todaysDate + extName;
						
						var pathToUpload = "/"+ s3.BUCKET_NAME_Seller + "/seller - " + sellerId + "/" + "Financial Documents";
						
						filesToUpload.push({
						   "typeOfFile": "chequefile",
						   "pathToUpload": pathToUpload,
						   "acl": "public-read",
						   "filePath": req.files.chequefile.path,
						   "fileName": fileName
						});
						
					}
					
					if(filesToUpload.length > 0){
					
						s3Upload.intializeS3(filesToUpload, function(err, result){
							if(!err){
								
								for(var i = 0; i < result.message.length; i++){
									if(result.message[i].typeOfFile === "vatfile"){
										vatFile = result.message[i].url;
										docFinancialInfo.taxInfo.VATDocumentURL = vatFile;
									}
									else if(result.message[i].typeOfFile === "panfile"){
										panFile = result.message[i].url;
										docFinancialInfo.taxInfo.PANDocumentURL = panFile;
									}
									else if(result.message[i].typeOfFile === "cstfile"){
										cstFile = result.message[i].url;
										docFinancialInfo.taxInfo.CSTDocumentURL = cstFile;
									}
									else if(result.message[i].typeOfFile === "chequefile"){
										chequeFile = result.message[i].url;
										docFinancialInfo.bankInfo.cancelledChequeDoucmentURL = chequeFile;
									}
								}
								
								updateFinancialInfo(sellerId, docFinancialInfo, function(uerr, uresult){
									
									if(!uerr){
										
										var resJson = {
						        			"http_code" : "200",
						        			"message" : "Insert or update of financial info successful."
								        }
										logger.debug(TAG + " Insert or update of financial info successful. with s3" + JSON.stringify(resJson));
							        	callback(true, resJson);
										
									}else{
										var resJson = {
						        			"http_code" : "500",
						        			"message" : "Unexpected Server Error while fulfilling the request. Please retry."
							        	}
										logger.error(TAG + " s3 upload done but update to DB failed." + JSON.stringify(resJson));
							        	callback(true, resJson);
									}
									
								});
								
							}else{
								var resJson = {
					        			"http_code" : "500",
					        			"message" : "Upload of the file to s3 Failed."
					        		}
								logger.error(TAG + " s3 upload is failed while uploading Financial docs Seller Onboarding." + JSON.stringify(resJson));
					        	callback(true, resJson);
							}
						});
					}else{
						
						updateFinancialInfo(sellerId, docFinancialInfo, function(uerr, uresult){
							
							if(!uerr){
								
								var resJson = {
					        			"http_code" : "200",
					        			"message" : "Insert or update of financial info successful."
							    }
								logger.debug(TAG + " Insert or update of financial info successful. without s3" + JSON.stringify(resJson));
						        callback(false, resJson);
								
							}else{
								var resJson = {
				        			"http_code" : "500",
				        			"message" : "Unexpected Server Error while fulfilling the request. Please retry."
						        }
								logger.error(TAG + " update to the DB failed." + JSON.stringify(resJson));
					        	callback(true, resJson);
							}
						});
						
					}	
				}else{
					
					updateFinancialInfo(sellerId, docFinancialInfo, function(uerr, uresult){
						
						if(!uerr){
							
							var resJson = {
				        			"http_code" : "200",
				        			"message" : "Insert or update of financial info successful."
						    }
							logger.debug(TAG + " Insert or update of financial info successful. without s3" + JSON.stringify(resJson));
					        callback(false, resJson);
							
						}else{
							var resJson = {
			        			"http_code" : "500",
			        			"message" : "Unexpected Server Error while fulfilling the request. Please retry."
					        }
							logger.error(TAG + " update to the DB failed." + JSON.stringify(resJson));
				        	callback(true, resJson);
						}
					});
				}	
			}else if(!err && result === null){
				resJson = {
				    "http_code" : "500",
					"message" : "Inputs doen't match with our records."
				};
			    logger.error(ip + " " +TAG + " No matching seller for updating the financial info " + JSON.stringify(err));
			    return callback(true, resJson);
			}else{
				resJson = {
				    "http_code" : "500",
					"message" : "Unexpected Server Error while fulfilling the request. Please retry."
				};
			    logger.error(ip + " " +TAG + " Error for seller while updating the financial info " + JSON.stringify(err));
			    return callback(true, resJson);
			}		
		});
	}else {
		resJson = {
			    "http_code" : "400",
				"message" : "Bad or ill-formed request.."
		};
		logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
		return callback(true, resJson);
	}
}

function updateFinancialInfo(sellerId, financialInfo, callback){
	
	//Variable for Mongo DB Connection.
	var db = dbConfig.mongoDbConn;

	//Variable for Logging the messages to the file.
	var logger = log.logger_seller;

	logger.info(TAG + " Entering update financial info function.");

	colSeller = db.collection("SellerMaster");
	
	colSeller.update({"sellerEntity.profileInfo.accountInfo.sellerId": sellerId},
			{$set:{"sellerEntity.profileInfo.financialInfo": financialInfo}}, function(err, result){
		
		if(!err){
			return callback(false, result);
		}else{
			logger.error(TAG + " Error for seller while updating the financial info in update financial info." + JSON.stringify(err));
		    return callback(true, "Error while updating the Seller Financial Info");
		}
		
	});
}

//Function for Inquiry and Category Information.
exports.addEnquiryAndCategoryInfo =
function addEnquiryAndCategoryInfo (req, callback){
	
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;

	//Variable for Mongo DB Connection.
	var db = dbConfig.mongoDbConn;

	//Variable for Logging the messages to the file.
	var logger = log.logger_seller;

	logger.info(ip + " " + TAG + " Entering Enquiry and Category Info Profile.");

	//Log the request.
	logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));

	//Declare the response
	var resJson;
	
	//Picking the seller id from session.
	var sellerIdSession = req.body.supplierSession.sellerEntity.profileInfo.accountInfo.sellerId;
	
	//Validate the request.
	if ( !(	req === null || 
			req.body === null ||
			sellerIdSession === null ||
			req.body.minimumEnquiryValue === null ||
			req.body.maxEnquiryValue === null 	|| 
			req.body.PANIndia === null 	||
			req.body.categories === null     ||
			req.body.minimumEnquiryValue === undefined ||
			req.body.maxEnquiryValue === undefined 	||
			req.body.PANIndia === undefined 	||
			req.body.categories === undefined	||
			sellerIdSession.toString().trim().length === 0 ||
			req.body.minimumEnquiryValue.toString().trim().length === 0 ||
			req.body.maxEnquiryValue.toString().trim().length === 0 	||
			req.body.PANIndia.toString().trim().length === 0 	||
			req.body.categories.length === 0 )) {
		
		var sellerId = sellerIdSession;
		var minimumEnquiryValue = req.body.minimumEnquiryValue;
		var maxEnquiryValue = req.body.maxEnquiryValue;
		var leadTime = req.body.leadTime;
		var PANIndia = req.body.PANIndia;
		var categories = req.body.categories;
		
		var stateAndCity = "";
		
		if(!PANIndia){

			if(req.body.stateAndCity !== null && 
				req.body.stateAndCity !== undefined && req.body.stateAndCity.length !== 0){
				
				stateAndCity = req.body.stateAndCity;
				
			}else{
				var resJson = {
        			"http_code" : "500",
        			"message" : "There should be atleast one input for the PANIndia or State and City."
		        }
				logger.error(TAG + " There should be atleast one input for the PANIndia or State and City." + JSON.stringify(resJson));
				return callback(true, resJson);
			}
		}	
		
		var leadTime = "";
		
		if(req.body.leadTime !== null && req.body.leadTime !== undefined 
				&& req.body.leadTime.toString().trim().length !== 0){
			
			leadTime = req.body.leadTime;
			
		}
		
		var docEnquiryAndCategoryInfo = {
			"minimumEnquiryValue": minimumEnquiryValue,
			"maxEnquiryValue": maxEnquiryValue,
			"leadTime": leadTime,
			"PANIndia": PANIndia,
			"stateAndCity": stateAndCity,
			"categories": categories
		};
		
		var colSeller = db.collection("SellerMaster");
		
		colSeller.findOne({"sellerEntity.profileInfo.accountInfo.sellerId": sellerId}, 
				{"_id":0}, function(err, result){
			
			if(!err && result!== null){
				
				colSeller.update({"sellerEntity.profileInfo.accountInfo.sellerId": sellerId},
						{$set:{"sellerEntity.profileInfo.enquiryAndCategoryInfo": docEnquiryAndCategoryInfo}}, function(uerr, uresult){
						
						if(!uerr){
							
							var resJson = {
			        			"http_code" : "200",
			        			"message" : "Insert or update of Enquiry and Category Info Successful."
						    }
							logger.debug(TAG + " Insert or update of Enquiry and Category Info Successful." + JSON.stringify(resJson));
							return callback(false, resJson);
							
						}else{
							
							var resJson = {
			        			"http_code" : "500",
			        			"message" : "Insert or update of Enquiry and Category Info Failed."
						    }
							logger.error(TAG + " Insert or update of Enquiry and Category Info Failed." + JSON.stringify(resJson));
							return callback(true, resJson);
							
						}	
				});
			}else if(!err && result === null){
				resJson = {
				    "http_code" : "500",
					"message" : "Inputs doen't match with our records."
				};
			    logger.error(ip + " " +TAG + " No matching seller for updating the Enquiry and Category info " + JSON.stringify(err));
			    return callback(true, resJson);
			}else{
				resJson = {
				    "http_code" : "500",
					"message" : "Unexpected Server Error while fulfilling the request. Please retry."
				};
			    logger.error(ip + " " +TAG + " Error for seller while updating the Enquiry and category info " + JSON.stringify(err));
			    return callback(true, resJson);
			}		
		});
	}else {
		resJson = {
			    "http_code" : "400",
				"message" : "Bad or ill-formed request.."
		};
		logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
		return callback(true, resJson);
	}
}

//Function for update the basic details of sellers.
exports.updateSellerDetails =
function (req, callback){
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;

	//Variable for Mongo DB Connection.
	var db = dbConfig.mongoDbConn;

	//Variable for Logging the messages to the file.
	var logger = log.logger_seller;

	logger.info(ip + " " + TAG + " Entering seller Basic Info Service.");

	//Log the request.
	logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));
	
	//Declare the response
	var resJson;	
	//Picking the seller id from session.
	var sellerIdSession = req.body.supplierSession.sellerEntity.profileInfo.accountInfo.sellerId;
	
	//Validate the request.
	if ( !(	req === null || 
			req.body === null ||
			sellerIdSession === null ||
			req.body.mobile === null 	||
			req.body.email === null 	|| 
			req.body.companyName === null 	||
			sellerIdSession.toString().trim().length === 0 ||
			req.body.mobile.toString().trim().length === 0 	||
			req.body.email.toString().trim().length === 0 	||
			req.body.companyName.toString().trim().length === 0  ||
			req.body.wareHouseAddress.length === 0 ||
			req.body.invoiceAddress.length === 0 )) {			
			
			var sellerId = sellerIdSession;
			var companyName = req.body.companyName;
			var mobile = req.body.mobile;
			var emailId = req.body.email;

		    var sellerLeadId;
		    var profileImageFile = "";
		    var companyImageFile = "";
		    //Declaring Collection Name
		    var colSellerMaster = db.collection("SellerMaster");
 			
	 colSellerMaster.findOne({ "sellerEntity.profileInfo.accountInfo.sellerId" : sellerId }, 
			 {"_id" : 0, "sellerEntity.profileInfo.basicInfo" : 1, "sellerEntity.profileInfo.accountInfo" : 1 }, 
	 	function(verr, vresult){	 	
		 if(!verr && vresult === null){
		    resJson = {
				    "http_code" : "500",
					"message" : "Seller ID not found"
				};
				logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
				return callback(false, resJson);
		 }else{
		 	//creating Address id for WareHouse Address..
		 	var wareHouseAddress = req.body.wareHouseAddress;
		 	for(i = 0; i < wareHouseAddress.length; i++){
		 		wareHouseAddress[i].addressId = (i + 1);
		 	}
		 	//creating Address id for Invoice Address..
		 	var invoiceAddress = req.body.invoiceAddress;
		 	for(j = 0; j < invoiceAddress.length; j++){
		 		invoiceAddress[j].addressId = (j + 1);
		 	}
		 	// CRM ID to upload /update
		 	var crmId = vresult.sellerEntity.profileInfo.accountInfo.crmId;
		 	// Creating Basic info block..
		 	var basicInfo = {
			 	"email" : vresult.sellerEntity.profileInfo.basicInfo.email,	 	
				"mobile" : req.body.mobile,
				"contactPerson" : req.body.contactPerson,
				"title" : req.body.title,
				"telephoneNumber" : req.body.telephoneNumber,
				"profileImageURL" : vresult.sellerEntity.profileInfo.basicInfo.profileImageURL,
				"companyInfo" : {
					"companyName" : vresult.sellerEntity.profileInfo.basicInfo.companyInfo.companyName,
					"displayName" : req.body.displayName,
					"businessType" : req.body.businessType,
					"establishment" : req.body.establishment,
					"faxNo" : req.body.faxNo,
					"companyImageURL" : vresult.sellerEntity.profileInfo.basicInfo.companyInfo.companyImageURL,
					"websiteURL" : req.body.websiteURL,
					"wareHouseAddress" : wareHouseAddress,
					"invoiceAddress" : invoiceAddress
					}
				};				
				// Empty Array to Get Details
				var filesToUpload = [];
				// Check the input file exist
				if(req.files !== undefined){					
					var todaysDate = moment().format("DD-MM-YYYY");
					// Profile Image						
					if(req.files.profileImage !== undefined && req.files.profileImage.size !== 0){
						
						var extName = path.extname(req.files.profileImage.name);
                        var uploadedFileName = path.basename(req.files.profileImage.name, extName);
						
						var fileName = uploadedFileName + "_" + todaysDate + extName;
						var pathToUpload = "/"+ s3.BUCKET_NAME_Seller + "/seller - " + sellerId + "/" + "Profile Documents";
						filesToUpload.push({
						   "typeOfFile": "profileImage",
						   "pathToUpload": pathToUpload,
						   "acl": "public-read",
						   "filePath": req.files.profileImage.path,
						   "fileName": fileName
						});
						
					}
					if(req.files.companyImage !== undefined && req.files.companyImage.size !== 0){
						
						var extName = path.extname(req.files.companyImage.name);
                        var uploadedFileName = path.basename(req.files.companyImage.name, extName);
						
						var fileName = uploadedFileName + "_" + todaysDate + extName;
						var pathToUpload = "/"+ s3.BUCKET_NAME_Seller + "/seller - " + sellerId + "/" + "Profile Documents";
						filesToUpload.push({
						   "typeOfFile": "companyImage",
						   "pathToUpload": pathToUpload,
						   "acl": "public-read",
						   "filePath": req.files.companyImage.path,
						   "fileName": fileName
						});						
					}
					
					if(filesToUpload.length > 0){
					
						// S3 Upload image files..
						s3Upload.intializeS3(filesToUpload, function(err, result){
							if(!err){
								
								for(var i = 0; i < result.message.length; i++){
									if(result.message[i].typeOfFile === "profileImage"){
										profileImageFile = result.message[i].url;	
										basicInfo.profileImageURL = profileImageFile;								
									}
									else if(result.message[i].typeOfFile === "companyImage"){
										companyImageFile = result.message[i].url;
										basicInfo.companyInfo.companyImageURL = companyImageFile;
									}
								}
								
								// Updating Basic Info into collection..
								updateBasicDetails(sellerId, basicInfo, crmId, function(uerr, uresult){						
									if(!uerr){							
										var resJson = {
						        			"http_code" : "200",
						        			"message" : "Insert or update of Basic info successful."
								        }
										logger.debug(TAG + " Insert or update of Basic info successful. with s3" + JSON.stringify(resJson));
							        	callback(false, resJson);
										
									}else{
										var resJson = {
						        			"http_code" : "500",
						        			"message" : "Unexpected Server Error while fulfilling the request. Please retry."
							        	}
										logger.error(TAG + " s3 upload done but update to DB failed." + JSON.stringify(resJson));
							        	callback(true, resJson);
									}
								});
								
							}else{
								var resJson = {
					        			"http_code" : "500",
					        			"message" : "Upload of the file to s3 Failed."
					        		}
								logger.error(TAG + " s3 upload is failed while uploading Financial docs Seller Onboarding." + JSON.stringify(resJson));
					        	callback(true, resJson);
							}
						});
					}else{
						
						// Updating Basic Info into collection..
						updateBasicDetails(sellerId, basicInfo, crmId, function(uerr, uresult){						
							if(!uerr){							
								var resJson = {
				        			"http_code" : "200",
				        			"message" : "Insert or update of Basic info successful."
						        }
								logger.debug(TAG + " Insert or update of Basic info successful. with s3" + JSON.stringify(resJson));
					        	callback(false, resJson);
								
							}else{
								var resJson = {
				        			"http_code" : "500",
				        			"message" : "Unexpected Server Error while fulfilling the request. Please retry."
					        	}
								logger.error(TAG + " s3 upload done but update to DB failed." + JSON.stringify(resJson));
					        	callback(true, resJson);
							}
						});
						
					}	
					
				}
				//If Request Files is not present....				
				else{
					// Updating Basic Info into collection..
					updateBasicDetails(sellerId, basicInfo, crmId, function(uerr, uresult){						
						if(!uerr){							
							var resJson = {
			        			"http_code" : "200",
			        			"message" : "Insert or update of Basic info successful."
					        }
							logger.debug(TAG + " Insert or update of Basic info successful. with s3" + JSON.stringify(resJson));
				        	callback(false, resJson);
							
						}else{
							var resJson = {
			        			"http_code" : "500",
			        			"message" : "Unexpected Server Error while fulfilling the request. Please retry."
				        	}
							logger.error(TAG + " s3 upload done but update to DB failed." + JSON.stringify(resJson));
				        	callback(true, resJson);
						}
					});
				}			
			
		 }  
	 });    
	}else {
		resJson = {
			    "http_code" : "400",
				"message" : "Bad or ill-formed request.."
		};
		logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
		return callback(true, resJson);
	}
}
// Updating Basic info into collection..
var updateBasicDetails = function(sellerId, basicInfo, crmId, callback){
			//Variable for Logging the messages to the file.
			var logger = log.logger_seller;

			logger.info(TAG + " Entering update Basic info function.");
			//Variable for Mongo DB Connection.
			var db = dbConfig.mongoDbConn;
			//Declaring Collection Name
		    var colSellerMaster = db.collection("SellerMaster");
			colSellerMaster.update({ "sellerEntity.profileInfo.accountInfo.sellerId" : sellerId }, 
										{ $set : {"sellerEntity.profileInfo.basicInfo" : basicInfo }}, function(uerr, ustatus){
				if(!uerr){   
						resJson = {
				                "http_code" : "200",
				                "message" : "Profile updated Successful"
			    	        };
	    				logger.debug(TAG + " Profile updated Successful");
	        		   	callback(false, resJson);     			
        				/**** Upload / Update Oracle CRM ****/
        				var req = {
        					"query" : {
        						"sellerIDs" : sellerId
        					}
    					}        				
        				var action = ((crmId !== null && crmId !== '') ? 'update' : 'upload' );
        				supplierCrm.uploadToCRM(req, action, function(error, status){
				 			if(!error){
				 				logger.debug(TAG + " Profile update/upload Successful To crm successful");
				 			}
				 			else{
				 				logger.error(TAG + " Profile update/upload to crm failed...");
				 			}
        				});
        		}else{
        			resJson = {
    	                "http_code" : "500",
    	                "message" : "Profile updation Failed."
            	    };
        			logger.error(TAG + " Profile updation : " + JSON.stringify(err));
            		callback(true, resJson);
        		}
			});			
};

//Function for Business Information.
exports.addBusinessInfo =
function addBusinessInfo (req, callback){
	
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;

	//Variable for Mongo DB Connection.
	var db = dbConfig.mongoDbConn;

	//Variable for Logging the messages to the file.
	var logger = log.logger_seller;

	logger.info(ip + " " + TAG + " Entering Business Info Profile.");

	//Log the request.
	logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));

	//Declare the response
	var resJson;
	
	//Picking the seller id from session.
	var sellerIdSession = req.body.supplierSession.sellerEntity.profileInfo.accountInfo.sellerId;
	
	//Validate the request.
	if ( !(	req === null || 
			req.body === null ||
			sellerIdSession === null ||
			sellerIdSession.toString().trim().length === 0)) {
		
		var sellerId = sellerIdSession;
		
		var annualTurnOver = "";
		
		if(req.body.annualTurnOver !== null && req.body.annualTurnOver !== undefined 
				&& req.body.annualTurnOver.toString().trim().length !== 0){
			
			annualTurnOver = req.body.annualTurnOver;
			
		}
		
		var productionTradeCapacity = "";
		var productionTradeCapacityUnit = "";
		
		if(req.body.productionTradeCapacity !== null && 
			req.body.productionTradeCapacity !== undefined && req.body.productionTradeCapacity.length !== 0){
			
			if(req.body.productionTradeCapacityUnit !== null && 
			req.body.productionTradeCapacityUnit !== undefined && req.body.productionTradeCapacityUnit.length !== 0){
			
				productionTradeCapacity = req.body.productionTradeCapacity;
				productionTradeCapacityUnit = req.body.productionTradeCapacityUnit;
				
			}else{
				var resJson = {
	    			"http_code" : "500",
	    			"message" : "There should be input for the Production Trade Capacity Unit."
		        }
				logger.error(TAG + " There should be input for the Production Trade Capacity Unit." + JSON.stringify(resJson));
				return callback(true, resJson);
			}	
			
		}
		
		var noOfEmployees = "";
		
		if(req.body.noOfEmployees !== null && req.body.noOfEmployees !== undefined 
				&& req.body.noOfEmployees.toString().trim().length !== 0){
			
			noOfEmployees = req.body.noOfEmployees;
			
		}
		
		var customerReference = "";
		
		if(req.body.customerReference !== null && req.body.customerReference !== undefined 
				&& req.body.customerReference.length !== 0){
			
			customerReference = req.body.customerReference;
		}
		
		var importMaterials = "";
		var importLicenseNumber = "";
		
		if(req.body.importMaterials !== null && 
			req.body.importMaterials !== undefined && req.body.importMaterials.length !== 0){
			
			importMaterials = JSON.parse(req.body.importMaterials);
			
			if(importMaterials){
			
				if(req.body.importLicenseNumber !== null && 
				req.body.importLicenseNumber !== undefined && req.body.importLicenseNumber.length !== 0){
				
					importLicenseNumber = req.body.importLicenseNumber;
					
				}else{
					var resJson = {
		    			"http_code" : "500",
		    			"message" : "There should be input for the import License Number."
			        }
					logger.error(TAG + " There should be input for the import License Number." + JSON.stringify(resJson));
					return callback(true, resJson);
				}
			}	
		}
		
		var hseFlag = "";
		
		if(req.body.hseFlag !== null && req.body.hseFlag !== undefined 
				&& req.body.hseFlag.length !== 0){
			
			hseFlag = JSON.parse(req.body.hseFlag);
		}
		
		var ehsFlag = "";
		
		if(req.body.ehsFlag !== null && req.body.ehsFlag !== undefined 
				&& req.body.ehsFlag.length !== 0){
			
			ehsFlag = JSON.parse(req.body.ehsFlag);
		}
		
		var ohsasFlag = "";
		
		if(req.body.ohsasFlag !== null && req.body.ohsasFlag !== undefined 
				&& req.body.ohsasFlag.length !== 0){
			
			ohsasFlag = JSON.parse(req.body.ohsasFlag);
		}
		
		var workedWithEcommerce = "";
		
		if(req.body.workedWithEcommerce !== null && req.body.workedWithEcommerce !== undefined 
				&& req.body.workedWithEcommerce.length !== 0){
			
			workedWithEcommerce = JSON.parse(req.body.workedWithEcommerce);
		}
		
		var systemBillingName = "";
		
		if(req.body.systemBillingName !== null && req.body.systemBillingName !== undefined 
				&& req.body.systemBillingName.length !== 0){
			
			systemBillingName = req.body.systemBillingName;
		}
		
		var ownTransport = "";
		var noOfVehicles = "";
			
		if(req.body.ownTransport !== null && 
			req.body.ownTransport !== undefined && req.body.ownTransport.length !== 0){
			
			ownTransport = JSON.parse(req.body.ownTransport);	
			
			if(ownTransport){
				
				if(req.body.noOfVehiclesTransport !== null && 
				req.body.noOfVehiclesTransport !== undefined && req.body.noOfVehiclesTransport.length !== 0){
				
					noOfVehicles = req.body.noOfVehiclesTransport;
					
				}else{
					var resJson = {
		    			"http_code" : "500",
		    			"message" : "There should be input for the No Of Vehicles."
			        }
					logger.error(TAG + " There should be input for the No Of Vehicles." + JSON.stringify(resJson));
					return callback(true, resJson);
				}
			}	
			
		}	
		
		var rmcDetailsFlag = JSON.parse(req.body.rmcDetailsFlag);
		var bricksBlocksDetailsFlag = JSON.parse(req.body.bricksBlocksDetailsFlag);
		var steelDetailsFlag = JSON.parse(req.body.steelDetailsFlag);
		
		var categoryDetails = {
			"rmcDetails" : {
				"rmcDetailsFlag" : rmcDetailsFlag,
				"noOfVehicles": "",
				"noAndPumpTypes": "",
				"cementBrand": "",
				"rawMaterial": ""
			},
			"bricksBlocksDetails": {
				"bricksBlocksDetailsFlag": bricksBlocksDetailsFlag,
				"compressionStrength": "",
				"cementBrand": ""
			},
			"steelDetails": {
				"steelDetailsFlag": steelDetailsFlag,
				"primaryDetails": ""
			}
		};
		
		if(rmcDetailsFlag){
			
			categoryDetails.rmcDetails.noOfVehicles = req.body.rmcNoOfVehicles;
			categoryDetails.rmcDetails.noAndPumpTypes = req.body.noAndPumpTypes;
			categoryDetails.rmcDetails.cementBrand = req.body.rmcCementBrand;
			categoryDetails.rmcDetails.rawMaterial = req.body.rawMaterial;
			
		}
		
		if(bricksBlocksDetailsFlag){
			
			categoryDetails.bricksBlocksDetails.compressionStrength = req.body.compressionStrength;
			categoryDetails.bricksBlocksDetails.cementBrand = req.body.bricksCementBrand;
			
		}
		
		if(steelDetailsFlag){
			
			categoryDetails.steelDetails.primaryDetails = req.body.primaryDetails;
			
		}
		
		var colSeller = db.collection("SellerMaster");
		
		colSeller.findOne({"sellerEntity.profileInfo.accountInfo.sellerId": sellerId}, 
				{"_id":0, "sellerEntity.profileInfo.businessInfo" : 1}, function(err, result){
			
		if(!err && result !== null){
				
				var docBusinessInfo = {
						
					"annualTurnOver": annualTurnOver,
					"productionTradeCapacity": productionTradeCapacity,
					"productionTradeCapacityUnit": productionTradeCapacityUnit,
					"noOfEmployeees": noOfEmployees,
					"customerReference": customerReference,
					"testReportOne": req.body.testReportOne,
					"testReportOneURL": result.sellerEntity.profileInfo.businessInfo.testReportOneURL,
					"testReportTwo": req.body.testReportTwo,
					"testReportTwoURL": result.sellerEntity.profileInfo.businessInfo.testReportTwoURL,
					"testReportThree": req.body.testReportThree,
					"testReportThreeURL": result.sellerEntity.profileInfo.businessInfo.testReportThreeURL,
					"certificateOne": req.body.certificateOne,
					"certificateOneURL": result.sellerEntity.profileInfo.businessInfo.certificateOneURL,
					"certificateTwo": req.body.certificateTwo,
					"certificateTwoURL": result.sellerEntity.profileInfo.businessInfo.certificateTwoURL,
					"certificateThree": req.body.certificateThree,
					"certificateThreeURL": result.sellerEntity.profileInfo.businessInfo.certificateThreeURL,
					"importMaterials": importMaterials,
					"importLicenseNumber": importLicenseNumber,
					"hseFlag": hseFlag,
					"ehsFlag": ehsFlag,
					"ohsasFlag": ohsasFlag,
					"workedWithEcommerce": workedWithEcommerce,
					"systemBillingName": systemBillingName,
					"ownTransport": ownTransport,
					"noOfVehicles": noOfVehicles,
					"categoryDetails": categoryDetails
						
				};
				
				var filesToUpload = [];
				
				//Variables for the test reports.
				var testOne = "";
				var testTwo = "";
				var testThree = "";
				
				//Variables for the Certificates.
				var certOne = "";
				var certTwo = "";
				var certThree = "";
				
				if(req.files !== undefined){
					
					var todaysDate = moment().format("DD-MM-YYYY");
						
					if(req.files.testReportOneURL !== undefined && req.files.testReportOneURL.size !== 0){
						
						var extName = path.extname(req.files.testReportOneURL.name);
		                var uploadedFileName = path.basename(req.files.testReportOneURL.name, extName);
						
						var fileName = uploadedFileName + "_" + todaysDate + extName;
						
		
						var pathToUpload = "/"+ s3.BUCKET_NAME_Seller + "/seller - " + sellerId + "/" + "Test Reports";
						
						filesToUpload.push({
						   "typeOfFile": "testReportOneURL",
						   "pathToUpload": pathToUpload,
						   "acl": "public-read",
						   "filePath": req.files.testReportOneURL.path,
						   "fileName": fileName
						});
						
					}
					
					if(req.files.testReportTwoURL !== undefined && req.files.testReportTwoURL.size !== 0){
						
						var extName = path.extname(req.files.testReportTwoURL.name);
		                var uploadedFileName = path.basename(req.files.testReportTwoURL.name, extName);
						
						var fileName = uploadedFileName + "_" + todaysDate + extName;
						
						var pathToUpload = "/"+ s3.BUCKET_NAME_Seller + "/seller - " + sellerId + "/" + "Test Reports";
						
						filesToUpload.push({
						   "typeOfFile": "testReportTwoURL",
						   "pathToUpload": pathToUpload,
						   "acl": "public-read",
						   "filePath": req.files.testReportTwoURL.path,
						   "fileName": fileName
						});
						
					}
					
					if(req.files.testReportThreeURL !== undefined && req.files.testReportThreeURL.size !== 0){
						
						var extName = path.extname(req.files.testReportThreeURL.name);
		                var uploadedFileName = path.basename(req.files.testReportThreeURL.name, extName);
		
						var fileName = uploadedFileName + "_" + todaysDate + extName;
						
						var pathToUpload = "/"+ s3.BUCKET_NAME_Seller + "/seller - " + sellerId + "/" + "Test Reports";
						
						filesToUpload.push({
						   "typeOfFile": "testReportThreeURL",
						   "pathToUpload": pathToUpload,
						   "acl": "public-read",
						   "filePath": req.files.testReportThreeURL.path,
						   "fileName": fileName
						});
						
					}
					
					if(req.files.certificateOneURL !== undefined && req.files.certificateOneURL.size !== 0){
						
						var extName = path.extname(req.files.certificateOneURL.name);
		                var uploadedFileName = path.basename(req.files.certificateOneURL.name, extName);
						
						var fileName = uploadedFileName + "_" + todaysDate + extName;
						
		
						var pathToUpload = "/"+ s3.BUCKET_NAME_Seller + "/seller - " + sellerId + "/" + "Certificates";
						
						filesToUpload.push({
						   "typeOfFile": "certificateOneURL",
						   "pathToUpload": pathToUpload,
						   "acl": "public-read",
						   "filePath": req.files.certificateOneURL.path,
						   "fileName": fileName
						});
						
					}
					
					if(req.files.certificateTwoURL !== undefined && req.files.certificateTwoURL.size !== 0){
						
						var extName = path.extname(req.files.certificateTwoURL.name);
		                var uploadedFileName = path.basename(req.files.certificateTwoURL.name, extName);
						
						var fileName = uploadedFileName + "_" + todaysDate + extName;
						
						var pathToUpload = "/"+ s3.BUCKET_NAME_Seller + "/seller - " + sellerId + "/" + "Certificates";
						
						filesToUpload.push({
						   "typeOfFile": "certificateTwoURL",
						   "pathToUpload": pathToUpload,
						   "acl": "public-read",
						   "filePath": req.files.certificateTwoURL.path,
						   "fileName": fileName
						});
						
					}
					
					if(req.files.certificateThreeURL !== undefined && req.files.certificateThreeURL.size !== 0){
						
						var extName = path.extname(req.files.certificateThreeURL.name);
		                var uploadedFileName = path.basename(req.files.certificateThreeURL.name, extName);
		
						var fileName = uploadedFileName + "_" + todaysDate + extName;
						
						var pathToUpload = "/"+ s3.BUCKET_NAME_Seller + "/seller - " + sellerId + "/" + "Certificates";
						
						filesToUpload.push({
						   "typeOfFile": "certificateThreeURL",
						   "pathToUpload": pathToUpload,
						   "acl": "public-read",
						   "filePath": req.files.certificateThreeURL.path,
						   "fileName": fileName
						});
						
					}
					
					
					if(filesToUpload.length > 0){
					
						s3Upload.intializeS3(filesToUpload, function(err, result){
							if(!err){
								
								for(var i = 0; i < result.message.length; i++){
									if(result.message[i].typeOfFile === "testReportOneURL"){
										testOne = result.message[i].url;
										docBusinessInfo.testReportOneURL = testOne;
									}else if(result.message[i].typeOfFile === "testReportTwoURL"){
										testTwo = result.message[i].url;
										docBusinessInfo.testReportTwoURL = testTwo;
									}else if(result.message[i].typeOfFile === "testReportThreeURL"){
										testThree = result.message[i].url;
										docBusinessInfo.testReportThreeURL = testThree;
									}else if(result.message[i].typeOfFile === "certificateOneURL"){
										certOne = result.message[i].url;
										docBusinessInfo.certificateOneURL = certOne;
									}else if(result.message[i].typeOfFile === "certificateTwoURL"){
										certTwo = result.message[i].url;
										docBusinessInfo.certificateTwoURL = certTwo;
									}else if(result.message[i].typeOfFile === "certificateThreeURL"){
										certThree = result.message[i].url;
										docBusinessInfo.certificateThreeURL = certThree;
									}
								}
								
								updateBusinessInfo(sellerId, docBusinessInfo, function(uerr, uresult){
									
									if(!uerr){
										
										var resJson = {
						        			"http_code" : "200",
						        			"message" : "Insert or update of business info successful."
								        }
										logger.debug(TAG + " Insert or update of business info successful. with s3" + JSON.stringify(resJson));
							        	callback(false, resJson);
										
									}else{
										var resJson = {
						        			"http_code" : "500",
						        			"message" : "Unexpected Server Error while fulfilling the request. Please retry."
							        	}
										logger.error(TAG + " s3 upload done but update Business Info to DB failed." + JSON.stringify(resJson));
							        	callback(true, resJson);
									}
									
								});
								
							}else{
								var resJson = {
					        			"http_code" : "500",
					        			"message" : "Upload of the file to s3 Failed."
					        		}
								logger.error(TAG + " s3 upload is failed while uploading business docs Seller Onboarding." + JSON.stringify(resJson));
					        	callback(true, resJson);
							}
						});
					}else{
						
						updateBusinessInfo(sellerId, docBusinessInfo, function(uerr, uresult){
							
							if(!uerr){
								
								var resJson = {
					        			"http_code" : "200",
					        			"message" : "Insert or update of business info successful."
							    }
								logger.debug(TAG + " Insert or update of business info successful. without s3" + JSON.stringify(resJson));
						        callback(false, resJson);
								
							}else{
								var resJson = {
				        			"http_code" : "500",
				        			"message" : "Unexpected Server Error while fulfilling the request. Please retry."
						        }
								logger.error(TAG + " update to the DB failed." + JSON.stringify(resJson));
					        	callback(true, resJson);
							}
						});
						
					}	
				}else{
					
					updateBusinessInfo(sellerId, docBusinessInfo, function(uerr, uresult){
						
						if(!uerr){
							
							var resJson = {
				        			"http_code" : "200",
				        			"message" : "Insert or update of business info successful."
						    }
							logger.debug(TAG + " Insert or update of business info successful. without s3" + JSON.stringify(resJson));
					        callback(false, resJson);
							
						}else{
							var resJson = {
			        			"http_code" : "500",
			        			"message" : "Unexpected Server Error while fulfilling the request. Please retry."
					        }
							logger.error(TAG + " update to the DB failed." + JSON.stringify(resJson));
				        	callback(true, resJson);
						}
					});
				}
			}else if(!err && result === null){
				resJson = {
				    "http_code" : "500",
					"message" : "Inputs doen't match with our records."
				};
			    logger.error(ip + " " +TAG + " No matching seller for updating the Business info " + JSON.stringify(err));
			    return callback(true, resJson);
			}else{
				resJson = {
				    "http_code" : "500",
					"message" : "Unexpected Server Error while fulfilling the request. Please retry."
				};
			    logger.error(ip + " " +TAG + " Error for seller while updating the Business info " + JSON.stringify(err));
			    return callback(true, resJson);
			}
		});
	}else {
		resJson = {
			    "http_code" : "400",
				"message" : "Bad or ill-formed request.."
		};
		logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
		return callback(true, resJson);
	}
}

function updateBusinessInfo(sellerId, docBusinessInfo, callback){
	
	//Variable for Mongo DB Connection.
	var db = dbConfig.mongoDbConn;

	//Variable for Logging the messages to the file.
	var logger = log.logger_seller;

	logger.info(TAG + " Entering update Business info function.");

	colSeller = db.collection("SellerMaster");
	
	colSeller.update({"sellerEntity.profileInfo.accountInfo.sellerId": sellerId},
			{$set:{"sellerEntity.profileInfo.businessInfo": docBusinessInfo}}, function(err, result){
		
		if(!err){
			return callback(false, result);
		}else{
			logger.error(TAG + " Error for seller while updating the Business info in update Business info." + JSON.stringify(err));
		    return callback(true, "Error while updating the Seller Business Info");
		}
		
	});
}