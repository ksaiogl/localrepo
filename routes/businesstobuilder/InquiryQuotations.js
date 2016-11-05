/**
 * Created by Balkishan on 11-08-2016.
 */

var TAG = "InquiryQuotations.js - ";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');

exports.fetchInquiryQuotations = function (req, callback) {

    //Get the IP Address of the client.
    var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;

    //Variable for Mongo DB Connection.
    var db = dbConfig.mongoDbConn;

    //Variable for Logging the messages to the file.
    var logger = log.logger_rfq;

    logger.info(ip + " " + TAG + " Entering fetchInquiryQuotations.");

    //Log the request.
    logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));

    if (!(req.body === null ||
        req.body.sellerId === null ||
        req.body.inquiryId === null ||
        req.body.inquiryVersion === null ||
        req.body.status === null ||
        req.body.sellerId === undefined ||
        req.body.inquiryId === undefined ||
        req.body.inquiryVersion === undefined ||
        req.body.status === undefined ||
        req.body.sellerId.toString().trim().length === 0 ||
        req.body.inquiryId.toString().trim().length === 0 ||
        req.body.inquiryVersion.toString().trim().length === 0 ||
        req.body.status.toString().trim().length === 0)) {

        var sellerId = req.body.sellerId;
        var inquiryId = req.body.inquiryId;
        var inquiryVersion = req.body.inquiryVersion;
        var status = req.body.status;

        colInquirySellerFloat = db.collection("InquirySellerFloat");

        var findOneQuery = {
            "inquirySellerEntity.inquiryId": inquiryId,
            "inquirySellerEntity.inquiryVersion": inquiryVersion,
            "inquirySellerEntity.sellers.sellerId": sellerId
        };
        var findOneFilter = {"inquirySellerEntity.sellers.$": 1};

        colInquirySellerFloat.findOne(findOneQuery, findOneFilter, function (error, result) {
            if (!error && (result !== null)) {
                var productIds = result.inquirySellerEntity.sellers[0].products;

                colInquiryMaster = db.collection("InquiryMaster");

                var findOneIMQuery = {
                    "inquiryEntity.inquiryId": inquiryId,
                    "inquiryEntity.inquiryVersion": inquiryVersion
                };
                logger.debug(" " + TAG + "findOneIMQuery: " + JSON.stringify(findOneIMQuery));
                colInquiryMaster.findOne(findOneIMQuery, function (IM_error, IM_result) {
                    if (!IM_error && (IM_result !== null)) {

                        var ret_result = {};

                        ret_result.inquiryId = IM_result.inquiryEntity.inquiryId;
                        ret_result.status = IM_result.inquiryEntity.inquiryStatus;
                        ret_result.valid_until = IM_result.inquiryEntity.inquiryDeactivationDate;
                        ret_result.customerFirstName = IM_result.inquiryEntity.customerFirstName;
                        ret_result.customerLastName = IM_result.inquiryEntity.customerLastName;
                        ret_result.companyName = IM_result.inquiryEntity.companyName;
                        ret_result.projectName = IM_result.inquiryEntity.associatedProjectName;
                        ret_result.deliverTo = IM_result.inquiryEntity.shippingAddress;
                        //ret_result.references = IM_result.inquiryEntity.inquiryStructured.references;
                        ret_result.paymentModes = IM_result.inquiryEntity.paymentModes;
                        ret_result.creditDaysNeeded = IM_result.inquiryEntity.creditDaysNeeded;

                        var productArray = IM_result.inquiryEntity.inquiryStructured.inquiryParams;

                        var sellerProductArray = [];

                        for (var i = 0; i < productIds.length; i++) {
                            for (var j = 0; j < productArray.length; j++) {
                                var productObject = {};
                                if (productIds[i].productId === productArray[j].productId) {
                                    productObject.productId = productArray[j].productId;
                                    productObject.productName = productArray[j].productName;
                                    productObject.productSpecs = productArray[j].productSpecs;
                                    productObject.quantity = productArray[j].quantity;
                                    productObject.quantityUnit = productArray[j].quantityUnit;
                                    productObject.brand = productArray[j].brand;
                                    productObject.manufacturer = productArray[j].manufacturer;
                                    productObject.deliveryByDate = productArray[j].deliveryByDate;
                                    productObject.itemRemarks = productArray[j].itemRemarks;
                                    sellerProductArray.push(productObject);
                                }
                            }
                        }

                        colQuotation = db.collection("InquiryQuotation");

                        var findQuery = {
                            "quotationEntity.inquiryId":inquiryId,
                            "quotationEntity.inquiryVersion":inquiryVersion,
                            "quotationEntity.sellerId":sellerId,
                            "quotationEntity.status":status
                        };
                        logger.debug(" " + TAG + "findQuery: " + JSON.stringify(findQuery));
                        colQuotation.find(findQuery).toArray(function (q_error,q_result) {
                            if (!q_error && ( q_result !== null)) {

                                for(var i = 0;i<sellerProductArray.length;i++){
                                    var quota = {};
                                    for(var j=0;j<q_result.length;j++){
                                        if(q_result[j].quotationEntity.productId === sellerProductArray[i].productId){
                                            quota = q_result[j].quotationEntity;
                                            break;
                                        }
                                    }
                                    sellerProductArray[i].quotation = quota;
                                }

                                ret_result.sellerquotationId = q_result[0].quotationEntity.sellerquotationId;
                                ret_result.products = sellerProductArray;

                                logger.debug(ip + " " + TAG + "Inquiry Quotations fetched Successfully.");
                                return callback(false, outputResult(ret_result));
                            }
                            else if (! q_error && ( q_result === null)) {
                                logger.error(TAG + " Invalid Inputs, Inputs doesnt match with the database records, inquiryId': ");
                                return callback(true, inputDontMatch());
                            }
                            else {
                                logger.error(TAG + " Internal Server Error. error: " + q_error);
                                return callback(true, internalServerError());
                            }
                        });
                    }
                    else if (!IM_error && (IM_result === null)) {
                        logger.error(TAG + " Invalid Inputs, Inputs doesnt match with the database records, sellerId': " + req.body.sellerId);
                        return callback(true, inputDontMatch());
                    }
                    else {
                        logger.error(TAG + " Internal Server Error. error: " + IM_error);
                        return callback(true, internalServerError());
                    }
                });

            }
            else if (!error && (result === null)) {
                logger.error(TAG + " Invalid Inputs, Inputs doesn't match with the database records, sellerId': " + req.body.sellerId);
                return callback(true, inputDontMatch());
            }
            else {
                logger.error(TAG + " Internal Server Error. error: " + error);
                return callback(true, internalServerError());
            }
        });

    }
    else {
        logger.error(ip + " " + TAG + " " + JSON.stringify(badFormat()));
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