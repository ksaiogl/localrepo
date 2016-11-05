//File that calls host/supplier/mysqlchangepassword api and send the response sent by api to caller.
var TAG = "MagentoAPI -";
var env = require('../../Environment/env.js').env;

var querystring = require('querystring');
var http = require('http');
var request = require("request");

var log = require('../../Environment/log4js.js');
var host_detail = require('../../Environment/hostDetails.js');

exports.updatePasswordInMagento = function updatePasswordInMagento(customer_id, passwordHash, callback){
	//Variable for Logging the messages to the file.
    var logger = log.logger_sup;
    var WHICH_HOST = host_detail.WHICH_HOST;

	var url = 'http://'+WHICH_HOST.host+':'+WHICH_HOST.port+'/serviceProvider/api/mysqlchangepassword';

	request({
	    url: url, //URL to hit
	    method: 'POST',
	    json: {
	        "customer_id" : customer_id,
	    	"passwordHash" : passwordHash
	    }
	}, function(error, response, body){
	    if(error) {
	        logger.error(TAG + "Password updation failed in mysql database.error: " + error);
 	        return callback(true, error);
	    }
	    else {
 	    	if(body.http_code === "200")
            {
            	logger.debug(TAG + "Password updation successfull in mysql database.");
	 	    	return callback(false, body);
            }
            else{
            	logger.error(TAG + "Password updation failed in mysql database. result: " + JSON.stringify(body));
             	return callback(true, body);
            }
		}
	});
};

exports.registerInMagento = function registerInMagento(req, callback){
	//Variable for Logging the messages to the file.
    var logger = log.logger_sp;
    var WHICH_HOST = host_detail.WHICH_HOST;

	var url = 'http://'+WHICH_HOST.host+':'+WHICH_HOST.port+'/serviceProvider/api/registeruser';

	request({
	    url: url, //URL to hit
	    method: 'POST',
	    json: {
	        "mobile" : req.body.mobile,
		    "email" : req.body.email,
		    "password": req.body.password,
		    "firstName": req.body.firstName,
		    "lastName": req.body.lastName
	    }
	}, function(error, response, body){
	    if(error) {
	        logger.error(TAG + "Registration failed in mysql database.error: " + error);
            return callback(false, error, null, null);
	    }
	    else {
 	    	if(body.http_code === "200")
            {
            	logger.debug(TAG + "Registration successfull in mysql database.");
				logger.debug(TAG + ""+JSON.stringify(body.message));

		    	if( ( body.message.customerId_email === body.message.customerId_mobile ) ||
		    		( body.message.customerId_email === 'null' && body.message.customerId_mobile !== 'null') ||
		    		( body.message.customerId_email !== 'null' && body.message.customerId_mobile === 'null') )  {

		    		var customer_id = body.message.customerId_email !== 'null' ?  body.message.customerId_email : body.message.customerId_mobile;
		    		customer_id = parseInt(customer_id);
		    		return callback(true, body, customer_id, body.message.customer_status);
		    	}
		    	return callback(false, body, null, null);
            }
            else{
            	logger.error(TAG + "Registration failed in mysql database. result: " + JSON.stringify(body));
            	return callback(false, body.message, null, null);
            }
		}
	});
};

exports.updateProfileDetailsInMagento = function updateProfileDetailsInMagento(req, callback){
	//Variable for Logging the messages to the file.
    var logger = log.logger_sp;
    var WHICH_HOST = host_detail.WHICH_HOST;

	var url = 'http://'+WHICH_HOST.host+':'+WHICH_HOST.port+'/serviceProvider/api/updateprofiledetails';

	request({
	    url: url, //URL to hit
	    method: 'POST',
	    json: {
	        "mobile" : req.body.accountInfo.mobile,
		    "email" : req.body.accountInfo.email,
		    "firstName": req.body.accountInfo.firstName,
		    "lastName": req.body.accountInfo.lastName,
		    "serviceProviderId":req.body.serviceProviderId
	    }
	}, function(error, response, body){
	    if(error) {
	        logger.error(TAG + "Account Details updation failed in mysql database. error: " + error);
            return callback(false, error);
	    }
	    else {
 	    	if(body.http_code === "200")
            {
            	logger.debug(TAG + "Account Details updation successfull in mysql database.");
		    	return callback(true, body);
            }
            else{
            	logger.error(TAG + "Account Details updation failed in mysql database. result: " + JSON.stringify(body));
            	return callback(false, body);
            }
		}
	});
};

exports.getProductDetailsAPI = function getProductDetailsAPI(req, callback){
//Get API from Magento

	var sellerId = req.body.sellerId;
	var skuId = req.body.skuId;
	//var requestquery = magentoPricingURL;s
	var logger = log.logger_sup;

	//Get correct Magento URL accrding to the environment.
	var magentoPricingURL;
    if (env === "prd")
    {
        magentoPricingURL = "http://52.18.252.197/msupply.in/services/api.php?method=getSkuDetails&sellerCode=" + sellerId + "&sku=" + skuId;
    }
    else if (env === "stg")
    {
        magentoPricingURL = "http://52.18.252.197/msupply.in/services/api.php?method=getSkuDetails&sellerCode=" + sellerId + "&sku=" + skuId;
    }
    else
    {
        magentoPricingURL = "http://52.18.252.197/msupply.in/services/api.php?method=getSkuDetails&sellerCode=" + sellerId + "&sku=" + skuId;
    }

	request(magentoPricingURL, function(err, response, result) {
		if(!err)
		{
			logger.debug(TAG + "Product details fetched successfully for seller ID : " + sellerId + " and skuId : " + skuId);
			return callback(false, result);
		}
		else
		{
			logger.error(TAG + "Error fetching Product details from Magento API. error: " + err);
			return callback(true, "Failed");
		}
	});
};

exports.getCustomerDetailsFromMagento = function getCustomerDetailsFromMagento(customer_id, callback){
	//Variable for Logging the messages to the file.
    var logger = log.logger_rfq;
    var WHICH_HOST = host_detail.WHICH_HOST;
    logger.info('Calling get customer detail for customer id : - ' + customer_id);

	var url = 'http://'+WHICH_HOST.host+'/user/api/v4.0/getUserDetails';
	request({
	    url: url, //URL to hit
	    method: 'POST',
	    json: {
	        "customer_id" : customer_id
	    }
	}, function(error, response){
	    if(error) {
	        logger.error(TAG + " Fetching customer account details failed in mysql database. error: " + error);
            return callback(true, error);
	    }
	    else {
 	    	if(response.statusCode === 200)
            {
            	logger.debug(TAG + " Fetching customer account details successfull in mysql database.");
		    	return callback(false, response);
            }
            else{
            	logger.error(TAG + " Fetching customer account details failed in mysql database. result: " + JSON.stringify(response));
            	return callback(true, response);
            }
		}
	});
};

exports.getCompanyDetailsFromMagento = function getCompanyDetailsFromMagento(input, callback){
	//Variable for Logging the messages to the file.
    var logger = log.logger_rfq;
    var MAGENTO_HOST = host_detail.MAGENTO_HOST;
	
	//If input.company_id , then avoid calling api and return with null.
    if(input.company_id === null){
    	logger.debug(TAG + " avoiding calling magento api since company_id is null.");
		return callback(false, null);
    }

    var url = '';
    if(MAGENTO_HOST.host === "customer.msupply.com"){
    	url = 'http://customer.msupply.com/services/api.php';
    }
    else{
    	url = 'http://'+MAGENTO_HOST.host+'/var/customerservices/api.php';
    }

	request({
	    url: url, //URL to hit
	    method: 'POST',
	    json: {
	    	"method": "viewCompany",
	    	"company_id": input.company_id,
			"customer_id": input.customer_id
	    }
	}, function(error, response){
	    if(error) {
	        logger.error(TAG + " Fetching company details failed in mysql database. error: " + error);
            return callback(true, error);
	    }
	    else {
	    	console.log("Magento response:");
	    	console.log(JSON.stringify(response));
 	    	if(response.statusCode === 200)
            {
            	logger.debug(TAG + " Fetching company details successfull in mysql database.");
		    	return callback(false, response.body.message);
            }
            else{
            	logger.error(TAG + " Fetching company details failed in mysql database. result: " + JSON.stringify(response));
            	return callback(true, response);
            }
		}
	});
};

exports.getDetailsOfCustomerFromMagento = function getDetailsOfCustomerFromMagento(customer_id, callback){
	//Variable for Logging the messages to the file.
    var logger = log.logger_rfq;
    var MAGENTO_HOST = host_detail.MAGENTO_HOST;
	
	var url = '';
    if(MAGENTO_HOST.host === "customer.msupply.com"){
    	url = 'http://customer.msupply.com/services/api.php';
    }
    else{
    	url = 'http://'+MAGENTO_HOST.host+'/var/customerservices/api.php';
    }
	
	request({
	    url: url, //URL to hit
	    method: 'POST',
	    json: {
	    	"method": "viewCustomer",
			"customer_id": customer_id
	    }
	}, function(error, response){
	    if(error) {
	        logger.error(TAG + " Fetching customer account details failed in mysql database. error: " + error);
            return callback(true, error);
	    }
	    else {
	    	
 	    	if(response.statusCode === 200)
            {
            	logger.debug(TAG + " Fetching customer account details successfull in mysql database.");
		    	//console.log( response);
		    	return callback(false, response);
            }
            else{
            	logger.error(TAG + " Fetching customer account details failed in mysql database. result: " + JSON.stringify(response));
            	return callback(true, response);
            }
		}
	});
};
