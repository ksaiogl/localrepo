var TAG = "---Customer Lead ---    ";
var log = require('../../Environment/log4js.js');
var dbConfig = require('../../Environment/mongoDatabase.js');

exports.addCustomerLead = function(req,callback){

	//Variable for Logging the messages to the file.
	var logger = log.logger_OMS;

	var db = dbConfig.mongoDbConn;

	var customerLeadcoll = db.collection('CustomerLead');

	var resJson;
	
	if(!( req === null ||
		  req.body === null ||
		  req.body === undefined ||
		  req.body.name === null ||
		  req.body.name === undefined ||
		  req.body.name.toString().trim().length === 0 ||
		  req.body.email === null ||
		  req.body.email === undefined ||
		  req.body.email.toString().trim().length === 0 ||
		  req.body.phonenumber === null ||
		  req.body.phonenumber === undefined ||
		  req.body.phonenumber.toString().trim().length === 0 ||
		  req.body.message === null ||
		  req.body.message === undefined ||
		  req.body.message.toString().trim().length === 0 
		)) {

		var doc = {
			"name": 	req.body.name, 
			"phonenumber": 	req.body.phonenumber, 
			"email": 	req.body.email, 
			"message": 	req.body.message
		};

		customerLeadcoll.insert(doc,function(err, result){
			if(err){
				resJson = {
	        		"http_code": 500,
	        		"message": "Cannot insert into Customer Lead."
		        };
		        logger.error(TAG + "Cannot insert into CustomerLead. ERROR : " + JSON.stringify(err));
				callback(true, resJson);

			}else{
				var resJson = {
		    		"http_code": 200,
	        		"message": "Customer Details are inserted to CustomerLead Successfully"
		        };
		        logger.debug(TAG + " Customer Details are inserted to CustomerLead ");
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