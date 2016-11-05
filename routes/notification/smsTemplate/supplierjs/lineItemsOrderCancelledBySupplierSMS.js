var TAG = "lineItemsOrderCancelledBySupplierSMS- ";
var log = require('../../../../Environment/log4js.js');

exports.getSMSBody = function getSMSBody (smsBodyParams, callback){
try
{
  var logger = log.logger_notification;
  var orderId = smsBodyParams.orderId;
  var smsBody = "You have cancelled one of the items from mSupply Order No: "+orderId;
  return callback(false, smsBody);
}
catch(e)
{
  console.log(TAG + "Exception in HTML orderCancelledBySupplierSMS- getSMSBody - " + e);
  logger.error(TAG + "Exception in HTML orderCancelledBySupplierSMS- getSMSBody- :- error :" + e);
  return callback(true, "Exception error");
}
};