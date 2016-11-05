var TAG = " City - ";
// var log = require('../../Environment/log4js.js');
var dbConfig = require('../../../Environment/mongoDatabase.js');
var log = require('../../../Environment/log4js.js');

exports.getCity = function(city, callback){
  var logger = log.logger_util;
  try {
    var query = {
      // "adminPanelEnabled" : true
    };

    if (city) {
      query.city = city;
    } else {
      query.adminPanelEnabled = true;
    }

    var db = dbConfig.mongoDbConn;
    var cityColl = db.collection('cityDetails');

    cityColl.find(query,{"_id": 0, "adminPanelEnabled":0}).toArray(function(err, result) {
      if (err) {
        resJson = {
					  "http_code" : "500",
						"message" : "Error retriving city."
				};
				logger.error(TAG + "Error retriving city. ERROR : \n" + err.stack);
				return callback(true, resJson);
      } else if (result.length) {
        resJson = {
            "http_code" : "200",
            "message" : result
        };
        logger.info(TAG + "City retrived for  : " + city);
        return callback(false, resJson);
      } else {
          resJson = {
  					  "http_code" : "404",
  						"message" : "City not found."
  				};
  				logger.error(TAG + "City not found : " + city);
  				return callback(true, resJson);
      }
    });
  } catch (e) {
    resJson = {
        "http_code" : "500",
        "message" : e.message
    };
    logger.error(TAG + "Error retriving city. ERROR : \n" + e.stack);
    return callback(true, resJson);
  }
}
