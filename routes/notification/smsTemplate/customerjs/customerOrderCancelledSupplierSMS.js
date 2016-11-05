var TAG = "customerOrderCancelledSupplierSMS- ";
var log = require('../../../../Environment/log4js.js');

exports.getSMSBody = function getSMSBody (smsBodyParams, callback){
try
{
  var logger = log.logger_notification;
  var orderId = smsBodyParams.orderId;

  var smsBody = "We regret to inform you that mSupply Order No: "+orderId+" has been cancelled by customer.";
  return callback(false, smsBody);
}
catch(e)
{
  console.log(TAG + "Exception in customerOrderCancelledSupplierSMS- getSMSBody - " + e);
  logger.error(TAG + "Exception in customerOrderCancelledSupplierSMS- getSMSBody- :- error :" + e);
  return callback(true, "Exception error");
}
};