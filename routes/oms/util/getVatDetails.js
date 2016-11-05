var TAG = " VAT Details - ";

var dbConfig = require('../../../Environment/mongoDatabase.js');
var log = require('../../../Environment/log4js.js');


exports.getVatDetails = function(callback){
  
    var logger = log.logger_util;
  
    var db = dbConfig.mongoDbConn;
    var VatDetailsColl = db.collection('VatDetails');

    VatDetailsColl.find({}).toArray(function(err, result) {
      if (err) {
        resJson = {
			 "http_code" : "500",
			"message" : "Error retriving VAT Details."
		};
		logger.error(TAG + "Error retriving VAT Details. ERROR : \n" + err.stack);
		return callback(true, resJson);
      } else if (result.length) {
        resJson = {
            "http_code" : "200",
            "message" : result[0].vatDetails
        };
        logger.info(TAG + "VAT Details retrived Successfully");
        return callback(false, resJson);
      } else {
        resJson = {
			"http_code" : "404",
			"message" : "VAT Details not found."
		};
		logger.error(TAG + "VAT Details not found " );
		return callback(true, resJson);
      }
    });

}
