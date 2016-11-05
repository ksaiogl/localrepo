var TAG = "---CRM ServiceProvider ---    ";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var crmConstants = require('./crmConstants');
var async = require('async');
var restClient = require('node-rest-client').Client;
var urlConstants = require('../helpers/urlConstants');
var env = require('../../Environment/env.js').env;

exports.uploadToCRM = function(req, action, callback){

  var logger = log.logger_crm;
  var db = dbConfig.mongoDbConn;
  var affiliateCRM = [];
  var uploadSuccessResults = [];
  var uploadFailureResults = [];

  if (req.query.affiliateIds) {
    var strAffiliateId = req.query.affiliateIds.split(',');

    var affiliateIds = [];

    strAffiliateId.forEach(function(element){
      affiliateIds.push(parseInt(element));
    });


    db.collection('ServiceProvider').find({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": {'$in': affiliateIds}},
     {"_id":0,
     "serviceProviderEntity.profileInfo":1,
     "serviceProviderEntity.basicInfo":1
   }).toArray(function(err, results){
      if (err) {
        resJson = {
            "http_code": 500,
            "message": "Error - ServiceProvider upload to CRM failed. Please contact engineering team."
        };
        callback(true,resJson);
        logger.error(TAG + " ERROR : \n" + err.stack);
      } else {

        if (results.length) {
            async.each(results, function(affiliate, asyncCallback){
              try {
                var affiliateCrm = affiliateCRMObj(affiliate);
                affiliateCRM.push(affiliateCrm);
              } catch (e) {
                uploadSuccessResults.push("http_code : " +  500 + " ServiceProvider rejected due to incorrect format. Affiliate ID : " + affiliate.serviceProviderEntity.profileInfo.accountInfo.serviceProviderId );
                logger.info(TAG + "ServiceProvider rejected due to incorrect format. Affiliate ID: " + affiliate.serviceProviderEntity.profileInfo.accountInfo.serviceProviderId );
              } finally {
                asyncCallback();
              }
              // var affiliateCrm = affiliateCRMObj(affiliate);
              // affiliateCRM.push(affiliateCrm);
              // asyncCallback();

            },function(err){
              if (err) {
                resJson = {
                    "http_code": 500,
                    "message": "Error - ServiceProvider upload to CRM failed. Please contact engineering team."
                };
                callback(true,resJson);
                logger.error(TAG + " ERROR : \n" + err.stack);
              } else {


                var options_auth = { user: crmConstants.crmCredentials.username, password: crmConstants.crmCredentials.password };
                var crmclient = new restClient(options_auth);

                async.each(affiliateCRM, function(affiliate, asyncCallback){
                  if (action === 'upload') {
                      var args = {
                        data: affiliate
                      };
                      if (affiliate.crmId) delete affiliate.crmId;
                      var crmReq = crmclient.post(urlConstants.getCrmContactURL(env), args, function (data, response) {
                        // parsed response body as js object
                        if (response.statusCode == 201) {
                          db.collection('ServiceProvider').update({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": parseInt(affiliate.customFields.c.affiliate_id)},{'$set':{'serviceProviderEntity.profileInfo.accountInfo.crmId':data.id}},function(err, result){
                            if (err) {
                              uploadFailureResults.push("http_code : " +  500 + " Error - ServiceProvider crm id updation Failed. Please contact engineering team. Affiliate ID : " + affiliate.customFields.c.affiliate_id);
                              logger.info(TAG + "Error - ServiceProvider crm id updation Failed. Please contact engineering team. Affiliate ID : " + affiliate.customFields.c.affiliate_id);
                              asyncCallback();
                            } else {
                              if (result.result.n == 0) {
                                uploadFailureResults.push("http_code : " +  response.statusCode + " No document found during update for affiliate ID : " + affiliate.customFields.c.affiliate_id);
                                asyncCallback();
                                logger.info(TAG + "No document found during update for ServiceProvider : " + affiliate.customFields.c.affiliate_id);
                              } else {
                                uploadSuccessResults.push("http_code : " +  response.statusCode + " ServiceProvider uploaded successfully to CRM. Affiliate ID : " + affiliate.customFields.c.affiliate_id );
                                asyncCallback();
                                logger.info(TAG + "ServiceProvider uploaded successfully to CRM. Affiliate ID: " + affiliate.customFields.c.affiliate_id );
                              }
                            }
                          });
                        } else {
                          uploadFailureResults.push("http_code : " +  response.statusCode + " ServiceProvider upload failed to CRM. Affiliate ID : " + affiliate.customFields.c.affiliate_id + " Message : " + data.toString('utf8'));
                          asyncCallback();
                      }
                    });

                  } else if (action === 'update') {
                    if (affiliate.crmId) {

                      var crmId = affiliate.crmId;
                        delete affiliate.crmId;
                        var args = {
                          data: affiliate,
                          headers: { "X-HTTP-Method-Override": "PATCH" }
                        };

                        var crmReq = crmclient.post(urlConstants.getCrmContactURL(env) + crmId, args, function (data, response) {
                          if (response.statusCode == 200) {
                            uploadSuccessResults.push("http_code : " +  response.statusCode + " ServiceProvider updated successfully to CRM. Affiliate ID : " + affiliate.customFields.c.affiliate_id);
                            asyncCallback();
                            logger.info(TAG + "ServiceProvider updated successfully to CRM. Affiliate ID : " + affiliate.customFields.c.affiliate_id );

                          } else {
                            uploadFailureResults.push("http_code : " +  response.statusCode + " ServiceProvider updated failed to CRM. Affiliate ID : " + affiliate.customFields.c.affiliate_id + " Message : " + data.toString('utf8'));
                            asyncCallback(true);
                        }
                      });
                    } else {
                      uploadFailureResults.push(" ServiceProvider updated failed to CRM. Affiliate ID : " + affiliate.customFields.c.affiliate_id + " Message : " + " Service Provider not present in CRM");
                    }
                  }
                },
                function(err){
                  resJson = {
                      "http_code": 200,
                      "SuccessReport" : uploadSuccessResults,
                      "FailureReport" : uploadFailureResults
                  };
                  callback(true,resJson);
                  logger.info(TAG + " ServiceProvider CRM report. \n", JSON.stringify(resJson));
                });

              }
            });

        } else {
          resJson = {
              "http_code": 404,
              "message": "No serviceProvider found for Affiliate ID : " + affiliateIds
          };
          callback(true,resJson);
          logger.error(TAG + "No serviceProvider found for Affiliate ID : " + affiliateIds);
        }
      }
    });
  } else {
    resJson = {
        "http_code": 400,
        "message": "Bad or ill-formed request. Query param affiliateIds missing"
    };
      callback(true,resJson);
      logger.error(TAG + " ERROR : " + resJson.message);
  }

}


function affiliateCRMObj(affiliate){
  affiliateCrm ={
	"customFields": {
		"c": {
			"city": {
				"lookupName": " "
			},
			"contact_type": {
				"lookupName": "Affiliate"
			},
			"affiliate_type": {
				"lookupName": "Architect"
			},
			"other_affiliate_type": null,
			"affiliate_id": "",
			"address_line_1": " ",
			"address_line_2": " ",
			"state": " ",
			"affiliate_name": " ",
			"pincode": " "
		}
	},
	"emails": {
		"address": " ",
		"addressType": {
			"lookupName": "Email - Primary"
		}
	},
	"name": {
		"first": "  ",
		"last": " "
	},
	"phones": {
		"number": " ",
		"phoneType": {
			"lookupName": "Mobile Phone"
		}
	}
}

  var officialAddress = affiliate.serviceProviderEntity.profileInfo.basicInfo.address.find(findOfficialAddress);

    if (crmConstants.city[officialAddress.city.toLowerCase()]) {
      affiliateCrm.customFields.c.city.lookupName = crmConstants.city[officialAddress.city.toLowerCase()];
    } else {
      affiliateCrm.customFields.c.city.lookupName = crmConstants.city.default;
      affiliateCrm.customFields.c.other_city = officialAddress.city;
    }

    affiliateCrm.customFields.c.affiliate_id = affiliate.serviceProviderEntity.profileInfo.accountInfo.serviceProviderId.toString();

    if (officialAddress.address1) affiliateCrm.customFields.c.address_line_1 = officialAddress.address1.trim();
    if (officialAddress.address2) affiliateCrm.customFields.c.address_line_2 = officialAddress.address2.trim();
    if (officialAddress.state) affiliateCrm.customFields.c.state = officialAddress.state.trim();
    if (officialAddress.pincode) affiliateCrm.customFields.c.pincode = officialAddress.pincode.trim();


    if (affiliate.serviceProviderEntity.profileInfo.basicInfo.company) affiliateCrm.customFields.c.affiliate_name = affiliate.serviceProviderEntity.profileInfo.basicInfo.company.trim();

    if (affiliate.serviceProviderEntity.profileInfo.accountInfo.email) affiliateCrm.emails.address = affiliate.serviceProviderEntity.profileInfo.accountInfo.email.trim();

    if (affiliate.serviceProviderEntity.profileInfo.basicInfo.proprietorFirstName) affiliateCrm.name.first = affiliate.serviceProviderEntity.profileInfo.basicInfo.proprietorFirstName.trim();
    if (affiliate.serviceProviderEntity.profileInfo.basicInfo.proprietorLastName) affiliateCrm.name.last = affiliate.serviceProviderEntity.profileInfo.basicInfo.proprietorLastName.trim();

    if (affiliate.serviceProviderEntity.profileInfo.accountInfo.mobile) affiliateCrm.phones.number = affiliate.serviceProviderEntity.profileInfo.accountInfo.mobile.trim();

    if (affiliate.serviceProviderEntity.profileInfo.accountInfo.crmId) {
      affiliateCrm.crmId = affiliate.serviceProviderEntity.profileInfo.accountInfo.crmId;
    }

    return affiliateCrm;

};


function findOfficialAddress(address){
  return address.type == 'OFFICIAL';
}



exports.updateFromCRM = function(affiliateCrm, callback){
var start = new Date();
  var logger = log.logger_crm;
  var affiliateId = parseInt(affiliateCrm.customFields.c.affiliate_id);

  var db = dbConfig.mongoDbConn;

  db.collection('ServiceProvider').findOne({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": affiliateId},{"_id": 0,},
  function(err, affiliate){
    if (err) {
      resJson = {
          "http_code": 500,
          "message": "Error - Error retriving ServiceProvider. Please contact engineering team."
      };
        callback(true,resJson);
      logger.error(TAG + "Error retriving ServiceProvider. ERROR : \n" + err.stack);
    } else {
      if (affiliate) {


          var officialAddress = affiliate.serviceProviderEntity.profileInfo.basicInfo.address.find(findOfficialAddress);

          if (crmConstants.city[affiliateCrm.customFields.c.city.lookupName.toLowerCase()]) {
            officialAddress.city = affiliateCrm.customFields.c.city.lookupName;
          } else {
            officialAddress.city = affiliateCrm.customFields.c.other_city;
          }

          officialAddress.address1 = affiliateCrm.customFields.c.address_line_1;
          officialAddress.address2 = affiliateCrm.customFields.c.address_line_2;
          officialAddress.state = affiliateCrm.customFields.c.state;
          officialAddress.pincode = affiliateCrm.customFields.c.pincode;


          affiliate.serviceProviderEntity.profileInfo.basicInfo.company = affiliateCrm.customFields.c.affiliate_name;

          affiliate.serviceProviderEntity.profileInfo.basicInfo.proprietorFirstName = affiliateCrm.name.first;

          affiliate.serviceProviderEntity.profileInfo.basicInfo.proprietorLastName = affiliateCrm.name.last;

          var crmId = affiliateCrm.id;

          async.parallel([
            function(callback){
              //Get email
              var options_auth = { user: crmConstants.crmCredentials.username, password: crmConstants.crmCredentials.password };
              var crmclient = new restClient(options_auth);
              var crmReq = crmclient.get(urlConstants.getCrmContactURL(env) + crmId + '/emails/0', function (data, response) {
                if (response.statusCode == 200) {
                  affiliate.serviceProviderEntity.profileInfo.accountInfo.email = data.address;
                  callback(false);
                } else if (response.statusCode == 404) {
                  callback(false);
                  logger.info("No email id found for Affiliate ID : " + affiliateId);
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
                  affiliate.serviceProviderEntity.profileInfo.accountInfo.mobile = data.number;
                  callback(false);
                } else if (response.statusCode == 404) {
                  callback(false);
                  logger.info("No mobile number found for Affiliate ID : " + affiliateId);
                }
              });

              crmReq.on('error', function (err) {
                callback(err);
              })
            }
          ],
          // optional callback
          function(err){
            if (err) {
              resJson = {
                  "http_code": 500,
                  "message": "Error - Error fetching seller email/phone. Please contact engineering team."
              };
              logger.error("Error fetching seller email/phone. Please contact engineering team.\n" + err.stack);
              callback(true,resJson);
            } else {

              db.collection('ServiceProvider').findAndModify({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId":affiliateId}, null, {'$set':affiliate}, {new: true}, function(err, result){
                if (err) {
                  resJson = {
                      "http_code": 500,
                      "message": "Error - ServiceProvider updation Failed. Please contact engineering team."
                  };
                    callback(true,resJson);
                  logger.info(TAG + "Error - ServiceProvider updation Failed. Please contact engineering team. ERROR : \n" + err.stack);
                } else {
                  if (result) {
                      resJson = {
                          "http_code": 200,
                          "message": "ServiceProvider updated successfully from CRM. Affiliate ID : " + affiliateId
                      };
                        callback(false,resJson);
                      logger.info(TAG + "ServiceProvider updated successfully from CRM. Affiliate ID : " + affiliateId );
var stop = new Date();
console.log('Service Provider Time taken : ', stop - start);

                  } else {
                    resJson = {
                        "http_code": 404,
                        "message": "No document found during update for Affiliate ID : " + affiliateId
                    };
                      callback(true,resJson);
                    logger.info(TAG + "No document found during update for Affiliate ID : " + affiliateId);
                  }
                }
              });
            }
          });

      } else {
        resJson = {
            "http_code": 404,
            "message": "No Affiliate found for Affiliate ID : " + affiliateId
        };
          callback(true,resJson);
        logger.info(TAG + "No Affiliate found for Affiliate ID : " + affiliateId);
      }
    }
  });
};
