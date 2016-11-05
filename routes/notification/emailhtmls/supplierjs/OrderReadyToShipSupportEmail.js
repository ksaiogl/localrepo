//notificationIdentifier: 110
//Orders Ready to Ship Notification for fulfillment Team.
var TAG = "OrderReadyToShipSupportEmail.js";
var htmlSupport = require('../../htmlEmailsSupportFile.js');
var htmlGenericvalues = htmlSupport.generic_values;
var log = require('../../../../Environment/log4js.js');
var commaIt = require('comma-it');
var underscore = require('underscore');
var commaITConfig = {addPrecision:true, thousandSeperator : ',', decimalSeperator : '.'};

exports.getHtml = function getHtml(emailBodyParams, callback){
try
{
	var logger = log.logger_notification;
	var orderId = emailBodyParams.orderId;
	var orderDate = emailBodyParams.orderDate;
	var minDeliveryDate =  emailBodyParams.minDeliveryDate;
	var supplierName = emailBodyParams.supplierName;
    var supplierPOC = emailBodyParams.supplierPOC;
    var supplierPincode = emailBodyParams.supplierPincode;
    var supplierPickupContact = emailBodyParams.supplierPickupContact;
    var grossTotal = emailBodyParams.grossTotal;
    var grossTotal_A = emailBodyParams.grossTotal_A;
    var customerRefunds = emailBodyParams.customerRefunds;
    var skuids = emailBodyParams.skuids;
    // Supplier pickup Address
    var supplierPickupAddress = emailBodyParams.supplierPickupAddress;
    var supplierAddressLine1 = supplierPickupAddress.address1;
    var supplierAddressLine2 = supplierPickupAddress.address2;
    var supplierCity = supplierPickupAddress.city;
    var supplierstate = supplierPickupAddress.state;
    var supplierPinCode = supplierPickupAddress.pincode;
    if(supplierAddressLine2 === null || supplierAddressLine2.toString().trim().length === 0){
    	supplierPickupAddress = supplierAddressLine1+','+supplierCity+', '+supplierstate+'-'+supplierPinCode;
    }
    else{
    	supplierPickupAddress = supplierAddressLine1+','+ supplierAddressLine2+','+supplierCity+', '+supplierstate+'-'+supplierPinCode;
    };
    // Order Delivery Address
	var orderDeliveryAddress = emailBodyParams.orderDeliveryAddress;
	var customerFullName = orderDeliveryAddress.customerFullName;
	var addressLine1 = orderDeliveryAddress.addressLine1; 
	var addressLine2 = orderDeliveryAddress.addressLine2;
	var city = orderDeliveryAddress.city;
	var state = orderDeliveryAddress.state; 
	var country = orderDeliveryAddress.country;
	var pinCode = orderDeliveryAddress.pinCode;
	var mobile = orderDeliveryAddress.mobile;
    if(addressLine2.toString().trim().length === 0){
    	orderDeliveryAddress = addressLine1+','+city+','+state;
    }
    else{
    	orderDeliveryAddress = addressLine1+','+addressLine2+','+city+','+state;
    };
	var emailSubject = "Order No: "+orderId+" is Ready for 3PL pickup";

	var each3PL = '';
	var orderItems = emailBodyParams.orderItemInfo;

	// Get the Distinct 3PL from the LineItems.
	var items3PLName = [];
	for(var j = 0; j < orderItems.length; j++){
		if(orderItems[j].itemStatus !== "Cancelled" && orderItems[j].shippedBySeller === false)
		{	
			if(underscore.indexOf(items3PLName, orderItems[j].threePLName) === -1)
			{
				items3PLName.push(orderItems[j].threePLName);
			}
		}	
	};
	// For each 3PL get the list of Order Line Items to be displayed.
	for(var k = 0; k < items3PLName.length; k++){	
	    //get induvidual Line Item Product details.
	    var itemInfo = '';
	    var orderDeliveryDates = [];
	    for(var i = 0; i < orderItems.length; i++){

	    	if(underscore.indexOf(skuids, orderItems[i].SKUId) === -1){
				continue;
			}

	    	if(orderItems[i].itemStatus !== "Cancelled" && orderItems[i].shippedBySeller === false)
			{
		    	if (items3PLName[k] === orderItems[i].threePLName)
		    	{	
			    	var price = htmlSupport.isNumber(orderItems[i].price) ? commaIt(orderItems[i].price, commaITConfig) : orderItems[i].price;
			    	var itemSubTotal = htmlSupport.isNumber(orderItems[i].subTotal) ? commaIt(orderItems[i].subTotal, commaITConfig) : orderItems[i].subTotal;
			    	var quantity = orderItems[i].quantity;
			    	orderDeliveryDates.push(new Date(orderItems[i].minDeliveryDate));

					itemInfo = itemInfo + 
					'<tr>'+
	                    '<td align="left" style="padding:5px;color:#444444;font-size:14px">'+
						    '<img width="105" border="0" alt="product-image" src='+orderItems[i].SKUImage+'>'+
						'</td>'+
					    '<td align="left" style="padding:5px;color:#444444">'+
						    '<p>'+
								'<span style="font-size:13px;text-align:left;float:left">ID: '+orderItems[i].SKUId+'</span>'+
								'<br>'+
								'<a style="color:#444444;text-decoration:none;font-size:12px;text-align:left;float:left" href="https://www.msupply.com/" target="_blank">'+
									'<span>'+ orderItems[i].productName+'</span>'+
								'</a>'+
							'</p>'+
						'</td>'+
	                    '<td width="120" align="left" style="padding:5px;color:#444444;font-size:14px">'+
						    '<span><span>₹</span>'+price+'</span>'+
						'</td>'+
	                    '<td align="left" style="padding:5px;color:#444444;font-size:14px">'+quantity+'</td>'+															
	                    '<td width="120" align="right" style="padding:5px;color:#444444;font-size:14px">'+
						    '<span><span>₹</span>'+itemSubTotal+'</span>'+
						'</td>'+
					'</tr>';
				}
			}		
		};
		// get the minimumOrderDeliveryDate for each of the 3PL.
		var minOrderDeliveryDate = Math.min.apply(null, orderDeliveryDates);
		minOrderDeliveryDate = htmlSupport.ConvertToIST(new Date(minOrderDeliveryDate));

		each3PL = each3PL + 
		'<tr>'+
			'<td style="padding:0 30px">'+
				'<table width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;border:1px solid #efefef;margin-bottom:10px">'+
				  '<tbody>'+
					'<tr>'+
						'<td align="left" style="color:#444;font-size:14px;padding:10px 15px"><b>Line Items to be picked up:</b></td><td><br>'+
					'</td></tr>'+
					'<tr>'+
						'<td>'+
							'<table width="100%" cellspacing="0" cellpadding="0" border="0" style="width:97%;margin:0 15px">'+
								'<tr>'+
									'<td align="left" style="color:#444;font-size:14px;padding:5px 15px 5px 5px">Picked By: <span style="padding-left:10px">'+items3PLName[k]+'</span></td>'+
						            '<td align="right" style="color:#444444;font-size:14px;padding:5px 15px 5px 5px">Deliver By: '+minOrderDeliveryDate+'</td>'+
					            '</tr>'+
                            '</table>'+
                        '</td>'+
                    '</tr>'+									
					'<tr>'+
						'<td>'+
							'<table width="100%" cellspacing="0" cellpadding="0" border="0" style="width:97%;margin:0 15px">'+
								'<tr>'+
									'<td style="color:#3a3a3a;font-size:14px" colspan="6">'+
										'<table width="100%" cellspacing="0" cellpadding="0" border="0">'+
										    '<thead>'+
												'<tr>'+
												    '<th align="left" style="font-size:11px;color:#637078;padding:20px 0 6px;border-bottom:1px solid #e2e2e2">Product Name</th>'+
												    '<th align="left" style="font-size:11px;color:#637078;padding:20px 0 6px;border-bottom:1px solid #e2e2e2"> </th>'+															  
												    '<th width="70" align="left" style="font-size:11px;color:#637078;padding:20px 0 6px;border-bottom:1px solid #e2e2e2">Price</th>'+
	                                                '<th align="left" style="font-size:11px;color:#637078;padding:20px 0 6px;border-bottom:1px solid #e2e2e2">Qty</th>'+
												    '<th width="70" align="right" style="font-size:11px;color:#637078;padding:20px 0 6px;border-bottom:1px solid #e2e2e2">Subtotal</th>'+
												'</tr>'+
											'</thead>'+
										    '<tbody bgcolor="#ffffff">'+
											itemInfo +	
										    '</tbody>'+														
										'</table>'+
									'</td>'+
								'</tr>'+
							'</table>'+
						'</td>'+
					'</tr>'+
				'</tbody></table>'+
			'</td>'+
		'</tr>';
	};

	if(customerRefunds !== null && grossTotal_A !== null)
	{	
		var totalAmount =
		'<tr><td align="left" style="color:#444;font-size:14px;padding:5px 10px 5px">Total Order Amount: '+grossTotal+'</td></tr>'+
		'<tr><td align="left" style="color:#444;font-size:14px;padding:5px 10px 5px">Total Order Amount_A: '+grossTotal_A+'</td></tr>'+
		'<tr><td align="left" style="color:#444;font-size:14px;padding:5px 10px 5px">Customer Refunds: '+customerRefunds+'</td></tr>'+
		'<tr><td align="left" style="color:#444;font-size:14px;padding:5px 10px 5px"> * Total order Amount_A is the new order total after taking into account the supplier cancellations.</td></tr>';
	}
	else
	{
		var totalAmount =
		'<td align="left" style="color:#444;font-size:14px;padding:5px 10px 5px">Total Order Amount: '+grossTotal+'</td>';
	};

	var emailBody =
			'<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"><html><head><META http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><table align="center" width="800" cellspacing="0" cellpadding="0" border="0" style="font-size:medium;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;background:#ffffff">'+  
    '<tbody>'+
		'<tr>'+
            '<td align="center" width="40%" style="padding:10px 0px">'+
                '<a href="https://www.msupply.com/" target="_blank">'+
					'<img alt="msupply" width="304" src="http://static.msupply.com/emailTemplate/EmailTemplateLogo.png">'+
				'</a>'+
            '</td>'+
        '</tr>'+
		'<tr>'+
			'<td>'+
			  '<table width="800" cellspacing="0" cellpadding="0" border="0" align="left" style="background:#f9f9f9;border-top:1px solid #dfdfdf;border-bottom:1px solid #dfdfdf;padding-top:20px">'+
				'<tbody>'+
					'<tr style="margin-right:30px;margin-left:31px;float:left;width:92%">'+
					    '<td style="color:#545454;font-size:14px">'+
						    '<p style="margin-top:20px;color:#444444;font-size:18px;font-weight:normal;line-height:20px;margin-bottom:10px">Hi mSupply Team,</p>'+
						    '<p style="color:#000;font-size:14px;line-height:30px;margin:0 0 10px">The following order has been marked ready to be shipped</p>'+
					    '</td>'+
					'</tr>'+
					'<tr>'+
					    '<td height="35" colspan="6">'+
							'<table cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0px 26px;width:94%">'+
								'<tbody>'+
									'<tr>'+
									    '<td width="400" style="color:#444444;font-size:14px;padding:5px 15px 5px 5px;width:53%"><span style="width:170px;float:left">Supplier</span>:<span style="padding-left:10px">'+supplierName+'</span></td>'+
                                        '<td align="right" style="color:#444444;font-size:14px;padding:5px;float:right;width:auto"><span style="float:left;text-align:left;width:80px">Order No</span>:<span style="padding-left:5px;float:right;width:auto">'+orderId+'</span></td>'+
                                        //'<td align="right" style="color:#444444;font-size:14px;padding:5px;float:right;width:120%">Order No:<span style="padding-left:5px;float:right;width:50%">'+orderId+'</span></td>'+									    
									'</tr>'+
									'<tr>'+
										'<td align="left" width="50%" style="color:#444444;font-size:14px;padding:5px 15px 5px 5px"><span style="width:170px;float:left">Supplier Contact Person</span>:<span style="padding-left:10px">'+supplierPOC+'</span></td>'+
										'<td align="right" style="color:#444444;font-size:14px;padding:5px;float:right;width:auto"><span style="float:left;text-align:left;width:80px">Order Date</span>:<span style="padding-left:5px;float:right">'+orderDate+'</span></td>'+
										//'<td align="right" style="color:#444444;font-size:14px;padding:5px;float:right;width:120%">Order Date: '+orderDate+'</td>'+
									'</tr>'+
                                    '<tr>'+
										'<td align="left" style="float:left;color:#444;font-size:14px;padding:5px"><span style="width:170px;float:left">Pickup Contact Details</span>:<span style="padding-left:9px">'+supplierPickupContact+'</span></td>'+
									'</tr>'+
									'<tr style="float:left;width:100%">'+
										'<td align="left" style="color:#444;font-size:14px;padding:5px"><span style="width:170px;float:left">Supplier Pickup Address</span>:</td>'+
										'<td align="left" style="color:#444;font-size:14px;padding:5px">'+supplierAddressLine1+'</td>'+
									'</tr>'+	
									'<tr style="float:left;width:100%">'+
										'<td align="left" style="color:#444;font-size:14px;padding:5px"><span style="width:170px;float:left">'+           '</span></td>'+
										'<td align="left" style="color:#444;font-size:14px;padding:5px"><span style="padding-left:5px">'+supplierAddressLine2+'</span></td>'+
									'</tr>'+
									'<tr style="float:left;width:100%">'+
										'<td align="left" style="color:#444;font-size:14px;padding:5px"><span style="width:170px;float:left">'+           '</span></td>'+
										'<td align="left" style="color:#444;font-size:14px;padding:5px"><span style="padding-left:5px">'+supplierCity+','+supplierstate+'</span></td>'+
									'</tr>'+
									'<tr>'+
										'<td align="left" style="color:#444;font-size:14px;padding:5px"><span style="width:170px;float:left">Pincode</span>:<span style="padding-left:10px">'+supplierPinCode+'</span></td>'+
									'</tr>'+							
							    '</tbody>'+
							'</table>'+
						'</td>'+
					'</tr>'
					+
					each3PL +
					'<tr>'+
						'<td colspan="6">'+
							'<table width="100%" cellspacing="0" cellpadding="0" style="width:96%;margin:0 15px">'+
								'<tbody>'+
									'<tr>'+
										'<td align="left" style="color:#444;font-size:14px;padding:20px 15px 5px">Customer Name: '+customerFullName+'</td>'+
									'</tr>'+	
									'<tr>'+
										//'<td align="left" width="130" style="color:#444;font-size:14px;padding:10px 15px 5px">Shipping Address:</td>'+
										'<td align="left" width="130" style="color:#444;font-size:14px;float:left;padding:10px 0px 5px 15px;width:20%">Shipping Address:</td>'+
										'<td align="left" style="float:left;color:#444;font-size:14px;padding:10px 15px 5px">'+addressLine1+'</td>'+
										//'<td align="left" style="color:#444;font-size:14px;padding:10px 15px 5px">'+addressLine1+'</td>'+
									'</tr>'+	
									'<tr>'+
										'<td align="left" width="130" style="color:#444;font-size:14px;float:left;padding:10px 0px 5px 15px;width:20%"> </td>'+
										//'<td align="left" width="130" style="color:#444;font-size:14px;padding:10px 15px 5px"> </td>'+
										//'<td align="left" style="color:#444;font-size:14px;padding:10px 15px 5px">'+addressLine2+'</td>'+
										'<td align="left" style="float:left;color:#444;font-size:14px;padding:10px 15px 5px">'+addressLine2+'</td>'+
									'</tr>'+
									'<tr>'+
										'<td align="left" width="130" style="color:#444;font-size:14px;float:left;padding:10px 0px 5px 15px;width:20%"> </td>'+
										'<td align="left" style="float:left;color:#444;font-size:14px;padding:10px 15px 5px">'+city+' '+state+'</td>'+
										//'<td align="left" width="130" style="color:#444;font-size:14px;padding:10px 15px 5px"> </td>'+
										//'<td align="left" style="color:#444;font-size:14px;padding:10px 15px 5px">'+city+','+state+'</td>'+
									'</tr>'+	
									'<tr>'+
										'<td align="left" style="color:#444;font-size:14px;padding:10px 15px 5px">Pincode: '+pinCode+'</td>'+
									'</tr>'+
									//'<tr>'
									//+
									totalAmount +
								'</tbody>'+
							'</table>'+
						'</td>'+
					'</tr>'+	
					'<tr align="center">'+
						'<td width="100%" align="center" style="float:left;margin:20px 20px 0px;padding-bottom:20px">'+
							 '<span style="color:#000;font-size:19px">Kindly Communicate the same to the 3PL partners!</span>'+
						'</td>'+
				    '</tr>'+				
				 '</tbody>'+
				'</table>'+	
			'</td>'+
		'</tr>'+
		'<tr>'+
		  '<td>'+
			'<table width="100%" cellspacing="0" cellpadding="0" border="0" style="padding-top:15px">'+
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
						'<span style="color:#637279;font-size:10px;text-align:center">'+htmlGenericvalues.office_address+'</span>'+
					'</td>'+
				'</tr>'+
			  '</tbody>'+
			'</table>'+
			'</td>'+
		'</tr>'+
	'</tbody>'+
'</table></body></html>';
	return callback(false, emailBody, emailSubject);	  
}
catch(e)
{
  console.log(TAG + "Exception in HTML OrderReadyToShipSupportEmail- getHtml - " + e);
  logger.error(TAG + "Exception in HTML OrderReadyToShipSupportEmail- getHtml- :- error :" + e);
  return callback(true, "Exception error");
}

};