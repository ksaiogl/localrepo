var htmlEmailssupport = require('../../helpers/htmlEmailssupportFile.js');
var htmlGenericvalues = htmlEmailssupport.generic_values;

//Function to get the leads email body.
exports.getEmailbody = 
function getEmailbody (firstName, lastName, mobile, email, callback){

	var emailBody = '<table align="center" width="800" cellspacing="0" cellpadding="0" border="0" style="font-size:medium;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;background:#ffffff;">'+
    '<tbody>'+
		'<tr>'+
		  '<td valign="top" align="left">'+
			 '<table width="100%" cellspacing="0" cellpadding="0" border="0">'+							  
				'<tr>'+
					'<td width="50%" style="padding-bottom:15px;">'+
						'<a target="_blank" href="http://www.msupply.com/">'+
							'<img alt="msupply" width="205" src="http://www.msupply.com/media/wysiwyg/registration_confirmation/registration_logo.png" style="outline:none;">'+
						'</a>'+
					'</td> '+                          
				'</tr>'+
			   '</table>'+
		   '</td>'+
		'</tr>'+
		'<tr>'+
			'<td>'+
			  '<table width="800" cellspacing="0" cellpadding="0" border="0" align="left" style="background:#f9f9f9;border-top:1px solid #dfdfdf;border-bottom:1px solid #dfdfdf;padding-top: 20px;">'+
				'<tbody>'+
					'<tr bgcolor="#bd4931" width="730" style="color:#fff;font-size:24px;height:45px;float:left;margin-right:30px;margin-left:31px;margin-bottom:0px;width:87%;padding:0px 20px;text-align:center;">'+
						'<td align="center">'+
							'<span style="text-align:center;width:100%;float:left;margin-top:8px;margin-left:152px;">Because Quality Matters</span>'+
						'</td>'+
					'</tr>'+
					'<tr style="margin-right:30px;margin-left:31px;float:left;width:100%;">'+
					  '<td style="color:#545454;font-size:14px">'+
						  '<p style="margin-top:20px;color:#444444;font-size:18px;font-weight:normal;line-height:20px;margin-bottom:10px;">Dear Customer, </p>'+
						  '<p style="color:#000;font-size:12px;line-height:30px;">We have noted your request for a service provider. Your request will be serviced shortly!</p>'+
					'</td>'+
					'</tr>'+
													
					'<tr>'+							
						'<td width="95%" align="center" style="float:left;margin:40px 20px 0px;padding-bottom:5px;">'+
							 '<p style="color:#627179;font-size:14px;margin-bottom:0;">Contact us for any other assistance</p>'+
							 '<p style="color:#627179;font-size:14px;margin:7px 0 22px;"><strong style="color:#1fa9a6;font-size:14px;">1800 532 0555</strong>&nbsp;or&nbsp;<a href="mailto:'+htmlGenericvalues.support_email+'" style="text-decoration:none;color:#1fa9a6;font-size:13px;font-weight:bold;">'+htmlGenericvalues.support_email+'</a></p>'+
						'</td>'+
					'</tr>'+
					'<tr align="center">'+
					   '<td style="padding: 0px 0 10px;" align="center" width="100%">'+
						   '<a href="http://www.msupply.com/" target="_blank">'+
							  '<img width="722" alt="mSupply Benefit" src="http://www.msupply.com/media/wysiwyg/registration_confirmation/buy_seek_corporation_banner.png" style="text-align:center;">'+
						   '</a>'+
					   '</td>'+
					'</tr>'+
				 '</tbody>'+
				'</table>'+
			'</td>'+
		'</tr>'+
		'<tr>'+
		  '<td>'+
			'<table width="100%" cellspacing="0" cellpadding="0" border="0" style="padding-top: 15px;">'+
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
				'</tr>'+
			  '</tbody>'+
			'</table>'+
			'</td>'+
		'</tr>'+
	'</tbody>'+
'</table>';

return callback(emailBody);
};