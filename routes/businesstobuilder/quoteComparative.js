/**
 * Created by Balkishan on 19-08-2016.
 */

var TAG = "masterQuotation_V2.js - ";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var timezoneConversions = require('../helpers/timezoneConversions.js');
var async = require('async');

exports.fetchQuoteComparative = function (req, callback) {
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

        generateQuoteComparative(inquiryId, inquiryVersion, function (error, result) {
            if (!error) {
                logger.debug(TAG + "Quotaiton Master generated successfully for inquiryId: " + inquiryId + " ,inquiryVersion: " + inquiryVersion);
                return callback(false, outputResult(result));
            }
            else {
                logger.error(TAG + "Error - While generating Quotation Master for inquiryId: " + inquiryId + " ,inquiryVersion: " + inquiryVersion);
                return callback(true, comparativeNotFound());
            }
        });
    }
    else {
        logger.error(TAG + "Error -Failed to update Inquiry Status for inquiryId: " + inquiryId + " ,inquiryVersion: " + inquiryVersion);
        return callback(true, badFormat());
    }
};

//Function to generateQuoteComparative in InquiryMaster after Floating to Supplier.
function generateQuoteComparative(inquiryId, inquiryVersion, callback) {

    //Variable for Logging the messages to the file.
    var logger = log.logger_rfq;
    logger.debug(TAG + "Entering generateQuoteComparative");

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
                var matchShortListedSellerQuery = {
                    $match: {
                        "inquirySellerEntity.sellers.status": "QuoteShortListed"
                    }
                };
                var sortSellerQuery = {
                    $sort: {"inquirySellerEntity.sellers.sellerId": 1}
                };
                var projectQuery = {
                    $project:{
                        _id:0,
                        "inquirySellerEntity.sellers":1
                    }
                };

                aggregateQuery.push(matchQuery);
                aggregateQuery.push(unWindSellersQuery);
                aggregateQuery.push(matchShortListedSellerQuery);
                aggregateQuery.push(sortSellerQuery);
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

    outputResult.suppliersChosen = masterResult.inquiryEntity.suppliersChosen;
    outputResult.quoteFromMSupplySuppliers = masterResult.inquiryEntity.quoteFromMSupplySuppliers;
    outputResult.advancePayment = masterResult.inquiryEntity.advancePayment;
    outputResult.advancePaymentAmount = masterResult.inquiryEntity.advancePaymentAmount;
    outputResult.targetPriceForQuotation = masterResult.inquiryEntity.targetPriceForQuotation;

    outputResult.packingAndFreightRequirements = masterResult.inquiryEntity.packingAndFreightRequirements;
    outputResult.inquiryCity = masterResult.inquiryEntity.inquiryCity;

    var productIdentifiersArray = [];
    var suppliersArray = floatResult;

    var quotationsArray = [];

    var inquiryParams = masterResult.inquiryEntity.inquiryStructured.inquiryParams;
    for(var i = 0;i<inquiryParams.length;i++)
    {
        var curProductIdentifier = inquiryParams[i].productIdentifier;
        if(productIdentifiersArray.indexOf(curProductIdentifier) == -1)   //not in array
        {
            productIdentifiersArray.push(curProductIdentifier);
        }
    }

    var productIdentifierDetails = [];
    for(var i = 0;i<productIdentifiersArray.length;i++){
        var product = {};
        product.productIdentifier = productIdentifiersArray[i];
        product.associatedBrands = [];

        for(var j = 0;j<inquiryParams.length;j++){
            if(productIdentifiersArray[i] === inquiryParams[j].productIdentifier){
                if(!product.hasOwnProperty("details")){
                    product.details = inquiryParams[j];
                    product.associatedBrands.push(inquiryParams[j].brand);
                    delete product.details.brand;
                }
                else{
                    product.associatedBrands.push(inquiryParams[j].brand);
                }
            }
        }
        productIdentifierDetails.push(product);
    }

    var paytermsArray = [];
    var brandsArray = [];

    for(var i = 0;i<floatResult.length;i++){
        var curSeller = floatResult[i].inquirySellerEntity.sellers;
        var associatedPaymentTerms = [];

        for(var j = 0;j<quoteResult.length;j++){
            var curQuote = quoteResult[j].quotationEntity;
            var paymentTerms = curQuote.paymentMode+(curQuote.creditDays ? (" - "+curQuote.creditDays+" Days"):(""));

            if(curQuote.sellerId === curSeller.sellerId && associatedPaymentTerms.indexOf(paymentTerms) == -1){
                associatedPaymentTerms.push(paymentTerms);
            }
        }
        floatResult[i].associatedPaymentTerms = associatedPaymentTerms;
    }

    for(var i = 0;i<floatResult.length;i++){
        var curSeller = floatResult[i].inquirySellerEntity.sellers;
        floatResult[i].terms_brands_rel = [];

        for(var k = 0;k<floatResult[i].associatedPaymentTerms.length;k++){
            var rel_brand_terms = {};
            rel_brand_terms.paymentTerm = floatResult[i].associatedPaymentTerms[k];
            rel_brand_terms.brands = [];
            for(var j = 0;j<quoteResult.length;j++){
                var curQuote = quoteResult[j].quotationEntity;
                var paymentTerms = curQuote.paymentMode+(curQuote.creditDays ? (" - "+curQuote.creditDays+" Days"):(""));

                if(paymentTerms === rel_brand_terms.paymentTerm && curSeller.sellerId === curQuote.sellerId && rel_brand_terms.brands.indexOf(curQuote.brand) == -1){
                    rel_brand_terms.brands.push(curQuote.brand)
                }
            }
            floatResult[i].terms_brands_rel.push(rel_brand_terms);
        }
        delete floatResult[i].associatedPaymentTerms;
    }

    var sup_pay = [];
    for(var t = 0;t<floatResult.length;t++)
    {
        var curSeller = floatResult[t];

        var sup_id = curSeller.inquirySellerEntity.sellers.sellerId;
        curSeller.sellerId = sup_id;

        var pay_brandArray = [];
        for(var i = 0;i<curSeller.terms_brands_rel.length;i++) {
            var curPayterms = curSeller.terms_brands_rel[i].paymentTerm;

            var termsToBrand = {};
            termsToBrand.paymentTerms = curPayterms;
            termsToBrand.brand = [];

            for(var k = 0;k<curSeller.terms_brands_rel[i].brands.length;k++)
            {
                var curBrand = curSeller.terms_brands_rel[i].brands[k];

                var brandQuotes = {};
                brandQuotes.brandName = curBrand;
                brandQuotes.identifiers = [];
                //brandQuotes.Quotations = [];

                for(var l = 0;l<productIdentifiersArray.length;l++)
                {
                    var curPrId = productIdentifiersArray[l];

                    var prod_quote = {};
                    prod_quote.productIdentifier = curPrId;
                    prod_quote.Quotations = [];

                    for (var j = 0; j < quoteResult.length; j++) {
                        var curQuote = quoteResult[j].quotationEntity;
                        var paymentTerms = curQuote.paymentMode + (curQuote.creditDays ? (" - " + curQuote.creditDays + " Days") : (""));

                        if(sup_id === curQuote.sellerId && curPayterms === paymentTerms && curBrand === curQuote.brand && curPrId === curQuote.productIdentifier)
                        {
                            //brandQuotes.Quotations.push(curQuote);
                            prod_quote.Quotations.push(curQuote);
                        }
                    }
                    brandQuotes.identifiers.push(prod_quote);
                }
                termsToBrand.brand.push(brandQuotes);
            }
            pay_brandArray.push(termsToBrand);
        }
        delete curSeller.terms_brands_rel;
        curSeller.payments = pay_brandArray;
        sup_pay.push(curSeller);
    }

    //outputResult.quotes = quoteResult;
    outputResult.products = productIdentifierDetails;
    outputResult.suppliers = sup_pay;
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

function comparativeNotFound() {
    result = {
        "http_code": "401",
        "message": "Comparatives not found"
    };
    return result;
}