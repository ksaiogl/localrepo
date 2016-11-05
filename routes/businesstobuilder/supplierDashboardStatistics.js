/**
 * Created by Balkishan on 16-08-2016.
 */

var TAG = "supplierDashboardStatistics.js - ";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var async = require('async');

exports.fetchSupplierDashboardStatistics = function (req, callback) {
    //Get the IP Address of the client.
    var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;

    //Variable for Mongo DB Connection.
    var db = dbConfig.mongoDbConn;

    //Variable for Logging the messages to the file.
    var logger = log.logger_rfq;

    logger.info(ip + " " + TAG + " Entering fetchSupplierDashboardStatistics.");

    //Log the request.
    logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));

    if (!(req.body === null ||
        req.body.sellerId === null ||
        req.body.sellerId === undefined ||
        req.body.sellerId.toString().trim().length === 0)) {

        //var sellerId = req.body.sellerId;
        var sellerId = req.body.supplierSession.sellerEntity.profileInfo.accountInfo.sellerId;
        logger.debug(TAG + " sellerId from Session: "+ sellerId);
        var colSupplier = db.collection('SellerMaster');

        colSupplier.findOne({"sellerEntity.profileInfo.accountInfo.sellerId": sellerId, "sellerEntity.sellerVerificationStatus": {$ne : "disabled"}}, function(errors, results){
            if(!errors && results !== null)
            {
                async.parallel({
                    "inquiryStatistics": function (asyncCallback) {
                        logger.debug(ip + " " + TAG + "Entering inquiryStatistics function.");

                        var query = [];
                        var unwindQuery = {"$unwind": "$inquirySellerEntity.sellers"};
                        var matchQuery = {"$match": {"inquirySellerEntity.sellers.sellerId": sellerId}};
                        //var projectQuery = {"$project": {"inquirySellerEntity.sellers.status": 1}};

                        query.push(unwindQuery);
                        query.push(matchQuery);
                        //query.push(projectQuery);

                        var colInquiryFloat = db.collection('InquirySellerFloat');
                        logger.debug(" " + TAG + "Float query: " + JSON.stringify(query));
                        colInquiryFloat.aggregate(query, function (error, result) {
                            if (!error && (result.length > 0)) {
                                var countNewInquiry = 0;
                                var countInquiriesToQuote = 0;
                                var countInquiriesExpiringToday = 0;
                                var countInquiriesReceivedTillDate = 0;

                                for (var i = 0; i < result.length; i++) {
                                    var status = result[i].inquirySellerEntity.sellers.status;
                                    var inquiryStatus = result[i].inquirySellerEntity.inquiryStatus;
                                    var inquiryExpiringToday = result[i].inquirySellerEntity.expiringToday;

                                    if(inquiryExpiringToday !== undefined && inquiryExpiringToday === true && inquiryStatus !== "EditInProgress" && inquiryStatus !== "PendingApproval"){
                                        countInquiriesExpiringToday++;
                                    }

                                    if(status !== "EditInProgress" && status !== "PendingApproval")
                                        countInquiriesReceivedTillDate++;

                                    switch (status) {
                                        case "EnquirySent":
                                        {
                                            if (inquiryStatus !== "Expired")
                                                countNewInquiry++;
                                        }
                                        case "IntentToQuote":
                                        {
                                            if (inquiryStatus !== "Expired")
                                                countInquiriesToQuote++;
                                            break;
                                        }
                                        default:
                                            logger.error("Unregonised Status : " + status);
                                    }
                                }
                                var outResult = {};
                                outResult.sellerId = sellerId;
                                outResult.newInquiries = countNewInquiry;
                                outResult.InquiriesToQuote = countInquiriesToQuote;
                                outResult.InquiriesExpiringToday = countInquiriesExpiringToday;
                                outResult.InquiriesReceivedTillDate = countInquiriesReceivedTillDate;

                                logger.debug(ip + " " + TAG + "Inquiry Statistics fetched Successfully.");
                                return asyncCallback(false, outResult);
                            }
                            else if (!error && (result.length === 0)) {
                                logger.debug(TAG + " Inquiry Statistics not found for sellerId : "+sellerId);
                                return asyncCallback(true, noInquiryAvailable(sellerId));
                            }
                            else {
                                logger.error(TAG + " Internal Server Error. error: " + error);
                                return asyncCallback(true, internalServerError());
                            }
                        });
                    },
                    "quotationStatistics": function (asyncCallback) {
                        logger.debug(ip + " " + TAG + "Entering quotationStatistics function.");

                        var aggregateQuery = [];

                        var matchQuery = {
                            $match: {
                                "quotationEntity.sellerId": sellerId
                            }
                        };

                        var groupQuery = {
                            $group: {
                                _id: "$quotationEntity.inquiryId",
                                count: {$sum: 1}
                            }
                        };

                        var projectQuery = {
                            $project: {
                                _id: 0,
                                count: 1
                            }
                        };

                        aggregateQuery.push(matchQuery);
                        aggregateQuery.push(groupQuery);
                        aggregateQuery.push(projectQuery);

                        var countQuotedInquiries = 0;
                        var countAcceptedQuotes = 0;

                        var outResult = {};
                        outResult.QuotedInquiries = countQuotedInquiries;
                        outResult.AcceptedQuotes = countAcceptedQuotes;

                        var colInquiryQuotation = db.collection('InquiryQuotation');
                        logger.debug(" " + TAG + "quote aggregateQuery: " + JSON.stringify(aggregateQuery));
                        colInquiryQuotation.aggregate(aggregateQuery, function (error,result) {
                            if (!error && (result.length > 0)) {
                                countQuotedInquiries = result.length;
                                outResult.QuotedInquiries = countQuotedInquiries;

                                logger.debug(ip + " " + TAG + "Quotation statistics fetched Successfully.");
                                return asyncCallback(false, outResult);
                            }
                            else if (!error && (result.length === 0)) {
                                outResult.QuotedInquiries = countQuotedInquiries;

                                logger.error(TAG + " Quotation Statistics not found for sellerId : "+sellerId);
                                return asyncCallback(false, outResult);
                            }
                            else {
                                logger.error(TAG + " Internal Server Error. error: " + error);
                                return asyncCallback(true, internalServerError());
                            }
                        });
                    }
                }, function (error, result) {
                    if (!error) {
                        result.inquiryStatistics.QuotedInquiries = result.quotationStatistics.QuotedInquiries;
                        result.inquiryStatistics.AcceptedQuotes = result.quotationStatistics.AcceptedQuotes;

                        logger.debug(TAG + "supplier dashboard statistics fetched Successfully...");
                        return callback(false, outputResult(result.inquiryStatistics));
                    }
                    else {
                        logger.error(TAG + " Error while fetch supplier dashboard statistics for SellerId : "+sellerId+" Error : " + error);

                        if(result.hasOwnProperty('inquiryStatistics') && Object.getOwnPropertyNames(result.inquiryStatistics).length !== 0){
                            logger.error(TAG + " Error while fetch supplier details from sellerFloat for SellerId : "+sellerId+" Error : " + error);
                            return callback(true, result.inquiryStatistics);
                        }else if(result.hasOwnProperty('quotationStatistics') && Object.getOwnPropertyNames(result.quotationStatistics).length !== 0){
                            logger.error(TAG + " Error while fetch Quotation details from quotation master for SellerId : "+sellerId+" Error : " + error);
                            return callback(true, result.quotationStatistics);
                        }
                        else
                        {
                            logger.error(TAG + " Internal Server Error.");
                            return callback(true, internalServerError());
                        }
                    }
                });
            }
            else
            {
                logger.debug(TAG + "Seller not found for sellerId : "+sellerId);
                return callback(true, inputDontMatch());  
            }
        });
    }
    else {
        logger.error(ip + " " + TAG + " " + JSON.stringify(req.body));
        return callback(true, badFormat());
    }
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

function noInquiryAvailable(sellerId) {
    
    var outResult = {};
    outResult.sellerId = sellerId;
    outResult.newInquiries = 0;
    outResult.InquiriesToQuote = 0;
    outResult.InquiriesExpiringToday = 0;
    outResult.InquiriesReceivedTillDate = 0;
    outResult.QuotedInquiries = 0;
    outResult.AcceptedQuotes = 0;

    result = {
        "http_code": "200",
        "message": outResult
    };
    return result;
}