var TAG = "--- Admin Panel ---    ";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var builderRegistration = require('../businesstobuilder/builderRegistration.js');
var restClient = require('node-rest-client').Client;
var urlConstants = require('../helpers/urlConstants');
var env = require('../../Environment/env.js').env;
var generateInquiryReport = require('./util/rfqInquiryReport.js');
var generateBuilderReport = require('./util/rfqBuilderReport.js');
// var omsPanel = require('./omsPanel.js');
var omsPanel = require('./omsPanel.js');
var audit = require('./omsPanel').audit;
var floatInquiry = require('../businesstobuilder/floatInquiry.js');
var inquiryDetailsForFloat = require('../businesstobuilder/inquiryDetailsForFloat.js');
var createStructuredInquiry = require('../businesstobuilder/createStructuredInquiry.js');
var quotationMaster = require('../businesstobuilder/quotationMaster.js');
var approveInquiryFloat = require('../businesstobuilder/approveInquiryFloat.js');
var listAllInquiries = require('../businesstobuilder/listInquiry.js');
var InquiryFilters = require('../businesstobuilder/inquiryFilters.js');
var builderProjects = require('../businesstobuilder/builderProjects.js');
var masterQuotationReport = require('../businesstobuilder/masterQuotationReport.js');
var RFQPurchaseMangersCities = require('../businesstobuilder/RFQPurchaseMangersCities.js');

var masterQuotationV2 = require('../businesstobuilder/masterQuotation_V2.js');
var masterQuotationReport_V2 = require('../businesstobuilder/masterQuotationReport_V2.js');


exports.approveBuilder = function(req, callback){
  var logger = log.logger_rfq;
  var db = dbConfig.mongoDbConn;
  var acl = require('acl');
  var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
  logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

  acl.isAllowed(req.user.userId, "RFQPanel", "Modify", function(err, result){
    if (err) {
      resJson = {
          "http_code": 500,
          "message": "Error - User Authorization Failed. Please contact engineering team."
      };
      callback(true,resJson);
      logger.error(TAG + "Error in user Authorization. ERROR : \n" + err.stack);
    } else {
      if (result) {
        logger.info(TAG + "Approval request for builder ID : " + req.body.company_id);

        var client = new restClient();
        var args = {
          data: {
            method: req.body.method,
            company_id: req.body.company_id, 
            status: req.body.status
          },
          headers:{
            'content-type':'application/JSON'
          }
        };
        client.post(urlConstants.getRfqMagentoURL(env), args, function (data, response) {
          try {
            if (response.statusCode == 200) {
              var magentoResp = JSON.parse(data.toString('utf8'));
              // if (!magentoResp.data[0].error_code) {
                logger.info(TAG + "http_code : " + response.statusCode  + ". Builder approved successfully on magento. Resp : " + data.toString('utf8'));
                builderRegistration.addBuilder(req, callback);
              // } else {
              //   logger.error(TAG + "http_code : " + response.statusCode  + ". Builder approval failed on magento. Resp : " + data.toString('utf8'));
              //   resJson = {
              //       "http_code": 500,
              //       "message": "Error - Builder Approval Failed. Please contact engineering team."
              //   };
              //   callback(true,resJson);
              // }

            } else {
              logger.error(TAG + "http_code : " + response.statusCode  + ". Builder approval failed on magento. Resp : " + data.toString('utf8'));
              resJson = {
                  "http_code": response.statusCode,
                  "message": "Error - Builder Approval Failed. Please contact engineering team."
              };
              callback(true,resJson);
            }
          } catch (e) {
            logger.error("Builder approval failed with error \n" + e.stack);
            resJson = {
                "http_code": 500,
                "message": "Error - Builder Approval Failed. Please contact engineering team."
            };
            callback(true,resJson);

          }

        });

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


exports.generateRfqInquiryReport = function(req, res){

  var logger = log.logger_rfq;
  var db = dbConfig.mongoDbConn;
  var acl = require('acl');
  var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
  logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

  acl.isAllowed(req.user.userId, "RFQPanel", "View", function(err, result){
    if (err) {
      resJson = {
          "http_code": 500,
          "message": "Error - User Authorization Failed. Please contact engineering team."
      };
      callback(true,resJson);
      logger.error(TAG + "Error in user Authorization. ERROR : \n" + err.stack);
    } else {
      if (result) {
          generateInquiryReport.generateRfqInquiryReport(req, res);
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

exports.generateRfqBuilderReport = function(req, res){
  var logger = log.logger_rfq;
  var db = dbConfig.mongoDbConn;
  var acl = require('acl');
  var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
  logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

  acl.isAllowed(req.user.userId, "RFQPanel", "View", function(err, result){
    if (err) {
      resJson = {
          "http_code": 500,
          "message": "Error - User Authorization Failed. Please contact engineering team."
      };
      callback(true,resJson);
      logger.error(TAG + "Error in user Authorization. ERROR : \n" + err.stack);
    } else {
      if (result) {
          generateBuilderReport.generateRfqBuilderReport(req, res);
      } else {
        resJson = {
            "http_code": 403,
            "message": "User does not have permission to perform this action on this resource."
        };
        callback(true,resJson);
        logger.info(TAG + "user unauthorized. UserId : " + req.user.email + " PATH : " + req.url);
        omsPanel.audit (req, resJson.http_code, resJson.message, false);
      }
    }
  });
}

//=================== Supplier Internal Web Panel (RFQ Release 2) =====================//

exports.floatInquiryToSuppliers = function(req, callback){
  var logger = log.logger_omsAdminPanel;
  var db = dbConfig.mongoDbConn;
  var acl = require('acl');
  var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
  logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

  acl.isAllowed(req.user.userId, "SupplierInternalPanel", ["Create","Modify"], function(err, result){
    if (err) {
      resJson = {
          "http_code": 500,
          "message": "Error - User Authorization Failed. Please contact engineering team."
      };
      callback(true, resJson);
      logger.error(TAG + "Error in user Authorization. ERROR : \n" + err.stack);
    } else {
      if (result) {
        floatInquiry.floatInquiryToSuppliers(req, function(err,regres){
          callback(false, regres);
        });
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

exports.fetchInquiryDetailsForFloat = function(req, callback){
  var logger = log.logger_omsAdminPanel;
  var db = dbConfig.mongoDbConn;
  var acl = require('acl');
  var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
  logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

  acl.isAllowed(req.user.userId, "SupplierInternalPanel", "View", function(err, result){
    if (err) {
      resJson = {
          "http_code": 500,
          "message": "Error - User Authorization Failed. Please contact engineering team."
      };
      callback(true, resJson);
      logger.error(TAG + "Error in user Authorization. ERROR : \n" + err.stack);
    } else {
      if (result) {
        inquiryDetailsForFloat.inquiryDetailsForSupplierFloat(req, function(err,regres){
          callback(false, regres);
        });
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

exports.createInquiry = function(req, callback){
  var logger = log.logger_omsAdminPanel;
  var db = dbConfig.mongoDbConn;
  var acl = require('acl');
  var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
  logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

  acl.isAllowed(req.user.userId, "SupplierInternalPanel", "Create", function(err, result){
    if (err) {
      resJson = {
          "http_code": 500,
          "message": "Error - User Authorization Failed. Please contact engineering team."
      };
      callback(true, resJson);
      logger.error(TAG + "Error in user Authorization. ERROR : \n" + err.stack);
    } else {
      if (result) {
        createStructuredInquiry.structureEnquiry(req, function(err,regres){
          callback(false, regres);
        });
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

exports.fetchQuotationMaster = function(req, callback){
  var logger = log.logger_omsAdminPanel;
  var db = dbConfig.mongoDbConn;
  var acl = require('acl');
  var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
  logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

  acl.isAllowed(req.user.userId, "SupplierInternalPanel", "View", function(err, result){
    if (err) {
      resJson = {
          "http_code": 500,
          "message": "Error - User Authorization Failed. Please contact engineering team."
      };
      callback(true, resJson);
      logger.error(TAG + "Error in user Authorization. ERROR : \n" + err.stack);
    } else {
      if (result) {
        quotationMaster.fetchQuotationMaster(req, function(err,regres){
          callback(false, regres);
        });
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

exports.fetchMasterQuotationV2 = function(req, callback){
    var logger = log.logger_omsAdminPanel;
    var db = dbConfig.mongoDbConn;
    var acl = require('acl');
    var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
    logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

    acl.isAllowed(req.user.userId, "SupplierInternalPanel", "View", function(err, result){
        if (err) {
            resJson = {
                "http_code": 500,
                "message": "Error - User Authorization Failed. Please contact engineering team."
            };
            callback(true, resJson);
            logger.error(TAG + "Error in user Authorization. ERROR : \n" + err.stack);
        } else {
            if (result) {
                masterQuotationV2.fetchQuotationMaster(req, function(err,regres){
                    callback(false, regres);
                });
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


exports.approveFloat = function(req, callback){
  var logger = log.logger_omsAdminPanel;
  var db = dbConfig.mongoDbConn;
  var acl = require('acl');
  var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
  logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

  acl.isAllowed(req.user.userId, "SupplierInternalPanel", "Modify", function(err, result){
    if (err) {
      resJson = {
          "http_code": 500,
          "message": "Error - User Authorization Failed. Please contact engineering team."
      };
      callback(true, resJson);
      logger.error(TAG + "Error in user Authorization. ERROR : \n" + err.stack);
    } else {
      if (result) {
        approveInquiryFloat.approveFloat(req, function(err,regres){
          callback(false, regres);
        });
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

exports.listInquiry = function(req, callback){
  var logger = log.logger_omsAdminPanel;
  var db = dbConfig.mongoDbConn;
  var acl = require('acl');
  var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
  logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

  acl.isAllowed(req.user.userId, "SupplierInternalPanel", "View", function(err, result){
    if (err) {
      resJson = {
          "http_code": 500,
          "message": "Error - User Authorization Failed. Please contact engineering team."
      };
      callback(true, resJson);
      logger.error(TAG + "Error in user Authorization. ERROR : \n" + err.stack);
    } else {
      if (result) {
        listAllInquiries.listInquiry(req, function(err,regres){
          callback(false, regres);
        });
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

exports.fetchInquiryFilters = function(req, callback){
  var logger = log.logger_omsAdminPanel;
  var db = dbConfig.mongoDbConn;
  var acl = require('acl');
  var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
  logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

  acl.isAllowed(req.user.userId, "SupplierInternalPanel", "View", function(err, result){
    if (err) {
      resJson = {
          "http_code": 500,
          "message": "Error - User Authorization Failed. Please contact engineering team."
      };
      callback(true, resJson);
      logger.error(TAG + "Error in user Authorization. ERROR : \n" + err.stack);
    } else {
      if (result) {
        InquiryFilters.fetchInquiryFilters(req,function(err,regres){
          callback(false, regres);
        });
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

exports.getMasterQuotationReport = function(req, res){
  var logger = log.logger_omsAdminPanel;
  var db = dbConfig.mongoDbConn;
  var acl = require('acl');
  var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
  logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

  acl.isAllowed(req.user.userId, "SupplierInternalPanel", "View", function(err, result){
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
        masterQuotationReport.getMasterQuotationReport(req, res);
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

exports.masterQuotationReportV2 = function(req, res){
    var logger = log.logger_omsAdminPanel;
    var db = dbConfig.mongoDbConn;
    var acl = require('acl');
    var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
    logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

    acl.isAllowed(req.user.userId, "SupplierInternalPanel", "View", function(err, result){
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
                masterQuotationReport_V2.getMasterQuotationReport(req, res);
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

exports.viewProject = function(req, callback){
  var logger = log.logger_omsAdminPanel;
  var db = dbConfig.mongoDbConn;
  var acl = require('acl');
  var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
  logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

  acl.isAllowed(req.user.userId, "SupplierInternalPanel", "View", function(err, result){
    if (err) {
      resJson = {
          "http_code": 500,
          "message": "Error - User Authorization Failed. Please contact engineering team."
      };
      callback(true, resJson);
      logger.error(TAG + "Error in user Authorization. ERROR : \n" + err.stack);
    } else {
      if (result) {
        builderProjects.viewProject(req, function(err, regres){
          callback(false, regres);
        });
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

exports.getRFQPurchaseMangersCities = function(req, callback){
  var logger = log.logger_omsAdminPanel;
  var db = dbConfig.mongoDbConn;
  var acl = require('acl');
  var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
  logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

  acl.isAllowed(req.user.userId, "SupplierInternalPanel", "View", function(err, result){
    if (err) {
      resJson = {
          "http_code": 500,
          "message": "Error - User Authorization Failed. Please contact engineering team."
      };
      callback(true, resJson);
      logger.error(TAG + "Error in user Authorization. ERROR : \n" + err.stack);
    } else {
      if (result) {
        RFQPurchaseMangersCities.getRFQPurchaseMangersCities(req, function(err, regres){
          callback(false, regres);
        });
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
