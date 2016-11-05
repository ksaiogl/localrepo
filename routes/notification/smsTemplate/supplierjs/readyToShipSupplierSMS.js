var TAG = "readyToShipSupplierSMS- ";
var log = require('../../../../Environment/log4js.js');

exports.getSMSBody = function getSMSBody (smsBodyParams, callback){
try
{
  var logger = log.logger_notification;
  var orderId = smsBodyParams.orderId;

  var smsBody = "mSupply Order No: "+orderId+
                "%0Amarked as ready to be shipped."+
                "%0ARefer to the email for manifest.";
                
  return callback(false, smsBody);
}
catch(e)
{
  console.log(TAG + "Exception in readyToShipSupplierSMS- getSMSBody - " + e);
  logger.error(TAG + "Exception in readyToShipSupplierSMS- getSMSBody- :- error :" + e);
  return callback(true, "Exception error");
}
}; 