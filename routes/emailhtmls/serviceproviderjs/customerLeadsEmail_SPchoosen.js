var htmlEmailssupport = require('../../helpers/htmlEmailssupportFile.js');
var htmlGenericvalues = htmlEmailssupport.generic_values;

//Function to get the leads email body.
exports.getEmailbody = 
function getEmailbody (req, callback){

	var fullName = req.body.serviceProviderChosen.firstName + ' ' + req.body.serviceProviderChosen.lastName;
	
	var description = "";

	if(req.body.description === null){
		description = "NA";
	}
	else{
		description	= req.body.description.length === 0 ? "NA" : req.body.description;
	}
	
	var emailBody = '<table align="center" width="800" cellpadding="0" cellspacing="0" style="font-size:medium;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;background:#ffffff;">'+
    '<tbody>'+
        '<tr>'+
            '<td width="100%" style="padding:10px 0px;text-align:center" colspan="3">'+
                '<a href="http://www.msupply.com" target="_blank">'+
					'<img alt="mSupply.com" src="http://www.msupply.com/media/wysiwyg/email-template/EmailTemplateLogo.png" style="width:230px;">'+
				'</a>'+
            '</td>'+
        '</tr>'+
        '<tr>'+
			'<td>'+
			    '<table width="800" cellspacing="0" cellpadding="0" border="0" align="left" style="background:#f9f9f9;border-top:1px solid #dfdfdf;padding:20px 0;">'+
				    '<tbody>'+
						'<tr style="margin-right:30px;margin-left:31px;float:left;width:92%;">'+
							'<td style="color:#545454;font-size:14px" valign="top">'+
							    '<table width="722" cellspacing="0" cellpadding="0" border="0" align="center" style="background:#fff;border:1px solid #dfdfdf;padding: 20px 20px 10px;">'+
									'<tbody>'+
									    '<tr width="722" style="float:left;width:100%;">'+
											'<td>'+
												'<p style="color:#000;font-size:14px;line-height:30px;margin:0;float:left;margin-bottom:18px;">Dear Customer,<br/>Greetings from mSupply!<br/>Thank You for reaching out to us.<br/></p>'+
										        '<p style="color:#000;font-size:14px;line-height:20px;margin:0 0 10px 0;float:left;">Please note the Service Provider details as below. Kindly contact him for your requirements.</p>'+
											'</td>'+
										'</tr>'+
										'<tr width="722" style="float:left;width:100%;">'+
											'<td>'+
												'<table width="722" cellspacing="0" cellpadding="0" border="0" align="left">'+
													'<tbody>'+
														'<tr style="float:left;width:100%;padding: 10px 20px 40px;">'+
															'<td align="left" width="50%" style="color:#545454;font-size:14px;float:left;" valign="top">'+
																'<p style="color:#000;font-size:14px;line-height:25px;margin:0;"><em style="text-decoration:underline;color:#8b8a8a;font-weight:bold;">Service Provider Contact Details:</em><br/><b>Name: </b> '+fullName+'<br/><b>Contact Number: </b>'+req.body.serviceProviderChosen.mobile+'<br/><b>Email: </b>'+req.body.serviceProviderChosen.email+'</p>'+
															'</td>'+
															'<td align="left" width="50%" style="color:#545454;font-size:14px;" valign="top">'+
																'<p style="color:#000;font-size:14px;line-height:25px;margin:0;"><em style="text-decoration:underline;color:#8b8a8a;font-weight:bold;">Your Requirement:</em><br/><b>Expertise Sought: </b>'+req.body.expertiseRequested.toString()+'<br/><b>Description: </b>'+description+'</p>'+
															'</td>'+
														'</tr>'+		
													'</tbody>'+
												'</table>'+
											'</td>'+
										'</tr>'+
										'<tr width="722" align="center" style="text-align:center;width:100%;padding:10px 20px 0px 20px;">'+
											'<td width="722">'+
												'<p style="text-align:center;font-weight:bold;color:#787878;font-size:18px;line-height:30px;margin:0;margin-bottom:18px;">Build. Renovate. Do Interiors.</p>'+
											'</td>'+
										'</tr>'+
									'</tbody>'+
								'</table>'+
							'</td>'+
						'</tr>'+
                        '<tr>'+							
							'<td width="100%" align="center" style="float:left;margin:20px 20px 0px;padding-bottom:5px;">'+
								 '<p style="color:#627179;font-size:14px;margin-bottom:0;">Contact us for any other assistance</p>'+
								 '<p style="color:#627179;font-size:14px;margin:7px 0 22px;"><strong style="color:#1fa9a6;font-size:14px;">1800 532 0555</strong>&nbsp;or&nbsp;<a href="mailto:'+htmlGenericvalues.support_email+'" style="text-decoration:none;color:#1fa9a6;font-size:13px;font-weight:bold;">'+htmlGenericvalues.support_email+'</a></p>'+											 
							'</td>'+
						'</tr>'+
						'<tr align="center">'+
							'<td width="722" align="center">'+
								'<a href="http://www.msupply.com/" target="_blank">'+
								   '<img width="722" alt="mSupply.com" src="http://www.msupply.com/media/wysiwyg/email-template/money_sample_seek_connect.png">'+
								'</a>'+
							'</td>'+
						'</tr>'+					
				    '</tbody>'+
			    '</table>'+	
			'</td>'+
		'</tr>'+
		
		'<tr>'+
		  '<td>'+
			'<table width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top:1px solid #d0d2d3;padding:20px 0px;">'+
			  '<tbody>'+
				'<tr>'+
				  '<td valign="top" align="center">'+
					 '<table height="41" cellspacing="0" cellpadding="0" border="0">'+
						'<tbody>'+
							'<tr>'+
								'<td><a href="https://www.facebook.com/mSupplydotcom?fref=ts" style="text-decoration:none" target="_blank"><img alt="Facebook" width="32" height="30" src="http://www.msupply.com/media/wysiwyg/registration_confirmation/facebook.png" style="padding-right:3px"> </a></td>'+
								'<td><a href="https://twitter.com/mSupplydotcom/" style="text-decoration:none" target="_blank"><img alt="Twitter" width="32" height="30" src="http://www.msupply.com/media/wysiwyg/registration_confirmation/twitter.png" style="padding-right:3px"> </a></td>'+
								'<td><a href="https://plus.google.com/+mSupplydotcom/posts" style="text-decoration:none" target="_blank"><img alt="Google+" width="32" height="30" src="http://www.msupply.com/media/wysiwyg/registration_confirmation/google+.png" style="padding-right:3px"> </a></td>'+
								'<td><a href="https://www.linkedin.com/company/msupply-com" style="text-decoration:none" target="_blank"><img alt="Linkedin" width="32" height="30" src="http://www.msupply.com/media/wysiwyg/registration_confirmation/in.png" style="padding-right:3px"> </a></td>'+
							'</tr>'+
						'</tbody>'+
					'</table>'+
				  '</td>'+
				'</tr>'+
				'<tr>'+
					'<td width="730" align="center">'+
						'<img alt="address" width="10" height="13" src="http://www.msupply.com/media/wysiwyg/registration_confirmation/address_icon.png" style="padding-right:5px">'+
						'<span style="color:#637279;font-size:10px;text-align:center;">'+htmlGenericvalues.office_address+'</span>'+
					'</td>'+
				'</tr>'+
				'<tr>'+
					'<td style="padding:4px 0 0;text-align:center;">'+
						'<p style="margin:0;float:left;width:100%;color:#637279;font-size:10px;">'+
						   '<img alt="Email-ID" width="13" height="13" src="http://www.msupply.com/media/wysiwyg/registration_confirmation/mail_icon.png" style="margin-right:3px">'+
						   '<a style="text-align:center;text-decoration:none;color:#637279;font-weight:normal;" href="mailto:'+htmlGenericvalues.support_email+'" target="_top">'+htmlGenericvalues.support_email+'</a>'+
						   '<span style="font-weight:normal;"><img alt="Call" width="13" height="13" src="http://www.msupply.com/media/wysiwyg/registration_confirmation/phone_icon.png" style="padding-right:4px">'+htmlGenericvalues.support_contactnumber+'</span>'+
						'</p>'+
					'</td>'+
				'</tr>'+
			  '</tbody>'+
			'</table>'+
			'</td>'+
		'</tr>'+
    '</tbody>'+
'</table>';

return callback(emailBody);
};