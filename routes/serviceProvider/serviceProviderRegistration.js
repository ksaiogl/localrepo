var TAG = "---Service Provider Registration ---    ";
var log = require('../../Environment/log4js.js');
var dbConfig = require('../../Environment/mongoDatabase.js');

exports.addServiceProvider = function(req,callback){

	//Variable for Logging the messages to the file.
	var logger = log.logger_sp;

	var db = dbConfig.mongoDbConn;

	var serviceProviderLeadcoll = db.collection('ServiceProviderLead');

	var resJson;
	
	if(!( req === null ||
		  req.body === null ||
		  req.body === undefined ||
		  req.body.name === null ||
		  req.body.name === undefined ||
		  req.body.name.toString().trim().length === 0 ||
		  req.body.phonenumber === null ||
		  req.body.phonenumber === undefined ||
		  req.body.phonenumber.toString().trim().length === 0 ||
		  req.body.serviceprovidertype === null ||
		  req.body.serviceprovidertype === undefined ||
		  req.body.serviceprovidertype.toString().trim().length === 0 ||
		  req.body.others === null ||
		  req.body.others === undefined  
		)) {

		var doc = {
			"name": 	req.body.name, 
			"phonenumber": 	req.body.phonenumber, 
			"serviceprovidertype": 	req.body.serviceprovidertype, 
			"others": 	req.body.others
		};

		serviceProviderLeadcoll.insert(doc,function(err, result){
			if(err){
				resJson = {
	        		"http_code": 500,
	        		"message": "Cannot insert into serviceProviderLead."
		        };
		        logger.error(TAG + "Cannot insert into CustomerLead. ERROR : " + JSON.stringify(err));
				callback(true, resJson);

			}else{
				var resJson = {
		    		"http_code": 200,
	        		"message": "service Provider Details are inserted to serviceProviderLead Successfully"
		        };
		        logger.debug(TAG + " service Provider Details are inserted to serviceProviderLeadcoll ");
				callback(false, resJson);
			}
		});

	} else {
		var resJson = {
    		"http_code": 400,
    		"message": "Bad or ill - formed request..."
        };
		callback(true, resJson);
	}
};	