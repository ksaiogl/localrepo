var TAG = "rfqInquirymisCron - ";
// The JS file is required in app.js, so that the page is loaded on start and function is invoked for the First time.
var async = require('async');
var Excel = require('exceljs');
var CronJob = require('cron').CronJob;

var emailsConfig = require('../routes/helpers/emailIdConfig.js');
var env = require('../Environment/env.js').env;
var dbConfig = require('../Environment/mongoDatabase.js');
var log = require('../Environment/log4js.js');
var notifications = require('../routes/helpers/notifications.js');
var timezoneConversions = require('../routes/helpers/timezoneConversions.js');
var magento = require('../routes/magento/magentoAPI.js');
var inquiryMisDailyReport = require('../routes/notification/emailhtmls/rfqjs/InquiryMisDailyReport.js');
var genericNotifications = require('../routes/notification/generic_SMS_Email_Notifications.js');

//---------------------------------------------------------------------------
// "inquryMIS" -> Function gets all the inquiries raised till now and send it to internal team. 
// Scheduling the Function "inquryMIS" Everyday at 9:30 AM (Monday - Sunday)
// sec*  Min* Hours* dayofMonth* month* dayOfWeek*


	var inquryMIS = new CronJob('00 30 03 * * *', function() {
	var logger = log.logger_jobs;
	logger.info("-------------------------------------------------------");
	logger.info(TAG + "Node CronJob 'inquryMIS' started on: EST-> " + new Date() + ", IST-> " + timezoneConversions.toIST(new Date()));
	
	
	var db = dbConfig.mongoDbConn;	
	var inquiryMasterColl = db.collection("InquiryMaster");

	var notifyCol = db.collection("RfqCronJobsCounter");
	//To compare weather notification already sent.
	var notificationCurrentDate = new Date(new Date().setHours(0, 0, 0, 0));

	notifyCol.find({}).toArray(function(error, result){
		if(error)
		{
			logger.error(TAG + " data access from RfqCronJobsCounter collection failed.");
			logger.info(TAG + " Node CronJob 'inquryMIS' stopped.");
		}
		else if(!error && result.length > 0)
		{
			logger.debug(TAG + " data access from RfqCronJobsCounter collection successfull.");
			logger.debug(TAG + " checking weather report is alredy sent or not.");

			if(result[0].CronJobsCounter.inquiryMisDailyReport === null || result[0].CronJobsCounter.inquiryMisDailyReport < notificationCurrentDate){
				logger.debug(TAG + " report not yet sent.");
				logger.debug(TAG + " started creating inquiry mis report.");
				
				logger.debug(TAG + " updating counter to identify weather report is already sent or not.");
				//updating field inquiryMisDailyReport to keep track of weather this report is alredy sent or not. 
				notifyCol.update({}, {$set :{"CronJobsCounter.inquiryMisDailyReport": new Date()}}, function(error, result){
					if(error){
						logger.error(TAG + " error in updating inquiryMisDailyReport field in RfqCronJobsCounter.");
					}
					else{
						logger.debug(TAG + " inquiryMisDailyReport field in RfqCronJobsCounter updated successfull.");
					}
				});

				logger.debug(TAG + " fetching all records from inquiry master collection.");
				//creating report.
				var taskArray = [];
				inquiryMasterColl.find({}).toArray(function(error, result){
					if(error){
						logger.error(TAG + " Error while fetching inquiry details in InquiryMaster collection, Error :"+error);
						logger.info(TAG + " Node CronJob 'inquryMIS' stopped.");
					}
					else if(result.length < 1) {
						logger.error(TAG + "  There is no data in InquiryMaster collection.");
						logger.info(TAG + " Node CronJob 'inquryMIS' stopped.");
					}
					else{
						logger.info(TAG + " Data found in inquiry master collection.");
						logger.debug(TAG + " started creating task array that contains function that will call customer details api.");
						var slno = 0;
						result.forEach(function(element, index, array){
							var inquiryDetails = {};
							slno = slno + 1;
							  inquiryDetails["slno"] = slno;
				              inquiryDetails["inquiryDate"] = timezoneConversions.toIST(element.inquiryEntity.inquiryTimestamp);
				              inquiryDetails["inquiryId"] = element.inquiryEntity.inquiryId;
				              inquiryDetails["inquiryDeactivationDate"] = timezoneConversions.toIST(element.inquiryEntity.inquiryDeactivationDate);
				              inquiryDetails["inquiryStatus"] = element.inquiryEntity.inquiryStatus;
				              inquiryDetails["categories"] = element.inquiryEntity.categories.toString();
				              inquiryDetails["deliverBydate"] = element.inquiryEntity.deliveryByDate;
				              inquiryDetails["paymentMode"] = element.inquiryEntity.paymentModes;
				              inquiryDetails["creditDays"] = element.inquiryEntity.creditDaysNeeded;
				              inquiryDetails["requirement"] = element.inquiryEntity.detailsOfRequirement;
				              inquiryDetails["inquiryStatus"] = element.inquiryEntity.inquiryStatus;
				              inquiryDetails["noOfQuotations"] = element.inquiryEntity.noOfQuotationsDesiredRange;
				              inquiryDetails["attachment"] = element.inquiryEntity.inquiryAttachmentFilePathS3;
				              inquiryDetails["companyId"] = element.inquiryEntity.associatedCompanyId;
				              inquiryDetails["companyName"] = element.inquiryEntity.companyName;
				              inquiryDetails["customerId"] = element.inquiryEntity.associatedbuilderId;
				              inquiryDetails["customerName"] = null;
				              inquiryDetails["mobile"] = null;
				              inquiryDetails["email"] = null;

							//Fetching customer details includes API call, so instead of calling customer details api for each customer one after
							//other, storing function that will do this task in a array, and passing this array to async to execute parallelly. 
							taskArray.push(function(callback){
								//calling function that will get customer details from magento.
								magento.getDetailsOfCustomerFromMagento(element.inquiryEntity.associatedbuilderId, function(error, mresult){
									if((!error)  &&  mresult.body.message.customerData){

										inquiryDetails.customerName = mresult.body.message.customerData.first_name + "  " + mresult.body.message.customerData.last_name ;
					                    inquiryDetails.mobile = mresult.body.message.customerData.mobile_number;
					                    inquiryDetails.email = mresult.body.message.customerData.email;

										if(!element.inquiryEntity.shipToProjectAddress){
											inquiryDetails.shippingAddress_addressLine1 = element.inquiryEntity.shippingAddress.addressLine1;
											inquiryDetails.shippingAddress_addressLine2 = element.inquiryEntity.shippingAddress.addressLine2;
											inquiryDetails.shippingAddress_city = element.inquiryEntity.shippingAddress.city;
											inquiryDetails.shippingAddress_state = element.inquiryEntity.shippingAddress.state;
											inquiryDetails.shippingAddress_pincode = element.inquiryEntity.shippingAddress.pincode;

											callback(false, inquiryDetails);
										}
										else{
											getProjectDetails(element.inquiryEntity.associatedCompanyId, element.inquiryEntity.associatedProjectId, element.inquiryEntity.associatedProjectType, function(error, result){
												
												if(result === null){
													logger.error(TAG + " project details not found for company Id: "+element.inquiryEntity.associatedCompanyId+", projectType: "+element.inquiryEntity.associatedProjectType+", projectId: "+element.inquiryEntity.associatedProjectId);

													inquiryDetails.shippingAddress_addressLine1 = "";
													inquiryDetails.shippingAddress_addressLine2 = "";
													inquiryDetails.shippingAddress_city = "";
													inquiryDetails.shippingAddress_state = "";
													inquiryDetails.shippingAddress_pincode = "";
												}	
												else{
													inquiryDetails.shippingAddress_addressLine1 = result.address1;
													inquiryDetails.shippingAddress_addressLine2 = result.address2;
													inquiryDetails.shippingAddress_city = result.city;
													inquiryDetails.shippingAddress_state = result.state;
													inquiryDetails.shippingAddress_pincode = result.pincode;
												}
												callback(false, inquiryDetails);
											});
										}
									}
									else{
										callback(false, inquiryDetails);
									}
								});
							});
						});

						logger.info(TAG + " finished creating task array.");
						logger.debug(TAG + " started executing functions in task array parallelly.");

						//Finally executing tasks in parallel.
						async.parallelLimit(taskArray, 50, function(error, result){
							if(!error){
								logger.debug(TAG + " successfull executed all tasks in array parallelly.");
								logger.debug(TAG + " started creating excel report.");
								var xlsxColumns = [
			         		        { header: 'Sl no', key: 'slno', width: 5},
			                        { header: 'Inquiry ID', key: 'inquiryId', width: 15},
			                        { header: 'Company ID', key: 'companyId', width: 15},
			                        { header: 'Company Name', key: 'companyName', width: 30},
			                        { header: 'Customer ID', key: 'customerId', width: 15},
			                        { header: 'Customer Name', key: 'customerName', width: 30},
			                        { header: 'Customer Phone', key: 'mobile', width: 15},
			                        { header: 'Customer Email', key: 'email', width: 30},
			                        { header: 'Date of Enquiry', key: 'inquiryDate', width: 15},
			                        { header: 'Requirement Details', key: 'requirement', width: 50},
			                        { header: 'Categories', key: 'categories', width: 30},
			                        { header: 'Deliver by Date', key: 'deliverBydate', width: 20},
			                        { header: 'Payment Mode', key: 'paymentMode', width: 20},
			                        { header: 'Credit Days Needed', key: 'creditDays', width: 25},
			                        { header: 'Shipping Address-Line1', key: 'shippingAddress_addressLine1', width: 30},
			                        { header: 'Shipping Address-Line2', key: 'shippingAddress_addressLine2', width: 30},
			                        { header: 'City', key: 'shippingAddress_city', width: 20},
			                        { header: 'State', key: 'shippingAddress_state', width: 20},
			                        { header: 'Pincode', key: 'shippingAddress_pincode', width: 15},
			                        { header: 'Inquiry Active Till', key: 'inquiryDeactivationDate', width: 15},
			                        { header: 'Inquiry Status', key: 'inquiryStatus', width: 15},
			                        { header: 'No of Quotations Desired', key: 'noOfQuotations', width: 15},
			                        { header: 'Attachment', key: 'attachment', width: 350}
			         		    ];

			         		    var pathToCreate = "/usr/NodeJslogs/rfqdocs/InquiryMIS.xlsx";
						        var destFileName = "InquiryMIS.xlsx";
						        createExcel(xlsxColumns, result, pathToCreate, "Inquiry List", function(err, result){
						        	if(!err){
						        		logger.debug(TAG + " successfull created excel report.");
						        		var fileAttachments = [];
						        		fileAttachments.push({path: result, type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", name: destFileName})

						        		logger.debug(TAG + " started creating email html body.");
						        		//Creating email with attachment.
						        		inquiryMisDailyReport.getHtml("", function(error, emailBody, emailSubject){
						        			if(!error){
						        				logger.debug(TAG + " successfull created email html body.");
						        				fileAttachments.push({data: emailBody, alternative:true});
						        				var fromEmail = "support@msupply.com";
												var ccEmails = "";
					    						var bccEmails = "";
												var toEmails = emailsConfig.rfqEmailIds[env].rfqInquiriesConsolidatedReport;
												
												logger.debug(TAG + " started sending email with attachment.");
												if(fileAttachments.length > 1){
													genericNotifications.sendEmailwithAttachment(fromEmail, toEmails, ccEmails, bccEmails, emailSubject, fileAttachments, function(error, result){
														if(!error)
														{
															console.log("successfully sent email with attachment.")
															logger.debug(TAG + " successfully sent email with attachment.");
															logger.info(TAG + " Node CronJob 'inquryMIS' stopped.");
														}
														else{
															logger.error(TAG + " error in sending email with attachment.");
															logger.info(TAG + " Node CronJob 'inquryMIS' stopped.");
														}
													});
												}

						        			}
						        			else{
						        				logger.error(TAG + " error while creating email html body.");
						        				logger.info(TAG + " Node CronJob 'inquryMIS' stopped.");
						        			}
						        		});
						        	}
						        	else{
						        		logger.error(TAG + " error while creating excel report.");
						        		logger.info(TAG + " Node CronJob 'inquryMIS' stopped.");
						        	}	
						        });
							}
							else{
								logger.error(TAG + " error in executing all tasks in array parallelly.");
								logger.info(TAG + " Node CronJob 'inquryMIS' stopped.");
							}
						});
					}
				});

			}
			else{
				logger.debug(TAG + " inquiry mis report already sent.");
				logger.info(TAG + " Node CronJob 'inquryMIS' stopped.");
			}
		}
		else if(!error && result.length === 0)
		{
			logger.debug(TAG + " RfqCronJobsCounter collection empty.");
			logger.info(TAG + " Node CronJob 'inquryMIS' stopped.");
		}
	});
});

function getProjectDetails(companyId, projectId, projectType, callback){
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	var builderColl = db.collection("Builder");

	//Variable for Logging the messages to the file.
	var logger = log.logger_jobs;
	var finalResult = null;
	builderColl.findOne({"builderEntity.profileInfo.accountInfo.companyId": companyId},
			{"_id": 0, "builderEntity.projects" : 1}, function(error, result){
				if(!error && (result !== null))
				{
					for(var i = 0; i < result.builderEntity.projects[projectType].length; i++){
						if(projectId === result.builderEntity.projects[projectType][i].projectId){
							finalResult = result.builderEntity.projects[projectType][i].address.projectAddress;
							break;
						}
					}
					return callback(false, finalResult);
				}
				else if(!error && (result === null))
				{
					logger.error(TAG + " Invalid Inputs, Inputs doesnt match with the database records, companyId': " + companyId);
					return callback(true, finalResult);
				}
				else
				{
					logger.error(TAG + " Internal Server Error. error: " + error);
					return callback(true, finalResult);
				}
			});	
}

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

inquryMIS.start();