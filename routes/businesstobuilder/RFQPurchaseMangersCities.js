/**
 * Created by Balkishan on 07-09-2016.
 */

var TAG = "RFQPurchaseMangersCities.js - ";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');

exports.getRFQPurchaseMangersCities = function (req,callback) {
    //Get the IP Address of the client.
    var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;

    //Variable for Mongo DB Connection.
    var db = dbConfig.mongoDbConn;

    //Variable for Logging the messages to the file.
    var logger = log.logger_rfq;

    logger.info(ip + " " + TAG + " Entering getRFQPurchaseMangersCities.");

    var colRFQCityPurchaseManagers = db.collection("RfqCityPurchaseManagersEmails");

    colRFQCityPurchaseManagers.find({},{"contanctInfo.city":1}).toArray(function (error,result) {
        if (!error && ( result.length > 0)) {
            var cities = [];
            result.forEach(function (doc) {
                cities.push(doc.contanctInfo.city);
            });

            logger.debug(ip + " " + TAG + "Cities fetched from RfqCityPurchaseManagersEmails");
            return callback(false, outputResult(cities));
        }
        else if (!error && ( result.length <= 0)) {
            logger.error(TAG + " No cities found in RfqCityPurchaseManagersEmails.");
            return callback(true, outputResult("No cities found in RfqCityPurchaseManagersEmails."));
        }
        else {
            logger.error(TAG + " Internal Server Error. error: " + error);
            return callback(true, internalServerError());
        }
    })
};

function outputResult(result) {
    result = {
        "http_code": "200",
        "message": result
    };
    return result;
}

function internalServerError() {
    result = {
        "http_code": "500",
        "message": "Internal Server Error..Please retry.."
    };
    return result;
}