var TAG = "supplierReferedSMS- ";
var log = require('../../../../Environment/log4js.js');

exports.getSMSBody = function getSMSBody (smsBodyParams, callback){
try
{
  var logger = log.logger_notification;
  var smsBody = "Dear Supplier, %0A"+
				"Greetings from mSupply.com. You have been added as a supplier by "+smsBodyParams.companyName+" on mSupply RFQ "+
				"platform. Register with us to receive enquiries from "+smsBodyParams.companyName+" and other customers.%0A"+
				"Visit: www.msupply.com";
  return callback(false, smsBody);
}
catch(e)
{
  console.log(TAG + "Exception in HTML supplierReferedSMS- getSMSBody - " + e);
  logger.error(TAG + "Exception in HTML supplierReferedSMS- getSMSBody- :- error :" + e);
  return callback(true, "Exception error");
}
};