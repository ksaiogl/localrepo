var htmlEmailssupport = require('../../helpers/htmlEmailssupportFile.js');
var htmlGenericvalues = htmlEmailssupport.generic_values;

/**
 * New node file
 */

var TAG = "websitecustomerrequests.js";

//Function to get the update profile body.
exports.customerrequestsemailbody = 
function customerrequestsemailbody (firstName, lastName, mobile, email, expertiseRequested,
		requestTimeStamp, description, serviceProviderChosen, callback){
	
		if(serviceProviderChosen !== null){
			var chosenData = 'FirstName - '+ serviceProviderChosen.firstName +', LastName - '+ serviceProviderChosen.lastName +', Mobile No - '+ serviceProviderChosen.mobile +', Email - '+ serviceProviderChosen.email;
		}else{
			chosenData = '';
		}
	
		var emailBody =
			
		'<!doctype html>'+
		'<head>'+
		'<style>'+
		'</style>'+
		'</head>'+
		'<body>'+
		'<table class="email-trigger" cellpadding="10" cellspacing="0" style="font-family:Arial;" border="1">'+
		'    <tbody><tr style="background-color:#627179;font-size:14px;color:#fff;height: 40px;vertical-align: middle;"> '+
		'        <th style="border-left: 0;">Customer First Name</th>'+
		'        <th>Customer Last Name</th>'+        
		'		 <th>Customer Mobile Number</th>'+
		'        <th>Customer Email</th>'+
		'        <th>Expertise Requested (comma separated)</th>'+
		'        <th>Requirement description given</th>'+
		'        <th>Request place date and time in IST</th>'+
		'		<th>Service Provider (If Chosen Details Below)</th>'+
		'    </tr>'+
		'    <tr>'+
		'        <td style="border-left: 1px solid #cfcfcf;">'+ firstName +'</td>'+
		'        <td>'+ lastName +'</td>'+
		'        <td>'+ mobile +'</td>'+
		'        <td>'+ email +'</td>'+
		'        <td>'+ expertiseRequested +'</td>'+
		'        <td>'+ description +'</td>'+
		'        <td>'+ requestTimeStamp +'</td>'+
		'        <td>'+ chosenData +'</td>'+
		'    </tr>'+
		'</tbody>'+
		'</table>'+
		'</body>'+
		'</html>';
		

		return callback(emailBody);
};
