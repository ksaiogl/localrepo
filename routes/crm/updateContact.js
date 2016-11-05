var TAG = "---CRM Update Contact ---    ";
// var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var crmConstants = require('./crmConstants');
// var async = require('async');
var restClient = require('node-rest-client').Client;
var urlConstants = require('../helpers/urlConstants');
var env = require('../../Environment/env.js').env;
var supplierCrm = require('./supplierCrm');
var serviceProviderCrm = require('./serviceProviderCrm');
var customerCrm = require('./customerCrm');

exports.updateContact = function(req, callback) {
  try {
    var logger = log.logger_crm;
    logger.info(TAG + "Request received to update contact. REQ : " + req.url);

    var crmId = req.params.crmid;

    var options_auth = { user: crmConstants.crmCredentials.username, password: crmConstants.crmCredentials.password };
    var crmclient = new restClient(options_auth);
    var crmReq = crmclient.get(urlConstants.getCrmContactURL(env) + crmId, function (data, response) {
      try {
        if (response.statusCode == 200) {
          // console.log(data.customFields.c.contact_type.lookupName);

          switch (data.customFields.c.contact_type.lookupName) {
            case 'Supplier': {
              supplierCrm.updateFromCRM(data, callback);
              break;
            }
            case 'Affiliate' :{
              serviceProviderCrm.updateFromCRM(data, callback);
              break;
            }
            case 'Customer' :{
              resJson = {
                  "http_code": 200,
                  "Message" : "Customer contact update disabled"
              };
              callback(false,resJson);
              // logger.info(TAG + " Contact not found CRM ID : " + crmId);
              // customerCrm.updateFromCRM(data, callback);
              break;
            }

          }
        } else {
          resJson = {
              "http_code": 404,
              "Message" : "Contact not found CRM ID : " + crmId
          };
          callback(true,resJson);
          logger.info(TAG + " Contact not found CRM ID : " + crmId);
          // console.log(TAG + " Contact not found CRM ID : ", crmId);
        }
      } catch (e) {
        resJson = {
            "http_code": 500,
            "Message" : "Update failed for crmId : " + crmId + " with error : " + e.message
        };
        callback(true,resJson);
        logger.error(TAG + " Update failed for crmId : " + crmId + " with error : \n" + e.stack);
      }
    });
  } catch (e) {
    resJson = {
        "http_code": 500,
        "Message" : "Update failed with error : " + e.message
    };
    callback(true,resJson);
    logger.error(TAG + " Update failed with error : \n" + e.stack);
  }

}
