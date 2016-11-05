var TAG = "Seller Master Id Generation - Seller onBoarding";
var randomstring = require('just.randomstring');
var log = require('../../Environment/log4js.js');
var dbConfig = require('../../Environment/mongoDatabase.js');
var async = require('async');

function generateSellerMasterID(vat, callback){
  var sellerMasterId;
  var logger = log.logger_seller;
  var temp_count = 0;
  var db = dbConfig.mongoDbConn;

  async.whilst(
    function () { return !(temp_count == 1); },
    function (asyncCallback) {
      try {
        var charPart = randomstring(4, 'uppercases');
        var vatPart = vat.substring(0, 8);

        sellerID = "S" +  charPart + vatPart;

        var sellerMasterColl = db.collection('SellerMaster');
        sellerMasterColl.count({"sellerEntity.profileInfo.accountInfo.sellerId": sellerID}, function(err, count) {
          if (err) {
            asyncCallback(err);
          } else {
            if (count > 0) {
              asyncCallback();
            } else {
              //untill migration check in old collection Supplier.
              var supplierColl = db.collection('Supplier');
              supplierColl.count({"supplierEntity.identifier.sellerId": sellerID}, function(err, count) {
                if (err) {
                  asyncCallback(err);
                } else {
                  if (count > 0) {
                    asyncCallback();
                  } else {
                    temp_count ++;
                    sellerMasterId = sellerID;
                    asyncCallback();
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
        callback(true, err);
      } else {
        callback(false, sellerMasterId);
      }
    }
  );
};

exports.generateSellerMasterID = generateSellerMasterID;

exports.generateSellerMasterIDService = function (req, callback){
  var logger = log.logger_seller;
  try {
    if (!( req === null ||
           req.body.vat === undefined || 
           req.body.vat === null || 
           req.body.vat.toString().trim().length === 0) ) {
      
      var vat = req.body.vat;
      generateSellerMasterID(vat, function(err, result){
        if (err) {
          resJson = {
              "http_code" : "500",
              "message" : result
          };
          logger.error(TAG + "Error generating seller Master ID. ERROR : " + result);
          return callback(true, resJson);
        } else {
          resJson = {
              "http_code" : "200",
              "message" : result
          };
          logger.info(TAG + "Successfully generating seller Master ID. sellerMasterID : " + result);
          return callback(false, resJson);
        }
      });
    } else {
      resJson = {
          "http_code" : "400",
          "message" : "Bad or ill-formed request.."
      };
      logger.error(TAG + "Error generating seller Master ID. ERROR : " + resJson);
      return callback(true, resJson);
    }
  } catch (e) {
    resJson = {
        "http_code" : "500",
        "message" : "Unexpected Server Error while generating sellerMasterId"
    };
    logger.error(TAG + "in try/catch of Error generating seller Master ID. ERROR : \n" + e.stack);
    return callback(true, resJson);
  }
}
