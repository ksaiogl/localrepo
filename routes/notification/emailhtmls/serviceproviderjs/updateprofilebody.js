

/**
 * New node file
 */

var TAG = "updateprofilebody.js";

//Function to get the update profile body.
exports.updateprofilebody = 
function updateprofilebody (firstName, lastName, mobile, email, callback){
		
		var emailBody = '<table align="center" width="800" cellpadding="0" cellspacing="0" style="font-size:medium;font-family:Helvetica Neue,Helvetica,Arial,sans-serif; background:#ffffff;">'+
	    '<tbody>'+
        '<tr width="800">'+
         '  <td>'+
          '     <table width="100%" cellspacing="0" cellpadding="0" align="center" style="padding: 10px 0px 5px;">'+
           '        <tr>'+
			'		    <td width="400" align="left">'+
             '              <a target="__blank" href="http://www.msupply.com/">'+
              '                <img alt="msupply" width="205" src="http://www.msupply.com/media/wysiwyg/registration_confirmation/registration_logo.png">'+
               '            </a>'+
                '       </td>'+
                 '  </tr>'+
               '</table>'+
           '</td>'+
       '</tr>'+
		'<tr>'+
		 '   <td>'+
			'    <table width="100%" cellspacing="0" cellpadding="0" align="left" style="background:#f9f9f9;border-top:1px solid #dfdfdf;border-bottom:1px solid #dfdfdf;padding-top: 20px;">'+
			'	       <tr bgcolor="#bd4931" width="730" style="color:#fff;font-size:24px;height:45px;float:left;margin-right:30px;margin-bottom:0px;width:87%;padding:0px 20px;text-align:center;margin-left:31px;">'+
			'				<td align="center">'+
			'					<span style="text-align:center;width:100%;float:left;margin-top:8px;margin-left:152px;">Because Quality Matters</span>'+
			'				</td>'+
			'		   </tr>'+
			'		   <tr width="730">'+
			'		       <td width="730" style="padding:0px 30px;">'+
			'		           <h3 style="margin-top:25px;color:#444444;font-weight:400;font-size:18px;">Dear ' + firstName + ',</h3>'+
			'				   <p style="margin:10px 0;color:#444444;font-size:12px;line-height:20px;">You have successfully updated your account details.</p>'+
			'			   </td>'+
			'		   </tr>'+
			'		   <tr>'+
			'		        <td style="padding:20px 30px 0;">'+
			'				    <table width="730" align="left" style="background:#ffffff;border:1px solid #efefef;">'+
			'					    <tr width="722">'+
			'						    <td width="722" style="padding: 20px 20px 0;">'+
			'							    <h2 align="left" style="color:#1ca8a5;font-size:12px;">New Account Details</h2>'+
			'								<table id="table1"; cellspacing="5px" cellpadding="5%"; align="left" style="color:#637078;font-size:12px;">'+
			'									<tr align="left">'+
			'										<td  align="left" style="padding:0;">First Name: ' + firstName + '</td>'+
			'										<td class="style1"><input type="text" name="usernm" style="border:0;"/></td>'+
			'									</tr>'+
			'									<tr align="left">'+
			'										<td  align="left" style="padding:0;">Last Name:  ' + lastName + '</td>'+
			'										<td class="style1"><input type="text" name="passwd" style="border:0;"/></td>'+
			'									</tr>'+
			'									<tr align="left">'+
			'										<td  align="left" style="padding:0;">Mobile No:  ' + mobile + '</td>'+
			'										<td class="style1"><input type="text" name="passwd" style="border:0;"/></td>'+
			'									</tr>'+
			'									<tr align="left">'+
			'										<td  align="left" style="padding:0;">Email ID:   ' + email + '</td>'+
			'										<td class="style1"><input type="text" name="passwd" style="border:0;"/></td>'+
			'									</tr>'+
			'								</table>'+
			'							</td>'+
			'						</tr>'+
			'						<tr align="center" style="border-top:1px solid #e2e2e2;float:left;margin:0 15px;width:96%;">'+
			'						     <td align="center" style="padding: 30px 10px;">'+
			'						         <span style="color:#444;font-size:14px;font-weight:normal;">For any further assistance you can reach us at <a href="mailto:support@msupply.com" style="color:#49bab6;text-decoration:none;font-weight:bold;">support@msupply.com</a></span><span style="color:#444;font-size:14px;font-weight:normal;"> or <b>+91-7899901156</b></span>'+
			'							 </td>'+
			'						</tr>'+
			'					</table>'+
			'				</td>'+
			'		   </tr>'+
			'	       <tr align="center">'+
			'				<td align="center" width="100%" style="float: left; margin: 10px 0 5px;">'+
			'					<p style="color:#666666;font-size:21px; padding:10px 0px;">'+
			'					</p>'+
			'				</td>'+
			'		   </tr>'+
			'	</table>'+
			'</td>'+
		'</tr> '+
       '<tr width="800">'+
        '   <td>'+
         '      <table width="100%" cellspacing="0" cellpadding="0" align="center" style="padding:17px 0;">'+
          '         <tr>'+
           '            <td width="400" align="center">'+
            '               <a href="https://www.facebook.com/mSupplydotcom?fref=ts" style="text-decoration:none" target="_blank"><img alt="facebook" width="32" height="30" src="http://www.msupply.com/media/wysiwyg/registration_confirmation/facebook.png" style="margin-right:3px"> </a>'+
			'				<a href="https://twitter.com/mSupplydotcom/" style="text-decoration:none" target="_blank"><img alt="twitter" width="32" height="30" src="http://www.msupply.com/media/wysiwyg/registration_confirmation/twitter.png" style="margin-right:2px"> </a>'+
			'				<a href="https://plus.google.com/+mSupplydotcom/posts" style="text-decoration:none" target="_blank"><img alt="googleplus" width="32" height="30" src="http://www.msupply.com/media/wysiwyg/registration_confirmation/google+.png" style="margin-right:3px"> </a>'+
             '              <a href="https://www.linkedin.com/company/msupply-com" style="text-decoration:none" target="_blank"><img alt="linkedin" width="32" height="30" src="http://www.msupply.com/media/wysiwyg/registration_confirmation/in.png" style="margin-right:3px"> </a>'+
				'			<!--<a href="#" style="text-decoration:none" target="_blank"><img alt="googleplus" width="32" height="30" src="http://www.msupply.com/media/wysiwyg/registration_confirmation/pinterest.png"> </a>-->'+
                 '      </td>'+
                  ' </tr>'+
					'<tr>'+
					 '   <td width="730" align="center">'+
						'    <img alt="address_icon" width="10" height="13" src="http://www.msupply.com/media/wysiwyg/registration_confirmation/address_icon.png" style="margin-right:5px">'+
						'	<span style="color:#637279;font-size:10px;text-align:center;">#117, 27th Main, HSR Layout, Sector-2, Next to NIFT, Bangalore-560102, Karnataka, India</span>'+
						'</td>'+
					'</tr>'+
					'<tr>'+
					'	<td style="padding:4px 0 0;text-align:center;">'+
					'		<p style="margin:0;float:left;width:100%;color:#637279;font-size:10px;">'+
                     '         <img alt="mail_icon" width="13" height="13" src="http://www.msupply.com/media/wysiwyg/registration_confirmation/mail_icon.png" style="margin-right:3px">'+							
						'	   <a style="text-align:center;text-decoration:none;color:#637279;font-weight:normal;" href="mailto:support@msupply.com" target="_top">support@msupply.com</a>'+
						'	   <span style="font-weight:normal;"><img alt="phone_icon" width="13" height="13" src="http://www.msupply.com/media/wysiwyg/registration_confirmation/phone_icon.png" style="margin-right:4px">+91 7899901156</span>'+
						'	</p>'+
						'</td>'+
					'</tr> '+
               '</table>'+
           '</td>'+
       '</tr>'+
   '</tbody>'+
'</table>';



		
		return callback(emailBody);
};
