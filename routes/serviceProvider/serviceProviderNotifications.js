//This file contains functions that will help to create body of email.
var TAG = "serviceProviderNotifications.js";
var log = require('../../Environment/log4js.js');
var notifications = require('../helpers/notifications.js');
var request = require("request");
var async = require('async');
var html = require('../emailhtmls/serviceproviderjs/changepasswordbody.js');
var htmlreg = require('../emailhtmls/serviceproviderjs/registrationbody.js');
var htmlprofile = require('../emailhtmls/serviceproviderjs/updateprofilebody.js');
var htmlcustomerreq = require('../emailhtmls/serviceproviderjs/websitecustomerrequests.js');
var pushNotification = require('../helpers/pushNotification.js');
var dbConfig = require('../../Environment/mongoDatabase.js');
var manageNotifications = require('./manageNotifications.js');
var htmlserviceproviderQc = require('../emailhtmls/serviceproviderjs/serviceproviderQcbody.js');
var htmlserviceproviderQcReject = require('../emailhtmls/serviceproviderjs/serviceProviderQcRejectionBody.js');
var htmlserviceproviderLeads = require('../emailhtmls/serviceproviderjs/serviceproviderLeads.js');
var htmlsupportLeads = require('../emailhtmls/serviceproviderjs/supportLeads.js');
var customerLeadsEmail = require('../emailhtmls/serviceproviderjs/customerLeadsEmail.js');
var customerLeadsEmail_spchoosen = require('../emailhtmls/serviceproviderjs/customerLeadsEmail_SPchoosen.js');

//Function that will send email to service provider, notifying successful registration of service provider.
function serviceProviderRegEmailNotification(email, firstName, mobile, password, callback){

	var logger = log.logger_sp;

	logger.debug(TAG + " Registration Email " + email + " " + firstName);

	//Below part will handle inserting this new notification for future use.
	//Get service provider ID for mobile number.
	getServiceProviderId(mobile, function(error, result){
		if(!error){
			//Structure of notification to be stored.
			var notificationArray = [];
			var notificationToStore = {
		        "type" : "others",
		        "title" : "Congrats! You are now registered.",
		        "read" : false,
		        "notificationSentOn" : new Date()
		    }

			notificationArray.push(notificationToStore);
		    //Function to be called to store notification.
			manageNotifications.insertNotificaiton(result.ServiceProviderId, notificationArray, function(error, result){
				//Not handling error.
			});
		}
	});

    //Multiple emails should be in the format '<abc@abc.com>, <xyz@abc.com>'
    var toEmails = email;
    var ccEmails = "";
    var bccEmails = "";
    var fromEmail  = "support@msupply.com";
    var subjectEmail = "Congrats! You are now a service provider on mSupply.com.";
    htmlreg.registrationemailbody(function(bodyEmail){

    	var bodyText = bodyEmail;

    	notifications.sendPlainEmail(fromEmail, toEmails, ccEmails, bccEmails, subjectEmail, bodyText, function(error, result){
            if(error){
                logger.error(TAG + " Error sending service Provider registration email to his emailid " + email + " Error :" + error);
            }
            else{
                logger.debug(TAG + " Successfully sent Service Provider registration email to "+email);
            }
        });
    });

    return callback(false);
}

//Function that will send sms to service provider, notifying successful registration of service provider.
function serviceProviderRegSmsNotification(firstName, mobile, callback){

	var logger = log.logger_sp;

    var message = "Dear Service Provider, Thank You for registering on www.msupply.com. Please check your email for details."

    logger.debug(TAG + " Registration SMS " + mobile + " " + firstName);

    notifications.sendSms(mobile, message, function(error, result){
        if(!error){
            logger.debug(TAG + " Successfully sent service Provider registration sms to mobile no: "+ mobile);
        }
        else{
            logger.error(TAG + " Error sending service Provider registration sms to mobile no: "+ mobile + " Error :" + error);
        }
    });

    return callback(false);
}

//Function that will notify msupply support and supplier regarding successful registration of supplier.
exports.sendRegistrationEmail = function (email, firstName, mobile, password, callback){

	var logger = log.logger_sp;

    logger.debug(TAG + " Initiated notifying Service Provider for Successful Registration.");

    // Function that will call supplierRegEmailNotification function.
    serviceProviderRegEmailNotification(email, firstName, mobile, password, function(error, result){

    });
    // Function that will call supplierRegSmsNotification function.
    serviceProviderRegSmsNotification(firstName, mobile, function(error, result){

    });

    return callback(false);
};


//Function that will notify supplier regarding successful password change of service provider.
exports.notifyOnPasswordChange = function(email, firstName, mobile, callback){

	var logger = log.logger_sp;

    logger.debug(TAG + " Initiated notifying service provider regarding password change.");

	//Below part will handle inserting this new notification for future use.
	//Get service provider ID for mobile number.
	getServiceProviderId(mobile, function(error, result){
		if(!error){
			//Structure of notification to be stored.
			var notificationArray = [];
			var notificationToStore = {
		        "type" : "others",
		        "title" : "mSupply Service Provider App Password updated.",
		        "read" : false,
		        "notificationSentOn" : new Date()
		    }

			notificationArray.push(notificationToStore);
		    //Function to be called to store notification.
			manageNotifications.insertNotificaiton(result.ServiceProviderId, notificationArray, function(error, result){
				//Not handling error.
			});
		}
	});


    //Multiple emails should be in the format '<abc@abc.com>, <xyz@abc.com>'
    var toEmails = email;
    var ccEmails = "";
    var bccEmails = "";
    var fromEmail  = "support@msupply.com";
    var subjectEmail = "mSupply Service Provider App Password updated.";
    html.changepasswordemailbody(firstName,function(bodyEmail){

    	var bodyText = bodyEmail;

	    logger.debug(TAG + " email: "  + email + " mobile: " + mobile + " firstName: " + firstName);

	    //Below function will send email to service provider, notifying successful password change.
	    notifications.sendPlainEmail(fromEmail, toEmails, ccEmails, bccEmails, subjectEmail, bodyText, function(error, result){
	        if(error){
	            logger.error(TAG + " Error sending service provider password change email with emailid " + email +", Error :" + error);
	        }
	        else{
	            logger.debug(TAG + " Successfully sent service provider password change email to " + email);
	        }
	    });

	    //Below function will send sms to service provider, notifying successful password change.
	    var smsMessage = "You have successfully updated your password on mSupply Service Provider App.";

	    notifications.sendSms(mobile, smsMessage, function(error, result){
	        if(error){
	            logger.error(TAG + " Error sending supplier password change sms to mobile no: "+ mobile + " Error :" + error);
	        }
	        else{
	            logger.debug(TAG + " Successfully sent supplier password change sms to mobile no: "+ mobile);
	        }
	    });

    });
};

//Function that will send email, sms for newly activated Service Provider.
exports.notifyServiceProviderProfileupdation = function(accountInfo, callback){

	// To Send Email
	var logger = log.logger_sp;

	var email = accountInfo.email;
	var mobile = accountInfo.mobile;
	var firstName = accountInfo.firstName;
	var lastName = accountInfo.lastName;

	logger.debug(TAG + " Initiated notifying service provider regarding profile updation.");
    logger.debug(TAG + " email: "  + email + " mobile: " + mobile + " firstName: " + firstName);

    //Below part will handle inserting this new notification for future use.
	//Get service provider ID for mobile number.
	getServiceProviderId(mobile, function(error, result){
		if(!error){
			//Structure of notification to be stored.
			var notificationArray = [];
			var notificationToStore = {
		        "type" : "others",
		        "title" : "Account details updated.",
		        "read" : false,
		        "notificationSentOn" : new Date()
		    }

			notificationArray.push(notificationToStore);
		    //Function to be called to store notification.
			manageNotifications.insertNotificaiton(result.ServiceProviderId, notificationArray, function(error, result){
				//Not handling error.
			});
		}
	});

	var ccEmails = "";
    var bccEmails = "";
    var fromEmail  = "support@msupply.com";
    var subjectEmail = "mSupply Service Provider App Account Info updated.";
    var message = "You have successfully updated your account details on mSupply Service Provider App.Please check your email for details.";

    htmlprofile.updateprofilebody(firstName, lastName, mobile, email, function(bodyEmail){

    	var bodyText = bodyEmail;

	    //Sending newly activation email to Service Provider.
	    notifications.sendPlainEmail(fromEmail, email, ccEmails, bccEmails, subjectEmail, bodyText, function(error, result){
	        if(!error){
	            logger.debug(TAG + " successfully sent Service Provider profile updation email to "+email);
	        }
	        else{
	            logger.error(TAG + " Error sending emails Service Provider profile updation  " + email + " Error :" + error);
	        }
	    });

	    //Sending newly activation sms to Service Provider.
	    notifications.sendSms(mobile, message, function(error, result){
	        if(!error){
	            logger.debug(TAG + " successfully sent SMS for Service Provider profile updation to mobile no: "+ mobile);
	        }
	        else{
	            logger.error(TAG + " Error sending sms for Service Provider profile updation to mobile no: "+ mobile + " Error :" + error);
	        }
	    });

    });
};

//Function that will send email, sms for newly activated Service Provider.
exports.sendServiceProviderRequestEmail = function(req, callback){

	// To Send Email
	var logger = log.logger_sp;

	var firstName = req.body.customerFirstName;
	var lastName = req.body.customerLastName;
	var mobile = req.body.mobileNumber;
	var email = req.body.email;
	var expertiseRequested = req.body.expertiseRequested;
	var requestTimeStamp = req.body.requestTimeStamp;
	var description = req.body.description;
	var serviceProviderChosen = req.body.serviceProviderChosen;

	logger.debug(TAG + " Initiated notifying internal mSupply Team for Customer Requests.");

    var fromEmail  = "support@msupply.com";
    var ccEmails = "";
    var bccEmails = "";
    var subjectEmail = "mSupply Service Provider Customer Request.";

    htmlcustomerreq.customerrequestsemailbody(firstName, lastName, mobile, email, expertiseRequested,
    		requestTimeStamp, description, serviceProviderChosen,function(bodyEmail){

    	var bodyText = bodyEmail;
      var toEmails = '<anushree@msupply.com>,<saleem@msupply.com>,<anish@msupply.com>';

	    notifications.sendPlainEmail(fromEmail, toEmails, ccEmails, bccEmails, subjectEmail, bodyText, function(error, result){
	        if(!error){
	            logger.debug(TAG + " successfully sent Service Provider customer requests email to " + toEmails);
	        }
	        else{
	            logger.error(TAG + " Error sending emails Service Provider customer requests email to " + toEmails + " Error :" + error);
	        }
	    });
    });
};

//Function that will send email, sms for customer regarding service chosen.
exports.sendCustomerRequestEmail = function(req, callback){
	//Variable for Logging the messages to the file.
	var logger = log.logger_sp;
	logger.debug(TAG + " Initiated notifying customer regarding service provider chosen.");

	var firstName = req.body.customerFirstName;
	var lastName = req.body.customerLastName;
	var mobile = req.body.mobileNumber;
	var email = req.body.email;
	var expertiseRequested = req.body.expertiseRequested;
	var requestTimeStamp = new Date();
	var description = req.body.description;
	var serviceProviderChosen = req.body.serviceProviderChosen;

	var ccEmails = "";
    var bccEmails = "";
	var fromEmail  = "support@msupply.com";
    var subjectEmail = "mSupply Service Provider Customer Request.";
    var message = "Dear Customer, your request has been received, and it will be forwarded to the service provider.";

    if(serviceProviderChosen === null){
	    customerLeadsEmail.getEmailbody(firstName, lastName, mobile, email, function(bodyEmail){

	    	var bodyText = bodyEmail;

		    //Sending customer request email to customer.
		    notifications.sendPlainEmail(fromEmail, email, ccEmails, bccEmails, subjectEmail, bodyText, function(error, result){
		        if(!error){
		            logger.debug(TAG + " successfully sent customer request email to "+email);
		        }
		        else{
		            logger.error(TAG + " Error sending customer request email to  " + email + " Error :" + error);
		        }
		    });

		    //Sending customer request sms to customer.
		    notifications.sendSms(mobile, message, function(error, result){
		        if(!error){
		            logger.debug(TAG + " successfully sent SMS for customer request to mobile no: "+ mobile);
		        }
		        else{
		            logger.error(TAG + " Error sending sms for customer request to mobile no: "+ mobile + " Error :" + error);
		        }
		    });

	    });
	}
	else{
		customerLeadsEmail_spchoosen.getEmailbody(req, function(bodyEmail){

	    	var bodyText = bodyEmail;

		    //Sending customer request email to customer.
		    notifications.sendPlainEmail(fromEmail, email, ccEmails, bccEmails, subjectEmail, bodyText, function(error, result){
		        if(!error){
		            logger.debug(TAG + " successfully sent customer request email to "+email);
		        }
		        else{
		            logger.error(TAG + " Error sending customer request email to  " + email + " Error :" + error);
		        }
		    });

		    //Sending customer request sms to customer.
		    notifications.sendSms(mobile, message, function(error, result){
		        if(!error){
		            logger.debug(TAG + " successfully sent SMS for customer request to mobile no: "+ mobile);
		        }
		        else{
		            logger.error(TAG + " Error sending sms for customer request to mobile no: "+ mobile + " Error :" + error);
		        }
		    });

	    });
	}
}

exports.sendLeadsNotification = function(req, callback){
	//Variable for Logging the messages to the file.
	var logger = log.logger_sp;

	//Variable for Mongo DB Connection.
	var db = dbConfig.mongoDbConn;

	//Declare the response
	var resJson;
	var serviceProvider_cloudTokenID = [];
	var serviceProviderId = null;

	async.series([
		//Function that will get serviceProviderId based on mobile number.
		function(asyncCallback){

			response_message = "Service Provider information not found.";

			getServiceProviderId(req.body.serviceProviderChosen.mobile, function(error, result){
				if(error){
					return asyncCallback(true);
				}
				else{
					serviceProviderId = result.ServiceProviderId;
					return asyncCallback(false);
				}
			});
		},

		//Function that will get serviceProvider_cloudTokenID based on serviceProviderId.
		function(asyncCallback){

			var db = dbConfig.mongoDbConn;
			var logger = log.logger_sp;
			var ServiceProviderCol = db.collection('ServiceProvider');
			response_message = "Service Provider information not found.";

			ServiceProviderCol.find({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": serviceProviderId}).toArray(function(error, result){
				if(error){
					logger.error(TAG + " Error while fetching serviceProvider information for serviceProviderId: "+serviceProviderId);
					return asyncCallback(true);
				}
				else if(!error && result.length === 0){
					logger.debug(TAG + " Service Provider information not found for serviceProviderId: "+serviceProviderId);
					return asyncCallback(true);
				}
				else if(!error && result.length > 0){
					logger.debug(TAG + " Got service provider information for serviceProviderId: "+serviceProviderId);

					//Below part will handle inserting this new notification for future use.
					//Structure of notification to be stored.
					var notificationArray = [];
					var notificationToStore = {
		                "type" : "leads",
		                "title" : "A customer wants to connect with you!",
		                "read" : false,
		                "notificationSentOn" : new Date()
		            }

		     		notificationArray.push(notificationToStore);
		            //Function to be called to store notification.
					manageNotifications.insertNotificaiton(serviceProviderId, notificationArray, function(error, result){
						//Not handling error.
					});

					try{
						serviceProvider_cloudTokenID = result[0].serviceProviderEntity.appInfo.cloudTokenID;
						return asyncCallback(false);
					}
					catch(error){
						logger.debug(TAG + " cant find service provider cloudTokenID for serviceProviderId: "+serviceProviderId);
						return asyncCallback(true);
					}
				}
			});
		},
		//Function that will get customer information based on serviceProviderId.
		function(asyncCallback){
			var logger = log.logger_sp;
			response_message = "cloudTokenID not found.";
			if(serviceProvider_cloudTokenID === null){
				logger.debug(TAG + " cloudTokenID empty for serviceProviderId: "+serviceProviderId);
				return asyncCallback(true);
			}
			else{
				response_message = "Cant send notifications. Please try later.";

				var customerInfo = {
					notificationType: "leads",
					title: "New customer shows interest on service provided by you.",
					serviceProviderMobile: req.body.serviceProviderChosen.mobile
				};

				if(!(req.body.description === undefined && req.body.description.toString().trim().length === 0)){
					customerInfo.description = req.body.description;
				}

			    pushNotification.sendNotifications(customerInfo, serviceProvider_cloudTokenID, function(error, result){
				if(!error)
				{
					response_message = "Successfully sent notifications.";
				    logger.debug(TAG + " - Successfully sent new leads notification to service provider "+serviceProviderId);
				    return asyncCallback(false);
				}
				else
				{
				    logger.error(TAG + "  - Error sending new leads notification to service provider "+serviceProviderId+". Error : " + error);
				    return asyncCallback(true);
				}
			    });
			}
		}
	],
	//Final function to be called.
	function(error){
		if(error){
			resJson = {
			    "http_code" : "500",
				"message" : response_message
			};
			return callback(true, resJson);
		}
		else{
			resJson = {
			    "http_code" : "200",
				"message" : response_message
			};
			return callback(false, resJson);
		}
	}
	);
}

//Function that will send sms notification to service provider regarding succesfull account activation.
exports.notifyServiceProviderOnAccountActivation = function(mobilenum, callback){
	var logger = log.logger_sp;

    var message = "Dear Service Provider, your account is activated successfully."

    logger.debug(TAG + " Activation SMS " + mobilenum);

    notifications.sendSms(mobilenum, message, function(error, result){
        if(!error){
            logger.debug(TAG + " successfully sent activation sms for service provider to mobile no: "+ mobilenum);
            return callback(false);
        }
        else{
            logger.error(TAG + " Error sending activation sms for service provider to mobile no: "+ mobilenum + " Error :" + error);
            return callback(true);
        }
    });
}

//Function that will send sms notification to service provider regarding succesfull quality check.
exports.notifyServiceProviderOnQCVerification = function(serviceProviderId, callback){
	var logger = log.logger_sp;

	var ccEmails = "";
    var bccEmails = "";
    var message = "Dear Service Provider, Congrats - you are now listed on our website."

    getServiceProviderDetailsbyId(serviceProviderId, function(error, result){

    	if(error){
    		return callback(true);
    	}
    	else{

    		var mobilenum = result.ServiceProvider.serviceProviderEntity.profileInfo.accountInfo.mobile;
    		var email = result.ServiceProvider.serviceProviderEntity.profileInfo.accountInfo.email;

	    	//sending sms notification.
	    	notifications.sendSms(mobilenum, message, function(error, result){
		        if(!error){
		            logger.debug(TAG + " successfully sent qc check sms for service provider  to mobile no: "+ mobilenum);
		        }
		        else{
		            logger.error(TAG + " Error sending qc check sms for service provider to mobile no: "+ mobilenum + " Error :" + error);
		        }
		    });

		    var fromEmail  = "support@msupply.com";
		    var subjectEmail = "Congrats - you are now listed on our website.";

		    //sending email notification.
		    htmlserviceproviderQc.getBody(function(bodyEmail){

		    	var bodyText = bodyEmail;
		    	var toEmails = '<'+email+'>';

			    notifications.sendPlainEmail(fromEmail, toEmails, ccEmails, bccEmails, subjectEmail, bodyText, function(error, result){
			        if(!error){
			            logger.debug(TAG + " successfully sent service provider qc check email to " + toEmails);
			        }
			        else{
			            logger.error(TAG + " Error sending service provider qc check email to " + toEmails + " Error :" + error);
			        }
			    });
		    });

		    return callback(false);
    	}
    });

}


//Function that will send sms/email notification to service provider regarding rejection in quality check.
exports.notifyServiceProviderOnQCRejection = function(serviceProviderId, reasonForRejection, callback){
	var logger = log.logger_sp;

	var ccEmails = "";
    var bccEmails = "";
    var message = "Dear Service Provider, your quality check is failed."
    
    getServiceProviderDetailsbyId(serviceProviderId, function(error, result){

    	if(error){
    		return callback(true);
    	}
    	else{

    		var mobilenum = result.ServiceProvider.serviceProviderEntity.profileInfo.accountInfo.mobile;
    		var email = result.ServiceProvider.serviceProviderEntity.profileInfo.accountInfo.email;
	    	var serviceProviderFirstName = result.ServiceProvider.serviceProviderEntity.profileInfo.accountInfo.firstName;
	    	var serviceProviderLastName = result.ServiceProvider.serviceProviderEntity.profileInfo.accountInfo.lastName;
	    	var serviceProviderName = serviceProviderFirstName +' '+ serviceProviderLastName;
	    	//sending sms notification.
	    	// notifications.sendSms(mobilenum, message, function(error, result){
		    //     if(!error){
		    //         logger.debug(TAG + " successfully sent qc check rejection sms for service provider  to mobile no: "+ mobilenum);
		    //     }
		    //     else{
		    //         logger.error(TAG + " Error sending qc check rejection sms for service provider to mobile no: "+ mobilenum + " Error :" + error);
		    //     }
		    // });

		    var fromEmail  = "support@msupply.com";
		    var subjectEmail = "Regarding your request to empanel with msupply.com as a service provider.";
		    
		    //sending email notification.
		    htmlserviceproviderQcReject.getBody(serviceProviderName, reasonForRejection, function(bodyEmail){
		    	
		    	var bodyText = bodyEmail;
		    	var toEmails = '<'+email+'>';
			    
			    notifications.sendPlainEmail(fromEmail, toEmails, ccEmails, bccEmails, subjectEmail, bodyText, function(error, result){
			        if(!error){
			            logger.debug(TAG + " successfully sent service provider qc check rejection email to " + toEmails);
			        }
			        else{
			            logger.error(TAG + " Error sending service provider qc check rejection email to " + toEmails + " Error :" + error);
			        }
			    });
		    });

		    return callback(false);
    	}
    });

}

//Function that will send email notification to customers regarding there requests for service.
exports.customerLeadsEmail = function(customerRequests, callback){
	var logger = log.logger_sp;

	//Variable for Mongo DB Connection.
	var db = dbConfig.mongoDbConn;
	var requestCol = db.collection("CustomerRequests");

	var today = new Date();
	today.setHours(0, 0, 0, 0);

	var mobilenum = null, email = null;

	try{
		mobilenum = customerRequests[0].mobileNumber;
	}
	catch(exception){
		return callback(false);
	}

	try{
		email = customerRequests[0].email;
	}
	catch(exception){
		return callback(false);
	}

	//Getting service provider information.
	var i = 0;
	async.forEachSeries(customerRequests,
		function(requestObj, asyncCallback){

		},
		//Final Function to be called upon completion of all functions.
	function(error)
	{
	 	return callback(false);
	});

	//sending sms notification.
	var message = "Dear Customer, your request has been received, and that it will be forwarded to the service provider.";
	notifications.sendSms(mobilenum, message, function(error, result){
        if(!error){
            logger.debug(TAG + " successfully sent leads sms for service provider  to mobile no: "+ mobilenum);
        }
        else{
            logger.error(TAG + " Error sending leads sms for service provider to mobile no: "+ mobilenum + " Error :" + error);
        }
    });

	//sending email notification.
	var ccEmails = "";
    var bccEmails = "";
    var fromEmail  = "support@msupply.com";
    var subjectEmail = "ServiceProvider Request";
    htmlserviceproviderLeads.getBody(customerRequests, function(bodyEmail){

    	var bodyText = bodyEmail;
    	var toEmails = '<'+email+'>';

	    notifications.sendPlainEmail(fromEmail, toEmails, ccEmails, bccEmails, subjectEmail, bodyText, function(error, result){
	        if(!error){
	        	//Update customer request collection.[In calling funtion we cant update collection, because of ambiguity.]

	        	requestCol.update(
				{
				  	"requestTimeStamp": { $gte: today},
				  	"email": email,
					"cstmrNotificationSentOn": null
				},
				{
					$set: {
						"cstmrNotificationSentOn": new Date()
					}
				},
				{
					multi: true
				},
				function(error, result){
					try{
						result = JSON.parse(result);
					}
					catch(exception){
						logger.error(TAG + " error in updating cstmrNotificationSentOn field in CustomerRequests collection for customer with emailid: " + email);
					}

				  	if(error)
				  	{
				  		logger.error(TAG + " error in updating cstmrNotificationSentOn field in CustomerRequests collection for customer with emailid: " + email);
				  	}
				  	else if(result.n < 1)
				  	{
				  		logger.debug(TAG + " Cannot update cstmrNotificationSentOn field in CustomerRequests collection for customer with emailid: " + email);
				  	}
				  	return callback(false);
				});

	            logger.debug(TAG + " successfully sent service provider leads email to " + toEmails);
	        }
	        else{
	            logger.error(TAG + " Error sending service provider leads email to " + toEmails + " Error :" + error);
	            return callback(false);
	        }
	    });
    });
}


//Function that will send email notification to support regarding leads obtained by customers.
exports.supportLeadsEmail = function(customerRequests, callback){
	var logger = log.logger_sp;

	//Variable for Mongo DB Connection.
	var db = dbConfig.mongoDbConn;
	var requestCol = db.collection("CustomerRequests");
	var today = new Date();
	today.setHours(0, 0, 0, 0);

	//sending email notification.
	var ccEmails = "";
    var bccEmails = "";
    var fromEmail  = "support@msupply.com";
    var subjectEmail = "Customer leads.";
    htmlsupportLeads.getBody(customerRequests, function(bodyEmail){
    	var bodyText = bodyEmail;
		var toEmails = '<shashidhar@msupply.com>,<shashidhargr26@gmail.com>';

		notifications.sendPlainEmail(fromEmail, toEmails, ccEmails, bccEmails, subjectEmail, bodyText, function(error, result){
	        if(!error){
	        	//Update customer request collection.[In calling funtion we cant update collection, because of ambiguity.]

	        	requestCol.update(
				{
				  	"requestTimeStamp": { $gte: today},
					"serviceProviderChosen": null,
					"sprtNotificationSentOn": null
				},
				{
					$set: {
						"sprtNotificationSentOn": new Date()
					}
				},
				{
					multi: true
				},
				function(error, result){
					try{
						result = JSON.parse(result);
					}
					catch(exception){
						logger.error(TAG + " error in updating sprtNotificationSentOn field in CustomerRequests collection ");
					}

				  	if(error)
				  	{
				  		logger.error(TAG + " error in updating sprtNotificationSentOn field in CustomerRequests collection ");
				  	}
				  	else if(result.n < 1)
				  	{
				  		logger.debug(TAG + " Cannot update sprtNotificationSentOn field in CustomerRequests collection ");
				  	}
				  	return callback(false);
				});

	            logger.debug(TAG + " successfully sent service provider leads to support email " + toEmails);
	        }
	        else{
	            logger.error(TAG + " Error sending service provider leads to support email " + toEmails + " Error :" + error);
	            return callback(false);
	        }
		});
    });
}

//Function that will send email notification to service provider regarding leads obtained by customers.
exports.serviceProviderLeadsEmail = function(customerRequests, callback){
	var logger = log.logger_sp;
	var serviceProviderId = null;

	//Variable for Mongo DB Connection.
	var db = dbConfig.mongoDbConn;
	var requestCol = db.collection("CustomerRequests");

	var today = new Date();
	today.setHours(0, 0, 0, 0);

	try{
		serviceProviderId = customerRequests[0].serviceProviderChosen.serviceProviderId;
	}
	catch(exception){
		// IMP ************ we send true as return values, but it will stop whole process,
		// instead continue without notifying this service provider.
		logger.error(TAG + " exception araised while fetching serviceProviderId, exception :" + exception);
		return callback(false);
	}

	getServiceProviderDetailsbyId(serviceProviderId, function(error, result){
		if(error){
			// IMP ************ we send true as return values, but it will stop whole process,
			// instead continue without notifying this service provider.
    		return callback(false);
    	}
    	else{
    		var mobilenum = result.ServiceProvider.serviceProviderEntity.profileInfo.accountInfo.mobile;
    		var email = result.ServiceProvider.serviceProviderEntity.profileInfo.accountInfo.email;

    		//sending sms notification.
    		var message = "Dear Service Provider, a customer is requested a service from you. For more details check your email.";
	    	notifications.sendSms(mobilenum, message, function(error, result){
		        if(!error){
		            logger.debug(TAG + " successfully sent leads sms for service provider  to mobile no: "+ mobilenum);
		        }
		        else{
		            logger.error(TAG + " Error sending leads sms for service provider to mobile no: "+ mobilenum + " Error :" + error);
		        }
		    });

	    	//sending email notification.
	    	var ccEmails = "";
    		var bccEmails = "";
		    var fromEmail  = "support@msupply.com";
		    var subjectEmail = "Customer leads.";
		    htmlserviceproviderLeads.getBody(customerRequests, function(bodyEmail){

		    	var bodyText = bodyEmail;
		    	var toEmails = '<'+email+'>';

			    notifications.sendPlainEmail(fromEmail, toEmails, ccEmails, bccEmails, subjectEmail, bodyText, function(error, result){
			        if(!error){
			        	//Update customer request collection.[In calling funtion we cant update collection, because of ambiguity.]

			        	requestCol.update(
						{
						  	"requestTimeStamp": { $gte: today},
						  	"serviceProviderChosen.serviceProviderId": serviceProviderId,
							"serviceProviderChosen.spNotificationSentOn": null
						},
						{
							$set: {
								"serviceProviderChosen.spNotificationSentOn": new Date()
							}
						},
						{
							multi: true
						},
						function(error, result){
							try{
								result = JSON.parse(result);
							}
							catch(exception){
								logger.error(TAG + " error in updating spNotificationSentOn field in CustomerRequests collection for serviceProviderId: " + serviceProviderId);
							}

						  	if(error)
						  	{
						  		logger.error(TAG + " error in updating spNotificationSentOn field in CustomerRequests collection for serviceProviderId: " + serviceProviderId);
						  	}
						  	else if(result.n < 1)
						  	{
						  		logger.debug(TAG + " Cannot update spNotificationSentOn field in CustomerRequests collection for serviceProviderId: " + serviceProviderId);
						  	}
						  	return callback(false);
						});

			            logger.debug(TAG + " successfully sent service provider leads email to " + toEmails);
			        }
			        else{
			            logger.error(TAG + " Error sending service provider leads email to " + toEmails + " Error :" + error);
			            return callback(false);
			        }
			    });
		    });
    	}
	});
}

//Function that will get serviceproviderID for mobile number given.
function getServiceProviderId(mobileNumber, callback){
	var db = dbConfig.mongoDbConn;
	var logger = log.logger_sp;
	var ServiceProviderCol = db.collection('ServiceProvider');
	var finalResult = {
		ServiceProviderId : null
	}
	ServiceProviderCol.find({"serviceProviderEntity.profileInfo.accountInfo.mobile": mobileNumber}).toArray(function(error, result){
		if(error){
			logger.error(TAG + " Error while fetching serviceProvider information for serviceProvider mobile number: "+mobileNumber);
			return callback(true);
		}
		else if(!error && result.length === 0){
			logger.debug(TAG + " Service Provider information not found for serviceProvider mobile number: "+mobileNumber);
			return callback(true);
		}
		else if(!error && result.length > 0){
			logger.debug(TAG + " Got service provider information for serviceProvider mobile number: "+mobileNumber);
			try{
				finalResult.ServiceProviderId = result[0].serviceProviderEntity.profileInfo.accountInfo.serviceProviderId;
				return callback(false, finalResult);
			}
			catch(exception){
				logger.error(TAG + " Exception araised while fetching serviceproviderID from ServiceProvider for mobile: "+mobileNumber+", exception : "+exception);
				return callback(true);
			}
		}
	});
}


//Function that will get serviceprovider details for serviceprovider id given.
function getServiceProviderDetailsbyId(serviceproviderId, callback){

	var db = dbConfig.mongoDbConn;
	var logger = log.logger_sp;
	var ServiceProviderCol = db.collection('ServiceProvider');
	var finalResult = {
		ServiceProvider : null
	}
	ServiceProviderCol.find({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": serviceproviderId}).toArray(function(error, result){
		if(error){
			logger.error(TAG + " Error while fetching serviceProvider information for serviceProvider id: "+serviceproviderId);
			return callback(true);
		}
		else if(!error && result.length === 0){
			logger.debug(TAG + " Service Provider information not found for serviceProvider id: "+serviceproviderId);
			return callback(true);
		}
		else if(!error && result.length > 0){
			logger.debug(TAG + " Got service provider information for serviceProvider id: "+serviceproviderId);
			try{
				finalResult.ServiceProvider = result[0];
			}
			catch(exception){
				logger.error(TAG + " Exception araised while fetching serviceprovider info from ServiceProvider id: "+serviceproviderId+", exception : "+exception);
				return callback(true);
			}
			return callback(false, finalResult);
		}
	});
}