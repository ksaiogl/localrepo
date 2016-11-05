var TAG = "rfqStatesCities.js";

var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var _ = require("underscore");
var fetchCompanyIds = require('./utility/getCompanyIds.js');

//Function for fetching states.
exports.getStates = 
function getStates (req, callback){
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;
	
	logger.debug(ip + " " + TAG + " Entering listing states.");
	
	//Log the request.
	logger.debug(ip + " " + TAG + " " + JSON.stringify(req.body));

	//Declare the response
	var resJson;

	var col = db.collection('RFQcities');

	var statesList = {};

	col.find({}, {"_id": 0, "state": 1}).toArray(function(error, result){
		if(error){
			resJson = {
				    "http_code" : "500",
					"message" : "Error while listing states. Please try later."
			};
			logger.error(TAG + " listing states failed. Error:" + result);
			return callback(true, resJson);
		}
		else if(!error && result.length > 0){
			var states = [];
			for(var i = 0; i < result.length; i++){
				states.push(result[i].state);
			}

			statesList["states"] = states.sort();
			statesList["states"] = _.uniq(statesList["states"], true);
			resJson = {
				    "http_code" : "200",
					"message" : statesList
			};
			return callback(false, resJson);
		}
		else if(!error && result.length === 0){
			statesList["states"] = result;
			resJson = {
				    "http_code" : "200",
					"message" : statesList
			};
			logger.error(TAG + " No states found.");
			return callback(true, resJson);
		}
	});
}

//Function for fetching cities based on states.
exports.getCities = 
function getCities (req, callback){
	
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;
	
	//Log the request.
	logger.debug(ip + " " + TAG + " " + JSON.stringify(req.body));
	
	logger.debug(ip + " " + TAG + " Entering listing citeis.");

	//Declare the response
	var resJson;
	
	//Validate the request.
	if ( !(	req === null || 
			req.body === null ||
			req.body.state === undefined ||
			req.body.state.toString().trim().length === 0 ||
			req.body.state === undefined)) {
	
	var citiesList = {};
	var col = db.collection('RFQcities');
	col.findOne({"state": req.body.state},{"_id": 0,"cities":1},function(err, result) {
		if(!err && (result !== null)){
			result.cities.sort();
			result.cities = _.uniq(result.cities, true);
			resJson = {
				    "http_code" : "200",
					"message" : result
			};
			return callback(false, resJson);
		}else if(!err && (result === null)){
			citiesList["cities"] = [];
			resJson = {
				    "http_code" : "200",
					"message" : citiesList
			};
			logger.error(ip + " " + TAG + " There are no cities listed for this state.");
			return callback(true, resJson);
		}else{
			resJson = {
				    "http_code" : "500",
					"message" : "Unexpected Server while fulfilling the request."
			};
			logger.error(ip + " " + TAG + " Unexpected Server while fulfilling the request.." + JSON.stringify(err));
			return callback(true, resJson);
		}	
	});
  }	else {
		resJson = {
			    "http_code" : "400",
				"message" : "Bad or ill-formed request.."
		};
		logger.error(ip + " " + TAG + " " + JSON.stringify(resJson));
		return callback(true, resJson);
	}
};

//Function for fetching cities based on builder.
exports.getCitiesbyBuilder = 
function getCitiesbyBuilder (req, callback){
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;
	
	//Log the request.
	logger.debug(ip + " " + TAG + " " + JSON.stringify(req.body));
	
	logger.debug(ip + " " + TAG + " Entering listing citeis based on builder.");

	//Declare the response
	var resJson;
	
	var citiesList = {};
	var rfqBuilderCol = db.collection('Builder');
	
	var companyIds = fetchCompanyIds.getCompanyIds(req.body.customerSession);
	
	rfqBuilderCol.aggregate([{
  		$match: {
  			"builderEntity.profileInfo.accountInfo.companyId": {
				$in: companyIds
			}
  	  	}
	  	},
	  	{
			$unwind: "$builderEntity.mySuppliers.suppliersIds"
	  	},
	  	{
	  		$group: {
	  			_id: "$builderEntity.mySuppliers.suppliersIds.city"
	  		}
	  	}], function(error, result){
		if(error){
			resJson = {
				    "http_code" : "500",
					"message" : "Unexpected Server while fulfilling the request."
			};
			logger.error(TAG + " listing cities for companyIds: "+companyIds+", failed. Error:" + result);
			return callback(true, resJson);
		}
		else if(!error && result.length > 0){
			var cityArray = [];
			for(var i = 0; i < result.length; i++){
				if(result[i]._id !== null)
					cityArray.push(result[i]._id)
			}
			citiesList["cities"] = cityArray.sort();
			resJson = {
				    "http_code" : "200",
					"message" : citiesList
			};
			return callback(false, resJson);
		}
		else if(!error && result.length === 0){
			logger.error(TAG + " citeis not found for companyIds: "+companyIds);
			citiesList["cities"] = [];
			resJson = {
				    "http_code" : "200",
					"message" : citiesList
			};
			return callback(true, resJson);
		}
	})
}