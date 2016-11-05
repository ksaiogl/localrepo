var TAG = "--- Supplier Creation ---    ";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var city = require('./util/city.js');
var generateSellerID = require('./util/generateSellerID.js');
var async = require('async');


function Seller(sellerId, companyName, VAT_TIN, PAN) {
    this.sellerId = sellerId;
    this.companyName = companyName;
    this.VAT_TIN = VAT_TIN;
    this.PAN = PAN;
}

exports.createSeller = function(req, callback){
  var logger = log.logger_omsAdminPanel;
  try {
    var input = req.body;
    var seller = {
      "sellerEntity": {
        "companyInfo": {
          "companyName": input.companyName,
          "displayName": input.companyName
        },
        "identifier": {
          "sellerId": "",
        },
        "sellerDetails": {
          "city": input.city,
          "PAN": input.PAN,
          "VAT_TIN": input.VAT_TIN,
          "email": input.email,
          "phone": input.phone,
          "bankInfo": {
            "accountHolderName": input.bankInfo.accountHolderName,
            "branch": input.bankInfo.branch,
            "bankName": input.bankInfo.bankName,
            "accountNumber": input.bankInfo.accountNumber,
            "IFSC": input.bankInfo.IFSC,
          }

        },
        "updationInfo": {
          "by": req.user.email,
          "date": new Date()
        }
      }
    };

    city.getCity(input.city, function(err, resJson){
      if (err) {
        callback(true,resJson);
        logger.error(TAG + "Error in retriving city details. ERROR : " + resJson.message);
      } else {
        var city = resJson.message[0].cityCode;

        var db = dbConfig.mongoDbConn;
        var supplierColl = db.collection('Supplier');
        var sellerColl = db.collection('Seller');

        var vatRegex = new RegExp('^' + input.VAT_TIN + '$', 'i');
        var panRegex = new RegExp('^' + input.PAN + '$', 'i');

        supplierColl.find({$or : [{'supplierEntity.taxInfo.VAT_TIN' : { $regex: vatRegex }}, {'supplierEntity.taxInfo.PAN' : { $regex: panRegex }}] }, {"supplierEntity.identifier.sellerId" : 1, "supplierEntity.companyInfo.displayName" : 1, "supplierEntity.taxInfo.VAT_TIN" : 1, "supplierEntity.taxInfo.PAN" : 1})
        .toArray(function(err, result){
          if (err) {
            resJson = {
              "http_code": 500,
              "message": "Error - Seller creation Failed. " + err.message
            };
            callback(true,resJson);
            logger.error(TAG + "Error in Seller creation. ERROR : \n" + err.stack);
          } else {
            if (result.length) {
              var sellers = [];
              result.forEach(function(element){
                sellers.push(new Seller(element.supplierEntity.identifier.sellerId, element.supplierEntity.companyInfo.displayName, element.supplierEntity.taxInfo.VAT_TIN, element.supplierEntity.taxInfo.PAN));
              });
              resJson = {
                "http_code": 400,
                "resJson": "Seller for this PAN or VAT/TIN  already exists. Please use a existing seller ID.",
                "sellerIds" : sellers
              };
              callback(true,resJson);
              logger.error(TAG + "Error in Seller creation. ERROR : " + resJson.resJson);
            } else {
              sellerColl.find({$or : [{"sellerEntity.sellerDetails.PAN" : { $regex: panRegex }}, {"sellerEntity.sellerDetails.VAT_TIN" : { $regex: vatRegex }}]}, {"sellerEntity.identifier.sellerId":1, "sellerEntity.companyInfo.displayName":1, "sellerEntity.sellerDetails.VAT_TIN":1, "sellerEntity.sellerDetails.PAN":1}).toArray(function(err, result){
                if (err) {
                  resJson = {
                    "http_code": 500,
                    "message": "Error - Seller creation Failed. " + err.message
                  };
                  callback(true,resJson);
                  logger.error(TAG + "Error in Seller creation. ERROR : \n" + err.stack);
                } else {
                  if (result.length) {
                      var sellers = [];
                      result.forEach(function(element){
                        sellers.push(new Seller(element.sellerEntity.identifier.sellerId, element.sellerEntity.companyInfo.displayName, element.sellerEntity.sellerDetails.VAT_TIN, element.sellerEntity.sellerDetails.PAN));
                      });
                      console.log(result);
                      resJson = {
                        "http_code": 400,
                        "resJson": "Seller for this PAN or VAT/TIN  already exists. Please use a existing seller ID.",
                        "sellerIds" : sellers
                      };
                      callback(true,resJson);
                      logger.error(TAG + "Error in Seller creation. ERROR : " + resJson.resJson);
                  } else {
                    generateSellerID.generateSellerID(city, 1, function(err, sellerID){
                      if (err) {
                        resJson = {
                            "http_code": 500,
                            "message": "Error - Seller creation Failed. " + err.message
                        };
                        callback(true,resJson);
                        logger.error(TAG + "Error in Seller creation. ERROR : \n" + err.stack);
                      } else {
                        seller.sellerEntity.identifier.sellerId = sellerID[0];
                        var db = dbConfig.mongoDbConn;
                        var sellerColl = db.collection('Seller');
                        sellerColl.insert(seller,function(err, result) {
                          if (err) {
                            if (err.code == 11000) {
                              resJson = {
                                  "http_code": 400,
                                  "resJson": "Seller for this PAN or VAT/TIN  already exists. Please use the existing seller ID."
                              };
                              callback(true,resJson);
                              logger.error(TAG + "Error in Seller creation. ERROR : " + resJson.resJson);
                            } else {
                              resJson = {
                                  "http_code": 500,
                                  "message": "Error - Seller creation Failed. " + err.message
                              };
                              callback(true,resJson);
                              logger.error(TAG + "Error in Seller creation. ERROR : \n" + err.stack);
                            }

                          } else {
                            resJson = {
                                "http_code" : "200",
                                "message" : sellerID
                            };
                            callback(false,resJson);
                            logger.info(TAG + "Seller created successfully. Seller ID : " + sellerID);
                          }
                        });
                      }
                    });
                  }
                }

              });

            }
          }

        });

      }
    });

  } catch (e) {
    resJson = {
        "http_code": 500,
        "message": "Error - Seller creation Failed. " + e.message
    };
    callback(true,resJson);
    console.log(e.stack);
    logger.error(TAG + "Error in Seller creation. ERROR : \n" + e.stack);
  }
}

//
// function insertSupplier(seller, callback) {
//   var db = dbConfig.mongoDbConn;
//   var sellerColl = db.collection('Seller');
//   sellerColl.insert(seller,function(err, result) {
//     if (err) {
//       callback(false);
//       return false;
//     } else {
//       callback(true);
//     }
//   });
// }
