var TAG = 'inquiryBuilder.js'
var dbConfig = require('../../../../Environment/mongoDatabase.js');
var log = require('../../../../Environment/log4js.js');
var moment = require('moment');
	
//Function for adding the New Project Details.
exports.getHTMLBodyForBuilder = 
function getHTMLBodyForBuilder (req, inquiryId, customerDetails, callback){
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;
	
	logger.info(TAG + " Entering get HTML Body for the CRM.");
	
	colInquiry = db.collection('InquiryMaster');
	
	colBuilder = db.collection('Builder');
	
	var persona = req.body.customerSession.persona;
	var verification = customerDetails.companyData.verification_status;
	
	colInquiry.findOne({"inquiryEntity.inquiryId": inquiryId}, {"_id":0}, function(err, result){
		
		if(!err && result !== null){		 
		
		var paymentModes;
		
		var inquirySource = result.inquiryEntity.inquirySource;
		
		if(result.inquiryEntity.paymentModes === "onCredit"){
			paymentModes = "Credit " + "(" + result.inquiryEntity.creditDaysNeeded +" days)";
		}else if(result.inquiryEntity.paymentModes === "onDelivery"){
			paymentModes = "Pay Before Delivery";
		}else{
			if(inquirySource !== null){
				paymentModes = "Pay Before Delivery";
			}else{
				paymentModes = "";
			}	
		}
		
		var inquiryValidity = moment(result.inquiryEntity.inquiryDeactivationDate).format('Do MMM YYYY');
		
		var inquiryDate = moment(result.inquiryEntity.inquiryTimestamp).format('Do MMM YYYY');
		var detailsOfRequirement = "";
		
		if(result.inquiryEntity.detailsOfRequirement !== null){
			detailsOfRequirement = result.inquiryEntity.detailsOfRequirement;
		}
		
		var projectName = "";
		
		var deliveryDate = result.inquiryEntity.deliveryByDate;
		
		var shippingAddress = {
				"addressLine1" : result.inquiryEntity.shippingAddress.addressLine1,
				"addressLine2" : result.inquiryEntity.shippingAddress.addressLine2,
				"city" : result.inquiryEntity.shippingAddress.city,
				"state" : result.inquiryEntity.shippingAddress.state,
				"pincode" : result.inquiryEntity.shippingAddress.pincode
		};
		
		var productDetails = result.inquiryEntity.productDetails;
		 
		 var productData = '';
		 
		 if(productDetails !== null && productDetails !== undefined){
			 for(var i=0; i< productDetails.length; i++){
			  productData = productData +
					'<tr>'+
						'<td style="padding:6px;width:40%;">'+ productDetails[i].productName +'</td>'+
						'<td style="padding:6px;width:20%;">'+ productDetails[i].quantity +' '+ productDetails[i].unitOfMeasurement +'</td>'+
					'</tr>';	
			 }
		 }
		 
		var persona = req.body.customerSession.persona;
		var verification = customerDetails.companyData.verification_status;
		var companyId = result.inquiryEntity.associatedCompanyId;
		//checking condition to get proper email format.
		//
		if(persona !== 'Owner' && companyId !== null && verification === 'approved'){
		
		colBuilder.findOne({"builderEntity.profileInfo.accountInfo.companyId": result.inquiryEntity.associatedCompanyId}, 
				{"_id":0, "builderEntity.projects":1}, function(perr, presult){	
		if(!perr && presult !== null){
			var project = presult.builderEntity.projects[result.inquiryEntity.associatedProjectType];
			
			if(result.inquiryEntity.projectSelected){
				for(var j=0; j<project.length; j++){
					
					if(result.inquiryEntity.associatedProjectId === project[j].projectId){
						projectName = project[j].projectName
					}	
				}
			}	
				var  emailBodyTextBuilder = 
					'<table align="center" width="800" cellspacing="0" cellpadding="0" border="0" style="font-size:medium;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;background:#ffffff;">'+  
			    '<tbody>'+
				'	<tr>'+
				'		<td width="40%" align="center" style="padding:10px 0px">'+
				'			<a target="_blank" href="https://www.msupply.com/terms_and_conditions_contest">'+
				'				<img style="width:230px;" src="http://static.msupply.com/emailTemplate/EmailTemplateLogo.png" alt="msupply">'+
				'			</a>'+
				'		</td>'+
				'	</tr>'+
				'	<tr>'+
				'		<td>'+
				'		  <table width="800" cellspacing="0" cellpadding="0" border="0" align="left" style="background:#f9f9f9;border-top:1px solid #dfdfdf;border-bottom:1px solid #dfdfdf;padding-top: 20px;">'+
				'			    <tbody>'+
				'					<tr bgcolor="#bd4931" width="730" style="color:#fff;font-size:24px;height:45px;float:left;margin-right:30px;margin-left:31px;margin-bottom:0px;width:87%;padding:0px 20px;text-align:center;">'+
				'						<td align="center">'+
				'							<span style="text-align:center;width:100%;float:left;margin-top:8px;margin-left:152px;">Because Quality Matters</span>'+
				'						</td>'+
				'					</tr>'+
				'					<tr style="float:left;margin-right:30px;width:89%;margin-left:55px;">'+
				'					    <td style="color:#545454;font-size:14px">'+
				'						    <p style="margin-top:20px;color:#444444;font-size:14px;font-weight:normal;line-height:20px;margin-bottom:0;">Hi <b>'+ req.body.customerSession.first_name +',</b></p>'+
				'						    <p style="margin-top:10px;color:#444444;font-size:14px;font-weight:normal;line-height:20px;margin-bottom:10px;">We have received your enquiry. Our team will get in touch with you to take the enquiry forward.</p>'+
				'					    </td>'+
				'					</tr>'+
				'					<tr style="float:left;margin-right:30px;width:89%;margin-left:55px;">'+
				'					    <td style="color:#545454;font-size:14px">'+
				'						    <p style="margin-top:10px;color:#444444;font-size:14px;font-weight:normal;line-height:20px;margin-bottom:10px;"><b>Enquiry Details</b></p>'+
				'						</td>'+
				'				    </tr>'+
				'					<tr width="700">'+
				'						<td align="left">'+
				'							<table width="86%" cellspacing="0" cellpadding="4" bordercolor="#aaa9a9" border="1" style="font-weight:bold;border-collapse:collapse;font-size:12px;color:#444;float:left;margin-left:56px;">'+
				'							    <tbody>'+
				'								   <tr>'+
				'									  <td style="padding:6px;width:30%;">Categories Sought</td>'+
				'									  <td style="padding:6px;width:60%;">'+ result.inquiryEntity.categories +'</td>'+
				'								   </tr>'+
				'								   <tr>'+
				'									  <td style="padding:6px;width:30%;">Enquiry Validity</td>'+
				'									  <td style="padding:6px;width:60%;">'+ inquiryValidity +'</td>'+
				'								   </tr>'+
				'								   <tr>'+
				'									  <td style="padding:6px;width:30%;">Payment Mode</td>'+
				'									  <td style="padding:6px;width:60%;">'+ paymentModes +'</td>'+
				'								   </tr>'+
				'								   <tr>'+
				'									  <td style="padding:6px;width:30%;">Project Name</td>'+
				'									  <td style="padding:6px;width:60%;">'+ projectName +'</td>'+
				'								   </tr>'+
				'								   <tr>'+
				'									  <td style="padding:6px;width:30%;">Enquiry Details</td>'+
				'									  <td style="padding:6px;width:60%;">'+ detailsOfRequirement +'</td>'+
				'								   </tr>'+
				'							   </tbody>'+
				'							</table>'+
				'						</td>'+
				'					</tr>'+
				'					<tr style="float:left;margin-right:30px;width:89%;margin-left:55px;">'+
				'					    <td style="color:#545454;font-size:14px">'+
				'						    <p style="margin-top:20px;color:#444444;font-size:14px;font-weight:normal;line-height:20px;margin-bottom:10px;">You can also view your enquiries in your <b>My Enquiries</b> Section.</p>'+
				'					    </td>'+
				'					</tr>'+
				'					<tr>'+							
				'						<td width="100%" align="center" style="float:left;margin:20px 20px 0px;padding-bottom:5px;">'+
				'							 <p style="color:#444;font-size:14px;margin-bottom:0;">Contact us for any help or support</p>'+
				'							 <p style="color:#627179;font-size:14px;margin:7px 0 0px;"><strong style="color:#1fa9a6;font-size:14px;">1800 419 9555</strong>&nbsp;or&nbsp;<a style="text-decoration:none;color:#1fa9a6;font-size:13px;font-weight:bold;" href="mailto:customersupport@msupply.com">customersupport@msupply.com</a></p>'+
				'						</td>'+
				'					</tr>'+
				'					<tr>'+
				'						<td style="padding: 15px 30px 20px;">'+
				'							<table width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;border:1px solid #efefef;">'+
				'								<tbody>'+
				'									<tr width="722">'+
				'										<td width="100%" style="padding: 20px 20px 0;float:left;width:705px;text-align:center;">'+
				'											<p><span style="color:#bd4931;font-size:14px;font-weight:bold;">How to Buy on mSupply.com?</span></p>'+
				'										</td>'+
				'									</tr>'+
				'									<tr>'+
				'										<td align="center" style="padding: 20px 0px;">'+
				'											<img width="722" alt="mSupply Benefit" src="http://static.msupply.com/emailTemplate/builder_platform_buy.png" style="text-align:center;">'+
				'										</td>'+
				'									</tr>'+
				'								</tbody>'+
				'							</table>'+
				'						</td>'+
				'					</tr>'+						
				'					<tr align="center">'+
				'					   <td style="padding:0;" align="center" width="100%">'+
				'						   <a href="https://www.msupply.com/" target="_blank">'+
				'							  <img width="722" alt="mSupply Benefit" src="http://static.msupply.com/emailTemplate/builder_footer.png" style="text-align:center;">'+
				'						   </a>'+
				'					   </td> '+
				'					</tr>'+
			    '                   <tr>'+							
				'						<td width="95%" align="center" style="float:left;margin:10px 20px 0;padding-bottom:20px;">'+
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
				'					<span style="color:#637279;font-size:10px;text-align:center;">#117, 27th Main, HSR Layout, Sector-2, Next to NIFT, Bangalore-560102, Karnataka, India</span>'+
				'				</td>'+
				'			</tr>'+
				'			<tr>'+
				'				<td style="padding:4px 0 0;text-align:center;">'+
				'					<p style="margin:0;float:left;width:100%;color:#637279;font-size:10px;">'+
				'					   <img alt="mail_icon" width="13" height="13" src="http://static.msupply.com/emailTemplate/registration_confirmation/mail_icon.png" style="margin-right:3px">'+							
				'					   <a style="text-align:center;text-decoration:none;color:#637279;font-weight:normal;" href="mailto:customersupport@msupply.com" target="_top">customersupport@msupply.com</a>'+
				'					   <span style="font-weight:normal;"><img alt="phone_icon" width="13" height="13" src="http://static.msupply.com/emailTemplate/registration_confirmation/phone_icon.png" style="padding-right:4px">1800 419 9555</span>'+
				'					</p>'+
				'				</td>'+
				'			</tr> '+
				'		  </tbody>'+
				'		</table>'+
				'		</td>'+
				'	</tr>'+
				'</tbody>'+
			'</table>';	
					

					return callback(false, emailBodyTextBuilder);
			}else if(!perr && presult === null){
				logger.error(TAG + " " + " There is no data for the builder ID while generating the HTML. Builder Collection")
				return callback(true, "Inputs Doesn't match with our records.");	
			}else{
				logger.error(TAG + " " + " Inquiry Unexpected Server error while generating the HTML.")
				return callback(true, "Unexpected Server error while generating the HTML Inquiry.");
			}
		});
		}else{
			
			var  emailBodyTextBuilder =
				'<table align="center" width="800" cellspacing="0" cellpadding="0" border="0" style="font-size:medium;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;background:#ffffff;">'+  
			    '<tbody>'+
				'	<tr>'+
			     '       <td width="100%" colspan="3" style="padding:10px 0px;text-align:center">'+
			      '          <a target="_blank" href="https://www.msupply.com/">'+
					'			<img style="width:230px;" src="http://static.msupply.com/emailTemplate/EmailTemplateLogo.png" alt="msupply.com">'+
					'		</a>'+
			         '   </td>'+
			        '</tr>'+
					'<tr>'+
					'	<td>'+
					'	  <table width="800" cellspacing="0" cellpadding="0" border="0" align="left" style="background:#f9f9f9;border-top:1px solid #dfdfdf;border-bottom:1px solid #dfdfdf;padding-top: 20px;">'+
					'		    <tbody>'+
					'				<tr bgcolor="#bd4931" width="730" style="color:#fff;font-size:18px;height:40px;float:left;margin-right:30px;margin-bottom:0px;width:87%;padding:0px 20px;text-align:center;margin-left:31px;">'+
					'					<td align="center" style="width:100%;float:left;">'+
					'						<span style="text-align:center;width:100%;float:left;margin-top:9px;">Because Quality Matters</span>'+
					'					</td>'+
					'				</tr>'+
					'				<tr style="float:left;margin-right:30px;width:89%;margin-left:55px;">'+
					'				    <td style="color:#545454;font-size:14px">'+
					'					    <p style="margin-top:20px;color:#444444;font-size:14px;font-weight:normal;line-height:20px;margin-bottom:0;">Dear '+ req.body.customerSession.first_name +',</p>'+
					'					    <p style="margin-top:10px;color:#444444;font-size:14px;font-weight:normal;line-height:20px;margin-bottom:10px;">We have received your enquiry [Enquiry ID: '+ inquiryId +']. Our team will get in touch with you to take the enquiry forward.</p>'+
					'				    </td>'+
					'				</tr>'+
					'				<tr style="float:left;margin-right:30px;width:89%;margin-left:55px;">'+
					'				    <td style="color:#545454;font-size:14px">'+
					'					    <p style="margin-top:10px;color:#444444;font-size:14px;font-weight:normal;line-height:20px;margin-bottom:10px;"><b>Enquiry Details</b></p>'+
					'					</td>'+
					'			    </tr>'+
					'				<tr width="700">'+
					'					<td align="left">'+
					'						<table width="86%" cellspacing="0" cellpadding="4" bordercolor="#aaa9a9" border="1" style="font-weight:bold;border-collapse:collapse;font-size:12px;color:#444;float:left;margin-left:56px;">'+
					'						    <tbody>'+
					'							   <tr>'+
					'								  <td style="padding:6px;width:30%;">Enquiry Date</td>'+
					'								  <td style="padding:6px;width:60%;">'+ inquiryDate +'</td>'+
					'							   </tr>'+
					'							   <tr>'+
					'								  <td style="padding:6px;width:30%;">City - Pincode</td>'+
					'								  <td style="padding:6px;width:60%;">'+ shippingAddress.city +'- '+ shippingAddress.pincode +'</td>'+
					'							   </tr>'+
					'							   <tr>'+
					'								  <td style="padding:6px;width:30%;">Expected Delivery Date</td>'+
					'								  <td style="padding:6px;width:60%;">'+ deliveryDate +'</td>'+
					'							   </tr>'+
					'							   <tr>'+
					'								  <td style="padding:6px;width:30%;">Payment Mode</td>'+
					'								  <td style="padding:6px;width:60%;">'+ paymentModes +'</td>'+
					'							   </tr>'+
					'							   <tr>'+
					'								  <td style="padding:6px;width:30%;">Enquiry Details</td>'+
					'								  <td style="padding:6px;width:60%;">'+ detailsOfRequirement +'</td>'+
					'							   </tr>'+
					'						   </tbody>'+
					'						</table>'+
					'					</td>'+
					'				</tr>'+
					'				<tr style="float:left;margin-right:30px;width:89%;margin-left:55px;">'+
					'				    <td style="color:#545454;font-size:14px">'+
					'					    <p style="margin-top:10px;color:#444444;font-size:14px;font-weight:normal;line-height:20px;margin-bottom:10px;"><b>Product Details</b></p>'+
					'					</td>'+
					'			    </tr>'+
					'				<tr width="700">'+
					'					<td align="left">'+
					'						<table width="86%" cellspacing="0" cellpadding="4" bordercolor="#aaa9a9" border="1" style="font-weight:bold;border-collapse:collapse;font-size:12px;color:#444;float:left;margin-left:56px;">'+
					'						    <tbody>'+
					'							   <tr>'+
					'								  <th style="padding:6px;width:30%;">Product Name</th>'+
					'								  <th style="padding:6px;width:60%;">Quantity</th>'+
					'							   </tr>'+ productData +'</tbody>'+
					'						</table>'+
					'					</td>'+
					'				</tr>'+
					'				<tr style="float:left;margin-right:30px;width:89%;margin-left:55px;">'+
					'				    <td style="color:#545454;font-size:14px">'+
					'					    <p style="margin-top:20px;color:#444444;font-size:14px;font-weight:normal;line-height:20px;margin-bottom:30px;">'+
					'						   You can also view your enquiries in your <b>My Accounts</b> Section.'+
					'						</p>'+
					'				    </td>'+
					'				</tr>'+
					'				<tr align="center">'+
					'					<td width="100%" align="center" style="margin:10px 0 0;">'+
					'						<p style="color:#666666;font-size:15px;">'+
					'						   <span style="font-weight: normal;">Contact us for any further assistance</span>'+
					'						</p>'+
					'					</td>'+
					'				</tr>'+
					'				<tr align="center">'+
					'					<td align="center" width="100%" style="float:left;margin:0;">'+
					'						<p style="color:#666666;font-size:15px;">'+
					'						   <span style="font-weight:normal;letter-spacing:1px;"><strong style="color:#1fa9a6;">18004199555</strong> or <strong style="color:#1fa9a6;">customersupport@msupply.com</strong></span>'+
					'						</p>'+
					'					</td>'+
					'				</tr>'+					
					'				<tr align="center">'+
					'				   <td style="padding:10px 0 0;" align="center" width="100%">'+
					'					   <a href="https://www.msupply.com/" target="_blank">'+
					'						  <img width="722" alt="mSupply Benefit" src="http://static.msupply.com/emailTemplate/builder_enquiry_footer.png" style="text-align:center;">'+
					'					   </a>'+
					'				   </td> '+
					'				</tr>'+
			         '               <tr>	'+						
						'				<td width="95%" align="center" style="float:left;margin:10px 20px 0;padding-bottom:20px;">'+
						'					<p style="color:#444;font-size:14px;margin-bottom:0;">mSupply.com DIRECTLY connects you with suppliers to get product, price & credit.</p>'+
						'					<p style="color:#444;font-size:14px;margin:7px 0 0;">It does NOT Intermediate/ Discount/ Influence Price, Product or Credit/ Payment Terms.</p>'+
						'				</td>'+
						'			</tr>		'+				
						'	    </tbody>'+
						'	</table>	'+
						'</td>'+
					'</tr>'+
					'<tr>'+
					 ' <td>'+
						'<table width="100%" cellspacing="0" cellpadding="0" border="0" style="padding-top: 15px;">'+
						 ' <tbody>'+
							'<tr>'+
							 ' <td valign="top" align="center">'+
								' <table height="41" cellspacing="0" cellpadding="0" border="0">'+
								'	<tbody>'+
								'		<tr>'+
								'			<td><a href="https://www.facebook.com/mSupplydotcom?fref=ts" style="text-decoration:none" target="_blank"><img alt="facebook" width="32" height="30" src="http://static.msupply.com/emailTemplate/registration_confirmation/facebook.png" style="padding-right:3px"> </a></td>'+
								'			<td><a href="https://twitter.com/mSupplydotcom/" style="text-decoration:none" target="_blank"><img alt="twitter" width="32" height="30" src="http://static.msupply.com/emailTemplate/registration_confirmation/twitter.png" style="padding-right:3px"> </a></td>'+
								'			<td><a href="https://plus.google.com/+mSupplydotcom/posts" style="text-decoration:none" target="_blank"><img alt="googleplus" width="32" height="30" src="http://static.msupply.com/emailTemplate/registration_confirmation/google+.png" style="padding-right:3px"> </a></td>'+
								'			<td><a href="https://www.linkedin.com/company/msupply-com" style="text-decoration:none" target="_blank"><img alt="linkedin" width="32" height="30" src="http://static.msupply.com/emailTemplate/registration_confirmation/in.png" style="padding-right:3px"> </a></td>'+
								'		</tr>'+
								'	</tbody>'+
								'</table>'+
							  '</td>'+
							'</tr>'+
							'<tr>'+
							'	<td width="730" align="center">'+
							'		<img alt="address_icon" width="10" height="13" src="http://static.msupply.com/emailTemplate/registration_confirmation/address_icon.png" style="padding-right:5px">'+
							'		<span style="color:#637279;font-size:10px;text-align:center;">#117, 27th Main, HSR Layout, Sector-2, Next to NIFT, Bangalore-560102, Karnataka, India</span>'+
							'	</td>'+
							'</tr>'+
							'<tr>'+
							'	<td style="padding:4px 0 0;text-align:center;">'+
							'		<p style="margin:0;float:left;width:100%;color:#637279;font-size:10px;">'+
							'		   <img alt="mail_icon" width="13" height="13" src="http://static.msupply.com/emailTemplate/registration_confirmation/mail_icon.png" style="margin-right:3px">'+							
							'		   <a style="text-align:center;text-decoration:none;color:#637279;font-weight:normal;" href="mailto:customersupport@msupply.com" target="_top">customersupport@msupply.com</a>'+
							'		   <span style="font-weight:normal;"><img alt="phone_icon" width="13" height="13" src="http://static.msupply.com/emailTemplate/registration_confirmation/phone_icon.png" style="padding-right:4px">1800 419 9555</span>'+
							'		</p>'+
							'	</td>'+
							'</tr> '+
						  '</tbody>'+
						'</table>'+
						'</td>'+
					'</tr>'+
				'</tbody>'+
			'</table>';
			return callback(false, emailBodyTextBuilder);
		  }
		}else if(!err && result === null){
			logger.error(TAG + " " + " There is no data for the builder ID while generating the HTML.")
			return callback(true, "Inputs Doesn't match with our records.");
		}else{
			logger.error(TAG + " " + " Inquiry Unexpected Server error while generating the HTML.")
			return callback(true, "Unexpected Server error while generating the HTML Inquiry.");
		}
	});
};
