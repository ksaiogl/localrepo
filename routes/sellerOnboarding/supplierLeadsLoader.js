var TAG = "---Supplier Leads Loader for RFQ Suppliers ---    ";
var log = require('../../Environment/log4js.js');
var fs = require('fs');
var path = require('path');
var xlsxj = require("xlsx-to-json");
var equals = require('array-equal');
var async = require("async");
var crypto = require('crypto');
var citieslist = require('../suppliersfileupload/citieslist.js');
var dbConfig = require('../../Environment/mongoDatabase.js');
var sellerRegistration = require('./sellerRegistration.js');

exports.loadLeadData = function(req, callback){
	//Variable for Logging the messages to the file.
	var logger = log.logger_seller;

  	uploadToDb(req, function(error, result){
	  	if(result.attachment == 1)
	  	{
	  		//reading the contents of log file.
	  		fs.readFile('/usr/NodeJslogs/logger_supplierLeadMigration.txt', 'utf8', function read(err, data) {
			    if (err) {
			        var resJson = {
	            		"http_code": 500,
	            		"message": "Unable to read log file."
			        };
			        logger.error(TAG + "Unable to read log file. ERROR : " + JSON.stringify(err));
			        callback(true, resJson);
			    } else {
			    	//deleting log file.
			    	fs.unlinkSync('/usr/NodeJslogs/logger_supplierLeadMigration.txt');

			    	var resJson = {
			    		"http_code": result.http_code,
	            		"message": result.message,
	            		"status": data.replace(/\t/g, '     ').split("\r\n")
	            					.filter(function(val) { return val !== ""; })
			        };
					callback(false, resJson);
			    }
			});
	  	} else {
			callback(error, result);
		}
	});
}


function uploadToDb(req, callback){

	//Variable for Logging the messages to the file.
	var logger = log.logger_seller;

	//Declare the response.
	var resJson;

	var request = req;

	//getting form details.
	var multiparty = require('multiparty');
    var form = new multiparty.Form();

    //header of upload template excel file.
    var header = [ "Others", "SellerId", "CompanyName", "PhoneNumber", "EmailId", "State", "City", "CustomerId",  
    	"Building_Material", "Electrical", "Paints", "Plumbing", "Walls_and_Flooring", "Carpentry", 
    	"Bathroom", "Roofing", "Tools_and_Spares", "Kitchen", "Construction_Equipment", "Doors_and_Windows",
    	"Garden", "Hardware", "Solutions" ];
    
    form.parse(req, function (err, fields, files) {
        if (err) {
	        resJson = {
	            "http_code": 500,
	            "message": "Unable to retrieve Form Data."
	        };
	        logger.error(TAG + "Unable to retrieve Form Data. ERROR : \n" + err.stack);
	        callback(true,resJson);
	    } else {
	    	//Validate the request.
	    	if(files.fileName == undefined){
	        	resJson = {
		            "http_code": 500,
		            "message": "File is missing"
		        };
		        callback(true,resJson);
	        } else 
	        {
	        	//retrieving data from form.
		        var uploadedFile = files.fileName[0];

		        fs.readFile(uploadedFile.path, function (err, data) {
		        	if (err) {
				        resJson = {
				            "http_code": 500,
				            "message": "Unable to read Uploaded Excel file."
				        };
				        logger.error(TAG + "Unable to read Uploaded Excel file. ERROR : \n" + err.stack);
				        callback(true,resJson);
				    } else
				    {    
			            //file details
			            var fileSize = uploadedFile.size/(1000000);
			            var extName = path.extname(uploadedFile.originalFilename);
			            var uploadedFileName = path.basename(uploadedFile.originalFilename, extName);
			                
			            //file validations, checking size limit: 2MB, checking extensions: xlsx.
			            if(fileSize < 2 && extName == ".xlsx")
			            {
			                //converting xlsx to json
			                xlsxj({
			                    input: uploadedFile.path,
			                    output: null,
			                    sheet: "Details"
			                },  function (err, result) {
		                        if (err) {
		                            resJson = {
							            "http_code": 500,
							            "message": "Error - Excel file conversion to Json failed. Please contact engineering team."
							        };
							        logger.error(TAG + "Error - Excel file conversion to Json failed. ERROR : \n" + err.stack);
							        callback(true,resJson);
		                        } else {
		                            //validating uploaded file is of same template or not
		                            if(result.length == 0){
		                            	resJson = {
							              "http_code": 400,
							              "message": "Uploaded excel file contains no Data!!"
							          	};
							          	logger.error(TAG + "Uploaded excel file contains no Data!!");
							          	callback(true,resJson)
		                            }
		                            //validating uploaded file is of same template or not
		                            else if(!equals(Object.keys(result[0]),header)){
		                                resJson = {
							              "http_code": 400,
							              "message": "Please Upload excel file of given template only!!"
							          	};
							          	logger.error(TAG + "Please Upload excel file of given template only!!");
							          	callback(true,resJson);
		                            } else if(validateJson(result) == 0) {
		                            	//deleting excel file
		                            	fs.unlinkSync(uploadedFile.path);

		                            	//making the contents of log file empty
						    			fs.writeFileSync('/usr/NodeJslogs/logger_supplierLeadMigration.txt', '');	

	    								var rowcount = 2;
	    								var errorCount = 0;
	    								var addedCount = 0;

	    								async.forEachSeries(result, function(key, callback){

								        	var categories = [];
								        	if(key.Bathroom != "")
								        	{
								        		var subcategories = (key.Bathroom.split(', '));
								        		categories.push({
									        		"mainCategory": "Bathroom",
									        		"subCategories": subcategories
									        	});
								        	} 
								        	if(key.Building_Material != "")
								        	{
								        		var subcategories = (key.Building_Material.split(', '));
								        		categories.push({
									        		"mainCategory": "Building Material",
									        		"subCategories": subcategories
									        	});
								        	}
								        	if(key.Carpentry != "")
								        	{
								        		var subcategories = (key.Carpentry.split(', '));
								        		categories.push({
									        		"mainCategory": "Carpentry",
									        		"subCategories": subcategories
									        	});
								        	}
								        	if(key.Construction_Equipment != "")
								        	{
								        		var subcategories = (key.Construction_Equipment.split(', '));
								        		categories.push({
									        		"mainCategory": "Construction Equipment",
									        		"subCategories": subcategories
									        	});
								        	}
								        	if(key.Doors_and_Windows != "")
								        	{
								        		var subcategories = (key.Doors_and_Windows.split(', '));
								        		categories.push({
									        		"mainCategory": "Doors and Windows",
									        		"subCategories": subcategories
									        	});
								        	}
								        	if(key.Electrical != "")
								        	{
								        		var subcategories = (key.Electrical.split(', '));
								        		categories.push({
									        		"mainCategory": "Electrical",
									        		"subCategories": subcategories
									        	});
								        	}
								        	if(key.Garden != "")
								        	{
								        		var subcategories = (key.Garden.split(', '));
								        		categories.push({
									        		"mainCategory": "Garden",
									        		"subCategories": subcategories
									        	});
								        	} 
								        	if(key.Hardware != "")
								        	{
								        		var subcategories = (key.Hardware.split(', '));
								        		categories.push({
									        		"mainCategory": "Hardware",
									        		"subCategories": subcategories
									        	});
								        	} 
								        	if(key.Kitchen != "")
								        	{
								        		var subcategories = (key.Kitchen.split(', '));
								        		categories.push({
									        		"mainCategory": "Kitchen",
									        		"subCategories": subcategories
									        	});
								        	}
								        	if(key.Others != "")
								        	{
								        		var subcategories = (key.Others.split(', '));
								        		categories.push({
									        		"mainCategory": "Others",
									        		"subCategories": subcategories
									        	});
								        	}
								        	if(key.Paints != "")
								        	{
								        		var subcategories = (key.Paints.split(', '));
								        		categories.push({
									        		"mainCategory": "Paints",
									        		"subCategories": subcategories
									        	});
								        	}
								        	if(key.Plumbing != "")
								        	{
								        		var subcategories = (key.Plumbing.split(', '));
								        		categories.push({
									        		"mainCategory": "Plumbing",
									        		"subCategories": subcategories
									        	});
								        	}
								        	if(key.Roofing != "")
								        	{
								        		var subcategories = (key.Roofing.split(', '));
								        		categories.push({
									        		"mainCategory": "Roofing",
									        		"subCategories": subcategories
									        	});
								        	}
								        	if(key.Solutions != "")
								        	{	
								        		var subcategories = (key.Solutions.split(', '));
								        		categories.push({
									        		"mainCategory": "Solutions",
									        		"subCategories": subcategories
									        	});
								        	}
								        	if(key.Tools_and_Spares != "")
								        	{
								        		var subcategories = (key.Tools_and_Spares.split(', '));
								        		categories.push({
									        		"mainCategory": "Tools and Spares",
									        		"subCategories": subcategories
									        	});
								        	}
								        	if(key.Walls_and_Flooring != "")
								        	{
								        		var subcategories = (key.Walls_and_Flooring.split(', '));
								        		categories.push({
									        		"mainCategory": "Walls and Flooring",
									        		"subCategories": subcategories
									        	});
								        	}
								        	//calling addSupplierLeads function
							        		addSupplierLeads
							        		(
							        			key.SellerId,
												key.CompanyName,
												key.PhoneNumber,
												key.EmailId.toLowerCase(),
												key.City.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1);}),
												key.State.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1);}),
												key.CustomerId.split(', ').map(Number),
												categories,
												rowcount,
												request,
												function(err, result){
													if(err){
						                            	fs.appendFileSync('/usr/NodeJslogs/logger_supplierLeadMigration.txt',
	                										"Row"+result.rowcount+"\thttp_code: "+result.http_code+"\tmessage: "+result.message+"\r\n");
						                            	errorCount++;
						                            	callback(false);
													} else {
														fs.appendFileSync('/usr/NodeJslogs/logger_supplierLeadMigration.txt',
	                										"Row"+result.rowcount+"\thttp_code: "+result.http_code+"\tmessage: "+result.message+"\r\n");
														addedCount++;
														callback(false);
													}	
												}
							        		);
								        rowcount++;
										},
						 		 		//Final Function to be called upon completion of all functions.
						 				function(error)
						 				{
						 					var http_code;
						 					var message;
							 				if(!error){
							 					if(errorCount > 0 && addedCount == 0) {
							 						http_code = 500;
							 						message = "All Sellers have already been added"
							 					} else if(addedCount > 0) {
							 						http_code = 200;
							 						message = addedCount + " Seller added Successfully"
							 					}
						 			 			resJson = {
		                            	  		  "http_code": http_code,
						 			 			  "message": message,
								              	  "attachment": 1
									          	};	
						 			 			return callback(false,resJson);
							 			 	}	
						 				});	    
		                            } else {
		                            	resJson = {	
		                            	  "http_code": 400,
			              				  "message": "Uploaded Excel file contains errors ",
						              	  "attachment": 1
							          	};	
							          	logger.error(TAG + "Uploaded Excel file contains errors ");
				 			 			return callback(true,resJson);
		                            } 
		                        }
			                });
				        } else if (!(extName == ".xlsx")){
			            	resJson = {
				              "http_code": 400,
				              "message": "Please Upload excel file of type .xlsx only!!"
				          	};
				          	logger.error(TAG + "Please Upload excel file of type .xlsx only!!");
				          	callback(true,resJson);
			            } else if (!(fileSize < 2)){
			            	resJson = {
				              "http_code": 400,
				              "message": "File size exceeded 2MB!!"
				          	};
				          	logger.error(TAG + "File size exceeded 2MB!!");
				          	callback(true,resJson);
			            }
			        }    	
		        });
			}
		}	
    });
};	

function newindexOf(arr, key, val) {
	for (var i = 0; i < arr.length; i++) {
	  if (arr[i][key] == val) {
	    return i;
	  }
	}
	return -1;
}

//function to validate json data
var validateJson = function (result) {

    //making the contents of log file empty
    fs.writeFileSync('/usr/NodeJslogs/logger_supplierLeadMigration.txt', '');
    
    var count = 2;
    var errorCount = 0;
    for (var key in result)
    {
        if (result.hasOwnProperty(key))
        {
            //CompanyName
            if(result[key].CompanyName == ""){
                fs.appendFileSync('/usr/NodeJslogs/logger_supplierLeadMigration.txt',
                    "Row"+count+"\tProblem found in: Name"+"\tDescription: CompanyName is Mandatory\r\n");
                errorCount+=1;
            } else if(!(/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?\s]*$/i.test(result[key].CompanyName))){
                fs.appendFileSync('/usr/NodeJslogs/logger_supplierLeadMigration.txt',
                    "Row"+count+"\tProblem found in: Name"+"\tDescription: CompanyName is invalid\r\n");
                errorCount+=1;
            } else if(result[key].CompanyName.length > 100) {
                fs.appendFileSync('/usr/NodeJslogs/logger_supplierLeadMigration.txt',
                    "Row"+count+"\tProblem found in: Name"+"\tDescription: CompanyName cannot be more than 100 characters\r\n");
                errorCount+=1;
            }

            //Phone Number
            if(result[key].PhoneNumber == ""){
                fs.appendFileSync('/usr/NodeJslogs/logger_supplierLeadMigration.txt',
                    "Row"+count+"\tProblem found in: Mobile"+"\tDescription: Phone Number is Mandatory\r\n");
                errorCount+=1;
            }
            else if(!(/^\d{10}$/.test(result[key].PhoneNumber))){
                fs.appendFileSync('/usr/NodeJslogs/logger_supplierLeadMigration.txt',
                    "Row"+count+"\tProblem found in: Mobile"+"\tDescription: Phone Number is not valid\r\n");
                errorCount+=1;
            }


            //EmailId
            if(result[key].EmailId == ""){
                fs.appendFileSync('/usr/NodeJslogs/logger_supplierLeadMigration.txt',
                    "Row"+count+"\tProblem found in: EmailId"+"\tDescription: EmailId is Mandatory\r\n");
                errorCount+=1;
            }
            else if(!(/^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i.test(result[key].EmailId))){
                fs.appendFileSync('/usr/NodeJslogs/logger_supplierLeadMigration.txt',
                    "Row"+count+"\tProblem found in: EmailId"+"\tDescription: EmailId is not valid\r\n");
                errorCount+=1;
            }

            var state = result[key].State.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1);});
            var city = result[key].City.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1);});
            var stateindex = newindexOf(citieslist.citiesList,'state',state);
            if(stateindex != -1){
            	var cityindex = citieslist.citiesList[stateindex].cities.indexOf(city);
            } else {
            	var cityindex = null;
            }
            	
            //State
            if(result[key].State == ""){
                fs.appendFileSync('/usr/NodeJslogs/logger_supplierLeadMigration.txt',
                    "Row"+count+"\tProblem found in: State"+"\tDescription: State is Mandatory\r\n");
                errorCount+=1;
            } else if(stateindex == -1){
            	fs.appendFileSync('/usr/NodeJslogs/logger_supplierLeadMigration.txt',
                    "Row"+count+"\tProblem found in: State"+"\tDescription: State is invalid\r\n");
                errorCount+=1;
            }

            //City
            if(result[key].City == ""){
                fs.appendFileSync('/usr/NodeJslogs/logger_supplierLeadMigration.txt',
                    "Row"+count+"\tProblem found in: City"+"\tDescription: City is Mandatory\r\n");
                errorCount+=1;
            } else if(cityindex == -1){
            	fs.appendFileSync('/usr/NodeJslogs/logger_supplierLeadMigration.txt',
                    "Row"+count+"\tProblem found in: City"+"\tDescription: City is not in State selected\r\n");
                errorCount+=1;
            }

            //CustomerId
            if(result[key].CustomerId == ""){
                fs.appendFileSync('/usr/NodeJslogs/logger_supplierLeadMigration.txt',
                    "Row"+count+"\tProblem found in: CustomerId"+"\tDescription: CustomerId is Mandatory\r\n");
                errorCount+=1;
            } 

            //SellerId
            if(result[key].SellerId == ""){
                fs.appendFileSync('/usr/NodeJslogs/logger_supplierLeadMigration.txt',
                    "Row"+count+"\tProblem found in: SellerId"+"\tDescription: SellerId is Mandatory\r\n");
                errorCount+=1;
            } 

            count += 1;
        }
    }
    return errorCount;
};


function addSupplierLeads(sellerId,companyName,mobile,email,city,state,customerIds,categories,rowcount,request,callback){

    var logger = log.logger_seller;
    var resJson;

    var db = dbConfig.mongoDbConn;

	var suppliercol = db.collection('Supplier');
	var sellerLeadcol = db.collection('SellerLead');
	var buildercol = db.collection('Builder');

	if(categories.length == 0){
		resJson = {
			    "http_code" : "500",
				"message" : "Seller should have atleast one subcategory",
				"rowcount": rowcount
		};
		logger.error(TAG + " " + JSON.stringify(resJson));
		return callback(true,resJson);
	}
	else {

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
				
				suppliercol.find({"supplierEntity.identifier.sellerId": sellerId}).toArray(function(error, result){	
					if(error){
						resJson = {
						    "http_code" : "500",
							"message" : "Error while fetching Seller Details in Supplier. Please try later.",
							"rowcount": rowcount
						};
						logger.error(TAG + " fetching Seller Details in Supplier - CRM failed. Error:" + JSON.stringify(error));
						callback(true, resJson);
					}
					else if(!error && result.length > 0){

						resJson = {
						    "http_code" : "500",
							"message" : "Seller is already Approved",
							"rowcount": rowcount
						};
						logger.error(TAG + " Given seller already exists in Supplier");
						callback(true, resJson);
					}
					else if(!error && result.length === 0){

						sellerLeadcol.find({"sellerLeadEntity.mobile": mobile}).toArray(function(error, result){	
							if(error){
								resJson = {
								    "http_code" : "500",
									"message" : "Error while fetching Seller Details in SellerLead. Please try later.",
									"rowcount": rowcount
								};
								logger.error(TAG + " fetching Seller Details in SellerLead - CRM failed. Error:" + JSON.stringify(error));
								callback(true, resJson);
							}
							else if(!error && result.length > 0){

								resJson = {
								    "http_code" : "500",
									"message" : "mobile number is already registered",
									"rowcount": rowcount
								};
								logger.error(TAG + " Given mobile already exists in SellerLead");
								callback(true, resJson);
							}
							else if(!error && result.length === 0){

								var doc = { 
								    "sellerLeadEntity" : {
								        "sellerLeadId" : sellerId, 
								        "sellerId" : "", 
								        "companyName" : companyName, 
								        "emailId" : email, 
								        "mobile" : mobile, 
								        "userId" : "", 
								        "passwordHash" : "", 
								        "VAT_TIN" : "", 
								        "leadSource" : "rfq", 
								        "customerIds" : customerIds, 
								        "state" : state,
								        "city" : city,  
								        "categories" : categories,
								        "createdAt" : new Date(), 
								        "sellerVerificationInfo" : {
								            "termsAccepted" : false, 
								            "termsAcceptedTimeStamp" : "", 
								            "emailVerified" : false, 
								            "emailVerifiedTimeStamp" : "", 
								            "OTP" : "", 
								            "otpVerified" : false, 
								            "otpVerifiedTimestamp" : ""
								        }, 
								        "crmStatus" : "notVerified"
								    }
								};


							    sellerLeadcol.insert(doc, {w:1},function(errorm, resultm) {
									if (errorm) {
										resJson = {
										    "http_code" : "500",
											"message" : "Error - Adding seller to SellerLead collection Failed. Please try again",
											"rowcount": rowcount
										};
										logger.error(TAG + " Inserting new document into SellerLead collection Failed. err: " + JSON.stringify(errorm));
										callback(true, resJson);
									} else {
										resJson = {
										    "http_code" : "200",
											"message" : "Adding seller details Successful",
											"rowcount": rowcount
										};
										logger.error(TAG + "Adding seller details to SellerLead Successful.");
										callback(false, resJson);
									}
								});
							}
						});
					}
				});
			}
			else if(!errorm && resultm.length === 0){
				resJson = {
				    "http_code" : "500",
					"message" : "One of the Company id's doesn't exists in Builder."
				};
				logger.error(TAG + " Company Details not found in Builder.");
				return callback(true, resJson);	
			}
		});
	}	
};