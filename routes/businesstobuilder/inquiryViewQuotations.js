var TAG = "InquiryQuotations.js - ";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var timeConversion = require('../helpers/timezoneConversions.js');

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
        req.body.sellerquotationId === null ||
        req.body.inquiryId === null ||
        req.body.inquiryVersion === null ||
        req.body.sellerId === undefined ||
        req.body.sellerquotationId === undefined ||
        req.body.inquiryId === undefined ||
        req.body.inquiryVersion === undefined ||
        req.body.sellerId.toString().trim().length === 0 ||
        req.body.sellerId.toString().trim().length === 0 ||
        req.body.sellerquotationId.toString().trim().length === 0 ||
        req.body.inquiryVersion.toString().trim().length === 0)) {

        //var sellerId = req.body.sellerId;
        var sellerId = req.body.supplierSession.sellerEntity.profileInfo.accountInfo.sellerId;
        logger.debug(TAG + " sellerId from Session: "+ sellerId);
        var sellerquotationId = req.body.sellerquotationId;
        var inquiryId = req.body.inquiryId;
        var inquiryVersion = req.body.inquiryVersion;
        var status = "Active";

        colInquirySellerFloat = db.collection("InquirySellerFloat");

        var findOneQuery = {
            "inquirySellerEntity.inquiryId": inquiryId,
            "inquirySellerEntity.inquiryVersion": inquiryVersion,
            "inquirySellerEntity.sellers.sellerId": sellerId
            ////"inquirySellerEntity.sellers.sellerquotationId": sellerquotationId,
            //"inquirySellerEntity.sellers.status": {$nin: ["EditInProgress", "PendingApproval"]}
        };
        logger.debug(" " + TAG + " Query seller Floatt. "+JSON.stringify(findOneQuery));

        //var findOneFilter = {"inquirySellerEntity.sellers.$": 1};

        colInquirySellerFloat.findOne(findOneQuery, function (error, result) {
            logger.info(ip + " " + TAG + " Query in InquirySellerFloat.");
            if (!error && (result !== null)) {

                var inquiryStatus = result.inquirySellerEntity.inquiryStatus;

                //Check inquiry is expired
                var expired = false;
                if(inquiryStatus === "Expired"){
                    expired = true;
                }

                //Check all suppliers related to the inquiry have quoted
                var sellersArray = result.inquirySellerEntity.sellers;
                var allQuoted = true;
                for(var i = 0;i<sellersArray.length;i++){
                    if(sellersArray[i].status !== "QuoteSubmitted" && sellersArray[i].status !== "QuoteAmended"){
                        allQuoted = false;
                        break;
                    }
                }

                //edit is true if all Suppliers quoted and inquiry is not expired
                //else edit is false
                var edit = true;
                if(allQuoted || expired){
                    edit = false;
                }

                var restrictedStatus = ["EditInProgress", "PendingApproval"];
                var sellerDetails = {};
                for(var i = 0;i<sellersArray.length;i++){
                    if(sellersArray[i].sellerId === sellerId){
                        if(restrictedStatus.indexOf(sellersArray[i].status) === -1  && sellersArray[i].sellerquotationId === sellerquotationId){
                            sellerDetails = sellersArray[i];
                            break;
                        }
                        else{
                            logger.error(TAG + " for loop, Invalid Inputs, Inputs doesnt match with the database records, sellerId': " + sellerId);
                            return callback(true, inputDontMatch());
                        }
                    }
                }

                //If over Ride Edit quote is true then allow to edit
                //else don't CHANGE the edit

                var editQuoteCount = sellerDetails.editQuoteCount;

                if(editQuoteCount >= 5){
                    edit = false;
                }

                var overRideEditQuoteRule = sellerDetails.overRideEditQuoteRule;
                if(overRideEditQuoteRule){
                    edit = true;
                }

                var productIds = sellerDetails.products;

                colInquiryMaster = db.collection("InquiryMaster");

                var findOneIMQuery = {
                    "inquiryEntity.inquiryId": inquiryId,
                    "inquiryEntity.inquiryVersion": inquiryVersion
                };

                colInquiryMaster.findOne(findOneIMQuery, function (IM_error, IM_result) {
                    logger.info(ip + " " + TAG + " Query in InquiryMaster.");

                    if (!IM_error && (IM_result !== null)) {

                        var ret_result = {};

                        ret_result.inquiryId = IM_result.inquiryEntity.inquiryId;
                        ret_result.inquiryVersion = IM_result.inquiryEntity.inquiryVersion;
                        ret_result.sellerId = sellerDetails.sellerId;

                        ret_result.status = IM_result.inquiryEntity.inquiryStatus;
                        ret_result.sellerStatus = sellerDetails.status;

                        ret_result.editQuote = edit;

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

                        ret_result.deliverTo = IM_result.inquiryEntity.shippingAddress;
                        //ret_result.references = IM_result.inquiryEntity.inquiryStructured.references;
                        ret_result.paymentModes = IM_result.inquiryEntity.paymentModes;
                        ret_result.creditDaysNeeded = IM_result.inquiryEntity.creditDaysNeeded;
                        ret_result.sellerquotationId = sellerDetails.sellerquotationId;

                        ret_result.sellerRemarks = sellerDetails.sellerRemarks;
                        ret_result.termsAndConditions = sellerDetails.termsAndConditions;

                        ret_result.deliveryCharges = sellerDetails.deliveryCharges;
                        ret_result.CSTCharges = sellerDetails.CSTCharges;
                        ret_result.quoteValidUpTo = sellerDetails.quoteValidUpTo;
                        ret_result.deliveryTime = sellerDetails.deliveryTime;

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

                        colQuotation = db.collection("InquiryQuotation");

                        var findQuery = {
                            "quotationEntity.inquiryId": inquiryId,
                            "quotationEntity.inquiryVersion": inquiryVersion,
                            "quotationEntity.sellerId": sellerId,
                            "quotationEntity.sellerquotationId": sellerquotationId,
                            "quotationEntity.status": status
                        };
                        logger.debug(" " + TAG + "findQuery: " + JSON.stringify(findQuery));
                        colQuotation.find(findQuery).toArray(function (q_error, q_result) {
                            logger.info(ip + " " + TAG + " Query in InquiryQuotation.");

                            if(q_error){
                                logger.error(TAG + " Fetching quotations from QuotationMaster collection failed for seller id: "+req.body.sellerId+". Error:" + q_error);
                                return callback(true, internalServerError());
                            }
                            else if(!q_error && q_result.length > 0){

                                var totalPrice = 0;
                                for (var i = 0; i < sellerProductArray.length; i++) {
                                    var quota = [];
                                    for (var j = 0; j < q_result.length; j++) {
                                        if (q_result[j].quotationEntity.productId === sellerProductArray[i].productId) {
                                            quota.push(q_result[j].quotationEntity);
                                            totalPrice += q_result[j].quotationEntity.totalPrice;
                                            //break;
                                        }
                                    }
                                    sellerProductArray[i].quotation = quota;
                                }
                                
                                ret_result.totalPrice = totalPrice;

                                colQuotationEvents = db.collection('QuotationEvents');

                                var findOneQueryQE = {
                                    "inquiryId":inquiryId,
                                    "inquiryVersion":inquiryVersion,
                                    "sellerId":sellerId
                                };
                                colQuotationEvents.find(findOneQueryQE).toArray(function (qe_error, qe_result) {
                                    if (!qe_error && (qe_result.length>0)) {
                                        for(var i = 0;i<sellerProductArray.length;i++){
                                            for(var j=0;j<qe_result.length;j++){
                                                if(qe_result[j].productId === sellerProductArray[i].productId){

                                                    for(var k = 0;k<qe_result[j].events;k++){
                                                        qe_result[j].events[k].eventAt = timeConversion.toIST(qe_result[j].events[k].eventAt);
                                                    }

                                                    sellerProductArray[i].quotationHistory = qe_result[j].events;
                                                    break;
                                                }
                                            }
                                        }

                                        ret_result.products = sellerProductArray;

                                        logger.debug(ip + " " + TAG + "QuotationEvents fetched Successfully.");
                                        return callback(false, outputResult(ret_result));

                                    }
                                    else if (!qe_error && (qe_result.length === 0)) {
                                        ret_result.products = sellerProductArray;

                                        logger.info(TAG + " QuotationEvents not found in QuotationEvents collection for input : "+req.body);
                                        return callback(false, outputResult(ret_result));
                                    }
                                    else {
                                        logger.error(TAG + " Internal Server Error. error: " + qe_error);
                                        return callback(true, internalServerError());
                                    }
                                });
                            }
                            else if(!q_error && q_result.length === 0){
                                ret_result.products = sellerProductArray;
                                ret_result.totalPrice = 0;

                                logger.info(TAG + " Quotations not found in QuotationMaster collection for sellerId id: "+sellerId);

                                logger.debug(TAG + " Inquiry Quoattions Fetched Successfully.");
                                return callback(false, outputResult(ret_result));
                            }

                        });
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
            else if (!error && (result === null)) {
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