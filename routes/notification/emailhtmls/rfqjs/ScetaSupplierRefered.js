var TAG = "ScetaSupplierRefered.js";

var htmlSupport = require('../../htmlEmailsSupportFile.js');
var htmlGenericvalues = htmlSupport.generic_values;
var log = require('../../../../Environment/log4js.js');

exports.getHtml = 
function getHtml (emailData, callback){
	var logger = log.logger_notification;
	
	try{	
	
	var emailSubject = "Supplier Lead Added.";
	var data = emailData;
	var categoriesList = [];		

	for(var i = 0; i < data.Category.length; i++){
		for(var j = 0; j < data.Category[i].subCategories.length; j++){
			categoriesList.push(data.Category[i].subCategories[j]);
		}
	}

	var emailBody =
		
	'<table align="center" width="800" cellspacing="0" cellpadding="0" border="0" style="font-size:medium;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;background:#ffffff;">'+  
    '<tbody>'+
		'<tr>'+
			'<td width="40%" align="center" style="padding:10px 0px">'+
				'<a target="_blank" href="https://www.msupply.com/terms_and_conditions_contest">'+
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
					'<tr style="margin-right:30px;margin-left:31px;float:left;width:92%;padding-bottom:0;">'+
					    '<td style="color:#545454;font-size:14px">'+
						    '<p style="margin-top:20px;color:#444444;font-size:14px;font-weight:normal;line-height:20px;margin-bottom:10px;">Dear Team,</p>'+
						    '<p style="color:#444;font-size:14px;line-height:30px;margin:0;">The following supplier has been added as a Supplier by <strong>'+data.companyName+'</strong>. Request you to contact the supplier and follow the process to get him empanelled. </p>'+
					    '</td>'+
					'</tr>'+
					'<tr>'+
						'<td style="padding:15px 30px;">'+
							'<table width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;border:1px solid #efefef;">'+
							    '<tbody>'+
								    '<tr style="padding:10px 20px;float:left;width:92%;">'+
									    '<td>'+
						                    '<p style="color:#444;font-size:14px;line-height:30px;margin:0;"><strong>Seller Details</strong></p>'+
						                '</td>'+
								    '</tr>'+
								    '<tr>'+
									    '<td style="padding:0 0 5px 20px;">'+
										    '<table width="50%" cellspacing="0" cellpadding="4" border="1" bordercolor="#aaa9a9" style="border-collapse:collapse;font-size:12px;color:#444;">'+
											   '<tbody>'+
												   '<tr>'+
													  '<td style="padding:6px;">Seller ID</td>'+
													  '<td style="padding:6px;">'+data.SellerID+'</td>'+
												   '</tr>'+
												   '<tr>'+
													  '<td style="padding:6px;">Seller Name</td>'+
													  '<td style="padding:6px;">'+data.SellerName+'</td>'+
												   '</tr>'+
												   '<tr>'+
													  '<td style="padding:6px;">Primary Contact No.</td>'+
													  '<td style="padding:6px;">'+data.PrimaryContactNo+'</td>'+
												   '</tr>'+
												   '<tr>'+
													  '<td style="padding:6px;">Email ID</td>'+
													  '<td style="padding:6px;">'+data.EmailID+'</td>'+
												   '</tr>'+
												   '<tr>'+
													  '<td style="padding:6px;">City</td>'+
													  '<td style="padding:6px;">'+data.City+'</td>'+
												   '</tr>'+
												   '<tr>'+
													  '<td style="padding:6px;">Pincode</td>'+
													  '<td style="padding:6px;">'+data.Pincode+'</td>'+
												   '</tr>'+
												   '<tr>'+
													  '<td style="padding:6px;">State</td>'+
													  '<td style="padding:6px;">'+data.State+'</td>'+
												   '</tr>'+
												   '<tr>'+
													  '<td style="padding:6px;">Category</td>'+
													  '<td style="padding:6px;">'+categoriesList.toString()+'</td>'+
												   '</tr>'+
												   '<tr>'+
													  '<td style="padding:6px;">Referred by:</td>'+
													  '<td style="padding:6px;">'+data.Referredby+'</td>'+
												   '</tr>'+
											   '</tbody>'+
										    '</table>'+
									   '</td>'+
								   '</tr>'+
								   '<tr style="padding:10px 20px;float:left;width:92%;">'+
								       '<td align="left">'+
									       '<p style="color:#444;font-size:14px;line-height:30px;font-weight:bold;">Note: Use the same supplier ID while empanelling the supplier in the system</p>'+
									   '</td>'+
								   '</tr>'+
								'</tbody>'+
							'</table>'+						    
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
						   '<a style="text-align:center;text-decoration:none;color:#637279;font-weight:normal;" href="mailto:'+htmlGenericvalues.customer_support_email+'" target="_top">'+htmlGenericvalues.customer_support_email+'</a>'+
						   '<span style="font-weight:normal;"><img alt="phone_icon" width="13" height="13" src="http://static.msupply.com/emailTemplate/registration_confirmation/phone_icon.png" style="padding-right:4px">'+htmlGenericvalues.support_contactnumber+'</span>'+
						'</p>'+
					'</td>'+
				'</tr>'+ 
			  '</tbody>'+
			'</table>'+
			'</td>'+
		'</tr>'+
		'</tbody>'+
	'</table>';

	return callback(false, emailBody, emailSubject);
	}
	catch(e){
		console.log(TAG + "Exception in HTML ScetaSupplierRefered- getHtml - " + e);
		logger.error(TAG + "Exception in HTML ScetaSupplierRefered- getHtml- :- error :" + e);
		return callback(true, "Exception error");
	}
}