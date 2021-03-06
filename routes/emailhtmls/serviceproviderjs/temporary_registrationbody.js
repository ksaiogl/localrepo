var htmlEmailssupport = require('../../helpers/htmlEmailssupportFile.js');
var htmlGenericvalues = htmlEmailssupport.generic_values;

//Function to get the registration body.
exports.registrationemailbody = 
function registrationemailbody (username, password, callback){

	var emailBody = '<table align="center" width="800" cellpadding="0" cellspacing="0" style="font-size:medium;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;background:#ffffff;">'+
    '<tbody>'+
        '<tr>'+
            '<td align="center" width="40%" style="padding:10px 0px">'+
                '<a href="http://www.msupply.com/terms_and_conditions_contest" target="_blank">'+
					'<img alt="msupply" width="304" src="http://www.msupply.com/media/wysiwyg/email-template/EmailTemplateLogo.png">'+
				'</a>'+
            '</td>'+
        '</tr>'+
        '<tr>'+
			'<td>'+
			  '<table width="800" cellspacing="0" cellpadding="0" border="0" align="left" style="background:#f9f9f9;border-top:1px solid #dfdfdf;border-bottom:1px solid #dfdfdf;padding:20px 0;">'+
				'<tbody>'+
					'<tr style="margin-right:30px;margin-left:31px;float:left;width:87%;">'+
					    '<td style="color:#545454;font-size:14px" valign="top">'+
						    '<p style="color:#000;font-size:14px;line-height:30px;margin:0;">Dear Service Provider,</p>'+
						    '<p style="color:#000;font-size:14px;line-height:30px;margin:0;">To get started, download the app from the link shared below. Then, use the username and password given below to log into the app - you are already registered!</p>'+
						    '<p style="color:#000;font-size:14px;line-height:30px;margin:0;">User Name: '+username+'</p>'+
						    '<p style="color:#000;font-size:14px;line-height:30px;margin:0;">Password: '+password+'</p>'+
						    '<p style="color:#000;font-size:14px;line-height:30px;margin:0;">Mobile App link: https://play.google.com/store/apps/details?id=com.mobileapp.msupply.affiliate </p>'+
					    '</td>'+
					'</tr>'+			
				 '</tbody>'+
			   '</table>'+	
			'</td>'+
		'</tr>'+
		'<tr>'+
			'<td>'+
			  '<table width="800" cellspacing="0" cellpadding="0" border="0" align="left" style="background:#fff;border-top:1px solid #dfdfdf;padding-top: 20px;">'+
				'<tbody>'+
					'<tr align="center">'+
						'<td width="100%" align="center" style="float:left;margin:20px 20px 0px;padding-bottom:5px;">'+
							 '<p style="color:#627179;font-size:14px;margin-bottom:0;">Contact us for any other assistance</p>'+
							 '<p style="color:#627179;font-size:14px;margin:7px 0 22px;"><strong style="color:#1fa9a6;font-size:14px;">'+htmlGenericvalues.support_contactnumber+'</strong>&nbsp;or&nbsp;<a href="mailto:'+htmlGenericvalues.support_email+'" style="text-decoration:none;color:#1fa9a6;font-size:13px;font-weight:bold;">'+htmlGenericvalues.support_email+'</a></p>'+
							 
						'</td>'+
				    '</tr>'+
				'</tbody>'+
			  '</table>'+
			'</td>'+
		'</tr>'+
		'<tr>'+
             '<td>'+
                '<a href="http://www.msupply.com/terms_and_conditions_contest" target="_blank">'+
				   '<img width="800" alt="ptqq" src="http://www.msupply.com/media/wysiwyg/email-template/Service_Providers_footer_new.png">'+
                '</a>'+
            '</td> '+
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
								'<td><a href="https://www.facebook.com/mSupplydotcom?fref=ts" style="text-decoration:none" target="_blank"><img alt="facebook" width="32" height="30" src="http://www.msupply.com/media/wysiwyg/registration_confirmation/facebook.png" style="padding-right:3px"> </a></td>'+
								'<td><a href="https://twitter.com/mSupplydotcom/" style="text-decoration:none" target="_blank"><img alt="twitter" width="32" height="30" src="http://www.msupply.com/media/wysiwyg/registration_confirmation/twitter.png" style="padding-right:3px"> </a></td>'+
								'<td><a href="https://plus.google.com/+mSupplydotcom/posts" style="text-decoration:none" target="_blank"><img alt="googleplus" width="32" height="30" src="http://www.msupply.com/media/wysiwyg/registration_confirmation/google+.png" style="padding-right:3px"> </a></td>'+
								'<td><a href="https://www.linkedin.com/company/msupply-com" style="text-decoration:none" target="_blank"><img alt="linkedin" width="32" height="30" src="http://www.msupply.com/media/wysiwyg/registration_confirmation/in.png" style="padding-right:3px"> </a></td>'+
							'</tr>'+
						'</tbody>'+
					'</table>'+
				  '</td>'+
				'</tr>'+
				'<tr>'+
					'<td width="730" align="center">'+
						'<img alt="address_icon" width="10" height="13" src="http://www.msupply.com/media/wysiwyg/registration_confirmation/address_icon.png" style="padding-right:5px">'+
						'<span style="color:#637279;font-size:10px;text-align:center;">'+htmlGenericvalues.office_address+'</span>'+
					'</td>'+
				'</tr>'+
				'<tr>'+
					'<td style="padding:4px 0 0;text-align:center;">'+
						'<p style="margin:0;float:left;width:100%;color:#637279;font-size:10px;">'+
						   '<img alt="mail_icon" width="13" height="13" src="http://www.msupply.com/media/wysiwyg/registration_confirmation/mail_icon.png" style="margin-right:3px">'+
						   '<a style="text-align:center;text-decoration:none;color:#637279;font-weight:normal;" href="mailto:'+htmlGenericvalues.support_email+'" target="_top">'+htmlGenericvalues.support_email+'</a>'+
						   '<span style="font-weight:normal;"><img alt="phone_icon" width="13" height="13" src="http://www.msupply.com/media/wysiwyg/registration_confirmation/phone_icon.png" style="padding-right:4px">'+htmlGenericvalues.support_contactnumber+'</span>'+
						'</p>'+
					'</td>'+
				'</tr>' +
			  '</tbody>'+
			'</table>'+
			'</td>'+
		'</tr>'+
    '</tbody>'+
'</table>';

	return callback(emailBody);
};