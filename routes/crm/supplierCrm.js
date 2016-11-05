var TAG = "---CRM Supplier ---    ";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var crmConstants = require('./crmConstants');
var async = require('async');
var restClient = require('node-rest-client').Client;
var urlConstants = require('../helpers/urlConstants');
var env = require('../../Environment/env.js').env;
var async = require('async');

exports.uploadToCRM = function(req, action, callback){
 
  var logger = log.logger_crm;
  var db = dbConfig.mongoDbConn;
  var sellerCRM = [];

  if (req.query.sellerIDs) {
    var sellerIDs = req.query.sellerIDs.split(',');

    db.collection('SellerMaster').find({"sellerEntity.profileInfo.accountInfo.sellerId": {'$in': sellerIDs}},
     {"_id":0,
     "sellerEntity.profileInfo.financialInfo":0,
     "sellerEntity.sellerTermsInfo":0,
     "sellerEntity.sellerVerificationInfo":0,
     "sellerEntity.sellerAccessInfo":0,
   }).toArray(function(err, results){
      if (err) {
        resJson = {
            "http_code": 500,
            "message": "Error - Seller upload to CRM failed. Please contact engineering team."
        };
        callback(true,resJson);
        logger.error(TAG + " ERROR : \n" + err.stack);
      } else {
        if (results.length) {
            async.each(results, function(seller, asyncCallback){
              var sellerCrm = sellerCRMObj(seller);
              sellerCRM.push(sellerCrm);
              // console.log(JSON.stringify(sellerCrm));
              asyncCallback();

            },function(err){
              if (err) {
                resJson = {
                    "http_code": 500,
                    "message": "Error - Seller upload to CRM failed. Please contact engineering team."
                };
                callback(true,resJson);
                logger.error(TAG + " ERROR : \n" + err.stack);
              } else {
                var uploadSuccessResults = [];
                var uploadFailureResults = [];

                var options_auth = { user: crmConstants.crmCredentials.username, password: crmConstants.crmCredentials.password };
                var crmclient = new restClient(options_auth);

                async.each(sellerCRM, function(seller, asyncCallback){
                  if (action === 'upload') {
                      var args = {
                        data: seller
                        //  headers: { "Content-Type": "application/json" }
                      };
                      if (seller.crmId) delete seller.crmId;

                      // console.log(JSON.stringify(seller));
                      var crmReq = crmclient.post(urlConstants.getCrmContactURL(env), args, function (data, response) {
                        // parsed response body as js object
                        if (response.statusCode == 201) {
                          db.collection('SellerMaster').update({"sellerEntity.profileInfo.accountInfo.sellerId":seller.customFields.c.supplier_id},{'$set':{'sellerEntity.profileInfo.accountInfo.crmId':data.id}}, function(err, result){
                            if (err) {
                              uploadFailureResults.push("http_code : " +  500 + " Error - Seller crm id updation Failed. Please contact engineering team. Seller Id : " + seller.customFields.c.supplier_id);
                              logger.info(TAG + "Error - Seller crm id updation Failed. Please contact engineering team. Seller Id : " + seller.customFields.c.supplier_id);
                              asyncCallback();
                            } else {
                              if (result.result.n == 0) {
                                uploadFailureResults.push("http_code : " +  response.statusCode + " No document found during update for sellerId : " + seller.customFields.c.supplier_id);
                                asyncCallback();
                                logger.info(TAG + "No document found during update for sellerId : " + seller.customFields.c.supplier_id);
                              } else {
                                uploadSuccessResults.push("http_code : " +  response.statusCode + " Seller uploaded successfully to CRM. Seller Id : " + seller.customFields.c.supplier_id  );
                                asyncCallback();
                                logger.info(TAG + "Seller uploaded successfully to CRM. SellerId : " + seller.customFields.c.supplier_id + " Message : " + JSON.stringify(data));
                              }
                            }
                          });
                        } else {
                          uploadFailureResults.push("http_code : " +  response.statusCode + " Seller uploaded failed to CRM. Seller Id : " + seller.customFields.c.supplier_id + " Message : " + data.toString('utf8'));
                          asyncCallback();
                      }
                    });

                  } else if (action === 'update') {
                    if (seller.crmId) {

                        var crmId = seller.crmId;
                        delete seller.crmId;
                        var args = {
                          data: seller,
                          headers: { "X-HTTP-Method-Override": "PATCH" }
                        };

                        var crmReq = crmclient.post(urlConstants.getCrmContactURL(env) + crmId, args, function (data, response) {
                          if (response.statusCode == 200) {
                            uploadSuccessResults.push("http_code : " +  response.statusCode + " Seller updated successfully to CRM. Seller Id : " + seller.customFields.c.supplier_id  );
                            asyncCallback();
                            logger.info(TAG + "Seller updated successfully to CRM. SellerId : " + seller.customFields.c.supplier_id );

                          } else {
                            uploadFailureResults.push("http_code : " +  response.statusCode + " Seller updated failed to CRM. Seller Id : " + seller.customFields.c.supplier_id + " Message : " + data.toString('utf8'));
                            asyncCallback(true);
                          // raw response
                          console.log(typeof response);
                        }
                      });


                    } else {
                          uploadFailureResults.push(" Seller updated failed to CRM. Seller ID : " + seller.customFields.c.supplier_id + " Message : " + " Seller not present in CRM");
                          asyncCallback();
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
                  logger.info(TAG + " Seller CRM report. \n", JSON.stringify(resJson));
                });
              }
            });

        } else {
          resJson = {
              "http_code": 404,
              "message": "No Seller found for id : " + sellerIDs
          };
          callback(true,resJson);
          logger.error(TAG + "No Seller found for id : " + sellerIDs);
        }
      }
    });
  } else {
    resJson = {
        "http_code": 400,
        "message": "Bad or ill-formed request. Query param sellerIDs missing"
    };
      callback(true,resJson);
      logger.error(TAG + " ERROR : " + resJson.message);
  }

}


  function sellerCRMObj(seller){
    sellerCrm ={
    "customFields":{
      "c":{
        "city":{
          "lookupName":""
        },
        "contact_type":{
          "lookupName":"Supplier"
        },
        "supplier_type":{
          "lookupName":"NA"
        },
        "grade":{
          "lookupName":"NA"
        },
        "black_listed":null,
        "pending_payment_sup":null,
        "others_supplier_type":null,
        "supplier_id":null,
        "address_line_1":" ",
        "address_line_2":" ",
        "supplier_active_status":false,
        "shipping_address_line_1":" ",
        "shipping_address_line_2":" ",
        "shipping_state":" ",
        "shipping_city":" ",
        "shipping_pincode":" ",
        "shipping_country":" ",
        "secondary_first_name":" ",
        "secondary_last_name":" ",
        "secondary_mobile_no":" ",
        "secondary_email":" ",
        "supplier_name":" ",
        "state":" ",
        "pincode":" "
      }
  },
    "emails": {
      "address":" ",
      "addressType":{
        "lookupName":"Email - Primary"
      }
    },
    "name": {
      "first":" ",
      "last":" "
    },
    "phones": {
      "number":" ",
      "phoneType":{
        "lookupName":"Mobile Phone"
      }
    }
  }    
    var officialAddress = seller.sellerEntity.profileInfo.basicInfo.companyInfo.invoiceAddress[0];
    
      if (crmConstants.city[officialAddress.city.toLowerCase()]) {
        sellerCrm.customFields.c.city.lookupName = crmConstants.city[officialAddress.city.toLowerCase()];
      } else {
        sellerCrm.customFields.c.city.lookupName = crmConstants.city.default;
        sellerCrm.customFields.c.other_city = officialAddress.city;
      }
      if(seller.sellerEntity.profileInfo.basicInfo.companyInfo.businessType !== null && seller.sellerEntity.profileInfo.basicInfo.companyInfo.businessType !== undefined){
          if (crmConstants.supplier_type[seller.sellerEntity.profileInfo.basicInfo.companyInfo.businessType.toLowerCase()]) {
            sellerCrm.customFields.c.supplier_type.lookupName = crmConstants.supplier_type[seller.sellerEntity.profileInfo.basicInfo.companyInfo.businessType.toLowerCase()];
          } 
          else {
            sellerCrm.customFields.c.supplier_type.lookupName = crmConstants.supplier_type.default;
            if (seller.sellerEntity.profileInfo.basicInfo.companyInfo.businessType){
              sellerCrm.customFields.c.others_supplier_type = seller.sellerEntity.profileInfo.basicInfo.companyInfo.businessType;
          }
        }
      }
      else{
        sellerCrm.customFields.c.supplier_type.lookupName = crmConstants.supplier_type.default;
      }
      

      sellerCrm.customFields.c.supplier_id = seller.sellerEntity.profileInfo.accountInfo.sellerId;
      if (officialAddress.address1) sellerCrm.customFields.c.address_line_1 = officialAddress.address1.trim();
      if (officialAddress.address2) sellerCrm.customFields.c.address_line_2 = officialAddress.address2.trim();

       
      var shippingAddress = seller.sellerEntity.profileInfo.basicInfo.companyInfo.wareHouseAddress[0];

      if (shippingAddress.address1) sellerCrm.customFields.c.shipping_address_line_1 = shippingAddress.address1.trim();
      if (shippingAddress.address2) sellerCrm.customFields.c.shipping_address_line_2 = shippingAddress.address2.trim();
      if (shippingAddress.state) sellerCrm.customFields.c.shipping_state = shippingAddress.state.trim();
      if (shippingAddress.city) sellerCrm.customFields.c.shipping_city = shippingAddress.city.trim();
      if (shippingAddress.pincode) sellerCrm.customFields.c.shipping_pincode = shippingAddress.pincode.trim();
      if (shippingAddress.country) sellerCrm.customFields.c.shipping_country = shippingAddress.country.trim();
      
      if (seller.sellerEntity.sellerVerificationStatus == 'verified') sellerCrm.customFields.c.supplier_active_status = true;

      // if (seller.supplierEntity.contactInfo.secondaryFirstName) sellerCrm.customFields.c.secondary_first_name = seller.supplierEntity.contactInfo.secondaryFirstName.trim();
      // if (seller.supplierEntity.contactInfo.secondaryLastName) sellerCrm.customFields.c.secondary_last_name = seller.supplierEntity.contactInfo.secondaryLastName.trim();
      // if (seller.supplierEntity.contactInfo.secondaryMobile) sellerCrm.customFields.c.secondary_mobile_no = seller.supplierEntity.contactInfo.secondaryMobile.trim();
      // if (seller.supplierEntity.contactInfo.secondaryEmail) sellerCrm.customFields.c.secondary_email = seller.supplierEntity.contactInfo.secondaryEmail.trim();

      if (seller.sellerEntity.profileInfo.basicInfo.companyInfo.companyName) sellerCrm.customFields.c.supplier_name = seller.sellerEntity.profileInfo.basicInfo.companyInfo.companyName.trim();
      if (officialAddress.state) sellerCrm.customFields.c.state = officialAddress.state.trim();
      if (officialAddress.pincode) sellerCrm.customFields.c.pincode = officialAddress.pincode.trim();
      
      if (seller.sellerEntity.profileInfo.basicInfo.email) sellerCrm.emails.address = seller.sellerEntity.profileInfo.basicInfo.email.trim();

      if (seller.sellerEntity.profileInfo.basicInfo.contactPerson) sellerCrm.name.first = seller.sellerEntity.profileInfo.basicInfo.contactPerson.trim();
      // if (seller.supplierEntity.contactInfo.primaryLastName) sellerCrm.name.last = seller.supplierEntity.contactInfo.primaryLastName.trim();

      if (seller.sellerEntity.profileInfo.basicInfo.mobile) sellerCrm.phones.number = seller.sellerEntity.profileInfo.basicInfo.mobile.trim();

      if (seller.sellerEntity.profileInfo.accountInfo.crmId) {
        sellerCrm.crmId = seller.sellerEntity.profileInfo.accountInfo.crmId;
      }
      
      return sellerCrm;

};


function findOfficialAddress(address){
  return address.type == 'Billing';
}

function findPickUpAddress(address){
  return address.type == 'Pick Up';
}


/**** Update from the CRM panel *****/
exports.updateFromCRM = function(sellerCrm, callback){

  var logger = log.logger_crm;
  var sellerID = sellerCrm.customFields.c.supplier_id;

  var db = dbConfig.mongoDbConn;

  db.collection('Supplier').findOne({"supplierEntity.identifier.sellerId": sellerID},{"_id": 0, "supplierEntity.companyInfo": 1, "supplierEntity.identifier": 1, "supplierEntity.contactInfo": 1},
  function(err, seller){
    if (err) {
      resJson = {
          "http_code": 500,
          "message": "Error - Error retriving seller. Please contact engineering team."
      };
        callback(true,resJson);
      logger.error(TAG + "Error retriving seller. ERROR : \n" + err.stack);
    } else {

      var officialAddress = seller.supplierEntity.companyInfo.address.find(findOfficialAddress);

      if (crmConstants.city[sellerCrm.customFields.c.city.lookupName.toLowerCase()]) {
        officialAddress.city = sellerCrm.customFields.c.city.lookupName;
      } else {
        officialAddress.city = sellerCrm.customFields.c.other_city;
      }

      // officialAddress.city = sellerCrm.customFields.c.city.lookupName;
      officialAddress.address1 = sellerCrm.customFields.c.address_line_1;
      officialAddress.address2 = sellerCrm.customFields.c.address_line_2;
      officialAddress.state = sellerCrm.customFields.c.state;
      officialAddress.pincode = sellerCrm.customFields.c.pincode;

      if (crmConstants.supplier_type[sellerCrm.customFields.c.supplier_type.lookupName.toLowerCase()]) {
        seller.supplierEntity.identifier.persona = sellerCrm.customFields.c.supplier_type.lookupName;
      } else {
        seller.supplierEntity.identifier.persona = sellerCrm.customFields.c.others_supplier_type;
      }

      // seller.supplierEntity.identifier.persona = sellerCrm.customFields.c.supplier_type.lookupName;

      var shippingAddress = seller.supplierEntity.companyInfo.address.find(findPickUpAddress);

      shippingAddress.address1 = sellerCrm.customFields.c.shipping_address_line_1;
      shippingAddress.address2 = sellerCrm.customFields.c.shipping_address_line_2;
      shippingAddress.state = sellerCrm.customFields.c.shipping_state;
      shippingAddress.city = sellerCrm.customFields.c.shipping_city;
      shippingAddress.pincode = sellerCrm.customFields.c.shipping_pincode;
      shippingAddress.country = sellerCrm.customFields.c.shipping_country;

      if (sellerCrm.customFields.c.supplier_active_status) {
        seller.supplierEntity.companyInfo.status == 'Active'
      } else {
        seller.supplierEntity.companyInfo.status == 'InActive'
      }

      seller.supplierEntity.contactInfo.secondaryFirstName = sellerCrm.customFields.c.secondary_first_name;

      seller.supplierEntity.contactInfo.secondaryFirstName = sellerCrm.customFields.c.secondary_last_name;

      seller.supplierEntity.contactInfo.secondaryMobile = sellerCrm.customFields.c.secondary_mobile_no;

      seller.supplierEntity.contactInfo.secondaryEmail = sellerCrm.customFields.c.secondary_email;

      seller.supplierEntity.companyInfo.companyName = sellerCrm.customFields.c.supplier_name;


      seller.supplierEntity.contactInfo.primaryFirstName = sellerCrm.name.first;
      seller.supplierEntity.contactInfo.primaryLastName = sellerCrm.name.last;
      seller.supplierEntity.contactInfo.primaryMobile = sellerCrm.phones.number;

      // seller.supplierEntity.contactInfo.primaryEmail = "";
      // seller.supplierEntity.contactInfo.primaryMobile = "";

      var crmId = sellerCrm.id;

      async.parallel([
        function(callback){
          //Get email
          var options_auth = { user: crmConstants.crmCredentials.username, password: crmConstants.crmCredentials.password };
          var crmclient = new restClient(options_auth);
          var crmReq = crmclient.get(urlConstants.getCrmContactURL(env) + crmId + '/emails/0', function (data, response) {
            if (response.statusCode == 200) {
              seller.supplierEntity.contactInfo.primaryEmail = data.address;
              callback(false);
            } else if (response.statusCode == 404) {
              callback(false);
              logger.info("No email id found for sellerID : " + sellerID);
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
              seller.supplierEntity.contactInfo.primaryMobile = data.number;
              callback(false);
            } else if (response.statusCode == 404) {
              callback(false);
              logger.info("No mobile number found for sellerID : " + sellerID);
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

          db.collection('Supplier').findAndModify({"supplierEntity.identifier.sellerId":sellerID}, null, {'$set':seller}, {new: true}, function(err, result){
            if (err) {
              resJson = {
                  "http_code": 500,
                  "message": "Error - Seller updation Failed. Please contact engineering team."
              };
                callback(true,resJson);
              logger.info(TAG + "Error - Seller updation Failed. Please contact engineering team. ERROR : \n" + err.stack);
            } else {
              if (result) {
                  resJson = {
                      "http_code": 200,
                      "message": "Seller updated successfully from CRM. SellerId : " + sellerID
                  };
                    callback(false,resJson);
                  logger.info(TAG + "Seller updated successfully from CRM. SellerId : " + sellerID );

              } else {
                resJson = {
                    "http_code": 404,
                    "message": "No document found during update for sellerId : " + sellerID
                };
                  callback(true,resJson);
                logger.info(TAG + "No document found during update for sellerId : " + sellerID);
              }
            }
          });
        }
      });
    }
  });

};