var TAG = "CustomerOrderConfirmationSMS- ";
var log = require('../../../../Environment/log4js.js');

exports.getSMSBody = function getSMSBody (smsBodyParams, callback){
try
{
  var logger = log.logger_notification;
  var orderId = smsBodyParams.orderId;

  var smsBody = "Your mSupply order is confirmed. Order No: "+orderId+". For more, visit www.msupply.com - Build, Renovate, Do Interiors with mSupply. Because quality matters!"
  return callback(false, smsBody);
}
catch(e)
{
  console.log(TAG + "Exception in HTML CustomerOrderConfirmationSMS- getSMSBody - " + e);
  logger.error(TAG + "Exception in HTML CustomerOrderConfirmationSMS- getSMSBody- :- error :" + e);
  return callback(true, "Exception error");
}
};  