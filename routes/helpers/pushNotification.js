var TAG = "PushNotifications- ";
var gcm = require('node-gcm');
var senderSupplier = new gcm.Sender('AIzaSyAcDFSeeyIJueGnw9DJQJxgYzZyCVPgydc');
var senderServiceProvider = new gcm.Sender('AIzaSyD3ayMr8BEEyK9g8BHXgvvn8J6SladQ6r8');

var message = new gcm.Message();

/////////////////////////////////////////////////
//Below variable should be boolean, if true, push notifications are enabled, if false, push notifications are disabled.
var ENABLE_PUSH_NOTIFICATIONS = true;

var log = require('../../Environment/log4js.js');

exports.sendPushNotifications = function(pushInfo, registrationIds, callback){
	
  var logger = log.logger_helpers;
    //Handling weather to send push notifications are not. If false, request will be returned here itself without sending push notifications.
    //If true, further preocessing will take place and push notifications will be sent.
    if(!ENABLE_PUSH_NOTIFICATIONS)
    {  
        logger.debug(TAG + " Sending push Notification is disabled.");        
        return callback(false);
    }
    //message.addData('title', pushInfo.title);
	//message.addData('desc', pushInfo.description);
	//message.addData('body', pushInfo.body);
	//message.addData('image', pushInfo.image);
	message.addData('type', pushInfo.notificationType);
	message.addData('orderNumber', pushInfo.orderNumber);
	message.addData('title', pushInfo.title);
	message.addData('message', pushInfo.message);
	message.addData('mobile', pushInfo.mobile);
	
	message.delay_while_idle = 1;
	var registrationIds = registrationIds; // registrationIds should be an array object.
	senderSupplier.send(message, registrationIds, 4, function (err, result) {
		if(err)
		{
			logger.error(TAG + " Error Sending Push Notifications, error: " + err); 
			return callback(true, result); 
		}
		else
		{
			logger.debug(TAG + " Push Notifications sent successfully, result: " + JSON.stringify(result));
			return callback(false, "notifications sent Successfully");
		}	
	});
}

exports.sendNotifications = function(pushInfo, appIds, callback){
	
  var logger = log.logger_helpers;
    //Handling weather to send push notifications are not. If false, request will be returned here itself without sending push notifications.
    //If true, further preocessing will take place and push notifications will be sent.
    if(!ENABLE_PUSH_NOTIFICATIONS)
    {  
        logger.debug(TAG + " Sending push Notification is disabled.");        
        return callback(false);
    }

	//message.data = pushInfo;
	message.addData('type', pushInfo.notificationType);
	message.addData('title', pushInfo.title);
	message.addData('serviceProviderMobile', pushInfo.serviceProviderMobile);
	
	message.delay_while_idle = 1;
	var registrationIds = appIds; // registrationIds should be an array object.
	//var registrationIds = [];
	//registrationIds.push(appIds);
	
	senderServiceProvider.send(message, registrationIds, 4, function (err, result) {
		if(err)
		{
			logger.error(TAG + " Error Sending Push Notifications, error: " + err); 
			return callback(true, result); 
		}
		else
		{
			logger.debug(TAG + " Push Notifications sent successfully, result: " + JSON.stringify(result));
			return callback(false, "notifications sent Successfully");
		}	
	});
}