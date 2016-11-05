//Functions to call JAVA API's (MongoDB).
var TAG = "javaProductAPI -";

var request = require("request");
var log = require('../../Environment/log4js.js');
var env = require('../../Environment/env.js').env;

exports.getProductMOQ = function getProductMOQ(sellerId, skuId, unitPrice, callback){

	//pincode is hardcoded for Bangalore.
	var pincode = "560001";
	//var requestquery = "http://elb-msupply-tomcat-prd-192241706.eu-west-1.elb.amazonaws.com/SellerProject/api/v1.0/sellerMoq?sellerId=" + sellerId + "&pincode=" + pincode + "&productSku=" + skuId + "&unitPrice=" + unitPrice;
	var logger = log.logger_sup;

	var productMOQURL;
    if (env === "prd")
    {
        productMOQURL = "http://tomcat.msupply-internal.local/SellerProject/api/v1.0/sellerMoq?sellerId=" + sellerId + "&pincode=" + pincode + "&productSku=" + skuId + "&unitPrice=" + unitPrice;
    }
    else if (env === "stg")
    {
        productMOQURL = "http://tomcat.msupply-internal.local/SellerProject/api/v1.0/sellerMoq?sellerId=" + sellerId + "&pincode=" + pincode + "&productSku=" + skuId + "&unitPrice=" + unitPrice;
    }
    else
    {
        productMOQURL = "http://tomcat.msupply.com/SellerProject/api/v1.0/sellerMoq?sellerId=" + sellerId + "&pincode=" + pincode + "&productSku=" + skuId + "&unitPrice=" + unitPrice;
    }


	var encodedURI = encodeURI(productMOQURL); // Encoding the URL to be passed

	// Making Request
	request({url:encodedURI, method:'GET'},function(error,response,result){
		result = JSON.parse(result);
		if(!error && result.http_code === 200) //Java API output has http_code in number.
		{
			logger.debug(TAG + "Product MOQ fetched successfully for seller ID : " + sellerId + " and skuId : " + skuId);
			return callback(false, result);
		}
		else if(!error && result.http_code !== 200)
		{
			logger.error(TAG + "Error fetching Product MOQ from Magento API. error: " + JSON.stringify(result));
			return callback(true, error);
		}
		else
		{
			logger.error(TAG + "Error fetching Product MOQ from Magento API. error: " + error);
			return callback(true, error);
		}
	});
};
