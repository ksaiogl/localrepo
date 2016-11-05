var TAG = "CustomerOrderPlacedSMS- ";
var log = require('../../../../Environment/log4js.js');

exports.getSMSBody = function getSMSBody (smsBodyParams, callback){
try
{
  var logger = log.logger_notification;
  var orderId = smsBodyParams.orderId;

var smsBody = "Your mSupply Order No: "+orderId+" has been placed and is 'Under Processing'. We will get in touch with you. For more, visit www.msupply.com";

  return callback(false, smsBody);
}
catch(e)
{
  console.log(TAG + "Exception in HTML CustomerOrderPlacedSMS- getSMSBody - " + e);
  logger.error(TAG + "Exception in HTML CustomerOrderPlacedSMS- getSMSBody- :- error :" + e);
  return callback(true, "Exception error");
}
};  
