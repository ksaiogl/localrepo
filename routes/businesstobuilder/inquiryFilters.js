/**
 * Created by Balkishan on 11-08-2016.
 */
var TAG = "InquiryFilters.js - ";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');

exports.fetchInquiryFilters = function (req, callback) {

    var resJson;

    //Get the IP Address of the client.
    var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;

    //Variable for Mongo DB Connection.
    var db = dbConfig.mongoDbConn;

    //Variable for Logging the messages to the file.
    var logger = log.logger_rfq;

    logger.info(ip + " " + TAG + " Entering fetchInquiryFilters.");

    //Log the request.
    logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));

    colInquiryFilters = db.collection("InquiryFilters");

    logger.debug(ip + " " + TAG + " Query : "+JSON.stringify({"_id": "filters"}));

    colInquiryFilters.findOne({"_id": "filters"}, function (error, result) {
        if (!error && ( result !== null)) {
            logger.debug(ip + " " + TAG + "Inquiry Filters Successfully Fetched.");

            return callback(false, outputResult(result));
        }
        else if (!error && ( result === null)) {
            logger.error(TAG + " Filter data not found");
            return callback(true, outputResult);
        }
        else {
            logger.error(TAG + " Internal Server Error. error: " + error);
            return callback(true, internalServerError());
        }
    });

};


function outputResult(result) {
    result = {
        "http_code": "200",
        "message": result
    };
    return result;
}

function badFormat() {
    result = {
        "http_code": "400",
        "message": "Bad or ill-formed request.."
    };
    return result;
}

function inputDontMatch() {
    result = {
        "http_code": "500",
        "message": "The inputs does not match with our records..Please retry.."
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