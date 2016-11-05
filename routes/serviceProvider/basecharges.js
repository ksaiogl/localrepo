//This file contains functions that will help to create body of email.
var TAG = "basecharges.js";

var log = require('../../Environment/log4js.js');
var dbConfig = require('../../Environment/mongoDatabase.js');
var async = require('async');
var numberConversions = require('../helpers/numberConversions.js');

//Function that will calculate base charge, charges for different payments modes for service provider.
exports.calculateCharges = function(req, callback){
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_sp;

	//Declare the response
	var resJson;
	
	var response_message = null, basic_amount = 0;
	//Validate the request.
	if ( !(	req === null || req.body === null || req.body.cityname === undefined || req.body.cityname.toString().trim().length === 0)){
		
		async.series([
			//Function that will get basic amount based on city.
			function(asyncCallback){
				var db = dbConfig.mongoDbConn;
				var logger = log.logger_sp;
				var ServiceProviderFeeCol = db.collection('ServiceProviderFee');
				response_message = "City information not found.";

				ServiceProviderFeeCol.find({"city": req.body.cityname}).toArray(function(error, result){
					if(error){
						logger.error(TAG + " error occured while fetching charges for cityname "+req.body.cityname+" ,error: "+error);
						return asyncCallback(true);
					}
					else if(!error && result.length === 0){
						logger.error(TAG + " Record not found for cityname "+req.body.cityname);
						return asyncCallback(false);
					}
					else if(!error && result.length > 0){
						logger.error(TAG + " Record found for cityname "+req.body.cityname);
						basic_amount = result[0].fee;
						return asyncCallback(false, resJson);
					}
				});

			},
			//Function that will get all surcharges based on basic amount.
			function(asyncCallback){
				var db = dbConfig.mongoDbConn;
				var logger = log.logger_sp;
				var col = db.collection('ServiceProviderPaymentCharges');
				response_message = "surcharges not found.";
				var surcharges = {};
				col.find({}).toArray(function(error, result){
					if(error){
						logger.error(TAG + " error occured while fetching surcharges for city "+req.body.cityname+" ,error: "+error);
						return asyncCallback(true);
					}
					else if(!error && result.length === 0){
						logger.error(TAG + " surcharges not found for cityname"+req.body.cityname);
						return asyncCallback(false);
					}
					else if(!error && result.length > 0){
						logger.error(TAG + " surcharges found for "+req.body.cityname);
						surcharges.BasicCharge = basic_amount;

						for(var i = 0; i < result.length; i++){
							try{
								surcharges[result[i].paymentType] = numberConversions.get2Decimalpoint( basic_amount + ((basic_amount * result[i].charges) / 100) );	
							}
							catch(exception){
								surcharges[result[i].paymentType] = 0;
							}
						}

						var charges = {
							"city": req.body.cityname,
							"charges" : surcharges
						};
						response_message = charges; 
						return asyncCallback(false);
					}
				});
			},
		], function(error){
			if(error){
				resJson = {
				    "http_code" : "500",
					"message" : response_message
				};
				return callback(true, resJson);
			}
			else{
				resJson = {
				    "http_code" : "200",
					"message" : response_message
				};
				return callback(false, resJson);
			}
		});	
		

	}
	else{
		resJson = {
			    "http_code" : "400",
				"message" : "Bad or ill-formed request.."
		};
		logger.error(ip + " " + TAG + " " + JSON.stringify(resJson));
		return callback(false,resJson);
	}
}