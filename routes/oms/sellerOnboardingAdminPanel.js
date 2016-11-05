var TAG = "--- Seller Onboarding Admin Panel ---    ";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var omsPanel = require('./omsPanel.js');
var sellerVerificationSceta = require('../sellerOnboarding/sellerVerificationSceta.js');
var sellerCRM = require('../sellerOnboarding/sellerCRM.js');
var sellerProfile = require('../sellerOnboarding/sellerProfile.js');

exports.fetchSellerLeads = function(req, callback){
  var logger = log.logger_omsAdminPanel;
  var db = dbConfig.mongoDbConn;
  var acl = require('acl');
  var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
  logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

  acl.isAllowed(req.user.userId, "SellerOnboardingPanel", "View", function(err, result){
    if (err) {
      resJson = {
          "http_code": 500,
          "message": "Error - User Authorization Failed. Please contact engineering team."
      };
      callback(true,resJson);
      logger.error(TAG + "Error in user Authorization. ERROR : \n" + err.stack);
    } else {
      if (result) {
       sellerCRM.fetchSellerLeads(req, function(err, regres){
         callback(err,regres);
        });
      } else {
        resJson = {
            "http_code": 403,
            "message": "User does not have permission to perform this action on this resource."
        };
        callback(true,resJson);
        logger.info(TAG + "user unauthorized. UserId : " + req.user.email + " PATH : " + req.url);
        omsPanel.audit(req, resJson.http_code, resJson.message, false);
      }
    }
  });
}

exports.updateSellerLeadDetails = function(req, callback){
  var logger = log.logger_omsAdminPanel;
  var db = dbConfig.mongoDbConn;
  var acl = require('acl');
  var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
  logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

  acl.isAllowed(req.user.userId, "SellerOnboardingPanel", "Modify", function(err, result){
    if (err) {
      resJson = {
          "http_code": 500,
          "message": "Error - User Authorization Failed. Please contact engineering team."
      };
      callback(true,resJson);
      logger.error(TAG + "Error in user Authorization. ERROR : \n" + err.stack);
    } else {
      if (result) {
       sellerCRM.updateSellerLeadDetails(req, function(err, regres){
         callback(err,regres);
        });
      } else {
        resJson = {
            "http_code": 403,
            "message": "User does not have permission to perform this action on this resource."
        };
        callback(true,resJson);
        logger.info(TAG + "user unauthorized. UserId : " + req.user.email + " PATH : " + req.url);
        omsPanel.audit(req, resJson.http_code, resJson.message, false);
      }
    }
  });
}

exports.rejectSellerLead = function(req, callback){
  var logger = log.logger_omsAdminPanel;
  var db = dbConfig.mongoDbConn;
  var acl = require('acl');
  var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
  logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

  acl.isAllowed(req.user.userId, "SellerOnboardingPanel", "Modify", function(err, result){
    if (err) {
      resJson = {
          "http_code": 500,
          "message": "Error - User Authorization Failed. Please contact engineering team."
      };
      callback(true,resJson);
      logger.error(TAG + "Error in user Authorization. ERROR : \n" + err.stack);
    } else {
      if (result) {
       sellerCRM.rejectSellerLead(req, function(err, regres){
         callback(err,regres);
        });
      } else {
        resJson = {
            "http_code": 403,
            "message": "User does not have permission to perform this action on this resource."
        };
        callback(true,resJson);
        logger.info(TAG + "user unauthorized. UserId : " + req.user.email + " PATH : " + req.url);
        omsPanel.audit(req, resJson.http_code, resJson.message, false);
      }
    }
  });
}

exports.approveSellerLead = function(req, callback){
  var logger = log.logger_omsAdminPanel;
  var db = dbConfig.mongoDbConn;
  var acl = require('acl');
  var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
  logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

  acl.isAllowed(req.user.userId, "SellerOnboardingPanel", "Modify", function(err, result){
    if (err) {
      resJson = {
          "http_code": 500,
          "message": "Error - User Authorization Failed. Please contact engineering team."
      };
      callback(true,resJson);
      logger.error(TAG + "Error in user Authorization. ERROR : \n" + err.stack);
    } else {
      if (result) {
       sellerCRM.approveSellerLead(req, function(err, regres){
         callback(err,regres);
        });
      } else {
        resJson = {
            "http_code": 403,
            "message": "User does not have permission to perform this action on this resource."
        };
        callback(true,resJson);
        logger.info(TAG + "user unauthorized. UserId : " + req.user.email + " PATH : " + req.url);
        omsPanel.audit(req, resJson.http_code, resJson.message, false);
      }
    }
  });
}

exports.searchSeller = function(req, callback){
  var logger = log.logger_omsAdminPanel;
  var db = dbConfig.mongoDbConn;
  var acl = require('acl');
  var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
  logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

  acl.isAllowed(req.user.userId, "SellerOnboardingPanel", "View", function(err, result){
    if (err) {
      resJson = {
          "http_code": 500,
          "message": "Error - User Authorization Failed. Please contact engineering team."
      };
      callback(true,resJson);
      logger.error(TAG + "Error in user Authorization. ERROR : \n" + err.stack);
    } else {
      if (result) {
       sellerVerificationSceta.searchSeller(req, function(err, regres){
         callback(err,regres);
        });
      } else {
        resJson = {
            "http_code": 403,
            "message": "User does not have permission to perform this action on this resource."
        };
        callback(true,resJson);
        logger.info(TAG + "user unauthorized. UserId : " + req.user.email + " PATH : " + req.url);
        omsPanel.audit(req, resJson.http_code, resJson.message, false);
      }
    }
  });
}

exports.fetchSellerDetails = function(req, callback){
  var logger = log.logger_omsAdminPanel;
  var db = dbConfig.mongoDbConn;
  var acl = require('acl');
  var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
  logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

  acl.isAllowed(req.user.userId, "SellerOnboardingPanel", "View", function(err, result){
    if (err) {
      resJson = {
          "http_code": 500,
          "message": "Error - User Authorization Failed. Please contact engineering team."
      };
      callback(true,resJson);
      logger.error(TAG + "Error in user Authorization. ERROR : \n" + err.stack);
    } else {
      if (result) {
       sellerVerificationSceta.fetchSellerDetails(req, function(err, regres){
         callback(err,regres);
        });
      } else {
        resJson = {
            "http_code": 403,
            "message": "User does not have permission to perform this action on this resource."
        };
        callback(true,resJson);
        logger.info(TAG + "user unauthorized. UserId : " + req.user.email + " PATH : " + req.url);
        omsPanel.audit(req, resJson.http_code, resJson.message, false);
      }
    }
  });
}

exports.approveSeller = function(req, callback){
  var logger = log.logger_omsAdminPanel;
  var db = dbConfig.mongoDbConn;
  var acl = require('acl');
  var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
  logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

  acl.isAllowed(req.user.userId, "SellerOnboardingPanel", "Modify", function(err, result){
    if (err) {
      resJson = {
          "http_code": 500,
          "message": "Error - User Authorization Failed. Please contact engineering team."
      };
      callback(true,resJson);
      logger.error(TAG + "Error in user Authorization. ERROR : \n" + err.stack);
    } else {
      if (result) {
       sellerVerificationSceta.approveSeller(req, function(err, regres){
         callback(err,regres);
        });
      } else {
        resJson = {
            "http_code": 403,
            "message": "User does not have permission to perform this action on this resource."
        };
        callback(true,resJson);
        logger.info(TAG + "user unauthorized. UserId : " + req.user.email + " PATH : " + req.url);
        omsPanel.audit(req, resJson.http_code, resJson.message, false);
      }
    }
  });
}

exports.rejectSeller = function(req, callback){
  var logger = log.logger_omsAdminPanel;
  var db = dbConfig.mongoDbConn;
  var acl = require('acl');
  var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
  logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

  acl.isAllowed(req.user.userId, "SellerOnboardingPanel", "Modify", function(err, result){
    if (err) {
      resJson = {
          "http_code": 500,
          "message": "Error - User Authorization Failed. Please contact engineering team."
      };
      callback(true,resJson);
      logger.error(TAG + "Error in user Authorization. ERROR : \n" + err.stack);
    } else {
      if (result) {
       sellerVerificationSceta.rejectSeller(req, function(err, regres){
         callback(err,regres);
        });
      } else {
        resJson = {
            "http_code": 403,
            "message": "User does not have permission to perform this action on this resource."
        };
        callback(true,resJson);
        logger.info(TAG + "user unauthorized. UserId : " + req.user.email + " PATH : " + req.url);
        omsPanel.audit(req, resJson.http_code, resJson.message, false);
      }
    }
  });
}

exports.addBasicInfo = function(req, callback){
  var logger = log.logger_omsAdminPanel;
  var db = dbConfig.mongoDbConn;
  var acl = require('acl');
  var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
  logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

  acl.isAllowed(req.user.userId, "SellerOnboardingPanel", "Modify", function(err, result){
    if (err) {
      resJson = {
          "http_code": 500,
          "message": "Error - User Authorization Failed. Please contact engineering team."
      };
      callback(true,resJson);
      logger.error(TAG + "Error in user Authorization. ERROR : \n" + err.stack);
    } else {
      if (result) {
        try{     
          req.body.supplierSession = JSON.parse(req.body.supplierSession);    
        }catch(e){    
          req.body.supplierSession = req.body.supplierSession;    
        }
       sellerProfile.updateSellerDetails(req, function(err, regres){
         callback(err,regres);
        });
      } else {
        resJson = {
            "http_code": 403,
            "message": "User does not have permission to perform this action on this resource."
        };
        callback(true,resJson);
        logger.info(TAG + "user unauthorized. UserId : " + req.user.email + " PATH : " + req.url);
        omsPanel.audit(req, resJson.http_code, resJson.message, false);
      }
    }
  });
}

exports.addFinancialData = function(req, callback){
  var logger = log.logger_omsAdminPanel;
  var db = dbConfig.mongoDbConn;
  var acl = require('acl');
  var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
  logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

  acl.isAllowed(req.user.userId, "SellerOnboardingPanel", "Modify", function(err, result){
    if (err) {
      resJson = {
          "http_code": 500,
          "message": "Error - User Authorization Failed. Please contact engineering team."
      };
      callback(true,resJson);
      logger.error(TAG + "Error in user Authorization. ERROR : \n" + err.stack);
    } else {
      if (result) {
        try{     
          req.body.supplierSession = JSON.parse(req.body.supplierSession);    
        }catch(e){    
          req.body.supplierSession = req.body.supplierSession;    
        }
       sellerProfile.addFinancialInfo(req, function(err, regres){
         callback(err,regres);
        });
      } else {
        resJson = {
            "http_code": 403,
            "message": "User does not have permission to perform this action on this resource."
        };
        callback(true,resJson);
        logger.info(TAG + "user unauthorized. UserId : " + req.user.email + " PATH : " + req.url);
        omsPanel.audit(req, resJson.http_code, resJson.message, false);
      }
    }
  });
}

exports.addFullfilmentDetails = function(req, callback){
  var logger = log.logger_omsAdminPanel;
  var db = dbConfig.mongoDbConn;
  var acl = require('acl');
  var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
  logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

  acl.isAllowed(req.user.userId, "SellerOnboardingPanel", "Modify", function(err, result){
    if (err) {
      resJson = {
          "http_code": 500,
          "message": "Error - User Authorization Failed. Please contact engineering team."
      };
      callback(true,resJson);
      logger.error(TAG + "Error in user Authorization. ERROR : \n" + err.stack);
    } else {
      if (result) {
       sellerProfile.addEnquiryAndCategoryInfo(req, function(err, regres){
         callback(err,regres);
        });
      } else {
        resJson = {
            "http_code": 403,
            "message": "User does not have permission to perform this action on this resource."
        };
        callback(true,resJson);
        logger.info(TAG + "user unauthorized. UserId : " + req.user.email + " PATH : " + req.url);
        omsPanel.audit(req, resJson.http_code, resJson.message, false);
      }
    }
  });
}

exports.addBusinessDetails = function(req, callback){
  var logger = log.logger_omsAdminPanel;
  var db = dbConfig.mongoDbConn;
  var acl = require('acl');
  var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
  logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

  acl.isAllowed(req.user.userId, "SellerOnboardingPanel", "Modify", function(err, result){
    if (err) {
      resJson = {
          "http_code": 500,
          "message": "Error - User Authorization Failed. Please contact engineering team."
      };
      callback(true,resJson);
      logger.error(TAG + "Error in user Authorization. ERROR : \n" + err.stack);
    } else {
      if (result) {
        try{     
          req.body.supplierSession = JSON.parse(req.body.supplierSession);    
        }catch(e){    
          req.body.supplierSession = req.body.supplierSession;    
        }
       sellerProfile.addBusinessInfo(req, function(err, regres){
         callback(err,regres);
        });
      } else {
        resJson = {
            "http_code": 403,
            "message": "User does not have permission to perform this action on this resource."
        };
        callback(true,resJson);
        logger.info(TAG + "user unauthorized. UserId : " + req.user.email + " PATH : " + req.url);
        omsPanel.audit(req, resJson.http_code, resJson.message, false);
      }
    }
  });
}
