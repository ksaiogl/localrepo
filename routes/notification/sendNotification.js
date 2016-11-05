var TAG = "sendNotification - ";
var log = require('../../Environment/log4js.js');
var request = require("request");
var async = require('async');
var underscore = require('underscore');
var fs = require('fs');
var pdf = require('html-pdf');
var emailIdConfig = require('../helpers/emailIdConfig.js');
var env = require('../../Environment/env.js').env;

//Required for generating html content for notifications.
var genericNotifications = require('../notification/generic_SMS_Email_Notifications.js');
var notificationConfig = require('../notification/notificationConfig.json')

//support email of msupply, using which all emails will be sent.
//var MSUPPLY_SUPPORT_EMAIL = "support@msupply.com";
//var TO_MSUPPLY_SUPPORT_EMAIL = "abhinandan@msupply.com";
//var TO_MSUPPLY_SUPPORT_EMAIL1 = "sravanthi_c@msupply.com";
// below statements are for Prod (Comment the above three statments)
//var TO_MSUPPLY_SUPPORT_EMAIL = "fulfillment@msupply.com";
//var TO_MSUPPLY_SUPPORT_EMAIL1 = "abhinandan@msupply.com";
//var TO_MSUPPLY_SUPPORT_EMAIL2 = "debasis@msupply.com";
//var TO_MSUPPLY_SUPPORT_EMAIL3 = "pallav@msupply.com";

var MSUPPLY_SUPPORT_EMAIL = emailIdConfig.emailIds[env].fromEmailMsupplySupport;
var TO_MSUPPLY_SUPPORT_EMAIL = emailIdConfig.emailIds[env].notificationServiceSupportEmail;
var BCC_MSUPPLY_SUPPORT_EMAIL = emailIdConfig.emailIds[env].notificationServiceSupportEmail_bcc;
var TO_CUSTOMER_SUPPORT_EMAIL = emailIdConfig.emailIds[env].customerSupportEmail;
var TO_SUPPLIER_SUPPORT_EMAIL = emailIdConfig.emailIds[env].supplierSupportEmail;

exports.sendEmailAndSMSNotification = function(req, callback){

	var resJson;
	var logger = log.logger_notification;

	logger.debug(TAG + " ------ Request recieved for sendEmailNotification. ------");
	logger.debug(TAG + "req.body :-" + JSON.stringify(req.body));
	//Validate the Input parameters.
	if( !(req.body === undefined ||
		req.body.notificationIdentifier === undefined || req.body.notificationIdentifier === null ||
		req.body.toEmails === undefined ||
		req.body.toMobileNumber === undefined  ||
		req.body.smsBodyParams === undefined  ||
		req.body.emailBodyParams === undefined ||
		req.body.emailAttachment === undefined))
	{
	    var notificationIdentifier = req.body.notificationIdentifier;
	    var fromEmail  = MSUPPLY_SUPPORT_EMAIL;
	    var emailBodyParams = req.body.emailBodyParams;
	    var smsBodyParams = req.body.smsBodyParams;
	   
	    // check if ccEmails is available, else assign null.
	    if(req.body.ccEmails === undefined)
	    {
	    	var ccEmails = [];
	    }
	    else
	    {
	    	var ccEmails = req.body.ccEmails;
	    };

	    // check if bccEmails is available, else assign null.
	    if(req.body.bccEmails === undefined)
	    {
	    	var bccEmails = [];
	    }
	    else
	    {
	    	var bccEmails = req.body.bccEmails;
	    };

	    //Assign toEmails
	    if (req.body.toEmails === null || req.body.toEmails === "")
	    {
	    	var toEmails = [];
	    }
	    else
	    {
	    	var toEmails = req.body.toEmails;
	    };

	    var toMobileNumber = req.body.toMobileNumber;
	    // If email needs to be copied in the customer email, add support email to toEmails array.
	    if (notificationConfig.emailAndSMSNotifications[notificationIdentifier].defaultSupportEmailToBeCopied)
	    {
	    	for(var k = 0; k < TO_MSUPPLY_SUPPORT_EMAIL.length; k++)
		    {
		    	ccEmails.push(TO_MSUPPLY_SUPPORT_EMAIL[k]);
		    }

		    //if there are specific customer/supplier support email to be added to cc
			var app = notificationConfig.emailAndSMSNotifications[notificationIdentifier].app;	   
			if(app === "Customer")
			{	
			    for(var j = 0; j < TO_CUSTOMER_SUPPORT_EMAIL.length; j++)
			    {
			    	ccEmails.push(TO_CUSTOMER_SUPPORT_EMAIL[j]);
			    };
			}    

		    if(app === "Supplier")
			{	
			    for(var j = 0; j < TO_SUPPLIER_SUPPORT_EMAIL.length; j++)
			    {
			    	ccEmails.push(TO_SUPPLIER_SUPPORT_EMAIL[j]);
			    };
			} 
	    };

	    // If bcc email needs to be copied in the customer email, add support email to toEmails array.
	    if (notificationConfig.emailAndSMSNotifications[notificationIdentifier].bccSupportEmailToBeCopied)
	    {
	    	for(var k = 0; k < BCC_MSUPPLY_SUPPORT_EMAIL.length; k++)
		    {
		    	bccEmails.push(BCC_MSUPPLY_SUPPORT_EMAIL[k]);
		    }
	    };

	    
	    // get the array of ccEmails emailID in the format '<abc@abc.com>, <xyz@abc.com>'
		if (ccEmails.length > 0)
		{	
		    for(var i = 0; i < ccEmails.length; i++)
		    {
		    	ccEmails[i] = "<" + ccEmails[i] + ">";
		    }
		    ccEmails = ccEmails.join();
		}
		else
		{
			ccEmails = "";
		};

		// get the array of bccEmails emailID in the format '<abc@abc.com>, <xyz@abc.com>'
		if (bccEmails.length > 0)
		{	
		    for(var i = 0; i < bccEmails.length; i++)
		    {
		    	bccEmails[i] = "<" + bccEmails[i] + ">";
		    }
		    bccEmails = bccEmails.join();
		}
		else
		{
			bccEmails = "";
		};

	    // get the array of emailID in the format '<abc@abc.com>, <xyz@abc.com>'
		if (toEmails.length > 0)
		{
		    for(var i = 0; i < toEmails.length; i++)
		    {
		    	toEmails[i] = "<" + toEmails[i] + ">";
		    }
		    toEmails = toEmails.join();
		}
		else
		{
			//If toEmails doesnt exist, then copy the bccEmails to toEmails, so that the emails are sent successfully to support team.
			//toEmails = "";
			toEmails = bccEmails;
		};    
		    
	    logger.debug(TAG + "Final toEmails: " + toEmails);
	    logger.debug(TAG + "Final ccEmails: " + ccEmails);
	    logger.debug(TAG + "Final bccEmails: " + bccEmails);
	    //Notification can be controlled by setting notificationToBeSent to true or false in notificationConfig.
	    var notificationToBeSent = notificationConfig.emailAndSMSNotifications[notificationIdentifier].notificationToBeSent;
		if(req.body.emailAttachment === false && notificationToBeSent === true)
		{
			async.parallel([
			function(asyncCallback){

				if(notificationConfig.emailAndSMSNotifications[notificationIdentifier].appEmailHtmlTemplatePath != null)
				{
					var emailCategory = "appOwner"; //based on this field, look for customer or supplier template path.
				    gethtmlBody(notificationIdentifier, emailCategory, emailBodyParams, function(err, htmlEmailBody, subjectEmail){
				    	if(!err)
				    	{
					        genericNotifications.sendPlainEmail(fromEmail, toEmails, ccEmails, bccEmails, subjectEmail, htmlEmailBody, function(error, result){
					            if(!error)
					            {
					               logger.debug(TAG + " appOwner(Customer/Supplier/SP) email Successfully sent for - notificationIdentifier: " + notificationIdentifier + ", emailSubject: " + subjectEmail);
					               return asyncCallback(false);
					            }
					            else
					            {
					                logger.error(TAG + " Error sending appOwner(Customer/Supplier/SP) email for - notificationIdentifier: " + notificationIdentifier + ", emailSubject: " + subjectEmail + ", error: " + error);
					            	return asyncCallback(true);
					            }
					        });
					    }
					    else
					    {
					    	logger.error(TAG + "Error in gethtmlBody appOwner(Customer/Supplier/SP) for - notificationIdentifier: " + notificationIdentifier + ", emailSubject: " + subjectEmail + ", error: " + err);
					    	return asyncCallback(true);
					    }
				    });
				}
				else
				{
					return asyncCallback(false);
				}
			},
			function(asyncCallback){
				if(notificationConfig.emailAndSMSNotifications[notificationIdentifier].supportEmailHtmlTemplatePath != null)
				{
					var emailCategory = "support";
				    gethtmlBody(notificationIdentifier, emailCategory, emailBodyParams, function(err, htmlEmailBody, subjectEmail){
				    	if(!err)
				    	{
					        genericNotifications.sendPlainEmail(fromEmail, toEmails, ccEmails, bccEmails, subjectEmail, htmlEmailBody, function(error, result){
					            if(!error)
					            {
					               logger.debug(TAG + " support email Successfully sent for - notificationIdentifier: " + notificationIdentifier + ", emailSubject: " + subjectEmail);
					               return asyncCallback(false);
					            }
					            else
					            {
					                logger.error(TAG + " Error sending support emailfor - notificationIdentifier: " + notificationIdentifier + ", emailSubject: " + subjectEmail + ", error: " + error);
					            	return asyncCallback(true);
					            }
					        });
					    }
					    else
					    {
					    	logger.error(TAG + "Error in gethtmlBody (support) for - notificationIdentifier: " + notificationIdentifier + ", emailSubject: " + subjectEmail + ", error: " + err);
					    	return asyncCallback(true);
					    }
				    });
				}
				else
				{
					return asyncCallback(false);
				}
			},
			function(asyncCallback){
				//check if SMS is enabled for the notificationIdentifier in notificationconfig.
				if(notificationConfig.emailAndSMSNotifications[notificationIdentifier].smsToBeSent)
				{
				    //Mobile number in array is formated into comma separated numbers.
				    toMobileNumber = toMobileNumber.join();
				    getSMSBody(notificationIdentifier, smsBodyParams, function(err, message){
				    	if(!err)
				    	{
						    genericNotifications.sendSms(toMobileNumber, message, function(error, result){
						        if(!error)
						        {
						            logger.debug(TAG + "Successfully sent sms to mobile no: "+ toMobileNumber);
						            return asyncCallback(false);
						        }
						        else
						        {
						            logger.error(TAG + "Error sending sms to mobile no: "+ toMobileNumber);
						            return asyncCallback(true);
						        }
						    });
						}
						else
					    {
					    	logger.error(TAG + "Error in getSMSBody for - notificationIdentifier: " + notificationIdentifier);
					    	return asyncCallback(true);
					    }
					});
				}
				else
				{
					return asyncCallback(false);
				}
			}
			],
			function(error){
				if(!error)
				{
					resJson = {
							    "http_code" : "200",
								"message" : "Notification Sent Successfully for notificationIdentifier: " + notificationIdentifier
						};
					logger.debug(TAG + "Notification Sent Successfully for notificationIdentifier: " + notificationIdentifier);
					logger.debug(TAG + "**********Notification Service completed Successfully**********");
					return callback(false, resJson);
				}
				resJson = {
							    "http_code" : "500",
								"message" : "Error sending Notification to notificationIdentifier: " + notificationIdentifier
						};
				logger.error(TAG + " Error sending Notification to notificationIdentifier: " + notificationIdentifier);
				logger.error(TAG + "**********Notification Service completed with Error**********");
				return callback(true, resJson);
			});
		}
		else if (req.body.emailAttachment === true && notificationToBeSent === true)
		{
			logger.debug(TAG + "Inside 'emailAttachment === true' block");
			var email_atchmts_folder = "/usr/NodeJslogs/email_attchements/";
			var attachment = [];
			var subjectEmail = null;
			var options = { format: 'Letter',"orientation": "landscape" };

			// Need to add async series to check if there is Support and AppOwner Mentioned together.
    		if(notificationConfig.emailAndSMSNotifications[notificationIdentifier].appEmailHtmlTemplatePath != null)
			{
				var emailCategory = "appOwner";
			}
			else
			{
				var emailCategory = "support";
			}

			async.forEachSeries(req.body.attachmentParams, function(attachmentParams, asyncCallback)
            {
				var randomNumber = Math.floor(Math.random() * (9999999999) + 100);
	    		var attachmentFilename = email_atchmts_folder+randomNumber+ "_" +Date.now()+".pdf";
	    		var actualattachmentFileName = attachmentParams.emailAttachmentFileName;

				gethtmlBody(notificationIdentifier, emailCategory, emailBodyParams, function(err, htmlEmailBody, emailSubject){
			    	if(!err)
			    	{
			    		//get the dynamic JS file path for require based on the notificationIdentifier
						var emailAttachmentTemplatePath = notificationConfig.emailAndSMSNotifications[notificationIdentifier].emailAttachmentTemplatePath;
						var attachmentTemplatePath = require(emailAttachmentTemplatePath);
						attachment.push({data: htmlEmailBody, alternative:true});
						subjectEmail = emailSubject;
						logger.debug(TAG + "Before pdf.create block");
					  	pdf.create(attachmentTemplatePath.getEmailBody(attachmentParams), options).toFile(attachmentFilename, function(err, buffer) {
							if(!err)
							{
								logger.debug(TAG + " created attachmentFilename file for notificationIdentifier :" + notificationIdentifier);
								attachment.push({path: buffer.filename, type:"application/pdf", name: actualattachmentFileName +".pdf"});
								return asyncCallback();
							}
							else
							{
								logger.error(TAG + " unable to create attachmentFilename file for notificationIdentifier :" + notificationIdentifier);
								logger.error(TAG + "**********Service request completed with Error************");
								resJson = {
										    "http_code" : "500",
											"message" : "Error sending email with attachment, Err: " + err
										};
								return asyncCallback(true);
							}
			            });
				    }
				    else
				    {
				    	logger.error(TAG + "Error in gethtmlBody for - notificationIdentifier: " + notificationIdentifier + ", emailSubject: " + subjectEmail + ", error: " + err);
				    	logger.error(TAG + "**********Service request completed with Error************");
				    	resJson = {
									    "http_code" : "500",
										"message" : "Error in retrieving html template for email, Err: " + err
									};
				        return asyncCallback(true);
				    }
				});
			},
            //Final Function to be called upon completion of all functions.
            function(error)
            {
                if(!error)
                {
                	genericNotifications.sendEmailwithAttachment(fromEmail, toEmails, ccEmails, bccEmails, subjectEmail, attachment, function(error, result){
			            if(!error)
			            {
			               logger.debug(TAG + " email Successfully sent for - notificationIdentifier: " + notificationIdentifier + ", emailSubject: " + subjectEmail);
			               //Removing pdf files generated.
                            for(var i = 0; i < attachment.length; i++)
                            {
                                if(attachment[i].path === undefined){
                                    continue;
                                }
                                fs.unlink(attachment[i].path, function(err, result){
                                    if(err){
                                        logger.error(TAG + " unable to remove attachment file generated for notificationIdentifier :" + notificationIdentifier);
                                    }
                                    else{
                                        logger.debug(TAG + " removed manifest file generated for notificationIdentifier :" + notificationIdentifier);
                                    }
                                });
                            }

							//check if SMS is enabled for the notificationIdentifier in notificationconfig.
							if(notificationConfig.emailAndSMSNotifications[notificationIdentifier].smsToBeSent)
							{
							    //Mobile number in array is formated into comma separated numbers.
							    toMobileNumber = toMobileNumber.join();
							    getSMSBody(notificationIdentifier, smsBodyParams, function(err, message){
							    	if(!err)
							    	{
									    genericNotifications.sendSms(toMobileNumber, message, function(error, result){
									        if(!error)
									        {
									            logger.debug(TAG + "Successfully sent sms to mobile no: "+ toMobileNumber);
									        }
									        else
									        {
									            logger.error(TAG + "Error sending sms to mobile no: "+ toMobileNumber);
									        }
									    });
									}
									else
								    {
								    	resJson = {
										    "http_code" : "500",
											"message" : "Error sending SMS, Err: " + error
										};
								    	logger.error(TAG + "Error in getSMSBody for - notificationIdentifier: " + notificationIdentifier);
								    	return callback(true, resJson);
								    }
								});
							}	
							logger.debug(TAG + "**********Service request completed successfully**********");
			                resJson = {
								    "http_code" : "200",
									"message" : "email and SMS sent successfully for notificationIdentifier: " + notificationIdentifier
								};
			                return callback(false, resJson);
			            }
			            else
			            {
			                logger.error(TAG + " Error sending emailfor - notificationIdentifier: " + notificationIdentifier + ", emailSubject: " + subjectEmail + ", error: " + error);
			            	logger.error(TAG + "**********Service request completed with Error************");
			            	resJson = {
								    "http_code" : "500",
									"message" : "Error sending email, Err: " + error
								};
			            	return callback(true, resJson);
			            }
			        });
                }
                else
                {
                    logger.error(TAG + "Error sending emails with Manifest sent for 3PL to fullfilment team: error: " + error);
                	return callback(true, resJson);
                }
            });
		}
		else if (req.body.emailAttachment === "PreGeneratedPDF" && notificationToBeSent === true)
		{
			logger.debug("Inside PreGeneratedPDF Attachment Block");
			var email_atchmts_folder = "/usr/NodeJslogs/PreGenerated_attachments/";
			var attachment = [];
			var subjectEmail = null;

			// Need to add async series to check if there is Support and AppOwner Mentioned together.
    		if(notificationConfig.emailAndSMSNotifications[notificationIdentifier].appEmailHtmlTemplatePath != null)
			{
				var emailCategory = "appOwner";
			}
			else
			{
				var emailCategory = "support";
			}

			async.forEachSeries(req.body.attachmentParams, function(attachmentParams, asyncCallback)
            {
	    		var attachmentFilename = attachmentParams.emailAttachmentFileName;
	    		var actualattachmentFileName = attachmentParams.emailAttachmentFileName;

				gethtmlBody(notificationIdentifier, emailCategory, emailBodyParams, function(err, htmlEmailBody, emailSubject){
			    	if(!err)
			    	{
			    		//get the dynamic JS file path for require based on the notificationIdentifier
						attachment.push({data: htmlEmailBody, alternative:true});
						subjectEmail = emailSubject;
						var attachmentPath = email_atchmts_folder+attachmentFilename;
						attachment.push({path: attachmentPath, type:"application/pdf", name: actualattachmentFileName});
						return asyncCallback();
				    }
				    else
				    {
				    	logger.error(TAG + "Error in gethtmlBody for - notificationIdentifier: " + notificationIdentifier + ", emailSubject: " + subjectEmail + ", error: " + err);
				    	logger.error(TAG + "**********Service request completed with Error************");
				    	resJson = {
									    "http_code" : "500",
										"message" : "Error in retrieving html template for email, Err: " + err
									};
				        return asyncCallback(true);
				    }
				});
			},
            //Final Function to be called upon completion of all functions.
            function(error)
            {
                if(!error)
                {
                	genericNotifications.sendEmailwithAttachment(fromEmail, toEmails, ccEmails, bccEmails, subjectEmail, attachment, function(error, result){
			            if(!error)
			            {
			               logger.debug(TAG + " email Successfully sent for - notificationIdentifier: " + notificationIdentifier + ", emailSubject: " + subjectEmail);
                           logger.debug(TAG + "**********Service request completed successfully**********");

							//check if SMS is enabled for the notificationIdentifier in notificationconfig.
							if(notificationConfig.emailAndSMSNotifications[notificationIdentifier].smsToBeSent)
							{
							    //Mobile number in array is formated into comma separated numbers.
							    toMobileNumber = toMobileNumber.join();
							    getSMSBody(notificationIdentifier, smsBodyParams, function(err, message){
							    	if(!err)
							    	{
									    genericNotifications.sendSms(toMobileNumber, message, function(error, result){
									        if(!error)
									        {
									            logger.debug(TAG + "Successfully sent sms to mobile no: "+ toMobileNumber);
									            	resJson = {
													    "http_code" : "200",
														"message" : "email and sms sent successfully for notificationIdentifier: " + notificationIdentifier
													};
									            return callback(false, resJson);
									        }
									        else
									        {
									            logger.error(TAG + "Error sending sms to mobile no: "+ toMobileNumber);
									            resJson = {
													    "http_code" : "500",
														"message" : "Error sending email and sms for notificationIdentifier: " + notificationIdentifier
													};
									            return callback(true, resJson);
									        }
									    });
									}
									else
								    {
								    	logger.error(TAG + "Error in getSMSBody for - notificationIdentifier: " + notificationIdentifier);
								    	resJson = {
													    "http_code" : "500",
														"message" : "Error sending email and sms for notificationIdentifier: " + notificationIdentifier
													};
									    return callback(true, resJson);
								    }
								});
							}
							else
							{
								logger.debug(TAG + "Successfully sent email, SMS is not required");
								resJson = {
									    "http_code" : "200",
										"message" : "email and sms sent successfully for notificationIdentifier: " + notificationIdentifier
									};
					            return callback(false, resJson);
							}
			            }
			            else
			            {
			                logger.error(TAG + " Error sending emailfor - notificationIdentifier: " + notificationIdentifier + ", emailSubject: " + subjectEmail + ", error: " + error);
			            	logger.error(TAG + "**********Service request completed with Error************");
			            	resJson = {
								    "http_code" : "500",
									"message" : "Error sending email, Err: " + error
								};
			            	return callback(true, resJson);
			            }
			        });
                }
                else
                {
                    logger.error(TAG + "Error sending emails with Manifest sent for 3PL to fullfilment team: error: " + error);
                	return callback(true, resJson);
                }
            });
		}
		else
		{
			resJson = {
					    "http_code" : "200",
						"message" : "Notification is disabled for notificationIdentifier: " + notificationIdentifier
					};
			logger.debug(TAG + "Notification is disabled for notificationIdentifier: " + notificationIdentifier);
			logger.debug(TAG + "**********Notification Service completed Successfully**********");
			return callback(false, resJson);
		}
	}
	else
	{
		resJson = {
			    "http_code" : "400",
				"message" : "Bad or ill-formed request.."
		};
		logger.error(TAG + "Invalid inputs: " + JSON.stringify(req.body));
		logger.error(TAG + "**********Service request completed with Error************");
		return callback(true, resJson);
	}
}

function gethtmlBody(notificationIdentifier, emailCategory, emailBodyParams, callback){

	var logger = log.logger_notification;
	try
	{
		//based on the emailCategory get the EmailHtmlTemplatePath for html js file.
		if(emailCategory === "appOwner"){
			var htmlTemplatePath = notificationConfig.emailAndSMSNotifications[notificationIdentifier].appEmailHtmlTemplatePath;
		}
		else if (emailCategory === "support"){
			var htmlTemplatePath = notificationConfig.emailAndSMSNotifications[notificationIdentifier].supportEmailHtmlTemplatePath;
		};
		//dynamically require the js file.
		var htmlTemplate = require(htmlTemplatePath);
		htmlTemplate.getHtml(emailBodyParams, function(err, htmlEmailBody, emailSubject){
			if(!err)
			{
				logger.debug(TAG + "html body retrieved successfully for - notificationIdentifier: " + notificationIdentifier + ", emailBodyParams: " + emailBodyParams);
				return callback(false, htmlEmailBody, emailSubject);
			}
			else
			{
				logger.error(TAG + "Error getting html body - notificationIdentifier: " + notificationIdentifier + ", emailBodyParams: " + emailBodyParams + "error: " + err);
				return callback(true, err, err);
			}
		});
	}
	catch(e)
  	{
    	console.log(TAG + "Exception in sendNotification- gethtmlBody - " + e);
    	logger.error(TAG + "Exception in sendNotification- gethtmlBody- :- error :" + e);
		return callback(true, "Exception error");
  	}
}

function getSMSBody(notificationIdentifier, smsBodyParams, callback){

	var logger = log.logger_notification;
	try
	{
		//require the js file with SMS template.
		var smsBodyTemplatePath = notificationConfig.emailAndSMSNotifications[notificationIdentifier].smsBodyTemplatePath;
		var smsTemplate = require(smsBodyTemplatePath);
		smsTemplate.getSMSBody(smsBodyParams, function(err, smsBody){
			if(!err)
			{
				logger.debug(TAG + "smsBody retrieved successfully for - notificationIdentifier: " + notificationIdentifier + ", smsBodyParams: " + smsBodyParams);
				return callback(false, smsBody);
			}
			else
			{
				logger.error(TAG + "Error getting smsBody - notificationIdentifier: " + notificationIdentifier + ", smsBodyParams: " + smsBodyParams);
				return callback(true, err);
			}
		});
	}
	catch(e)
  	{
    	console.log(TAG + "Exception in sendNotification- getSMSBody - " + e);
    	logger.error(TAG + "Exception in sendNotification- getSMSBody- :- error :" + e);
		return callback(true, "Exception error");
  	}
}
