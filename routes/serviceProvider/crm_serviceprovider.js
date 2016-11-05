//This file is used to call update API's of crm with respect to service provider.

var TAG = "crm_serviceprovider.js -";
var env = require('../../Environment/env.js').env;

var querystring = require('querystring');
var http = require('http');
var request = require("request");

var log = require('../../Environment/log4js.js');
var host_detail = require('../../Environment/hostDetails.js');

//Function that will call the upload API of crm on new registration.
exports.crmRegistration = function crmRegistration(serviceProviderId, callback){
	var logger = log.logger_sp;
	var DEPLOYED_HOST = host_detail.DEPLOYED_HOST;
	var finalResponse = '';
	var url = 'http://' + DEPLOYED_HOST.host + '/crm/affiliate/api/v1.0/uploadServiceProvider?affiliateIds='+serviceProviderId;
	
	request(url, function(error, response, body){
		if(error){
			logger.error(TAG + " Calling /crm/affiliate/api/v1.0/uploadServiceProvider API failed 1.");
	  		return callback(true);
		}
		else if(!error && response.statusCode == 200){
			logger.debug(TAG + " Api called suceefully.");
		  	logger.debug(TAG + " Response from /crm/affiliate/api/v1.0/uploadServiceProvider API: ");
		  	logger.debug(TAG + " " +JSON.stringify(body));
		  	return callback(false);
		}
		else{
			logger.error(TAG + " Calling /crm/affiliate/api/v1.0/uploadServiceProvider API failed 2.");
	  		return callback(true);
		}
	});
}

//Function that will call the upload API of crm on accountInfo/basicInfo/officialAddress updation.
exports.crmUpdation = function crmUpdation(serviceProviderId, callback){
	var logger = log.logger_sp;
	var DEPLOYED_HOST = host_detail.DEPLOYED_HOST;

	var url = 'http://' + DEPLOYED_HOST.host + '/crm/affiliate/api/v1.0/updateServiceProvider?affiliateIds='+serviceProviderId;
	
	request(url, function(error, response, body){
		if(error){
			logger.error(TAG + " Calling /crm/affiliate/api/v1.0/updateServiceProvider API failed 1.");
	  		return callback(true);
		}
		else if(!error && response.statusCode == 200){
			logger.debug(TAG + " Api called suceefully.");
		  	logger.debug(TAG + " Response from /crm/affiliate/api/v1.0/updateServiceProvider API: ");
		  	logger.debug(TAG + " " +JSON.stringify(body));
		  	return callback(false);
		}
		else{
			logger.error(TAG + " Calling /crm/affiliate/api/v1.0/updateServiceProvider API failed 2.");
	  		return callback(true);
		}
	});
}