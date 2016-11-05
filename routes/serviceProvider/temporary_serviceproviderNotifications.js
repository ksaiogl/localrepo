//This file contains functions that will help to create body of email.
var TAG = "temporary_serviceproviderNotifications.js";
var log = require('../../Environment/log4js.js');
var notifications = require('../helpers/notifications.js');
var htmlreg = require('../emailhtmls/serviceproviderjs/temporary_registrationbody.js');
var dbConfig = require('../../Environment/mongoDatabase.js');
var manageNotifications = require('./manageNotifications.js');

//Function that will notify msupply support and supplier regarding successful registration of supplier.
exports.sendRegistrationEmail = function (email, firstName, mobile, password, callback){
    
	var logger = log.logger_sp;
	
    logger.debug(TAG + " Initiated notifying Service Provider for Successful Registration.");
   
    // Function that will call supplierRegEmailNotification function.
    serviceProviderRegEmailNotification(email, firstName, mobile, password, function(error, result){
        
    });
    // Function that will call supplierRegSmsNotification function.
    serviceProviderRegSmsNotification(firstName, mobile, password, function(error, result){
        
    });

    return callback(false);
};

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
    var fromEmail  = "support@msupply.com";
    var subjectEmail = "Congrats! You are now a service provider on mSupply.com.";
    htmlreg.registrationemailbody(mobile, password, function(bodyEmail){
    	
    	var bodyText = bodyEmail;
    	
    	notifications.sendPlainEmail(fromEmail, toEmails, subjectEmail, bodyText, function(error, result){
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
function serviceProviderRegSmsNotification(firstName, mobile, password, callback){
    
	var logger = log.logger_sp;

    var message = "Dear Service Provider, You are now a service provider with msupply.com! Download the app from link provided, and login using these credentials : username "+mobile+", password "+password+", Download app here https://goo.gl/Rj0mZL ";

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

