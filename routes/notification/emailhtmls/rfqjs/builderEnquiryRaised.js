var TAG = "builderEnquiryRaised.js";

var htmlSupport = require('../../htmlEmailsSupportFile.js');
var htmlGenericvalues = htmlSupport.generic_values;
var log = require('../../../../Environment/log4js.js');

exports.getHtml = 
function getHtml (emailData, callback){
	var itemInfo = '', listItem = '', expertise = [];
	var logger = log.logger_sp;
	
	try{	
	
	var emailSubject = "Enquiry raised successfully.";
	var data = emailData.data;
	
	var emailBody =
		'<!doctype html>'+
		'<head>'+
		'<style>'+
		'</style>'+
		'</head>'+
		'<body>'+
		'<table class="email-trigger" cellpadding="10" cellspacing="0" style="font-family:Arial;" border="1">'+
		'    <tbody><tr style="background-color:#627179;font-size:14px;color:#fff;height: 40px;vertical-align: middle;"> '+
		'        <th style="border-left: 0;">Sl no</th>'+
		'        <th>Service provider ID</th>'+
		'        <th>First Name</th>'+ 
		'        <th>Last Name</th>'+        
		'		 <th>Verification status</th>'+
		'        <th>Expertise</th>'+
		'    </tr>'+
		'    <tr>'+
			itemInfo
		'</tbody>'+
		'</table>'+
		'</body>'+
		'</html>';

		return callback(false, emailBody, emailSubject);
	}
	catch(e){
		console.log(TAG + "Exception in HTML builderEnquiryRaised- getHtml - " + e);
		logger.error(TAG + "Exception in HTML builderEnquiryRaised- getHtml- :- error :" + e);
		return callback(true, "Exception error");
	}
}