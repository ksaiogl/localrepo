/**
 * Created by Balkishan on 19-08-2016.
 */

var TAG = "quotationMaster.js - ";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var timezoneConversions = require('../helpers/timezoneConversions.js');
var async = require('async');

exports.fetchQuotationMaster = function (req, callback) {
    var logger = log.logger_rfq;

    if (!(
        req.body === null ||
        req.body.inquiryId === undefined ||
        req.body.inquiryId === null ||
        req.body.inquiryId.toString().trim().length === 0 ||
        req.body.inquiryVersion === undefined ||
        req.body.inquiryVersion === null ||
        req.body.inquiryVersion.toString().trim().length === 0)) {

        var inquiryId = req.body.inquiryId;
        var inquiryVersion = req.body.inquiryVersion;

        generateQuotationMaster(inquiryId, inquiryVersion, function (error, result) {
            if (!error) {
                logger.debug(TAG + "Quotaiton Master generated successfully for inquiryId: " + inquiryId + " ,inquiryVersion: " + inquiryVersion);
                return callback(false, outputResult(result));
            }
            else {
                logger.error(TAG + "Error - While generating Quotation Master for inquiryId: " + inquiryId + " ,inquiryVersion: " + inquiryVersion);
                return callback(true, inputDontMatch());
            }
        });
    }
    else {
        logger.error(TAG + "Error -Failed to update Inquiry Status for inquiryId: " + inquiryId + " ,inquiryVersion: " + inquiryVersion);
        return callback(true, badFormat());
    }
};

//Function to generateQuotationMaster in InquiryMaster after Floating to Supplier.
function generateQuotationMaster(inquiryId, inquiryVersion, callback) {

    //Variable for Logging the messages to the file.
    var logger = log.logger_rfq;
    logger.debug(TAG + "Entering generateQuotationMaster");

    var db = dbConfig.mongoDbConn;

    var inquiryMasterColl = db.collection("InquiryMaster");
    var inquiryFloatColl = db.collection("InquirySellerFloat");
    var inquiryQuoteColl = db.collection("InquiryQuotation");

    async.parallel({
            //Function to get product details from inquiryMaster.
            "inquiryMaster": function (asyncCallback) {
                var findOneQuery = {
                    "inquiryEntity.inquiryId": inquiryId,
                    "inquiryEntity.inquiryVersion": inquiryVersion
                };

                inquiryMasterColl.findOne(findOneQuery, function (error, result) {
                    if (!error && (result !== null)) {
                        logger.debug(TAG + "Data fetched from inquiryMaster Successfully...");
                        return asyncCallback(false, result);
                    }
                    else if (!error && (result === null)) {
                        logger.error(TAG + " Record Not Found in InquiryMaster for inquiryId: " + inquiryId + ", inquiryVersion: " + inquiryVersion);
                        return asyncCallback(true, "Record Not Found");
                    }
                    else {
                        logger.error(TAG + " Error fetching inquiryDetails in InquiryMaster collection for inquiryId: " + inquiryId + ", inquiryVersion: " + inquiryVersion + " err: " + error);
                        return asyncCallback(true, "Record Not Found");
                    }
                });
            },

            //Function to get sellers and there product details from inquiry supplier float
            "inquiryFloat": function (asyncCallback) {

                var aggregateQuery = [];

                var matchQuery = {
                    $match: {
                        "inquirySellerEntity.inquiryId": inquiryId,
                        "inquirySellerEntity.inquiryVersion": inquiryVersion
                    }
                };

                var unWindSellersQuery = {
                    $unwind: "$inquirySellerEntity.sellers"
                };

                var matchSellerQuery = {
                    $match: {
                        "inquirySellerEntity.sellers.status": {$ne: "NotIntentToQuote"}
                    }
                };

                var unWindProductsQuery = {
                    $unwind: "$inquirySellerEntity.sellers.products"
                };

                var sortSellerQuery = {
                    $sort: {"inquirySellerEntity.sellers.sellerId": 1}
                };

                var groupQury = {
                    $group: {
                        _id: "$inquirySellerEntity.sellers.products.productIdentifier",
                        "sellers": {
                            $addToSet: {
                                "sellerId": "$inquirySellerEntity.sellers.sellerId",
                                "companyName": "$inquirySellerEntity.sellers.companyName",
                                "deliveryCharges": "$inquirySellerEntity.sellers.deliveryCharges",
                                "supplierStatus": "$inquirySellerEntity.sellers.status",
                                "sellerRemarks": "$inquirySellerEntity.sellers.sellerRemarks",
                                "CSTCharges": "$inquirySellerEntity.sellers.CSTCharges",
                                "quoteValidUpTo": "$inquirySellerEntity.sellers.quoteValidUpTo",
                                "deliveryTime": "$inquirySellerEntity.sellers.deliveryTime"
                            }
                        }
                    }
                };

                var projectQuery = {
                    $project: {
                        _id: 0,
                        "productIdentifier": "$_id",
                        "sellers": 1
                    }
                };

                aggregateQuery.push(matchQuery);
                aggregateQuery.push(unWindSellersQuery);
                //aggregateQuery.push(matchSellerQuery);
                aggregateQuery.push(unWindProductsQuery);
                aggregateQuery.push(sortSellerQuery);
                aggregateQuery.push(groupQury);
                aggregateQuery.push(projectQuery);

                logger.debug(" " + TAG + "aggregateQuery: " + JSON.stringify(aggregateQuery));
                inquiryFloatColl.aggregate(aggregateQuery, function (error, result) {
                    if (!error && result.length > 0) {
                        logger.debug(TAG + "Data fetched from inquiryFloat Successfully...");
                        return asyncCallback(false, result);
                    }
                    else if (!error && result.length < 1) {
                        logger.error(TAG + " Record Not Found in InquiryFloat for inquiryId: " + inquiryId + ", inquiryVersion: " + inquiryVersion);
                        return asyncCallback(true, result);
                    }
                    else {
                        logger.error(TAG + " Error fetching sellerDetails from InquiryFloat collection for inquiryId: " + inquiryId + ", inquiryVersion: " + inquiryVersion + " err: " + error);
                        return asyncCallback(true, internalServerError());
                    }
                });
            },

            //Function to get quotation details from inquiryQuotation
            "inquiryQuote": function (asyncCallback) {
                var aggregateQuery = [];

                var matchQuery = {
                    "$match": {
                        "quotationEntity.inquiryId": inquiryId,
                        "quotationEntity.inquiryVersion": inquiryVersion,
                        "quotationEntity.status": "Active"
                    }
                };

                var groupQuery = {
                    "$group": {
                        _id: "$quotationEntity.sellerId",
                        "sellerId": {$first: "$quotationEntity.sellerId"},
                        "quotations": {
                            "$addToSet": "$quotationEntity"
                        }
                    }
                };

                aggregateQuery.push(matchQuery);
                logger.debug(" " + TAG + "quote aggregateQuery: " + JSON.stringify(aggregateQuery));
                inquiryQuoteColl.aggregate(aggregateQuery, function (error, result) {

                    if (!error && result.length > 0) {
                        logger.debug(TAG + "Data fetched from inquiryQuotation Successfully...");
                        return asyncCallback(false, result);
                    }
                    else if (!error && result.length < 1) {
                        logger.error(TAG + " Record Not Found in InquiryQuotation for inquiryId: " + inquiryId + ", inquiryVersion: " + inquiryVersion);
                        return asyncCallback(false, result);
                    }
                    else {
                        logger.error(TAG + " Error fetching quotaitonDetails from InquiryQuotation collection for inquiryId: " + inquiryId + ", inquiryVersion: " + inquiryVersion + " err: " + error);
                        return asyncCallback(true, internalServerError());
                    }
                });
            }
        },
        //Final function that will be called by functions defined in Parallel.
        function (error, results) {
            if (!error) {
                var masterQuotation = combineResults(results);
                logger.debug(TAG + "MasterQuotation generated Successfully...");
                return callback(false, masterQuotation);
            }
            else {
                logger.error(TAG + " Error while generating masterQuotation for inquiryId: " + inquiryId + ", inquiryVersion: " + inquiryVersion + " err: " + error);
                return callback(true, results);
            }
        });
}

function combineResults(results) {

    var masterResult = results.inquiryMaster;
    var floatResult = results.inquiryFloat;
    var quoteResult = results.inquiryQuote;

    var outputResult = {};

    outputResult.inquiryId = masterResult.inquiryEntity.inquiryId;
    outputResult.inquiryVersion = masterResult.inquiryEntity.inquiryVersion;
    //outputResult.customerName = masterResult.inquiryEntity.customerName;
    outputResult.customerFirstName = masterResult.inquiryEntity.customerFirstName || "";
    outputResult.customerLastName = masterResult.inquiryEntity.customerLastName || "";
    outputResult.companyName = masterResult.inquiryEntity.companyName;

    outputResult.noOfQuotationsDesiredRange = masterResult.inquiryEntity.noOfQuotationsDesiredRange || "";

    outputResult.status = masterResult.inquiryEntity.inquiryStatus;
    outputResult.inquiryDate = timezoneConversions.toIST(masterResult.inquiryEntity.inquiryTimestamp);
    outputResult.associatedbuilderId = masterResult.inquiryEntity.associatedbuilderId;
    outputResult.associatedProjectId = masterResult.inquiryEntity.associatedProjectId;
    outputResult.associatedProjectType = masterResult.inquiryEntity.associatedProjectType;
    outputResult.associatedProjectName = masterResult.inquiryEntity.associatedProjectName;
    outputResult.deliveryByDate = masterResult.inquiryEntity.deliveryByDate;

    outputResult.respondByDate = masterResult.inquiryEntity.respondByDate ? timezoneConversions.toIST(masterResult.inquiryEntity.respondByDate) : null;
    outputResult.valid_until = timezoneConversions.toIST(masterResult.inquiryEntity.inquiryDeactivationDate);

    outputResult.paymentModes = masterResult.inquiryEntity.paymentModes;
    outputResult.creditDaysNeeded = masterResult.inquiryEntity.creditDaysNeeded;
    outputResult.shippingAddress = masterResult.inquiryEntity.shippingAddress;

    var pi = {};
    var items = {};
    var associatedSuppliers = {};
    var associatedProducts = [];
    var associatedProductBrands = [];

    var inquiryParams = masterResult.inquiryEntity.inquiryStructured.inquiryParams;
    for (var i = 0; i < inquiryParams.length; i++) {
        if (!pi.hasOwnProperty(inquiryParams[i].productIdentifier)) {
            pi[inquiryParams[i].productIdentifier] = inquiryParams[i].productSpecs;
            associatedProducts.push(inquiryParams[i].productIdentifier);
            var currentItem = {};
            currentItem.productIdentifier = inquiryParams[i].productIdentifier;
            currentItem.productSpec = inquiryParams[i].productSpecs;
            currentItem.subCategory = inquiryParams[i].subCategory;
            currentItem.quantity = inquiryParams[i].quantity;
            currentItem.quantityUnit = inquiryParams[i].quantityUnit;
            currentItem.deliveryByDate = inquiryParams[i].deliveryByDate;

            currentItem.sellers = {};

            for (var j = 0; j < floatResult.length; j++) {
                if (floatResult[j].productIdentifier === inquiryParams[i].productIdentifier) {
                    var sellers = floatResult[j].sellers;
                    for (var g = 0; g < sellers.length; g++) {
                        var sellerId = sellers[g].sellerId;
                        //if(associatedSuppliers.indexOf(sellers[g].companyName) == -1)
                        //    associatedSuppliers.push(sellers[g].companyName);
                        if(!associatedSuppliers.hasOwnProperty(sellers[g].sellerId)){
                            var supplierInfo = {};
                            supplierInfo.sellerId = sellers[g].sellerId;
                            supplierInfo.companyName = sellers[g].companyName;

                            associatedSuppliers[sellers[g].sellerId] = supplierInfo;

                        }
                        var deliveryCharges = sellers[g].deliveryCharges;

                        if (deliveryCharges === undefined) {
                            sellers[g].deliveryCharges = 0;
                        }

                        sellers[g].quotations = [];
                        for (var k = 0; k < quoteResult.length; k++) {
                            var quoteEntity = quoteResult[k].quotationEntity;
                            if ((quoteEntity.productIdentifier === inquiryParams[i].productIdentifier) && (quoteEntity.sellerId === sellerId)) {
                                sellers[g].quotations.push(quoteEntity);
                            }
                        }

                        var curSeller = sellers[g];
                        currentItem.sellers[curSeller.sellerId] = curSeller;

                    }
                    //currentItem.sellers = sellers;
                }
            }
            //items.push(currentItem);
            items[currentItem.productIdentifier] = currentItem;
        }
    }

    // Get all productIdentifier and its brand Assocition from the InquiryMaster.
    for (var i = 0; i < associatedProducts.length; i++)
    {
        var brandObject = { "productIdentifier" : associatedProducts[i],
            "brand" : [] };

        for (var j = 0; j < inquiryParams.length; j++)
        {
            if(brandObject.productIdentifier === inquiryParams[j].productIdentifier)
            {
                brandObject.brand.push(inquiryParams[j].brand);
            }
        }
        associatedProductBrands.push(brandObject);
    };

    outputResult.associatedSuppliers = associatedSuppliers;
    outputResult.associatedProducts = associatedProducts;
    outputResult.associatedProductBrands = associatedProductBrands;

    outputResult.items = items;

    //console.log(items['wallMount-LED-8']['sellers']['Seller113']['quotations']);

    return outputResult;
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
