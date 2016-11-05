var TAG = "sellerRegistration.js";

var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');

var crypto = require('crypto');
var secretKey = "mSupplyEmailVerification";
var http = require('http');
var request = require("request");
var hostDetails = require('../../Environment/notificationServiceHostDetails.js');

//Send Verification Mail to the registered seller....
exports.sendNotificationSeller = function(req, token, callback){
    var logger = log.logger_seller;      
    var emailObj = {
        "notificationIdentifier": "701",
        "toEmails": [req.body.emailId],
        "toMobileNumber": null,
        "smsBodyParams": null,
        "emailBodyParams": {
           "Emailbody" : req.body,
           "token" : token
        },
        "emailAttachment": false,
        "attachmentParams": null,
        "emailAttachmentFileName": null
    };

    //Function Calls POST API service for Sending email Notification.
    sendEmailNotification(emailObj, function(error, bodyEmail){
        if(error)
        {
            logger.error(TAG + " Error sending supplier verify email to supplier email id:" + req.body.emailId);
             resJson = {
                        "http_code" : "500",
                        "message" : "Sending Verification mail failed.."
                      };
            return callback(true, resJson);
        }
        else
        {
            logger.debug(TAG + " Successfully sent supplier verify email to supplier email id:" + req.body.emailId);
             resJson = {
                        "http_code" : "200",
                        "message" : "Mail sent to registered Email id"
                      };
            return callback(false, resJson);
        }
    });

    
}

//Send Email to seller on documents verification from SCETA is complete.
exports.sendNotificationDocumentsVerified = function(email, userId, callback){
    var logger = log.logger_seller;      
    var emailObj = {
        "notificationIdentifier": "704",
        "toEmails": [email],
        "toMobileNumber": null,
        "smsBodyParams": null,
        "emailBodyParams": {
           "userId" : userId
        },
        "emailAttachment": false,
        "attachmentParams": null,
        "emailAttachmentFileName": null
    };
    //Function Calls POST API service for Sending email Notification.
    sendEmailNotification(emailObj, function(error, bodyEmail){
        if(error)
        {
            logger.error(TAG + " Error sending supplier Approval Email from SCETA email id:" + email);
        }
        else
        {
            logger.debug(TAG + " Successfully sent supplier Approval Email from SCETA email id:" + email);
        }
    });

    return callback(false);
}

//Send Email to seller on documents rejection from SCETA.
exports.sendNotificationDocumentsRejected = function(email, userId, callback){
    var logger = log.logger_seller;      
    var emailObj = {
        "notificationIdentifier": "705",
        "toEmails": [email],
        "toMobileNumber": null,
        "smsBodyParams": null,
        "emailBodyParams": {
           "userId" : userId
        },
        "emailAttachment": false,
        "attachmentParams": null,
        "emailAttachmentFileName": null
    };
    //Function Calls POST API service for Sending email Notification.
    sendEmailNotification(emailObj, function(error, bodyEmail){
        if(error)
        {
            logger.error(TAG + " Error sending supplier Rejection Email from SCETA email id:" + email);
        }
        else
        {
            logger.debug(TAG + " Successfully sent supplier Rejection Email from SCETA email id:" + email);
        }
    });

    return callback(false);
}

//Send Rejection Mail to the registered seller.
exports.sendNotificationSellerReject = function(data, callback){
    var logger = log.logger_seller;      
    var emailObj = {
        "notificationIdentifier": "702",
        "toEmails": [data.emailId],
        "toMobileNumber": null,
        "smsBodyParams": null,
        "emailBodyParams": {
           "Emailbody" : data
        },
        "emailAttachment": false,
        "attachmentParams": null,
        "emailAttachmentFileName": null
    };
    //Function Calls POST API service for Sending email Notification.
    sendEmailNotification(emailObj, function(error, bodyEmail){
        if(error)
        {
            logger.error(TAG + " Error sending rejection mail to Seller having email id:" + data.emailId);
        }
        else
        {
            logger.debug(TAG + " Successfully sent rejection mail to Seller having email id:" + data.emailId);
        }
    });
    
    return callback(false);
}

//Send Approved Mail to the registered seller.
exports.sendNotificationSellerApprove = function(data, callback){
    var logger = log.logger_seller;      
    var emailObj = {
        "notificationIdentifier": "703",
        "toEmails": [data.emailId],
        "toMobileNumber": null,
        "smsBodyParams": null,
        "emailBodyParams": {
           "Emailbody" : data
        },
        "emailAttachment": false,
        "attachmentParams": null,
        "emailAttachmentFileName": null
    };
    //Function Calls POST API service for Sending email Notification.
    sendEmailNotification(emailObj, function(error, bodyEmail){
        if(error)
        {
            logger.error(TAG + " Error sending Approved mail to Seller having email id:" + data.emailId);
        }
        else
        {
            logger.debug(TAG + " Successfully sent Approved mail to Seller having email id:" + data.emailId);
        }
    });

    return callback(false);
}

//Function Calls POST API service for Sending email Notification.
function sendEmailNotification(emailBodyParameters, callback){
    //Variable for Logging the messages to the file.

    var logger = log.logger_seller;

    //emailBodyParameters = JSON.parse(emailBodyParameters);
    var WHICH_HOST = hostDetails.WHICH_HOST;
    var postData = JSON.stringify({
        "notificationIdentifier" : emailBodyParameters.notificationIdentifier,
        "toEmails" : emailBodyParameters.toEmails,
        "toMobileNumber" : emailBodyParameters.toMobileNumber,
        "emailAttachment" : emailBodyParameters.emailAttachment,
        "attachmentParams" : emailBodyParameters.attachmentParams,
        "emailAttachmentFileName" : emailBodyParameters.emailAttachmentFileName,
        "emailBodyParams" : emailBodyParameters.emailBodyParams,
        "smsBodyParams": emailBodyParameters.smsBodyParams
    });
    var finalResponse = '';
    var postOptions = {
        path: '/notification/api/v1.0/sendNotification',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };
    
    postOptions.host = WHICH_HOST.host; //setting host and port dynamically based on environment.
    postOptions.port = WHICH_HOST.port;

    var postReq = http.request(postOptions, function(res){
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            finalResponse = finalResponse + chunk;
        });
        res.on('end', function () {
            var result = JSON.parse(finalResponse);

            if(result.http_code === "200")
            {
                logger.debug(TAG + "email Sent successfully for emailIdentifier: " + emailBodyParameters.notificationIdentifier);
                return callback(false, result);
            }
            else
            {                
                logger.error(TAG + "Error in sending email Notification. result: " + JSON.stringify(result));
                return callback(true, result);
            }
        });
        res.on('error', function (error) {
            logger.error(TAG + "Error in sending email Notification .error: " + error);
            return callback(true, error);
        });
    });
    // post the data
    postReq.write(postData);
    postReq.end();
};