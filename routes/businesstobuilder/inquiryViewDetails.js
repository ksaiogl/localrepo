/**
 * Created by Balkishan on 11-08-2016.
 */
var TAG = "inquiryViewDetails.js - ";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var timeConversion = require('../helpers/timezoneConversions.js');

exports.fetchInquiryViewDetails = function (req, callback) {

    //Get the IP Address of the client.
    var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;

    //Variable for Mongo DB Connection.
    var db = dbConfig.mongoDbConn;

    //Variable for Logging the messages to the file.
    var logger = log.logger_rfq;

    logger.info(ip + " " + TAG + " Entering fetchInquiryViewDetails.");

    //Log the request.
    logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));

    if (!(req.body === null ||
        req.body.sellerId === null ||
        req.body.inquiryId === null ||
        req.body.inquiryVersion === null ||
        req.body.sellerId === undefined ||
        req.body.inquiryId === undefined ||
        req.body.inquiryVersion === undefined ||
        req.body.sellerId.toString().trim().length === 0 ||
        req.body.inquiryId.toString().trim().length === 0 ||
        req.body.inquiryVersion.toString().trim().length === 0)) {

        //var sellerId = req.body.sellerId;
        var sellerId = req.body.supplierSession.sellerEntity.profileInfo.accountInfo.sellerId;
        logger.debug(TAG + " sellerId from Session: "+ sellerId);
        var inquiryId = req.body.inquiryId;
        var inquiryVersion = req.body.inquiryVersion;

        colInquirySellerFloat = db.collection("InquirySellerFloat");

        var aggregateQuery = [];
        var unwindQuery = {
            $unwind:"$inquirySellerEntity.sellers"
        };
        var matchQuery = {
            $match:{
                "inquirySellerEntity.inquiryId": inquiryId,
                "inquirySellerEntity.inquiryVersion": inquiryVersion,
                "inquirySellerEntity.sellers.sellerId": sellerId,
                "inquirySellerEntity.sellers.status": {$nin: ["EditInProgress", "PendingApproval"]}
            }
        };

        aggregateQuery.push(unwindQuery,matchQuery);
        logger.debug(ip + " " + TAG + " Query : "+JSON.stringify(aggregateQuery));

        colInquirySellerFloat.aggregate(aggregateQuery, function (error, result) {
            //colInquirySellerFloat.findOne(findOneQuery, findOneFilter, function (error, result) {
            logger.info(ip + " " + TAG + " Query in InquirySellerFloat.");

            if (!error && (result.length > 0)) {

                var thisSeller = result[0];

                //var productIds = thisSeller.inquirySellerEntity.suppliersQuotations.products;
                var productIds = thisSeller.inquirySellerEntity.sellers.products;

                colInquiryMaster = db.collection("InquiryMaster");

                var findOneIMQuery = {
                    "inquiryEntity.inquiryId": inquiryId,
                    "inquiryEntity.inquiryVersion": inquiryVersion
                };

                logger.debug(ip + " " + TAG + " Query : "+JSON.stringify(findOneIMQuery));
                colInquiryMaster.findOne(findOneIMQuery, function (IM_error, IM_result) {
                    logger.info(ip + " " + TAG + " Query in InquiryMaster.");

                    if (!IM_error && (IM_result !== null)) {

                        var ret_result = {};

                        ret_result.sellerId = thisSeller.inquirySellerEntity.sellers.sellerId;
                        ret_result.sellerquotationId = thisSeller.inquirySellerEntity.sellers.sellerquotationId;
                        ret_result.inquiryId = IM_result.inquiryEntity.inquiryId;
                        ret_result.inquiryVersion = IM_result.inquiryEntity.inquiryVersion;

                        ret_result.status = IM_result.inquiryEntity.inquiryStatus;
                        ret_result.sellerStatus = thisSeller.inquirySellerEntity.sellers.status;
                        ret_result.valid_until = timeConversion.toIST(IM_result.inquiryEntity.inquiryDeactivationDate);

                        if(IM_result.inquiryEntity.respondByDate === undefined){
                            ret_result.respondByDate = "";
                        }
                        else{
                            ret_result.respondByDate = timeConversion.toIST(IM_result.inquiryEntity.respondByDate);
                        }
                        
                        ret_result.inquiryCity = IM_result.inquiryEntity.inquiryCity;

                        ret_result.customerFirstName = IM_result.inquiryEntity.customerFirstName;
                        ret_result.customerLastName = IM_result.inquiryEntity.customerLastName;
                        ret_result.companyName = IM_result.inquiryEntity.companyName;

                        ret_result.associatedbuilderId = IM_result.inquiryEntity.associatedbuilderId;
                        ret_result.associatedProjectId = IM_result.inquiryEntity.associatedProjectId;
                        ret_result.associatedProjectType = IM_result.inquiryEntity.associatedProjectType;
                        ret_result.associatedProjectName = IM_result.inquiryEntity.associatedProjectName;

                        ret_result.deliveryByDate = timeConversion.toIST(new Date(new Date(IM_result.inquiryEntity.deliveryByDate)));

                        ret_result.deliverTo = IM_result.inquiryEntity.shippingAddress;
                        ret_result.references = IM_result.inquiryEntity.inquiryStructured.references;
                        ret_result.paymentModes = IM_result.inquiryEntity.paymentModes;
                        ret_result.creditDaysNeeded = IM_result.inquiryEntity.creditDaysNeeded;
                        ret_result.remarks = IM_result.inquiryEntity.remarks;
                        ret_result.targetPriceForQuotation = IM_result.inquiryEntity.targetPriceForQuotation;
                        ret_result.packingAndFreightRequirements = IM_result.inquiryEntity.packingAndFreightRequirements;
                        ret_result.advancePayment = IM_result.inquiryEntity.advancePayment;
                        ret_result.advancePaymentAmount = IM_result.inquiryEntity.advancePaymentAmount;
                        ret_result.shipToProjectAddress = IM_result.inquiryEntity.shipToProjectAddress;

                        ret_result.deliveryCharges = thisSeller.inquirySellerEntity.sellers.deliveryCharges;

                        ret_result.CSTCharges = thisSeller.inquirySellerEntity.sellers.CSTCharges;
                        ret_result.quoteValidUpTo = thisSeller.inquirySellerEntity.sellers.quoteValidUpTo;
                        ret_result.deliveryTime = thisSeller.inquirySellerEntity.sellers.deliveryTime;

                        var productArray = IM_result.inquiryEntity.inquiryStructured.inquiryParams;

                        var sellerProductArray = [];

                        for (var i = 0; i < productIds.length; i++) {
                            for (var j = 0; j < productArray.length; j++) {
                                var productObject = {};
                                if (productIds[i].productId === productArray[j].productId) {
                                    productObject.productId = productArray[j].productId;
                                    productObject.productName = productArray[j].productName;
                                    productObject.productIdentifier = productArray[j].productIdentifier;
                                    productObject.subCategory = productArray[j].subCategory;
                                    productObject.productSpecs = productArray[j].productSpecs;
                                    productObject.quantity = productArray[j].quantity;
                                    productObject.quantityUnit = productArray[j].quantityUnit;
                                    productObject.brand = productArray[j].brand;
                                    productObject.manufacturer = productArray[j].manufacturer;
                                    productObject.deliveryByDate = timeConversion.toIST(productArray[j].deliveryByDate);

                                    var timeDiff = (productObject.deliveryByDate.getTime() - timeConversion.toIST(new Date()).getTime());
                                    if(timeDiff < 0){
                                        productObject.daysRemaining = "Respond By Date is Expired";
                                    }   
                                    else{
                                        timeDiff = Math.abs(timeDiff);
                                        productObject.daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                    }

                                    productObject.itemRemarks = productArray[j].itemRemarks;
                                    sellerProductArray.push(productObject);
                                    break;
                                }
                                else if(productIds[i].productId.charAt(0) === "S"){
                                    if(productIds[i].productIdentifier === productArray[j].productIdentifier){
                                        productObject.productId = productIds[i].productId;
                                        productObject.productName = productArray[j].productName;
                                        productObject.productIdentifier = productArray[j].productIdentifier;
                                        productObject.subCategory = productArray[j].subCategory;
                                        productObject.productSpecs = productArray[j].productSpecs;
                                        productObject.quantity = productArray[j].quantity;
                                        productObject.quantityUnit = productArray[j].quantityUnit;
                                        productObject.brand = productIds[i].newBrandSuggested || "";
                                        productObject.manufacturer = productArray[j].manufacturer;
                                        productObject.deliveryByDate = timeConversion.toIST(productArray[j].deliveryByDate);

                                        var timeDiff = (productObject.deliveryByDate.getTime() - timeConversion.toIST(new Date()).getTime());
                                        if(timeDiff < 0){
                                            productObject.daysRemaining = "Respond By Date is Expired";
                                        }   
                                        else{
                                            timeDiff = Math.abs(timeDiff);
                                            productObject.daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                        }

                                        productObject.itemRemarks = productArray[j].itemRemarks;
                                        sellerProductArray.push(productObject);
                                        break;
                                    }
                                }
                            }
                        }

                        ret_result.products = sellerProductArray;

                        logger.debug(ip + " " + TAG + "Seller inquiry float information Successfully fetched.");
                        return callback(false, outputResult(ret_result));
                    }
                    else if (!IM_error && (IM_result === null)) {
                        logger.error(TAG + " Invalid Inputs, Inputs doesnt match with the database records, sellerId': " + sellerId);
                        return callback(true, inputDontMatch());
                    }
                    else {
                        logger.error(TAG + " Internal Server Error. error: " + IM_error);
                        return callback(true, internalServerError());
                    }
                });

            }
            else if (!error && !(result.length>0)) {
                logger.error(TAG + " Invalid Inputs, Inputs doesn't match with the database records, sellerId': " + sellerId);
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
