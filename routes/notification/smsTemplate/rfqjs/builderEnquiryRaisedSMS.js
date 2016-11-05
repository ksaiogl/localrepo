var TAG = "builderEnquiryRaisedSMS- ";
var log = require('../../../../Environment/log4js.js');

exports.getSMSBody = function getSMSBody (smsBodyParams, callback){
try
{
  var logger = log.logger_notification;
  var smsBody = "Enquiry raised successfully.";
  return callback(false, smsBody);
}
catch(e)
{
  console.log(TAG + "Exception in HTML builderEnquiryRaisedSMS- getSMSBody - " + e);
  logger.error(TAG + "Exception in HTML builderEnquiryRaisedSMS- getSMSBody- :- error :" + e);
  return callback(true, "Exception error");
}
};