var TAG = "Seller Mail Verification";

var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var sellerNotification = require('./sellerNotification.js');
var crypto = require('crypto');
var secretKey = "mSupplyEmailVerification";

// Validating the token from the mail
exports.verifyMail = function(req, callback){
  
  //Variable for Mongo DB Connection.
  var db = dbConfig.mongoDbConn;

  //Variable for Logging the messages to the file.
  var logger = log.logger_seller;

  logger.info(TAG + " Entering seller onboarding registration.");

  //Log the request.
  logger.info(TAG + " " + JSON.stringify(req));

  //Declare the response
  var resJson;

  //Validate the request.
  if ( !( req === null || 
      req.email === undefined || 
      req.token === undefined ||
      req.email === null || 
      req.token === null ||
      req.email.toString().trim().length === 0 ||
      req.token.toString().trim().length === 0)) {
  
    var email = req.email;
    var token = req.token;
    
    var col = db.collection('SellerLead');
    
    col.findOne({"sellerLeadEntity.emailId" : email, "sellerLeadEntity.sellerVerificationInfo.token" : token}, function(err, result){
      if(!err && result !== null){

      //Check if the mail id is already verified
        if(result.sellerLeadEntity.sellerVerificationInfo.emailVerified === true && result.sellerLeadEntity.sellerVerificationInfo.token === token){
             resJson = {
                "http_code" : "200",
                "message" : "Email already verified"
             };
            callback(false, resJson);
        }else{          
          col.update({"sellerLeadEntity.emailId" : email, "sellerLeadEntity.sellerVerificationInfo.token" : token}, 
                     {$set:{"sellerLeadEntity.sellerVerificationInfo.emailVerified" : true, 
                     "sellerLeadEntity.sellerVerificationInfo.emailVerifiedTimeStamp" : new Date()} }, function(uerr, uresult){
            if(!uerr){   
                /*** Checking CRM Status ***/                
                if(result.sellerLeadEntity.crmStatus === 'verified'){
                      /*** Updating Master collection ****/
                      updateSellerMaster(req, function(merr, mresult){
                          if(!merr){
                            callback(false, mresult);
                          }
                          else{
                            callback(true, mresult);
                          }
                      });
                  }
                  else{
                      resJson = {
                            "http_code" : "200",
                            "message" : "Email verification Successful."
                      };
                      logger.debug(TAG + " Email verification Successful.");
                      callback(false, resJson);
                  } 
               
            }else{
              resJson = {
                      "http_code" : "500",
                      "message" : "Email verification Failed."
                  };
               logger.error(TAG + " Email verification Failed : " + JSON.stringify(err));
               callback(true, resJson);
            }
          });
        }
      }else if(!err && result === null){        
        /**Update seller master if from OMS/ supplier**/
        updateSellerMaster(req, function(merr, mresult){
            if(!merr){
              callback(false, mresult);
            }
            else{
              callback(true, mresult);
            }
        });
      }else{
         resJson = {
            "http_code" : "500",
            "message" : "Unexpected Server error while fullfiling the request. Please retry."
         };
        logger.error(TAG + " Unexpected Server error while fullfiling the request. Please retry : " + JSON.stringify(err));
        callback(true, resJson);
      }
     });
  }else {
    resJson = {
        "http_code" : "400",
        "message" : "Bad or ill-formed request.."
    };
    logger.error(TAG + " " + JSON.stringify(resJson));
    return callback(false, resJson);
  }
};

/*** Update master from OMS/Supplier ***/
var updateSellerMaster = function(req, callback){
    var db = dbConfig.mongoDbConn;
    var logger = log.logger_seller;
    var sellerMasterCol = db.collection('SellerMaster');
     sellerMasterCol.findOne({"sellerEntity.profileInfo.basicInfo.email" : req.email, "sellerEntity.sellerVerificationInfo.token" : req.token},{"sellerEntity.sellerVerificationInfo.emailVerified" : 1},
      function(err, result){
          if(!err && result !== null){
             if(result.sellerEntity.sellerVerificationInfo.emailVerified === true){
                resJson = {
                  "http_code" : "200",
                  "message" : "Email already verified"
                };
                callback(false, resJson);
             }
             else{
                sellerMasterCol.update({"sellerEntity.profileInfo.basicInfo.email" : req.email, "sellerEntity.sellerVerificationInfo.token" : req.token},
                  {$set : {"sellerEntity.sellerVerificationInfo.emailVerified" : true, "sellerEntity.sellerVerificationInfo.emailVerifiedTimeStamp" : new Date()}},
                  function(uerr, uresult){
                      if(!uerr){
                        resJson = {
                            "http_code" : "200",
                            "message" : "Email verification Successful."
                          };
                          logger.debug(TAG + " Email verification Successful.");
                          callback(false, resJson);                        
                      }
                      else{
                       resJson = {
                          "http_code" : "500",
                          "message" : "Unexpected Server error while fullfiling the request. Please retry."
                        };
                        logger.error(TAG + " Unexpected Server error while fullfiling the request. Please retry : " + JSON.stringify(uerr));
                        callback(true, resJson);
                      }
                  });
             }
          }
          else if( !err && result === null){
               resJson = {
                "http_code" : "500",
                "message" : "Inputs doesn't match with our records."
              };
              logger.error(TAG + " Email verification Failed : " + JSON.stringify(err));
              callback(true, resJson);
          }
          else{
              resJson = {
                "http_code" : "500",
                "message" : "Unexpected Server error while fullfiling the request. Please retry."
              };
              logger.error(TAG + " Unexpected Server error while fullfiling the request. Please retry : " + JSON.stringify(err));
              callback(true, resJson);
          }
      });  
} 

exports.sendVerifyEmail = function(req, callback){
    //Variable for Mongo DB Connection.
    var db = dbConfig.mongoDbConn;

    //Variable for Logging the messages to the file.
    var logger = log.logger_seller;

    logger.info(TAG + " Entering seller Verify email part");

    if(req.body.supplierSession.sellerEntity.emailVerified === true){
        resJson = {
          "http_code" : "202",
          "message" : "Email Id already verified"
        };
        logger.error(TAG + " " + JSON.stringify(resJson));
        return callback(false, resJson);
    }
    else{
      var encryptedToken = crypto.randomBytes(64).toString('hex');
      req.body.emailId = req.body.supplierSession.sellerEntity.profileInfo.basicInfo.email;
      req.body.companyName = req.body.supplierSession.sellerEntity.profileInfo.basicInfo.companyInfo.companyName;
      req.body.mobile = req.body.supplierSession.sellerEntity.profileInfo.basicInfo.mobile;
      req.body.userId = req.body.supplierSession.sellerEntity.profileInfo.accountInfo.userId;
      req.body.vat = req.body.supplierSession.sellerEntity.profileInfo.financialInfo.taxInfo.VAT_TIN;
      delete req.body.supplierSession;
      // Sending mail to the seller...
      sellerNotification.sendNotificationSeller(req, encryptedToken, function(error, status){
          if(!error){
              /// Update the token to sellermaster ..
              var sellerMastercol = db.collection('SellerMaster');
              sellerMastercol.update({"sellerEntity.profileInfo.accountInfo.userId" : req.body.userId ,"sellerEntity.profileInfo.basicInfo.email" : req.body.emailId},
              {$set : {"sellerEntity.sellerVerificationInfo.token" : encryptedToken }}, function(err, result){
                  if(!err){
                      resJson = {  
                            "http_code" : "200",
                          "message" : "Email sent to registered email Successful"
                      } 
                      callback(false, resJson);
                  }
                  else{
                    resJson = {
                      "http_code" : "500",
                      "message" : "Unexpected Server error while fullfiling the request. Please retry."
                    };
                    logger.error(TAG + " Unexpected Server error while fullfiling the request. Please retry : " + JSON.stringify(err));
                    callback(true, resJson);
                  }
              }); 
          }
          else{
            resJson = {
              "http_code" : "500",
              "message" : "Unexpected Server error while fullfiling the request. Please retry."
            };
            logger.error(TAG + " Unexpected Server error while fullfiling the request. Please retry : " + JSON.stringify(error));
            callback(true, resJson);
          }
      });
    }
}
