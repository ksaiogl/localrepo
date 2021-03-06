var TAG = "supplierRefered.js";

var htmlSupport = require('../../htmlEmailsSupportFile.js');
var htmlGenericvalues = htmlSupport.generic_values;
var log = require('../../../../Environment/log4js.js');

exports.getHtml = 
function getHtml (emailData, callback){
	var logger = log.logger_notification;
	
	try{	

	var emailSubject = "Greetings! "+ emailData.companyName + " added you as a supplier on mSupply RFQ Platform.";

	var emailBody =
		
	'<table align="center" width="800" cellspacing="0" cellpadding="0" border="0" style="font-size:medium;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;background:#ffffff;">'+  
    '<tbody>'+
		'<tr>'+
			'<td width="40%" align="center" style="padding:10px 0px">'+
				'<a target="_blank" href="https://www.msupply.com/">'+
					'<img style="width:230px;" src="http://static.msupply.com/emailTemplate/EmailTemplateLogo.png" alt="msupply">'+
				'</a>'+
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
					'<tr style="float:left;margin-right:55px;width:86%;margin-left:55px;padding-bottom:15px;">'+
					  '<td style="color:#545454;font-size:14px">'+
						  '<p style="margin:20px 0 10px;color:#444444;font-size:14px;line-height:20px;">Dear Supplier,</p>'+
						  '<p style="color:#444;font-size:14px;line-height:20px;margin:10px;">Greetings from mSupply.com, an ecommerce marketplace which acts as a technology service provider and directly connects customers with suppliers online.</p>'+
						  '<p style="color:#444;font-size:14px;line-height:20px;margin:10px;">'+emailData.companyName+' has adopted mSupply.com as the software platform to float enquiries, receive quotes, raise purchase orders, etc.</b></p>'+
					      '<p style="color:#444;font-size:14px;line-height:20px;margin:10px;">In this context, '+emailData.companyName+' has uploaded your details for you to receive enquiries. Request you to kindly register with mSupply.com to receive enquiries from customers.</p>'+
					      
					  '</td>'+
					'</tr>'+			
				'</tbody>'+
				'</table>'+	
			'</td>'+
		'</tr>'+
		'<tr align="center">'+
			'<td width="100%" align="center" style="float:left;margin:20px 20px 0px;padding-bottom:20px;">'+
				 '<p style="color:#444;font-size:13px;margin-bottom:0;">Contact us for any help or support</p>'+
				 '<p style="color:#627179;font-size:13px;margin:7px 0 22px;"><strong style="color:#1fa9a6;font-size:13px;">'+htmlGenericvalues.support_contactnumber+'</strong>&nbsp;or&nbsp;<a href="mailto:'+htmlGenericvalues.supplier_support_email+'" style="text-decoration:none;color:#1fa9a6;font-size:13px;font-weight:bold;">'+htmlGenericvalues.supplier_support_email+'</a></p>'+
				 '<span style="color:#627179;font-size:19px;"><strong>mSupply</strong> Benefits</span>'+
			'</td>'+
		'</tr>'+
		'<tr align="center">'+
		   '<td style="padding: 0px 35px 10px;" align="center" width="100%">'+
			   '<a href="https://www.msupply.com/" target="_blank">'+
				  '<img width="722" alt="mSupply Benefit" src="http://static.msupply.com/emailTemplate/order_confirmation/mSupply_Benefit.png" style="text-align:center;">'+
			   '</a>'+
		   '</td>'+ 
		'</tr>'+
		'<tr align="center">'+
			'<td style="padding: 0px 35px 10px;" align="center" width="100%">'+
				'<a href="https://www.msupply.com/" target="_blank">'+
				   '<img alt="Online Store" src="http://static.msupply.com/emailTemplate/order_confirmation/online_store_banner_new.png" style="text-align:center;">'+
				'</a>'+
			'</td>'+
		'</tr>'+
		'<tr>'+							
			'<td width="95%" align="center" style="float:left;margin:0px 20px;padding-bottom:20px;">'+
				'<p style="color:#444;font-size:14px;margin-bottom:0;">mSupply.com DIRECTLY connects you with suppliers to get product, price & credit.</p>'+
				'<p style="color:#444;font-size:14px;margin:7px 0 0;">It does NOT Intermediate/ Discount/ Influence Price, Product or Credit/ Payment Terms.</p>'+
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
								'<td><a href="https://www.facebook.com/mSupplydotcom?fref=ts" style="text-decoration:none" target="_blank"><img alt="facebook" width="32" height="30" src="http://static.msupply.com/emailTemplate/registration_confirmation/facebook.png" style="padding-right:3px"> </a></td>'+
								'<td><a href="https://twitter.com/mSupplydotcom/" style="text-decoration:none" target="_blank"><img alt="twitter" width="32" height="30" src="http://static.msupply.com/emailTemplate/registration_confirmation/twitter.png" style="padding-right:3px"> </a></td>'+
								'<td><a href="https://plus.google.com/+mSupplydotcom/posts" style="text-decoration:none" target="_blank"><img alt="googleplus" width="32" height="30" src="http://static.msupply.com/emailTemplate/registration_confirmation/google+.png" style="padding-right:3px"> </a></td>'+
								'<td><a href="https://www.linkedin.com/company/msupply-com" style="text-decoration:none" target="_blank"><img alt="linkedin" width="32" height="30" src="http://static.msupply.com/emailTemplate/registration_confirmation/in.png" style="padding-right:3px"> </a></td>'+
							'</tr>'+
						'</tbody>'+
					'</table>'+
				  '</td>'+
				'</tr>'+
				'<tr>'+
					'<td width="730" align="center">'+
						'<img alt="address_icon" width="10" height="13" src="http://static.msupply.com/emailTemplate/registration_confirmation/address_icon.png" style="padding-right:5px">'+
						'<span style="color:#637279;font-size:10px;text-align:center;">'+htmlGenericvalues.office_address+'</span>'+
					'</td>'+
				'</tr>'+
				'<tr>'+
					'<td style="padding:4px 0 0;text-align:center;">'+
						'<p style="margin:0;float:left;width:100%;color:#637279;font-size:10px;">'+
						   '<img alt="mail_icon" width="13" height="13" src="http://static.msupply.com/emailTemplate/registration_confirmation/mail_icon.png" style="margin-right:3px">'+							
						   '<a style="text-align:center;text-decoration:none;color:#637279;font-weight:normal;" href="mailto:'+htmlGenericvalues.supplier_support_email+'" target="_top">'+htmlGenericvalues.supplier_support_email+'</a>'+
						   '<span style="font-weight:normal;"><img alt="phone_icon" width="13" height="13" src="http://static.msupply.com/emailTemplate/registration_confirmation/phone_icon.png" style="padding-right:4px">'+htmlGenericvalues.support_contactnumber+'</span>'+
						'</p>'+
					'</td>'+
				'</tr> '+
			  '</tbody>'+
			'</table>'+
			'</td>'+
		'</tr>'+
		'</tbody>'+
	'</table>';

		return callback(false, emailBody, emailSubject);
	}
	catch(e){
		console.log(TAG + "Exception in HTML supplierRefered- getHtml - " + e);
		logger.error(TAG + "Exception in HTML supplierRefered- getHtml- :- error :" + e);
		return callback(true, "Exception error");
	}
}