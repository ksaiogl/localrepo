var TAG = "registrationSupportEmail.js";

var timezoneConversions = require('../../helpers/timezoneConversions.js');
var htmlEmailssupport = require('../../helpers/htmlEmailssupportFile.js');
var htmlGenericvalues = htmlEmailssupport.generic_values;

//Function for the Reset Password.
exports.registrationSupportEmail = 
function registrationSupportEmail (req, callback){
		
	var companyInfo = req.body.companyInfo;
    var contactInfo = req.body.contactInfo;
    var bankInfo = req.body.bankInfo;
    var taxInfo = req.body.taxInfo;
    var agreementInfo = req.body.agreementInfo;

	var emailBody = 
	'<table align="center" width="800" cellpadding="0" cellspacing="0" style="font-size:medium;font-family:Helvetica Neue,Helvetica,Arial,sans-serif; background:#ffffff;">'+
    '<tbody>'+
        '<tr>'+
			'<td width="400" align="left" style="padding-bottom:6px;padding-top:25px;">'+
				'<a target="__blank" href="https://www.msupply.com/">'+
				   '<img alt="msupply" width="205" src="http://static.msupply.com/emailTemplate/registration_confirmation/registration_logo.png">'+
				'</a>'+
			'</td>'+
		'</tr>'+
		
		'<tr>'+
		    '<td>'+
			    '<table width="100%" cellspacing="0" cellpadding="0" align="left" style="background:#f9f9f9;border-top:1px solid #dfdfdf;border-bottom:1px solid #dfdfdf;padding-top: 20px;">'+
				       '<tr bgcolor="#bd4931" width="730" style="color:#fff;font-size:24px;height:45px;float:left;margin-right:30px;margin-bottom:0px;width:87%;padding:0px 20px;text-align:center;margin-left:31px;">'+
							'<td align="center">'+
								'<span style="text-align:center;width:100%;float:left;margin-top:8px;margin-left:152px;">Because Quality Matters</span>'+
							'</td>'+
					   '</tr>'+
					   '<tr width="730">'+
					       '<td width="100%" style="padding:0px 30px;">'+
					           '<h2 style="margin-top:20px;color:#444444;font-size:14px;font-weight:normal;line-height:20px;margin-bottom:6px;">Dear Team,</h2>'+
							   '<p style="margin:0 0 20px;color:#444444;font-size:14px;line-height:25px;border-bottom:1px solid #eaeaea;padding-bottom: 30px;">'+
							   '<b>New Registration Information Received:</b>'+
							   	'<br> Company Name: ' + companyInfo.companyName +
							    '<br> Company display Name: ' + companyInfo.displayName +
							    '<br> Address line 1: ' + companyInfo.address.officeAddressL1 +
							    '<br> Address line 2: ' + companyInfo.address.officeAddressL2 +
							    '<br> PIN: ' + companyInfo.address.OfficePIN +
							    '<br> Pickup address line 1: ' + companyInfo.address.pickupAddressL1 +
							    '<br> Pickup address line 2: ' + companyInfo.address.pickupAddressL2 +
							    '<br> PIN: ' + companyInfo.address.pickupPIN +
							    '<br> Contact Person First Name: ' + contactInfo.primaryFirstName +
							    '<br> Contact Person Last Name: '+ contactInfo.primaryLastName +
							    '<br> Email Id:' + contactInfo.primaryEmail +
							    '<br> Mobile Number:' + contactInfo.primaryMobile +
							    '<br> Interest (List of product names):' + contactInfo.interest +
							    '<br> VAT_TIN number:' + taxInfo.VAT_TIN +
							    '<br> STNumber: '+ taxInfo.STNumber +
							    '<br> PAN number: '+ taxInfo.PAN +
							    '<br> Bank account number:' + bankInfo.accountNumber +
							    '<br> IFSC code:' + bankInfo.IFSC +
							    '<br> BankName: ' + bankInfo.bankName +
							    '<br> Branch: ' + bankInfo.branch +
							    '<br> AccountHolderName: ' + bankInfo.accountHolderName +
							    '<br> agree to terms and conditions: ' + agreementInfo.termAcceptance +
							    '<br> time stamp: ' + timezoneConversions.ConvertToIST(agreementInfo.timeStamp)+
							    '</br>'+
							   '<br/> </p>'+
						   '</td>'+
					   '</tr>'+
				       '<tr align="center">'+
							'<td align="center" width="100%" style="float: left; margin: 20px 0px;">'+
							     '<p style="color:#627179;font-size:13px;margin-bottom:0;">Contact us for any help or support</p>'+
								 '<p style="color:#627179;font-size:13px;margin:7px 0 22px;"><strong style="color:#1fa9a6;font-size:13px;">'+htmlGenericvalues.support_contactnumber+'</strong>&nbsp;or&nbsp;<a href="mailto:'+htmlGenericvalues.Supplier_support_email+'" style="text-decoration:none;color:#1fa9a6;font-size:13px;font-weight:bold;">'+htmlGenericvalues.Supplier_support_email+'</a></p>'+
								 '<span style="color:#627179;font-size:19px;"><strong>mSupply</strong>Benefits</span>'+
							'</td>'+
					   '</tr>'+
					   '<tr align="center">'+
						   '<td style="padding: 0px 35px 10px;" align="center" width="100%">'+
							   '<a href="https://www.msupply.com/" target="_blank">'+
								  '<img width="511" alt="mSupply Benefit" src="http://static.msupply.com/emailTemplate/order_confirmation/buy_seek_corporation_banner.png" style="text-align:center;">'+
							   '</a>'+
						   '</td>'+ 
					   '</tr>'+
					   '<tr align="center">'+
						   '<td style="padding: 0px 35px 10px;" align="center" width="100%">'+
							   '<a href="https://www.msupply.com/" target="_blank">'+
								  '<img width="511" alt="Online Store" src="http://static.msupply.com/emailTemplate/order_confirmation/online_store_banner.png" style="text-align:center;">'+
							   '</a>'+
						   '</td>'+ 
					   '</tr>'+
				'</table>'+
			'</td>'+
		'</tr>'+
           
        '<tr width="800">'+
            '<td>'+
                '<table width="100%" cellspacing="0" cellpadding="0" align="center" style="padding:17px 0;">'+
                    '<tr>'+
                        '<td width="400" align="center">'+
                            '<a href="https://www.facebook.com/mSupplydotcom?fref=ts" style="text-decoration:none" target="_blank"><img alt="facebook" width="32" height="30" src="http://static.msupply.com/emailTemplate/registration_confirmation/facebook.png" style="margin-right:3px"> </a>'+
							'<a href="https://twitter.com/mSupplydotcom/" style="text-decoration:none" target="_blank"><img alt="twitter" width="32" height="30" src="http://static.msupply.com/emailTemplate/registration_confirmation/twitter.png" style="margin-right:2px"> </a>'+
							'<a href="https://plus.google.com/+mSupplydotcom/posts" style="text-decoration:none" target="_blank"><img alt="googleplus" width="32" height="30" src="http://static.msupply.com/emailTemplate/registration_confirmation/google+.png" style="margin-right:3px"> </a>'+
                            '<a href="https://www.linkedin.com/company/msupply-com" style="text-decoration:none" target="_blank"><img alt="linkedin" width="32" height="30" src="http://static.msupply.com/emailTemplate/registration_confirmation/in.png" style="margin-right:3px"> </a>'+
                        '</td>'+
                    '</tr>'+
					'<tr>'+
					    '<td width="730" align="center">'+
						    '<img alt="address_icon" width="10" height="13" src="http://static.msupply.com/emailTemplate/registration_confirmation/address_icon.png" style="margin-right:5px">'+
							'<span style="color:#637279;font-size:10px;text-align:center;">'+htmlGenericvalues.office_address+'</span>'+
						'</td>'+
					'</tr>'+
					'<tr>'+
						'<td style="padding:4px 0 0;text-align:center;">'+
							'<p style="margin:0;float:left;width:100%;color:#637279;font-size:10px;">'+
                               '<img alt="mail_icon" width="13" height="13" src="http://static.msupply.com/emailTemplate/registration_confirmation/mail_icon.png" style="margin-right:3px">'+							
							   '<a style="text-align:center;text-decoration:none;color:#637279;font-weight:normal;" href="mailto:'+htmlGenericvalues.Supplier_support_email+'" target="_top">'+htmlGenericvalues.Supplier_support_email+'</a>'+
							   '<span style="font-weight:normal;"><img alt="phone_icon" width="13" height="13" src="http://static.msupply.com/emailTemplate/registration_confirmation/phone_icon.png" style="margin-right:4px">'+htmlGenericvalues.support_contactnumber+'</span>'+
							'</p>'+
						'</td>'+
					'</tr>'+ 
                '</table>'+
            '</td>'+
        '</tr>'+
    '</tbody>'+
'</table>';
	
		return callback(emailBody);
};
