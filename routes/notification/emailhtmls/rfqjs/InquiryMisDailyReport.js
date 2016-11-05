var TAG = "InquiryMisDailyReport.js";

var htmlSupport = require('../../htmlEmailsSupportFile.js');
var htmlGenericvalues = htmlSupport.generic_values;
var log = require('../../../../Environment/log4js.js');

exports.getHtml = 
function getHtml (emailData, callback){
	var logger = log.logger_notification;
	
	try{	
		var emailSubject = "Inquiry MIS report.";
		
		var emailBody = 'Hi Team, <br>Please find the attached inquiry mis report.'
			
		return callback(false, emailBody, emailSubject);
	}
	catch(e){
		console.log(TAG + "Exception in HTML InquiryMisDailyReport- getHtml - " + e);
		logger.error(TAG + "Exception in HTML InquiryMisDailyReport- getHtml- :- error :" + e);
		return callback(true, "Exception error");
	}
}