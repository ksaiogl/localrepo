var TAG = "rfqInquiries.js";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var s3 = require('../../Environment/s3configuration.js');
var async = require('async');
var underscore = require('underscore');
var mime = require('mime-types');
var moment = require('moment');
var Excel = require('exceljs');
var fs = require('fs');
var pdf = require('html-pdf');
var s3Upload = require('./s3Upload.js');
var fse = require('fs-extra');
var projectpdf = require('../notification/emailhtmls/rfqjs/inquiryProject.js');
var inquiryCRM = require('../notification/emailhtmls/rfqjs/inquiryCRM.js');
var inquiryBuilder = require('../notification/emailhtmls/rfqjs/inquiryBuilder.js');
var magento = require('../magento/magentoAPI.js');
var genericNotifications = require('../notification/generic_SMS_Email_Notifications.js');
var timezoneConversions = require('../helpers/timezoneConversions.js');
var emails = require('../helpers/emailIdConfig.js');
var env = require('../../Environment/env.js').env;
var fetchCompanyIds = require('./utility/getCompanyIds.js');

//Function for creating the inquiry.
exports.raiseInquiry =
function raiseInquiry (req, callback){

	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;

	//Variable for Mongo DB Connection.
	var db = dbConfig.mongoDbConn;

	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;

	logger.info(ip + " " + TAG + " Entering Raise Inquiry.");

	//Log the request.
	logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));
	logger.info(ip + " " + TAG + " " + JSON.stringify(req.files));
	
	// console.log("Request Body: ");
	// console.log(JSON.stringify(req.body));
	// console.log("Request files: ");
	// console.log(JSON.stringify(req.files));

	//Declare the response
	var resJson;

	//Task array for executing the parallel tasks.
	var taskArray = [];

	//Validate the request.
	if ( !(	req === null ||
			req.body === null ||
			//req.body.companyId === null  	||
			//req.body.companyName === null ||
			req.body.suppliersChosen === null  	||
			req.body.categories === null 	||
			req.body.deliveryByDate === null 	||
			req.body.paymentModes === null 	||
			req.body.deactivationDate === null 	||
			//req.body.companyId === undefined  	||
			//req.body.companyName === undefined ||
			req.body.suppliersChosen === undefined  	||
			req.body.categories === undefined 	||
			req.body.deliveryByDate === undefined 	||
			req.body.paymentModes === undefined 	||
			req.body.deactivationDate === undefined 	||
			//req.body.companyId.toString().trim().length === 0  	||
			//req.body.companyName.toString().trim().length === 0 ||
			req.body.categories.length === 0 ||
			req.body.deliveryByDate.toString().trim().length === 0 ||
			req.body.paymentModes.toString().trim().length === 0 ||
			req.body.deactivationDate.toString().trim().length === 0 )) {

	var projSelected = "";
	var projectId = null;
	var projectType = null;
	var projectName = null;

	//IF Project is selected then the values for projectType and ProjectId should be mandatory.
	if(req.body.projectId !== undefined && req.body.projectType !== undefined && req.body.projectName !== undefined &&
	   req.body.projectId !== null && req.body.projectType !== null  && req.body.projectName !== null &&
	   req.body.projectId.toString().trim().length !== 0 && req.body.projectType.toString().trim().length !== 0 && req.body.projectName.toString().trim().length !== 0){

		projSelected = true;
		projectId = parseInt(req.body.projectId);
		projectType = req.body.projectType;
		projectName = req.body.projectName;
	}else{
		projSelected = false;
	}

	var suppliersChosen = [];
	try{
		suppliersChosen = JSON.parse(req.body.suppliersChosen);		 
	}catch(e){
		logger.debug(ip + " " + TAG + " Parsing supplier choosen, Error Ignore." + JSON.stringify(e));
		suppliersChosen = req.body.suppliersChosen;				//Input would look like [{"supplierId":"5621345","category":"cement"}]
	}	
	
	var categoriesChosen = [];
	try{
		categoriesChosen = JSON.parse(req.body.categories);		 
	}catch(e){
		logger.debug(ip + " " + TAG + " Parsing supplier choosen, Error Ignore." + JSON.stringify(e));
		categoriesChosen = req.body.categories;				//Input would look like [{"supplierId":"5621345","category":"cement"}]
	}

	var quoteFromMSupplySuppliers = true;
	var detailsOfRequirement = null;
	var targetPriceForQuotation = null;

	if(req.body.chosenMsupplySuppliers !== undefined &&
	   req.body.chosenMsupplySuppliers !== null &&
	   req.body.chosenMsupplySuppliers.toString().trim().length !== 0){

		quoteFromMSupplySuppliers = JSON.parse(req.body.chosenMsupplySuppliers);
	}

	if(req.body.detailsOfRequirement !== undefined && req.body.detailsOfRequirement !== null &&
	   req.body.detailsOfRequirement.toString().trim().length !== 0){

		detailsOfRequirement = req.body.detailsOfRequirement
	}

	if(req.body.targetPriceForQuotation !== undefined && req.body.targetPriceForQuotation !== null &&
	   req.body.targetPriceForQuotation.toString().trim().length !== 0){

		targetPriceForQuotation = req.body.targetPriceForQuotation;
	}

	//var categoriesChosen = req.body.categories;
	var deliveryByDate = req.body.deliveryByDate;
	var paymentModes = req.body.paymentModes;
	var creditDaysNeeded = null;
	var shipToProjectAddress = null;
	var shippingAddress = null;
	var noOfQuotationsDesiredRange = null;
	var packingAndFreightRequirements = null


	if(paymentModes === "onCredit" && (req.body.creditDaysNeeded !== undefined && req.body.creditDaysNeeded !== null &&
	   req.body.creditDaysNeeded.toString().trim().length !== 0)){

		creditDaysNeeded = req.body.creditDaysNeeded;
	}

	var shippingAddress = {
		"addressLine1": "",
		"addressLine2": "",
		"city": "",
		"state": "",
		"pincode": ""
	};


	if(req.body.shipToProjectAddress !== undefined && req.body.shipToProjectAddress !== null &&
			req.body.shipToProjectAddress.toString().trim().length !== 0){

		 var projectAddress = JSON.parse(req.body.shipToProjectAddress);

		 if( projectAddress !== false){

			 shipToProjectAddress = projectAddress;

		 }else{
			if(req.body.addressLine1 !== undefined && req.body.addressLine2 !== undefined && req.body.city !== undefined &&
			   req.body.state !== undefined && req.body.pincode !== undefined &&
			   req.body.addressLine1 !== null && req.body.addressLine2 !== null  && req.body.city !== null &&
			   req.body.state !== null && req.body.pincode !== null &&
			   req.body.city.toString().trim().length !== 0 &&
			   req.body.state.toString().trim().length !== 0 && req.body.pincode.toString().trim().length !== 0){

			   shipToProjectAddress = false;
			   shippingAddress.addressLine1 = req.body.addressLine1;
			   shippingAddress.addressLine2 = req.body.addressLine2;
			   shippingAddress.city = req.body.city;
			   shippingAddress.state = req.body.state;
			   shippingAddress.pincode = req.body.pincode;
			}else{
				resJson = {
					    "http_code" : "500",
						"message" : "There should be atleast one input for the address."
				};
				logger.error(ip + " " + TAG + "There should be atleast one input for the address." + JSON.stringify(resJson));
				return callback(true,resJson);
			}
		 }
	}

	if(req.body.noOfQuotationsDesiredRange !== undefined && req.body.noOfQuotationsDesiredRange !== null &&
	   req.body.noOfQuotationsDesiredRange.toString().trim().length !== 0){

		noOfQuotationsDesiredRange = req.body.noOfQuotationsDesiredRange;
	}

	if(req.body.packingAndFreightRequirements !== undefined && req.body.packingAndFreightRequirements !== null &&
	   req.body.packingAndFreightRequirements.toString().trim().length !== 0){

		packingAndFreightRequirements = req.body.packingAndFreightRequirements;
	}

	var deactivationDate = parseInt(req.body.deactivationDate);

	var deactDate = moment().add(deactivationDate, 'days');
	var dateISO = new Date(deactDate);

	var advanceAmtSelected = null;
	var advanceAmount = null;

	if(req.body.advancePaymentSelected !== undefined && req.body.advancePaymentAmount !== undefined &&
	   req.body.advancePaymentSelected !== null && req.body.advancePaymentAmount !== null &&
	   req.body.advancePaymentSelected.toString().trim().length !== 0 && req.body.advancePaymentAmount.toString().trim().length !== 0){

		advanceAmtSelected = JSON.parse(req.body.advancePaymentSelected);
		advanceAmount = req.body.advancePaymentAmount;
	}
	
	//This code is pertaining to the AFQ Changes.
	var productDetails = null;
	
	if(req.body.productDetails !== undefined && req.body.productDetails !== null &&
			   req.body.productDetails.length !== 0){
		try{
			productDetails = JSON.parse(req.body.productDetails);
		}catch(e){
			logger.debug(ip + " " + TAG + " Parsing Product Details Error Ignore." + JSON.stringify(e));
			productDetails = req.body.productDetails;
		}	
	}
	
	var inquirySource = null;
	var platformSource = null;
	
	if(req.body.inquirySource !== undefined && req.body.platformSource !== undefined &&
	   req.body.inquirySource !== null && req.body.platformSource !== null &&
	   req.body.inquirySource.toString().trim().length !== 0 && req.body.platformSource.toString().trim().length !== 0){

		inquirySource = req.body.inquirySource;
		platformSource = req.body.platformSource;
	}
	
	var InquiryId;

	var companyId = null, companyName = null;
	//Checking companyId and companyName.
	if(req.body.companyId !== undefined && req.body.companyId !== null && req.body.companyId.toString().trim().length !== 0){
		var companyId = parseInt(req.body.companyId);
	}

	if(req.body.companyName !== undefined && req.body.companyName !== null && req.body.companyName.toString().trim().length !== 0){
		var companyName = req.body.companyName;
	}

	var getCompanyInput = {
		"company_id": companyId,
		"customer_id": parseInt(req.body.customerSession.id)
	};

	//Fetching company details from magento.
	magento.getCompanyDetailsFromMagento(getCompanyInput, function(error, mresult){

	if(!error){
	
	var companyDetails = {
		"companyData": {
			"company_name": "",
			"customer_ids": "",
			"tin_number": "",
			"pan_number": "",
			"service_tax_number": "",
			"street_1": "",
			"street_2": "",
			"city": "",
			"state": "",
			"pincode": "",
			"proprietor_name": "",
			"established_year": ""
		}
	};		

	//Get magento result data and assinging to companyDetails variable.
	if(companyId !== null){
		
		companyDetails.companyData.company_name = mresult.companyData.company_name;
		companyDetails.companyData.street_1 = mresult.companyData.street_1;
		companyDetails.companyData.street_2 = mresult.companyData.street_2;
		companyDetails.companyData.city = mresult.companyData.city;
		companyDetails.companyData.state = mresult.companyData.state;
		companyDetails.companyData.pincode = mresult.companyData.pincode;
	} 

	//checking weather verified or not.
	if(req.body.customerSession.company_ids !== null){
		for(var i = 0; i < req.body.customerSession.company_ids.length; i++){
			if(req.body.customerSession.company_ids[i].company_id == companyId){
				companyDetails.companyData["verification_status"] = req.body.customerSession.company_ids[i].status;
				break;
			}
		}
		companyDetails.companyData["companyId"] = companyId;
	}
	else{
		companyDetails.companyData["companyId"] = companyId;
		companyDetails.companyData["verification_status"] = "NA";
	}

	generateInquiryId(req, inquirySource, companyDetails, function(err, result){

	  if(!err){

		InquiryId = result;

		var doc = {
			"inquiryEntity": {
				"inquiryId": result,
				"inquiryVersion": 1,
				"inquirySource": inquirySource, 
				"platformSource": platformSource,
				"productDetails": productDetails,
				"associatedCompanyId": companyId,  
				"associatedbuilderId": parseInt(req.body.customerSession.id),
				"customerFirstName": req.body.customerSession.first_name,
		        "customerLastName": req.body.customerSession.last_name,
		        "companyName": companyName,
				"projectSelected": projSelected,
				"associatedProjectId": projectId,
				"associatedProjectType": projectType,
				"associatedProjectName": projectName,
				"suppliersChosen": suppliersChosen,
				"quoteFromMSupplySuppliers": quoteFromMSupplySuppliers,
				"inquiryTimestamp": new Date(),
				"inquiryAttachmentFilePathS3": "",
				"detailsOfRequirement": detailsOfRequirement,
				"remarks": detailsOfRequirement,
				"categories": categoriesChosen,
				"deliveryByDate": deliveryByDate,
				"targetPriceForQuotation": targetPriceForQuotation,
				"targetPriceForQuotationCurrency": "INR",
				"packingAndFreightRequirements": packingAndFreightRequirements,
				"paymentModes": paymentModes,
				"creditDaysNeeded": creditDaysNeeded,
				"advancePayment": advanceAmtSelected,
				"advancePaymentAmount": advanceAmount,
				"shipToProjectAddress":shipToProjectAddress,
				"shippingAddress": shippingAddress,
				"inquiryDeactivationDate": dateISO,
				"inquiryStatus": "Open",
				"noOfQuotationsDesiredRange": noOfQuotationsDesiredRange
			}
		};

		var colInquiries = db.collection("InquiryMaster");
		var colBuilder = db.collection("Builder");

		colInquiries.insert(doc, {w:1}, function(err, mresult) {
			if(err){
				resJson = {
					    "http_code" : "500",
						"message" : "Placing an Inquiry failed. Please re-try.."
				};
				logger.error(ip + " " + TAG + " Placing an Inquiry failed. Please re-try..  During insert of Inquiry Object." + JSON.stringify(err));
				return callback(false, resJson);
			}else {
				//Create the excel of selected suppliers.
				//Create PDF if project is chosen.
				//Attach the Inquiry file uploaded as an attachment.
				//Trigger an email to CRM team regarding inquiry.
				//Upload the Inquiry Attachment to s3 and update the URL in the DB for that specific Inquiry.
			//console.log("persona: "+req.body.customerSession.persona+", has "+suppliersChosen.length+" suppliers choosen, "+categoriesChosen.length+" categories.");
			//var mysuppliersChosen = JSON.parse(suppliersChosen);
			//var myCategories = JSON.parse(categoriesChosen);
			//console.log("mysuppliersChosen: "+mysuppliersChosen.length);
			//console.log("myCategories: "+myCategories.length);	
			if(suppliersChosen.length !== 0 && suppliersChosen[0] !== ""){
				//console.log("went inside if, companyId: "+companyId);
				taskArray.push(
					function(callback){
				        var xlsxColumns = [
				             		      { header: 'Sl no', key: 'slno', width: 5},
				             		      { header: 'Supplier Id', key: 'supplierId', width: 15},
				             		      { header: 'Company Name', key: 'companyName', width: 20},
				             		      { header: 'Categories Chosen For', key: 'categories', width: 20},
				             		      { header: 'Mobile Number', key: 'mobileNumber', width: 15},
				             		      { header: 'Email', key: 'email', width: 20},
				             		      { header: 'City Name', key: 'city', width: 15},
				             		      { header: 'State', key: 'state', width: 15},
				             		     { header: 'Pincode', key: 'pincode', width: 15}
				             		    ];

				        colBuilder.findOne({"builderEntity.profileInfo.accountInfo.companyId": companyId},
				        		{"_id":0, "builderEntity.mySuppliers.suppliersIds": 1}, function(err, sResult){

					       var rows = [];
					       var count = 1;

					       for(var i=0; i<suppliersChosen.length; i++){

					    	 for(var j=0; j<sResult.builderEntity.mySuppliers.suppliersIds.length; j++){
					    		if(suppliersChosen[i].supplierId === sResult.builderEntity.mySuppliers.suppliersIds[j].supplierId){
							        var suppllierData = {
						        		"slno": count,
						        		"supplierId": sResult.builderEntity.mySuppliers.suppliersIds[j].supplierId,
						        		"categories": suppliersChosen[i].categories,
						        		"companyName": sResult.builderEntity.mySuppliers.suppliersIds[j].companyName,
						        		"mobileNumber": sResult.builderEntity.mySuppliers.suppliersIds[j].mobileNumber,
						        		"email": sResult.builderEntity.mySuppliers.suppliersIds[j].email,
						        		"city": sResult.builderEntity.mySuppliers.suppliersIds[j].city,
						        		"state": sResult.builderEntity.mySuppliers.suppliersIds[j].state,
						        		"pincode": sResult.builderEntity.mySuppliers.suppliersIds[j].pincode
							        };
							        rows.push(suppllierData);
							        count++;
							        break;
					    		}else{
					    			continue;
					    		}
					    	 }
					       }

					        var pathToCreate = "/usr/NodeJslogs/rfqdocs/supplier_" + req.body.customerSession.id + ".xlsx";
					        var destFileName = "SupplierList.xlsx";

					        createExcel(xlsxColumns, rows, pathToCreate, "suppliersList", function(err, result){
					        	if(!err){
					        		var fileAttachments = [];
					        		fileAttachments.push({path: pathToCreate, type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", name: destFileName})
					        		var response = {
					        			"http_code" : "200",
					        			"message" : fileAttachments
					        		}
					        		callback(false, response);
					        	}else{
					        		var response = {
					        			"http_code" : "500",
					        			"message" : "Creation of Excel Failed"
						        	};
					        		callback(true, response);
					        	}
					        });
				        });
					}
				);
			}

		if(projSelected){
		  taskArray.push(
			function(callback){

				//Code for creating the PDF.
				var options = { format: 'A3',"orientation": "portrait" };
				var attachmentFilename = "/usr/NodeJslogs/rfqdocs/project_" + req.body.customerSession.id + ".pdf";
				projectpdf.getInquiryProjectPDF(req, companyId, projectId, projectType, companyDetails, function(err, presult){
					if(!err){
						pdf.create(presult, options).toFile(attachmentFilename, function(err, buffer) {
							if(!err)
							{
								var fileAttachments = [];
								var destFileName = "ProjectDetails.pdf";
				        		fileAttachments.push({path: attachmentFilename, type:"application/pdf", name: destFileName})
								var response = {
				        			"http_code" : "200",
				        			"message" : fileAttachments
					        	}
				        		logger.debug(TAG + " PDF Creation is sucessful." + JSON.stringify(response));
					        	callback(false, response);
							}
							else
							{
								var response = {
				        			"http_code" : "500",
				        			"message" : "PDF Creation failed."
					        	}
				        		logger.debug(TAG + " PDF Creation failed." + JSON.stringify(err));
					        	callback(true, response);
							}
				        });
					}else{
						var response = {
			        			"http_code" : "500",
			        			"message" : "PDF Creation failed."
			        	}
		        		logger.debug(TAG + " PDF Creation failed getInquiryProjectPDF function call." + JSON.stringify(err));
			        	callback(true, response);
					}
				});
			});
		}

		var attachmentBuilder = [];

		if(req.files !== undefined){
			if(req.files.file !== undefined){
				if(req.files.file.size !== 0){
					//console.log("Got file to upload.");
					taskArray.push(
					  function(callback){
						var source = req.files.file.path;
						var destination = "/usr/NodeJslogs/rfqdocs/" + req.files.file.name;
						var pathToUpload = "/" + s3.BUCKET_NAME + "/builder" + req.body.customerSession.id + "/Inquiries"
						fse.copy(source, destination, function (err) {
						  if(!err){
							  var filesToUpload = [];
								filesToUpload.push({
								   "typeOfFile": "inquiryText",
								   //Change the s3 upload Path.
								   "pathToUpload": pathToUpload,
								   "acl": "public-read",
								   "filePath": req.files.file.path,
								   "fileName": new Date() + req.files.file.name
								});

								s3Upload.intializeS3(filesToUpload, function(err, result){
									if(!err){
										var url = result.message[0].url;
										colInquiries.update({"inquiryEntity.inquiryId":InquiryId},
											{$set:{"inquiryEntity.inquiryAttachmentFilePathS3":url}},function(err, fResult){
											if(!err){
												var fileAttachments = [];
												var type = mime.lookup(destination);
												var destFileName = req.files.file.name;
								        		fileAttachments.push({path: destination, type:type, name: destFileName})
								        		attachmentBuilder.push({path: destination, type:type, name: destFileName});
												var response = {
								        			"http_code" : "200",
								        			"message" : fileAttachments
									        	}
								        		logger.debug(TAG + " s3 upload and update to DB is sucessful." + JSON.stringify(response));
									        	callback(false, response);
											}else{
												var response = {
								        			"http_code" : "500",
								        			"message" : "Update of the s3 Image URL Failed."
									        	}
												logger.error(TAG + " s3 upload is successful but the update to DB is failed." + JSON.stringify(response));
									        	callback(true, response);
											}
										});
									}else{
										var response = {
							        			"http_code" : "500",
							        			"message" : "Upload of the file to s3 Failed."
							        		}
										logger.error(TAG + " s3 upload is failed while uploading Inquiry sheet." + JSON.stringify(response));
							        	callback(true, response);
									}
								});
						  }else{
							  var response = {
			        			"http_code" : "500",
			        			"message" : "Copy of File Failed before the s3 upload is performed."
				        	}
							logger.error(TAG + " Copy File failed before uploading to s3." + JSON.stringify(response));
				        	callback(false, response);
						  }
						});
					  }
					);
				}
			}
		}

		ExecuteParallel(taskArray, function(err, results){
			if(!err){
				var attachment = [];
				inquiryCRM.getHTMLBodyForCRM(req, InquiryId, companyDetails, function(err, emailBodyText){
					if(!err){
						attachment.push({data: emailBodyText, alternative:true});
						for(var i=0; i<results.length; i++){
							if(results[i].message.length !== undefined && results[i].message.length > 0){
								attachment.push(results[i].message[0]);
							}
						}
						//Email Details for the CRM Team.

						var subjectEmail = "Enquiry ID# " + InquiryId + " received on mSupply RFQ Platform";
						var fromEmail = "support@msupply.com";
						var ccEmails = "";
						var bccEmails = "";
						var toEmails = emails.rfqEmailIds[env].rfqInquiries;
						//var toEmails = "<pradeep@msupply.com>,<shashidhar@msupply.com>,<pavitra@msupply.com>,<Sanjayj@msupply.com>,<sravanthi_c@msupply.com>,<archana_c@msupply.com>,<reena_c@msupply.com>,<sangamma_c@msupply.com>";
						
						if(attachment.length > 1){
							genericNotifications.sendEmailwithAttachment(fromEmail, toEmails, ccEmails, bccEmails, subjectEmail, attachment, function(error, result){
								if(!error)
								{
									//Email Details for the Builder/Customer.
									var subjectEmailb = "Enquiry ID# " + InquiryId + " received on mSupply RFQ Platform";
									var fromEmailb = "support@msupply.com";
									var ccEmails = "";
									var bccEmails = "";
									//Email ID needs to be changed to customer email ID
									var toEmailsb = req.body.customerSession.email;

									var attachmentsb = [];
								  
								   inquiryBuilder.getHTMLBodyForBuilder(req, InquiryId, companyDetails, function(err, emailBodyTextBuilder){
									if(!err){
									   attachmentsb.push({data: emailBodyTextBuilder, alternative:true});
									   if(attachmentBuilder.length !== 0){
										   attachmentsb.push(attachmentBuilder[0]);
										   attachment.push(attachmentBuilder[0]);

										   genericNotifications.sendEmailwithAttachment(fromEmailb, toEmailsb, ccEmails, bccEmails, subjectEmailb, attachmentsb, function(errora, result){
											if(!errora){

												var message = "Hi "+ req.body.customerSession.first_name +", %0AWe have received your enquiry on mSupply.com [Enquiry ID: "+ InquiryId +"]. Our team will get in touch with you to take the enquiry forward.";
												
												genericNotifications.sendSms(req.body.customerSession.mobile_number, message, function(errm, resultm){
													if(!errm){
														logger.debug(TAG + " SMS has been triggered to builder with mobile number : " + req.body.customerSession.mobile_number);
													}else{
														logger.debug(TAG + " SMS trigger failed has been triggered to builder with mobile number : " + req.body.customerSession.mobile_number);
													}
												});

											   //Removing files generated.
												for(var i = 0; i < attachment.length; i++)
												{
													if(attachment[i].path === undefined){
														continue;
													}
													fs.unlink(attachment[i].path, function(err, result){
														if(err){
															logger.error(TAG + " unable to remove attachment file generated.");
														}
														else{
															logger.debug(TAG + " removed file generated Inquiries.");
														}
													});
												}
												logger.debug(TAG + " Email Trigger Success for the builder Inquiry trigger.");
											}else{
												logger.error(TAG + " Email Trigger failed for the builder Inquiry trigger.");
											}

											resJson = {
												    "http_code" : "200",
													"message" : "Inquiry has been received."
											};
											logger.debug(ip + " " + TAG + " Placing an Inquiry Successful in with email attachment block." + JSON.stringify(resJson));
											return callback(false, resJson);

										   });
									   }else {
										   genericNotifications.sendPlainEmail(fromEmailb, toEmailsb, ccEmails, bccEmails, subjectEmailb, emailBodyTextBuilder, function(errorb, result){
											   if(!errorb){

												   var message = "Hi "+ req.body.customerSession.first_name +", %0AWe have received your enquiry on mSupply.com [Enquiry ID: "+ InquiryId +"]. Our team will get in touch with you to take the enquiry forward.";

												   genericNotifications.sendSms(req.body.customerSession.mobile_number, message, function(errm, resultm){
														if(!errm){
															logger.debug(TAG + " SMS has been triggered to builder with mobile number : " + req.body.customerSession.mobile_number);
														}else{
															logger.debug(TAG + " SMS trigger failed has been triggered to builder with mobile number : " + req.body.customerSession.mobile_number);
														}
													});

													logger.debug(TAG + " Email Trigger Success for the builder Inquiry trigger.");
												}else{
													logger.error(TAG + " Email Trigger failed for the builder Inquiry trigger.");
												}

											   resJson = {
													    "http_code" : "200",
														"message" : "Inquiry has been received."
												};
												logger.debug(ip + " " + TAG + " Placing an Inquiry Successful in without email attachment block." + JSON.stringify(resJson));
												return callback(false, resJson);
										   });
									   }
									}else{
										var response = {
						        			"http_code" : "500",
						        			"message" : "HTML retrieval failed for the Builder email trigger."
							        	}
						        		logger.debug(TAG + " HTML retrieval failed for the Builder email trigger." + JSON.stringify(error));
							        	callback(true, response);
									}
								   });
								}else{
									var response = {
						        			"http_code" : "200",
						        			"message" : "Inquiry has been received."
						        	}
					        		logger.error(TAG + " Email Trigger failed for the CRM Inquiry trigger." + JSON.stringify(error));
						        	callback(false, response);
								}
							});
						}else{
							genericNotifications.sendPlainEmail(fromEmail, toEmails, ccEmails, bccEmails, subjectEmail, emailBodyText, function(error, result){
								if(!error)
								{
									//Email Details for the Builder/Customer.
									var subjectEmailb = "Enquiry ID# " + InquiryId + " received on mSupply RFQ Platform";
									var fromEmailb = "support@msupply.com";
									//Email ID needs to be changed to customer email ID
									var toEmailsb = req.body.customerSession.email;

									var attachmentsb = [];

								   inquiryBuilder.getHTMLBodyForBuilder(req, InquiryId, companyDetails, function(err, emailBodyTextBuilder){
									if(!err){
									   attachmentsb.push({data: emailBodyTextBuilder, alternative:true});

									   if(attachmentBuilder.length !== 0){
										   attachmentsb.push(attachmentBuilder[0]);
										   attachment.push(attachmentBuilder[0]);

										   genericNotifications.sendEmailwithAttachment(fromEmailb, toEmailsb, ccEmails, bccEmails, subjectEmailb, attachmentsb, function(errora, result){
											if(!errora){

												var message = "Hi "+ req.body.customerSession.first_name +", %0AWe have received your enquiry on mSupply.com [Enquiry ID: "+ InquiryId +"]. Our team will get in touch with you to take the enquiry forward.";
												
												genericNotifications.sendSms(req.body.customerSession.mobile_number, message, function(errm, resultm){
													if(!errm){
														logger.debug(TAG + " SMS has been triggered to builder with mobile number : " + req.body.customerSession.mobile_number);
													}else{
														logger.debug(TAG + " SMS trigger failed has been triggered to builder with mobile number : " + req.body.customerSession.mobile_number);
													}
												});

											   //Removing files generated.
												for(var i = 0; i < attachment.length; i++)
												{
													if(attachment[i].path === undefined){
														continue;
													}
													fs.unlink(attachment[i].path, function(err, result){
														if(err){
															logger.error(TAG + " unable to remove attachment file generated.");
														}
														else{
															logger.debug(TAG + " removed file generated Inquiries.");
														}
													});
												}
												logger.debug(TAG + " Email Trigger Success for the builder Inquiry trigger.");
											}else{
												logger.error(TAG + " Email Trigger failed for the builder Inquiry trigger.");
											}

											resJson = {
												    "http_code" : "200",
													"message" : "Inquiry has been received."
											};
											logger.debug(ip + " " + TAG + " Placing an Inquiry Successful in with email attachment block." + JSON.stringify(resJson));
											return callback(false, resJson);

										   });
									   }else {
									   		
										   genericNotifications.sendPlainEmail(fromEmailb, toEmailsb, ccEmails, bccEmails, subjectEmailb, emailBodyTextBuilder, function(errorb, result){
											   if(!errorb){

												   var message = "Hi "+ req.body.customerSession.first_name +", %0AWe have received your enquiry on mSupply.com [Enquiry ID: "+ InquiryId +"]. Our team will get in touch with you to take the enquiry forward.";

												   genericNotifications.sendSms(req.body.customerSession.mobile_number, message, function(errm, resultm){
														if(!errm){
															logger.debug(TAG + " SMS has been triggered to builder with mobile number : " + req.body.customerSession.mobile_number);
														}else{
															logger.debug(TAG + " SMS trigger failed has been triggered to builder with mobile number : " + req.body.customerSession.mobile_number);
														}
													});

												   //Removing files generated.
													for(var i = 0; i < attachment.length; i++)
													{
														if(attachment[i].path === undefined){
															continue;
														}
														fs.unlink(attachment[i].path, function(err, result){
															if(err){
																logger.error(TAG + " unable to remove attachment file generated.");
															}
															else{
																logger.debug(TAG + " removed file generated Inquiries.");
															}
														});
													}
													logger.debug(TAG + " Email Trigger Success for the builder Inquiry trigger.");
												}else{
													logger.error(TAG + " Email Trigger failed for the builder Inquiry trigger.");
												}

											   resJson = {
													    "http_code" : "200",
														"message" : "Inquiry has been received."
												};
												logger.debug(ip + " " + TAG + " Placing an Inquiry Successful in without email attachment block." + JSON.stringify(resJson));
												return callback(false, resJson);
										   });
									   }
									}else{
										var response = {
						        			"http_code" : "500",
						        			"message" : "HTML retrieval failed for the Builder email trigger."
							        	}
						        		logger.debug(TAG + " HTML retrieval failed for the Builder email trigger." + JSON.stringify(error));
							        	callback(true, response);
									}
								   });
								}else{
									var response = {
						        			"http_code" : "200",
						        			"message" : "Inquiry has been received."
						        	}
					        		logger.error(TAG + " Email Trigger failed for the CRM Inquiry trigger." + JSON.stringify(error));
						        	callback(false, response);
								}
							});
						}
					}else{
						var response = {
			        			"http_code" : "500",
			        			"message" : "HTML retrieval failed for the CRM Inquiry trigger."
			        	}
		        		logger.debug(TAG + " HTML retrieval failed for the CRM Inquiry trigger." + JSON.stringify(error));
			        	callback(true, response);
					}
				});
			}
		});
		  }
	   });
	  }else{
	    resJson = {
			    "http_code" : "500",
				"message" : "Unexpected Server Error while Creating the Inquiry. Please Retry."
		};
		logger.error(ip + " " + TAG + " Generating the Inquiry ID Failed using counters. " + JSON.stringify(err));
		return callback(false, resJson);
	  }
	});
	}else{
		var response = {
    			"http_code" : "500",
    			"message" : "Magento call for fetching the Data for company failed."
    	}
		logger.debug(TAG + " Fetching the comapny Details Failed." + JSON.stringify(error));
    	callback(true, response);
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

function createExcel(columns, rows, pathToCreate, sheetName, callback){

	 var workbook = new Excel.Workbook();

     var sheet = workbook.addWorksheet(sheetName);

     sheet.columns = columns;

     for(var i = 0; i < rows.length; i++){
    	 sheet.addRow(rows[i]);
     }

     workbook.xlsx.writeFile(pathToCreate)
     .then(function(err) {
    	if(!err){
	    	callback(false, pathToCreate);
    	}else{
	    	callback(true, "Creating and Writing to excel file failed");
    	}
     });
}


function ExecuteParallel(taskArray, callback){

	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;

	async.parallel(taskArray, function(err, results){
		if(!err){

			logger.debug(TAG + " async parallel tasks for Enquiries Successful." + JSON.stringify(err));
			return callback(false, results);
		}else{

			logger.error(TAG + " async parallel tasks for Enquiries failed." + JSON.stringify(err));
			return callback(false, results);
		}
});
}

//Function to generate Inquiry id
function generateInquiryId(req, inquirySource, companyDetails, callback){
  var db = dbConfig.mongoDbConn;
  
  var persona = req.body.customerSession.persona;
  var verification = companyDetails.companyData.verification_status;
 
  	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;

	db.collection('counters').findAndModify({ _id: 'inquiryMaster' },null, { $inc: { seq: 1 } }, {new: true}, function(err, result){
    if (err) {
      logger.error(TAG + "Fetching the counters value for Inquiry Failed.");
      callback(true);
    } else {
      logger.debug(TAG + "Fetching the counters value for Inquiry Sucess.");
      //Based on persona the Inquiry Id will be generated.
      if( persona !== "Owner" && verification === "approved"){
    	  callback(false, "E" + new Date().getFullYear() + ('00000' + result.value.seq).slice(-6));
      }else{
    	  callback(false, "A" + new Date().getFullYear() + ('00000' + result.value.seq).slice(-6));
      }
    }
  });
}


//Function for getting statistics for the Inquiry.
exports.inquiryStatistics =
function inquiryStatistics (req, callback){

	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;

	//Variable for Mongo DB Connection.
	var db = dbConfig.mongoDbConn;

	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;

	logger.info(ip + " " + TAG + " Entering Inquiry Statistics.");

	//Log the request.
	logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));

	//Declare the response
	var resJson;

	var companyIds = fetchCompanyIds.getCompanyIds(req.body.customerSession);
	
	//var companyIds = [3790,3799]
	var colInquiry = db.collection("InquiryMaster");
	var colBuilder = db.collection("Builder");

	var statistics = {
		"totalInquiryCount" : "0",
		"totalSuppliersCount" : "0",
		"lastInquiryRaised" : "0",
		"recentInquiries" : []
	};

	var query = [];

    query.push(
		{
			$match: {
				$or: [{
					"inquiryEntity.associatedbuilderId": parseInt(req.body.customerSession.id)
				}, {
					"inquiryEntity.associatedCompanyId": {
						$in: companyIds
					}
				}]
			}
		}
	);

	query.push({$sort : {"inquiryEntity.inquiryTimestamp" : -1}});

	query.push({$project:{"inquiryEntity.inquiryId": 1 , "inquiryEntity.inquiryTimestamp": 1, "inquiryEntity.associatedProjectName": 1, "inquiryEntity.inquiryDeactivationDate": 1, "inquiryEntity.inquiryStatus": 1,"inquiryEntity.associatedCompanyId": 1, "inquiryEntity.companyName": 1}});

	colInquiry.aggregate(query, function(err, result){

		if(!err){

			if(result.length > 0){
				statistics.totalInquiryCount = result.length;
				statistics.recentInquiries = result.slice(0,5);
			}

			colBuilder.aggregate([{$match :{"builderEntity.profileInfo.accountInfo.companyId":{$in: companyIds }}},
					    {$project: {noOfSuppliers: {$size: "$builderEntity.mySuppliers.suppliersIds"}}}], function(err, sResult){

				if(!err && sResult.length > 0){

					statistics.totalSuppliersCount = 0;
					for(var j=0;j<sResult.length;j++){	
						statistics.totalSuppliersCount += sResult[j].noOfSuppliers;
					}

					if(result.length > 0){

						var dateInFormat = moment(statistics.recentInquiries[0].inquiryEntity.inquiryTimestamp).format('YYYY-MM-DD HH:mm:ss');

						var days = moment(dateInFormat, "YYYY-MM-DD HH:mm:ss").fromNow();

						statistics.lastInquiryRaised = days;

						for(var i=0; i<statistics.recentInquiries.length; i++){
							statistics.recentInquiries[i].inquiryEntity.inquiryTimestamp = moment(statistics.recentInquiries[i].inquiryEntity.inquiryTimestamp).format('Do MMM YYYY');
							statistics.recentInquiries[i].inquiryEntity.inquiryDeactivationDate = moment(statistics.recentInquiries[i].inquiryEntity.inquiryDeactivationDate).format('Do MMM YYYY');
						}
					}

					resJson = {
						    "http_code" : "200",
							"message" : statistics
					};
					logger.debug(ip + " " + TAG + " Fetching statistics for Inquiry Successful." + JSON.stringify(resJson));
					return callback(false, resJson);

				}else{
					resJson = {
						    "http_code" : "500",
							"message" : "Inputs Doesn't match with our records. Please Retry."
					};
					logger.error(ip + " " + TAG + "Inputs Doesn't match with our records. Please Retry. Builder Collection." + JSON.stringify(resJson));
					return callback(true,resJson);

				}
			});

		}else {
			resJson = {
				    "http_code" : "500",
					"message" : "Unexpected Server Error while fulfilling the request. Please Retry."
			};
			logger.error(ip + " " + TAG + "Unexpected Server Error while fulfilling the request. Please Retry. Inquiry Statistics Master Collection." + JSON.stringify(resJson));
			return callback(true,resJson);

		}
	});
}

//Function for getting list of Inquiries for the Builder.
exports.inquiryList =
function inquiryList (req, callback){

	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;

	//Variable for Mongo DB Connection.
	var db = dbConfig.mongoDbConn;

	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;

	logger.info(ip + " " + TAG + " Entering Inquiry Listing API.");

	//Log the request.
	logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));

	//Declare the response
	var resJson;

	var colInquiry = db.collection("InquiryMaster");

	var statistics = {
		"recentInquiries" : []
	};

	var query = [];

	//Fething inquiries based on persona.
	if(req.body.customerSession.persona === 'Owner'){
		query.push(
			{
				$match: {
					"inquiryEntity.associatedbuilderId": parseInt(req.body.customerSession.id)
				}
			}
		);
	}
	else{

		var companyIds = fetchCompanyIds.getCompanyIds(req.body.customerSession);

		query.push(
			{
				$match: {
					$or: [{
						"inquiryEntity.associatedbuilderId": parseInt(req.body.customerSession.id)
					}, {
						"inquiryEntity.associatedCompanyId": {
							$in: companyIds
						}
					}]
				}
			}
		);
	}

	query.push({$sort : {"inquiryEntity.inquiryTimestamp" : -1}});

	query.push({$project:{"inquiryEntity.inquiryId": 1 , "inquiryEntity.associatedCompanyId": 1, "inquiryEntity.companyName": 1, "inquiryEntity.inquiryTimestamp": 1, "inquiryEntity.associatedProjectName": 1, 
	"inquiryEntity.inquiryDeactivationDate": 1, "inquiryEntity.inquiryStatus": 1, "inquiryEntity.associatedProjectId": 1, 
	"inquiryEntity.associatedProjectType": 1, "inquiryEntity.projectSelected": 1, "inquiryEntity.inquiryAttachmentFilePathS3": 1,
	"inquiryEntity.detailsOfRequirement": 1, "inquiryEntity.paymentModes": 1, "inquiryEntity.creditDaysNeeded": 1, "inquiryEntity.productDetails": 1}});

	colInquiry.aggregate(query, function(err, result){

		if(!err){

			statistics.recentInquiries = result;
			for(var i=0; i<statistics.recentInquiries.length; i++){
				statistics.recentInquiries[i].inquiryEntity.inquiryTimestamp = moment(statistics.recentInquiries[i].inquiryEntity.inquiryTimestamp).format('Do MMM YYYY');
				statistics.recentInquiries[i].inquiryEntity.inquiryDeactivationDate = moment(statistics.recentInquiries[i].inquiryEntity.inquiryDeactivationDate).format('Do MMM YYYY');
			}
			
			//If the Attachment exists append Yes else No in AFQ. 
			for(var i=0; i<statistics.recentInquiries.length; i++){

				if(statistics.recentInquiries[i].inquiryEntity.inquiryAttachmentFilePathS3 !== ""){
					statistics.recentInquiries[i].inquiryEntity.inquiryAttachmentFilePathS3 = "Yes";
				}else{
					statistics.recentInquiries[i].inquiryEntity.inquiryAttachmentFilePathS3 = "No";
				}
			}
			
			resJson = {
			    "http_code" : "200",
				"message" : statistics
			};

			logger.debug(ip + " " + TAG + " Fetching list of Inquiry Successful AFQ." + JSON.stringify(resJson));
			return callback(false, resJson);
			
		}else {
			resJson = {
				    "http_code" : "500",
					"message" : "Inputs Doesn't match with our records. Please Retry."
			};
			logger.error(ip + " " + TAG + "Inputs Doesn't match with our records. Please Retry. Inquiry Master Collection." + JSON.stringify(resJson));
			return callback(true,resJson);
		}
	});	
};

//Function for getting statistics for the dashboard.
exports.dashboardStatistics = 
function dashboardStatistics (req, callback){
	
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;
	
	logger.info(ip + " " + TAG + " Entering Dashboard Statistics.");
	
	//Log the request.
	logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));

	//Declare the response
	var resJson;
			
	var colInquiry = db.collection("InquiryMaster");
	var colBuilder = db.collection("Builder");

	var statistics = {
		"totalInquiryCount" : 0,
		"totalSuppliersCount" : 0,
		"totalProjectsCount" : 0
	};
	
	var companyIds = fetchCompanyIds.getCompanyIds(req.body.customerSession);
		
		colInquiry.find({
			$or: [
			{
		  		"inquiryEntity.associatedCompanyId": {
		  			$in: companyIds
		  		}
			},
			{
				"inquiryEntity.associatedbuilderId": parseInt(req.body.customerSession.id)
			}
			]
		}).toArray(function(err, result){
		if(!err){
			
			if(result !== null &&  result.length >0){
				
				statistics.totalInquiryCount = statistics.totalInquiryCount + result.length;
			}	
			
			colBuilder.aggregate([{$match :{"builderEntity.profileInfo.accountInfo.companyId": { $in: companyIds }}},
			   {$project:{countRes:{ $size:"$builderEntity.projects.residential"},
			    countCom:{ $size:"$builderEntity.projects.commercial"},
			    noOfSuppliers: {$size: "$builderEntity.mySuppliers.suppliersIds"}}}], function(err, sResult){

				if(!err && sResult.length > 0){

					for(var i=0;i<sResult.length;i++)
					{
						statistics.totalSuppliersCount =  statistics.totalSuppliersCount + sResult[i].noOfSuppliers;
						statistics.totalProjectsCount = statistics.totalProjectsCount + (sResult[i].countRes + sResult[i].countCom);
					}
					
					resJson = {	
						    "http_code" : "200",
							"message" : statistics
					};
					logger.debug(ip + " " + TAG + " Fetching statistics for Inquiry Successful." + JSON.stringify(resJson));
					return callback(false, resJson);
					
				}else{
					resJson = {
						    "http_code" : "500",
							"message" : "Inputs Doesn't match with our records. Please Retry."
					};
					logger.error(ip + " " + TAG + "Inputs Doesn't match with our records. Please Retry. Builder Collection." + JSON.stringify(resJson));
					return callback(true,resJson);
				}
			});
			
		}else {
			resJson = {
				    "http_code" : "500",
					"message" : "Unexpected Server Error while fulfilling the request. Please Retry."
			};
			logger.error(ip + " " + TAG + "Unexpected Server Error while fulfilling the request. Please Retry. Inquiry Statistics Master Collection." + JSON.stringify(resJson));
			return callback(true,resJson);
			
		}
	});
};


