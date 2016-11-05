/**
 * Created by Balkishan on 25-08-2016.
 */

var TAG = "supplierNotificationforExpringInquiryCron.js - ";
// The JS file is required in app.js, so that the page is loaded on start and function is invoked for the First time.
var async = require('async');
var CronJob = require('cron').CronJob;

var emailsConfig = require('../routes/helpers/emailIdConfig.js');
var env = require('../Environment/env.js').env;
var dbConfig = require('../Environment/mongoDatabase.js');
var log = require('../Environment/log4js.js');
var timezoneConversions = require('../routes/helpers/timezoneConversions.js');
var rfqNotifications = require('../routes/businesstobuilder/rfqNotifications.js');

//var supplierNotificationForExpiringInquiries = new CronJob('*/10 * * * * *', function () {
var supplierNotificationForExpiringInquiries = new CronJob('00 30 23 * * *', function () {
    console.log("Entered supplierNotificationForExpiringInquiries");

    var logger = log.logger_jobs;

    logger.debug("-------------------------------------------------------");
    logger.debug(TAG + "Node CronJob 'rfqInquiryExpireCron' started on: EST-> " + new Date() + ", IST-> " + timezoneConversions.toIST(new Date()));

    var db = dbConfig.mongoDbConn;

    var colInquiryFloat = db.collection("InquirySellerFloat");
    var notifyCol = db.collection("RfqCronJobsCounter");

    //To compare weather notification already sent.
    var notificationCurrentDate = new Date(new Date().setHours(0, 0, 0, 0));

    notifyCol.find({}).toArray(function (error, result) {
        if (error) {
            logger.error(TAG + " data access from RfqCronJobsCounter collection failed.");
            logger.info(TAG + " Node CronJob 'supplierNotificationForExpiringInquiries' stopped.");
        }
        else if (!error && result.length > 0) {
            logger.debug(TAG + " data access from RfqCronJobsCounter collection successful.");
            logger.debug(TAG + " checking weather report is already sent or not.");

            //if (true) {
            if (result[0].CronJobsCounter.rfqExpirySupplierNotification === null || result[0].CronJobsCounter.rfqExpirySupplierNotification < notificationCurrentDate) {

                logger.debug(TAG + " cron job not yet executed.");
                logger.debug(TAG + " started executing supplierNotificationCron.");
                //updating field rfqExpirySupplierNotification to keep track of weather this report is alredy sent or not.
                notifyCol.update({}, {$set: {"CronJobsCounter.rfqExpirySupplierNotification": new Date()}}, function (error, result) {
                    if(error){
                        logger.error(TAG + " error in updating rfqExpirySupplierNotification field in RfqCronJobsCounter.");
                    }
                    else{
                        logger.debug(TAG + " rfqExpirySupplierNotification field in RfqCronJobsCounter updated successfull.");
                    }
                });

                logger.debug(TAG + " fetching all records from InquirySellerFloat collection whoes inquiries expiring today.");

                var aggregateQuery = [];

                var matchExpiringTodayQuery = {
                    $match: {"inquirySellerEntity.expiringToday": true}
                };
                var unwindQuery = {
                    $unwind: "$inquirySellerEntity.sellers"
                };
                var matchSellerStatusQuery = {
                    $match: {"inquirySellerEntity.sellers.status": {$in: ["EnquirySent", "IntentToQuote"]}}
                };
                var groupQuery = {
                    $group: {
                        "_id": "$inquirySellerEntity.sellers.sellerId",
                        "sellerId": {$first: "$inquirySellerEntity.sellers.sellerId"},
                        "inquiryIds": {
                            $push: {
                                "inquiryId": "$inquirySellerEntity.inquiryId",
                                "inquiryVersion": "$inquirySellerEntity.inquiryVersion",
                                "products": "$inquirySellerEntity.sellers.products"
                            }
                        }
                    }
                };

                aggregateQuery.push(matchExpiringTodayQuery);
                aggregateQuery.push(unwindQuery);
                aggregateQuery.push(matchSellerStatusQuery);
                aggregateQuery.push(groupQuery);

                logger.debug("FLOAT QUERY : "+JSON.stringify(aggregateQuery));
                colInquiryFloat.aggregate(aggregateQuery, function (IF_error, IF_result) {
                    logger.debug(TAG + " aggregate Query for inquiry Seller float");
                    if (!IF_error && (IF_result.length > 0)) {
                        var resultsArray = [];

                        logger.debug(TAG + " fetch notification information for sellers");

                        async.forEachSeries(IF_result, function (float_result,foreachCallback){
                            var taskObject = {};

                            taskObject.InquiryMasterResults = function(asyncCallback) {

                                var IF_result = float_result;
                                var logger = log.logger_jobs;

                                var db = dbConfig.mongoDbConn;
                                var colInquiryMaster = db.collection('InquiryMaster');

                                var sellerId = IF_result.sellerId;
                                var inquiries = IF_result.inquiryIds;

                                var taskArray = [];

                                inquiries.forEach(function (element, index, array) {
                                    taskArray.push(function (callback) {
                                        var inquiryId = element.inquiryId;
                                        var inquiryVersion = element.inquiryVersion;
                                        var products = element.products;

                                        var findOneQuery = {
                                            "inquiryEntity.inquiryId":inquiryId,
                                            "inquiryEntity.inquiryVersion":inquiryVersion
                                        };

                                        //var findOneFilter = {
                                        //    "_id":0,
                                        //    "inquiryEntity.inquiryId":1,
                                        //    "inquiryEntity.inquiryVersion":1,
                                        //
                                        //    "inquiryEntity.associatedbuilderId" : 1,
                                        //    "inquiryEntity.projectSelected" : 1,
                                        //    "inquiryEntity.associatedProjectId" : 1,
                                        //    "inquiryEntity.associatedProjectType" : 1,
                                        //    "inquiryEntity.associatedProjectName" : 1,
                                        //
                                        //    "inquiryEntity.shipToProjectAddress" : 1,
                                        //    "inquiryEntity.shippingAddress" : 1,
                                        //
                                        //    "inquiryEntity.inquiryStatus" : 1,
                                        //
                                        //    "inquiryEntity.paymentModes":1,
                                        //    "inquiryEntity.creditDaysNeeded":1,
                                        //    "inquiryEntity.inquiryStructured.inquiryParams":1
                                        //};

                                        logger.debug("INQUIRY MASTER QUERY : "+JSON.stringify(findOneQuery));

                                        colInquiryMaster.findOne(findOneQuery, function (error, result) {
                                            if (!error && (result !== null)) {
                                                var outResult = {};

                                                outResult.sellerId = sellerId;
                                                outResult.inquiryId = result.inquiryEntity.inquiryId;
                                                outResult.inquiryVersion = result.inquiryEntity.inquiryVersion;
                                                //outResult.customerName = result.inquiryEntity.customerName;
                                                outResult.customerFirstName = result.inquiryEntity.customerFirstName;
                                                outResult.customerLastName = result.inquiryEntity.customerLastName;
                                                outResult.companyName = result.inquiryEntity.companyName;

                                                outResult.inquiryTimestamp = result.inquiryEntity.inquiryTimestamp;
                                                outResult.inquiryDeactivationDate = result.inquiryEntity.respondByDate;
                                                outResult.associatedbuilderId = result.inquiryEntity.associatedbuilderId;
                                                outResult.projectSelected = result.inquiryEntity.projectSelected;
                                                outResult.associatedProjectId = result.inquiryEntity.associatedProjectId;
                                                outResult.associatedProjectType = result.inquiryEntity.associatedProjectType;
                                                outResult.associatedProjectName = result.inquiryEntity.associatedProjectName;
                                                outResult.shipToProjectAddress = result.inquiryEntity.shipToProjectAddress;
                                                outResult.shippingAddress = result.inquiryEntity.shippingAddress;
                                                outResult.inquiryStatus = result.inquiryEntity.inquiryStatus;
                                                outResult.paymentModes = result.inquiryEntity.paymentModes;
                                                outResult.creditDaysNeeded = result.inquiryEntity.creditDaysNeeded;
                                                outResult.remarks = result.inquiryEntity.remarks;

                                                var inquiryProducts = result.inquiryEntity.inquiryStructured.inquiryParams;
                                                var sellerProducts = products;

                                                var sellerSubcategories = [];

                                                for(var i = 0;i<inquiryProducts.length;i++){
                                                    for(var j = 0;j<sellerProducts.length;j++){
                                                        if(sellerProducts[j].productIdentifier === inquiryProducts[i].productIdentifier){
                                                            if(sellerSubcategories.indexOf(sellerProducts[j].subCategory) === -1){
                                                                sellerSubcategories.push(inquiryProducts[i].subCategory);
                                                            }
                                                            break;
                                                        }
                                                    }
                                                }

                                                //inquiryProducts.forEach(function (inquiryProduct) {
                                                //    sellerProducts.forEach(function (sellerProduct) {
                                                //        if(sellerProduct.productIdentifier === inquiryProduct.productIdentifier){
                                                //            if(!sellerSubcategories.hasOwnProperty(sellerProduct.productIdentifier)){
                                                //                sellerSubcategories[sellerProduct.productIdentifier] = inquiryProduct.subCategory;
                                                //            }
                                                //            break;
                                                //        }
                                                //    })
                                                //});


                                                outResult.sellerSubcategories = sellerSubcategories;

                                                var finalProducts = [];
                                                for(var i = 0;i<products.length;i++){
                                                    for(var j = 0;j<inquiryProducts.length;j++){
                                                        if(products[i].productId === inquiryProducts[j].productId){
                                                            finalProducts.push(inquiryProducts[j]);
                                                            break;
                                                        }
                                                    }
                                                }

                                                outResult.products = finalProducts;
                                                //console.log(sellerId,"inq : "+JSON.stringify(outResult));
                                                return callback(false, outResult);
                                            }
                                            else if (!error && (result === null)) {
                                                logger.error(TAG + " Record Not Found in Supplier for sellerId: " + sellerId);
                                                return callback(false, {});
                                            }
                                            else {
                                                logger.error(TAG + " Error fetching supplier details from Supplier collection for sellerId: "+ sellerId +" err: " + error);
                                                return callback(false, {});
                                            }
                                        });
                                    });
                                });

                                async.parallel(taskArray, function (error,result) {

                                    if(!error)
                                    {
                                        //console.log(float_result.sellerId,"final resu : "+JSON.stringify(result));
                                        var supplierInquiries = {};
                                        supplierInquiries.sellerId = sellerId;
                                        supplierInquiries.inquiries = result;
                                        return asyncCallback(false, supplierInquiries);
                                    }
                                    else
                                    {

                                        return asyncCallback(true, result);
                                    }
                                })

                            };
                            taskObject.supplierResults = function(asyncCallback) {
                                var sellerId = float_result.sellerId;
                                var logger = log.logger_jobs;

                                var db = dbConfig.mongoDbConn;
                                var colSupplier = db.collection('SellerMaster');

                                var findOneQuery = {
                                    "sellerEntity.profileInfo.accountInfo.sellerId": sellerId,
                                    "sellerEntity.sellerVerificationStatus": {$ne : "disabled"},
                                    "sellerEntity.sellerAccessInfo.hasEnquiryAccess": true
                                };

                                var findOneFilter = {
                                    "sellerEntity.profileInfo.accountInfo.sellerId": 1,
                                    "sellerEntity.profileInfo.basicInfo": 1
                                };

                                logger.debug("SUPPLIERS QUERY : "+JSON.stringify(findOneQuery));

                                colSupplier.findOne(findOneQuery, findOneFilter, function (error, result) {
                                    if (!error && (result !== null)) {

                                        var outResult = {};
                                        outResult.sellerId = result.sellerEntity.profileInfo.accountInfo.sellerId;
                                        outResult.contactInfo = {};
                                        outResult.contactInfo["contactPerson"] = result.sellerEntity.profileInfo.basicInfo.contactPerson;
                                        outResult.contactInfo["email"] = result.sellerEntity.profileInfo.basicInfo.email;
                                        outResult.contactInfo["mobile"] = result.sellerEntity.profileInfo.basicInfo.mobile;

                                        logger.debug(TAG + "Data fetched from Supplier Collection Successfully...");
                                        return asyncCallback(false, outResult);
                                    }
                                    else if (!error && (result === null)) {
                                        logger.error(TAG + " Record Not Found in Supplier for sellerId: " + sellerId);
                                        return asyncCallback(true, "Record Not Found");
                                    }
                                    else {
                                        logger.error(TAG + " Error fetching supplier details from Supplier collection for sellerId: "+ sellerId +" err: " + error);
                                        return asyncCallback(true, "Record Not Found");
                                    }
                                });
                            };

                            async.parallel(taskObject, function (async_error, async_results) {
                                if (!async_error) {
                                    logger.debug(TAG + " Combining seller info and seller inquiries, SellerId : "+float_result.sellerId);

                                    var sellerInfo = async_results.supplierResults;
                                    var sellerInquiriesInfo = async_results.InquiryMasterResults;

                                    var outResult = {};
                                    outResult.sellerInfo = sellerInfo;
                                    outResult.sellerInquiriesInfo = sellerInquiriesInfo;

                                    sellerInquiriesInfo.inquiries.forEach(function (inquiryDetails) {
                                        rfqNotifications.notifySuppliersOnExpiringEnquiries(sellerInfo,inquiryDetails, function (noti_error, noti_result) {
                                            console.log(noti_error,noti_result);
                                        });
                                    });

                                    resultsArray.push(outResult);
                                    return foreachCallback(false, outResult);
                                }
                                else {
                                    logger.debug(TAG + " Error while Combining seller info and seller inquiries, SellerId : "+float_result.sellerId);
                                    return foreachCallback(false,{});
                                }
                            });
                        }, function (fe_error,fe_result) {
                            //console.log("re : "+JSON.stringify(fe_result));
                            if(fe_error)
                                logger.debug(TAG + " Error in the Async.forEachseries, Error"+fe_error);
                        });
                        //console.log("re : "+JSON.stringify(resultsArray));

                    }
                    else if (!IF_error && (IF_result.length === 0)) {
                        logger.debug(TAG + " No sellers whoes inquiries expiring today");
                        logger.info(TAG + " Node CronJob 'supplierNotificationForExpiringInquiries' stopped.");
                    }
                    else {
                        logger.error(TAG + " Error while fetching sellerDetails in inquirySellerFloat collection, Error :"+error);
                        logger.info(TAG + " Node CronJob 'supplierNotificationForExpiringInquiries' stopped.");
                    }
                });

            }
            else {
                logger.debug(TAG + " supplier Notification For Expiring Inquiries already sent.");
                logger.info(TAG + " Node CronJob 'supplierNotificationForExpiringInquiries' stopped.");
            }
        }
        else if(!error && result.length === 0)
        {
            logger.debug(TAG + " RfqCronJobsCounter collection empty.");
            logger.info(TAG + " Node CronJob 'supplierNotificationForExpiringInquiries' stopped.");
        }
    });
});

supplierNotificationForExpiringInquiries.start();