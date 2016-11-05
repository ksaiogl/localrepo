var TAG = "---CRM Customer ---    ";
// var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var crmConstants = require('./crmConstants');
var async = require('async');
var restClient = require('node-rest-client').Client;
var urlConstants = require('../helpers/urlConstants');
var env = require('../../Environment/env.js').env;
var async = require('async');

exports.updateFromCRM = function(customerCrm, callback){
var start = new Date();

  var logger = log.logger_crm;

  var customerId = parseInt(customerCrm.customFields.c.affiliate_id);

  var crmId = customerCrm.id;

  async.parallel([
    function(callback){
      //Get email
      var options_auth = { user: crmConstants.crmCredentials.username, password: crmConstants.crmCredentials.password };
      var crmclient = new restClient(options_auth);
      var crmReq = crmclient.get(urlConstants.getCrmContactURL(env) + crmId + '/emails/0', function (data, response) {
        if (response.statusCode == 200) {
          customerCrm.emails.email = data.address;
          callback(false);
        } else if (response.statusCode == 404) {
          customerCrm.emails.email = null;
          callback(false);
          logger.info("No email id found for Customer ID : " + affiliateId);
        }
      });

      crmReq.on('error', function (err) {
        callback(err);
      })

    },
    function(callback){
      //Get Mobile
      var options_auth = { user: crmConstants.crmCredentials.username, password: crmConstants.crmCredentials.password };
      var crmclient = new restClient(options_auth);

      var crmReq = crmclient.get(urlConstants.getCrmContactURL(env) + crmId + '/phones/1', function (data, response) {
        if (response.statusCode == 200) {
          customerCrm.phones.mobile = data.number;
          callback(false);
        } else if (response.statusCode == 404) {
          customerCrm.phones.mobile = null;
          callback(false);
          logger.info("No mobile number found for Customer ID : " + affiliateId);
        }
      });

      crmReq.on('error', function (err) {
        callback(err);
      })
    }
  ],
  function(err){
    if (err) {
      resJson = {
          "http_code": 500,
          "message": "Error - Error fetching seller email/phone. Please contact engineering team."
      };
      logger.error("Error fetching Customer email/phone. Please contact engineering team.\n" + err.stack);
      callback(true,resJson);
    } else {
      var crmclient = new restClient();

      var args = customerCrm;
      var args = {
        data: customerCrm,
        headers: { "Content-Type": "application/json" }
      };

      args.data.method = "updateCrmCustomerData";
      args.data.sessionKey = "mMsSuUpPpPlLyY!@$%^*()560102";

      var req = crmclient.post(urlConstants.getCustomerCrmURL(env), args, function (data, response) {
        try {
          if (response.statusCode == 200) {
            var magentoresp = JSON.parse(data.toString('utf8'));
              logger.info(TAG + "Customer updated successfully on magento. Message : " + magentoresp.message);
              resJson = {
                  "http_code": 200,
                  "message": "Customer updated successfully"
              };
              callback(false,resJson);
var stop = new Date();
console.log('Customer Time taken : ', stop - start);
          } else {
            resJson = {
                "http_code": response.statusCode,
                "message": "Customer update FAILED with MAGENTO ERROR"
            };
            callback(true,resJson);
            logger.info(TAG + "http_code : " + response.statusCode  + " Customer update FAILED with MAGENTO ERROR");
            logger.info(TAG + "Input : " + JSON.stringify(args.data));
          }
        } catch (e) {
          resJson = {
              "http_code": 500,
              "message": "Customer update FAILED with exception"
          };
          logger.info(TAG + "Error updating customer to magento. Customer update FAILED with exception. ERROR : \n" + e.stack);
          callback(true,resJson);
          logger.info(TAG + "Input : " + JSON.stringify(args));
        }

      });

      // req.on('error', function (err) {
      //   // console.log('request error', err);
      //   uploadFailureResults.push("Price update failed on  magento. Error : " + JSON.stringify(err));
      //   // logger.error(TAG + "Price update failed on  magento. Error : " + JSON.stringify(err));
      //   callback(false);
      // });

      // console.log(JSON.stringify(customerCrm));
      // resJson = {
      //     "http_code": 200,
      //     "message": "Customer found"
      // };
      // logger.info("Customer found");
      // callback(true,resJson);
    }
  });
};
