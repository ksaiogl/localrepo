var TAG = "inquiryDetailsForFloat.js - ";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');

exports.inquiryDetailsForSupplierFloat = function inquiryDetails(req, callback) {
    var resJson;

    //Get the IP Address of the client.
    var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;

    //Variable for Mongo DB Connection.
    var db = dbConfig.mongoDbConn;

    //Variable for Logging the messages to the file.
    var logger = log.logger_rfq;

    logger.info(ip + " " + TAG + " Entering inquiryDetailsForSupplierFloat.");

    //Log the request.
    logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));


    if (!(req.body === null ||
        req.body.inquiryId === undefined ||
        req.body.inquiryId === null ||
        req.body.inquiryId.toString().trim().length === 0 ||
        req.body.inquiryVersion === undefined ||
        req.body.inquiryVersion === null ||
        req.body.inquiryVersion.toString().trim().length === 0)) {

        var inquiryId = req.body.inquiryId;
        var inquiryVersion = req.body.inquiryVersion;

        var query = [];
        query.push({
            "$match": {
                "inquiryEntity.inquiryId": inquiryId,
                "inquiryEntity.inquiryVersion": inquiryVersion
            }
        });

        query.push({
            "$unwind": "$inquiryEntity.inquiryStructured.inquiryParams"
        });

        query.push(
            {
                "$group": {
                    "_id": {
                        "brand": "$inquiryEntity.inquiryStructured.inquiryParams.brand",
                        "subCategory": "$inquiryEntity.inquiryStructured.inquiryParams.subCategory",
                        "manufacturer": "$inquiryEntity.inquiryStructured.inquiryParams.manufacturer"
                    },
                    "inquiryId": {"$first": "$inquiryEntity.inquiryId"},
                    "inquiryVersion": {"$first": "$inquiryEntity.inquiryVersion"},
                    "brand": {"$first": "$inquiryEntity.inquiryStructured.inquiryParams.brand"},
                    "manufacturer": {"$first": "$inquiryEntity.inquiryStructured.inquiryParams.manufacturer"},
                    "subCategory": {"$first": "$inquiryEntity.inquiryStructured.inquiryParams.subCategory"},
                    "productIdentifier": {"$addToSet": "$inquiryEntity.inquiryStructured.inquiryParams.productIdentifier"},
                    "productId": {"$addToSet": "$inquiryEntity.inquiryStructured.inquiryParams.productId"},
                    "productName": {"$addToSet": "$inquiryEntity.inquiryStructured.inquiryParams.productName"},
                    "products": {
                        "$addToSet": {
                            "productId": "$inquiryEntity.inquiryStructured.inquiryParams.productId",
                            "productIdentifier": "$inquiryEntity.inquiryStructured.inquiryParams.productIdentifier",
                            "productName": "$inquiryEntity.inquiryStructured.inquiryParams.productName",
                        }
                    }
                }
            }
        );

        /*query.push(
         {
         "$project": {
         "_id": 0,
         "brand": 1,
         "subCategory": 1,
         "manufacturer": 1,
         "items": 1
         }
         }
         );*/

        InquiryMaster = db.collection("InquiryMaster");
        logger.debug(ip + " " + TAG + "query: " + JSON.stringify(query));
        InquiryMaster.aggregate(query, function (error, result) {

            if (!error && result.length > 0) {
                var finalObj = {};
                finalObj.inquiryId = result[0].inquiryId;
                finalObj.inquiryVersion = result[0].inquiryVersion;

                var finalResult = [];

                for (var i = 0; i < result.length; i++) {
                    var eachResult = {};
                    eachResult.brand = result[i].brand;
                    eachResult.manufacturer = result[i].manufacturer;
                    eachResult.subCategory = result[i].subCategory;
                    eachResult.products = result[i].products;
                    finalResult.push(eachResult);
                }

                finalObj.floatToSupplier = finalResult;

                logger.debug(ip + " " + TAG + "inquiryDetailsForSupplierFloat details successfully fetched.");
                return callback(false, outputResult(finalObj));
            }
            else if (!error && result.length < 1) {
                logger.error(ip + " " + TAG + "The inputs does not match with our records. " + JSON.stringify(result));
                logger.error(TAG + " Invalid Inputs, Inputs doesnt match with the database records, inquiryId: " + req.body.inquiryId + ", inquiryVersion: " + req.body.inquiryVersion);
                return callback(true, inputDontMatch());
            }
            else {
                logger.error(ip + " " + TAG + " cannot update project. Error: " + JSON.stringify(error));
                return callback(true, internalServerError());
            }
        })
    }
    else {
        resJson = {
            "http_code": "400",
            "message": "Bad or ill-formed request.."
        };
        logger.error(ip + " " + TAG + " " + JSON.stringify(resJson));
        return callback(true, resJson);
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