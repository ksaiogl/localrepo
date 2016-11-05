var TAG = "CustomerOrderConfirmationSupplierSMS- ";
var log = require('../../../../Environment/log4js.js');
var htmlEmailsSupport = require('../../htmlEmailsSupportFile.js');
var htmlGenericvalues = htmlEmailsSupport.generic_values;

exports.getSMSBody = function getSMSBody (smsBodyParams, callback){
try
{
  var logger = log.logger_notification;
  var orderId = smsBodyParams.orderId;

  var smsBody = "You have received an order from mSupply - Order No: "+orderId+". Please check your Supplier App and process the order.Contact "+htmlGenericvalues.support_contactnumber+" for more details."
  return callback(false, smsBody);
}
catch(e)
{
  console.log(TAG + "Exception in HTML CustomerOrderConfirmationSupplierSMS- getSMSBody - " + e);
  logger.error(TAG + "Exception in HTML CustomerOrderConfirmationSupplierSMS- getSMSBody- :- error :" + e);
  return callback(true, "Exception error");
}
};