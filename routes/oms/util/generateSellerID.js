var TAG = "Seller Id Generation - ";
var randomstring = require('just.randomstring');
var log = require('../../../Environment/log4js.js');
var dbConfig = require('../../../Environment/mongoDatabase.js');
var async = require('async');

function generateSellerID(city, count, callback){
  var sellerIds = [];
  var logger = log.logger_util;
  var temp_count = 0;
  var db = dbConfig.mongoDbConn;

  async.whilst(
    function () { return !(temp_count == count); },
    function (asyncCallback) {
      try {
        var rs_char = randomstring(4, 'uppercases');
        var rs_num = randomstring(4, 'numbers');

        sellerID = city + rs_char + rs_num;
        var supplierColl = db.collection('Supplier');
        supplierColl.count({"supplierEntity.identifier.sellerId": sellerID}, function(err, count) {
          if (err) {
            asyncCallback(err);
          } else {
            if (count > 0) {
              asyncCallback();
            } else {
              var sellerColl = db.collection('Seller');
              sellerColl.count({"sellerEntity.identifier.sellerId": sellerID}, function(err, count) {
                if (err) {
                  asyncCallback(err);
                } else {
                  if (count > 0) {
                    asyncCallback();
                  } else {
                    // var builderColl = db.collection('Builder');
                    // builderColl.count({"builderEntity.mySuppliers.suppliersIds.supplierId" : sellerID},function(err, count){
                    //   if (err) {
                    //     asyncCallback(err);
                    //   } else {
                    //     if (count > 0) {
                    //       asyncCallback();
                    //     } else {
                            var SellerIdTracker = db.collection('SellerIdTracker');
                            SellerIdTracker.count({"_id": sellerID}, function(err, count) {
                              if (err) {
                                asyncCallback(err);
                              } else {
                                if (count > 0) {
                                  asyncCallback();
                                } else {
                                  SellerIdTracker.insert({"_id": sellerID}, function(err, count) {
                                    if (err) {
                                      asyncCallback(err);
                                    } else {
                                      temp_count ++;
                                      sellerIds.push(sellerID);
                                      asyncCallback();
                                    }
                                  });
                                }
                              }
                            });
                    //     }
                    //   }
                    // })

                  }
                }
              });
            }
          }
        });
      } catch (e) {
        asyncCallback(e);
      }
    },
    function (err) {
      if (err) {
        callback(err);
      } else {
        callback(false, sellerIds);
      }
    }
  );

};

exports.generateSellerID = generateSellerID;

exports.generateSellerIDService = function (req, callback){
  var logger = log.logger_util;
  try {
    if (req.params.city.length == 3 && req.params.count > 0) {
      var sellerIDs = generateSellerID(req.params.city, req.params.count, function(err, sellerIDs){
        if (err) {
          resJson = {
              "http_code" : "500",
              "message" : err.message
          };
          logger.error(TAG + "Error generating seller IDs. ERROR : " + err.stack);
          return callback(true, resJson);
        } else {
          resJson = {
              "http_code" : "200",
              "message" : sellerIDs
          };
          logger.info(TAG + "Successfully generating seller IDs. sellerIDs : " + resJson.message);
          return callback(true, resJson);
        }
      });

    } else {
      resJson = {
          "http_code" : "400",
          "message" : "city should be a valid 3 character city code and count should be a valid integer more than 0."
      };
      logger.error(TAG + "Error generating seller IDs. ERROR : " + resJson.message);
      return callback(true, resJson);
    }

  } catch (e) {
    resJson = {
        "http_code" : "500",
        "message" : e.message
    };
    logger.error(TAG + "Error generating seller IDs. ERROR : \n" + e.stack);
    return callback(true, resJson);
  }
}
