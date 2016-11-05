/**
 * Created by Balkishan on 17-08-2016.
 */
var TAG = "--- quotationFootprint.js ---    ";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var timeConversion = require('../helpers/timezoneConversions.js');


exports.addQuotationEvent = function (old_data, new_data, callback) {

    var logger = log.logger_rfq;

    //Get the IP Address of the client.
    var ip = "";

    logger.info(ip + " " + TAG + " Entering addQuotationEvent.");

    var eventsDescp = getModifiedEvents(old_data, new_data).join(', ');

    if(eventsDescp.length === 0){
        return callback(false,"Not updated");
    }

    var eventObj = {
        eventAt: new Date(),
        eventsDescription: eventsDescp
    };

    insertEvent(eventObj, old_data, callback);

};

function insertEvent(eventObj, new_data, callback) {

    var logger = log.logger_rfq;

    //Get the IP Address of the client.
    var ip = "";

    logger.debug(ip + " " + TAG + "Entering insertEvent Function...");

    var db = dbConfig.mongoDbConn;
    var orderEventColl = db.collection('QuotationEvents');
    orderEventColl.update(
        {
            'inquiryId': new_data.inquiryId,
            'inquiryVersion': new_data.inquiryVersion,
            'sellerquotationId': new_data.sellerquotationId,
            'sellerId': new_data.sellerId,
            'productId': new_data.productId,
            'productIdentifier': new_data.productIdentifier,
            'quotationId' : new_data.quotationId,
            'quotationVersion' : new_data.quotationVersion
        },
        {
            $push: {
                'events': {
                    $each: [eventObj],
                    $sort: {'eventAt': -1}
                }
            }
        },
        {upsert: true},
        function (err, result) {
            if (err) {
                logger.error("Error inserting quotation event in DB. Error : \n", err.stack);
                if (callback) {
                    callback(err);
                }
            } else {
                logger.info("Event successfully inserted in DB.");
                if (callback) {
                    callback(err);
                }
            }
        });
}

function getModifiedEvents(old_data, new_data) {

    var logger = log.logger_rfq;

    var ip="";

    logger.debug(ip + " " + TAG + "Entering getModifiedEvents Function...");

    var descpArray = [];

    Object.keys(old_data).forEach(function(key) {

        if (old_data[key] !== new_data[key]) {
            if(key !== "lastUpdatedAt"){
                var descp = key + " is changed from " + old_data[key] + " to " + new_data[key];
                descpArray.push(descp);
            }
        }
    });

    return descpArray;
}