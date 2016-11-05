//notificationIdentifier: 307
var TAG = "OrderConfirmationWithCreditSupplierEmail.js- ";
var htmlSupport = require('../../htmlEmailsSupportFile.js');
var htmlGenericvalues = htmlSupport.generic_values;
var log = require('../../../../Environment/log4js.js');
var commaIt = require('comma-it');
var commaITConfig = {addPrecision:true, thousandSeperator : ',', decimalSeperator : '.'};

exports.getHtml = function getHtml (emailBodyParams, callback){
try
{
	var logger = log.logger_notification;
	//get all Basic Order informtion
	var orderId = emailBodyParams.orderId;
	var orderDate = emailBodyParams.orderDate;
	var minOrderDeliveryDate = emailBodyParams.minOrderDeliveryDate;
	var orderItemInfo = emailBodyParams.orderItemInfo;

		var paymentMethod = emailBodyParams.paymentMethod;
		var customerType = emailBodyParams.customerType;
		var creditPeriod = emailBodyParams.creditPeriod;
	    //get Order Delivery Address details
		var orderDeliveryAddress = emailBodyParams.orderDeliveryAddress;
		var customerFullName = orderDeliveryAddress.customerFullName;
		var addressLine1 = orderDeliveryAddress.addressLine1;
		var addressLine2 = orderDeliveryAddress.addressLine2;
		var city = orderDeliveryAddress.city;
		var state = orderDeliveryAddress.state;
		var country = orderDeliveryAddress.country;
		var pinCode = orderDeliveryAddress.pinCode;
		var mobile = orderDeliveryAddress.mobile;

		//get Order Billing Address Details.
		var orderBillingAddress = emailBodyParams.orderBillingAddress;
		var billingCustomerFullName = orderBillingAddress.customerFullName;
		var billingAddressLine1 = orderBillingAddress.addressLine1;
		var billingAddressLine2 = orderBillingAddress.addressLine2;
		var billingCity = orderBillingAddress.city;
		var billingState = orderBillingAddress.state;
		var billingCountry = orderBillingAddress.country;
		var billingPinCode = orderBillingAddress.pinCode;
		var billingMobile = orderBillingAddress.mobile;

		var subTotal = emailBodyParams.subTotal;
		// "discount": 0,
		// "serviceCharges": 0,
		var VAT = emailBodyParams.VAT;
		var shippingAndHandling = emailBodyParams.shippingAndHandling;
		// "exciseDuty":"",
		var grandTotal = emailBodyParams.grandTotal;
		//Dynamically form the Email Subject line.
		var emailSubject = "New Order received from mSupply.com: Order No: "+orderId;

	  	//get induvidual Product details.
	    var itemInfo = '';
	    for(var i = 0; i < orderItemInfo.length; i++)
	    {
	    	var price = htmlSupport.isNumber(orderItemInfo[i].price) ? commaIt(orderItemInfo[i].price, commaITConfig) : orderItemInfo[i].price;
	    	var itemSubTotal = htmlSupport.isNumber(orderItemInfo[i].subTotal) ? commaIt(orderItemInfo[i].subTotal, commaITConfig) : orderItemInfo[i].subTotal;

	    	var itemInfo = itemInfo +
	    	'<tr>'+
			    '<td align="left" style="padding:5px;color:#444444;">'+
				    '<p>'+
						'<span style="font-size:13px;text-align:left;float:left;">ID: #'+ orderItemInfo[i].SKUId +'</span>'+
						'<br>'+
						'<a style="margin-bottom:20px;color:#444444;text-decoration:none;font-size:12px;text-align:left;float:left;" href="https://www.msupply.com/" target="_blank">'+
							'<span>'+ orderItemInfo[i].productName + '</span>'+
						'</a>'+
					'</p>'+
				'</td>'+
                '<td width="120" align="left" style="padding:5px;color:#444444;font-size:14px">'+
				    '<span><span>&#8377;</span>'+ price +'</span>'+
				'</td>'+
                '<td align="left" style="padding:5px;color:#444444;font-size:14px">'+ orderItemInfo[i].quantity +'</td>'+
                '<td width="120" align="right" style="padding:5px;color:#444444;font-size:14px">'+
				    '<span><span>&#8377;</span>'+ itemSubTotal +'</span>'+
				'</td>'+
			'</tr>';
		};

		var emailBody =
		'<table align="center" width="800" cellspacing="0" cellpadding="0" border="0" style="font-size:medium;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;background:#ffffff;">'+
	    '<tbody>'+
			'<tr>'+
	            '<td width="100%" colspan="3" style="padding:10px 0px;text-align:center">'+
	                '<a target="_blank" href="https://www.msupply.com/terms_and_conditions_contest">'+
						'<img style="width:230px;" src="http://static.msupply.com/emailTemplate/EmailTemplateLogo.png" alt="msupply.com">'+
					'</a>'+
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
						'<tr style="margin-right:30px;margin-left:31px;float:left;width:87%;">'+
						  '<td style="color:#545454;font-size:14px">'+
							  '<p style="margin-top:20px;color:#444444;font-size:18px;font-weight:normal;line-height:20px;margin-bottom:10px;"><b>Dear Supplier,</b></p>'+
							  '<p style="color:#000;font-size:14px;line-height:30px;margin:0;">You have received the following order from mSupply customer to be delivered by '+minOrderDeliveryDate+'. Request you to accept the same.</p>'+
						  '</td>'+
						'</tr>'+
						'<tr>'+
							'<td style="padding:15px 30px 0;">'+
								 '<table width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;border:1px solid #efefef;">'+
								  '<tbody>'+
									'<tr width="722">'+
										'<td width="100%" style="padding: 20px 20px 0;float:left;width:705px;">'+
											'<h1 style="margin-top:5px;color:#1ca8a5;font-weight:400;font-size:18px;margin-bottom:5px;">ORDER ID: #'+orderId+'</h1>'+
											'<span style="color:#1ca8a5;font-size:10px;float:left;">Placed on '+orderDate+'</span>'+
										'</td>'+
									'</tr>'+
									'<tr>'+
										'<td>'+
											'<table width="100%" cellspacing="0" cellpadding="0" border="0" style="width:97%;margin:0px 15px;">'+
												'<tr>'+
													'<td style="color:#3a3a3a;font-size:14px" colspan="6">'+
														'<table width="100%" cellspacing="0" cellpadding="0" border="0">'+
														    '<thead>'+
																'<tr>'+
																    '<th align="left" style="font-size:11px;color:#637078;padding:20px 0 6px;border-bottom:1px solid #e2e2e2;">Product Name</th>'+
																    '<th width="70" align="left" style="font-size:11px;color:#637078;padding:20px 0 6px;border-bottom:1px solid #e2e2e2;">Price</th>'+
					                                                '<th align="left" style="font-size:11px;color:#637078;padding:20px 0 6px;border-bottom:1px solid #e2e2e2;">Qty</th>'+
																    '<th width="70" align="right" style="font-size:11px;color:#637078;padding:20px 0 6px;border-bottom:1px solid #e2e2e2;">Subtotal</th>'+
																'</tr>'+
															'</thead>'+
														    '<tbody bgcolor="#ffffff" border="1">'+
															itemInfo
															+
														    '</tbody>'+
															'<tbody>'+
																'<tr>'+
																  '<td colspan="8" valign="right" align="right" style="border-bottom:1px solid #e2e2e2;padding:10px 0">'+
																	 '<table width="80%" cellspacing="0" cellpadding="0" style="width:500px;float:right">'+
																		'<tr style="float:right">'+
																			'<td colspan="2">'+
																				'<table width="100%" cellspacing="0" cellpadding="0" border="0" align="right" style="float:right">'+
																				  '<tbody>'+
																					    '<tr>'+
																						  '<td style="font-size:13px;color:#444444;padding:10px 20px 5px;text-align:right">Subtotal</td>'+
																						  '<td align="right" style="font-size:13px;color:#444444;padding:10px 20px 5px"><span><span>₹</span>' + subTotal + '</span></td>'+
																						'</tr>'+
																						'<tr>'+
																						  '<td style="font-size:13px;color:#444444;padding:10px 20px 5px;text-align:right">Shipping &amp; Handling Charges</td>'+
																						  '<td align="right" style="font-size:13px;color:#444444;padding:10px 20px 5px"><span><span>₹</span>' + shippingAndHandling + '</span></td>'+
																						'</tr>'+
																						'<tr>'+
																						  '<td style="font-size:13px;color:#444444;padding:10px 20px 5px;text-align:right">VAT</td>'+
																						  '<td align="right" style="font-size:13px;color:#444444;padding:10px 20px 5px"><span><span>₹</span>'+ VAT +'</span></td>'+
																						'</tr>'+
																						'<tr>'+
																						  '<td style="font-size:13px;color:#bd4931;padding:10px 20px 5px;text-align:right;font-weight:bold">Total</td>'+
																						  '<td align="right" style="font-size:13px;color:#bd4931;padding:10px 20px 5px;font-weight:bold"><span><span>₹</span>' + grandTotal +'</span></td>'+
																						'</tr>'+
																				  '</tbody>'+
																				'</table>'+
																			'</td>'+
																		'</tr>'+
																	 '</table>'+
																  '</td>'+
																'</tr>'+
																'<tr>'+
																    '<td colspan="6">'+
																	    '<table width="100%" cellspacing="0" cellpadding="0">'+
																			'<tbody>'+
																				'<tr style="border-bottom:1px solid #d5d5d5;float:left;width:100%">'+
																					'<td width="220" valign="top" colspan="4" style="float:left;border-bottom:none;padding-left:5px;padding-top:20px;padding-bottom:20px">'+
																						'<b style="color:#637279;font-size:13px;float:left">Shipping Address</b><br>'+
																						'<p style="color:#444;font-size:13px">'+customerFullName+'<br>'+addressLine1+'<br>'+addressLine2+'<br>'+city+' - '+pinCode+'<br>'+state+'<br>Ph: '+mobile+'</p>'+
																					'</td>'+
																					'<td width="240" valign="top" colspan="4" style="float:left;border-bottom:none;padding-left:5px;padding-top:20px;padding-bottom:20px">'+
																						'<b style="color:#637279;font-size:13px;float:left">Billing Address</b><br>'+
																						'<p style="color:#444;font-size:13px">'+billingCustomerFullName+'<br>'+billingAddressLine1+'<br>'+billingAddressLine2+'<br>'+billingCity+' - '+billingPinCode+'<br>'+billingState+'<br>Ph: '+billingMobile+'</p>'+
																					'</td>'+
																					'<td valign="top" style="float:left;border-bottom:none;padding-left:5px;padding-bottom:20px;padding-top:20px" colspan="2">'+
																						'<p style="color:#444;font-size:13px"><b style="color:#637279;float:left">Customer Type:  </b>'+customerType+'</p>'+
																						'<p style="color:#444;font-size:13px"><b style="color:#637279;float:left">Payment Method: </b><br>'+paymentMethod+'</p>'+
																						'<p style="color:#444;font-size:13px"><b style="color:#637279;float:left">Credit Period:'+creditPeriod+' days</b></p>'+
																					'</td>'+
																				'</tr>'+
																			'</tbody>'+
																		'</table>'+
																	'</td>'+
																'</tr>'+
														    '</tbody>'+
															'<tbody>'+
																'<tr>'+
																    '<td colspan="6">'+
																	    '<table width="100%" cellspacing="0" cellpadding="0">'+
																			'<tbody>'+
																				'<tr>'+
																					'<td valign="top" colspan="8" style="float:left;border-bottom:none;padding-left:5px;padding-top:20px;padding-bottom:20px;">'+
																						'<h4 style="color:#637279;font-size:13px;text-transform:uppercase;">TERMS OF SALE AND OTHER COMMENTS</h4>'+


	'<p style="color:#637279;font-size:13px;margin:5px 0;"> If you are fulfilling this order then, the credit liability will lie with the supplier. Refer to the attachment for the details. </p>'+


															'<p style="color:#637279;font-size:13px;margin:5px 0;">Payment through mSupply E-commerce India Pvt. Ltd.</p>'+
																						'<p style="color:#637279;font-size:13px;margin:5px 0;">Material receipt to be duly signed by the customer & sent to mSupply for supplier payment.</p>'+
																						/*'<p style="color:#637279;font-size:13px;margin:5px 0;">Transaction Settlement Fee (TSF) along with margin to be charged on the invoice amount.</p>'+*/
																						'<p style="color:#637279;font-size:13px;margin:5px 0;">Margin to be charged on the invoice amount.</p>'+
																						/*'<p style="color:#637279;font-size:13px;margin:5px 0;">Service Tax of 15% to be charged on both TSF and margin.</p>'+*/
																						'<p style="color:#637279;font-size:13px;margin:5px 0;">Service Tax of 15% to be charged on margin.</p>'+
																						'<p style="color:#637279;font-size:13px;margin:5px 0;">Detailed T&C can be viewed at <a href="color:#0563c1;">https://www.msupply.com/supplier/termsAndConditions</a></p>'+
																					'</td>'+
																				'</tr>'+
																				'<tr>'+
																					'<td valign="top" colspan="8" style="float:left;border-bottom:none;padding-left:5px;padding-top:20px;padding-bottom:20px;">'+
																						'<h4 style="color:#637279;font-size:13px;text-transform:uppercase;">ADDITIONAL DETAILS</h4>'+
																						'<p style="color:#637279;font-size:13px;margin:5px 0;">RETURNS: The materials once unloaded will not be returned in any case & the customer will be liable to pay the order amount.</p>'+
																						'<p style="color:#637279;font-size:13px;margin:5px 0;">In case of any quality issues, the material should not be unloaded.</p>'+
																						'<p style="color:#637279;font-size:13px;margin:5px 0;">In case of returns, the delivery charge has to be borne by the customer.</p>'+
																						'<p style="color:#637279;font-size:13px;margin:5px 0;">VARIATIONS: Acceptable variation is mentioned below for Steel & Aggregates:</p>'+
																						'<p style="color:#637279;font-size:13px;margin:5px 0;">Steel:- 5kg / MT- In case the weighment is required by customer, the weighment charge has to be borne by the customer.</p>'+
																						'<p style="color:#637279;font-size:13px;margin:5px 0;">Aggregates:- 5% of the total vehicle quantity.</p>'+
																					'</td>'+
																				'</tr>'+
																				'<tr>'+
																					'<td style="padding:4px 0 0;text-align:left;">'+
																						'<p style="margin:0;float:left;width:100%;color:#637279;font-size:13px;">'+
																						   '<em>Note: Without invoice and signed material receipt, msupply will not be processing payment to supplier.</em>'+
																						'</p>'+
																					'</td>'+
																				'</tr>'+
																				'<tr>'+
																					'<td style="padding:4px 0 13px;text-align:left;">'+
																						'<p style="margin:0;float:left;width:100%;color:#637279;font-size:13px;">'+
																						   '<em>Please read & accept the credit terms and conditions mentioned overleaf this order form.</em>'+
																						'</p>'+
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
											'</table>'+
										'</td>'+
									'</tr>'+
								'</table>'+
							'</td>'+
						'</tr>'+
						'<tr align="center">'+
							'<td width="100%" align="center" style="float:left;margin:20px 20px 0px;padding-bottom:20px;">'+
								 '<p style="color:#627179;font-size:13px;margin-bottom:0;">Contact us for any help or support</p>'+
								 '<p style="color:#627179;font-size:13px;margin:7px 0 22px;"><strong style="color:#1fa9a6;font-size:13px;">'+htmlGenericvalues.support_contactnumber+'</strong>&nbsp;or&nbsp;<a href="mailto:'+htmlGenericvalues.supplier_support_email+'" style="text-decoration:none;color:#1fa9a6;font-size:13px;font-weight:bold;">'+htmlGenericvalues.supplier_support_email+'</a></p>'+
								 '<span style="color:#627179;font-size:19px;"><strong>mSupply</strong> Benefits</span>'+
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
									'<td><a target="_blank" style="text-decoration:none" href="https://www.facebook.com/mSupplydotcom?fref=ts"><img width="32" height="30" style="padding-right:3px" src="http://static.msupply.com/emailTemplate/registration_confirmation/facebook.png" alt="facebook"> </a></td>'+
									'<td><a target="_blank" style="text-decoration:none" href="https://twitter.com/mSupplydotcom/"><img width="32" height="30" style="padding-right:3px" src="http://static.msupply.com/emailTemplate/registration_confirmation/twitter.png" alt="twitter"> </a></td>'+
									'<td><a target="_blank" style="text-decoration:none" href="https://plus.google.com/+mSupplydotcom/posts"><img width="32" height="30" style="padding-right:3px" src="http://static.msupply.com/emailTemplate/registration_confirmation/google+.png" alt="googleplus"> </a></td>'+
									'<td><a target="_blank" style="text-decoration:none" href="https://www.linkedin.com/company/msupply-com"><img width="32" height="30" style="padding-right:3px" src="http://static.msupply.com/emailTemplate/registration_confirmation/in.png" alt="linkedin"> </a></td>'+
								'</tr>'+
							'</tbody>'+
						'</table>'+
					  '</td>'+
					'</tr>'+
					'<tr>'+
						'<td width="730" align="center">'+
							'<img width="10" height="13" style="padding-right:5px" src="http://static.msupply.com/emailTemplate/registration_confirmation/address_icon.png" alt="address_icon">'+
							'<span style="color:#637279;font-size:10px;text-align:center;">'+htmlGenericvalues.office_address+'</span>'+
						'</td>'+
					'</tr>'+
					'<tr>'+
						'<td style="padding:4px 0 0;text-align:center;">'+
							'<p style="margin:0;float:left;width:100%;color:#637279;font-size:10px;">'+
							   '<img width="13" height="13" style="margin-right:3px" src="http://static.msupply.com/emailTemplate/registration_confirmation/mail_icon.png" alt="mail_icon">'+
							   '<a target="_top" href="mailto:'+htmlGenericvalues.supplier_support_email+'" style="text-align:center;text-decoration:none;color:#637279;font-weight:normal;">'+htmlGenericvalues.supplier_support_email+'</a>'+
							   '<span style="font-weight:normal;"><img width="13" height="13" style="padding-right:4px" src="http://static.msupply.com/emailTemplate/registration_confirmation/phone_icon.png" alt="phone_icon">'+htmlGenericvalues.support_contactnumber+'</span>'+
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
catch(e)
{
  console.log(TAG + "Exception in HTML OrderConfirmationWithCreditSupplierEmail- getHtml - " + e);
  logger.error(TAG + "Exception in HTML OrderConfirmationWithCreditSupplierEmail- getHtml- :- error :" + e);
  return callback(true, "Exception error");
}
};






															