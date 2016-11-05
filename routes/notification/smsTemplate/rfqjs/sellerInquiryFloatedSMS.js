var TAG = "sellerInquiryFloatedSMS- ";
var log = require('../../../../Environment/log4js.js');

exports.getSMSBody = function getSMSBody (smsBodyParams, callback){
try
{
  var logger = log.logger_notification;

  var smsBody = "You have received an enquiry from mSupply.com - Enquiry ID: "+smsBodyParams.inquiryID+". LOGIN to mSupply Supplier Panel and submit your quote";

  return callback(false, smsBody);
}
catch(e)
{
  console.log(TAG + "Exception in HTML sellerInquiryFloatedSMS- getSMSBody - " + e);
  logger.error(TAG + "Exception in HTML sellerInquiryFloatedSMS- getSMSBody- :- error :" + e);
  return callback(true, "Exception error");
}
};