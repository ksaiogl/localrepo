//notificationIdentifier: 308
var TAG = "OrderDeliveredCustomerEmail- ";

var htmlSupport = require('../../htmlEmailsSupportFile.js');
var htmlGenericvalues = htmlSupport.generic_values;
var log = require('../../../../Environment/log4js.js');
var commaIt = require('comma-it');
var commaITConfig = {addPrecision:true, thousandSeperator : ',', decimalSeperator : '.'};
var urlConstants = require('../../../helpers/urlConstants');

exports.getHtml = function getHtml (emailBodyParams, callback){
try
{
  var logger = log.logger_notification;
 //get all Basic Order informtion
  var firstName = emailBodyParams.firstName;
  var orderId = emailBodyParams.orderId;
  var orderDate = emailBodyParams.orderDate;
  var orderItemInfo = emailBodyParams.orderItemInfo;
  var customerId = emailBodyParams.customerId;
  
  if(!(emailBodyParams.subTotal === null || emailBodyParams.discount === null ||
        emailBodyParams.shippingAndHandling === null || emailBodyParams.VAT === null ||
        emailBodyParams.serviceCharges === null || emailBodyParams.grandTotal === null ))
  {
    //get Order Finance details
    var subTotal = htmlSupport.isNumber(emailBodyParams.subTotal) ? commaIt(emailBodyParams.subTotal, commaITConfig) : emailBodyParams.subTotal;
    var discount = htmlSupport.isNumber(emailBodyParams.discount) ? commaIt(emailBodyParams.discount, commaITConfig) : emailBodyParams.discount;
    var discountCouponCode = emailBodyParams.discountCouponCode;
    var shippingAndHandling = htmlSupport.isNumber(emailBodyParams.shippingAndHandling) ? commaIt(emailBodyParams.shippingAndHandling, commaITConfig) : emailBodyParams.shippingAndHandling;
    var VAT = htmlSupport.isNumber(emailBodyParams.VAT) ? commaIt(emailBodyParams.VAT, commaITConfig) : emailBodyParams.VAT;
    var serviceCharges = htmlSupport.isNumber(emailBodyParams.serviceCharges) ? commaIt(emailBodyParams.serviceCharges, commaITConfig) : emailBodyParams.serviceCharges;
    var grandTotal = htmlSupport.isNumber(emailBodyParams.grandTotal) ? commaIt(emailBodyParams.grandTotal, commaITConfig) : emailBodyParams.grandTotal;

    var paymentMethod = emailBodyParams.paymentMethod;
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

    if(addressLine2 === null || addressLine2 === ""|| addressLine2.toString().trim().length === 0)
    {
      var addressDetails = addressLine1+'<br>'+city+' -'+pinCode+'<br>'+state+'<br>Ph: '+mobile;  
    }
    else
    {
      var addressDetails = addressLine1+'<br>'+addressLine2+'<br>'+city+' -'+pinCode+'<br>'+state+'<br>Ph: '+mobile;
    };

    //Dynamically form the Email Subject line.
    var emailSubject = "Delivery Confirmation for mSupply.com [Order No: "+orderId+"]. Please Share Feedback.";
    var surveyURL = urlConstants.getOrderSurveyURL()+"customer_id="+customerId+"&order_id="+orderId;
    //Dynamically form the HTML for each Order LineItem
    var itemInfo = '';
    var orderItems = emailBodyParams.orderItemInfo;
      //get induvidual Product details.
      for(var i = 0; i < orderItems.length; i++)
       {
	       	if(orderItems[i].itemStatus !== "Cancelled")
			{
		        var price = htmlSupport.isNumber(orderItems[i].price) ? commaIt(orderItems[i].price, commaITConfig) : orderItems[i].price;
		        var itemSubTotal = htmlSupport.isNumber(orderItems[i].subTotal) ? commaIt(orderItems[i].subTotal, commaITConfig) : orderItems[i].subTotal;
		        
		        var prodImage = '';
		        if(!(orderItems[i].SKUImage === null || orderItems[i].SKUImage.toString().trim().length === 0))
		        {
		          prodImage = '<a target="_blank" href="https://www.msupply.com/" style="text-decoration:none;float:left; text-align:left;">'+
						  	'<img border="0" width="100%" src='+orderItems[i].SKUImage+' alt="product-image">'+
					   		'</a>';
		        }

		        itemInfo = itemInfo + 
		        '<tr>'+
				   '<td width="30%" align="left" style="padding:5px;color:#444444;font-size:14px">'+
					prodImage +
				   '</td>'+
				   '<td align="left" style="padding:5px;">'+
						'<p>'+
							'<span style="font-size:13px;text-align:left;float:left;">ID:'+orderItems[i].SKUId+'</span>'+
							'<br/>'+
							'<a target="_blank" href="https://www.msupply.com/" style="color:#444444;text-decoration:none;font-size:12px;text-align:left;float:left;">'+
								'<span>'+orderItems[i].productName+'</span>'+
							'</a>'+
						'</p>'+
				   '</td>'+
				   '<td width="100" align="left" style="padding:5px;padding:2px;color:#444444;font-size:13px;">'+
					   '<span><span>&#8377;</span>'+price+'</span>'+
				   '</td>'+
				   '<td align="left" style="padding:5px;color:#444444;font-size:14px">'+orderItems[i].quantity+'</td>'+														
				   '<td width="100" align="right" style="padding:5px;color:#444444;font-size:14px">'+
					   '<span><span>&#8377;</span>'+itemSubTotal+'</span>'+
				   '</td>'+
				'</tr>';
	    	};
    	};  

      //get OrderFinance dynamicall, Only if the field is a nonzero field. CommaIt lib has changed the value to string.
      var orderFinance = '';
      if(discount !== "0.00")
      {  
        orderFinance = orderFinance + 
        '<tr>'+
          '<td style="font-size:12px;color:#444444;padding:10px 20px 5px;text-align:right">Discount('+discountCouponCode+')</td>'+
          '<td align="right" style="font-size:12px;color:#444444;padding:10px 20px 5px"><span><span>-₹</span>'+discount+'</span></td>'+
        '</tr>';
      }
      if(shippingAndHandling !== "0.00")
      {  
        orderFinance = orderFinance + 
        '<tr>'+
		  '<td style="font-size:12px;color:#444444;padding:10px 20px 5px;text-align:right;">Shipping & Handling Charges</td>'+
		  '<td align="right" style="font-size:12px;color:#444444;padding:10px 20px 5px;"><span><span>&#8377;</span>'+shippingAndHandling+'</span></td>'+
		'</tr>';
      }
      if(serviceCharges !== "0.00")
      { 
        orderFinance = orderFinance +
        '<tr>'+
		  '<td style="font-size:12px;color:#444444;padding:10px 20px 5px;text-align:right;">Service Charges (Including Service Tax)</td>'+
		  '<td align="right" style="font-size:12px;color:#444444;padding:10px 20px 5px;"><span><span>&#8377;</span>'+serviceCharges+'</span></td>'+
		'</tr>';
      }
      /*if(VAT !== "0.00")
      { 
        orderFinance = orderFinance +
        '<tr>'+
		  '<td style="font-size:12px;color:#444444;padding:10px 20px 5px;text-align:right;">VAT</td>'+
		  '<td align="right" style="font-size:12px;color:#444444;padding:10px 20px 5px;"><span><span>&#8377;</span>'+VAT+'</span></td>'+
		'</tr>';
      }*/

    	var emailBody =
		'<table align="center" width="800" cellspacing="0" cellpadding="0" border="0" style="font-size:medium;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;background:#ffffff;">'+  
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
					  '<table width="800" cellspacing="0" cellpadding="0" border="0" align="left" style="background:#f9f9f9;border-top:1px solid #dfdfdf;border-bottom:1px solid #dfdfdf;padding-top: 20px;">'+
						'<tbody>'+
							'<tr bgcolor="#bd4931" width="730" style="color:#fff;font-size:24px;height:45px;float:left;margin-right:30px;margin-left:31px;margin-bottom:0px;width:87%;padding:0px 20px;text-align:center;">'+
								'<td align="center">'+
									'<span style="text-align:center;width:100%;float:left;margin-top:8px;margin-left:152px;">Because Quality Matters</span>'+
								'</td>'+
							'</tr>'+
							'<tr style="margin-right:30px;margin-left:31px;float:left;width:87%;">'+
							  '<td style="color:#545454;font-size:14px">'+
							      '<p style="margin-top:20px;color:#444444;font-size:18px;font-weight:normal;line-height:20px;margin-bottom:10px;"><b>Hi '+firstName+'!</b>, </p>'+
								  '<p style="color:#000;font-size:14px;line-height:30px;">Your Order with Order no. <span style="color:#1ca8a5;">'+orderId+'</span> has been successfully delivered!</p>'+
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
																'<tr style="padding:20px 0 6px;border-bottom:1px solid #e2e2e2;margin:0 18px;">'+
																  '<th align="left" style="font-size:11px;color:#637078;padding:5px;border-bottom:1px solid #e2e2e2;">Product Name</th>'+
																  '<th align="left" style="font-size:11px;color:#637078;padding:5px;border-bottom:1px solid #e2e2e2;">&nbsp;</th>'+
																  '<th width="70" align="left" style="font-size:11px;color:#637078;padding:5px;border-bottom:1px solid #e2e2e2;">Price</th>'+
																  '<th align="left" style="font-size:11px;color:#637078;padding:5px;border-bottom:1px solid #e2e2e2;">Qty</th>'+													  
																  '<th width="70" align="right" style="font-size:11px;color:#637078;padding:5px;border-bottom:1px solid #e2e2e2;">Subtotal</th>'+
																'</tr>'+
															  '</thead>'+
															  '<tbody bgcolor="#ffffff">'+													
																itemInfo+
																	'<tr>'+
																	  '<td colspan="8" valign="right" align="right" style="border-top:1px solid #e2e2e2;padding:10px 0;">'+
																		 '<table width="80%" cellspacing="0" cellpadding="0" style="width:500px;float:right;">'+                                                                     																 
																			'<tr style="float:right;">'+
																				'<td colspan="2">'+
																					'<table width="100%" cellspacing="0" cellpadding="0" border="0" align="right" style="float:right;">'+
																					  '<tbody>'+																			        
																						    '<tr>'+
																							  '<td style="font-size:12px;color:#444444;padding:10px 20px 5px;text-align:right;">Subtotal</td>'+
																							  '<td align="right" style="font-size:12px;color:#444444;padding:10px 20px 5px;"><span><span>&#8377;</span>'+subTotal+'</span></td>'+
																							'</tr>'+
																							orderFinance+
																							'<tr>'+
																							  '<td style="font-size:12px;color:#bd4931;padding:10px 20px 5px;text-align:right;font-weight:bold;">Grand Total</td>'+
																							  '<td align="right" style="font-size:12px;color:#bd4931;padding:10px 20px 5px;font-weight:bold;"><span><span>&#8377;</span>'+grandTotal+'</span></td>'+
																							'</tr>'+
																					  '</tbody>'+
																					'</table>'+
																				'</td>'+
																			'</tr>'+
																		 '</table>'+
																	  '</td>'+
																	'</tr>'+
																	'<tr width="722">'+
																		'<td colspan="8" valign="left" align="left">'+
																			'<table style="border-top:1px solid #eaeaea;margin:0 15px 35px;padding-top:20px;">'+
																				'<tr>'+
																					'<td width="300">'+
																						'<b style="color:#637279;font-size:12px;float:left;">Shipping Address</b><br>'+
																						'<p style="color:#444;font-size:12px;line-height:18px;">'+customerFullName+'<br>#'+addressDetails+'</p>'+
																					'</td>'+	
																					'<td width="700" valign="top">'+
																						'<b style="color:#637279;font-size:12px;float:left;">Payment Method</b><br>'+
																						'<p style="color:#444;font-size:12px;line-height:18px;">'+paymentMethod+'</p>'+
																					'</td>'+
																				'</tr>'+
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
							'<tr>'+
								'<td style="padding:15px 30px 0;">'+
								    '<table width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ffea9b;">'+
										'<tbody>'+
											'<tr width="722">'+
												'<td width="100%" style="padding:13px 20px 11px;float:left;width:705px;">'+
												    '<span style="text-align:left;float:left;color:#000;font-size:14px;">We count your feedback to Improve our service!</span>'+
									                '<span style="text-align:left;float:left;color:#000;font-size:14px;">Share your experience with mSupply.com and help us Improve to serve you better!</span>'+
												'</td>'+
											'</tr>'+
									    '</tbody>'+
									'</table>'+
								'</td>'+
							'</tr>'+					
		                    '<tr align="center">'+
							   '<td style="padding:25px 0px 0px;" align="center" width="100%">'+
								   '<a href='+surveyURL+' target="_blank">'+
									  '<img alt="Submit Response" src="http://static.msupply.com/emailTemplate/leave_feedback_btn.png" style="text-align:center;">'+
								   '</a>'+
							   '</td>'+ 
							'</tr>'+					
							'<tr>'+							
								'<td width="100%" align="center" style="float:left;margin:13px 20px 0px;padding-bottom:5px;">'+
									 '<p style="color:#444;font-size:12px;margin-bottom:0;font-weight:bold;">Contact us in case you have any questions or need further assistance</p>'+
									 '<p style="color:#444;font-size:14px;margin:7px 0 14px;"><span style="color:#bd462d;font-size:13px;">'+htmlGenericvalues.support_contactnumber+'</span>&nbsp;or&nbsp;<a style="text-decoration:none;color:#bd462d;font-size:13px;" href="mailto:'+htmlGenericvalues.customer_support_email+'">'+htmlGenericvalues.customer_support_email+'</a></p>'+											 
								'</td>'+
							'</tr>'+
							'<tr align="center">'+
							   '<td style="padding: 0px 0 10px;" align="center" width="100%">'+
								   '<a href="https://www.msupply.com/" target="_blank">'+
									  '<img width="722" alt="mSupply Benefits" src="http://static.msupply.com/emailTemplate/registration_confirmation/buy_seek_corporation_banner.png" style="text-align:center;">'+
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
								   '<a style="text-align:center;text-decoration:none;color:#637279;font-weight:normal;" href="mailto:'+htmlGenericvalues.customer_support_email+'" target="_top">'+htmlGenericvalues.customer_support_email+'</a>'+
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
  else
  {
    logger.error(TAG + "OrderFinance details received have null values - OrderDeliveredCustomerEmail- getHtml");
    return callback(true, "Null Validation Error");
  }  
}
catch(e)
{
  console.log(TAG + "Exception in HTML OrderDeliveredCustomerEmail- getHtml - " + e);
  logger.error(TAG + "Exception in HTML OrderDeliveredCustomerEmail- getHtml- :- error :" + e);
  return callback(true, "Exception error");
}
};