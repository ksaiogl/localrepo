var TAG = "sellerRegistration.js";
var hostDetails = require('../../../../Environment/hostDetails');
//var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../../../Environment/log4js.js');

exports.getHtml = function getHtml (req, callback){
try{
	var urlLink = hostDetails.WEB_HOST.host +'/supplier/verifyMail/'+req.Emailbody.emailId+'/'+req.token;
	var emailSubject = "Verify your E-mail - mSupply.com";
	var emailBody = '<table align="center" width="800" cellspacing="0" cellpadding="0" border="0" style="font-size:medium;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;background:#ffffff;">'+  
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
	'		  <table width="800" cellspacing="0" cellpadding="0" border="0" align="left" style="background:#f9f9f9;border-top:1px solid #dfdfdf;border-bottom:1px solid #dfdfdf;padding-top:20px;padding-bottom:25px;">'+
	'			    <tbody>'+
	'					<tr bgcolor="#bd4931" width="730" style="color:#fff;font-size:18px;height:40px;float:left;margin-right:30px;margin-bottom:0px;width:87%;padding:0px 20px;text-align:center;margin-left:31px;">'+
	'						<td align="center" style="width:100%;float:left;">'+
	'							<span style="text-align:center;width:100%;float:left;margin-top:9px;">Because Quality Matters</span>'+
	'						</td>'+
	'					</tr>'+
	'					<tr style="float:left;margin-right:30px;width:89%;margin-left:55px;">'+
	'					    <td style="color:#545454;font-size:14px">'+
	'						    <p style="margin-top:20px;color:#444444;font-size:14px;font-weight:normal;line-height:20px;margin-bottom:0;">Dear Supplier,</p>'+
	'						    <p style="margin-top:10px;color:#444444;font-size:14px;font-weight:normal;line-height:20px;margin-bottom:10px;">Thank you for your interest in becoming a seller on mSupply.com.</p>'+
	'						    <p style="margin-top:10px;color:#444444;font-size:14px;font-weight:normal;line-height:20px;margin-bottom:10px;">Please verify your Email ID to start your journey on mSupply.com</p>'+
	'					    </td>'+
	'					</tr>'+
	'					<tr align="center">'+
	'					   <td width="100%" align="center" style="padding:25px 0px 0px;color:#f00202;">Your Email ID is not verified!'+
	'					   </td>'+ 
	'					</tr>'+
	'					<tr bgcolor="#bd4931" style="width:222px;float:left;margin:20px 290px 0;border-radius:4px;">'+
	'					   <td align="center" style="color:#fff;font-size:15px;height:40px;float:left;width:85%;padding:0 16px 0 23px;text-align:center;">'+
	'						   <a target="_blank" href= "https://'+ urlLink +'"><span style="text-align:center;float:left;margin:11px auto 0 auto;text-decoration:none;color:#fff">'+
	'							Click to Verify Your Email ID</span></a>'+
	'					   </td>'+ 
	'					</tr>'+	
	'					<tr align="center">'+
	'					   <td width="100%" align="center" style="padding:25px 0px 0px;color:#444;">'+
	'						   Not able to Verify with above link <a style="color:#004eff;" target="_blank" href="https://'+ urlLink +'">Click here</a>'+
	'					   </td>'+ 
	'					</tr>'+
	'					<tr style="float:left;margin-right:30px;width:89%;margin-left:55px;">'+
	'					    <td style="color:#545454;font-size:14px">'+
	'						    <p style="margin-top:10px;color:#444444;font-size:14px;font-weight:normal;line-height:20px;margin-bottom:10px;"><b>Your Contact Details:</b></p>'+
	'						</td>'+
	'				    </tr>'+
	'					<tr width="700">'+
	'						<td align="left">'+
	'							<table width="86%" cellspacing="0" cellpadding="4" bordercolor="#aaa9a9" border="1" style="font-weight:normal;border-collapse:collapse;font-size:12px;color:#444;float:left;margin-left:56px;">'+
	'							    <tbody>'+
	'								   <tr>'+
	'									  <td style="padding:6px;width:30%;">Company Name</td>'+
	'									  <td style="padding:6px;width:60%;">'+ req.Emailbody.companyName +'</td>'+
	'								   </tr>'+
	'								   <tr>'+
	'									  <td style="padding:6px;width:30%;">Email ID</td>'+
	'									  <td style="padding:6px;width:60%;">'+ req.Emailbody.emailId +'</td>'+
	'								   </tr>'+
	'								   <tr>'+
	'									  <td style="padding:6px;width:30%;">Mobile</td>'+
	'									  <td style="padding:6px;width:60%;">'+ req.Emailbody.mobile +'</td>'+
	'								   </tr>'+
	'								   <tr>'+
	'									  <td style="padding:6px;width:30%;">User ID</td>'+
	'									  <td style="padding:6px;width:60%;">'+ req.Emailbody.userId +'</td>'+
	'								   </tr>'+
	'								   <tr>'+
	'									  <td style="padding:6px;width:30%;">VAT</td>'+
	'									  <td style="padding:6px;width:60%;">'+ req.Emailbody.vat +'</td>'+
	'								   </tr>'+
	'							   </tbody>'+
	'							</table>'+
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
	'		    <tr>'+							
	'				<td width="100%" align="center" style="float:left;padding:10px 20px 0px;padding-bottom:0;">'+
	'					 <p style="color:#444;font-size:14px;margin-bottom:0;">Contact us for any other assistance</p>'+
	'					 <p style="color:#627179;font-size:14px;margin:7px 0 10px;"><strong style="color:#1fa9a6;font-size:14px;">1800 419 9555</strong>&nbsp;or&nbsp;<a style="text-decoration:none;color:#1fa9a6;font-size:13px;font-weight:bold;" href="mailto:suppliersupport@msupply.com">suppliersupport@msupply.com</a></p>'+
	'					 <span style="color:#627179;font-size:19px;"><strong>mSupply</strong>Benefits</span>'+
	'				</td>'+
	'			</tr>'+	
	'			<tr align="center">'+
	'			   <td style="padding:10px 0 0;" align="center" width="100%">'+
	'				   <a href="https://www.msupply.com/" target="_blank">'+
	'					  <img width="576" alt="mSupply Benefit" src="http://static.msupply.com/emailTemplate/supplier_footer.png" style="text-align:center;">'+
	'				   </a>'+
	'			   </td>'+ 
	'			</tr>'+
	'			<tr bgcolor="#637179" style="color:#fff;font-size:16px;float:left;padding:0px 20px;text-align:center;width:66%;margin:0 118px 15px 116px;height:50px;" width="568">'+
	'				<td align="center">'+
	'					<span style="text-align:center;width:100%;float:left;margin:15px 0 0 105px;"><b>mSupply</b>is your <b>Online Store!</b></span>'+
	'				</td>'+
	'			</tr>'+
	'			<tr>'+							
	'				<td width="95%" align="center" style="float:left;margin:0 20px 0;padding-bottom:20px;">'+
	'					<p style="color:#444;font-size:14px;margin-bottom:0;">mSupply.com DIRECTLY connects you with suppliers to get product, price & credit.</p>'+
	'					<p style="color:#444;font-size:14px;margin:7px 0 0;">It does NOT Intermediate/ Discount/ Influence Price, Product or Credit/ Payment Terms.</p>'+
	'				</td>'+
	'			</tr>'+
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
	'					   <a style="text-align:center;text-decoration:none;color:#637279;font-weight:normal;" href="mailto:suppliersupport@msupply.com" target="_top">suppliersupport@msupply.com</a>'+
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
				
		
		var emailSubject = "Verify your E-mail - mSupply.com";	
		return callback(false, emailBody, emailSubject);
	}
	catch(e){
		console.log(TAG + "Exception in HTML Sending Verify Email to seller- getHtml - " + e);
		logger.error(TAG + "Exception in HTML Sending Verify Email to seller- getHtml- :- error :" + e);
		return callback(true, "Exception error");
	}
};