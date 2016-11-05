var TAG = "--- Catalog Panel ---    ";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var restClient = require('node-rest-client').Client;
var urlConstants = require('../helpers/urlConstants');
var env = require('../../Environment/env.js').env;
// var omsPanel = require('./omsPanel.js');



exports.sellerMOQ = function(req, callback){
  var logger = log.logger_omsAdminPanel;
  var db = dbConfig.mongoDbConn;
  var acl = require('acl');
  var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
  logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

  acl.isAllowed(req.user.userId, "Catalog", "Modify", function(err, result){
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
        logger.info(TAG + "Calling Seller MOQ service with method " + req.method);
        switch (req.method) {
          case 'PUT': {
            var args = {
              data: req.body,
              headers: { "Content-Type": "application/json" }
            };
            client.put(urlConstants.getSellerMoqURL(env), args, function (data, response) {
              resJson = {
                  "http_code": response.statusCode,
                  "message": JSON.parse(data.toString('utf8'))
              };
              callback(false,resJson);
              logger.info(TAG + "Response received from Seller MOQ service with status " + req.statusCode);
            });
            break;
          }
          case 'POST' : {
            var args = {
              data: req.body,
              headers: { "Content-Type": "application/json" }
            };
            client.post(urlConstants.getSellerMoqURL(env), args, function (data, response) {
              resJson = {
                "http_code": response.statusCode,
                "message": JSON.parse(data.toString('utf8'))
              };
              callback(false,resJson);
              logger.info(TAG + "Response received from Seller MOQ service with status " + req.statusCode);
            });
            break;
          }

        }
      } else {
        resJson = {
            "http_code": 403,
            "message": "User does not have permission to perform this action on this resource."
        };
        callback(true,resJson);
        logger.info(TAG + "user unauthorized. UserId : " + req.user.email + " PATH : " + req.url);
        // omsPanel.audit (req, resJson.http_code, resJson.message, false);
      }
    }
  });
}





exports.sellerConsolidatedCharges = function(req, callback){
  var logger = log.logger_omsAdminPanel;
  var db = dbConfig.mongoDbConn;
  var acl = require('acl');
  var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
  logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

  acl.isAllowed(req.user.userId, "Catalog", "Modify", function(err, result){
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
        logger.info(TAG + "Calling sellerConsolidatedCharges service with method " + req.method);
        switch (req.method) {
          case 'PUT': {
            var args = {
              data: req.body,
              headers: { "Content-Type": "application/json" }
            };
            client.put(urlConstants.sellerConsolidatedChargesURL(env), args, function (data, response) {
              resJson = {
                  "http_code": response.statusCode,
                  "message": JSON.parse(data.toString('utf8'))
              };
              callback(false,resJson);
              logger.info(TAG + "Response received from sellerConsolidatedCharges service with status " + req.statusCode);
            });
            break;
          }
          case 'POST' : {
            var args = {
              data: req.body,
              headers: { "Content-Type": "application/json" }
            };
            client.post(urlConstants.sellerConsolidatedChargesURL(env), args, function (data, response) {
              resJson = {
                "http_code": response.statusCode,
                "message": JSON.parse(data.toString('utf8'))
              };
              callback(false,resJson);
              logger.info(TAG + "Response received from sellerConsolidatedCharges service with status " + req.statusCode);
            });
            break;
          }

        }
      } else {
        resJson = {
            "http_code": 403,
            "message": "User does not have permission to perform this action on this resource."
        };
        callback(true,resJson);
        logger.info(TAG + "user unauthorized. UserId : " + req.user.email + " PATH : " + req.url);
        // omsPanel.audit(req, resJson.http_code, resJson.message, false);
      }
    }
  });
}




exports.sellerProductCharges = function(req, callback){
  var logger = log.logger_omsAdminPanel;
  var db = dbConfig.mongoDbConn;
  var acl = require('acl');
  var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
  logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

  acl.isAllowed(req.user.userId, "Catalog", "Modify", function(err, result){
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
        logger.info(TAG + "Calling sellerProduct service with method " + req.method);
        switch (req.method) {
          case 'PUT': {
            var args = {
              data: req.body,
              headers: { "Content-Type": "application/json" }
            };
            client.put(urlConstants.sellerProductURL(env), args, function (data, response) {
              resJson = {
                  "http_code": response.statusCode,
                  "message": JSON.parse(data.toString('utf8'))
              };
              callback(false,resJson);
              logger.info(TAG + "Response received from sellerProduct service with status " + req.statusCode);
            });
            break;
          }
          case 'POST' : {
            var args = {
              data: req.body,
              headers: { "Content-Type": "application/json" }
            };
            client.post(urlConstants.sellerProductURL(env), args, function (data, response) {
              resJson = {
                "http_code": response.statusCode,
                "message": JSON.parse(data.toString('utf8'))
              };
              callback(false,resJson);
              logger.info(TAG + "Response received from sellerProduct service with status " + req.statusCode);
            });
            break;
          }

        }
      } else {
        resJson = {
            "http_code": 403,
            "message": "User does not have permission to perform this action on this resource."
        };
        callback(true,resJson);
        logger.info(TAG + "user unauthorized. UserId : " + req.user.email + " PATH : " + req.url);
        // omsPanel.audit(req, resJson.http_code, resJson.message, false);
      }
    }
  });
}



exports.ProductPrice = function(req, callback){
  var logger = log.logger_omsAdminPanel;
  var db = dbConfig.mongoDbConn;
  var acl = require('acl');
  var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
  logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

  acl.isAllowed(req.user.userId, "Catalog", "Modify", function(err, result){
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
        logger.info(TAG + "Calling productPrice service with method " + req.method);
        switch (req.method) {
          case 'PUT': {
            var args = {
              data: req.body,
              headers: { "Content-Type": "application/json" }
            };
            client.put(urlConstants.sellerProductPriceURL(env), args, function (data, response) {
              resJson = {
                  "http_code": response.statusCode,
                  "message": JSON.parse(data.toString('utf8'))
              };
              callback(false,resJson);
              logger.info(TAG + "Response received from productPrice service with status " + req.statusCode);
            });
            break;
          }
          case 'POST' : {
            var args = {
              data: req.body,
              headers: { "Content-Type": "application/json" }
            };
            client.post(urlConstants.sellerProductPriceURL(env), args, function (data, response) {
              resJson = {
                "http_code": response.statusCode,
                "message": JSON.parse(data.toString('utf8'))
              };
              callback(false,resJson);
              logger.info(TAG + "Response received from productPrice service with status " + req.statusCode);
            });
            break;
          }

        }
      } else {
        resJson = {
            "http_code": 403,
            "message": "User does not have permission to perform this action on this resource."
        };
        callback(true,resJson);
        logger.info(TAG + "user unauthorized. UserId : " + req.user.email + " PATH : " + req.url);
        // omsPanel.audit(req, resJson.http_code, resJson.message, false);
      }
    }
  });
}
