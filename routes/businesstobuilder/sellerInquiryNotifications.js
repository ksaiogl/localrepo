/**
 * Created by Balkishan on 09-08-2016.
 */
var TAG = "sellerInquiryNotifications.js - ";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var async = require('async');
var timezoneConversions = require('../helpers/timezoneConversions.js');

//Function to Create sellerNotifications
exports.sellerNotifications = function (req, callback) {

    var resJson;

    //Get the IP Address of the client.
    var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;

    //Variable for Mongo DB Connection.
    var db = dbConfig.mongoDbConn;

    //Variable for Logging the messages to the file.
    var logger = log.logger_rfq;

    logger.info(ip + " " + TAG + " Entering sellerNotifications.");

    //Log the request.
    logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));

    colSellersNotification = db.collection("SellersInquiryNotification");

    if (!(req.body === null ||
        req.body.sellerId === null ||
        req.body.sellerNotification === null ||
        req.body.sellerId === undefined ||
        req.body.sellerNotification === undefined ||
        req.body.sellerId.toString().trim().length === 0 ||
        req.body.sellerNotification.toString().trim().length === 0
        )) {

        var sellerId = req.body.sellerId;
        var sellerNotification = req.body.sellerNotification;

        colSellersNotification.findOne({"sellerId": sellerId}, function (error, result) {
            if (!error && (result !== null)) {
                //SellerId Exists update the data
                colSellersNotification.update(
                    {"sellerId": sellerId},
                    {
                        $push: {
                            "Notifications": {
                                $each: [
                                    {
                                        "title": sellerNotification,
                                        "date": new Date(),
                                        "read": false
                                    }
                                ],
                                $slice: -20
                            }
                        }
                    }
                    , function (upd_error, upd_result) {
                        if (!upd_error && (upd_result !== null)) {
                            logger.debug(ip + " " + TAG + "Seller notification Successfully Updated.");
                            return callback(false, outputResult("Seller notification Successfully Updated."));
                        }
                        else if (!upd_error && (upd_result === null)) {
                            logger.error(TAG + " Invalid Inputs, Inputs doesnt match with the database records, inquiryId': " + req.body.sellerId);
                            return callback(true, inputDontMatch());
                        }
                        else {
                            logger.error(TAG + " Internal Server Error. error: " + error);
                            return callback(true, internalServerError());
                        }
                    });
            }
            else if (!error && (result === null)) {
                //SellerId does not exists so create new
                var doc = {
                    "sellerId": sellerId,
                    "Notifications": [
                        {
                            "title": sellerNotification,
                            "date": new Date(),
                            "read": false
                        }
                    ]
                    
                };

                colSellersNotification.insert(doc, function (ins_error, ins_result) {
                    if (!ins_error) {
                        logger.debug(ip + " " + TAG + "Seller notification Successfully created.");
                        return callback(false, outputResult("Seller notification Successfully created."));
                    }
                    else {
                        logger.error(TAG + " Internal Server Error. error: " + ins_error);
                        return callback(true, internalServerError());
                    }
                });
            }
            else {
                logger.error(TAG + " Internal Server Error. error: " + error);
                return callback(true, internalServerError());
            }
        });
    } 
    else 
    {
        logger.error(ip + " " + TAG + " " + JSON.stringify(req.body));
        return callback(true, badFormat());
    }
};

exports.fetchSellerNotify = function (req, callback) {

    var resJson;

    //Get the IP Address of the client.
    var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;

    //Variable for Mongo DB Connection.
    var db = dbConfig.mongoDbConn;

    //Variable for Logging the messages to the file.
    var logger = log.logger_rfq;

    logger.info(ip + " " + TAG + " Entering fetchSellerNotify.");

    //Log the request.
    logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));

    colSellersNotification = db.collection("SellersInquiryNotification");

    if (!(req.body === null ||
        req.body.sellerId === null ||
        req.body.sellerId === undefined ||
        req.body.sellerId.toString().trim().length === 0)) {

        var sellerId = req.body.sellerId;

        colSellersNotification.findOne({"sellerId": sellerId},{"_id": 0, "sellerId": 1, "Notifications": 1}, function (error, result) {
            if (!error && (result !== null))
            {

                var noti = result.Notifications.reverse();
                for(var i=0;i<noti.length;i++){
                    noti[i].date = new Date(timezoneConversions.toIST(noti[i].date));
                }

                result.Notifications = noti;

                logger.debug(ip + " " + TAG + "Seller notification Successfully Fetched.");
                return callback(false, outputResult(result));
            }
            else if (!error && (result === null)) {
                logger.error(TAG + " Invalid Inputs, Inputs doesnt match with the database records, sellerId': " + req.body.sellerId);
                return callback(true, inputDontMatch());
            }
            else {
                logger.error(TAG + " Internal Server Error. error: " + error);
                return callback(true, internalServerError());
            }
        });
    }
    else 
    {
        logger.error(ip + TAG + " Bad or ill-formed request. : " + JSON.stringify(req.body));
        return callback(true, badFormat);
    }
};

exports.fetchSellerNotifyNew = function(req, callback){
    var resJson;

    //Get the IP Address of the client.
    var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;

    //Variable for Mongo DB Connection.
    var db = dbConfig.mongoDbConn;

    //Variable for Logging the messages to the file.
    var logger = log.logger_rfq;

    logger.info(ip + " " + TAG + " Entering fetchSellerNotify.");

    //Log the request.
    logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));

    colSellersNotification = db.collection("SellersInquiryNotification");
    var limit = 10;

    if (!(req.body === null ||
        req.body.sellerId === null ||
        req.body.sellerId === undefined ||
        req.body.sellerId.toString().trim().length === 0)) {
        var finalResult = [];
        var sellerId = req.body.sellerId;

        colSellersNotification.aggregate([                
            {
                "$match": {
                    "sellerId": req.body.sellerId
                }
            },
            {
                "$unwind": "$Notifications"
            },
            {
                "$sort": {"Notifications.date": -1}
            },
            {
                "$limit": limit
            },
            {
                "$project": {
                    "_id": 0,
                    "sellerId": 1,
                    "Notifications": 1
                }
            }], 
            function(error, result){
                if(error)
                {
                    resJson = {
                        "http_code" : "500",
                        "message" : "Internal Server Error..Please retry.."
                    };
                    logger.error(TAG + " notifications listing for seller : "+req.body.sellerId+", failed. Error:" + result);
                    return callback(true, resJson);
                }
                else if(!error && result.length > 0)
                {
                    result.forEach(function(currentValue, index, array){
                        finalResult.push(currentValue.Notifications)
                    });
                    resJson = {
                        "http_code" : "200",
                        "message" : {
                            "sellerId": req.body.sellerId,
                            "notifications": finalResult
                        }
                    };
                    logger.debug(TAG + " notifications listing for seller: "+req.body.sellerId+", successfull.");

                    //Calling below function to udpate the "read" status to true.
                    updateNotofications(req.body.sellerId, finalResult, function(error, result){
                        //Not handling error.
                    });

                    return callback(false, resJson);
                }
                else if(!error && result.length === 0)
                {
                    resJson = {
                        "http_code" : "404",
                        "message" : {
                            "sellerId": req.body.sellerId,
                            "notifications": finalResult
                        }
                    };
                    logger.error(TAG + " No matching notifications found for seller: "+req.body.sellerId);
                    return callback(true, resJson);
                }
            }
        );
           
    }
    else 
    {
        logger.error(ip + TAG + " Bad or ill-formed request. : " + JSON.stringify(req.body));
        return callback(true, badFormat);
    }
   
}

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

//Funciton that will update the read status to true from false.
function updateNotofications(sellerId, notifications, callback){
    var db = dbConfig.mongoDbConn;
    var logger = log.logger_rfq;
    var notificationsCol = db.collection('SellersInquiryNotification');

    try{

        //asynchronously updating the "read" field.
        async.each(notifications, function(element, asyncCallback){
            notificationsCol.update(
            {
                "sellerId": sellerId,
                "Notifications": { $elemMatch: {title: element.title, read: element.read, date: element.date}}
            },
            {
                $set: {
                "Notifications.$.read": true
              }
            },
            function(error, result){ //Final function of update function.
                if(error){
                    logger.error(TAG + " Error updating notifications for element: "+JSON.stringify(element)+", sellerId:"+sellerId);
                    return asyncCallback(true);
                }
                else{
                    return asyncCallback(false);
                }
            }
            )
        }, function(error){     //Final function to be called.
            if(error){
                logger.error(TAG + " Error updating notifications for sellerId: "+sellerId);
                return callback(true);
            }
            else{
                logger.debug(TAG + " Succesfully updated notifications for sellerId: "+sellerId);
                return callback(false);
            }
        });

    }
    catch(exception){
        logger.error(TAG + " Exception araised while updating notifications for sellerId: "+sellerId+", exception : "+exception);
        return callback(true);
    }

}