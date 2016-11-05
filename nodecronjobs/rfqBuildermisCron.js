var TAG = "rfqCompanyMISCron - ";
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
var builderMisDailyReport = require('../routes/notification/emailhtmls/rfqjs/BuilderMisDailyReport.js');
var genericNotifications = require('../routes/notification/generic_SMS_Email_Notifications.js');

//---------------------------------------------------------------------------
// "inquryMIS" -> Function gets all the inquiries raised till now and send it to internal team. 
// Scheduling the Function "CompanyMIS" Everyday at 9:45 AM (Monday - Sunday)
// sec*  Min* Hours* dayofMonth* month* dayOfWeek*

var builderMIS = new CronJob('00 45 03 * * *', function() {

	var logger = log.logger_jobs;
	logger.info("-------------------------------------------------------");
	logger.info(TAG + "Node CronJob 'CompanyMIS' started on: EST-> " + new Date() + ", IST-> " + timezoneConversions.toIST(new Date()));
	
	
	var db = dbConfig.mongoDbConn;	
	var builderColl = db.collection("Builder");

	var notifyCol = db.collection("RfqCronJobsCounter");
	//To compare weather notification already sent.
	var notificationCurrentDate = new Date(new Date().setHours(0, 0, 0, 0));

	notifyCol.find({}).toArray(function(error, result){
		if(error)
		{
			logger.error(TAG + " data access from RfqCronJobsCounter collection failed.");
			logger.info(TAG + " Node CronJob 'CompanyMIS' stopped.");
		}
		else if(!error && result.length > 0)
		{
			logger.debug(TAG + " data access from RfqCronJobsCounter collection successfull.");
			logger.debug(TAG + " checking weather report is alredy sent or not.");

			if(result[0].CronJobsCounter.builderMisDailyReport === null || result[0].CronJobsCounter.builderMisDailyReport < notificationCurrentDate){
				
				logger.debug(TAG + " report not yet sent.");
				logger.debug(TAG + " started creating Company mis report.");
				//updating field builderMisDailyReport to keep track of weather this report is alredy sent or not. 
				notifyCol.update({}, {$set :{"CronJobsCounter.builderMisDailyReport": new Date()}}, function(error, result){
					if(error){
						logger.error(TAG + " error in updating builderMisDailyReport field in RfqCronJobsCounter.");
					}
					else{
						logger.debug(TAG + " builderMisDailyReport field in RfqCronJobsCounter updated successfull.");
					}
				});

				logger.debug(TAG + " fetching all records from builder collection.");
				//creating report.
				var taskArray = [];

				builderColl.find({}).toArray(function(error, result){
					if(error){
						logger.error(TAG + " Error while fetching builder details in Builder collection, Error :"+error);
						logger.info(TAG + " Node CronJob 'CompanyMIS' stopped.");
					}
					else if(result.length < 1) {
						logger.error(TAG + "  There is no data in Builder collection.");
						logger.info(TAG + " Node CronJob 'CompanyMIS' stopped.");
					}
					else{
						logger.info(TAG + " Data found in builder collection.");
						var slno = 0;
						logger.info(TAG + " started pushing function to array.");
						result.forEach(function(element, index, array){
							var companyDetials = {};
							slno = slno + 1;
							companyDetials["slno"] = slno;
							companyDetials["companyId"] = element.builderEntity.profileInfo.accountInfo.companyId;
							companyDetials["companyName"] = null;
							companyDetials["establishedYear"] = null;
							companyDetials["addressline1"] = null;
							companyDetials["addressline2"] = null;
							companyDetials["city"] = null;
							companyDetials["state"] = null;
							companyDetials["pincode"] = null;

							taskArray.push(function(callback){
								//Magento Customer ID is the Company ID which should be passed.
								magento.getCustomerDetailsFromMagento(element.builderEntity.profileInfo.accountInfo.companyId, function(error, mresult){
									if(!error && mresult.body.companyData){

										companyDetials.companyName = (mresult.body.companyData.company_name ? mresult.body.companyData.company_name : "");
										companyDetials.establishedYear = mresult.body.companyData.established_year;
										companyDetials.addressline1 = mresult.body.companyData.street_1;
										companyDetials.addressline2 = mresult.body.companyData.offical_address.street_2;
										companyDetials.city = mresult.body.companyData.offical_address.city;
										companyDetials.state = mresult.body.companyData.offical_address.state;
										companyDetials.pincode = (mresult.body.companyData.offical_address.pincode === 0 ? '' : mresult.body.companyData.offical_address.pincode);
										
										callback(false, companyDetials);
									}
									else{
										//logger.error(TAG + " builder details not found for builder id: "+element.builderEntity.profileInfo.accountInfo.builderId);
										callback(false, companyDetials);
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
			         		      { header: 'Sl no', key: 'slno', width: 10},
			         		      { header: 'Company ID', key: 'companyId', width: 15},
			         		      { header: 'Company Name', key: 'companyName', width: 25},
			         		      { header: 'established Year', key: 'establishedYear', width: 25},
			         		      { header: 'Address line1', key: 'addressline1', width: 35},
			         		      { header: 'Address line2', key: 'addressline2', width: 35},
			         		      { header: 'City', key: 'city', width: 25},
			         		      { header: 'State', key: 'state', width: 25},
			         		      { header: 'Pincode', key: 'pincode', width: 20}
			         		    ];

			         		    var pathToCreate = "/usr/NodeJslogs/rfqdocs/CompanyMIS.xlsx";
						        var destFileName = "CompanyMIS.xlsx";
						        createExcel(xlsxColumns, result, pathToCreate, "Company List", function(err, result){
						        	if(!err){
						        		logger.debug(TAG + " successfull created excel report.");
						        		var fileAttachments = [];
						        		fileAttachments.push({path: result, type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", name: destFileName})

						        		logger.debug(TAG + " started creating email html body.");
						        		//Creating email with attachment.
						        		builderMisDailyReport.getHtml("", function(error, emailBody, emailSubject){
						        			if(!error){
						        				logger.debug(TAG + " successfull created email html body.");
						        				fileAttachments.push({data: emailBody, alternative:true});
						        				var fromEmail = "support@msupply.com";
												var ccEmails = "";
					    						var bccEmails = "";
												var toEmails = emailsConfig.rfqEmailIds[env].rfqBuildersConsolidatedReport;
												
												logger.debug(TAG + " started sending email with attachment.");
												if(fileAttachments.length > 1){
													genericNotifications.sendEmailwithAttachment(fromEmail, toEmails, ccEmails, bccEmails, emailSubject, fileAttachments, function(error, result){
														if(!error)
														{
															logger.debug(TAG + " successfully sent email with attachment.");
															logger.info(TAG + " Node CronJob 'CompanyMIS' stopped.");
														}
														else{
															logger.error(TAG + " error in sending email with attachment.");
															logger.info(TAG + " Node CronJob 'CompanyMIS' stopped.");
														}
													});
												}

						        			}
						        			else{
						        				logger.error(TAG + " error while creating email html body.");
						        				logger.info(TAG + " Node CronJob 'CompanyMIS' stopped.");
						        			}
						        		});
						        	}
						        	else{
						        		logger.error(TAG + " error while creating excel report.");
						        		logger.info(TAG + " Node CronJob 'CompanyMIS' stopped.");
						        	}	
						        });
							}
							else{
								logger.error(TAG + " error in executing all tasks in array parallelly.");
								logger.info(TAG + " Node CronJob 'CompanyMIS' stopped.");
							}
						});
					}
				});
			}
			else{
				logger.debug(TAG + " company mis report already sent.");
				logger.info(TAG + " Node CronJob 'CompanyMIS' stopped.");
			}
		}
	});	
});

//builderMIS.start();

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