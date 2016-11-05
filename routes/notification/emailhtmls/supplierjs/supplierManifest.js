var TAG = "manifest.js- ";
var timezoneConversions = require('../../htmlEmailsSupportFile.js');
var underscore = require('underscore');

exports.getEmailBody = function(data){

	var orderId = data.orderId;

    // Order Delivery Address
	var orderDeliveryAddress = data.orderDeliveryAddress;
	var customerName = orderDeliveryAddress.customerFullName;
	var addressLine1 = orderDeliveryAddress.addressLine1; 
	var addressLine2 = orderDeliveryAddress.addressLine2;
	var city = orderDeliveryAddress.city;
	var state = orderDeliveryAddress.state; 
	var country = orderDeliveryAddress.country;
	var pinCode = orderDeliveryAddress.pinCode;
	var mobile = orderDeliveryAddress.mobile;

    var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
	  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
	];
    var today = timezoneConversions.toIST(new Date());
    var manifestDate = today.getDate() +' '+ monthNames[today.getMonth()]+' '+today.getFullYear();
    var itemInfo = '';
	var address = addressLine1 + ' ' + addressLine2;
	var cityState = city +','+state+'-'+pinCode;

	var orderItems = data.orderItemInfo;
	var skuids = data.skuids;
	
	//get induvidual Product details.
    for(var i = 0; i < orderItems.length; i++){
  
    	if(underscore.indexOf(skuids, orderItems[i].SKUId) === -1){
			continue;
		}

     	itemInfo = itemInfo + 
	   		'<tr>'+
		      '<td style="padding: 3px;">'+ (i+1) +'</td>'+
			  '<td style="padding: 3px;">'+ orderItems[i].SKUId +'</td>'+
			  '<td>'+ orderItems[i].productName +'</td>'+
			  '<td>'+ orderItems[i].quantity +'</td>'+
			  '<td> </td>'+
			  '<td>'+ orderItems[i].shipmentNo +'</td>'+
			'</tr>';
	};

	var manifest = '<!DOCTYPE html>'+
		'<html>'+
			'<head>'+
				'<meta charset="UTF-8">'+
				'<meta name="viewport" content="width=device-width, initial-scale=1.0">'+

				'<title>mSupply Manifest</title>'+
				'<style>'+
					' body{ margin:0; padding:0;font-family: Lato, Helvetica, sans-serif; }	'+
					'.m-main-fhead { background:#BD4931; color:#fff; font-family: Lato, Helvetica, sans-serif; width:100%;position:fixed; z-index:11111;'+
					'     padding:5px 15px; height:34px; line-height:34px; }'+
					'.m-body-content{ position: relative; top: 3em; }'+
					'.m-body-content p{ font-size: 12px; padding: 0px 7px; margin: 0px; line-height: 25px; }'+
		            '.list-group li { padding-left: 12px; padding-bottom: 10px; line-height: 22px; }'+
		            '.fieldnamelisttop { width:100%; float:left; }'+
		            '.fieldnamelisttop .text-left { float:left; width: 48%; }'+
		            '.fieldnamelisttop .text-right { float:right; width: 30%; }'+
		            '.table-list { width: 98%; margin: 15px; float: left; text-align:center;} '+
		            '.m-body-footer { width:100%; float:left; clear:both; }	'+
		            'table {'+
						'border-collapse: collapse;'+
						'border-spacing: 0;'+
						'overflow-x: auto;'+
				        'display: block;'+
						'border:0; font-size: 12px;'+
					'}	'+
		            '.m-body-footer img { max-width: 100%; width: 150px; height: auto; }'+
				'</style> '+
			'</head>'+

			'<body>'+
				'<div class="m-main-fhead col-xs-12">mSupply Manifest</div>'+
				'<div class="m-body-content">'+
				     '<div class="fieldnamelisttop">'+
				          '<p class="text-left"><span style="float:left;">Customer Name: </span><span style="float: left; margin-left: 5px;">'+customerName+'</span></p>'+
						  '<p class="text-right"><span style="float:left;">Order Id: </span><span style="float: left; margin-left: 5px;text-align:left;">'+orderId+'</span></p>'+
					 '</div>'+
					 '<div class="fieldnamelisttop">'+
				          '<p class="text-left"><span style="float:left;">Contact Number:</span><span style="float: left; margin-left: 5px;">'+mobile+'</span></p>'+
						  '<p class="text-right"><span style="float:left;">Manifest Date:</span><span style="float: left; margin-left: 5px;text-align:left;">'+manifestDate+'</span></p>'+
					 '</div>'+
					 '<div class="fieldnamelisttop" style="padding-top: 15px;">'+
				          '<p class="text-left"><span style="float:left;">Address:</span><span style="float:left;margin-left:15px;">'+address+'<br/>'+cityState+'</span></p>'+
					 '</div>'+
					 '<div class="table-list">'+
						  '<table border="1" width="100%" height="100%" cellpadding="6" cellspacing="0">'+
						   '<tbody>'+
							'<tr>'+
							      '<th>S.no</th>'+
							      '<th>SKU Code</th>'+
							      '<th>Product Description</th>'+
							      '<th>Quantity</th>'+
							      '<th>Weight (Per Unit)</th>'+
							      '<th>AWB Number</th>'+
							'</tr>'+
							itemInfo 
							+'</tbody>'
						+'</table>'+
					 '</div>'+
					 '<div class="m-body-footer">'+
						 '<span style="float:left;padding:10px;font-size:12px;">Customer Signature</span>'+
						 '<span style="float:right;padding:10px;">'+
								'<img alt="msupply" width="205" src="http://static.msupply.com/emailTemplate/registration_confirmation/registration_logo.png">'+
						  '</span>'+
					 '</div>'+
				'</div>'+		
			'</body>'+
		'</html>'; 
	return manifest;
}
								

	
