var TAG = " Service Provider Types - ";

var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');


exports.getServiceProviderTypes = function(req, callback){
  
    var logger = log.logger_sp;
  
    var db = dbConfig.mongoDbConn;
    var ServiceProviderTypesColl = db.collection('ServiceProviderTypes');

    ServiceProviderTypesColl.find({}).toArray(function(err, result) {
      if (err) {
        resJson = {
			 "http_code" : "500",
			"message" : "Error retriving Service Provider Types."
		};
		logger.error(TAG + "Error retriving Service Provider Types. ERROR : \n" + err.stack);
		return callback(true, resJson);
      } else if (result.length) {
        resJson = {
            "http_code" : "200",
            "message" : result[0].serviceProviderTypes
        };
        logger.info(TAG + "Service Provider Types retrived Successfully");
        return callback(false, resJson);
      } else {
        resJson = {
			"http_code" : "404",
			"message" : "Service Provider Types not found."
		};
		logger.error(TAG + "Service Provider Types not found " );
		return callback(true, resJson);
      }
    });

}
