/**
 * New node file
 */
var TAG = "rfqNotifications.js"

var log = require('../../Environment/log4js.js');
var notifications = require('../helpers/notifications.js');
var hostDetails = require('../../Environment/notificationServiceHostDetails.js');
var dbConfig = require('../../Environment/mongoDatabase.js');
var http = require('http');
var request = require("request");
var emailIdConfig = require('../helpers/emailIdConfig.js');
var env = require('../../Environment/env.js').env;
var timezoneConversions = require('../../routes/helpers/timezoneConversions.js');

//Function that will send email to supplier .
exports.notifyFulfillmentTeamOnReadyToShip = function(readyToshipOrder, skuids, callback){
    var logger = log.logger_rfq;
    var db = dbConfig.mongoDbConn;
    var commaITConfig = {addPrecision:true, thousandSeperator : ',', decimalSeperator : '.'};
    var emailObj = {
    "notificationIdentifier": "501",
    "toEmails": [],
    "toMobileNumber": [],
    "smsBodyParams": {"supplierName": null},
    "emailBodyParams": {
        "orderId": readyToshipOrder.orderEntity.orderInfo.orderNumber,
        "orderDate": timezoneConversions.ConvertToIST(readyToshipOrder.orderEntity.orderInfo.orderDate)
    },
    "emailAttachment": false,
    "attachmentParams": null,
    "emailAttachmentFileName": null
    };


    logger.debug(TAG + " emailObj for notifying the supplier for customer addition email successfully formed: " + JSON.stringify(emailObj));
    sendEmailNotification(emailObj, function(error, bodyEmail){
        if(error)
        {
            logger.error(TAG + " Error notifying the supplier for customer addition email, error: " + error);
        }
        else
        {
            logger.debug(TAG + " Successfully sent for notifying the supplier for customer addition email");
        }
    });              
}

//Below function will notify builder about enquiry raised by himself.
exports.notifyBuilderOnEnquiry = function(data, recipients, callback){
    
    var logger = log.logger_rfq;

    var emailObj = {
        "notificationIdentifier": "502",
        "toEmails": recipients.primaryEmail,
        "toMobileNumber": recipients.primaryMobile,
        "smsBodyParams": null,
        "emailBodyParams": {
            "data": data
        },
        "emailAttachment": false,
        "attachmentParams": null,
        "emailAttachmentFileName": null
    };

    sendEmailNotification(emailObj, function(error, bodyEmail){
        if(error)
        {
            logger.error(TAG + " Error sending builder enquiry raised acknowledgement email to:" + recipients.primaryEmail);
        }
        else
        {
            logger.debug(TAG + " Successfully sent builder enquiry raised acknowledgement email to:" + recipients.primaryEmail);
        }
    });

    return callback(false);
}

//Below function will notify supplier when builder refer him(who is already refered by many other builders).
exports.notifySupplierOnReference = function(data, recipients, callback){
    var logger = log.logger_rfq;

    var emailObj = {
        "notificationIdentifier": "503",
        "toEmails": recipients.primaryEmail,
        "toMobileNumber": recipients.primaryMobile,
        "smsBodyParams": {
            "companyName": data.companyName
        },
        "emailBodyParams": {
            "companyName": data.companyName
        },
        "emailAttachment": false,
        "attachmentParams": null,
        "emailAttachmentFileName": null
    };

    sendEmailNotification(emailObj, function(error, bodyEmail){
        if(error)
        {
            logger.error(TAG + " Error sending supplier referece email to spplier email id:" + recipients.primaryEmail);
        }
        else
        {
            logger.debug(TAG + " Successfully sent supplier referece email to spplier email id:" + recipients.primaryEmail);
        }
    });

    return callback(false);
}

//Below function will notify supplier when builder add his details for the first time(No one has refered him yet).
exports.notifySupplierOnaddition = function(data, recipients, callback){
    var logger = log.logger_rfq;

    var emailObj = {
        "notificationIdentifier": "505",
        "toEmails": recipients.primaryEmail,
        "toMobileNumber": recipients.primaryMobile,
        "smsBodyParams": {
            "companyName": data.associatedCompanyName
        },
        "emailBodyParams": {
            "companyName": data.associatedCompanyName
        },
        "emailAttachment": false,
        "attachmentParams": null,
        "emailAttachmentFileName": null
    };

    sendEmailNotification(emailObj, function(error, bodyEmail){
        if(error)
        {
            logger.error(TAG + " Error sending supplier referece email to spplier email id:" + recipients.primaryEmail);
        }
        else
        {
            logger.debug(TAG + " Successfully sent supplier referece email to spplier email id:" + recipients.primaryEmail);
        }
    });

    return callback(false);
}


//Below function will notify SCETA team when builder refer supplier.
exports.notifySCETAOnSupplierReference = function(data, recipients, callback){
    var logger = log.logger_rfq;

    var emailObj = {
        "notificationIdentifier": "504",
        "toEmails": recipients.primaryEmail,
        "toMobileNumber": null,
        "smsBodyParams": null,
        "emailBodyParams": {
            "companyName": data.associatedCompanyName,
            "SellerID": data.supplierId,
            "SellerName": data.companyName,
            "PrimaryContactNo": data.mobileNumber,
            "SecondaryContactNo": "",
            "EmailID": data.email,
            "City": data.city,
            "Pincode": data.pincode,
            "State": data.state,
            "Category": data.categories,
            "Referredby": data.associatedCompanyName
        },
        "emailAttachment": false,
        "attachmentParams": null,
        "emailAttachmentFileName": null
    };

    sendEmailNotification(emailObj, function(error, bodyEmail){
        if(error)
        {
            logger.error(TAG + " Error sending supplier referece email to SCETA team email id:" + recipients.primaryEmail);
        }
        else
        {
            logger.debug(TAG + " Successfully sent supplier referece email to SCETA team email id:" + recipients.primaryEmail);
        }
    });

    return callback(false);
}

//Below function will notify supplier on submitting the Quote Successfully.
exports.notifySuppliersOnQuoteSubmission = function(reqBody, sellerFloatInquiryDetails, quotationDetails, inquiryDetails, callback){

    var logger = log.logger_rfq;
    var db = dbConfig.mongoDbConn
    var inquiryID = sellerFloatInquiryDetails.inquirySellerEntity.inquiryId;
    var sellerquotationId = sellerFloatInquiryDetails.inquirySellerEntity.sellers.sellerquotationId;
    
    var emailObj = {
        "notificationIdentifier": "601",
        "toEmails": [],
        "ccEmails": emailIdConfig.RFQSupplierEmailIds[env].SupplierInquiriesCC,
        "toMobileNumber": null,
        "smsBodyParams": {
            "inquiryID": inquiryID,
            "sellerquotationId": sellerquotationId,
        },
        "emailBodyParams": {
            "inquiryID": inquiryID,
            "sellerquotationId": sellerquotationId,
            "sellerId": reqBody.sellerId,
            "primaryFirstName": null,
            "quotationsDetails": quotationDetails,
            "inquiryDetails": inquiryDetails,
            "sellerFloatInquiryDetails": sellerFloatInquiryDetails,
            "reqBody": reqBody
        },
        "emailAttachment": false,
        "attachmentParams": null,
        "emailAttachmentFileName": null
    };

    var sellerMasterColl = db.collection("SellerMaster");

    sellerMasterColl.findOne({"sellerEntity.profileInfo.accountInfo.sellerId": reqBody.sellerId}, function(error, results){
 
        if(!error && results !== null)
        {
            var primaryFirstName = results.sellerEntity.profileInfo.basicInfo.contactPerson;
            var primaryMobile = results.sellerEntity.profileInfo.basicInfo.mobile;
            var primaryEmail = results.sellerEntity.profileInfo.basicInfo.email;

            emailObj.toEmails.push(primaryEmail);
            emailObj.toMobileNumber = primaryMobile;
            emailObj.emailBodyParams.primaryFirstName = primaryFirstName;
            sendEmailNotification(emailObj, function(error, bodyEmail){
                if(error)
                {
                    logger.error(TAG + " Error sending supplier quotation submition email to spplier email id:" + JSON.stringify(emailObj.toEmails));
                }
                else
                {
                    logger.debug(TAG + " Successfully sent supplier quotation submition email to spplier email id:" + JSON.stringify(emailObj.toEmails));
                }
            });
            return callback(false);
        }
        else{
            logger.error(TAG + " cant find seller data for seller id:" + reqBody.sellerId);
            return callback(false);
        }
    });        
}

exports.notifyPurchaseManager = function(reqBody, sellerFloatInquiryDetails, quotationDetails, inquiryDetails, callback){
    var logger = log.logger_rfq;
    var db = dbConfig.mongoDbConn;
    var inquiryID = sellerFloatInquiryDetails.inquirySellerEntity.inquiryId;
    var sellerquotationId = sellerFloatInquiryDetails.inquirySellerEntity.sellers.sellerquotationId;

    var emailObj = {
        "notificationIdentifier": "602",
        "toEmails": [],
        "ccEmails": [],//emailIdConfig.rfqEmailIds[env].rfqBuildersConsolidatedReport,
        "toMobileNumber": null,
        "smsBodyParams": {
            "inquiryID": inquiryID,
            "sellerquotationId": sellerquotationId,
        },
        "emailBodyParams": {
            "inquiryID": inquiryID,
            "sellerquotationId": sellerquotationId,
            "sellerId": reqBody.sellerId,
            "primaryFirstName": null,
            "quotationsDetails": quotationDetails,
            "inquiryDetails": inquiryDetails,
            "sellerFloatInquiryDetails": sellerFloatInquiryDetails,
            "reqBody": reqBody
        },
        "emailAttachment": false,
        "attachmentParams": null,
        "emailAttachmentFileName": null
    };

    var sellerMasterColl = db.collection("SellerMaster");
    var rfqCityPurchaseManagersEmailsColl = db.collection("RfqCityPurchaseManagersEmails");

    rfqCityPurchaseManagersEmailsColl.findOne({"contanctInfo.city": inquiryDetails.inquiryEntity.inquiryCity}, function(error, results){
 
        if(!error && results !== null)
        {
            var pmEmails = results.contanctInfo.emailids;
            
            sellerMasterColl.findOne({"sellerEntity.profileInfo.accountInfo.sellerId": reqBody.sellerId}, function(error, results){
                if(!error && results !== null)
                {
                    var primaryFirstName = results.sellerEntity.profileInfo.basicInfo.contactPerson;
                    emailObj.emailBodyParams.primaryFirstName = primaryFirstName;
                    emailObj.toEmails = pmEmails;
                    
                    sendEmailNotification(emailObj, function(error, bodyEmail){
                        if(error)
                        {
                            logger.error(TAG + " Error sending purchase manager quotation submition email to manager email id:" + JSON.stringify(emailObj.toEmails));
                        }
                        else
                        {
                            logger.debug(TAG + " Successfully sent purchase manager quotation submition email to manager email id:" + JSON.stringify(emailObj.toEmails));
                        }
                    });
                    return callback(false);
                }
                else{
                    logger.error(TAG + " cant find seller data for seller id:" + reqBody.sellerId);
                    return callback(false);
                }
            });  
            
        }
        else{
            logger.error(TAG + " cant find purchase manager data for city:" + inquiryDetails.inquiryEntity.inquiryCity);
            return callback(false);
        }
    });  
}

exports.notifySuppliersOnFloatEnquiry = function(inquiryDetails, sellerData, purchaseManagersEmail, callback){

    var logger = log.logger_rfq;
    var db = dbConfig.mongoDbConn;

    var inquiryID = inquiryDetails.inquiryEntity.inquiryId;
    var itemDetails = inquiryDetails.inquiryEntity.inquiryStructured.inquiryParams;
    var customerFirstName = inquiryDetails.inquiryEntity.customerFirstName;
    var companyName = inquiryDetails.inquiryEntity.companyName;
    var customerLastName = inquiryDetails.inquiryEntity.customerLastName;
    var projectName = inquiryDetails.inquiryEntity.associatedProjectName;
    var shipToAddress = inquiryDetails.inquiryEntity.shippingAddress;

    var emailObj = {
        "notificationIdentifier": "603",
        "toEmails": [],
        "ccEmails": emailIdConfig.RFQSupplierEmailIds[env].SupplierInquiriesCC.concat(purchaseManagersEmail),
        "bccEmails": emailIdConfig.RFQSupplierEmailIds[env].SupplierInquiriesBCC,
        "toMobileNumber": [],
        "smsBodyParams": {
            "inquiryID": inquiryID
        },
        "emailBodyParams": {
            "inquiryID": inquiryID,
            "itemDetails": itemDetails,
            "customerFirstName": customerFirstName,
            "customerLastName": customerLastName,
            "companyName": companyName,
            "primaryFirstName": null,
            "projectName": projectName,
            "inquiryDetails": inquiryDetails,
            "shipToAddress": shipToAddress,
            "sellerData": sellerData
        },
        "emailAttachment": false,
        "attachmentParams": null,
        "emailAttachmentFileName": null
    };

    var sellerMasterColl = db.collection("SellerMaster");

    sellerMasterColl.findOne({"sellerEntity.profileInfo.accountInfo.sellerId": sellerData.sellerId}, function(error, results){
 
        if(!error && results !== null)
        {
            var primaryFirstName = results.sellerEntity.profileInfo.basicInfo.contactPerson;
            var primaryMobile = results.sellerEntity.profileInfo.basicInfo.mobile;
            var primaryEmail = results.sellerEntity.profileInfo.basicInfo.email;

            emailObj.toEmails.push(primaryEmail);
            emailObj.toMobileNumber.push(primaryMobile);
            emailObj.emailBodyParams.primaryFirstName = primaryFirstName;
            sendEmailNotification(emailObj, function(error, bodyEmail){
                if(error)
                {
                    logger.error(TAG + " Error sending enquiry float email to spplier email id:" + JSON.stringify(emailObj.toEmails));
                }
                else
                {
                    logger.debug(TAG + " Successfully sent enquiry float email to spplier email id:" + JSON.stringify(emailObj.toEmails));
                }
            });
            return callback(false);
        }
        else{
            logger.error(TAG + " cant find seller data for seller id:" + sellerData.sellerId);
            return callback(false);
        }
    });  
}


exports.notifySuppliersOnExpiringEnquiries = function(sellerInfo, inquiryDetails, callback){

    //console.log("notify -- "+JSON.stringify(inquiryDetails));

    var logger = log.logger_rfq;
    var db = dbConfig.mongoDbConn;

    var sellerId = sellerInfo.sellerId;
    var sellerContactInfo = sellerInfo.contactInfo;
    var contactPerson = sellerContactInfo.contactPerson;
    var sellerEmail = sellerContactInfo.email;
    var sellerMobileNumber = sellerContactInfo.mobile;

    var inquiryID = inquiryDetails.inquiryId;
    //var inquiryDate = timezoneConversions.convertDatetoString(timezoneConversions.toIST(inquiryDetails.inquiryTimestamp));

    var inquiryDate = timezoneConversions.ConvertToIST(inquiryDetails.inquiryTimestamp);
    inquiryDate = inquiryDate.substring(0, inquiryDate.indexOf('at'));

    //var customerName = inquiryDetails.customerName || "";
    var customerFirstName = inquiryDetails.customerFirstName;
    var customerLastName = inquiryDetails.customerLastName;
    var companyName = inquiryDetails.companyName;

    var projectName = inquiryDetails.associatedProjectName || "";
    var shipToAddress = inquiryDetails.shippingAddress || "";

    var shipAddress = [];

    Object.keys(inquiryDetails.shippingAddress).forEach(function (key) {
        shipAddress.push(shipToAddress[key]);
    });

    var sellerSubCategories = inquiryDetails.sellerSubcategories || "";
    var paymentMode = inquiryDetails.paymentModes+(inquiryDetails.creditDaysNeeded ? (" - "+inquiryDetails.creditDaysNeeded):(""));
    var inquiryValidity = timezoneConversions.ConvertToIST(inquiryDetails.inquiryDeactivationDate);
    inquiryValidity = inquiryValidity.substring(0, inquiryValidity.indexOf('at'));

    var otherDetails = inquiryDetails.remarks || "";

    var emailObj = {
        "notificationIdentifier": "604",
        "toEmails": [sellerEmail],
        "ccEmails": [],//emailIdConfig.rfqEmailIds[env].rfqBuildersConsolidatedReport,
        "toMobileNumber": null,
        "smsBodyParams": {
            "inquiryID": inquiryID,
            "sellerquotationId": null
        },
        "emailBodyParams": {
            "sellerId": sellerId,
            "sellerContactInfo": sellerContactInfo,
            "contactPerson": contactPerson,
            "inquiryID": inquiryID,
            "inquiryDate": inquiryDate,
            //"customerName": customerName,
            "customerFirstName": customerFirstName,
            "customerLastName": customerLastName,
            "companyName": companyName,

            "projectName": projectName,
            "shipToAddress": shipAddress.join(", "),
            "sellerSubCategories": sellerSubCategories,
            "paymentMode": paymentMode,
            "inquiryValidity": inquiryValidity,
            "otherDetails": otherDetails
        },
        "emailAttachment": false,
        "attachmentParams": null,
        "emailAttachmentFileName": null
    };

    console.log(JSON.stringify("rfqNoti-->>>"+JSON.stringify(emailObj.emailBodyParams)));
    logger.debug(JSON.stringify("rfqNoti-->>>"+JSON.stringify(emailObj.emailBodyParams)));

    sendEmailNotification(emailObj, function(error, bodyEmail){
        if(error)
        {
            logger.error(TAG + " Error sending Inquiries Expirinig today email to supplier email id:" + JSON.stringify(emailObj.toEmails));
        }
        else
        {
            logger.debug(TAG + " Successfully sent Inquiries Expirinig today email to spplier email id:" + JSON.stringify(emailObj.toEmails));
        }
    });
};
//Function Calls POST API service for Sending email Notification.
function sendEmailNotification(emailBodyParameters, callback){
    //Variable for Logging the messages to the file.

    var logger = log.logger_rfq;

    //emailBodyParameters = JSON.parse(emailBodyParameters);
    var WHICH_HOST = hostDetails.WHICH_HOST;
    var postData = JSON.stringify({
        "notificationIdentifier" : emailBodyParameters.notificationIdentifier,
        "toEmails" : emailBodyParameters.toEmails,
        "ccEmails" : emailBodyParameters.ccEmails !== undefined ? emailBodyParameters.ccEmails : [],
        "bccEmails" : emailBodyParameters.bccEmails !== undefined ? emailBodyParameters.bccEmails : [],
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