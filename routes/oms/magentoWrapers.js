var TAG = "--- Magento Wrapper ---    ";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var restClient = require('node-rest-client').Client;
var urlConstants = require('../helpers/urlConstants');
var env = require('../../Environment/env.js').env;
var omsPanel = require('./omsPanel.js');

exports.createSku = function(req, callback){
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
            "method": "getProductsCreation",
            "Authtoken": "d$J2?cKnzuNze9W",
            "sku":req.body.sku
          },
          headers: { "Content-Type": "text/plain" }
        };
        client.post(urlConstants.getMagentoURL(env), args, function (data, response) {
          try {
            resJson = {
                "http_code": response.statusCode,
                "message": JSON.parse(data.toString('utf8'))
            };
            callback(false,resJson);
            logger.info(TAG + "Response received from create sku service with status " + req.statusCode);
          } catch (e) {
            resJson = {
                "http_code": 500,
                "message": e.message
            };
            callback(false,resJson);
            logger.info(TAG + "Response received from create sku service with status " + req.statusCode + ". response : " + data);
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
          client.get(urlConstants.getProductDetailURL(env) + req.params.sku, function (data, response) {
            resJson = {
                "http_code": response.statusCode,
                // "message": JSON.parse(data.toString('utf8'))
                "message": data
            };
            callback(false,resJson);
            logger.info(TAG + "Response received from get product detail service with status " + req.statusCode);
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
