var TAG = "supplierActiveSupportEmail.js";

var htmlEmailssupport = require('../../helpers/htmlEmailssupportFile.js');
var htmlGenericvalues = htmlEmailssupport.generic_values;

//Function for the Reset Password.
exports.supplierActivationEmail = 
function supplierActivationEmail (sellerId, firstName, primaryMobile, primaryEmail, callback){

	var emailBody = 

	'<table align="center" width="800" cellspacing="0" cellpadding="0" border="0" style="font-size:medium;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;background:#ffffff;">'+  
    '<tbody>'+
		'<tr>'+
		    '<td valign="top" align="left">'+
			    '<table width="100%" cellspacing="0" cellpadding="0" border="0">'+
					'<tr>'+
						'<td width="50%" style="padding-bottom:30px;padding-top:20px;">'+
							'<a target="_blank" href="https://www.msupply.com/">'+
								'<img alt="msupply" width="205" src="http://static.msupply.com/emailTemplate/registration_confirmation/registration_logo.png" style="outline:none;">'+
							'</a>'+
						'</td>'+                              
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
					'<tr style="margin-right:30px;margin-left:31px;float:left;width:92%;">'+
					  '<td style="color:#545454;font-size:14px">'+
						  '<p style="margin-top:20px;color:#444444;font-size:18px;font-weight:normal;line-height:20px;margin-bottom:10px;"><b>Dear Category Manager,</b></p>'+
						  '<p style="color:#000;font-size:14px;line-height:30px;margin:0;">We are glad to inform you that we have <b>successfully processed</b> the document of your seller, ' + firstName + '.</p>'+
						  '<p style="color:#000;font-size:14px;line-height:30px;margin:0;">Please find his/her Supplier Panel details as below. Kindly train him on order processing, fullfillment and reconciliation.</p>'+
					  '</td>'+
					'</tr>'+
					'<tr>'+
						'<td style="padding:15px 30px 0;">'+
							'<table width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;border:1px solid #efefef;padding-bottom:20px;">'+
							  '<tbody>'+
								'<tr width="722">'+
									'<td width="722" style="padding: 20px 20px 0;border-bottom:1px solid #eaeaea;">'+
										'<h2 align="left" style="color:#1ca8a5;font-size:12px;">Supplier Details</h2>'+
										'<table id="table1"; cellspacing="5px" cellpadding="5%"; align="left" style="color:#637078;font-size:12px;">'+
											'<tr align="left">'+
												'<td  align="left" style="padding:0;">Seller ID:</td>'+
												'<td class="style1">'+ sellerId +'</td>'+
											'</tr>'+
											'<tr align="left">'+
												'<td  align="left" style="padding:0;">Mobile No.:</td>'+
												'<td class="style1">'+ primaryMobile +'</td>'+
											'</tr>'+
											'<tr align="left">'+
												'<td  align="left" style="padding:0;">Email ID:</td>'+
												'<td class="style1">'+ primaryEmail +'</td>'+
											'</tr>'+
										'</table>'+
									'</td>'+
								'</tr>'+					
							'</table>'+
						'</td>'+
					'</tr>'+								
					'<tr align="center">'+
						'<td width="100%" align="center" style="float:left;margin:20px 20px 0px;padding-bottom:20px;">'+
							 '<span style="color:#666666;font-size:20px;">Call to buy/support <b>'+htmlGenericvalues.support_contactnumber+'</b></span>'+
					 	'</td>'+
				    '</tr>'+
					'<tr align="center">'+
					   '<td style="padding: 0px 35px 10px;" align="center" width="100%">'+
						   '<a href="https://www.msupply.com/" target="_blank">'+
							  '<img width="722" alt="mSupply Benefit" src="http://static.msupply.com/emailTemplate/registration_confirmation/buy_seek_corporation_banner.png" style="text-align:center;">'+
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
				'</tr> '+
			  '</tbody>'+
			'</table>'+
			'</td>'+
		'</tr>'+
	'</tbody>'+
'</table>';
	return callback(emailBody);
};