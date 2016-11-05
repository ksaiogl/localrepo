//This file contains functions that will help to create body of emial.
var TAG = "SupplierNotifications - ";
var log = require('../../Environment/log4js.js');
var notifications = require('../helpers/notifications.js');
var pushNotification = require('../helpers/pushNotification.js');
var request = require("request");
var async = require('async');
var timezoneConversions = require('../helpers/timezoneConversions.js');
var dbConfig = require('../../Environment/mongoDatabase.js');
var underscore = require('underscore');
var fs = require('fs');
var pdf = require('html-pdf');
var env = require('../../Environment/env.js').env;
var Client = require('node-rest-client').Client;
var commaIt = require('comma-it');
//var envURL = require('../../Environment/notificationServiceHostDetails.js');
var hostDetails = require('../../Environment/notificationServiceHostDetails.js');
var http = require('http');
var manageNotifications = require('./manageNotifications.js');
//Required for generating html content for notifications.
var htmlreg = require('../emailhtmls/supplierjs/registrationSupplierEmail.js');
var htmlregSupport = require('../emailhtmls/supplierjs/registrationSupportEmail.js');
var htmlsupplierActive = require('../emailhtmls/supplierjs/supplierActivationEmail.js');
var htmlSupportsupplierActive = require('../emailhtmls/supplierjs/supplierActiveSupportEmail.js');
var htmlPasswordChange = require('../emailhtmls/supplierjs/changePasswordSupplierEmail.js');
var htmlPasswordReset = require('../emailhtmls/supplierjs/resetPasswordSupplierEmail.js');
var htmlsupplierNewOrder = require('../emailhtmls/supplierjs/NewOrderSupplierEmail.js');
var todayDeliverablesEmail = require('../emailhtmls/supplierjs/todayDeliverablesEmail.js');
var tomorrowDeliverablesEmail = require('../emailhtmls/supplierjs/tomorrowDeliverablesEmail.js');
var delayedDeliverablesEmail = require('../emailhtmls/supplierjs/delayedDeliverables.js');
//var readyToShipSupplierEmail = require('../emailhtmls/supplierjs/readyToShipSupplierEmail.js');
var orderCancellationEmail = require('../emailhtmls/supplierjs/orderCancellationEmail.js');
var lineItemsOrderCancellationEmail = require('../emailhtmls/supplierjs/lineItemsOrderCancellationEmail.js');
//var manifest = require('../emailhtmls/supplierjs/manifest.js');
var emailIdConfig = require('../helpers/emailIdConfig.js');
var htmlRFQsupplierActive = require('../emailhtmls/supplierjs/supplierRFQActivationEmail.js');
//var invoice = require('../emailhtmls/supplierjs/invoice.js');
//support email of msupply, using which all emails will be sent.
//var MSUPPLY_SUPPORT_EMAIL = "support@msupply.com";
//var TO_MSUPPLY_SUPPORT_EMAIL = "<shashidhar@msupply.com>, <abhinandan@msupply.com>, <sravanthi_c@msupply.com>";
//var TO_SUPPORT_EMAIL = "<shashidhar@msupply.com>, <abhinandan@msupply.com>, <sravanthi_c@msupply.com>";
//for Prod
//var TO_MSUPPLY_SUPPORT_EMAIL = "<fulfillment@msupply.com>, <pallav@msupply.com>, <abhinandan@msupply.com>, <debasis@msupply.com>";
//var TO_SUPPORT_EMAIL = "<support@msupply.com>, <abhinandan@msupply.com>, <spoorti@msupply.com>";
var MSUPPLY_SUPPORT_EMAIL = emailIdConfig.emailIds[env].fromEmailMsupplySupport;
var TO_MSUPPLY_SUPPORT_EMAIL = emailIdConfig.emailIds[env].fulfillmentEmail;
var BCC_MSUPPLY_SUPPORT_EMAIL = emailIdConfig.emailIds[env].fulfillmentEmail_bcc;
var TO_SUPPORT_EMAIL = emailIdConfig.emailIds[env].supportEmailSupplierActivation;
var BCC_SUPPLIERACTIVATION_EMAIL = emailIdConfig.emailIds[env].supportEmailSupplierActivation_bcc;

//Function that will notify msupply support and supplier regarding succesfull registration of supplier.
exports.sendRegistrationEmail = function (req, callback){
    var logger = log.logger_sup;
    logger.debug(TAG + " Initiated notifying Msupply support, supplier regarding supplier registration.");

    // Function that will call supplierRegSupportEmailNotification function.
    supplierRegSupportEmailNotification(req, function(error, result){

    });
    // Function that will call supplierRegEmailNotification function.
    supplierRegEmailNotification(req, function(error, result){

    });
    // Function that will call supplierRegSmsNotification function.
    supplierRegSmsNotification(req, function(error, result){

    });
};

//Function that will send email to msupply support team, notifying registration of new supplier.
function supplierRegSupportEmailNotification(req, callback){
    var logger = log.logger_sup;

    //Multiple emails should be in the format '<abc@abc.com>, <xyz@abc.com>'
    var toEmails = TO_MSUPPLY_SUPPORT_EMAIL;
    var ccEmails = "";
    var bccEmails = "";
    var fromEmail  = MSUPPLY_SUPPORT_EMAIL;
    var subjectEmail = "New Supplier Registration.";

    htmlregSupport.registrationSupportEmail(req, function(bodyEmail){

        var bodyText = bodyEmail;

        notifications.sendPlainEmail(fromEmail, toEmails, ccEmails, bccEmails, subjectEmail, bodyText, function(error, result){
            if(error){
                logger.error(TAG + " Error sending supplier registration email to Msupply support- " + error);
            }
            else{
                logger.debug(TAG + " Successfully sent supplier registration email to Msupply support.");
            }
        });
    });
}

//Function that will send email to supplier, notifying successfull registration of supplier.
function supplierRegEmailNotification(req, callback){
    var logger = log.logger_sup;

    //Multiple emails should be in the format '<abc@abc.com>, <xyz@abc.com>'
    var toEmails = req.body.contactInfo.primaryEmail;
    var ccEmails = "";
    var bccEmails = "";
    var fromEmail  = MSUPPLY_SUPPORT_EMAIL;
    var subjectEmail = "Thank You for your interest on mSupply.com";
    var firstName = req.body.contactInfo.primaryFirstName;

    htmlreg.registrationSupplierEmail(firstName, function(bodyEmail){

        var bodyText = bodyEmail;

        notifications.sendPlainEmail(fromEmail, toEmails, ccEmails, bccEmails, subjectEmail, bodyText, function(error, result){
            if(error)
            {
                logger.error(TAG + " Error sending supplier registration email to supplier with emailid " +req.body.contactInfo.primaryEmail+", Error- "+error);
            }
            else
            {
                logger.debug(TAG + " Successfully sent supplier registration email to "+req.body.contactInfo.primaryEmail);
            }
        });
    });
}

//Function that will send sms to supplier, notifying successfull registration of supplier.
function supplierRegSmsNotification(req, callback){
    var logger = log.logger_sup;

    var message = "Hi Supplier, " +
        "%0A Thank You for registering with mSupply.com. We will call you shortly for more information." +
        "%0A Now get more business from owners, contractors, carpenters & builders.";

    notifications.sendSms(req.body.contactInfo.primaryMobile, message, function(error, result){
        if(!error){
            logger.debug(TAG + " Successfully sent supplier registration sms to mobile no: "+ req.body.contactInfo.primaryMobile);
        }
        else{
            logger.error(TAG + " Error sending supplier registration sms to mobile no: "+ req.body.contactInfo.primaryMobile);
        }
    });
}

//Function that will notify supplier regarding succesfull password change of supplier.
exports.notifyOnPasswordChange = function(supplierInfo, callback){
    var logger = log.logger_sup;
    logger.debug(TAG + " Initiated notifying supplier regarding password change.");

    //Multiple emails should be in the format '<abc@abc.com>, <xyz@abc.com>'
    var toEmails = supplierInfo.supplierPrimaryEmail;
    var ccEmails = "";
    var bccEmails = "";
    var fromEmail  = MSUPPLY_SUPPORT_EMAIL;
    var subjectEmail = "mSupply Seller password updated.";
    var firstName = supplierInfo.supplierName;

    htmlPasswordChange.changePasswordSupplierEmail(firstName, function(bodyEmail){

        var bodyText = bodyEmail;

        //Below function will send email to supplier, notifying succesfull password change.
        notifications.sendPlainEmail(fromEmail, toEmails, ccEmails, bccEmails, subjectEmail, bodyText, function(error, result){
            if(error)
            {
                logger.error(TAG + " Error sending supplier password change email to supplier with emailid " +supplierInfo.supplierPrimaryEmail+", Error- "+error);
            }
            else
            {
                logger.debug(TAG + " Successfully sent supplier password change email to "+supplierInfo.supplierPrimaryEmail);
            }
        });
    });

    //Below function will send sms to supplier, notifying succesfull password change.
    var smsMessage = "You have successfully updated your mSupply Seller password.";

    notifications.sendSms(supplierInfo.supplierPrimaryMobile, smsMessage, function(error, result){
        if(error)
        {
            logger.error(TAG + " Error sending supplier password change sms to mobile no: "+ supplierInfo.supplierPrimaryMobile);
        }
        else
        {
            logger.debug(TAG + "Successfully sent supplier password change sms to mobile no: "+ supplierInfo.supplierPrimaryMobile);
        }
    });
};


//Function that will notify supplier regarding succesfull password reset of supplier.
exports.notifyOnPasswordReset = function(supplierInfo, callback){
    var logger = log.logger_sup;
    logger.debug(TAG + " Initiated notifying supplier regarding password reset.");

    //Multiple emails should be in the format '<abc@abc.com>, <xyz@abc.com>'
    var toEmails = supplierInfo.supplierPrimaryEmail;
    var ccEmails = "";
    var bccEmails = "";
    var fromEmail  = MSUPPLY_SUPPORT_EMAIL;
    var subjectEmail = "mSupply Seller App password reset.";
    var firstName = supplierInfo.supplierName;

   htmlPasswordReset.resetPasswordSupplierEmail(firstName, function(bodyEmail){

        var bodyText = bodyEmail;

        //Below function will send email to supplier, notifying succesfull password reset.
        notifications.sendPlainEmail(fromEmail, toEmails, ccEmails, bccEmails, subjectEmail, bodyText, function(error, result){
            if(error)
            {
                logger.error(TAG + " Error sending supplier password reset email to supplier with emailid " +supplierInfo.supplierPrimaryEmail+", Error- "+ error);
            }
            else
            {
                logger.debug(TAG + " Successfully sent supplier password reset email to "+supplierInfo.supplierPrimaryEmail);
            }
        });
    });

    //Below function will send sms to supplier, notifying succesfull password reset.
    var smsMessage = "You have successfully reset your mSupply Seller App password.";

    notifications.sendSms(supplierInfo.supplierPrimaryMobile, smsMessage, function(error, result){
        if(error)
        {
            logger.error(TAG + " Error sending supplier password reset sms to mobile no: "+ supplierInfo.supplierPrimaryMobile);
        }
        else
        {
            logger.debug(TAG + " Successfully sent supplier password reset sms to mobile no: "+ supplierInfo.supplierPrimaryMobile);
        }
    });
};

//Function that will send email, sms for newly activated suppliers.
exports.notifySupplierActivation = function(supplierInfo, callback){
    var logger = log.logger_sup;
    // To Send Email
    var fromEmail  = MSUPPLY_SUPPORT_EMAIL;
    var ccEmails = "";
    var bccEmails = BCC_SUPPLIERACTIVATION_EMAIL;
    //var subjectEmail = "Congrats! You are now a supplier on mSupply.com";
    var subjectEmail = "Download mSupply Seller App to manage your orders";

    var firstName = supplierInfo.sellerEntity.profileInfo.basicInfo.contactPerson;
    var primaryMobile = supplierInfo.sellerEntity.profileInfo.basicInfo.mobile;
    var primaryEmail = supplierInfo.sellerEntity.profileInfo.basicInfo.email;
    var sellerId = supplierInfo.sellerEntity.profileInfo.accountInfo.sellerId;
    var defaultPassword = "Password123";

    htmlsupplierActive.supplierActivationEmail(firstName, primaryMobile, defaultPassword, function(bodyEmail){

        var bodyText = bodyEmail;
        //Sending newly activation email to supplier.
        notifications.sendPlainEmail(fromEmail, primaryEmail, ccEmails, bccEmails, subjectEmail, bodyText, function(error, result){
            if(!error)
            {
                logger.debug(TAG + " successfully sent newly activated supplier notification email to "+primaryEmail);
                //Send email to Internal Support team on Supplier Activation.
                htmlSupportsupplierActive.supplierActivationEmail(sellerId,firstName, primaryMobile, primaryEmail, function(supportBodyEmail){

                    var emailbodyText = supportBodyEmail;
                    var supportSubjectEmail = 'Seller documents processed successfully';
                    notifications.sendPlainEmail(fromEmail, TO_SUPPORT_EMAIL, ccEmails, bccEmails, supportSubjectEmail, emailbodyText, function(error, result){
                        if(error)
                        {
                            logger.error(TAG + " Error sending Support emails for newly activated supplier- " + primaryEmail);
                        }
                    });
                });
            }
            else
            {
                logger.error(TAG + " Error sending emails for newly activated supplier- " + primaryEmail+", error: "+error);
            }
        });
    });

    /*var message = "Dear Supplier "+
    "%0A Congratulations! Now you can sell on mSupply.com. We will call you shortly with more details." +
    "%0A .Please check your email for login details. Download the App Now: https://www.google.co.in/.";
    */
    var message = "Dear Supplier "+
    "%0A You can now manage your orders through the mSupply Seller App. Check your email for login credentials and Download the App to get Started." +
    "%0A Download the App Now: https://play.google.com/store/apps/details?id=com.mobileapp.msupply.supplier.";

    //Sending newly activation sms to supplier.
    notifications.sendSms(primaryMobile, message, function(error, result){
        if(!error)
        {
            logger.debug(TAG + "successfully sent newly activated supplier notification to mobile no: "+ primaryMobile);
        }
        else
        {
            logger.error(TAG + "Error sending sms for newly activated supplier: "+ primaryMobile);
        }
    });
};

// RFQ Enabled Supplier Notifications.
//Function that will send email, sms for newly activated suppliers.
exports.notifyRFQSupplierActivation = function(supplierInfo, callback){
    var logger = log.logger_sup;
    // To Send Email
    var fromEmail  = MSUPPLY_SUPPORT_EMAIL;
    var ccEmails = "";
    var bccEmails = BCC_SUPPLIERACTIVATION_EMAIL;
    //var subjectEmail = "Congrats! You are now a supplier on mSupply.com";
    var subjectEmail = "Welcome! You are now a verified supplier on mSupply.com";
    var firstName = supplierInfo.sellerEntity.profileInfo.basicInfo.contactPerson;
    var primaryMobile = supplierInfo.sellerEntity.profileInfo.basicInfo.mobile;
    var primaryEmail = supplierInfo.sellerEntity.profileInfo.basicInfo.email;
    var sellerId = supplierInfo.sellerEntity.profileInfo.accountInfo.sellerId;
    var defaultPassword = "Password123";

    htmlRFQsupplierActive.supplierRFQActivationEmail(firstName, primaryMobile, defaultPassword, function(bodyEmail){

        var bodyText = bodyEmail;
        //Sending newly activation email to supplier.
        notifications.sendPlainEmail(fromEmail, primaryEmail, ccEmails, bccEmails, subjectEmail, bodyText, function(error, result){
            if(!error)
            {
                logger.debug(TAG + " successfully sent newly activated supplier notification email to "+primaryEmail);
                //Send email to Internal Support team on Supplier Activation.
                htmlSupportsupplierActive.supplierActivationEmail(sellerId,firstName, primaryMobile, primaryEmail, function(supportBodyEmail){

                    var emailbodyText = supportBodyEmail;
                    var supportSubjectEmail = 'Seller documents processed successfully';
                    notifications.sendPlainEmail(fromEmail, TO_SUPPORT_EMAIL, ccEmails, bccEmails, supportSubjectEmail, emailbodyText, function(error, result){
                        if(error)
                        {
                            logger.error(TAG + " Error sending Support emails for newly activated supplier- " + primaryEmail);
                        }
                    });
                });
            }
            else
            {
                logger.error(TAG + " Error sending emails for newly activated supplier- " + primaryEmail+", error: "+error);
            }
        });
    });

    /*var message = "Dear Supplier "+
    "%0A Congratulations! Now you can sell on mSupply.com. We will call you shortly with more details." +
    "%0A .Please check your email for login details. Download the App Now: https://www.google.co.in/.";
    */
    var message = "Dear Supplier "+
    "%0A Congratulations! Your documents have been verified. You can now receive enquiries and submit quotes on mSupply.com." +
    "%0A Your login credentials have been sent to your registered email.";

    //Sending newly activation sms to supplier.
    notifications.sendSms(primaryMobile, message, function(error, result){
        if(!error)
        {
            logger.debug(TAG + "successfully sent newly activated supplier notification to mobile no: "+ primaryMobile);
        }
        else
        {
            logger.error(TAG + "Error sending sms for newly activated supplier: "+ primaryMobile);
        }
    });
};

//Function that will send email to supplier notifying new order.
exports.supplierOrderNotification = function(outputJSON, sellerInfo, callback){
    var logger = log.logger_OMS;
    var commaITConfig = {addPrecision:true, thousandSeperator : ',', decimalSeperator : '.'};

    //console.log("Inside Insert Order supplierOrderNotification");
    //var notificationURL = "http://" + envURL.WHICH_HOST + '/notification/api/v1.0/sendNotification';

    var emailObj = {
    "notificationIdentifier": "305",
    "toEmails": [sellerInfo.primaryEmail],
    "toMobileNumber": [sellerInfo.primaryMobile],
    "smsBodyParams": {"orderId": outputJSON.orderEntity.orderInfo.orderNumber},
    "emailBodyParams": {
        "orderId": outputJSON.orderEntity.orderInfo.orderNumber,
        "orderDate": timezoneConversions.ConvertToIST(outputJSON.orderEntity.orderInfo.orderDate),
          "minOrderDeliveryDate":"",
        "orderItemInfo": [],
        "subTotal": "",
        "discount": 0,
        "serviceCharges": 0,
        "VAT":"",
        "shippingAndHandling": "",
        "exciseDuty":"",
        "grandTotal": "",
        "paymentMethod": "Immediate Payment", //outputJSON.orderEntity.paymentInfo.paymentMode,
        "orderDeliveryAddress": {
            "customerFullName": "",
            "addressLine1": "",
            "addressLine2": "",
            "city": "",
            "state": "",
            "country": "",
            "pinCode": "",
            "mobile": ""
        },
        "orderBillingAddress": {
            "customerFullName": "",
            "addressLine1": "",
            "addressLine2": "",
            "city": "",
            "state": "",
            "country": "",
            "pinCode": "",
            "mobile": ""
        }
    },
    "emailAttachment": false,
    "attachmentParams": null,
    "emailAttachmentFileName": null
};

// Storing min delivey date of all items
var orderDeliveryDates = [];

// Populating orderItemInfo
sellerInfo.orderItemInfo.forEach(function(element){
  logger.info("supplier notif element : " + JSON.stringify(element));
  var orderItemInfoObj = {
  "SKUId": element.SKUId,
  "SKUImage": element.SKUImage,
  "productName": element.productName,
  "price": commaIt(element.price, commaITConfig),
  "quantity": element.quantity,
  "subTotal": commaIt(element.subTotal ,commaITConfig)
};
emailObj.emailBodyParams.orderItemInfo.push(orderItemInfoObj);
orderDeliveryDates.push(new Date(element.minDeliveryDate));

});

// Setting min delivey date
var minOrderDeliveryDate = Math.min.apply(null, orderDeliveryDates);
minOrderDeliveryDate = timezoneConversions.ConvertToIST(minOrderDeliveryDate);
emailObj.emailBodyParams.minOrderDeliveryDate = minOrderDeliveryDate;

// Setting finalcial data
for(var i in outputJSON.orderEntity.financials.seller){
  if (outputJSON.orderEntity.financials.seller[i].sellerId == sellerInfo.sellerId) {

    emailObj.emailBodyParams.subTotal = commaIt(outputJSON.orderEntity.financials.seller[i].sellerTotal.subtotal,commaITConfig);
    emailObj.emailBodyParams.VAT = commaIt(outputJSON.orderEntity.financials.seller[i].sellerTotal.VAT,commaITConfig);
    emailObj.emailBodyParams.shippingAndHandling = commaIt(outputJSON.orderEntity.financials.seller[i].sellerTotal.shippingAndHandlingCharges,commaITConfig);
    emailObj.emailBodyParams.exciseDuty = commaIt(outputJSON.orderEntity.financials.seller[i].sellerTotal.excise, commaITConfig);
    emailObj.emailBodyParams.grandTotal = commaIt(outputJSON.orderEntity.financials.seller[i].sellerTotal.total - outputJSON.orderEntity.financials.seller[i].sellerTotal.threePLCharges, commaITConfig);
    break;
  }
}

// Setting shipping address
for (var i in outputJSON.orderEntity.orderInfo.orderDeliveryAddress) {
  if (outputJSON.orderEntity.orderInfo.orderDeliveryAddress[i].addressType == 'Shipping') 
    {
        emailObj.emailBodyParams.orderDeliveryAddress.customerFullName = outputJSON.orderEntity.orderInfo.orderDeliveryAddress[i].ContactfirstName + " " + outputJSON.orderEntity.orderInfo.orderDeliveryAddress[i].ContactlastName;
        emailObj.emailBodyParams.orderDeliveryAddress.addressLine1 = outputJSON.orderEntity.orderInfo.orderDeliveryAddress[i].addressLine1;
        emailObj.emailBodyParams.orderDeliveryAddress.addressLine2 = outputJSON.orderEntity.orderInfo.orderDeliveryAddress[i].addressLine2;
        emailObj.emailBodyParams.orderDeliveryAddress.city = outputJSON.orderEntity.orderInfo.orderDeliveryAddress[i].city;
        emailObj.emailBodyParams.orderDeliveryAddress.state = outputJSON.orderEntity.orderInfo.orderDeliveryAddress[i].state;
        emailObj.emailBodyParams.orderDeliveryAddress.country = outputJSON.orderEntity.orderInfo.orderDeliveryAddress[i].country;
        emailObj.emailBodyParams.orderDeliveryAddress.pinCode = outputJSON.orderEntity.orderInfo.orderDeliveryAddress[i].pinCode;
        emailObj.emailBodyParams.orderDeliveryAddress.mobile = outputJSON.orderEntity.orderInfo.orderDeliveryAddress[i].Contactmobile;
    }
    else if (outputJSON.orderEntity.orderInfo.orderDeliveryAddress[i].addressType == 'Billing') 
    {
        emailObj.emailBodyParams.orderBillingAddress.customerFullName = outputJSON.orderEntity.orderInfo.orderDeliveryAddress[i].ContactfirstName + " " + outputJSON.orderEntity.orderInfo.orderDeliveryAddress[i].ContactlastName;
        emailObj.emailBodyParams.orderBillingAddress.addressLine1 = outputJSON.orderEntity.orderInfo.orderDeliveryAddress[i].addressLine1;
        emailObj.emailBodyParams.orderBillingAddress.addressLine2 = outputJSON.orderEntity.orderInfo.orderDeliveryAddress[i].addressLine2;
        emailObj.emailBodyParams.orderBillingAddress.city = outputJSON.orderEntity.orderInfo.orderDeliveryAddress[i].city;
        emailObj.emailBodyParams.orderBillingAddress.state = outputJSON.orderEntity.orderInfo.orderDeliveryAddress[i].state;
        emailObj.emailBodyParams.orderBillingAddress.country = outputJSON.orderEntity.orderInfo.orderDeliveryAddress[i].country;
        emailObj.emailBodyParams.orderBillingAddress.pinCode = outputJSON.orderEntity.orderInfo.orderDeliveryAddress[i].pinCode;
        emailObj.emailBodyParams.orderBillingAddress.mobile = outputJSON.orderEntity.orderInfo.orderDeliveryAddress[i].Contactmobile;
    }
  }
    
    sendEmailNotification(emailObj, function(error, bodyEmail){
        if(error)
        {
            logger.error(TAG + " Error sending Insert Order,supplierOrderNotification email for Ordernumber:" + outputJSON.orderEntity.orderInfo.orderNumber +", error: " + error);
        }
        else
        {
            logger.debug(TAG + " Successfully sent Insert Order,supplierOrderNotification email for Ordernumber:" + outputJSON.orderEntity.orderInfo.orderNumber);
        }
    });

    //Sending Push notification to supplier.
    if (sellerInfo.cloudTokenID) {

         var pushInfo = {
          "notificationType": "confirmedOrders",
          "orderNumber": outputJSON.orderEntity.orderInfo.orderNumber,
          "title": "New Order Received",
          "message": "You have received the order: "+ outputJSON.orderEntity.orderInfo.orderNumber +" from mSupply customer.",
          "mobile": sellerInfo.primaryMobile
         };

         pushNotification.sendPushNotifications(pushInfo, sellerInfo.cloudTokenID, function(error, result){
           if(error)
           {
               logger.error(TAG + " Error sending order confirmation supplier push notification for Ordernumber:" + outputJSON.orderEntity.orderInfo.orderNumber +", error: " + error);
           }
           else
           {
               logger.debug(TAG + " Successfully sent order confirmation supplier push notification for Ordernumber:" + outputJSON.orderEntity.orderInfo.orderNumber);
           }
         });

         //Structure of notification to be stored into SupplierNotifications.
          var notificationArray = [];
          var notificationToStore = {
              "type": "confirmedOrders",
              "orderNumber": outputJSON.orderEntity.orderInfo.orderNumber,
              "title" : "New Order Received",
              "read" : false,
              "message": "You have received the order: "+ outputJSON.orderEntity.orderInfo.orderNumber +" from mSupply customer.",
              "notificationSentOn" : new Date(),
              "orderDisplayStatus" : "New"
             };

          notificationArray.push(notificationToStore);
          //Function to be called to store notification.
          manageNotifications.insertNotificaiton(sellerInfo.sellerId, notificationArray, function(error, result){
          });

    }

}




//Function that will send email to supplier notifying new order.
exports.supplierCreditOrderNotification = function(outputJSON, sellerInfo, callback){
    var logger = log.logger_OMS;
    var commaITConfig = {addPrecision:true, thousandSeperator : ',', decimalSeperator : '.'};

    //console.log("Inside Insert Order supplierOrderNotification");
    //var notificationURL = "http://" + envURL.WHICH_HOST + '/notification/api/v1.0/sendNotification';

    var emailObj = {
    "notificationIdentifier": "307",
    "toEmails": [sellerInfo.primaryEmail],
    "toMobileNumber": [sellerInfo.primaryMobile],
    "smsBodyParams": {"orderId": outputJSON.orderEntity.orderInfo.orderNumber},
    "emailBodyParams": {
        "orderId": outputJSON.orderEntity.orderInfo.orderNumber,
        "orderDate": timezoneConversions.ConvertToIST(outputJSON.orderEntity.orderInfo.orderDate),
          "minOrderDeliveryDate":"",
        "orderItemInfo": [],
        "subTotal": "",
        // "discount": 0,
        // "serviceCharges": 0,
        "VAT":"",
        "shippingAndHandling": "",
        // "exciseDuty":"",
        "grandTotal": "",
        "paymentMethod": outputJSON.orderEntity.paymentInfo.paymentMode,
        "customerType": outputJSON.orderEntity.orderInfo.customerInfo.primaryPersona,
        "creditPeriod": outputJSON.orderEntity.orderInfo.creditDays,
        "orderDeliveryAddress": {
            "customerFullName": "",
            "addressLine1": "",
            "addressLine2": "",
            "city": "",
            "state": "",
            "country": "",
            "pinCode": "",
            "mobile": ""
        },
        "orderBillingAddress": {
            "customerFullName": "",
            "addressLine1": "",
            "addressLine2": "",
            "city": "",
            "state": "",
            "country": "",
            "pinCode": "",
            "mobile": ""
        }
    },
    "emailAttachment": "PreGeneratedPDF",
    "attachmentParams": [{"emailAttachmentFileName": "supplier_agreement.pdf"}],
    // "emailAttachmentFileName": null
};

// Storing min delivey date of all items
var orderDeliveryDates = [];

// Populating orderItemInfo
sellerInfo.orderItemInfo.forEach(function(element){
  var orderItemInfoObj = {
  "SKUId": element.SKUId,
  // "SKUImage": element.SKUImage,
  "productName": element.productName,
  "price": commaIt(element.price, commaITConfig),
  "quantity": element.quantity,
  "subTotal": commaIt(element.subTotal ,commaITConfig)
};
emailObj.emailBodyParams.orderItemInfo.push(orderItemInfoObj);
orderDeliveryDates.push(new Date(element.minDeliveryDate));

});

// Setting min delivey date
var minOrderDeliveryDate = Math.min.apply(null, orderDeliveryDates);
minOrderDeliveryDate = timezoneConversions.ConvertToIST(minOrderDeliveryDate);
emailObj.emailBodyParams.minOrderDeliveryDate = minOrderDeliveryDate;

// Setting finalcial data
for(var i in outputJSON.orderEntity.financials.seller){
  if (outputJSON.orderEntity.financials.seller[i].sellerId == sellerInfo.sellerId) {

    emailObj.emailBodyParams.subTotal = commaIt(outputJSON.orderEntity.financials.seller[i].sellerTotal.subtotal,commaITConfig);
    emailObj.emailBodyParams.VAT = commaIt(outputJSON.orderEntity.financials.seller[i].sellerTotal.VAT,commaITConfig);
    emailObj.emailBodyParams.shippingAndHandling = commaIt(outputJSON.orderEntity.financials.seller[i].sellerTotal.shippingAndHandlingCharges,commaITConfig);
    // emailObj.emailBodyParams.exciseDuty = commaIt(outputJSON.orderEntity.financials.seller[i].sellerTotal.excise, commaITConfig);
    emailObj.emailBodyParams.grandTotal = commaIt(outputJSON.orderEntity.financials.seller[i].sellerTotal.total - outputJSON.orderEntity.financials.seller[i].sellerTotal.threePLCharges, commaITConfig);
    break;
  }
}

// Setting shipping address
for (var i in outputJSON.orderEntity.orderInfo.orderDeliveryAddress) {
  if (outputJSON.orderEntity.orderInfo.orderDeliveryAddress[i].addressType == 'Shipping') 
    {
        emailObj.emailBodyParams.orderDeliveryAddress.customerFullName = outputJSON.orderEntity.orderInfo.orderDeliveryAddress[i].ContactfirstName + " " + outputJSON.orderEntity.orderInfo.orderDeliveryAddress[i].ContactlastName;
        emailObj.emailBodyParams.orderDeliveryAddress.addressLine1 = outputJSON.orderEntity.orderInfo.orderDeliveryAddress[i].addressLine1;
        emailObj.emailBodyParams.orderDeliveryAddress.addressLine2 = outputJSON.orderEntity.orderInfo.orderDeliveryAddress[i].addressLine2;
        emailObj.emailBodyParams.orderDeliveryAddress.city = outputJSON.orderEntity.orderInfo.orderDeliveryAddress[i].city;
        emailObj.emailBodyParams.orderDeliveryAddress.state = outputJSON.orderEntity.orderInfo.orderDeliveryAddress[i].state;
        emailObj.emailBodyParams.orderDeliveryAddress.country = outputJSON.orderEntity.orderInfo.orderDeliveryAddress[i].country;
        emailObj.emailBodyParams.orderDeliveryAddress.pinCode = outputJSON.orderEntity.orderInfo.orderDeliveryAddress[i].pinCode;
        emailObj.emailBodyParams.orderDeliveryAddress.mobile = outputJSON.orderEntity.orderInfo.orderDeliveryAddress[i].Contactmobile;
    }
    else if (outputJSON.orderEntity.orderInfo.orderDeliveryAddress[i].addressType == 'Billing') 
    {
        emailObj.emailBodyParams.orderBillingAddress.customerFullName = outputJSON.orderEntity.orderInfo.orderDeliveryAddress[i].ContactfirstName + " " + outputJSON.orderEntity.orderInfo.orderDeliveryAddress[i].ContactlastName;
        emailObj.emailBodyParams.orderBillingAddress.addressLine1 = outputJSON.orderEntity.orderInfo.orderDeliveryAddress[i].addressLine1;
        emailObj.emailBodyParams.orderBillingAddress.addressLine2 = outputJSON.orderEntity.orderInfo.orderDeliveryAddress[i].addressLine2;
        emailObj.emailBodyParams.orderBillingAddress.city = outputJSON.orderEntity.orderInfo.orderDeliveryAddress[i].city;
        emailObj.emailBodyParams.orderBillingAddress.state = outputJSON.orderEntity.orderInfo.orderDeliveryAddress[i].state;
        emailObj.emailBodyParams.orderBillingAddress.country = outputJSON.orderEntity.orderInfo.orderDeliveryAddress[i].country;
        emailObj.emailBodyParams.orderBillingAddress.pinCode = outputJSON.orderEntity.orderInfo.orderDeliveryAddress[i].pinCode;
        emailObj.emailBodyParams.orderBillingAddress.mobile = outputJSON.orderEntity.orderInfo.orderDeliveryAddress[i].Contactmobile;
    }
  }
    
    sendEmailNotification(emailObj, function(error, bodyEmail){
        if(error)
        {
            logger.error(TAG + " Error sending Insert Order,supplierOrderNotification email for Ordernumber:" + outputJSON.orderEntity.orderInfo.orderNumber +", error: " + error);
        }
        else
        {
            logger.debug(TAG + " Successfully sent Insert Order,supplierOrderNotification email for Ordernumber:" + outputJSON.orderEntity.orderInfo.orderNumber);
        }
    });

    //Sending Push notification to supplier.
    if (sellerInfo.cloudTokenID) {
       var pushInfo = {
        "notificationType": "confirmedOrders",
        "orderNumber": outputJSON.orderEntity.orderInfo.orderNumber,
        "title": "New Order Received",
        "message": "You have received the order: "+ outputJSON.orderEntity.orderInfo.orderNumber +" from mSupply customer.",
        "mobile": sellerInfo.primaryMobile
       };

       pushNotification.sendPushNotifications(pushInfo, sellerInfo.cloudTokenID, function(error, result){
         if(error)
         {
             logger.error(TAG + " Error sending order confirmation supplier push notification for Ordernumber:" + outputJSON.orderEntity.orderInfo.orderNumber +", error: " + error);
         }
         else
         {
             logger.debug(TAG + " Successfully sent order confirmation supplier push notification for Ordernumber:" + outputJSON.orderEntity.orderInfo.orderNumber);
         }
       });

       //Structure of notification to be stored into SupplierNotifications.
        var notificationArray = [];
        var notificationToStore = {
            "type": "confirmedOrders",
            "orderNumber": outputJSON.orderEntity.orderInfo.orderNumber,
            "title" : "New Order Received",
            "read" : false,
            "message": "You have received the order: "+ outputJSON.orderEntity.orderInfo.orderNumber +" from mSupply customer.",
            "notificationSentOn" : new Date(),
            "orderDisplayStatus" : "New"
           };

        notificationArray.push(notificationToStore);
        //Function to be called to store notification.
        manageNotifications.insertNotificaiton(sellerInfo.sellerId, notificationArray, function(error, result){
        });
    }
}



//Function to send email and SMS for supplier who cancelled the order item or whole order.
exports.OrderCancellationEmail = function (cancelledOrders, skuids, orderLevelUpdation, callback){
    //Variable for Logging the messages to the file.
    var logger = log.logger_sup;
    var db = dbConfig.mongoDbConn;
    var supplierColl = db.collection('SellerMaster');

    var supportEmail = TO_MSUPPLY_SUPPORT_EMAIL;
    var fromEmail  = MSUPPLY_SUPPORT_EMAIL;
    var ccEmails = "";
    var bccEmails = BCC_MSUPPLY_SUPPORT_EMAIL;

    var sellerid = cancelledOrders.orderEntity.orderInfo.sellerInfo.sellerId;
    var orderNumber = cancelledOrders.orderEntity.orderInfo.orderNumber;
    var subjectEmail;

    //Get email id and mobile number of seller to send notification.
    supplierColl.find({"sellerEntity.profileInfo.accountInfo.sellerId": sellerid},{"sellerEntity.profileInfo.basicInfo": 1})
    .toArray(function(error, result)
    {
        if(error)
        {
            logger.error(TAG + " Error - Fetching Supplier Details from Supplier collection, for supplierId "+ sellerid +" Failed");
        }
        else
        {
            if(result.length > 0)
            {
                var toEmails = result[0].sellerEntity.profileInfo.basicInfo.email;

                if(toEmails !== null){
                    //toEmails = toEmails + "," +supportEmail;
                    //check weather updation is done at order level.
                    if(orderLevelUpdation){
                        subjectEmail = "mSupply order cancelled. Order No: "+orderNumber;
                        orderCancellationEmail.getEmailBody(cancelledOrders, skuids,
                        function(emailBody){
                            //Below function will send email to supplier, notifying succesfull password change.
                            notifications.sendPlainEmail(fromEmail, toEmails, ccEmails, bccEmails, subjectEmail, emailBody, function(error, result){
                                if(error){
                                    logger.error(TAG + " Error sending Order Cancellation emails for - " + toEmails);
                                }
                                else{
                                    logger.debug(TAG + " Order Cancellation email sent Successfully for - " + toEmails);
                                }
                            });
                        });
                    }
                    else{
                        subjectEmail = "Line item cancelled for mSupply Order No: "+orderNumber;
                        lineItemsOrderCancellationEmail.getEmailBody(cancelledOrders, skuids,
                        function(emailBody){
                            //Below function will send email to supplier, notifying succesfull password change.
                            notifications.sendPlainEmail(fromEmail, toEmails, ccEmails, bccEmails, subjectEmail, emailBody, function(error, result){
                                if(error){
                                    logger.error(TAG + " Error sending Order Cancellation emails for - " + toEmails);
                                }
                                else{
                                    logger.debug(TAG + " Order Cancellation email sent Successfully for - " + toEmails);
                                }
                            });
                        });
                    }
                }
                else{
                    logger.debug(TAG + "EmailId not available. Sending cancelled order email failed for seller : " + sellerid);
                }

                if(result[0].sellerEntity.profileInfo.basicInfo.mobile !== null){
                    //check weather updation is done at order level.
                    if(orderLevelUpdation){
                        var message = "Order No: "+orderNumber+
                        "%0Awas cancelled by you.";

                        notifications.sendSms(result[0].sellerEntity.profileInfo.basicInfo.mobile, message, function(error, smsResult){
                            if(!error){
                                logger.debug(TAG + " Order Cancellation SMS for mobile no "+ result[0].sellerEntity.profileInfo.basicInfo.mobile + " is sent Sucessfully.");
                            }
                            else{
                                logger.error(TAG + " Error sending Order Cancellation SMS for mobile no "+ result[0].sellerEntity.profileInfo.basicInfo.mobile);
                            }
                        });
                    }
                    else{
                        var orderItemsInfo = cancelledOrders.orderEntity.orderInfo.sellerInfo.orderItemInfo;
                        var productNames = [];
                        for(var i = 0; i < orderItemsInfo.length; i++){
                            if(underscore.indexOf(skuids, orderItemsInfo[i].SKUId) !== -1){
                                productNames.push(orderItemsInfo[i].productName);
                            }
                        }

                        var message = "You have cancelled"+
                        "%0A"+productNames.join()+","+
                        "%0Afor mSupply Order No: "+orderNumber+".";

                        notifications.sendSms(result[0].sellerEntity.profileInfo.basicInfo.mobile, message, function(error, smsResult){
                            if(!error){
                                logger.debug(TAG + " Order Cancellation SMS for mobile no "+ result[0].sellerEntity.profileInfo.basicInfo.mobile + " is sent Sucessfully.");
                            }
                            else{
                                logger.error(TAG + " Error sending Order Cancellation SMS for mobile no "+ result[0].sellerEntity.profileInfo.basicInfo.mobile);
                            }
                        });
                    }

                }
                else{
                    logger.error(TAG + " No Mobile number available. Error sending Order Cancellation SMS.");
                }

            }
            else if(result.length === 0){
                logger.error(TAG + " Record Not Found - Fetching Supplier Details from Supplier collection, for supplierId "+ sellerid);
            }
        }
    });
};


//Function that will notify supplier regarding succesfull shipment of order.
exports.notifySupplierOnOrderShippment = function(shippedOrders, skuids, callback){
    var logger = log.logger_sup;
    var db = dbConfig.mongoDbConn;
    var supplierColl = db.collection('SellerMaster');

    logger.debug(TAG + " Initiated notifying supplier regarding order item status changing to shipped.");

    //Multiple emails should be in the format '<abc@abc.com>, <xyz@abc.com>'
    var toEmails;
    var ccEmails = "";
    var bccEmails = "";
    var fromEmail  = MSUPPLY_SUPPORT_EMAIL;
    var subjectEmail = "Msupply - Order Item Status Changed.";
    var sellerid = shippedOrders.orderEntity.orderInfo.sellerInfo.sellerId;
    //Get email id and mobile number of seller to send notification.
    supplierColl.find({"sellerEntity.profileInfo.accountInfo.sellerId": sellerid},{"sellerEntity.profileInfo.basicInfo.email": 1})
    .toArray(function(error, result)
    {
        if(error)
        {
            logger.error(TAG + " Error - Fetching Supplier Details from Supplier collection, for supplierId "+ sellerid +" Failed");
        }
        else
        {
            if(result.length > 0)
            {
                toEmails = result[0].sellerEntity.profileInfo.basicInfo.email;

                if(toEmails !== null){
                    shippedOrderSupplierEmail.getEmailBody(shippedOrders, skuids,
                    function(emailBody){
                        //Below function will send email to supplier, notifying succesfull password change.
                        notifications.sendPlainEmail(fromEmail, toEmails, ccEmails, bccEmails, subjectEmail, bodyText, function(error, result){
                            if(!error){
                                logger.debug(TAG + " Successfully sent email to "+toEmails+", when status of order items "+emailObj.join()+" in order "+shippedOrders.orderEntity.orderInfo.orderNumber+" has status changed to shipped.");
                            }
                            else{
                                logger.error(TAG + " Error sending email to " +toEmails+", when status of order items "+emailObj.join()+" in order "+shippedOrders.orderEntity.orderInfo.orderNumber+" has status changed to shipped.");
                            }
                        });
                    });
                }
                else{
                    logger.debug(TAG + "EmailId not available. Sending Shipped order email failed for seller : " + sellerid);
                }

            }
            else if(result.length === 0){
                logger.error(TAG + " Record Not Found - Fetching Supplier Details from Supplier collection, for supplierId "+ sellerid);
            }
        }
    });

};

//Function to send email and sms for all the delayed delivery of the order to corresponding suppliers.
exports.sendDelayedOrderEmail = function (sellerInfo, delayedOrder, callback){

    //Variable for Logging the messages to the file.
    var logger = log.logger_jobs;

    var db = dbConfig.mongoDbConn;
    var ordersColl = db.collection("Orders");

    // Send SMS to seller.
    var sellerName = sellerInfo.supplierEntity.contactInfo.primaryFirstName;
    var sellerMobile = sellerInfo.supplierEntity.contactInfo.primaryMobile;
    var sellerEmail1 = sellerInfo.supplierEntity.contactInfo.primaryEmail;
    var sellerEmail2 = sellerInfo.supplierEntity.contactInfo.secondaryEmail;

    // To Send Email
    var toEmail = BCC_MSUPPLY_SUPPORT_EMAIL;
    var ccEmails = "";
    var bccEmails = "";
    var fromEmail  = MSUPPLY_SUPPORT_EMAIL;
    var subjectEmail = "Delivery date crossed for mSupply Order No: "+delayedOrder.orderNumber;

    ordersColl.aggregate([
        { $match: { "orderEntity.orderInfo.orderNumber": delayedOrder.orderNumber}},
        { $unwind: "$orderEntity.orderInfo.sellerInfo"},
        { $match: { "orderEntity.orderInfo.sellerInfo.sellerId": sellerInfo.supplierEntity.identifier.sellerId}},
        ], function(error, result){
            if(!error && result.length > 0){
                //Calling support function to get email body.
                delayedDeliverablesEmail.getEmailBody(result, function(emailBody){
                    var bodyText = emailBody;

                    //checking weather emailId is available.
                    if(sellerEmail1 !== null)
                    {
                        //Sending delayed order email to fulfilment team.
                        notifications.sendPlainEmail(fromEmail, toEmail, ccEmails, bccEmails, subjectEmail, bodyText, function(error, result){
                            if(error)
                            {
                                logger.error(TAG + "Error- Failed to send emails for delayed order delivery to fulfilment team "+ toEmail + " for OrderNumber: " + delayedOrder.orderNumber);
                                logger.error(TAG + "Error sending emails for delayed order delivery to fulfilment team " + error);
                            }
                            else
                            {
                                logger.debug(TAG + "Delayed order delivery email sent successfully to fulfilment team.");
                            }
                        });
                    }
                    else
                    {
                        logger.debug(TAG + "EmailId not available. Sending Delayed order delivery email failed for seller (Name): " + sellerName);
                    }
                });
            }
            else if(!error && result.length < 1){
                logger.debug(TAG + " No Delayed Orders found on: " + new Date());
            }
            else{
                logger.error(TAG + " Error running DeliveryDate Check on: " + new Date() + " err: " + JSON.stringify(error));
            }
    });


    //checking weather mobile number is empty.
    /*if(sellerMobile !== null)
    {
        var message = "Hi " + sellerName + "!%0A Order delivery date exceeded for the Order: %0A" +
        "%0A OrderNumber : " + delayedOrder.orderNumber +
        "%0A Product : " + delayedOrder.productDescription +
        "%0A SKUId : " + delayedOrder.SKUId +
        "%0A MinDeliveryDate : " + timezoneConversions.toIST(delayedOrder.minDeliveryDate) +
        "%0A ItemStatus : " + delayedOrder.itemStatus +
        "%0A Quantity : " + delayedOrder.quantity +
        "%0A RowTotal : " + delayedOrder.rowTotal +
        "%0A shippedBySeller : " + delayedOrder.shippedBySeller +
        "%0A ShipmentNumber : " + delayedOrder.shipmentNo +
        ".%0A -Team mSupply";

        notifications.sendSms(sellerMobile, message, function(error, result){
            if(!error)
            {
                logger.debug(TAG + "Delayed Order Notification SMS is sent to mobile no: "+ sellerMobile + " for OrderNumber: " + delayedOrder.orderNumber);
            }
            else
            {
                logger.error(TAG + "Failed sending Delayed Order Notification SMS to mobile no: "+ sellerMobile + " for OrderNumber: " + delayedOrder.orderNumber);
                logger.error(TAG + "Error sending Delayed Order Notification SMS to mobile no: " + sellerMobile + "err: " + error);
            }
        });
    }
    else
    {
        logger.debug(TAG + " Mobile number not available. Cant send SMS to seller (Name): " + sellerName);
    }

    //checking weather emailId is available.
    if(sellerEmail1 !== null)
    {

        var toEmails = "<" + sellerEmail1 + '>, ' + "<" + sellerEmail2 + '> ,';

        notifications.sendPlainEmail(fromEmail, toEmails, subjectEmail, bodyText, function(error, result){
            if(error)
            {
                logger.error(TAG + "Error- Failed to send emails for delayed order delivery to "+ toEmails + " for OrderNumber: " + delayedOrder.orderNumber);
                logger.error(TAG + "Error sending emails for delayed order delivery to "+ toEmails +", Error: " + error);
            }
            else
            {
                logger.debug(TAG + "Delayed order delivery email sent successfully to "+ toEmails + " for OrderNumber: " + delayedOrder.orderNumber);
            }
        });
    }
    else
    {
        logger.debug(TAG + "EmailId not available. Sending Delayed order delivery email failed for seller (Name): " + sellerName);
    } */
};

//Function to send email and sms for all the delayed delivery of the order to corresponding suppliers.
exports.sendTomorrowDeliverableOrderEmail = function (sellerInfo, delayedOrder, callback){

    //Variable for Logging the messages to the file.
    var logger = log.logger_jobs;

    var db = dbConfig.mongoDbConn;
    var ordersColl = db.collection("Orders");

    // Send SMS to seller.
    var sellerName = sellerInfo.sellerEntity.profileInfo.basicInfo.contactPerson;
    var sellerMobile = sellerInfo.sellerEntity.profileInfo.basicInfo.mobile;
    var sellerEmail1 = sellerInfo.sellerEntity.profileInfo.basicInfo.email;

    // To Send Email
    var fromEmail  = MSUPPLY_SUPPORT_EMAIL;
    var ccEmails = "";
    var bccEmails = "";
    var subjectEmail = "Delivery date tomorrow for mSupply Order No: "+delayedOrder.orderNumber;

    //checking weather mobile number is empty.
    if(sellerMobile !== null){
        var message = "mSupply order due to be delivered tomorrow." +
        "%0AOrder No: " + delayedOrder.orderNumber +
        "%0AKindly take necessary action to get it delivered.";

        notifications.sendSms(sellerMobile, message, function(error, result){
            if(!error)
            {
                logger.debug(TAG + "Tomorrow deliverable Order Notification SMS is sent to mobile no: "+ sellerMobile + " for OrderNumber: " + delayedOrder.orderNumber);
            }
            else
            {
                logger.error(TAG + "Failed sending Tomorrow deliverable Order Notification SMS to mobile no: "+ sellerMobile + " for OrderNumber: " + delayedOrder.orderNumber);
                logger.error(TAG + "Error sending Tomorrow deliverable Order Notification SMS to mobile no: " + sellerMobile + "err: " + error);
            }
        });
    }
    else{
        logger.debug(TAG + " Mobile number not available. Cant send SMS to seller (Name): " + sellerName);
    }

    ordersColl.aggregate([
        { $match: { "orderEntity.orderInfo.orderNumber": delayedOrder.orderNumber}},
        { $unwind: "$orderEntity.orderInfo.sellerInfo"},
        { $match: { "orderEntity.orderInfo.sellerInfo.sellerId": sellerInfo.sellerEntity.profileInfo.accountInfo.sellerId}},
        ], function(error, result){
            if(!error && result.length > 0){
                //Calling support function to get email body.
                tomorrowDeliverablesEmail.getEmailBody(result, function(emailBody){
                    var bodyText = emailBody;

                    //checking weather emailId is available.
                    if(sellerEmail1 !== null)
                    {

                        var toEmails = "<" + sellerEmail1 + ">";

                        notifications.sendPlainEmail(fromEmail, toEmails, ccEmails, bccEmails, subjectEmail, bodyText, function(error, result){
                            if(error)
                            {
                                logger.error(TAG + "Error- Failed to send emails for tomorrow deliverable order delivery to "+ toEmails + " for OrderNumber: " + delayedOrder.orderNumber);
                                logger.error(TAG + "Error sending emails for delayed order delivery to "+ toEmails +", Error: " + error);
                            }
                            else
                            {
                                logger.debug(TAG + "Tomorrow deliverable order delivery email sent successfully to "+ toEmails + " for OrderNumber: " + delayedOrder.orderNumber);
                            }
                        });
                    }
                    else
                    {
                        logger.debug(TAG + "EmailId not available. Sending tomorrow deliverable order delivery email failed for seller (Name): " + sellerName);
                    }
                });
            }
            else if(!error && result.length < 1){
                logger.debug(TAG + " No tomorrow deliverable Orders found on: " + new Date());
            }
            else{
                logger.error(TAG + " Error running DeliveryDate Check on: " + new Date() + " err: " + JSON.stringify(error));
            }
    });
};

//Function to send email and sms for all today's pending delivery of the order to corresponding suppliers.
exports.sendTodayDeliveryOrderEmail = function (sellerInfo, delayedOrder, callback){
    //Variable for Logging the messages to the file.
    var logger = log.logger_jobs;

    var db = dbConfig.mongoDbConn;
    var ordersColl = db.collection("Orders");

    // Send SMS to seller.
    var sellerName = sellerInfo.sellerEntity.profileInfo.basicInfo.contactPerson;
    var sellerMobile = sellerInfo.sellerEntity.profileInfo.basicInfo.mobile;
    var sellerEmail1 = sellerInfo.sellerEntity.profileInfo.basicInfo.email;
    var ccEmails = "";
    var bccEmails = "";

    // To Send Email
    var fromEmail  = MSUPPLY_SUPPORT_EMAIL;
    var subjectEmail = "Delivery date today for mSupply Order No: "+delayedOrder.orderNumber;

    //checking weather mobile number is empty.
    if(sellerMobile !== null)
    {
        var message = "mSupply order due to be delivered today." +
        "%0AOrder No: " + delayedOrder.orderNumber +
        "%0AKindly take necessary action to get it delivered.";

        notifications.sendSms(sellerMobile, message, function(error, result){
            if(!error)
            {
                logger.debug(TAG + " Pending Delivery Order Notification SMS is sent to mobile no: "+ sellerMobile + " for OrderNumber: " + delayedOrder.orderNumber);
            }
            else
            {
                logger.error(TAG + " Error sending Pending Delivery Order Notification SMS to mobile no: "+ sellerMobile + " for OrderNumber: " + delayedOrder.orderNumber);
                logger.error(TAG + "Error sending Pending Delivery Order Notification SMS to mobile no: " + sellerMobile + "err: " + error);
            }
        });
    }
    else
    {
        logger.debug(TAG + " Mobile number not available. Cant send SMS.");
    }

    ordersColl.aggregate([
        { $match: { "orderEntity.orderInfo.orderNumber": delayedOrder.orderNumber}},
        { $unwind: "$orderEntity.orderInfo.sellerInfo"},
        { $match: { "orderEntity.orderInfo.sellerInfo.sellerId": sellerInfo.sellerEntity.profileInfo.accountInfo.sellerId}},
        ], function(error, result){
            if(!error && result.length > 0){
                //Calling support function to get email body.
                todayDeliverablesEmail.getEmailBody(result, function(emailBody){
                    var bodyText = emailBody;

                    //checking weather emailId is available.
                    if(sellerEmail1 !== null)
                    {
                        var toEmails = "<" + sellerEmail1 + ">";

                        notifications.sendPlainEmail(fromEmail, toEmails, ccEmails, bccEmails, subjectEmail, bodyText, function(error, result){
                            if(error)
                            {
                                logger.error(TAG + "Error- Failed to send emails for pending delivery order to "+ toEmails + " for OrderNumber: " + delayedOrder.orderNumber);
                                logger.error(TAG + "Error sending emails for peding delivery order to "+ toEmails + ", Error: " + error);
                            }
                            else
                            {
                                logger.debug(TAG + "pending delivery order email sent successfully to "+ toEmails + " for OrderNumber: " + delayedOrder.orderNumber);
                            }
                        });
                    }
                    else
                    {
                        logger.debug(TAG + "EmailId not available. Sending pending delivery order email failed for sellerName: " + sellerName);
                    }
                });
            }
            else if(!error && result.length < 1){
                logger.debug(TAG + " No pending delivery Orders found on: " + new Date());
            }
            else{
                logger.error(TAG + " Error running DeliveryDate Check on: " + new Date() + " err: " + JSON.stringify(error));
            }
    });
};

//Function that will notify supplier regarding succesfull ready to ship of order.
exports.notifySupplierOnReadyToShip = function(readyToshipOrder, skuids, callback){
    var logger = log.logger_sup;
    var db = dbConfig.mongoDbConn;
    var supplierColl = db.collection('SellerMaster');
    var ordersColl = db.collection("Orders");
    var commaITConfig = {addPrecision:true, thousandSeperator : ',', decimalSeperator : '.'};
    var emailObj = {
    "notificationIdentifier": "109",
    "toEmails": [],
    "toMobileNumber": [],
    "smsBodyParams": {"orderId": readyToshipOrder.orderEntity.orderInfo.orderNumber},
    "emailBodyParams": {
        "orderId": readyToshipOrder.orderEntity.orderInfo.orderNumber,
        "orderDate": timezoneConversions.ConvertToIST(readyToshipOrder.orderEntity.orderInfo.orderDate),
        "sellerId": readyToshipOrder.orderEntity.orderInfo.sellerInfo.sellerId,
        "sellerFinancials":[],
        "paymentMethod":"Immediate Payment",
        "skuids":skuids,
        "orderItemInfo": [],
        "orderDeliveryAddress": {
            "customerFullName": "",
            "addressLine1": "",
            "addressLine2": "",
            "city": "",
            "state": "",
            "country": "",
            "pinCode": "",
            "mobile": ""
            },
        "orderBillingAddress": {
            "customerFullName": "",
            "addressLine1": "",
            "addressLine2": "",
            "city": "",
            "state": "",
            "country": "",
            "pinCode": "",
            "mobile": ""
            }
        },
    "emailAttachment": false,
    "attachmentParams": [{"orderId": readyToshipOrder.orderEntity.orderInfo.orderNumber,
    "orderItemInfo" : [],
    "orderDeliveryAddress":null,
    "skuids":skuids,
    "emailAttachmentFileName": "manifest"}]
    };

    //Send All orderItemInfo
    emailObj.emailBodyParams.orderItemInfo = readyToshipOrder.orderEntity.orderInfo.sellerInfo.orderItemInfo;
    //setting seller Finance details
    emailObj.emailBodyParams.sellerFinancials = readyToshipOrder.orderEntity.financials.seller;
    // Setting shipping address
    for (var i in readyToshipOrder.orderEntity.orderInfo.orderDeliveryAddress) {
      if (readyToshipOrder.orderEntity.orderInfo.orderDeliveryAddress[i].addressType == 'Shipping') {
            emailObj.emailBodyParams.orderDeliveryAddress.customerFullName = readyToshipOrder.orderEntity.orderInfo.orderDeliveryAddress[i].ContactfirstName + " " + readyToshipOrder.orderEntity.orderInfo.orderDeliveryAddress[i].ContactlastName;
            emailObj.emailBodyParams.orderDeliveryAddress.addressLine1 = readyToshipOrder.orderEntity.orderInfo.orderDeliveryAddress[i].addressLine1;
            emailObj.emailBodyParams.orderDeliveryAddress.addressLine2 = readyToshipOrder.orderEntity.orderInfo.orderDeliveryAddress[i].addressLine2;
            emailObj.emailBodyParams.orderDeliveryAddress.city = readyToshipOrder.orderEntity.orderInfo.orderDeliveryAddress[i].city;
            emailObj.emailBodyParams.orderDeliveryAddress.state = readyToshipOrder.orderEntity.orderInfo.orderDeliveryAddress[i].state;
            emailObj.emailBodyParams.orderDeliveryAddress.country = readyToshipOrder.orderEntity.orderInfo.orderDeliveryAddress[i].country;
            emailObj.emailBodyParams.orderDeliveryAddress.pinCode = readyToshipOrder.orderEntity.orderInfo.orderDeliveryAddress[i].pinCode;
            emailObj.emailBodyParams.orderDeliveryAddress.mobile = readyToshipOrder.orderEntity.orderInfo.orderDeliveryAddress[i].Contactmobile;
        }
        else if (readyToshipOrder.orderEntity.orderInfo.orderDeliveryAddress[i].addressType == 'Billing') 
        {
            emailObj.emailBodyParams.orderBillingAddress.customerFullName = readyToshipOrder.orderEntity.orderInfo.orderDeliveryAddress[i].ContactfirstName + " " + readyToshipOrder.orderEntity.orderInfo.orderDeliveryAddress[i].ContactlastName;
            emailObj.emailBodyParams.orderBillingAddress.addressLine1 = readyToshipOrder.orderEntity.orderInfo.orderDeliveryAddress[i].addressLine1;
            emailObj.emailBodyParams.orderBillingAddress.addressLine2 = readyToshipOrder.orderEntity.orderInfo.orderDeliveryAddress[i].addressLine2;
            emailObj.emailBodyParams.orderBillingAddress.city = readyToshipOrder.orderEntity.orderInfo.orderDeliveryAddress[i].city;
            emailObj.emailBodyParams.orderBillingAddress.state = readyToshipOrder.orderEntity.orderInfo.orderDeliveryAddress[i].state;
            emailObj.emailBodyParams.orderBillingAddress.country = readyToshipOrder.orderEntity.orderInfo.orderDeliveryAddress[i].country;
            emailObj.emailBodyParams.orderBillingAddress.pinCode = readyToshipOrder.orderEntity.orderInfo.orderDeliveryAddress[i].pinCode;
            emailObj.emailBodyParams.orderBillingAddress.mobile = readyToshipOrder.orderEntity.orderInfo.orderDeliveryAddress[i].Contactmobile;
        }   
    }

    // Populating orderItemInfo for Mainfest Attachment.
    var orderItem = readyToshipOrder.orderEntity.orderInfo.sellerInfo.orderItemInfo;
    for(var i = 0; i < orderItem.length; i++)
    {
        if(underscore.indexOf(skuids, orderItem[i].SKUId) === -1){
            continue;
        };

        if(orderItem[i].shippedBySeller === true && orderItem[i].itemStatus === "Ready To Ship"){
            emailObj.attachmentParams[0].orderItemInfo.push(orderItem[i]);
            emailObj.attachmentParams[0].orderDeliveryAddress = emailObj.emailBodyParams.orderDeliveryAddress;
            emailObj.emailAttachment = true;
        };
    }

    //Get email id and mobile number of seller to send notification.
    var supplierColl = db.collection('SellerMaster');
    var sellerid = readyToshipOrder.orderEntity.orderInfo.sellerInfo.sellerId;
    supplierColl.find({"sellerEntity.profileInfo.accountInfo.sellerId": sellerid},{"sellerEntity.profileInfo.basicInfo": 1})
    .toArray(function(error, result)
    {
        if(error)
        {
            logger.error(TAG + " Error - Fetching Supplier Details from Supplier collection, for supplierId "+ sellerid +" Failed");
        }
        else
        {
            if(result.length > 0)
            {
                toEmails = result[0].sellerEntity.profileInfo.basicInfo.email;
                primaryMobile =  result[0].sellerEntity.profileInfo.basicInfo.mobile;
                emailObj.toEmails.push(toEmails);
                emailObj.toMobileNumber.push(primaryMobile);
                // send email by calling Notification Service
                logger.debug(TAG + " emailObj for notifySupplierOnReadyToShip email successfully formed:" + JSON.stringify(emailObj));
                sendEmailNotification(emailObj, function(error, bodyEmail){
                    if(error)
                    {
                        logger.error(TAG + " Error sending notifySupplierOnReadyToShip for Ordernumber:" + readyToshipOrder.orderEntity.orderInfo.orderNumber +", error: " + error);
                    }
                    else
                    {
                        logger.debug(TAG + " Successfully sent notifySupplierOnReadyToShip email for Ordernumber:" + readyToshipOrder.orderEntity.orderInfo.orderNumber);
                    }
                });
            }
        }
    });
};

//Function that will send email to supplier notifying new order.
exports.notifyFulfillmentTeamOnReadyToShip = function(readyToshipOrder, skuids, callback){
    var logger = log.logger_sup;
    var db = dbConfig.mongoDbConn;
    var commaITConfig = {addPrecision:true, thousandSeperator : ',', decimalSeperator : '.'};
    var emailObj = {
    "notificationIdentifier": "110",
    "toEmails": [],
    "toMobileNumber": [],
    "smsBodyParams": {"orderId": null},
    "emailBodyParams": {
        "orderId": readyToshipOrder.orderEntity.orderInfo.orderNumber,
        "orderDate": timezoneConversions.ConvertToIST(readyToshipOrder.orderEntity.orderInfo.orderDate),
        "supplierName": "",
        "supplierPOC": "",
        "supplierPincode": "",
        "supplierPickupContact": "",
        "grossTotal": commaIt(readyToshipOrder.orderEntity.orderInfo.orderTotals.grossTotalWithGatewayCharges,commaITConfig),
        "grossTotal_A": null,
        "customerRefunds": null,
        "skuids":skuids,
        "orderItemInfo": [],
        "orderDeliveryAddress": {
            "customerFullName": "",
            "addressLine1": "",
            "addressLine2": "",
            "city": "",
            "state": "",
            "country": "",
            "pinCode": "",
            "mobile": ""
        },
        "supplierPickupAddress": {
            "address1": "",
            "address2": "",
            "city": "",
            "state": "",
            "country": "",
            "pincode": ""
            }
        },
    "emailAttachment": false,
    "attachmentParams": [{"orderId": readyToshipOrder.orderEntity.orderInfo.orderNumber,
    "orderItemInfo" : [],
    "orderDeliveryAddress":null,
    "skuids":skuids,
    "emailAttachmentFileName": "3PLManifest"}],

    };

    if(!(readyToshipOrder.orderEntity.orderInfo.orderTotals_A === undefined && readyToshipOrder.orderEntity.orderInfo.customerRefunds === undefined))
    {
        emailObj.emailBodyParams.grossTotal_A = commaIt(readyToshipOrder.orderEntity.orderInfo.orderTotals_A.grossTotalWithGatewayCharges,commaITConfig);
        emailObj.emailBodyParams.customerRefunds = commaIt(readyToshipOrder.orderEntity.orderInfo.customerRefunds.totalRefund,commaITConfig);
    }
    // Populating orderItemInfo
    var ShippedBy3PLFlag = false;
    readyToshipOrder.orderEntity.orderInfo.sellerInfo.orderItemInfo.forEach(function(element){
        var orderItemInfoObj = {
        "SKUId": element.SKUId,
        "itemStatus": element.itemStatus,
        "SKUImage": element.SKUImage,
        "productName": element.productName,
        "price": commaIt(element.price, commaITConfig),
        "quantity": element.quantity,
        "subTotal": commaIt(element.subTotal ,commaITConfig),
        "threePLName": element.threePLName,
        "shippedBySeller": element.shippedBySeller,
        "minDeliveryDate": element.minDeliveryDate
        };
        emailObj.emailBodyParams.orderItemInfo.push(orderItemInfoObj);
        //Only if there are items to be shipped by 3PL, send the email to fullfilment team.
        if(element.itemStatus === "Ready To Ship" && element.shippedBySeller === false)
        {
            ShippedBy3PLFlag = true;
        }
    });

    if(ShippedBy3PLFlag === true)
    {
        // Setting shipping address
        for (var i in readyToshipOrder.orderEntity.orderInfo.orderDeliveryAddress) {
          if (readyToshipOrder.orderEntity.orderInfo.orderDeliveryAddress[i].addressType == 'Shipping') {
                emailObj.emailBodyParams.orderDeliveryAddress.customerFullName = readyToshipOrder.orderEntity.orderInfo.orderDeliveryAddress[i].ContactfirstName + " " + readyToshipOrder.orderEntity.orderInfo.orderDeliveryAddress[i].ContactlastName;
                emailObj.emailBodyParams.orderDeliveryAddress.addressLine1 = readyToshipOrder.orderEntity.orderInfo.orderDeliveryAddress[i].addressLine1;
                emailObj.emailBodyParams.orderDeliveryAddress.addressLine2 = readyToshipOrder.orderEntity.orderInfo.orderDeliveryAddress[i].addressLine2;
                emailObj.emailBodyParams.orderDeliveryAddress.city = readyToshipOrder.orderEntity.orderInfo.orderDeliveryAddress[i].city;
                emailObj.emailBodyParams.orderDeliveryAddress.state = readyToshipOrder.orderEntity.orderInfo.orderDeliveryAddress[i].state;
                emailObj.emailBodyParams.orderDeliveryAddress.country = readyToshipOrder.orderEntity.orderInfo.orderDeliveryAddress[i].country;
                emailObj.emailBodyParams.orderDeliveryAddress.pinCode = readyToshipOrder.orderEntity.orderInfo.orderDeliveryAddress[i].pinCode;
                emailObj.emailBodyParams.orderDeliveryAddress.mobile = readyToshipOrder.orderEntity.orderInfo.orderDeliveryAddress[i].Contactmobile;
                break;
            }
        }

        var supplierColl = db.collection('SellerMaster');
        var sellerid = readyToshipOrder.orderEntity.orderInfo.sellerInfo.sellerId;
        supplierColl.findOne({"sellerEntity.profileInfo.accountInfo.sellerId": sellerid},function(error, result){
            if(error)
            {
                logger.error(TAG + " Error - Fetching Supplier Details from Supplier collection, for supplierId "+ sellerid +" Failed");
            }
            else
            {
                if(result)
                {
                    // Setting Supplier Pickup address
                    
                    emailObj.emailBodyParams.supplierPickupAddress.address1 = result.sellerEntity.profileInfo.basicInfo.companyInfo.wareHouseAddress[0].address1;
                    emailObj.emailBodyParams.supplierPickupAddress.address2 = result.sellerEntity.profileInfo.basicInfo.companyInfo.wareHouseAddress[0].address2;
                    emailObj.emailBodyParams.supplierPickupAddress.city = result.sellerEntity.profileInfo.basicInfo.companyInfo.wareHouseAddress[0].city;
                    emailObj.emailBodyParams.supplierPickupAddress.state = result.sellerEntity.profileInfo.basicInfo.companyInfo.wareHouseAddress[0].state;
                    emailObj.emailBodyParams.supplierPickupAddress.country = result.sellerEntity.profileInfo.basicInfo.companyInfo.wareHouseAddress[0].country;
                    emailObj.emailBodyParams.supplierPickupAddress.pincode = result.sellerEntity.profileInfo.basicInfo.companyInfo.wareHouseAddress[0].pincode;
                            
                    emailObj.emailBodyParams.supplierName = result.sellerEntity.sellerEntity.profileInfo.basicInfo.companyInfo.companyName;
                    emailObj.emailBodyParams.supplierPOC = result.sellerEntity.profileInfo.basicInfo.contactPerson;
                    emailObj.emailBodyParams.supplierPincode = emailObj.emailBodyParams.supplierPickupAddress.pincode;
                    emailObj.emailBodyParams.supplierPickupContact = result.sellerEntity.profileInfo.basicInfo.mobile;

                    var orderItem = readyToshipOrder.orderEntity.orderInfo.sellerInfo.orderItemInfo;
                    // Get the Distinct 3PL list from the LineItems.
                    var items3PLName = [];
                    for(var j = 0; j < orderItem.length; j++){
                        if(orderItem[j].shippedBySeller === false && orderItem[i].itemStatus === "Ready To Ship")
                        {
                            if(underscore.indexOf(items3PLName, orderItem[j].threePLName) === -1)
                            {
                                items3PLName.push(orderItem[j].threePLName);
                            }
                        }
                    };
                    //Initialize to a blank array.
                    emailObj.attachmentParams = [];
                    async.forEachSeries(items3PLName, function(each3PLName, asyncCallback)
                        {
                            // Populating attachmentParams for Mainfest Attachment.
                            var attachmentParams = {"orderId": readyToshipOrder.orderEntity.orderInfo.orderNumber,
                            "orderItemInfo" : [],
                            "orderDeliveryAddress":null,
                            "skuids":skuids,
                            "emailAttachmentFileName": "3PLManifest"};

                            for(var i = 0; i < orderItem.length; i++)
                            {
                                if(underscore.indexOf(skuids, orderItem[i].SKUId) === -1){
                                    continue;
                                };

                                if(orderItem[i].shippedBySeller === false && orderItem[i].itemStatus === "Ready To Ship" && orderItem[i].threePLName === each3PLName){
                                    attachmentParams.orderItemInfo.push(orderItem[i]);
                                    attachmentParams.orderDeliveryAddress = emailObj.emailBodyParams.orderDeliveryAddress;
                                    attachmentParams.emailAttachmentFileName = each3PLName+"_Manifest";
                                    emailObj.emailAttachment = true;
                                };
                            }
                            emailObj.attachmentParams.push(attachmentParams);
                            return asyncCallback();
                        },
                        //Final Function to be called upon completion of all functions.
                        function(error)
                        {
                            if(!error)
                            {
                                logger.debug(TAG + " emailObj for notifyFulfillmentTeamOnReadyToShip email successfully formed:" + JSON.stringify(emailObj));
                                sendEmailNotification(emailObj, function(err, bodyEmail){
                                    if(err)
                                    {
                                        logger.error(TAG + " Error sending notifyFulfillmentTeamOnReadyToShip for Ordernumber:" + readyToshipOrder.orderEntity.orderInfo.orderNumber +", error: " + err);
                                    }
                                    else
                                    {
                                        logger.debug(TAG + " Successfully sent notifyFulfillmentTeamOnReadyToShip email for Ordernumber:" + readyToshipOrder.orderEntity.orderInfo.orderNumber);
                                    }
                                });
                            }
                            else
                            {
                                logger.error(TAG + "Error sending emails with Manifest sent for 3PL to fullfilment team: error: " + error);
                            }
                        }
                    );
                }
                else
                {
                    logger.error(TAG + " Error sending notifyFulfillmentTeamOnReadyToShip for Ordernumber:" + readyToshipOrder.orderEntity.orderInfo.orderNumber +", error: No Valid Supplier found for seller ID: " + sellerid);
                }
            }
        });
    }
    else
    {
        logger.debug(TAG + "No emails sent to FulfillmentTeamOnReadyToShip for Ordernumber:" + readyToshipOrder.orderEntity.orderInfo.orderNumber+ " as there are no items shipped by 3PL");
    }
}
//Send Forgot password Link to the registered seller....
exports.sendForgotPassword = function(data, userId, token, callback){
    var logger = log.logger_seller;      
    var emailObj = {
        "notificationIdentifier": "111",
        "toEmails": [data.email],
        "toMobileNumber": null,
        "smsBodyParams": null,
        "emailBodyParams": {
           "name" : data.contactPerson,
           "userId" : userId,
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
            logger.error(TAG + " Error sending supplier forgot password token to :" + data.email);
        }
        else
        {
            logger.debug(TAG + " Successfully sent supplier forgot password token to :" + data.email);
        }
    });

    return callback(false);
}
// Function Calls POST API service for Sending email Notification.
function sendEmailNotification(emailBodyParameters, callback){
    //Variable for Logging the messages to the file.
    var logger = log.logger_sup;
    logger.debug(TAG + "Notification Request received for (emailBodyParameters): " + JSON.stringify(emailBodyParameters));
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
    logger.debug(TAG + "host: " + WHICH_HOST.host + " Port: "+ WHICH_HOST.port);
    logger.debug(TAG + "Notification Request received for: " + JSON.stringify(postData));
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
