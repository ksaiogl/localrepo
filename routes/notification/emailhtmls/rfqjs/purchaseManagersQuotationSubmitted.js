var TAG = "purchaseManagersQuotationSubmitted.js";

var htmlSupport = require('../../htmlEmailsSupportFile.js');
var htmlGenericvalues = htmlSupport.generic_values;
var log = require('../../../../Environment/log4js.js');
var timezoneConversions = require('../../../helpers/timezoneConversions.js');

exports.getHtml = 
function getHtml (emailData, callback){
	var logger = log.logger_notification;

	try{
		var inquiryId = emailData.inquiryID;
		var quotaionId = emailData.reqBody.sellerquotationId;

		var emailSubject = "Quote Submitted for Enquiry ID "+inquiryId+" │ Quote ID: "+quotaionId;
		
		var inquiryDate = timezoneConversions.ConvertToIST(emailData.inquiryDetails.inquiryEntity.inquiryTimestamp);
		inquiryDate = inquiryDate.substring(0, inquiryDate.indexOf('at'));

		var inquiryDeactivationDate = "";

		if(emailData.inquiryDetails.inquiryEntity.respondByDate === undefined){
            inquiryDeactivationDate = "";
        }
        else{
            var inquiryDeactivationDate = timezoneConversions.ConvertToIST(emailData.inquiryDetails.inquiryEntity.respondByDate);
			inquiryDeactivationDate = inquiryDeactivationDate.substring(0, inquiryDeactivationDate.indexOf('at'));
        }

		var categoriesSought = emailData.inquiryDetails.inquiryEntity.categories.toString();
		var shippingAddress = emailData.inquiryDetails.inquiryEntity.shippingAddress;
		var shippingAddressFull = shippingAddress.addressLine1+', '+shippingAddress.addressLine2+', '+shippingAddress.city+', '+shippingAddress.state+', '+shippingAddress.pincode;
		var inquiryCreditDays = emailData.inquiryDetails.inquiryEntity.creditDaysNeeded === null ? '' : emailData.inquiryDetails.inquiryEntity.creditDaysNeeded+' Days';
		var paymentMode = emailData.inquiryDetails.inquiryEntity.paymentModes;
		if(paymentMode === "onDelivery"){
			paymentMode = "On Delivery";
		}
		else{
			paymentMode = "On Credit: "+emailData.inquiryDetails.inquiryEntity.creditDaysNeeded+" Days";
		}
	
		var quoteDetails = emailData.reqBody.quotations;
		var companyName = emailData.inquiryDetails.inquiryEntity.companyName;
		var customerFirstName = emailData.inquiryDetails.inquiryEntity.customerFirstName;
		var customerLastName = emailData.inquiryDetails.inquiryEntity.customerLastName;

		if(companyName === null){
			companyName = customerFirstName+" "+customerLastName;
		}
		var projectName = emailData.inquiryDetails.inquiryEntity.associatedProjectName === null ? 'NA' : emailData.inquiryDetails.inquiryEntity.associatedProjectName;
		var supplierId = emailData.sellerId;
		var supplierName = emailData.primaryFirstName;
		var sellerRemarks = emailData.reqBody.sellerRemarks;

		var itemInfo = '';
		
		//Removing 0 quotedPrice quiotations.
		var newQuotationDetails = [];
		for(var i = 0; i < quoteDetails.length; i++){
			if(quoteDetails[i].quotedPrice === 0 || quoteDetails[i].quotedPrice.toString().trim().length === 0 || quoteDetails[i].quotedPrice === null){
				continue;
			}
			newQuotationDetails.push(quoteDetails[i]);
		}

		quoteDetails = [];
		quoteDetails = newQuotationDetails;

		for(var i = 0; i < quoteDetails.length; i++){
			var inquiryParams = emailData.inquiryDetails.inquiryEntity.inquiryStructured.inquiryParams;
			for(var j = 0; j < inquiryParams.length; j++){
				if(quoteDetails[i].productId === inquiryParams[j].productId || quoteDetails[i].productIdentifier === inquiryParams[j].productIdentifier){
					var productSpec = [];
					inquiryParams[j].productSpecs.forEach(function(spec, index, array){
						productSpec.push(spec.value);
					});
					itemInfo = itemInfo + 
					'<tr>'+
						  '<td style="padding:5px;">'+quoteDetails[i].productName+'</td>'+
						  '<td style="padding:5px;">'+productSpec.toString()+'</td>'+
						  '<td style="padding:5px;">'+quoteDetails[i].brand+'</td>'+
						  '<td style="padding:5px;">'+quoteDetails[i].quantity+'</td>'+
						  '<td style="padding:5px;">'+quoteDetails[i].quotedPrice+'</td>'+
						  '<td style="padding:5px;">'+quoteDetails[i].VAT+'%'+'</td>'+
						  '<td style="padding:5px;">'+quoteDetails[i].totalPrice+'</td>'+
						  '<td style="padding:5px;">'+quoteDetails[i].creditDays+' Days'+'</td>'+
					'</tr>';

					break;
				}
				/*else if(quoteDetails[i].productIdentifier === inquiryParams[j].productIdentifier){
					var productSpec = [];
					inquiryParams[j].productSpecs.forEach(function(spec, index, array){
						productSpec.push(spec.value);
					});
					itemInfo = itemInfo + 
					'<tr>'+
						  '<td style="padding:5px;">'+quoteDetails[i].productName+'</td>'+
						  '<td style="padding:5px;">'+productSpec+'</td>'+
						  '<td style="padding:5px;">'+quoteDetails[i].brand+'</td>'+
						  '<td style="padding:5px;">'+quoteDetails[i].quantity+'</td>'+
						  '<td style="padding:5px;">'+quoteDetails[i].quotedPrice+'</td>'+
						  '<td style="padding:5px;">'+quoteDetails[i].VAT+'</td>'+
						  '<td style="padding:5px;">'+quoteDetails[i].totalPrice+'</td>'+
						  '<td style="padding:5px;">'+quoteDetails[i].creditDays+'</td>'+
					'</tr>';
				}*/
			}
		}

		var emailBody = '<table align="center" width="800" cellspacing="0" cellpadding="0" border="0" style="font-size:medium;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;background:#ffffff;">'+  
	    '<tbody>'+
			'<tr>'+
	            '<td width="100%" colspan="3" style="padding:10px 0px;text-align:center">'+
	                '<a target="_blank" href="https://www.msupply.com/">'+
						'<img style="width:230px;" src="http://static.msupply.com/emailTemplate/EmailTemplateLogo.png" alt="msupply.com">'+
					'</a>'+
	            '</td>'+
	        '</tr>'+
			'<tr>'+
				'<td>'+
				  '<table width="800" cellspacing="0" cellpadding="0" border="0" align="left" style="background:#f9f9f9;border-top:1px solid #dfdfdf;border-bottom:1px solid #dfdfdf;padding-top:20px;padding-bottom:10px;">'+
					    '<tbody>'+
							'<tr bgcolor="#bd4931" width="730" style="color:#fff;font-size:18px;height:40px;float:left;margin-right:30px;margin-bottom:0px;width:87%;padding:0px 20px;text-align:center;margin-left:31px;">'+
								'<td align="center" style="width:100%;float:left;">'+
									'<span style="text-align:center;width:100%;float:left;margin-top:9px;">Because Quality Matters</span>'+
								'</td>'+
							'</tr>'+
							'<tr style="float:left;margin-right:30px;width:89%;margin-left:55px;">'+
							    '<td style="color:#545454;font-size:14px">'+
								    '<p style="margin-top:20px;color:#444444;font-size:14px;font-weight:normal;line-height:20px;margin-bottom:0;">Dear Team,</p>'+
							    	'<p style="margin-top:10px;color:#444444;font-size:14px;font-weight:normal;line-height:20px;margin-bottom:10px;">The quote for Enquiry ID has been received. The details of the same are mentioned in the email as below.</p>'+
							    '</td>'+
							'</tr>'+
							'<tr style="float:left;padding:5px 57px 5px;width:85%;">'+
								'<td align="left" colspan="2" style="float:left;width:40%;color:#444444;font-size:13px;padding:5px 15px 5px 0;"><span style="float:left;">Supplier ID</span>:<span style="padding-left:10px">'+supplierId+'</span></td>'+
								'<td colspan="4" align="left" style="float:left;width:40%;color:#444444;font-size:13px;padding:5px;"><span style="text-align:left;">Supplier Name</span>:<span style="padding-left:5px;">'+supplierName+'</span></td>'+									    
							'</tr>'+
	                        '<tr style="float:left;padding:10px 57px 5px;width:85%;">'+
								'<td>'+
									'<p style="color:#000;font-size:14px;line-height:30px;margin:0;"><strong>Enquiry Details</strong></p>'+
								'</td>'+
						    '</tr>'+			
							'<tr width="700">'+
								'<td align="left">'+
									'<table width="86%" cellspacing="0" cellpadding="4" bordercolor="#aaa9a9" border="1" style="font-weight:normal;border-collapse:collapse;font-size:12px;color:#444;float:left;margin-left:56px;">'+
									    '<tbody>									   	'+
										   '<tr>'+
											  '<td style="padding:6px;width:25%;">Enquiry ID</td>'+
											  '<td style="padding:6px;width:60%;">'+inquiryId+'</td>'+
										   '</tr>'+
										   '<tr>'+
											  '<td style="padding:6px;width:25%;">Enquiry Date</td>'+
											  '<td style="padding:6px;width:60%;">'+inquiryDate+'</td>'+
										   '</tr>'+
										   '<tr>'+
											  '<td style="padding:6px;width:25%;">Customer Name</td>'+
											  '<td style="padding:6px;width:60%;">'+companyName+'</td>'+
										   '</tr>'+
										   '<tr>'+
											  '<td style="padding:6px;width:25%;">Project Name</td>'+
											  '<td style="padding:6px;width:60%;">'+projectName+'</td>'+
										   '</tr>'+
										   '<tr>'+
											  '<td style="padding:6px;width:25%;">Shipping Address</td>'+
											  '<td style="padding:6px;width:60%;">'+shippingAddressFull+'</td>'+
										   '</tr>'+
										   '<tr>'+
											  '<td style="padding:6px;width:25%;">Categories Sought</td>'+
											  '<td style="padding:6px;width:60%;">'+categoriesSought+'</td>'+
										   '</tr>'+
										   '<tr>'+
											  '<td style="padding:6px;width:25%;">Payment Mode</td>'+
											  '<td style="padding:6px;width:60%;">'+paymentMode+'</td>'+
										   '</tr>'+
										   '<tr>'+
											  '<td style="padding:6px;width:25%;">Enquiry Validity</td>'+
											  '<td style="padding:6px;width:60%;">'+inquiryDeactivationDate+'</td>'+
										   '</tr>'+
									   '</tbody>'+
									'</table>'+
								'</td>'+
							'</tr>'+
							'<tr style="float:left;padding:20px 57px 5px;width:85%;">'+
								'<td>'+
									'<p style="color:#000;font-size:14px;line-height:30px;margin:0;"><strong>Quote Details</strong></p>'+
								'</td>'+
							'</tr>'+
							'<tr style="float:left;padding:0 57px 5px;width:85%;">'+
								'<td align="left" colspan="2" style="float:left;width:40%;color:#444444;font-size:13px;padding:5px 15px 5px 5px;"><span style="float:left;">Quote ID</span>:<span style="padding-left:10px">'+quotaionId+'</span></td>'+
								'<td colspan="4" align="right" style="float:right;width:40%;color:#444444;font-size:13px;padding:5px;"><span style="text-align:left;">Credit Period</span>:<span style="padding-left:5px;">'+inquiryCreditDays+'</span></td>'+									    
							'</tr>'+
							'<tr width="700">'+
								'<td align="left">'+ 
									'<table width="86%" cellspacing="0" cellpadding="4" bordercolor="#aaa9a9" border="1" style="font-weight:normal;border-collapse:collapse;font-size:12px;color:#444;float:left;margin-left:56px;">'+
									    '<tbody>'+
											 '<tr>'+
												  '<th align="left" style="padding:5px;">Product Name</th>'+
												  '<th align="left" style="padding:5px;">Grade/Spec</th>'+
												  '<th align="left" style="padding:5px;">Brand</th>'+
												  '<th align="left" style="padding:5px;">Qty</th>'+
												  '<th align="left" style="padding:5px;">Rate</th>'+
												  '<th align="left" style="padding:5px;">VAT</th>'+
												  '<th align="left" style="padding:5px;">Amount</th>'+
												  '<th align="left" style="padding:5px;">Credit Period</th>'+
											 '</tr>'+
											 itemInfo
									   +'</tbody>'+
									'</table>'+
								'</td>'+
							'</tr>'+
							'<tr style="float:left;margin-right:30px;width:89%;margin-left:55px;">'+
							    '<td style="color:#545454;font-size:14px">'+
								    '<p style="margin-top:20px;color:#444444;font-size:13px;font-weight:normal;line-height:20px;margin-bottom:5px;">'+
									   'Other comments: '+sellerRemarks+
									'</p>'+
							    '</td>'+
							'</tr>'+												
					    '</tbody>'+
					'</table>'+
				'</td>'+
			'</tr>'+
			'<tr>'+
			  '<td>'+
				'<table width="100%" cellspacing="0" cellpadding="0" border="0" style="padding-top:15px;">'+
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
							   '<a style="text-align:center;text-decoration:none;color:#637279;font-weight:normal;" href="mailto:'+htmlGenericvalues.supplier_support_email+'" target="_top">'+htmlGenericvalues.supplier_support_email+'</a>'+
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
		console.log(TAG + "Exception in HTML purchaseManagersQuotationSubmitted- getHtml - " + e);
		logger.error(TAG + "Exception in HTML purchaseManagersQuotationSubmitted- getHtml- :- error :" + e);
		return callback(true, "Exception error");
	}
}