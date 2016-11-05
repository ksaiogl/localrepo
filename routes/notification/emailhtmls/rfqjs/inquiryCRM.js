var TAG = 'inquiryProject.js'
var dbConfig = require('../../../../Environment/mongoDatabase.js');
var log = require('../../../../Environment/log4js.js');
var moment = require('moment');

//Function for adding the New Project Details.
exports.getHTMLBodyForCRM =
function getHTMLBodyForCRM (req, inquiryId, companyDetails, callback){

	//Variable for Mongo DB Connection.
	var db = dbConfig.mongoDbConn;

	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;

	logger.info(TAG + " Entering get HTML Body for the CRM.");

	colInquiry = db.collection('InquiryMaster');

	colBuilder = db.collection('Builder');

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

		var advanceSelected = "No";
		var advancePaymentAmount = "";

		if(result.inquiryEntity.advancePayment){
			advanceSelected = "Yes";
			if(result.inquiryEntity.advancePaymentAmount !== null){
				advancePaymentAmount = result.inquiryEntity.advancePaymentAmount;
			}
		}

		var packingRequirements = "";

		if(result.inquiryEntity.packingAndFreightRequirements !== null){
			packingRequirements = result.inquiryEntity.packingAndFreightRequirements;
		}

		var suppliersChosen = "";

		if(result.inquiryEntity.quoteFromMSupplySuppliers === false){
			suppliersChosen = "My Suppliers";
		}else if(result.inquiryEntity.quoteFromMSupplySuppliers === true){
			suppliersChosen = "My Suppliers and mSupply Suppliers";
		}else{
			suppliersChosen = "";
		}

		var inquiryValidity = moment(result.inquiryEntity.inquiryDeactivationDate).format('Do MMM YYYY');

		var targetPrice = "";

		if(result.inquiryEntity.targetPriceForQuotation !== null){
			targetPrice = result.inquiryEntity.targetPriceForQuotation;
		}

		var detailsOfRequirement = "";

		if(result.inquiryEntity.detailsOfRequirement !== null){
			detailsOfRequirement = result.inquiryEntity.detailsOfRequirement;
		}

		var shippingAddress = {
				"addressLine1" : result.inquiryEntity.shippingAddress.addressLine1,
				"addressLine2" : result.inquiryEntity.shippingAddress.addressLine2,
				"city" : result.inquiryEntity.shippingAddress.city,
				"state" : result.inquiryEntity.shippingAddress.state,
				"pincode" : result.inquiryEntity.shippingAddress.pincode
		};

		var businessName = companyDetails.companyData.company_name;

		if(businessName === null){
			businessName = "";
		}

		var persona = req.body.customerSession.persona;
		var verification = companyDetails.companyData.verification_status;
		var companyId = result.inquiryEntity.associatedCompanyId;
		
		//checking condition to get proper email format.
		if(persona !== 'Owner' && companyId !== null && verification === 'approved'){
			if(!result.inquiryEntity.shipToProjectAddress){

				var  emailBodyText =
					'<table align="center" width="800" cellspacing="0" cellpadding="0" border="0" style="font-size:medium;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;background:#ffffff;">'+
					'    <tbody>'+
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
					'			<tbody>'+
					'				<tr bgcolor="#bd4931" width="730" style="color:#fff;font-size:24px;height:45px;float:left;margin-right:30px;margin-left:31px;margin-bottom:0px;width:87%;padding:0px 20px;text-align:center;">'+
					'					<td align="center">'+
					'						<span style="text-align:center;width:100%;float:left;margin-top:8px;margin-left:152px;">Because Quality Matters</span>'+
					'					</td>'+
					'				</tr>'+
					'				<tr style="margin-right:30px;margin-left:31px;float:left;width:92%;padding-bottom:0;">'+
					'				    <td style="color:#545454;font-size:14px">'+
					'					    <p style="margin-top:20px;color:#444444;font-size:14px;font-weight:normal;line-height:20px;margin-bottom:10px;">Dear Team,</p>'+
					'					    <p style="color:#444;font-size:14px;line-height:30px;margin:0;">An enquiry was raised by <strong>'+ req.body.customerSession.first_name +'</strong>, the details of which are as below:</p>'+
					'						<p style="color:#444;font-size:14px;line-height:30px;margin:0;">Refer to the attachment for the details of the Inquiry, Supplier and Project Details.</p>'+
					'				    </td>'+
					'				</tr>'+
					'				<tr>'+
					'					<td style="padding:15px 30px;">'+
					'						<table width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;border:1px solid #efefef;">'+
					'						    <tbody>'+
					'							    <tr style="padding:10px 20px;float:left;width:92%;">'+
					'								    <td>'+
					'					                    <p style="color:#444;font-size:14px;line-height:30px;margin:0;"><strong>Inquiry Details</strong></p>'+
					'					                </td>'+
					'							    </tr>'+
					'							    <tr>'+
					'								    <td style="padding:0 0 5px 20px;">'+
					'									    <table width="50%" cellspacing="0" cellpadding="4" border="1" bordercolor="#aaa9a9" style="border-collapse:collapse;font-size:12px;color:#444;">'+
					'										   <tbody>'+
					'											   <tr>'+
					'												  <td style="padding:6px;">Enquiry Validity</td>'+
					'												  <td style="padding:6px;">'+ inquiryValidity +'</td>'+
					'											   </tr>'+
					'											   <tr>'+
					'												  <td style="padding:6px;">Customer Name</td>'+
					'												  <td style="padding:6px;">'+ req.body.customerSession.first_name +'</td>'+
					'											   </tr>'+
					'											   <tr>'+
					'												  <td style="padding:6px;">Customer Mobile</td>'+
					'												  <td style="padding:6px;">'+ req.body.customerSession.mobile_number +'</td>'+
					'											   </tr>'+
					'											   <tr>'+
					'												  <td style="padding:6px;">Customer Email</td>'+
					'												  <td style="padding:6px;">'+ req.body.customerSession.email +'</td>'+
					'											   </tr>'+
					'   										   <tr>'+
					'												  <td style="padding:6px;">Business Name</td>'+
					'												  <td style="padding:6px;">'+ businessName +'</td>'+
					'											   </tr>'+
					'											   <tr>'+
					'												  <td style="padding:6px;">Customers Notes</td>'+
					'												  <td style="padding:6px;">'+ detailsOfRequirement +'</td>'+
					'											   </tr>'+
					'											   <tr>'+
					'												  <td style="padding:6px;">Suppliers Chosen</td>'+
					'												  <td style="padding:6px;">'+ suppliersChosen +'</td>'+
					'											   </tr>'+
					'											   <tr>'+
					'												  <td style="padding:6px;">Delivery Date</td>'+
					'												  <td style="padding:6px;">'+ result.inquiryEntity.deliveryByDate +'</td>'+
					'											   </tr>'+
					'											   <tr>'+
					'												  <td style="padding:6px;">Target price for enquiry Rs</td>'+
					'												  <td style="padding:6px;">'+ targetPrice +'</td>'+
					'											   </tr>'+
					'											   <tr>'+
					'												  <td style="padding:6px;">Categories Sought</td>'+
					'												  <td style="padding:6px;">'+ result.inquiryEntity.categories +'</td>'+
					'											   </tr>'+
					'											   <tr>'+
					'												  <td style="padding:6px;">Payment Mode</td>'+
					'												  <td style="padding:6px;">'+ paymentModes +'</td>'+
					'											   </tr>'+
					'											   <tr>'+
					'												  <td style="padding:6px;">Wants to give Advance</td>'+
					'												  <td style="padding:6px;">'+ advanceSelected +'</td>'+
					'											   </tr>'+'											   <tr>'+
					'												  <td style="padding:6px;">Advance Amount Rs</td>'+
					'												  <td style="padding:6px;">'+ advancePaymentAmount +'</td>'+
					'											   </tr>'+'											   <tr>'+
					'												  <td style="padding:6px;">Packing & Freight requirements</td>'+
					'												  <td style="padding:6px;">'+ packingRequirements +'</td>'+
					'											   </tr>'+
					'											   <tr>'+
					'												  <td style="padding:6px;">Ship To Address</td>'+
					'												  <td style="padding:6px;">'+ shippingAddress.addressLine1 +', <br/>'+ shippingAddress.addressLine2 +', <br/>'+ shippingAddress.city +' – '+ shippingAddress.pincode +'</td>'+
					'											   </tr>'+
					'											   <tr>'+
					'												  <td style="padding:6px;">Expected number of quotations</td>'+
					'												  <td style="padding:6px;">'+ result.inquiryEntity.noOfQuotationsDesiredRange +'</td>'+
					'											   </tr>'+
					'										   </tbody>'+
					'									    </table>'+
					'								   </td>'+
					'							   </tr>'+
					'							   <tr style="padding:10px 20px;float:left;width:92%;">'+
					'							       <td align="left">'+
					'								       <p style="color:#444;font-size:14px;line-height:30px;font-weight:bold;">Kindly do the needful.</p>'+
					'								   </td>'+
					'							   </tr>'+
					'							</tbody>'+
					'						</table>		'+
					'				    </td>'+
					'				</tr>'+
					'			 </tbody>'+
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
						return callback(false, emailBodyText);
			}else{

			colBuilder.findOne({"builderEntity.profileInfo.accountInfo.companyId": result.inquiryEntity.associatedCompanyId},
					{"_id":0, "builderEntity.projects":1}, function(perr, presult){
			if(!perr && presult !== null){

				var project = presult.builderEntity.projects[result.inquiryEntity.associatedProjectType];

				for(var j=0; j<project.length; j++){

					if(result.inquiryEntity.associatedProjectId === project[j].projectId){
						shippingAddress = {
							"addressLine1" : project[j].address.projectAddress.address1,
							"addressLine2" : project[j].address.projectAddress.address2,
							"city" : project[j].address.projectAddress.city,
							"state" : project[j].address.projectAddress.state,
							"pincode" : project[j].address.projectAddress.pincode,
						};
					}
				}

					var  emailBodyText =
					'<table align="center" width="800" cellspacing="0" cellpadding="0" border="0" style="font-size:medium;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;background:#ffffff;">'+
					'    <tbody>'+
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
					'			<tbody>'+
					'				<tr bgcolor="#bd4931" width="730" style="color:#fff;font-size:24px;height:45px;float:left;margin-right:30px;margin-left:31px;margin-bottom:0px;width:87%;padding:0px 20px;text-align:center;">'+
					'					<td align="center">'+
					'						<span style="text-align:center;width:100%;float:left;margin-top:8px;margin-left:152px;">Because Quality Matters</span>'+
					'					</td>'+
					'				</tr>'+
					'				<tr style="margin-right:30px;margin-left:31px;float:left;width:92%;padding-bottom:0;">'+
					'				    <td style="color:#545454;font-size:14px">'+
					'					    <p style="margin-top:20px;color:#444444;font-size:14px;font-weight:normal;line-height:20px;margin-bottom:10px;">Dear Team,</p>'+
					'					    <p style="color:#444;font-size:14px;line-height:30px;margin:0;">An enquiry was raised by <strong>'+ req.body.customerSession.first_name +'</strong>, the details of which are as below:</p>'+
					'						<p style="color:#444;font-size:14px;line-height:30px;margin:0;">Refer to the attachment for the details of the Inquiry, Supplier and Project Details.</p>'+
					'				    </td>'+
					'				</tr>'+
					'				<tr>'+
					'					<td style="padding:15px 30px;">'+
					'						<table width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;border:1px solid #efefef;">'+
					'						    <tbody>'+
					'							    <tr style="padding:10px 20px;float:left;width:92%;">'+
					'								    <td>'+
					'					                    <p style="color:#444;font-size:14px;line-height:30px;margin:0;"><strong>Inquiry Details</strong></p>'+
					'					                </td>'+
					'							    </tr>'+
					'							    <tr>'+
					'								    <td style="padding:0 0 5px 20px;">'+
					'									    <table width="50%" cellspacing="0" cellpadding="4" border="1" bordercolor="#aaa9a9" style="border-collapse:collapse;font-size:12px;color:#444;">'+
					'										   <tbody>'+
					'											   <tr>'+
					'												  <td style="padding:6px;">Enquiry Validity</td>'+
					'												  <td style="padding:6px;">'+ inquiryValidity +'</td>'+
					'											   </tr>'+
					'											   <tr>'+
					'												  <td style="padding:6px;">Customer Name</td>'+
					'												  <td style="padding:6px;">'+ req.body.customerSession.first_name +'</td>'+
					'											   </tr>'+
					'											   <tr>'+
					'												  <td style="padding:6px;">Customer Mobile</td>'+
					'												  <td style="padding:6px;">'+ req.body.customerSession.mobile_number +'</td>'+
					'											   </tr>'+
					'											   <tr>'+
					'												  <td style="padding:6px;">Customer Email</td>'+
					'												  <td style="padding:6px;">'+ req.body.customerSession.email +'</td>'+
					'											   </tr>'+
					'   										   <tr>'+
					'												  <td style="padding:6px;">Business Name</td>'+
					'												  <td style="padding:6px;">'+ businessName +'</td>'+
					'											   </tr>'+
					'											   <tr>'+
					'												  <td style="padding:6px;">Customers Notes</td>'+
					'												  <td style="padding:6px;">'+ detailsOfRequirement +'</td>'+
					'											   </tr>'+
					'											   <tr>'+
					'												  <td style="padding:6px;">Suppliers Chosen</td>'+
					'												  <td style="padding:6px;">'+ suppliersChosen +'</td>'+
					'											   </tr>'+
					'											   <tr>'+
					'												  <td style="padding:6px;">Delivery Date</td>'+
					'												  <td style="padding:6px;">'+ result.inquiryEntity.deliveryByDate +'</td>'+
					'											   </tr>'+
					'											   <tr>'+
					'												  <td style="padding:6px;">Target price for enquiry</td>'+
					'												  <td style="padding:6px;">'+ targetPrice +'</td>'+
					'											   </tr>'+
					'											   <tr>'+
					'												  <td style="padding:6px;">Categories Sought</td>'+
					'												  <td style="padding:6px;">'+ result.inquiryEntity.categories +'</td>'+
					'											   </tr>'+
					'											   <tr>'+
					'												  <td style="padding:6px;">Payment Mode</td>'+
					'												  <td style="padding:6px;">'+ paymentModes +'</td>'+
					'											   </tr>'+
					'											   <tr>'+
					'												  <td style="padding:6px;">Wants to give Advance</td>'+
					'												  <td style="padding:6px;">'+ advanceSelected +'</td>'+
					'											   </tr>'+'											   <tr>'+
					'												  <td style="padding:6px;">Advance Amount Rs</td>'+
					'												  <td style="padding:6px;">'+ advancePaymentAmount +'</td>'+
					'											   </tr>'+'											   <tr>'+
					'												  <td style="padding:6px;">Packing & Freight requirements</td>'+
					'												  <td style="padding:6px;">'+ packingRequirements +'</td>'+
					'											   </tr>'+
					'											   <tr>'+
					'												  <td style="padding:6px;">Ship To Address</td>'+
					'												  <td style="padding:6px;">'+ shippingAddress.addressLine1 +', <br/>'+ shippingAddress.addressLine2 +', <br/>'+ shippingAddress.city +' – '+ shippingAddress.pincode +'</td>'+
					'											   </tr>'+
					'											   <tr>'+
					'												  <td style="padding:6px;">Expected number of quotations</td>'+
					'												  <td style="padding:6px;">'+ result.inquiryEntity.noOfQuotationsDesiredRange +'</td>'+
					'											   </tr>'+
					'										   </tbody>'+
					'									    </table>'+
					'								   </td>'+
					'							   </tr>'+
					'							   <tr style="padding:10px 20px;float:left;width:92%;">'+
					'							       <td align="left">'+
					'								       <p style="color:#444;font-size:14px;line-height:30px;font-weight:bold;">Kindly do the needful.</p>'+
					'								   </td>'+
					'							   </tr>'+
					'							</tbody>'+
					'						</table>		'+
					'				    </td>'+
					'				</tr>'+
					'			 </tbody>'+
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
				'</table>'
						return callback(false, emailBodyText);
				}else if(!perr && presult === null){
					logger.error(TAG + " " + " There is no data for the builder ID while generating the HTML. Builder Collection")
					return callback(true, "Inputs Doesn't match with our records.");
				}else{
					logger.error(TAG + " " + " Inquiry Unexpected Server error while generating the HTML.")
					return callback(true, "Unexpected Server error while generating the HTML Inquiry.");
				}
			});
			}
		 }else{
			 var productDetails = result.inquiryEntity.productDetails;

			 var productData = '';

			 if(productDetails !== null && productDetails !== undefined){
				 for(var i=0; i< productDetails.length; i++){
				  productData = productData +
						'<tr>'+
							'<td style="padding:6px;width:40%;">'+ productDetails[i].productName +'</td>'+
							'<td style="padding:6px;width:20%;">'+ productDetails[i].skuId +'</td>'+
							'<td style="padding:6px;width:20%;">'+ productDetails[i].quantity +'</td>'+
							'<td style="padding:6px;width:20%;">'+ productDetails[i].unitOfMeasurement +'</td>'+
						'</tr>';
				 }
			 }

			//  console.log("Product Data CRM: " + productData);

			 var  emailBodyText =

			 '<table align="center" width="800" cellspacing="0" cellpadding="0" border="0" style="font-size:medium;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;background:#ffffff;">'+
			  '  <tbody>'+
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
				'			<tbody>'+
				'				<tr bgcolor="#bd4931" width="730" style="color:#fff;font-size:24px;height:45px;float:left;margin-right:30px;margin-left:31px;margin-bottom:0px;width:87%;padding:0px 20px;text-align:center;">'+
				'					<td align="center">'+
				'						<span style="text-align:center;width:100%;float:left;margin-top:8px;margin-left:152px;">Because Quality Matters</span>'+
				'					</td>'+
				'				</tr>'+
				'				<tr style="margin-right:30px;margin-left:31px;float:left;width:92%;padding-bottom:0;">'+
				'				    <td style="color:#545454;font-size:14px">'+
				'					    <p style="margin-top:20px;color:#444444;font-size:14px;font-weight:normal;line-height:20px;margin-bottom:10px;">Dear Team,</p>'+
				'					    <p style="color:#444;font-size:14px;line-height:30px;margin:0;">An enquiry was raised by <strong>'+ req.body.customerSession.first_name +'</strong>, the details of which are as below:</p>'+
				'						<p style="color:#444;font-size:14px;line-height:30px;margin:0;">Refer to the attachment for the details of the Enquiry.</p>'+
				'				    </td>'+
				'				</tr>'+
				'				<tr>'+
				'					<td style="padding:15px 30px;">'+
				'						<table width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;border:1px solid #efefef;">'+
				'						    <tbody>'+
				'							    <tr style="padding:10px 20px;float:left;width:92%;">'+
				'								    <td>'+
				'					                    <p style="color:#444;font-size:14px;line-height:30px;margin:0;"><strong>Enquiry Details</strong></p>'+
				'					                </td>'+
				'							    </tr>'+
				'							    <tr>'+
				'								    <td style="padding:0 0 5px 20px;">'+
				'									    <table width="86%" cellspacing="0" cellpadding="4" border="1" bordercolor="#aaa9a9" style="border-collapse:collapse;font-size:12px;color:#444;">'+
				'										   <tbody>'+
				'											   <tr>'+
				'												  <td style="padding:6px;width:25%;">Customer Name</td>'+
				'												  <td style="padding:6px;width:60%;">'+ req.body.customerSession.first_name +'</td>'+
				'											   </tr>'+
				'											   <tr>'+
				'												  <td style="padding:6px;width:25%;">Customer Mobile</td>'+
				'												  <td style="padding:6px;width:60%;">'+ req.body.customerSession.mobile_number +'</td>'+
				'											   </tr>'+
				'											   <tr>'+
				'												  <td style="padding:6px;width:25%;">Customer Email</td>'+
				'												  <td style="padding:6px;width:60%;">'+ req.body.customerSession.email +'</td>'+
				'											   </tr>'+
				'											   <tr>'+
				'												  <td style="padding:6px;width:25%;">Business Name</td>'+
				'												  <td style="padding:6px;width:60%;">'+ businessName +'</td>'+
				'											   </tr>'+
				'											    <tr>'+
				'												  <td style="padding:6px;width:25%;">Customers Notes</td>'+
				'												  <td style="padding:6px;width:60%;">'+ detailsOfRequirement +'</td>'+
				'											   </tr>'+
				'											   <tr>'+
				'												  <td style="padding:6px;width:25%;">Delivery Date</td>'+
				'												  <td style="padding:6px;width:60%;">'+ result.inquiryEntity.deliveryByDate +'</td>'+
				'											   </tr>'+
				'											   <tr>'+
				'												  <td style="padding:6px;width:25%;">Payment Mode</td>'+
				'												  <td style="padding:6px;width:60%;">'+ paymentModes +'</td>'+
				'											   </tr>'+
				'											   <tr>'+
				'												  <td style="padding:6px;width:25%;">Ship To Address</td>'+
				'												  <td style="padding:6px;width:60%;">State - '+ shippingAddress.state +' City - '+ shippingAddress.city +' Pincode - '+ shippingAddress.pincode +'</td>'+
				'											   </tr>'+
				'											   <tr>'+
				'												  <td style="padding:6px;width:25%;">Expected number of quotations</td>'+
				'												  <td style="padding:6px;width:60%;">'+ result.inquiryEntity.noOfQuotationsDesiredRange +'</td>'+
				'											   </tr>'+
				'										   </tbody>'+
				'									    </table>'+
				'								   </td>'+
				'							    </tr>'+
				'								<tr style="padding:10px 20px;float:left;width:92%;">'+
				'								    <td>'+
				'					                    <p style="color:#444;font-size:14px;line-height:30px;margin:0;"><strong>Product Details</strong></p>'+
				'					                </td>'+
				'							    </tr>'+
				'							    <tr>'+
				'								    <td style="padding:0 0 5px 20px;">'+
				'									    <table width="86%" cellspacing="0" cellpadding="4" border="1" bordercolor="#aaa9a9" style="border-collapse:collapse;font-size:12px;color:#444;">'+
				'										   <tbody>'+
				'												<tr>'+
				'												  <th style="padding:6px;width:40%;">Product Name</th>'+
				'												  <th style="padding:6px;width:20%;">SKU ID</th>'+
				'												  <th style="padding:6px;width:20%;">Qty</th>'+
				'												  <th style="padding:6px;width:20%;">UOM</th>'+
				'											   </tr>'+ productData +' </tbody>'+
				'									    </table>'+
				'								   </td>'+
				'							    </tr>'+
				'							   <tr style="padding:10px 20px;float:left;width:92%;">'+
				'							       <td align="left">'+
				'								       <p style="color:#444;font-size:14px;line-height:30px;font-weight:bold;">Kindly do the needful.</p>'+
				'								   </td>'+
				'							   </tr>'+
				'							</tbody>'+
				'						</table>	'+
				'				    </td>'+
				'				</tr>		'+
				'			 </tbody>'+
				'			</table>	'+
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
				'					<span style="color:#637279;font-size:10px;text-align:center;">#117, 27th Main, HSR Layout, Sector-2, Next to NIFT, Bangalore-5600102, Karnataka, India</span>'+
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

			 return callback(false, emailBodyText);
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
