var TAG = "--- Admin Panel ---    ";
var env = require('../../Environment/env.js').env;
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var viewOrderList = require('../customer/viewOrderList.js');
var viewOrder = require('../customer/viewOrder.js');
var insertOrder = require('../supplier/insertOrder.js');
var updateOrder = require('../supplier/updateOrder.js');
var genericNotifications = require('../notification/generic_SMS_Email_Notifications.js');
var omsConstants = require('./omsConstants');
var sellerCRM = require('../sellerOnboarding/sellerCRM.js');
var crypto = require("crypto");
var randomstring = require('just.randomstring');
var secret = 'MsupplyAdm1nPanelSecretKey';
var orderEvent = require('./orderEvents').orderEvents;
var orderFootprint = require('./orderFootprint');
var searchOrderList = require('../customer/searchOrder.js');

exports.getUserTypes = function(req, callback){

    var logger = log.logger_omsAdminPanel;
    var db = dbConfig.mongoDbConn;
    var acl = require('acl');
    var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
    logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

    acl.isAllowed(req.user.userId, "Users", "Modify", function(err, result){
      if (err) {
        resJson = {
            "http_code": 500,
            "message": "Error - Fetching user type failed. Please contact engineering team."
        };
        callback(true,resJson);
        logger.error(TAG + "Error in fetching user type. ERROR : \n" + err.stack);
      } else {
        if (result) {
          db.collection('omsUserTypes').find({},{"_id":0}).toArray(function(err, results){
            if (err) {
              resJson = {
                  "http_code": 500,
                  "message": "Error - Getting user type failed. Please contact engineering team."
              };
              callback(true,resJson);
              logger.error(TAG + "Error in getting user type. ERROR : \n" + err.stack);
            } else {
              if (results == null) {
                resJson = {
                    "http_code": 404,
                    "message": "No user types found"
                };
                callback(true,resJson);
                logger.info(TAG + "No user types found");
              } else {
                resJson = {
                    "http_code": 200,
                    "message": results
                };
                callback(false,resJson);
                audit (req, resJson.http_code, "Appropriate user types sent", false);
              }
            }
          });
        } else {
          resJson = {
              "http_code": 403,
              "message": "User does not have permission to perform this action on this resource."
          };
          callback(true,resJson);
          logger.info(TAG + "user unauthorized. UserId : " + req.user.email + " PATH : " + req.url);
          // audit (req, resJson.http_code, resJson.message, false);
        }
      }
    });

}


exports.authenticateUser = function(req, callback){
  // Variable for Logging the messages to the file.
  var logger = log.logger_omsAdminPanel;
  logger.info(TAG + 'user ' + req.body.username + ' is calling ' + req.url);

  var password = crypto.createHash('md5').update(req.body.password + secret).digest('hex');

  var db = dbConfig.mongoDbConn;
  db.collection('AdminUsers').findOne({"userAuth.username":req.body.username, "userAuth.password":password},{"_id":0, "userDetails":1},function(err, results){
    if (err) {
      resJson = {
          "http_code": 500,
          "message": "Error - User Authentication Failed. Please contact engineering team."
      };
      callback(true,resJson);
      logger.error(TAG + "Error in user authentication. ERROR : \n" + err.stack);
    } else {
      if (results == null) {
        resJson = {
            "http_code": 401,
            "message": "Wrong username or password."
        };
        callback(true,resJson);
        logger.info(TAG + "No document found for userId : " + req.body.username);
        audit (req, resJson.http_code, resJson.message, false);
    } else {
      var user = {
        userId: results.userDetails.userId,
        first_name: results.userDetails.firstName,
        last_name: results.userDetails.lastName,
        email: results.userDetails.email,
        mobile: results.userDetails.mobile,
        user_type: results.userDetails.userType,
        firstLogin: results.userDetails.firstLogin,
        authorisedFunctionality: []
      };

      db.collection('omsUserTabMapping').find({"userType":{$in : results.userDetails.userType}},{"_id":0})
      .toArray(function (err, results){
        if (err) {
          resJson = {
              "http_code": 500,
              "message": "Error - User Authentication Failed. Please contact engineering team."
          };
          callback(true,resJson);
          logger.error(TAG + "Error in user authentication. ERROR : \n" + err.stack);
        } else {
          results.forEach(function(element){
            user.authorisedFunctionality = user.authorisedFunctionality.concat(element.authorisedFunctionality);
          });
          var userObj = {};
          user.authorisedFunctionality.forEach(function(element){
            for (var prop in element) {
              if (element.hasOwnProperty(prop)) {
                userObj[prop] = element[prop];
              }
            }
          });
          user.authorisedFunctionality = userObj;

          resJson = {
              "http_code": 200,
              "message": user
          };
          callback(false,resJson);
          logger.info(TAG + "Authentication Successfull userId : " + req.body.username);
        }

      });
      // audit (req, resJson.http_code, resJson.message, false);
    }
  }
  });
}


exports.register = function(req, callback){
  // Variable for Logging the messages to the file.
  var logger = log.logger_omsAdminPanel;

  var db = dbConfig.mongoDbConn;
  var acl = require('acl');
  var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
  logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

  if (!(req.body.userType instanceof Array)) {
    resJson = {
        "http_code": 400,
        "message": "Bad or ill-formed request. User type must be an array."
    };
    callback(true,resJson);
    logger.error(TAG + "Bad or ill-formed request. User type must be an array.");
  } else {
    acl.isAllowed(req.user.userId, "Users", "Create", function(err, result){
      if (err) {
        resJson = {
            "http_code": 500,
            "message": "Error - User Registration Failed. Please contact engineering team."
        };
        callback(true,resJson);
        logger.error(TAG + "Error in user registration. ERROR : \n" + err.stack);
      } else {
        var rs = randomstring(8);
        if (result) {
          var insertQuery = {
            "userAuth" : {
                "username" : req.body.email,
                "password" : crypto.createHash('md5').update(rs + secret).digest('hex')
            },
            "userDetails" : {
                "firstName" : req.body.firstName,
                "lastName" : req.body.lastName,
                "email" : req.body.email,
                "mobile" : req.body.mobile,
                "firstLogin" : true,
                "userType" : req.body.userType
            }
        };

        db.collection('counters').findAndModify({ _id: 'adminUserId' },null, { $inc: { seq: 1 } }, {new: true}, function(err, result){
          if (err) {
            resJson = {
                "http_code": 500,
                "message": "Error - User Registration Failed. Please contact engineering team."
            };
            callback(true,resJson);
            logger.error(TAG + "Error in user registration. ERROR : \n" + err.stack);
          } else {
            insertQuery.userDetails.userId = result.value.seq;

            db.collection('AdminUsers').insert(insertQuery,function(err,result){
              if (err) {
                if (err.code === 11000) {
                  resJson = {
                      "http_code": 400,
                      "message": "User Already Registered. User : " + req.body.email
                  };
                  callback(true,resJson);
                  logger.info(TAG + "User Already Registered. User : " + req.body.email);
                  audit (req, resJson.http_code, resJson.message, false);
                } else {
                  resJson = {
                      "http_code": 500,
                      "message": "Error - User Registration Failed. Please contact engineering team."
                  };
                  callback(true,resJson);
                  logger.error(TAG + "Error in user registration. ERROR : \n" + err.stack);
                  audit (req, resJson.http_code, resJson.message, false);

                  //sending mail
                  var ccEmails = "";
                  var bccEmails = "";
                  genericNotifications.sendPlainEmail(omsConstants.fromEmail, "<"+req.body.email+">", ccEmails, bccEmails, omsConstants.emailsubjectNewRegistration(env), omsConstants.bodyNewRegistration(env).replace('$NAME', req.body.firstName).replace('$USER', req.body.email).replace('$PASSWORD', rs), function(error, result){
                    if(error)
                    {
                      logger.error(TAG + "Error- Failed to send emails for new user registration to "+ req.body.email );
                      logger.error(TAG + "Error sending emails for new user registration to "+ req.body.email + ", Error: " + error);
                    }
                    else
                    {
                      logger.info(TAG + "New user registration email sent successfully to "+ req.body.email);
                    }
                  });
                }
              } else {
                //Adding user to authorized role
                var acl = require('acl');
                var acl = new acl(new acl.mongodbBackend(db, "acl_", true));

                acl.addUserRoles(insertQuery.userDetails.userId, req.body.userType, function(err){
                  if (err) {
                    resJson = {
                        "http_code": 500,
                        "message": "Error - User Role Mapping Failed. Please contact engineering team."
                    };
                    callback(true,resJson);
                    logger.error(TAG + "Error in user role mapping. ERROR : \n" + err.stack);
                  } else {
                    resJson = {
                        "http_code": 200,
                        "message": "User Registered Successfully."
                    };
                    callback(false,resJson);
                    logger.info(TAG + "user registered successfully. UserId : " + req.body.email);
                    audit (req, resJson.http_code, resJson.message, false);

                    //sending mail
                    var ccEmails = "";
                    var bccEmails = "";
                    genericNotifications.sendPlainEmail(omsConstants.fromEmail, "<"+req.body.email+">", ccEmails, bccEmails, omsConstants.emailsubjectNewRegistration(env), omsConstants.bodyNewRegistration(env).replace('$NAME', req.body.firstName).replace('$USER', req.body.email).replace('$PASSWORD', rs), function(error, result){
                      if(error)
                      {
                        logger.error(TAG + "Error- Failed to send emails for new user registration to "+ req.body.email );
                        logger.error(TAG + "Error sending emails for new user registration to "+ req.body.email + ", Error: " + error);
                      }
                      else
                      {
                        logger.info(TAG + "New user registration email sent successfully to "+ req.body.email);
                      }
                    });

                  }
                });
              }
            });

          }
        });
        } else {
          resJson = {
              "http_code": 403,
              "message": "User does not have permission to perform this action on this resource."
          };
          callback(true,resJson);
          logger.info(TAG + "User unauthorized. UserId : " + req.user.email + " PATH : " + req.url);
          audit (req, resJson.http_code, resJson.message, false);
        }
      }
    });
  }
}


exports.updateUserRole = function(req, callback){
  // Variable for Logging the messages to the file.
  var logger = log.logger_omsAdminPanel;

  var db = dbConfig.mongoDbConn;
  var acl = require('acl');
  var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
  logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

  if (!(req.body.userType instanceof Array)) {
    resJson = {
        "http_code": 400,
        "message": "Bad or ill-formed request. User type must be an array."
    };
    callback(true,resJson);
    return logger.error(TAG + "Bad or ill-formed request. User type must be an array.");
  }

  acl.isAllowed(req.user.userId, "Users", "Modify", function(err, result){
    if (err) {
      resJson = {
          "http_code": 500,
          "message": "Error - User role change failed. Please contact engineering team."
      };
      callback(true,resJson);
      logger.error(TAG + "Error in user role change. ERROR : \n" + err.stack);
    } else {
      if (result) {
        // var insertQuery = {
        //   "email" : req.body.email,
        //   "userType" : req.body.userType
        //   }
      // };

      db.collection('AdminUsers').findAndModify({ "userDetails.email": req.body.email },null, { $set: { "userDetails.userType": req.body.userType } }, {new: false}, function(err, result){
        if (err) {
          resJson = {
              "http_code": 500,
              "message": "Error - User role change Failed. Please contact engineering team."
          };
          callback(true,resJson);
          logger.error(TAG + "Error in user role change. ERROR : \n" + err.stack);
        } else {
          // console.log(result.value);
          if (result.value) {
            acl.removeUserRoles( result.value.userDetails.userId, result.value.userDetails.userType, function(err){
                if (err) {
                  resJson = {
                      "http_code": 500,
                      "message": "Error - User Role Change Failed. Please contact engineering team."
                  };
                  callback(true,resJson);
                  logger.error(TAG + "Error in user role change. ERROR : \n" + err.stack);
                } else {
                  acl.addUserRoles(result.value.userDetails.userId, req.body.userType, function(err){
                    if (err) {
                      resJson = {
                          "http_code": 500,
                          "message": "Error - User Role Mapping Failed. Please contact engineering team."
                      };
                      callback(true,resJson);
                      logger.error(TAG + "Error in user role mapping. ERROR : \n" + err.stack);
                    } else {
                      resJson = {
                          "http_code": 200,
                          "message": "User Role Changed Successfully."
                      };
                      callback(false,resJson);
                      logger.info(TAG + "User Role Changed Successfully. UserId : " + req.body.email);
                      audit (req, resJson.http_code, resJson.message, false);
                    }
                  });
                }
            } );

          } else {
            resJson = {
                "http_code": 404,
                "message": "User not found for UserId : " + req.body.email
            };
            callback(true,resJson);
            logger.info(TAG + "User not found for UserId : " + req.body.email);
            audit (req, resJson.http_code, resJson.message, false);

          }

        }
      });
      } else {
        resJson = {
            "http_code": 403,
            "message": "User does not have permission to perform this action on this resource."
        };
        callback(true,resJson);
        logger.info(TAG + "User unauthorized. UserId : " + req.user.email + " PATH : " + req.url);
        audit (req, resJson.http_code, resJson.message, false);
      }
    }
  });
}


exports.changePassword = function(req, callback){

  var logger = log.logger_omsAdminPanel;
  var db = dbConfig.mongoDbConn;
  var acl = require('acl');
  var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
  logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

  var currentPassword = crypto.createHash('md5').update(req.body.currentPassword + secret).digest('hex');
  var newPassword = crypto.createHash('md5').update(req.body.newPassword + secret).digest('hex');

  acl.isAllowed(req.user.userId, "Users", "Modify-self", function(err, result){
    if (err) {
      resJson = {
          "http_code": 500,
          "message": "Error - User password change failed. Please contact engineering team."
      };
      callback(true,resJson);
      logger.error(TAG + "Error in user password change. ERROR : \n" + err.stack);
    } else {
      if (result) {
        db.collection('AdminUsers').findAndModify({"userAuth.username":req.user.email, "userAuth.password":currentPassword},null, {"$set":{"userAuth.password":newPassword, "userDetails.firstLogin":false }} , null, function(err, result){
          if (err) {
            resJson = {
                "http_code": 500,
                "message": "Error - change passowrd Failed. Please contact engineering team."
            };
            callback(true,resJson);
            logger.error(TAG + "Error in user role mapping. ERROR : \n" + err.stack);
          } else {
            if (!result.lastErrorObject) {
              resJson = {
                  "http_code": 403,
                  "message": "Invalid Password for user : " + req.user.email
              };
              callback(true,resJson);
              logger.info(TAG + "Invalid Password during change passowrd");
              audit (req, resJson.http_code, resJson.message, false);
            } else {
              resJson = {
                  "http_code": 200,
                  "message": "User password updated successfully for user : " + req.user.email
              };
              callback(false,resJson);
              audit (req, resJson.http_code, resJson.message, false);
            }
          }
        });
      } else {
        resJson = {
            "http_code": 403,
            "message": "User does not have permission to perform this action on this resource."
        };
        callback(true,resJson);
        logger.info(TAG + "user unauthorized. UserId : " + req.user.email + " PATH : " + req.url);
        audit (req, resJson.http_code, resJson.message, false);
      }
    }
  });
}


exports.resetPassword = function(req, callback){

  var logger = log.logger_omsAdminPanel;
  var db = dbConfig.mongoDbConn;
  var acl = require('acl');
  var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
  logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

  var rs = randomstring(8);
  // console.log(rs);

  // var currentPassword = crypto.createHash('md5').update(req.body.currentPassword + secret).digest('hex');
  var newPassword = crypto.createHash('md5').update(rs + secret).digest('hex');
  // console.log(newPassword);

  acl.isAllowed(req.user.userId, "Users", "Modify", function(err, result){
    if (err) {
      resJson = {
          "http_code": 500,
          "message": "Error - User password reset failed. Please contact engineering team."
      };
      callback(true,resJson);
      logger.error(TAG + "Error in user reset. ERROR : \n" + err.stack);
    } else {
      if (result) {
        db.collection('AdminUsers').findAndModify({"userAuth.username": req.body.email},null, {"$set":{"userAuth.password":newPassword, "userDetails.firstLogin": true }} , null, function(err, result){
          if (err) {
            resJson = {
                "http_code": 500,
                "message": "Error - reset passowrd Failed. Please contact engineering team."
            };
            callback(true,resJson);
            logger.error(TAG + "Error in user passowrd reset. ERROR : \n" + err.stack);
          } else {
            if (!result.value) {
              resJson = {
                  "http_code": 404,
                  "message": "User not found: " + req.body.email
              };
              callback(true,resJson);
              logger.info(TAG + "User not found during reset passowrd");
              audit (req, resJson.http_code, resJson.message, false);
            } else {
              resJson = {
                  "http_code": 200,
                  "message": "User password reset successfully for user : " + req.body.email
              };
              callback(false,resJson);
              audit (req, resJson.http_code, resJson.message, false);
              logger.info(TAG + "Password reset successfully for user " + req.body.email);
              var ccEmails = "";
              var bccEmails = "";
              genericNotifications.sendPlainEmail(omsConstants.fromEmail, "<"+req.body.email+">", ccEmails, bccEmails, omsConstants.emailsubjectPasswordReset(env), omsConstants.bodyTextPasswordReset(env).replace('$NAME', result.value.userDetails.firstName).replace('$PASSWORD', rs), function(error, result){
                if(error)
                {
                  logger.error(TAG + "Error- Failed to send emails for password reset to "+ req.body.email );
                  logger.error(TAG + "Error sending emails for password reset to "+ req.body.email + ", Error: " + error);
                }
                else
                {
                  logger.info(TAG + "Password reset email sent successfully to "+ req.body.email);
                }
              });

            }
          }
        });
      } else {
        resJson = {
            "http_code": 403,
            "message": "User does not have permission to perform this action on this resource."
        };
        callback(true,resJson);
        logger.info(TAG + "user unauthorized. UserId : " + req.user.email + " PATH : " + req.url);
        audit (req, resJson.http_code, resJson.message, false);
      }
    }
  });
}


exports.getUser = function(req, callback){
  var logger = log.logger_omsAdminPanel;
  var db = dbConfig.mongoDbConn;
  var acl = require('acl');
  var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
  logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

  acl.isAllowed(req.user.userId, "Users", "View", function(err, result){
    if (err) {
      resJson = {
          "http_code": 500,
          "message": "Error - Retriving Users failed. Please contact engineering team."
      };
      callback(true,resJson);
      logger.error(TAG + "Error in user retrival. ERROR : \n" + err.stack);
    } else {
      if (result) {
        db.collection('AdminUsers').find({},{"_id":0, "userDetails":1}).toArray(function(err, results){
          if (err) {
            resJson = {
                "http_code": 500,
                "message": "Error - Getting user failed. Please contact engineering team."
            };
            callback(true,resJson);
            logger.error(TAG + "Error in getting users. ERROR : \n" + err.stack);
          } else {
            if (results == null) {
              resJson = {
                  "http_code": 404,
                  "message": "No document found."
              };
              callback(true,resJson);
              logger.info(TAG + "No document found.");
            } else {
              resJson = {
                  "http_code": 200,
                  "message": results
              };
              callback(false,resJson);
              audit (req, resJson.http_code, "Appropriate user details sent", false);
            }
          }
        });
      } else {
        resJson = {
            "http_code": 403,
            "message": "User does not have permission to perform this action on this resource."
        };
        callback(true,resJson);
        logger.info(TAG + "user unauthorized. UserId : " + req.user.email + " PATH : " + req.url);
        audit (req, resJson.http_code, resJson.message, false);
      }
    }
  });
}


exports.viewOrderList = function(req, callback){
  var logger = log.logger_omsAdminPanel;
  var db = dbConfig.mongoDbConn;
  var acl = require('acl');
  var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
  logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

  acl.isAllowed(req.user.userId, "Order", "View", function(err, result){
    if (err) {
      resJson = {
          "http_code": 500,
          "message": "Error - User Authorization Failed. Please contact engineering team."
      };
      callback(true,resJson);
      logger.error(TAG + "Error in user Authorization. ERROR : \n" + err.stack);
    } else {
      if (result) {
        viewOrderList.viewOrderList(req, callback);
      } else {
        resJson = {
            "http_code": 403,
            "message": "User does not have permission to perform this action on this resource."
        };
        callback(true,resJson);
        logger.info(TAG + "user unauthorized. UserId : " + req.user.email + " PATH : " + req.url);
        audit (req, resJson.http_code, resJson.message, false);
      }
    }
  });
}


exports.viewOrder = function(req, callback){
  var logger = log.logger_omsAdminPanel;
  var db = dbConfig.mongoDbConn;
  var acl = require('acl');
  var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
  logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

  acl.isAllowed(req.user.userId, "Order", "View", function(err, result){
    if (err) {
      resJson = {
          "http_code": 500,
          "message": "Error - User Authorization Failed. Please contact engineering team."
      };
      callback(true,resJson);
      logger.error(TAG + "Error in user Authorization. ERROR : \n" + err.stack);
    } else {
      if (result) {
        viewOrder.viewOrder(req, callback);
      } else {
        resJson = {
            "http_code": 403,
            "message": "User does not have permission to perform this action on this resource."
        };
        callback(true,resJson);
        logger.info(TAG + "user unauthorized. UserId : " + req.user.email + " PATH : " + req.url);
        audit (req, resJson.http_code, resJson.message, false);
      }
    }
  });
}


exports.insertOrderPayment = function(req, callback){
  var logger = log.logger_omsAdminPanel;
  var db = dbConfig.mongoDbConn;
  var acl = require('acl');
  var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
  logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

  acl.isAllowed(req.user.userId, "Order", "Modify", function(err, result){
    if (err) {
      resJson = {
          "http_code": 500,
          "message": "Error - User Authorization Failed. Please contact engineering team."
      };
      callback(true,resJson);
      logger.error(TAG + "Error in user Authorization. ERROR : \n" + err.stack);
    } else {
      if (result) {
        insertOrder.insertOrderPayment(req, callback);
      } else {
        resJson = {
            "http_code": 403,
            "message": "User does not have permission to perform this action on this resource."
        };
        callback(true,resJson);
        logger.info(TAG + "user unauthorized. UserId : " + req.user.email + " PATH : " + req.url);
        audit (req, resJson.http_code, resJson.message, false);
      }
    }
  });
}


exports.insertOrder = function(req, callback){
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
        insertOrder.insertOrder(req, callback);
      } else {
        resJson = {
            "http_code": 403,
            "message": "User does not have permission to perform this action on this resource."
        };
        callback(true,resJson);
        logger.info(TAG + "user unauthorized. UserId : " + req.user.email + " PATH : " + req.url);
        audit (req, resJson.http_code, resJson.message, false);
      }
    }
  });
}


exports.createSeller = function(req, callback){
  var logger = log.logger_omsAdminPanel;
  var db = dbConfig.mongoDbConn;
  var acl = require('acl');
  var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
  logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

  acl.isAllowed(req.user.userId, "Supplier", "Create", function(err, result){
    if (err) {
      resJson = {
          "http_code": 500,
          "message": "Error - User Authorization Failed. Please contact engineering team."
      };
      callback(true,resJson);
      logger.error(TAG + "Error in user Authorization. ERROR : \n" + err.stack);
    } else {
      if (result) {
        sellerCRM.addSellerOMS(req, function(err, regres){
          callback(err, regres);
        });
      } else {
        resJson = {
            "http_code": 403,
            "message": "User does not have permission to perform this action on this resource."
        };
        callback(true,resJson);
        logger.info(TAG + "user unauthorized. UserId : " + req.user.email + " PATH : " + req.url);
        audit (req, resJson.http_code, resJson.message, false);
      }
    }
  });
}

exports.fetchCompanyName = function(req, callback){
  var logger = log.logger_omsAdminPanel;
  var db = dbConfig.mongoDbConn;
  var acl = require('acl');
  var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
  logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

  acl.isAllowed(req.user.userId, "Supplier", "View", function(err, result){
    if (err) {
      resJson = {
          "http_code": 500,
          "message": "Error - User Authorization Failed. Please contact engineering team."
      };
      callback(true,resJson);
      logger.error(TAG + "Error in user Authorization. ERROR : \n" + err.stack);
    } else {
      if (result) {
        sellerCRM.fetchCompanyName(req, function(err, regres){
          callback(err,regres);
        });
      } else {
        resJson = {
            "http_code": 403,
            "message": "User does not have permission to perform this action on this resource."
        };
        callback(true,resJson);
        logger.info(TAG + "user unauthorized. UserId : " + req.user.email + " PATH : " + req.url);
        audit (req, resJson.http_code, resJson.message, false);
      }
    }
  });
}


exports.updateOrders = function(req, callback){
  var logger = log.logger_omsAdminPanel;
  var db = dbConfig.mongoDbConn;
  var acl = require('acl');
  var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
  logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

  acl.isAllowed(req.user.userId, "Order", "Modify", function(err, result){
    if (err) {
      resJson = {
          "http_code": 500,
          "message": "Error - User Authorization Failed. Please contact engineering team."
      };
      callback(true,resJson);
      logger.error(TAG + "Error in user Authorization. ERROR : \n" + err.stack);
    } else {
      if (result) {
        updateOrder.updateOrders(req, callback);
      } else {
        resJson = {
            "http_code": 403,
            "message": "User does not have permission to perform this action on this resource."
        };
        callback(true,resJson);
        logger.info(TAG + "user unauthorized. UserId : " + req.user.email + " PATH : " + req.url);
        audit (req, resJson.http_code, resJson.message, false);
      }
    }
  });
}


exports.getOrderEvents = function(req, callback) {
    var logger = log.logger_omsAdminPanel;
    var db = dbConfig.mongoDbConn;
    var acl = require('acl');
    var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
    logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

    acl.isAllowed(req.user.userId, "Order", "View", function(err, result){
      if (err) {
        resJson = {
            "http_code": 500,
            "message": "Error - User Authorization Failed. Please contact engineering team."
        };
        callback(true,resJson);
        logger.error(TAG + "Error in user Authorization. ERROR : \n" + err.stack);
      } else {
        if (result) {
          if (req.params.orderId) {
              orderFootprint.getOrderEvent(req.params.orderId.trim(), function(err, orderEvent){
                if (err) {
                  resJson = {
                      "http_code": 404,
                      "message": "No event found for this order."
                  };
                  callback(err,resJson);
                } else {
                  resJson = {
                      "http_code": 200,
                      "message": orderEvent
                  };
                  callback(false,resJson);
                }
              });
          } else {
            resJson = {
                "http_code": 400,
                "message": "Bad or ill-formed request."
            };
            callback(true,resJson);
          }
        } else {
          resJson = {
              "http_code": 403,
              "message": "User does not have permission to perform this action on this resource."
          };
          callback(true,resJson);
          logger.info(TAG + "user unauthorized. UserId : " + req.user.email + " PATH : " + req.url);
          audit (req, resJson.http_code, resJson.message, false);
        }
      }
    });
}



exports.addOrderComment = function(req, callback) {
    var logger = log.logger_omsAdminPanel;
    var db = dbConfig.mongoDbConn;
    var acl = require('acl');
    var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
    logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

    acl.isAllowed(req.user.userId, "Order", "Modify", function(err, result){
      if (err) {
        resJson = {
            "http_code": 500,
            "message": "Error - User Authorization Failed. Please contact engineering team."
        };
        callback(true,resJson);
        logger.error(TAG + "Error in user Authorization. ERROR : \n" + err.stack);
      } else {
        if (result) {
          if (req.body.orderId && req.body.comment) {
              orderFootprint.addOrderEvent(orderEvent.COMMENT, req.body.orderId.trim(), req, function(err){
                if (err) {
                  resJson = {
                      "http_code": 500,
                      "message": "Error inserting comment. Plese contact engineering team."
                  };
                  callback(err,resJson);
                } else {
                  resJson = {
                      "http_code": 200,
                      "message": "Comment inserted successfully."
                  };
                  callback(false,resJson);
                }
              });
          } else {
            resJson = {
                "http_code": 400,
                "message": "Bad or ill-formed request."
            };
            callback(true,resJson);
          }
        } else {
          resJson = {
              "http_code": 403,
              "message": "User does not have permission to perform this action on this resource."
          };
          callback(true,resJson);
          logger.info(TAG + "user unauthorized. UserId : " + req.user.email + " PATH : " + req.url);
          audit (req, resJson.http_code, resJson.message, false);
        }
      }
    });
}


exports.searchOrderList = function(req, callback){
  var logger = log.logger_omsAdminPanel;
  var db = dbConfig.mongoDbConn;
  var acl = require('acl');
  var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
  logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

  acl.isAllowed(req.user.userId, "Order", "View", function(err, result){
    if (err) {
      resJson = {
          "http_code": 500,
          "message": "Error - User Authorization Failed. Please contact engineering team."
      };
      callback(true,resJson);
      logger.error(TAG + "Error in user Authorization. ERROR : \n" + err.stack);
    } else {
      if (result) {
        searchOrderList.searchOrderList(req, callback);
      } else {
        resJson = {
            "http_code": 403,
            "message": "User does not have permission to perform this action on this resource."
        };
        callback(true,resJson);
        logger.info(TAG + "user unauthorized. UserId : " + req.user.email + " PATH : " + req.url);
        audit (req, resJson.http_code, resJson.message, false);
      }
    }
  });
}

function audit (req, statusCode, message, err){
  var logger = log.logger_omsAdminPanel;
  var db = dbConfig.mongoDbConn;

  //Delete password if present in body
  delete req.body.password;
  delete req.body.currentPassword;
  delete req.body.newPassword;

  var insertObj = {
    // "userId" : req.user.userId,
    "userName" : "",
    "path" : req.url,
    "body" : req.body,
    "ip" : req.header('x-forwarded-for') ? req.header('x-forwarded-for') : req.connection.remoteAddress,
    "statusCode" : statusCode,
    "message" : message,
    "timestamp" : new Date()
  }

  if (req.user && req.user.email) {
    insertObj.userName = req.user.email;
  }

  db.collection('AdminAudit').insert(insertObj,function(err,result){
    if (err) {
      logger.info(TAG + "audit insertion failed. query : " + insertObj);
    }
  });
}

exports.audit = audit;
