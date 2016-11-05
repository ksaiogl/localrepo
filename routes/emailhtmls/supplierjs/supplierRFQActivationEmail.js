//RFQ Notification
var TAG = "supplierRFQActivationEmail.js";

var htmlEmailssupport = require('../../helpers/htmlEmailssupportFile.js');
var htmlGenericvalues = htmlEmailssupport.generic_values;

//Function for the Reset Password.
exports.supplierRFQActivationEmail = 
function supplierRFQActivationEmail (firstName, primaryMobile, defaultPassword, callback){
	
	var emailBody = 

		'<table align="center" width="800" cellspacing="0" cellpadding="0" border="0" style="font-size:medium;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;background:#ffffff;">'+  
	    '<tbody>'+
			'<tr>'+
				'<td width="40%" align="center" style="padding:10px 0px">'+
					'<a target="_blank" href="https://www.msupply.com/">'+
						'<img style="width:230px;" src="http://static.msupply.com/emailTemplate/email-template/EmailTemplateLogo.png" alt="msupply">'+
					'</a>'+
				'</td>'+
			'</tr>'+
			'<tr>'+
				'<td>'+
				  '<table width="800" cellspacing="0" cellpadding="0" border="0" align="left" style="background:#f9f9f9;border-top:1px solid #dfdfdf;border-bottom:1px solid #dfdfdf;padding-top:20px;padding-bottom:15px;">'+
					    '<tbody>'+
							'<tr bgcolor="#bd4931" width="730" style="color:#fff;font-size:24px;height:45px;float:left;margin-right:30px;margin-left:31px;margin-bottom:0px;width:87%;padding:0px 20px;text-align:center;">'+
								'<td align="center">'+
									'<span style="text-align:center;width:100%;float:left;margin-top:8px;margin-left:152px;">Because Quality Matters</span>'+
								'</td>'+
							'</tr>'+
							'<tr style="margin-right:30px;margin-left:31px;float:left;width:87%;">'+
							    '<td style="color:#545454;font-size:14px">'+
								    '<p style="margin:20px 0 10px;color:#444444;font-size:14px;font-weight:normal;line-height:20px;">Dear Supplier,</p>'+
								    '<p style="margin:10px 0 0px;color:#444444;font-size:14px;font-weight:normal;line-height:20px;">Greetings from mSupply.com, an ecommerce marketplace which acts as a technology service provider and directly connects suppliers with customers online.</p>'+
								    '<p style="margin:10px 0 0px;color:#444444;font-size:14px;font-weight:normal;line-height:20px;">Your registration documents have been verified and you can receive enquiries from customers & submit quotes on mSupply.com. Use your login credentials to start your journey on the mSupply RFQ Platform.</p>'+
							    '</td>'+
							'</tr>'+
							'<tr>'+
								'<td style="padding:15px 30px 0;">'+
									 '<table width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;border:1px solid #efefef;">'+
									  '<tbody>'+
										'<tr width="722">'+
											'<td width="722" style="padding: 20px 20px 0;">'+
												'<h2 align="left" style="color:#1ca8a5;font-size:12px;">Supplier Panel Details</h2>'+
												'<table cellspacing="5px" cellpadding="5%" align="left" style="color:#637078;font-size:12px;" ;="" id="table1">'+
													'<tbody><tr align="left">'+
														'<td align="left" style="padding:0;">Phone Number:</td>'+
														'<td class="style1">'+primaryMobile+'</td>'+
													'</tr>'+
													'<tr align="left">'+
														'<td align="left" style="padding:0;">Password:</td>'+
														'<td class="style1">'+defaultPassword+'</td>'+
													'</tr>'+
												'</tbody></table>'+
											'</td>'+
										'</tr>'+
										'<tr width="722">'+
											'<td width="722" style="padding:20px;">'+
											    '<p style="color:#444;font-size:12px;line-height:20px;margin:0 0 10px 0;text-transform:uppercase;"><a style="color:#bd4931;text-decoration:none;font-weight:bold;" href="https://www.msupply.com/supplier/index.html#/">Click Here</a>, to login</p>'+
											'</td>'+
										'</tr>'+								
									'</tbody></table>'+
								'</td>'+
							'</tr>'+						
							'<tr>'+
								'<td style="padding:15px 30px 0;">'+
									'<table width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;border:1px solid #efefef;">'+
										'<tbody>'+
											'<tr width="722">'+
												'<td width="100%" style="padding: 20px 20px 0;float:left;width:705px;text-align:center;">'+
													'<p><span style="color:#bd4931;font-size:16px;font-weight:bold;">How to Buy on mSupply.com?</span></p>'+
												'</td>'+
											'</tr>'+
											'<tr>'+
												'<td align="center" style="padding: 20px 0px;">'+
													'<img width="720" alt="mSupply Benefit" src="http://static.msupply.com/emailTemplate/email-template/Howto_supplier_platform.jpg" style="text-align:center;">'+
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
						'<td width="100%" align="center" style="float:left;padding:10px 20px 0px;padding-bottom:0;">'+
							 '<p style="color:#444;font-size:14px;margin-bottom:0;">Contact us for any other assistance</p>'+
							 '<p style="color:#627179;font-size:14px;margin:7px 0 10px;"><strong style="color:#1fa9a6;font-size:14px;">'+htmlGenericvalues.support_contactnumber+'</strong>&nbsp;or&nbsp;<a style="text-decoration:none;color:#1fa9a6;font-size:13px;font-weight:bold;" href="mailto:'+htmlGenericvalues.Supplier_support_email+'">'+htmlGenericvalues.Supplier_support_email+'</a></p>'+
							 '<span style="color:#627179;font-size:19px;"><strong>mSupply</strong> Benefits</span>'+
						'</td>'+
					'</tr>'+	
					'<tr align="center">'+
					   '<td style="padding:10px 0 0;" align="center" width="100%">'+
						   '<a href="https://www.msupply.com/" target="_blank">'+
							  '<img width="576" alt="mSupply Benefit" src="http://static.msupply.com/emailTemplate/email-template/supplier_footer.png" style="text-align:center;">'+
						   '</a>'+
					   '</td>'+ 
					'</tr>'+
					'<tr bgcolor="#637179" style="color:#fff;font-size:16px;float:left;padding:0px 20px;text-align:center;width:65.5%;margin:0 118px 15px 120px;height:50px;" width="568">'+
						'<td align="center">'+
							'<span style="text-align:center;width:100%;float:left;margin:15px 0 0 105px;"><b>mSupply</b> is your <b>Online Store!</b></span>'+
						'</td>'+
					'</tr>'+
					'<tr>'+							
						'<td width="95%" align="center" style="float:left;margin:0 20px 0;padding-bottom:20px;">'+
							'<p style="color:#444;font-size:14px;margin-bottom:0;">mSupply.com DIRECTLY connects you with suppliers to get product, price & credit.</p>'+
							'<p style="color:#444;font-size:14px;margin:7px 0 0;">It does NOT Intermediate/ Discount/ Influence Price, Product or Credit/ Payment Terms.</p>'+
						'</td>'+
					'</tr>'+
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
							   '<a style="text-align:center;text-decoration:none;color:#637279;font-weight:normal;" href="mailto:'+htmlGenericvalues.Supplier_support_email+'" target="_top">'+htmlGenericvalues.Supplier_support_email+'</a>'+
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
	
	return callback(emailBody);
};
