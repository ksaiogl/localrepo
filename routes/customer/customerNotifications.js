//This file contains functions that will send notifications to customer.
var TAG = "CustomerNotifications - ";
var log = require('../../Environment/log4js.js');
var timezoneConversions = require('../helpers/timezoneConversions.js');
//var Client = require('node-rest-client').Client;
var commaIt = require('comma-it');
//var envURL = require('../../Environment/notificationServiceHostDetails.js');
var hostDetails = require('../../Environment/notificationServiceHostDetails.js');
var http = require('http');
var dbConfig = require('../../Environment/mongoDatabase.js');

exports.customerOrderConfirmationNotification = function(orderJSON){
  var logger = log.logger_OMS;

  var commaITConfig = {addPrecision:true, thousandSeperator : ',', decimalSeperator : '.'};

  //var notificationURL = "http://" + envURL.WHICH_HOST + '/notification/api/v1.0/sendNotification';

  var emailObj = {
	"notificationIdentifier": "301",
	"toEmails": [orderJSON.orderEntity.orderInfo.customerInfo.customerEmail],
	"toMobileNumber": [orderJSON.orderEntity.orderInfo.customerInfo.customerMobile],
	"smsBodyParams": {
		"orderId": orderJSON.orderEntity.orderInfo.orderNumber
	},
	"emailBodyParams": {
		"firstName": orderJSON.orderEntity.orderInfo.customerInfo.customerFirstname,
		"orderId": orderJSON.orderEntity.orderInfo.orderNumber,
		"orderDate": timezoneConversions.ConvertToIST(orderJSON.orderEntity.orderInfo.orderDate),
		"orderItemInfo": [],
		"subTotal": commaIt((orderJSON.orderEntity.orderInfo.orderTotals.ActualSubtotal + orderJSON.orderEntity.orderInfo.orderTotals.ActualVAT).toFixed(2), commaITConfig),
    "discount": (orderJSON.orderEntity.orderInfo.orderTotals.discountAmount).toFixed(2),
    "discountCouponCode": orderJSON.orderEntity.orderInfo.orderTotals.discountCouponCode,
    "shippingAndHandling": commaIt((orderJSON.orderEntity.orderInfo.orderTotals.shippingAndHandlingAnd3PLCharges).toFixed(2), commaITConfig),
    "exciseDuty": commaIt((orderJSON.orderEntity.orderInfo.orderTotals.excise).toFixed(2), commaITConfig),
		"serviceCharges": commaIt((orderJSON.orderEntity.orderInfo.orderTotals.serviceTaxOnConvenienceFee + orderJSON.orderEntity.orderInfo.orderTotals.convenienceFee + orderJSON.orderEntity.orderInfo.orderTotals.gatewayChargesOnTotal).toFixed(2) , commaITConfig),
		"grandTotal": commaIt((orderJSON.orderEntity.orderInfo.orderTotals.grossTotalWithGatewayCharges).toFixed(2), commaITConfig),
		"paymentMethod": orderJSON.orderEntity.paymentInfo.paymentMode,
		"orderDeliveryAddress": {		}
	},
	"emailAttachment": false,
	"attachmentParams": null,
	"emailAttachmentFileName": null
}

// Populating orderItemInfo
orderJSON.orderEntity.orderInfo.sellerInfo.forEach(function(element){
  element.orderItemInfo.forEach(function(element){
    var orderItemInfoObj = {
      "SKUId": element.SKUId,
      "SKUImage": element.SKUImage,
      "productName": element.productName,
      "price": commaIt(((element.VAT_Value/element.quantity)+element.price).toFixed(2), commaITConfig),
      "quantity": element.quantity,
      "subTotal": commaIt((element.subTotal + element.VAT_Value).toFixed(2),commaITConfig)
    };
    emailObj.emailBodyParams.orderItemInfo.push(orderItemInfoObj);
  });
});


// Setting shipping address
for (var i in orderJSON.orderEntity.orderInfo.orderDeliveryAddress) {
  if (orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].addressType == 'Shipping') {
        emailObj.emailBodyParams.orderDeliveryAddress.customerFullName = orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].ContactfirstName + " " + orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].ContactlastName;
        emailObj.emailBodyParams.orderDeliveryAddress.addressLine1 = orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].addressLine1;
        emailObj.emailBodyParams.orderDeliveryAddress.addressLine2 = orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].addressLine2;
        emailObj.emailBodyParams.orderDeliveryAddress.city = orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].city;
        emailObj.emailBodyParams.orderDeliveryAddress.state = orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].state;
        emailObj.emailBodyParams.orderDeliveryAddress.country = orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].country;
        emailObj.emailBodyParams.orderDeliveryAddress.pinCode = orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].pinCode;
        emailObj.emailBodyParams.orderDeliveryAddress.mobile = orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].Contactmobile;
        break;
    }
    // else if (orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].addressType == 'Billing') {
    //   emailObj.emailBodyParams.firstName = orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].ContactfirstName
    // }
  }
  /*
  var client = new Client();
  var args = {
  	data: emailObj,
  	headers: { "Content-Type": "application/json" }
  };

  var notif = client.post(notificationURL, args, function (data, response) {
    logger.info(TAG + " Notification successfully sent to customer for orderID : " + orderJSON.orderEntity.orderInfo.orderNumber + " - Notif service response : \n" + JSON.stringify(data));
  });

  notif.on('error', function (err) {
    logger.error(TAG + " Error sending notification to Customer for orderID - " + orderJSON.orderEntity.orderInfo.orderNumber + " - Error : \n" + err.stack);
  });
 */
 sendEmailNotification(emailObj, function(error, bodyEmail){
        if(error){
            logger.error(TAG + " Error sending notification to Customer for orderID - " + orderJSON.orderEntity.orderInfo.orderNumber + " - Error : \n" + error);
        }
        else{
            logger.info(TAG + " Notification successfully sent to customer for orderID : " + orderJSON.orderEntity.orderInfo.orderNumber);
        }
  });
}


exports.customerOrderOnHoldNotification = function(orderJSON){
  var logger = log.logger_OMS;

  var commaITConfig = {addPrecision:true, thousandSeperator : ',', decimalSeperator : '.'};

  //var notificationURL = "http://" + envURL.WHICH_HOST + '/notification/api/v1.0/sendNotification';

  var emailObj = {
	"notificationIdentifier": "302",
  "toEmails": [orderJSON.orderEntity.orderInfo.customerInfo.customerEmail],
	"toMobileNumber": [orderJSON.orderEntity.orderInfo.customerInfo.customerMobile],
	"smsBodyParams": {
		"orderId": orderJSON.orderEntity.orderInfo.orderNumber
	},
	"emailBodyParams": {
		"firstName": orderJSON.orderEntity.orderInfo.customerInfo.customerFirstname,
		"orderId": orderJSON.orderEntity.orderInfo.orderNumber,
		"orderDate": timezoneConversions.ConvertToIST(orderJSON.orderEntity.orderInfo.orderDate),
		"orderItemInfo": [],
    "subTotal": commaIt((orderJSON.orderEntity.orderInfo.orderTotals.ActualSubtotal + orderJSON.orderEntity.orderInfo.orderTotals.ActualVAT).toFixed(2), commaITConfig),
    "discount": (orderJSON.orderEntity.orderInfo.orderTotals.discountAmount).toFixed(2),
    "discountCouponCode": orderJSON.orderEntity.orderInfo.orderTotals.discountCouponCode,
    "shippingAndHandling": commaIt((orderJSON.orderEntity.orderInfo.orderTotals.shippingAndHandlingAnd3PLCharges).toFixed(2), commaITConfig),
    "exciseDuty": commaIt((orderJSON.orderEntity.orderInfo.orderTotals.excise).toFixed(2), commaITConfig),
		"serviceCharges": commaIt((orderJSON.orderEntity.orderInfo.orderTotals.serviceTaxOnConvenienceFee + orderJSON.orderEntity.orderInfo.orderTotals.convenienceFee + orderJSON.orderEntity.orderInfo.orderTotals.gatewayChargesOnTotal).toFixed(2) , commaITConfig),
		"grandTotal": commaIt((orderJSON.orderEntity.orderInfo.orderTotals.grossTotalWithGatewayCharges).toFixed(2), commaITConfig),
		"paymentMethod": orderJSON.orderEntity.paymentInfo.paymentMode,
		"orderDeliveryAddress": {		}
	},
	"emailAttachment": false,
	"attachmentParams": null,
	"emailAttachmentFileName": null
}

// Populating orderItemInfo
orderJSON.orderEntity.orderInfo.sellerInfo.forEach(function(element){
  element.orderItemInfo.forEach(function(element){
    var orderItemInfoObj = {
      "SKUId": element.SKUId,
      "SKUImage": element.SKUImage,
      "productName": element.productName,
      "price": commaIt(((element.VAT_Value/element.quantity)+element.price).toFixed(2), commaITConfig),
      "quantity": element.quantity,
      "subTotal": commaIt((element.subTotal + element.VAT_Value).toFixed(2),commaITConfig)
    };
    emailObj.emailBodyParams.orderItemInfo.push(orderItemInfoObj);
  });
});


// Setting shipping address
for (var i in orderJSON.orderEntity.orderInfo.orderDeliveryAddress) {
  if (orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].addressType == 'Shipping') {
        emailObj.emailBodyParams.orderDeliveryAddress.customerFullName = orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].ContactfirstName + " " + orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].ContactlastName;
        emailObj.emailBodyParams.orderDeliveryAddress.addressLine1 = orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].addressLine1;
        emailObj.emailBodyParams.orderDeliveryAddress.addressLine2 = orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].addressLine2;
        emailObj.emailBodyParams.orderDeliveryAddress.city = orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].city;
        emailObj.emailBodyParams.orderDeliveryAddress.state = orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].state;
        emailObj.emailBodyParams.orderDeliveryAddress.country = orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].country;
        emailObj.emailBodyParams.orderDeliveryAddress.pinCode = orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].pinCode;
        emailObj.emailBodyParams.orderDeliveryAddress.mobile = orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].Contactmobile;
        break;
    }
    // else if (orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].addressType == 'Billing') {
    //   emailObj.emailBodyParams.firstName = orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].ContactfirstName
    // }
  }
  /*
  var client = new Client();
  var args = {
  	data: emailObj,
  	headers: { "Content-Type": "application/json" }
  };
  var notif = client.post(notificationURL, args, function (data, response) {
    logger.info(TAG + " Notification successfully sent to customer for orderID : " + orderJSON.orderEntity.orderInfo.orderNumber + " - Notif service response : \n" + JSON.stringify(data));
  });

  notif.on('error', function (err) {
    logger.error(TAG + " Error sending notification to Customer for orderID - " + orderJSON.orderEntity.orderInfo.orderNumber + " - Error : \n" + err.stack);
  });
*/
  sendEmailNotification(emailObj, function(error, bodyEmail){
        if(error)
        {
            logger.error(TAG + " Error sending notification to Customer for orderID - " + orderJSON.orderEntity.orderInfo.orderNumber + " - Error : \n" + error);
        }
        else
        {
            logger.info(TAG + " Notification successfully sent to customer for orderID : " + orderJSON.orderEntity.orderInfo.orderNumber);
        }
  });
}



exports.msupplyOrderOnHoldNotification = function(orderJSON){
  var logger = log.logger_OMS;

  var commaITConfig = {addPrecision:true, thousandSeperator : ',', decimalSeperator : '.'};

  //var notificationURL = "http://" + envURL.WHICH_HOST + '/notification/api/v1.0/sendNotification';

  var emailObj = {
	"notificationIdentifier": "303",
	"toEmails": [],
	"toMobileNumber": [],
	"smsBodyParams": {
		"orderId": orderJSON.orderEntity.orderInfo.orderNumber
	},
	"emailBodyParams": {
		"firstName": orderJSON.orderEntity.orderInfo.customerInfo.customerFirstname,
		"orderId": orderJSON.orderEntity.orderInfo.orderNumber,
		"orderDate": timezoneConversions.ConvertToIST(orderJSON.orderEntity.orderInfo.orderDate),
		"orderItemInfo": [],
    "subTotal": commaIt((orderJSON.orderEntity.orderInfo.orderTotals.ActualSubtotal + orderJSON.orderEntity.orderInfo.orderTotals.ActualVAT).toFixed(2), commaITConfig),
    "discount": (orderJSON.orderEntity.orderInfo.orderTotals.discountAmount).toFixed(2),
    "discountCouponCode": orderJSON.orderEntity.orderInfo.orderTotals.discountCouponCode,
    "shippingAndHandling": commaIt((orderJSON.orderEntity.orderInfo.orderTotals.shippingAndHandlingAnd3PLCharges).toFixed(2), commaITConfig),
    "exciseDuty": commaIt((orderJSON.orderEntity.orderInfo.orderTotals.excise).toFixed(2), commaITConfig),
		"serviceCharges": commaIt((orderJSON.orderEntity.orderInfo.orderTotals.serviceTaxOnConvenienceFee + orderJSON.orderEntity.orderInfo.orderTotals.convenienceFee + orderJSON.orderEntity.orderInfo.orderTotals.gatewayChargesOnTotal).toFixed(2) , commaITConfig),
		"grandTotal": commaIt((orderJSON.orderEntity.orderInfo.orderTotals.grossTotalWithGatewayCharges).toFixed(2), commaITConfig),
		"paymentMethod": orderJSON.orderEntity.paymentInfo.paymentMode,
		"orderDeliveryAddress": {		}
	},
	"emailAttachment": false,
	"attachmentParams": null,
	"emailAttachmentFileName": null
}

// Populating orderItemInfo
orderJSON.orderEntity.orderInfo.sellerInfo.forEach(function(element){
  element.orderItemInfo.forEach(function(element){
    var orderItemInfoObj = {
      "SKUId": element.SKUId,
      "SKUImage": element.SKUImage,
      "productName": element.productName,
      "price": commaIt(((element.VAT_Value/element.quantity)+element.price).toFixed(2), commaITConfig),
      "quantity": element.quantity,
      "subTotal": commaIt((element.subTotal + element.VAT_Value).toFixed(2),commaITConfig)
    };
    emailObj.emailBodyParams.orderItemInfo.push(orderItemInfoObj);
  });
});


// Setting shipping address
for (var i in orderJSON.orderEntity.orderInfo.orderDeliveryAddress) {
  if (orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].addressType == 'Shipping') {
        emailObj.emailBodyParams.orderDeliveryAddress.customerFullName = orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].ContactfirstName + " " + orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].ContactlastName;
        emailObj.emailBodyParams.orderDeliveryAddress.addressLine1 = orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].addressLine1;
        emailObj.emailBodyParams.orderDeliveryAddress.addressLine2 = orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].addressLine2;
        emailObj.emailBodyParams.orderDeliveryAddress.city = orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].city;
        emailObj.emailBodyParams.orderDeliveryAddress.state = orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].state;
        emailObj.emailBodyParams.orderDeliveryAddress.country = orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].country;
        emailObj.emailBodyParams.orderDeliveryAddress.pinCode = orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].pinCode;
        emailObj.emailBodyParams.orderDeliveryAddress.mobile = orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].Contactmobile;
        break;
    }
    // else if (orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].addressType == 'Billing') {
    //   emailObj.emailBodyParams.firstName = orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].ContactfirstName
    // }
  }
  /*var client = new Client();
  var args = {
  	data: emailObj,
  	headers: { "Content-Type": "application/json" }
  };

  var notif = client.post(notificationURL, args, function (data, response) {
    logger.info(TAG + " Notification successfully sent to customer for orderID : " + orderJSON.orderEntity.orderInfo.orderNumber + " - Notif service response : \n" + JSON.stringify(data));
  });

  notif.on('error', function (err) {
    logger.error(TAG + " Error sending notification to Customer for orderID - " + orderJSON.orderEntity.orderInfo.orderNumber + " - Error : \n" + err.stack);
  });*/

  sendEmailNotification(emailObj, function(error, bodyEmail){
        if(error)
        {
            logger.error(TAG + " Error sending notification to Customer for orderID - " + orderJSON.orderEntity.orderInfo.orderNumber + " - Error : \n" + error);
        }
        else
        {
            logger.info(TAG + " Notification successfully sent to customer for orderID : " + orderJSON.orderEntity.orderInfo.orderNumber);
        }
  });

}

exports.OrderCancellationEmail = function(orderNumber, cancelledSkuid){
  var logger = log.logger_OMS;

  var commaITConfig = {addPrecision:true, thousandSeperator : ',', decimalSeperator : '.'};
  var db = dbConfig.mongoDbConn;
  var orderColl = db.collection('Orders');

  orderColl.findOne({"orderEntity.orderInfo.orderNumber": orderNumber},function(error, orderJSON){
        if(error)
        {
            logger.error(TAG + " Error - Fetching Order Details from Order collection, for orderNumber "+ orderNumber +" Failed");
        }
        else
        {
          //check if the amended values exists else take the Original orderTotals.
          if(orderJSON.orderEntity.orderInfo.orderTotals_A === undefined)
          {
            var actualSubtotal = orderJSON.orderEntity.orderInfo.orderTotals.ActualSubtotal;
            var actualVAT = orderJSON.orderEntity.orderInfo.orderTotals.ActualVAT;
            var discount = orderJSON.orderEntity.orderInfo.orderTotals.discountAmount;
            var discountCouponCode = orderJSON.orderEntity.orderInfo.orderTotals.discountCouponCode;
            var shippingAndHandling = orderJSON.orderEntity.orderInfo.orderTotals.shippingAndHandlingAnd3PLCharges;
            var exciseDuty = orderJSON.orderEntity.orderInfo.orderTotals.excise;
            var serviceTaxOnConvenienceFee = orderJSON.orderEntity.orderInfo.orderTotals.serviceTaxOnConvenienceFee;
            var convenienceFee = orderJSON.orderEntity.orderInfo.orderTotals.convenienceFee;
            var gatewayChargesOnTotal = orderJSON.orderEntity.orderInfo.orderTotals.gatewayChargesOnTotal;
            var grandTotal = orderJSON.orderEntity.orderInfo.orderTotals.grossTotalWithGatewayCharges;
          }
          else
          {
            var actualSubtotal = orderJSON.orderEntity.orderInfo.orderTotals_A.ActualSubtotal;
            var actualVAT = orderJSON.orderEntity.orderInfo.orderTotals_A.ActualVAT;
            var discount = orderJSON.orderEntity.orderInfo.orderTotals_A.discountAmount;
            var discountCouponCode = orderJSON.orderEntity.orderInfo.orderTotals_A.discountCouponCode;
            var shippingAndHandling = orderJSON.orderEntity.orderInfo.orderTotals_A.shippingAndHandlingAnd3PLCharges;
            var exciseDuty = orderJSON.orderEntity.orderInfo.orderTotals_A.excise;
            var serviceTaxOnConvenienceFee = orderJSON.orderEntity.orderInfo.orderTotals_A.serviceTaxOnConvenienceFee;
            var convenienceFee = orderJSON.orderEntity.orderInfo.orderTotals_A.convenienceFee;
            var gatewayChargesOnTotal = orderJSON.orderEntity.orderInfo.orderTotals_A.gatewayChargesOnTotal;
            var grandTotal = orderJSON.orderEntity.orderInfo.orderTotals_A.grossTotalWithGatewayCharges;
          }

            var emailObj = {
            "notificationIdentifier": "304",
            "toEmails": [orderJSON.orderEntity.orderInfo.customerInfo.customerEmail],
            "toMobileNumber": [orderJSON.orderEntity.orderInfo.customerInfo.customerMobile],
            "smsBodyParams": {
              "orderId": orderJSON.orderEntity.orderInfo.orderNumber
            },
            "emailBodyParams": {
              "firstName": orderJSON.orderEntity.orderInfo.customerInfo.customerFirstname,
              "orderId": orderJSON.orderEntity.orderInfo.orderNumber,
              "orderDate": timezoneConversions.ConvertToIST(orderJSON.orderEntity.orderInfo.orderDate),
              "orderItemInfo": [],
              "subTotal": commaIt((actualSubtotal + actualVAT).toFixed(2), commaITConfig),
              "discount": (discount).toFixed(2),
              "discountCouponCode": discountCouponCode,
              "shippingAndHandling": commaIt((shippingAndHandling).toFixed(2), commaITConfig),
              "exciseDuty": commaIt((exciseDuty).toFixed(2), commaITConfig),
              "serviceCharges": commaIt((serviceTaxOnConvenienceFee + convenienceFee + gatewayChargesOnTotal).toFixed(2) , commaITConfig),
              "grandTotal": commaIt((grandTotal).toFixed(2), commaITConfig),
              "paymentMethod": orderJSON.orderEntity.paymentInfo.paymentMode,
              "orderDeliveryAddress": {}
            },
            "emailAttachment": false,
            "attachmentParams": null,
            "emailAttachmentFileName": null
          }

          // Populating orderItemInfo
          orderJSON.orderEntity.orderInfo.sellerInfo.forEach(function(element){
            element.orderItemInfo.forEach(function(element){
              
              if(element.itemStatus === "Cancelled")
              {
                var itemStatus = "Cancelled";
              }
              else
              {
                var itemStatus = "Active";
              }

              var orderItemInfoObj = {
                "SKUId": element.SKUId,
                "SKUImage": element.SKUImage,
                "productName": element.productName,
                "price": commaIt(((element.VAT_Value/element.quantity)+element.price).toFixed(2), commaITConfig),
                "itemStatus" : itemStatus,
                "quantity": element.quantity,
                "subTotal": commaIt((element.subTotal + element.VAT_Value).toFixed(2),commaITConfig)
              };
              emailObj.emailBodyParams.orderItemInfo.push(orderItemInfoObj);
            });
          });

          // Setting shipping address
          for (var i in orderJSON.orderEntity.orderInfo.orderDeliveryAddress) {
            if (orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].addressType === "Shipping") {
                  emailObj.emailBodyParams.orderDeliveryAddress.customerFullName = orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].ContactfirstName + " " + orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].ContactlastName;
                  emailObj.emailBodyParams.orderDeliveryAddress.addressLine1 = orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].addressLine1;
                  emailObj.emailBodyParams.orderDeliveryAddress.addressLine2 = orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].addressLine2;
                  emailObj.emailBodyParams.orderDeliveryAddress.city = orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].city;
                  emailObj.emailBodyParams.orderDeliveryAddress.state = orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].state;
                  emailObj.emailBodyParams.orderDeliveryAddress.country = orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].country;
                  emailObj.emailBodyParams.orderDeliveryAddress.pinCode = orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].pinCode;
                  emailObj.emailBodyParams.orderDeliveryAddress.mobile = orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].Contactmobile;
                  break;
              }
            }

            sendEmailNotification(emailObj, function(error, bodyEmail){
                  if(error)
                  {
                      logger.error(TAG + " Error sending notification to Customer for orderID - " + orderJSON.orderEntity.orderInfo.orderNumber + " - Error : \n" + error);
                  }
                  else
                  {
                      logger.info(TAG + " Notification successfully sent to customer for orderID : " + orderJSON.orderEntity.orderInfo.orderNumber);
                  }
            });
        }    
    });
}

exports.customerOrderDeliveryNotification = function(orderJSON){
  var logger = log.logger_OMS;

  var commaITConfig = {addPrecision:true, thousandSeperator : ',', decimalSeperator : '.'};

  //check if the amended values exists else take the Original orderTotals.
  if(orderJSON.orderEntity.orderInfo.orderTotals_A === undefined)
  {
    var actualSubtotal = orderJSON.orderEntity.orderInfo.orderTotals.ActualSubtotal;
    var actualVAT = orderJSON.orderEntity.orderInfo.orderTotals.ActualVAT;
    var discount = orderJSON.orderEntity.orderInfo.orderTotals.discountAmount;
    var discountCouponCode = orderJSON.orderEntity.orderInfo.orderTotals.discountCouponCode;
    var shippingAndHandling = orderJSON.orderEntity.orderInfo.orderTotals.shippingAndHandlingAnd3PLCharges;
    var exciseDuty = orderJSON.orderEntity.orderInfo.orderTotals.excise;
    var serviceTaxOnConvenienceFee = orderJSON.orderEntity.orderInfo.orderTotals.serviceTaxOnConvenienceFee;
    var convenienceFee = orderJSON.orderEntity.orderInfo.orderTotals.convenienceFee;
    var gatewayChargesOnTotal = orderJSON.orderEntity.orderInfo.orderTotals.gatewayChargesOnTotal;
    var grandTotal = orderJSON.orderEntity.orderInfo.orderTotals.grossTotalWithGatewayCharges;
  }
  else
  {
    var actualSubtotal = orderJSON.orderEntity.orderInfo.orderTotals_A.ActualSubtotal;
    var actualVAT = orderJSON.orderEntity.orderInfo.orderTotals_A.ActualVAT;
    var discount = orderJSON.orderEntity.orderInfo.orderTotals_A.discountAmount;
    var discountCouponCode = orderJSON.orderEntity.orderInfo.orderTotals_A.discountCouponCode;
    var shippingAndHandling = orderJSON.orderEntity.orderInfo.orderTotals_A.shippingAndHandlingAnd3PLCharges;
    var exciseDuty = orderJSON.orderEntity.orderInfo.orderTotals_A.excise;
    var serviceTaxOnConvenienceFee = orderJSON.orderEntity.orderInfo.orderTotals_A.serviceTaxOnConvenienceFee;
    var convenienceFee = orderJSON.orderEntity.orderInfo.orderTotals_A.convenienceFee;
    var gatewayChargesOnTotal = orderJSON.orderEntity.orderInfo.orderTotals_A.gatewayChargesOnTotal;
    var grandTotal = orderJSON.orderEntity.orderInfo.orderTotals_A.grossTotalWithGatewayCharges;
  }

  logger.debug(TAG + " OrderDeliveryNotification triigred for orderID : " + orderJSON.orderEntity.orderInfo.orderNumber);
  var emailObj = {
  "notificationIdentifier": "308",
  "toEmails": [orderJSON.orderEntity.orderInfo.customerInfo.customerEmail],
  "toMobileNumber": [orderJSON.orderEntity.orderInfo.customerInfo.customerMobile],
  "smsBodyParams": {
    "orderId": orderJSON.orderEntity.orderInfo.orderNumber
  },
  "emailBodyParams": {
    "firstName": orderJSON.orderEntity.orderInfo.customerInfo.customerFirstname,
    "orderId": orderJSON.orderEntity.orderInfo.orderNumber,
    "orderDate": timezoneConversions.ConvertToIST(orderJSON.orderEntity.orderInfo.orderDate),
    "orderItemInfo": [],
    "subTotal": commaIt((actualSubtotal + actualVAT).toFixed(2), commaITConfig),
    "discount": (discount).toFixed(2),
    "discountCouponCode": discountCouponCode,
    "shippingAndHandling": commaIt((shippingAndHandling).toFixed(2), commaITConfig),
    "VAT": commaIt((actualVAT).toFixed(2), commaITConfig),
    "serviceCharges": commaIt((serviceTaxOnConvenienceFee + convenienceFee + gatewayChargesOnTotal).toFixed(2) , commaITConfig),
    "grandTotal": commaIt((grandTotal).toFixed(2), commaITConfig),
    "paymentMethod": orderJSON.orderEntity.paymentInfo.paymentMode,
    "customerId": orderJSON.orderEntity.orderInfo.customerInfo.customerId,
    "orderDeliveryAddress": {   }
  },
  "emailAttachment": false,
  "attachmentParams": null,
  "emailAttachmentFileName": null
}

// Populating orderItemInfo
orderJSON.orderEntity.orderInfo.sellerInfo.forEach(function(element){
  element.orderItemInfo.forEach(function(element){
    var orderItemInfoObj = {
      "SKUId": element.SKUId,
      "SKUImage": element.SKUImage,
      "itemStatus": element.itemStatus,
      "productName": element.productName,
      "price": commaIt(((element.VAT_Value/element.quantity)+element.price).toFixed(2), commaITConfig),
      "quantity": element.quantity,
      "subTotal": commaIt((element.subTotal + element.VAT_Value).toFixed(2),commaITConfig)
    };
    emailObj.emailBodyParams.orderItemInfo.push(orderItemInfoObj);
  });
});

// Setting shipping address
for (var i in orderJSON.orderEntity.orderInfo.orderDeliveryAddress) {
  if (orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].addressType == 'Shipping') {
        emailObj.emailBodyParams.orderDeliveryAddress.customerFullName = orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].ContactfirstName + " " + orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].ContactlastName;
        emailObj.emailBodyParams.orderDeliveryAddress.addressLine1 = orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].addressLine1;
        emailObj.emailBodyParams.orderDeliveryAddress.addressLine2 = orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].addressLine2;
        emailObj.emailBodyParams.orderDeliveryAddress.city = orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].city;
        emailObj.emailBodyParams.orderDeliveryAddress.state = orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].state;
        emailObj.emailBodyParams.orderDeliveryAddress.country = orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].country;
        emailObj.emailBodyParams.orderDeliveryAddress.pinCode = orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].pinCode;
        emailObj.emailBodyParams.orderDeliveryAddress.mobile = orderJSON.orderEntity.orderInfo.orderDeliveryAddress[i].Contactmobile;
        break;
    }
  }
 sendEmailNotification(emailObj, function(error, bodyEmail){
        if(error){
            logger.error(TAG + " Error sending OrderDeliveryNotification to Customer for orderID - " + orderJSON.orderEntity.orderInfo.orderNumber + " - Error : \n" + error);
        }
        else{
            logger.debug(TAG + " OrderDeliveryNotification successfully sent to customer for orderID : " + orderJSON.orderEntity.orderInfo.orderNumber);
        }
  });
}

// Function Calls POST API service for Sending email Notification.
function sendEmailNotification(emailBodyParameters, callback){
    //Variable for Logging the messages to the file.
    var logger = log.logger_OMS;
try
{ 
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
                logger.debug(TAG + "email Sent successfully for notificationIdentifier: " + emailBodyParameters.notificationIdentifier);
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
}
catch(e)
{
  console.log(TAG + "Exception in sendEmailNotification for Identifier: - " + JSON.stringify(emailBodyParameters));
  console.log(TAG + "Exception in sendEmailNotification for error: - " + e);
  logger.error(TAG + "Exception in sendEmailNotification:- error :" + e);
  resJson = {
          "http_code" : "500",
          "message" : "Server Error. Please try again."
  };
  return callback(true, resJson);
}  

};
