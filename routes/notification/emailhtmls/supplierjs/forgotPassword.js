var TAG = "ForgotPassword.js";
var hostDetails = require('../../../../Environment/hostDetails');
var log = require('../../../../Environment/log4js.js');
//Function for the Reset Password.
exports.getHtml = function getHtml (emailBodyParams, callback){
try{
	var urlLink = hostDetails.WEB_HOST.host +'/supplier/forgotPassword/'+emailBodyParams.userId+'/'+emailBodyParams.token;
	var emailSubject = "Reset your password - mSupply.com";
	var emailBody =
	'<table align="center" width="800" cellspacing="0" cellpadding="0" border="0" style="font-size:medium;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;background:#ffffff;">'+  
    '<tbody>'+
	'	<tr>'+
    '        <td width="100%" colspan="3" style="padding:10px 0px;text-align:center">'+
    '            <a target="_blank" href="https://www.msupply.com/">'+
	'				<img style="width:230px;" src="http://static.msupply.com/emailTemplate/EmailTemplateLogo.png" alt="msupply.com">'+
	'			</a>'+
    '        </td>'+
    '    </tr>'+
	'	<tr>'+
	'		<td>'+
	'		  <table width="800" cellspacing="0" cellpadding="0" border="0" align="left" style="background:#f9f9f9;border-top:1px solid #dfdfdf;border-bottom:1px solid #dfdfdf;padding-top: 20px;">'+
	'			    <tbody>'+
	'					<tr bgcolor="#bd4931" width="730" style="color:#fff;font-size:18px;height:40px;float:left;margin-right:30px;margin-bottom:0px;width:87%;padding:0px 20px;text-align:center;margin-left:31px;">'+
	'						<td align="center" style="width:100%;float:left;">'+
	'							<span style="text-align:center;width:100%;float:left;margin-top:9px;">Please keep this email for your records</span>'+
	'						</td>'+
	'					</tr>'+
	'					<tr style="margin-right:30px;margin-left:31px;float:left;width:87%;">'+
	'					    <td style="color:#545454;font-size:14px">'+
	'						    <p style="margin-top:20px;color:#444444;font-size:14px;font-weight:normal;line-height:20px;margin-bottom:0;">Hi '+emailBodyParams.name+',</p>'+
	'						    <p style="margin-top:10px;color:#444444;font-size:14px;font-weight:normal;line-height:20px;margin-bottom:0;">Greetings from mSupply.com!</p>'+
	'						    <p style="margin-top:10px;color:#444444;font-size:14px;font-weight:normal;line-height:20px;margin-bottom:0;">You have initiated forgot password for your account on mSupply.com</p>'+
	'						    <p style="margin-top:10px;color:#444444;font-size:14px;font-weight:normal;line-height:20px;margin-bottom:0;">Please <a target="_blank" href="https://'+urlLink+'" style="font-weight:bold;color:#444444;text-decoration:none;">Click Here </a>to change your password<br />or<br />Paste the URL in your address bar and change your password: <a target="_blank" href="https://'+urlLink+'" style="color:#15c;">'+urlLink+'</a></p>'+								
	'						    <p style="margin-top:10px;color:#444444;font-size:13px;font-weight:normal;line-height:20px;margin-bottom:0;"><em>If you did not make this request and believe your account has been compromised, please contact our customer support team.</em></p><br />'+
	'					    </td>'+
	'					</tr>'+
	'					<tr align="center">'+
	'						<td width="100%" align="center" style="float:left;margin-top: 10px;">'+
	'							<p style="color:#666666;font-size:15px;">'+
	'							   <span style="font-weight: normal;">Contact us for any further assistance</span>'+
	'							</p>'+
	'						</td>'+
	'					</tr>'+
	'					<tr align="center">'+
	'						<td align="center" width="100%" style="float:left;margin:0;">'+
	'							<p style="color:#666666;font-size:15px;margin-bottom: 10px;margin-top: 0;">'+
	'							   <span style="font-weight:normal;letter-spacing:1px;"><strong style="color:#1fa9a6;">18004199555</strong> or <strong style="color:#1fa9a6;">suppliersupport@msupply.com</strong></span>'+
	'							</p>'+
	'						</td>'+
	'					</tr>'+	
	'					<tr align="center">'+
	'					   <td style="padding:0;" align="center" width="100%">'+
	'						   <a href="https://www.msupply.com/" target="_blank">'+
	'							  <img width="722" alt="mSupply Benefit" src="http://static.msupply.com/emailTemplate/builder_footer.png" style="text-align:center;">'+
	'						   </a>'+
	'					   </td>'+ 
	'					</tr>'+
    '                    <tr>'+							
	'						<td width="95%" align="center" style="float:left;margin:0px 20px;padding-top:10px;padding-bottom: 20px;">'+
	'							<p style="color:#444;font-size:14px;margin-bottom:0;">mSupply.com DIRECTLY connects you with suppliers to get product, price & credit.</p>'+
	'							<p style="color:#444;font-size:14px;margin:7px 0 0;">It does NOT Intermediate/ Discount/ Influence Price, Product or Credit/ Payment Terms.</p>'+
	'						</td>'+
	'					</tr>'+						
	'			    </tbody>'+
	'			</table>'+	
	'		</td>'+
	'	</tr>'+
	'	<tr>'+
	'	  <td>'+
	'		<table width="100%" cellspacing="0" cellpadding="0" border="0" style="padding-top: 15px;">'+
	'		  <tbody>'+
	'			<tr>'+
	'			  <td valign="top" align="center">'+
	'				 <table height="41" cellspacing="0" cellpadding="0" border="0">'+
	'					<tbody>'+
	'						<tr>'+
	'							<td><a href="https://www.facebook.com/mSupplydotcom?fref=ts" style="text-decoration:none" target="_blank"><img alt="facebook" width="32" height="30" src="http://static.msupply.com/emailTemplate/registration_confirmation/facebook.png" style="padding-right:3px"></a></td>'+
	'							<td><a href="https://twitter.com/mSupplydotcom/" style="text-decoration:none" target="_blank"><img alt="twitter" width="32" height="30" src="http://static.msupply.com/emailTemplate/registration_confirmation/twitter.png" style="padding-right:3px"></a></td>'+
	'							<td><a href="https://plus.google.com/+mSupplydotcom/posts" style="text-decoration:none" target="_blank"><img alt="googleplus" width="32" height="30" src="http://static.msupply.com/emailTemplate/registration_confirmation/google+.png" style="padding-right:3px"></a></td>'+
	'							<td><a href="https://www.linkedin.com/company/msupply-com" style="text-decoration:none" target="_blank"><img alt="linkedin" width="32" height="30" src="http://static.msupply.com/emailTemplate/registration_confirmation/in.png" style="padding-right:3px"></a></td>'+
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
	'					   <a style="text-align:center;text-decoration:none;color:#637279;font-weight:normal;" href="mailto:customersupport@msupply.com" target="_top">suppliersupport@msupply.com</a>'+
	'					   <span style="font-weight:normal;"><img alt="phone_icon" width="13" height="13" src="http://static.msupply.com/emailTemplate/registration_confirmation/phone_icon.png" style="padding-right:4px">1800 419 9555</span>'+
	'					</p>'+
	'				</td>'+
	'			</tr>'+ 
	'		  </tbody>'+
	'		</table>'+
	'		</td>'+
	'	</tr>'+
	'</tbody>'+
	'</table>';
		return callback(false, emailBody, emailSubject);
	}
	catch(e){
		logger.error(TAG + "Exception in HTML Sending Forgot Verify Email to seller- getHtml- :- error :" + e);
		return callback(true, "Exception error");
	}
};
