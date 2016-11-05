var TAG = "--- Product Wrappers ---    ";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var restClient = require('node-rest-client').Client;
var urlConstants = require('../helpers/urlConstants');
var env = require('../../Environment/env.js').env;
var omsPanel = require('./omsPanel.js');

exports.createProductTempSku = function(req, callback){
  var logger = log.logger_omsAdminPanel;
  var db = dbConfig.mongoDbConn;
  var acl = require('acl');
  var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
  logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

  acl.isAllowed(req.user.userId, "Order", "Create", function(err, result){
    if (err) {
      resJson = {
          "http_code": 500,
          "message": "Error - User Authorization Failed. Please contact engineering team."
      };
      callback(true,resJson);
      logger.error(TAG + "Error in user Authorization. ERROR : \n" + err.stack);
    } else {
      if (result) {
        var client = new restClient();
        var args = {
          data: {
            "category": req.body.category,
            "subCategory": req.body.subCategory,
            "productType": req.body.productType,
            "productName": req.body.productName,
            "brand": req.body.brand,
            "unit": req.body.unit,
            "shortDesc": req.body.shortDesc,
            "fullDesc": req.body.fullDesc,
            "userId": req.user.email
          },
          headers: { "Content-Type": "application/json" }
        };
        client.post(urlConstants.getProductTempSkuURL(env), args, function (response) {
          try {
            resJson = {
                "http_code": response.http_code,
                "message": response.message,
                "skuId" : response.skuId
            };
            callback(false,resJson);
            logger.info(TAG + "Response received from create product sku service with status " + response.http_code);
          } catch (e) {
            resJson = {
                "http_code": 500,
                "message": e.message
            };
            callback(false,resJson);
            logger.info(TAG + "Response received from create product sku service with status " + response.http_code + ". response : " + JSON.stringify(response));
          }
        });
      } else {
        resJson = {
            "http_code": 403,
            "message": "User does not have permission to perform this action on this resource."
        };
        callback(true,resJson);
        logger.info(TAG + "User unauthorized. UserId : " + req.user.email + " PATH : " + req.url);
        omsPanel.audit (req, resJson.http_code, resJson.message, false);
      }
    }
  });
}

exports.getSkuDetails = function(req, callback){
  var logger = log.logger_omsAdminPanel;
  var db = dbConfig.mongoDbConn;
  var acl = require('acl');
  var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
  logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

  acl.isAllowed(req.user.userId, "Order", "Create", function(err, result){
    if (err) {
      resJson = {
          "http_code": 500,
          "message": "Error - User Authorization Failed. Please contact engineering team."
      };
      callback(true,resJson);
      logger.error(TAG + "Error in user Authorization. ERROR : \n" + err.stack);
    } else {
      if (result) {
        var client = new restClient();
        var URL = urlConstants.getSkuDetailsURL(env) + '?skuId=' + req.query.skuId + '&category=' + req.query.category;
        console.log(URL);
        client.get(URL, function (data, response) {
          try {
            // resJson = {
            //     "http_code": response.http_code,
            //     "message": response.message,
            //     "imagePrefixURL" : response.imagePrefixURL
            // };
            callback(false,data);
            logger.info(TAG + "Response received from get product sku service with status " + response.http_code);
          } catch (e) {
            resJson = {
                "http_code": 500,
                "message": e.message
            };
            callback(false,resJson);
            logger.info(TAG + "Response received from get product sku service with status " + response.http_code + ". response : " + JSON.stringify(response));
          }
        });
      } else {
        resJson = {
            "http_code": 403,
            "message": "User does not have permission to perform this action on this resource."
        };
        callback(true,resJson);
        logger.info(TAG + "User unauthorized. UserId : " + req.user.email + " PATH : " + req.url);
        omsPanel.audit (req, resJson.http_code, resJson.message, false);
      }
    }
  });
}