var TAG = "RFQSupplierAdditionSMS- ";
var log = require('../../../../Environment/log4js.js');

exports.getSMSBody = function getSMSBody (smsBodyParams, callback){
try
{
  var logger = log.logger_rfq;
  var supplierName = smsBodyParams.supplierName;

  var smsBody = "Hi "+supplierName+" a customer has added you to the mSupply.com's Enquiry System. For more, visit www.msupply.com"
  return callback(false, smsBody);
}
catch(e)
{
  console.log(TAG + "Exception in HTML RFQSupplierAdditionSMS- getSMSBody - " + e);
  logger.error(TAG + "Exception in HTML RFQSupplierAdditionSMS- getSMSBody- :- error :" + e);
  return callback(true, "Exception error");
}
};  