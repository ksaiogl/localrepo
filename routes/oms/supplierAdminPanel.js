var TAG = "--- Admin Panel ---    ";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var supplierReviews = require('../supplier/supplierReviewsRatings.js');
var omsPanel = require('./omsPanel.js');




exports.approveReviewsForSellers = function(req, callback){
  var logger = log.logger_omsAdminPanel;
  var db = dbConfig.mongoDbConn;
  var acl = require('acl');
  var acl = new acl(new acl.mongodbBackend(db, "acl_", true));
  logger.info(TAG + 'user ' + req.user.email + ' is calling ' + req.url);

  acl.isAllowed(req.user.userId, "SupplierReviewPanel", "Modify", function(err, result){
    if (err) {
      resJson = {
          "http_code": 500,
          "message": "Error - User Authorization Failed. Please contact engineering team."
      };
      callback(true,resJson);
      logger.error(TAG + "Error in user Authorization. ERROR : \n" + err.stack);
    } else {
      if (result) {
        supplierReviews.approveReviewsForSellers(req, callback);
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
