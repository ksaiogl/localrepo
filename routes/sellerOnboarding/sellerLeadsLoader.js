var TAG = "---Seller Leads Loader for Seller collection ---    ";
var log = require('../../Environment/log4js.js');
var fs = require('fs');
var path = require('path');
var xlsxj = require("xlsx-to-json");
var equals = require('array-equal');
var async = require("async");
var crypto = require('crypto');
var dbConfig = require('../../Environment/mongoDatabase.js');
var sellerRegistration = require('./sellerRegistration.js');

exports.loadLeadData = function(req, callback){
	//Variable for Logging the messages to the file.
	var logger = log.logger_seller;

  	uploadToDb(req, function(error, result){
	  	if(result.attachment == 1)
	  	{
	  		//reading the contents of log file.
	  		fs.readFile('/usr/NodeJslogs/logger_sellerLeadsMigration.txt', 'utf8', function read(err, data) {
			    if (err) {
			        var resJson = {
	            		"http_code": 500,
	            		"message": "Unable to read log file."
			        };
			        logger.error(TAG + "Unable to read log file. ERROR : " + JSON.stringify(err));
			        callback(true, resJson);
			    } else {
			    	//deleting log file.
			    	fs.unlinkSync('/usr/NodeJslogs/logger_sellerLeadsMigration.txt');

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
    var header = [ "VAT", "CompanyName", "PhoneNumber", "EmailId" ];
    
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
						    			fs.writeFileSync('/usr/NodeJslogs/logger_sellerLeadsMigration.txt', '');	

	    								var rowcount = 2;
	    								var errorCount = 0;
	    								var addedCount = 0;

	    								async.forEachSeries(result, function(key, callback){

								        	//calling addSellerLeads function
							        		addSellerLeads
							        		(
												key.CompanyName,
												key.PhoneNumber,
												key.EmailId.toLowerCase(),
												key.VAT,
												rowcount,
												request,
												function(err, result){
													if(err){
						                            	fs.appendFileSync('/usr/NodeJslogs/logger_sellerLeadsMigration.txt',
	                										"Row"+result.rowcount+"\thttp_code: "+result.http_code+"\tmessage: "+result.message+"\r\n");
						                            	errorCount++;
						                            	callback(false);
													} else {
														fs.appendFileSync('/usr/NodeJslogs/logger_sellerLeadsMigration.txt',
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

//function to validate json data
var validateJson = function (result) {

    //making the contents of log file empty
    fs.writeFileSync('/usr/NodeJslogs/logger_sellerLeadsMigration.txt', '');
    
    var count = 2;
    var errorCount = 0;
    for (var key in result)
    {
        if (result.hasOwnProperty(key))
        {
            //CompanyName
            if(result[key].CompanyName == ""){
                fs.appendFileSync('/usr/NodeJslogs/logger_sellerLeadsMigration.txt',
                    "Row"+count+"\tProblem found in: Name"+"\tDescription: CompanyName is Mandatory\r\n");
                errorCount+=1;
            } else if(!(/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?\s]*$/i.test(result[key].CompanyName))){
                fs.appendFileSync('/usr/NodeJslogs/logger_sellerLeadsMigration.txt',
                    "Row"+count+"\tProblem found in: Name"+"\tDescription: CompanyName is invalid\r\n");
                errorCount+=1;
            } else if(result[key].CompanyName.length > 100) {
                fs.appendFileSync('/usr/NodeJslogs/logger_sellerLeadsMigration.txt',
                    "Row"+count+"\tProblem found in: Name"+"\tDescription: CompanyName cannot be more than 100 characters\r\n");
                errorCount+=1;
            }

            //Phone Number
            if(result[key].PhoneNumber == ""){
                fs.appendFileSync('/usr/NodeJslogs/logger_sellerLeadsMigration.txt',
                    "Row"+count+"\tProblem found in: Mobile"+"\tDescription: Phone Number is Mandatory\r\n");
                errorCount+=1;
            }
            else if(!(/^\d{10}$/.test(result[key].PhoneNumber))){
                fs.appendFileSync('/usr/NodeJslogs/logger_sellerLeadsMigration.txt',
                    "Row"+count+"\tProblem found in: Mobile"+"\tDescription: Phone Number is not valid\r\n");
                errorCount+=1;
            }


            //EmailId
            if(result[key].EmailId == ""){
                fs.appendFileSync('/usr/NodeJslogs/logger_sellerLeadsMigration.txt',
                    "Row"+count+"\tProblem found in: EmailId"+"\tDescription: EmailId is Mandatory\r\n");
                errorCount+=1;
            }
            else if(!(/^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i.test(result[key].EmailId))){
                fs.appendFileSync('/usr/NodeJslogs/logger_sellerLeadsMigration.txt',
                    "Row"+count+"\tProblem found in: EmailId"+"\tDescription: EmailId is not valid\r\n");
                errorCount+=1;
            }

            //VAT
            if(result[key].VAT == ""){
                fs.appendFileSync('/usr/NodeJslogs/logger_sellerLeadsMigration.txt',
                    "Row"+count+"\tProblem found in: VAT"+"\tDescription: VAT is Mandatory\r\n");
                errorCount+=1;
            } 

            count += 1;
        }
    }
    return errorCount;
};


function addSellerLeads(companyName,mobile,email,vat,rowcount,request,callback){

    var logger = log.logger_seller;
    var resJson;

    var db = dbConfig.mongoDbConn;

    var Header = function(name){
    	return request.header('x-forwarded-for');
    };
    var req = {
    	"header": Header,
    	"connection": request.connection,
	    "params": {
		        "userId": mobile,
		}
    };

	sellerRegistration.validateUserId(req, function(err, result){

		if(err){

			resJson = {
			    "http_code" : "500",
				"message" : "userid/mobile number is already registered",
				"rowcount": rowcount
			};
			logger.error(TAG + " Given mobile already exists in SellerLead as userId");
			callback(true, resJson);
		} else {

			var Header = function(name){
		    	return request.header('x-forwarded-for');
		    };
		    var req = {
		    	"header": Header,
		    	"connection": request.connection,
			    "body": {
				        "companyName": companyName,
				        "emailId": email,
				        "mobile": mobile,
				        "userId": mobile,
				        "password": 'Password123',
				        "vat": vat,
				        "leadSource": "sceta",
				        "termsAccepted": true
				}
		    };
		    sellerRegistration.register(req, function(error, response){
			    if(error) {
			    	resJson = {
		              	"http_code": parseInt(response.http_code),
		              	"message": response.message,
		              	"rowcount": rowcount
		          	};
			        logger.error(TAG + " Adding seller details failed. error: " + JSON.stringify(response));
		            return callback(true, resJson);
			    }
			    else {
		 	    	if(response.http_code === '200')
		            {
		            	resJson = {
			              	"http_code": parseInt(response.http_code),
			              	"message": response.message,
			              	"rowcount": rowcount
			          	};
		            	logger.debug(TAG + " Adding seller details Succesful.");
				    	return callback(false, resJson);
		            }
		            else{
		            	resJson = {
			              	"http_code": parseInt(response.http_code),
			              	"message": response.message,
			              	"rowcount": rowcount
			          	};
		            	logger.error(TAG + " Adding seller details failed. result: " + JSON.stringify(response));
		            	return callback(true, resJson);
		            }
				}
			});
		}
	});
};