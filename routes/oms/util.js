var TAG = "--- Admin Panel ---    ";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var generateMisReport = require('./util/generateMisReport.js');
var generateCustomerOrderReport = require('./util/generateCustomerOrder.js');
var generateNewSupplierReport = require('./util/newSupplierReport.js');
var city = require('./util/city.js');
var vatDetails = require('./util/getVatDetails.js');
var generateSellerID = require('./util/generateSellerID.js');
var audit = require('./omsPanel').audit;


exports.generateMisReport = function(req, res){
  var logger = log.logger_omsAdminPanel;
  var db = dbConfig.mongoDbConn;
  var acl = require('acl');
  var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
  logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

  acl.isAllowed(req.user.userId, "Report", "View", function(err, result){
    if (err) {
      resJson = {
          "http_code": 500,
          "message": "Error - User Authorization Failed. Please contact engineering team."
      };
      res.status = 500;
      res.json(resJson);
      logger.error(TAG + "Error in user Authorization. ERROR : \n" + err.stack);
    } else {
      if (result) {
        generateMisReport.generateMisReport(req, res);
      } else {
        resJson = {
            "http_code": 403,
            "message": "User does not have permission to perform this action on this resource."
        };
        res.status = 403;
        res.json(resJson);
        logger.info(TAG + "user unauthorized. UserId : " + req.user.email + " PATH : " + req.url);
        audit (req, resJson.http_code, resJson.message, false);
      }
    }
  });
}


exports.generateCustomerOrderReport = function(req, res){
  var logger = log.logger_omsAdminPanel;
  var db = dbConfig.mongoDbConn;
  var acl = require('acl');
  var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
  logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

  acl.isAllowed(req.user.userId, "Report", "View", function(err, result){
    if (err) {
      resJson = {
          "http_code": 500,
          "message": "Error - User Authorization Failed. Please contact engineering team."
      };
      res.status = 500;
      res.json(resJson);
      logger.error(TAG + "Error in user Authorization. ERROR : \n" + err.stack);
    } else {
      if (result) {
        generateCustomerOrderReport.generateCustomerOrderReport(req, res);
      } else {
        resJson = {
            "http_code": 403,
            "message": "User does not have permission to perform this action on this resource."
        };
        res.status = 403;
        res.json(resJson);
        logger.info(TAG + "user unauthorized. UserId : " + req.user.email + " PATH : " + req.url);
        audit (req, resJson.http_code, resJson.message, false);
      }
    }
  });
}


exports.generateNewSupplierReport = function(req, res){
  var logger = log.logger_omsAdminPanel;
  var db = dbConfig.mongoDbConn;
  var acl = require('acl');
  var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
  logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);
  acl.isAllowed(req.user.userId, "Catalog", "View", function(err, result){
  // acl.isAllowed(0, "Catalog", "Use", function(err, result){
    if (err) {
      resJson = {
          "http_code": 500,
          "message": "Error - User Authorization Failed. Please contact engineering team."
      };
      res.status = 500;
      res.json(resJson);
      logger.error(TAG + "Error in user Authorization. ERROR : \n" + err.stack);
    } else {
      if (result) {
        generateNewSupplierReport.generateNewSupplierReport(req, res);
      } else {
        resJson = {
            "http_code": 403,
            "message": "User does not have permission to perform this action on this resource."
        };
        res.status = 403;
        res.json(resJson);
        logger.info(TAG + "user unauthorized. UserId : " + req.user.email + " PATH : " + req.url);
        audit (req, resJson.http_code, resJson.message, false);
      }
    }
  });
}

// Gives details for all or one city
exports.getCityService = function (req, callback){
  var logger = log.logger_util;
  try {
    city.getCity(req.query.city, callback);
  } catch (e) {
    resJson = {
        "http_code" : "500",
        "message" : e.message
    };
    logger.debug(TAG + "Error retriving city. ERROR : \n" + e.stack);
    return callback(true, resJson);
  }
}

//Gives the various VAT Percentages
exports.getVatDetailsService = function (req, callback){
  var logger = log.logger_util;
  try {
    vatDetails.getVatDetails(callback);
  } catch (e) {
    resJson = {
        "http_code" : "500",
        "message" : e.message
    };
    logger.debug(TAG + "Error retriving VAT details. ERROR : \n" + e.stack);
    return callback(true, resJson);
  }
}

// generates sellerIDs
exports.generateSellerID = function(req, callback){
  var logger = log.logger_omsAdminPanel;
  var db = dbConfig.mongoDbConn;
  var acl = require('acl');
  var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
  logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

  acl.isAllowed(req.user.userId, "Catalog", "View", function(err, result){
    if (err) {
      resJson = {
          "http_code": 500,
          "message": "Error - User Authorization Failed. Please contact engineering team."
      };
      callback(true, resJson);
      logger.error(TAG + "Error in user Authorization. ERROR : \n" + err.stack);
    } else {
      if (result) {
        generateSellerID.generateSellerIDService(req, callback);
      } else {
        resJson = {
            "http_code": 403,
            "message": "User does not have permission to perform this action on this resource."
        };
        callback(true, resJson);
        logger.info(TAG + "user unauthorized. UserId : " + req.user.email + " PATH : " + req.url);
        audit (req, resJson.http_code, resJson.message, false);
      }
    }
  });
}
