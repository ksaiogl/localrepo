var TAG = " State - ";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');

exports.getState = function(state, callback){
  var logger = log.logger_util;
  try {
    var query = { "magentoStateId": { $exists: true }, "magentoEnabled": true }

    if (state) {
      query.state = state;
    }

    var db = dbConfig.mongoDbConn;
    var supplierColl = db.collection('RFQcities');

    supplierColl.find(query,{"_id": 0, "magentoEnabled":0, "cities":0 }).toArray(function(err, result) {
      if (err) {
        resJson = {
					  "http_code" : "500",
						"message" : "Error retriving state."
				};
				logger.error(TAG + "Error retriving state. ERROR : \n" + err.stack);
				return callback(true, resJson);
      } else if (result.length) {
        resJson = {
            "http_code" : "200",
            "message" : result
        };
        logger.info(TAG + "state retrived for  : " + state);
        return callback(false, resJson);
      } else {
          resJson = {
  					  "http_code" : "404",
  						"message" : "state not found."
  				};
  				logger.error(TAG + "state not found : " + state);
  				return callback(true, resJson);
      }
    });
  } catch (e) {
    resJson = {
        "http_code" : "500",
        "message" : e.message
    };
    logger.error(TAG + "Error retriving state. ERROR : \n" + e.stack);
    return callback(true, resJson);
  }
}
