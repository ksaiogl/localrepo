var TAG = "NewOrderSupplierEmail.js";

var timezoneConversions = require('../../helpers/timezoneConversions.js');
var numberConversions = require('../../helpers/numberConversions.js');
var htmlEmailssupport = require('../../helpers/htmlEmailssupportFile.js');
var htmlGenericvalues = htmlEmailssupport.generic_values;
var commaIt = require('comma-it');
var commaITConfig = {addPrecision:true, thousandSeperator : ',', decimalSeperator : '.'};

//Function for the Reset Password.
exports.supplierNewOrderEmail = 
function supplierNewOrderEmail (outputJSON, orderItemInfo, orderfinancials, callback){

	var orderId = outputJSON.orderEntity.orderInfo.orderNumber;
    var orderDate = timezoneConversions.ConvertToIST(outputJSON.orderEntity.orderInfo.orderDate);
    var orderDeliveryAddress = outputJSON.orderEntity.orderInfo.orderDeliveryAddress;

    //get paymentMethod
    var paymentMode = outputJSON.orderEntity.paymentInfo.mode;
    var paymentMethod = '';
    if (paymentMode === "cashin")
    {
    	paymentMethod = "Cash On Delivery";
    }
    else if(paymentMode === "cheque_checkout")
    {
    	paymentMethod = "Cheque";
    }
    else
    {
    	paymentMethod = "Prepaid";
    };

    var addrssLine1, addressLine2, city, state, country, pinCode, CustomerName, mobile;
    //get Shipping Address
    for(var i = 0; i < orderDeliveryAddress.length; i++)
    {
    	if(orderDeliveryAddress[i].addressType === "Shipping")
    	{
    		CustomerName = orderDeliveryAddress[i].ContactfirstName +" "+ orderDeliveryAddress[i].ContactlastName;
    		addressLine1 = orderDeliveryAddress[i].addressLine1; 
            addressLine2 = orderDeliveryAddress[i].addressLine2;
            city = orderDeliveryAddress[i].city;
            state = orderDeliveryAddress[i].state; 
            country = orderDeliveryAddress[i].country;
            pinCode = orderDeliveryAddress[i].pinCode;
            mobile = orderDeliveryAddress[i].Contactmobile;
    	}
    }

    var itemInfo = '', style = null;
    var OrderDeliveryDate = [];
    var subtotal = 0, ship_hand_charges = 0, vat = 0, excise_duty = 0, total = 0; 
    //get induvidual Product details.
    for(var i = 0; i < orderItemInfo.length; i++)
    {
     	
    	OrderDeliveryDate.push(orderItemInfo[i].minDeliveryDate);

    	//Changing style of table row, if this is the last row, draw an border after this, indicating end of line items.
    	style = "padding:5px;color:#444444;font-size:14px;"
    	if(i === orderItemInfo.length-1){
    		style = "border-bottom:1px solid #e2e2e2;padding:5px;color:#444444;font-size:14px;"
    	}

    	var price = commaIt((orderItemInfo[i].price).toFixed(2), commaITConfig);
    	var itemSubTotal = commaIt((orderItemInfo[i].subTotal).toFixed(2), commaITConfig);

    	var itemInfo = itemInfo + 
    	'<tr>'+
	        '<td align="left" width="20%" style="'+style+'">'+
			    '<img width="105" border="0" alt="product-image" src='+ orderItemInfo[i].SKUImage + '>'+
			'</td>'+
		    '<td align="left" style="'+style+'">'+
			    '<p>'+
					'<span style="font-size:13px;text-align:left;float:left;">ID: '+ orderItemInfo[i].SKUId + '</span>'+
					'<br>'+
					'<a style="color:#444444;text-decoration:none;font-size:12px;text-align:left;float:left;" href="https://www.msupply.com/" target="_blank">'+
						'<span>'+ orderItemInfo[i].productName + '</span>'+
					'</a>'+
				'</p>'+
			'</td>'+
	        '<td width="120" align="left" style="'+style+'">'+
			    '<span><span>&#8377;</span> '+ price +'</span>'+
			'</td>'+
	        '<td align="left" style="'+style+'">'+ orderItemInfo[i].quantity +'</td>'+
	        '<td width="120" align="right" style="'+style+'">'+
			    '<span><span>&#8377;</span> '+ itemSubTotal +'</span>'+
			'</td>'+
		'</tr>';

		subtotal = subtotal + orderItemInfo[i].subTotal;
		vat = vat + orderItemInfo[i].VAT_Value;
		excise_duty = excise_duty + orderItemInfo[i].excise_Value;
	};

	ship_hand_charges = commaIt((orderfinancials.shippingAndHandlingCharges).toFixed(2), commaITConfig);
	total = subtotal + vat + excise_duty + orderfinancials.shippingAndHandlingCharges;
	total = commaIt((total).toFixed(2), commaITConfig);

	subtotal = commaIt((subtotal).toFixed(2), commaITConfig);
	vat = commaIt((vat).toFixed(2), commaITConfig);
    excise_duty = commaIt((excise_duty).toFixed(2), commaITConfig);

	//calculating minimum date of minimum delivery date of all line items.
	var minOrderDeliveryDate = new Date(Math.min.apply(null, OrderDeliveryDate));
	minOrderDeliveryDate = timezoneConversions.ConvertToIST(minOrderDeliveryDate);
	minOrderDeliveryDate = minOrderDeliveryDate.substring( 0, minOrderDeliveryDate.indexOf( "at" ) );
	
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
						  '<p style="margin-top:20px;color:#444444;font-size:18px;font-weight:normal;line-height:20px;margin-bottom:10px;"><b>Dear Supplier,</b></p>'+
						  '<p style="color:#000;font-size:14px;line-height:30px;margin:0;">You have received the following order from mSupply customer to be delivered by '+minOrderDeliveryDate+'.</p>'+
						  '<p style="color:#000;font-size:14px;line-height:30px;margin:0;">Request you to process the same.</p>'+
					  '</td>'+
					'</tr>'+
					'<tr>'+
						'<td style="padding:15px 30px 0;">'+
							 '<table width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;border:1px solid #efefef;">'+
							  '<tbody>'+
								'<tr width="722">'+
									'<td width="100%" style="padding: 20px 20px 0;float:left;width:705px;">'+
										'<h1 style="margin-top:5px;color:#1ca8a5;font-weight:400;font-size:18px;margin-bottom:5px;">ORDER ID: '+ orderId +'</h1>'+
										'<span style="color:#1ca8a5;font-size:10px;float:left;">Placed on '+ orderDate + '</span>'+
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
															    '<th align="left" style="font-size:11px;color:#637078;padding:20px 0 6px;border-bottom:1px solid #e2e2e2;">&nbsp;</th>'+													  
															    '<th width="70" align="left" style="font-size:11px;color:#637078;padding:20px 0 6px;border-bottom:1px solid #e2e2e2;">Price</th>'+
				                                                '<th align="left" style="font-size:11px;color:#637078;padding:20px 0 6px;border-bottom:1px solid #e2e2e2;">Qty</th>'+
															    '<th width="70" align="right" style="font-size:11px;color:#637078;padding:20px 0 6px;border-bottom:1px solid #e2e2e2;">Subtotal</th>'+
															'</tr>'+
														'</thead>'+
													    '<tbody bgcolor="#ffffff">'+
															itemInfo
																												  
													    +'</tbody>'+
														'<tbody>'+
															'<tr>'+
															    '<td colspan="6">'+
																    '<table width="100%" cellspacing="0" cellpadding="0">'+
																		'<tbody>'+
																			'<tr style="border-bottom:1px solid #d5d5d5">'+
																				'<td width="170" valign="top" colspan="4" style="border-bottom:none;padding-left:5px;padding-top:20px;padding-bottom:20px;">'+
																					'<b style="color:#637279;font-size:13px;float:left;">Shipping Address</b><br>'+
																					'<p style="color:#444;font-size:13px;">'+ CustomerName +' <br/>'+
																					addressLine1 +', <br/>'+ 
																					addressLine2+', <br/>'+ 
																					city + '-'+ pinCode +', <br/>'+ 
																					state+ '<br/>'+  
																					'Ph: '+ mobile +'<br/>'+
																				'</td>'+
																				'<td width="170" valign="top" style="border-bottom:none;padding-left:5px;padding-bottom:20px;padding-top:20px;" colspan="4">'+
																					'<b style="color:#637279;font-size:13px;float:left;">Payment Method</b><br>'+
																					'<p style="color:#444;font-size:13px;">'+ paymentMethod +'</p>'+
																				'</td>'+
																				'<td valign="bottom" style="padding-top:20px;padding-bottom: 20px;" colspan="4">'+
																					'<table width="100%" cellspacing="0" cellpadding="0" border="0" align="right">'+
																						'<tbody>'+
																							'<tr>'+
																							  '<td style="font-size:13px;color:#444444;padding:0 20px 12px;text-align:right;">Subtotal</td>'+
																							  '<td align="right" style="font-size:13px;color:#444444;padding:0 20px 12px;"><span><span>&#8377;</span>' + subtotal + '</span></td>'+
																							'</tr>'+
																							'<tr>'+
																							  '<td style="font-size:13px;color:#444444;padding:0 20px 12px;text-align:right;">Shipping &amp; Handling Charges</td>'+
																							  '<td align="right" style="font-size:13px;color:#444444;padding:0 20px 12px;"><span><span>&#8377;</span>'+ ship_hand_charges + '</span></td>'+
																							'</tr>'+
																							'<tr>'+
																							  '<td style="font-size:13px;color:#444444;padding:0 20px 12px;text-align:right;">VAT</td>'+
																							  '<td align="right" style="font-size:13px;color:#444444;padding:0 20px 12px;"><span><span>&#8377;</span>'+ vat + '</span></td>'+
																							'</tr>'+
																							'<tr>'+
																							  '<td style="font-size:13px;color:#444444;padding:0 20px 12px;text-align:right;">Excise Duty</td>'+
																							  '<td align="right" style="font-size:13px;color:#444444;padding:0 20px 12px;"><span><span>&#8377;</span>'+ excise_duty +'</span></td>'+
																							'</tr>'+
																							'<tr>'+
																							  '<td style="font-size:13px;color:#bd4931;padding:0 20px 12px;text-align:right;">Total</td>'+
																							  '<td align="right" style="font-size:13px;color:#444444;padding:0 20px 12px;"><span><span>&#8377;</span>'+ total +'</span></td>'+
																							'</tr>'+
																						'</tbody>'+
																					'</table>'+
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
							 '<p style="color:#627179;font-size:13px;margin:7px 0 22px;"><strong style="color:#1fa9a6;font-size:13px;">'+htmlGenericvalues.support_contactnumber+'</strong>&nbsp;or&nbsp;<a href="mailto:'+htmlGenericvalues.Supplier_support_email+'" style="text-decoration:none;color:#1fa9a6;font-size:13px;font-weight:bold;">'+htmlGenericvalues.Supplier_support_email+'</a></p>'+
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
