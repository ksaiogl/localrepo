var TAG = "sellerCRM.js";
var log = require('../../../../Environment/log4js.js');

exports.getHtml = function getHtml (emailData, callback){

	//Variable for Logging the messages to the file.
	var logger = log.logger_seller;

	logger.info(TAG + " Entering get HTML Body for seller rejection mail - CRM.");

	try{
		
		var emailSubject = "Unable to validate your credentials";
		var emailBody = '<table align="center" width="800" cellspacing="0" cellpadding="0" border="0" style="font-size:medium;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;background:#ffffff;">'+
		 '   <tbody>'+
			'	<tr>'+
			'		<td width="40%" align="center" style="padding:10px 0px">'+
			'			<a target="_blank" href="https://www.msupply.com/">'+
			'				<img style="width:230px;" src="http://static.msupply.com/emailTemplate/EmailTemplateLogo.png" alt="msupply">'+
			'			</a>'+
			'		</td>'+
			'	</tr>'+
			'	<tr>'+
			'		<td>'+
			'		  <table width="800" cellspacing="0" cellpadding="0" border="0" align="left" style="background:#f9f9f9;border-top:1px solid #dfdfdf;border-bottom:1px solid #dfdfdf;padding-top:20px;padding-bottom:15px;">'+
			'			    <tbody>'+
			'					<tr bgcolor="#bd4931" width="730" style="color:#fff;font-size:24px;height:45px;float:left;margin-right:30px;margin-left:31px;margin-bottom:0px;width:87%;padding:0px 20px;text-align:center;">'+
			'						<td align="center">'+
			'							<span style="text-align:center;width:100%;float:left;margin-top:8px;margin-left:152px;">Because Quality Matters</span>'+
			'						</td>'+
			'					</tr>'+
			'					<tr style="margin-right:30px;margin-left:31px;float:left;width:87%;">'+
			'					    <td style="color:#545454;font-size:14px">'+
			'						    <p style="margin:20px 0 10px;color:#444444;font-size:14px;font-weight:normal;line-height:20px;">Dear Supplier,</p>'+
			'						    <p style="margin:10px 0 0px;color:#444444;font-size:14px;font-weight:normal;line-height:20px;">Greetings from mSupply.com!</p>'+
			'						    <p style="margin:10px 0 0px;color:#444444;font-size:14px;font-weight:normal;line-height:20px;">Sorry, we were not able to validate your credentials. It seems that the TIN or VAT number provided by you were inaccurate.</p>'+
			'						    <p style="margin:10px 0 0px;color:#444444;font-size:14px;font-weight:normal;line-height:20px;">Please share the valid company details to get started.</p><br/>'+
			'					    </td>'+
			'					</tr>'+         				
			'			    </tbody>'+
			'			</table>'+
			'		</td>'+
			'	</tr>'+
			'	<tr>'+
			'	  <td>'+
			'		<table width="100%" cellspacing="0" cellpadding="0" border="0" style="padding-top: 15px;">'+
			'		  <tbody>'+
			'		    <tr>'+
			'				<td width="100%" align="center" style="float:left;padding:10px 20px 0px;padding-bottom:0;">'+
			'					 <p style="color:#444;font-size:14px;margin-bottom:0;">Contact us for any other assistance</p>'+
			'					 <p style="color:#627179;font-size:14px;margin:7px 0 10px;"><strong style="color:#1fa9a6;font-size:14px;">1800 419 9555</strong>&nbsp;or&nbsp;<a style="text-decoration:none;color:#1fa9a6;font-size:13px;font-weight:bold;" href="mailto:suppliersupport@msupply.com">suppliersupport@msupply.com</a></p>'+
			'					 <span style="color:#627179;font-size:19px;"><strong>mSupply</strong> Benefits</span>'+
			'				</td>'+
			'			</tr>'+
			'			<tr align="center">'+
			'			   <td style="padding:10px 0 0;" align="center" width="100%">'+
			'				   <a href="https://www.msupply.com/" target="_blank">'+
			'					  <img width="576" alt="mSupply Benefit" src="http://static.msupply.com/emailTemplate/supplier_footer.png" style="text-align:center;">'+
			'				   </a>'+
			'			   </td> '+
			'			</tr>'+
			'			<tr bgcolor="#637179" style="color:#fff;font-size:16px;float:left;padding:0px 20px;text-align:center;width:65.5%;margin:0 118px 15px 120px;height:50px;" width="568">'+
			'				<td align="center">'+
			'					<span style="text-align:center;width:100%;float:left;margin:15px 0 0 105px;"><b>mSupply</b> is your <b>Online Store!</b></span>'+
			'				</td>'+
			'			</tr>'+
			'			<tr>'+
			'			  <td valign="top" align="center">'+
			'				 <table height="41" cellspacing="0" cellpadding="0" border="0">'+
			'					<tbody>'+
			'						<tr>'+
			'							<td><a href="https://www.facebook.com/mSupplydotcom?fref=ts" style="text-decoration:none" target="_blank"><img alt="facebook" width="32" height="30" src="http://static.msupply.com/emailTemplate/registration_confirmation/facebook.png" style="padding-right:3px"> </a></td>'+
			'							<td><a href="https://twitter.com/mSupplydotcom/" style="text-decoration:none" target="_blank"><img alt="twitter" width="32" height="30" src="http://static.msupply.com/emailTemplate/registration_confirmation/twitter.png" style="padding-right:3px"> </a></td>'+
			'							<td><a href="https://plus.google.com/+mSupplydotcom/posts" style="text-decoration:none" target="_blank"><img alt="googleplus" width="32" height="30" src="http://static.msupply.com/emailTemplate/registration_confirmation/google+.png" style="padding-right:3px"> </a></td>'+
			'							<td><a href="https://www.linkedin.com/company/msupply-com" style="text-decoration:none" target="_blank"><img alt="linkedin" width="32" height="30" src="http://static.msupply.com/emailTemplate/registration_confirmation/in.png" style="padding-right:3px"> </a></td>'+
			'						</tr>'+
			'					</tbody>'+
			'				</table>'+
			'			  </td>'+
			'			</tr>'+
			'			<tr>'+
			'				<td width="730" align="center">'+
			'					<img alt="address_icon" width="10" height="13" src="http://static.msupply.com/emailTemplate/registration_confirmation/address_icon.png" style="padding-right:5px">'+
			'					<span style="color:#637279;font-size:10px;text-align:center;">#117, 27th Main, HSR Layout, Sector-2, Next to NIFT, Bangalore-102, Karnataka, India</span>'+
			'				</td>'+
			'			</tr>'+
			'			<tr>'+
			'				<td style="padding:4px 0 0;text-align:center;">'+
			'					<p style="margin:0;float:left;width:100%;color:#637279;font-size:10px;">'+
			'					   <img alt="mail_icon" width="13" height="13" src="http://static.msupply.com/emailTemplate/registration_confirmation/mail_icon.png" style="margin-right:3px">'+					
			'					   <a style="text-align:center;text-decoration:none;color:#637279;font-weight:normal;" href="mailto:suppliersupport@msupply.com" target="_top">suppliersupport@msupply.com</a>'+
			'					   <span style="font-weight:normal;"><img alt="phone_icon" width="13" height="13" src="http://static.msupply.com/emailTemplate/registration_confirmation/phone_icon.png" style="padding-right:4px">1800 419 9555</span>'+
			'					</p>'+
			'				</td>'+
			'			</tr>'+
			'		  </tbody>'+
			'		</table>'+
			'		</td>'+
			'	</tr>'+
		'	</tbody>'+
		'</table>';	
		return callback(false, emailBody, emailSubject);
	}
	catch(e){
		logger.error(TAG + "Exception in HTML seller rejection mail - getHtml- :- error :" + e);
		return callback(true, "Exception error");
	}
};