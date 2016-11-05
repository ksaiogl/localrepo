var TAG = "Notifications";

//This file is used to send notifications[emsil/sms.]

/////////////////////////////////////////////////
//Below variable should be boolean, if true, notifications are enabled[sms, emails can be sent], if false, notifications are disabled[sms, emails CANNOT be sent].
var ENABLE_NOTIFICATIONS = true;

////////////////////////////////////////////////
 
var email   = require("emailjs");

var log = require('../../Environment/log4js.js');
var request = require("request");

//If multiple recepients, to parameter structure should be "<abc@xyz.com>, <def@xyz.com>"
//Function that will send plain text/html email without any attachments.
exports.sendPlainEmail = function(from, to, cc, bcc, subject, body, callback){
	
  var logger = log.logger_sup;
    //Handling weather to send notifications are not. If false, request will be returned here itself without sending sms, emails.
    //If true, further preocessing will take place and sms, emails will be sent.
    if(!ENABLE_NOTIFICATIONS){  
        logger.debug(TAG + " Sending email is disabled.");        
        return callback(false);
    }

	var server  = email.server.connect({
            host:    "localhost",
            ssl:     false
        });

    server.send({
        from:    from,
        to:      to,
        cc:      cc,
        bcc:     bcc,
        subject: subject,
        attachment: 
        [
          {data: body, alternative: true},
        ]
        }, 
        function(err, message) {
           if(err){
           	callback(true, null);
           }
           else{
           	callback(false, message);
           }
    	}
    );
}

//If multiple recepients, to parameter structure should be "<abc@xyz.com>, <def@xyz.com>"
//Function that will send email with attachments.
exports.sendEmailwithAttachment = function(from, to, cc, bcc, subject, attachmentFiles, callback){

    var logger = log.logger_sup;
    //Handling weather to send notifications are not. If false, request will be returned here itself without sending sms, emails.
    //If true, further preocessing will take place and sms, emails will be sent.
    if(!ENABLE_NOTIFICATIONS){
        logger.debug(TAG + " Sending email is disabled.");
        return callback(false);
    }

    var server  = email.server.connect({
      host:    "localhost",
      ssl:     false
    });

    server.send({
      from:    from,
      to:      to,
      cc:      cc,
      bcc:     bcc,
      subject: subject,
      attachment: attachmentFiles
      },
      function(err, message){
         if(err)
         {
          logger.error(TAG + " error sending email with attachment. ");
          callback(true, null);
         }
         else
         {
          logger.debug(TAG + " email with attachment sent successfully.");
          callback(false, message);
         }
    });
}


exports.sendSms = function(mobilenumber, message, callback){
    var logger = log.logger_sup;
    //Handling weather to send notifications are not. If false, request will be returned here itself without sending sms, emails.
    //If true, further preocessing will take place and sms, emails will be sent.
    if(!ENABLE_NOTIFICATIONS){ 
        logger.debug(TAG + " Sending sms is disabled.");          
        return callback(false);
    }

    request("http://smsc.smsconnexion.com/api/gateway.aspx?action=send&username=msupply&passphrase=123456&message="+message+"-Team mSupply" +"&phone=" + mobilenumber, 
        function(err, response, body) {
            if(!err){ 
                logger.debug(TAG + " Successfully sent sms for mobile no "+ mobilenumber);
                return callback(false);
            }
            else
            {
                logger.error(TAG + " Error sending sms for mobile no  "+ mobilenumber);
                return callback(true, err);
            } 
        }
    );  
}  



