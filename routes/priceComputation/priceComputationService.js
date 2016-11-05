var TAG = " Product price computation - ";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var async = require('async');
var restClient = require('node-rest-client').Client;
var env = require('../../Environment/env.js').env;
var urlConstants = require('../helpers/urlConstants');
var StringDecoder = require('string_decoder').StringDecoder;
var Excel = require('exceljs');
var fs = require('fs');
var genericNotifications = require('../notification/generic_SMS_Email_Notifications.js');
var pricingConstants = require('./pricingConstants');

var preComputeProductPrice = [];
var magentoSKUs = [];
var magentoUpdateRunningCurrently = false;
var nodeBatchSize = 100;
var magentoBatchSize = 100;
var totalSkus = 0;
var processedSkus = 0;
var magentoPricingDelay = 10000;

exports.calculateMinProductPrice = function(skuIds, mainCallback){
  var logger = log.logger_productPricing;

  cronStartTime = new Date();
  logger.info(TAG + "Price pre computation started : " + cronStartTime);

  if (skuIds) {
    calculateMinPrice(skuIds.split(','), mainCallback);
  } else {

    var startTime = new Date();
    var endTime = new Date();

    // ******************only for local development*****************
    // startTime.setDate(startTime.getDate()-2);
    // endTime.setDate(endTime.getDate()-1);
    // *************************************************************

    startTime.setHours(0, 0, 0, 0);
    endTime.setHours(23, 59, 59, 999);

    // Find distinct prices modified in the given time range
    var db = dbConfig.mongoDbConn;
    db.collection('SellerProduct').distinct("sellerProductEntity.sku",{ "sellerProductEntity.isSkuActive": true, "sellerProductEntity.updationInfo.ISODate" : {'$gte': startTime, '$lte': endTime} },function(err, result){
      if (err) {
        mainCallback(err);
        logger.error(TAG + "Error retriving distinct skus. ERROR : \n" + err.stack);
      } else {
        if (result.length > 0) {
          calculateMinPrice(result, mainCallback);
        } else {
          mainCallback(false,{"message" : "No skus found"});
          logger.info(TAG + "No skus found");
        }
      }
  });
}
}

//Computes and updates the min prices for the given skus
function calculateMinPrice(skuIds, mainCallback){
  var logger = log.logger_productPricing;
  totalSkus = skuIds.length;
  logger.info(TAG + "Calculating price for " + skuIds.length + " skus.");
  logger.info(TAG + "calculating min price in batches of " + nodeBatchSize);


  async.whilst(
    function () { return skuIds.length; },
    function (callback) {

      var currentSkus = skuIds.splice(0, nodeBatchSize);


      // logger.info(TAG + "Calculating min price for skus : \n" + skuIds);

      // Find min price for all the skus
      var db = dbConfig.mongoDbConn;
      db.collection('SellerProduct').aggregate(
        [
          {$match:{"sellerProductEntity.sku" : {$in : currentSkus}, "sellerProductEntity.isSkuActive": true}},
          {$group:{ _id:{"sku" : "$sellerProductEntity.sku"} ,minPrice: { $min: "$sellerProductEntity.refPrice" }}},
        ],
        {
          'allowDiskUse': true,
          'cursor': {'batchSize': 100 }
        }
      ).toArray(function(err, result){
        if (err) {
          mainCallback(err);
          logger.error(TAG + "Error calculating minimum price. ERROR : \n" + err.stack);
        } else {
          if (result.length > 0) {
              var sellerProducts = [];
              //Get seller and city for the min price sku
              async.each(result, function(product, asyncCallback){
                db.collection('SellerProduct').findOne({'sellerProductEntity.sku' : product._id.sku, 'sellerProductEntity.refPrice' : product.minPrice}, {'_id':0, 'sellerProductEntity.sku':1, 'sellerProductEntity.sellerOperatingInfo.location.city':1, 'sellerProductEntity.sellerOperatingInfo.id':1, "sellerProductEntity.offer":1},function(err, result){
                  if (err) {
                    asyncCallback(err);
                  } else {
                    result.minPrice = product.minPrice;
                    sellerProducts.push(result);
                    asyncCallback();
                  }
                });
              }, function(err){
                if (err) {
                  mainCallback(err);
                  logger.error(TAG + "Error retriving details of min skus product. ERROR : \n" + err.stack);
                } else {
                  //Get product MRP for the particular city
                  async.each(sellerProducts,function(product, asyncCallback){
                    db.collection('ProductPrice').aggregate(
                      [
                        {$match:{"productPriceEntity.sku" : product.sellerProductEntity.sku, "productPriceEntity.location.city": product.sellerProductEntity.sellerOperatingInfo.location[0].city}},
                        // {$unwind: '$productPriceEntity.listing' },
                        // {$match:{"productPriceEntity.listing.type" : 'standard'}},
                        {$group:{ _id:{"sku" : "$productPriceEntity.sku"} ,maxPrice: { $max: "$productPriceEntity.refPrice" }}},
                      ],
                      {
                        'allowDiskUse': true,
                        'cursor': {'batchSize': 100 }
                      }
                    ).toArray(function(err, result){
                      if (err) {
                        asyncCallback(err);
                      } else {
                        if (result.length > 0) {
                          preComputeProductPrice.push(new preComputePrice(
                            product.sellerProductEntity.sku,
                            product.sellerProductEntity.sellerOperatingInfo.id,
                            product.minPrice,
                            product.sellerProductEntity.sellerOperatingInfo.location[0].city,
                            product.sellerProductEntity.offer.find(findStandardOffer).unit,
                            product.sellerProductEntity.offer.find(findMerchandiseOffer).priceInclTax,
                            product.sellerProductEntity.offer.find(findMerchandiseOffer).unit,
                            result[0].maxPrice,
                            product.sellerProductEntity.sellerOperatingInfo.location[0].city
                            // sku, seller, minPrice, minPriceCity, minPriceUnit, merchandisePrice, merchandisePriceUnit, productPrice, productPriceCity
                          ));
                          asyncCallback();
                        } else {
                          //Get product MRP pan india in case city MRP is not found.
                          db.collection('ProductPrice').aggregate(
                            [
                              {$match:{"productPriceEntity.sku" : product.sellerProductEntity.sku, "productPriceEntity.location.city": ""}},
                              // {$unwind: '$productPriceEntity.listing' },
                              // {$match:{"productPriceEntity.listing.type" : 'standard'}},
                              {$group:{ _id:{"sku" : "$productPriceEntity.sku"} ,maxPrice: { $max: "$productPriceEntity.refPrice" }}},
                            ],
                            {
                              'allowDiskUse': true,
                              'cursor': {'batchSize': 100 }
                            }
                          ).toArray(function(err, result){
                            if (err) {
                              asyncCallback(err);
                            } else {
                              if (result.length > 0) {
                                preComputeProductPrice.push(new preComputePrice(
                                  product.sellerProductEntity.sku,
                                  product.sellerProductEntity.sellerOperatingInfo.id,
                                  product.minPrice,
                                  product.sellerProductEntity.sellerOperatingInfo.location[0].city,
                                  product.sellerProductEntity.offer.find(findStandardOffer).unit,
                                  product.sellerProductEntity.offer.find(findMerchandiseOffer).priceInclTax,
                                  product.sellerProductEntity.offer.find(findMerchandiseOffer).unit,
                                  result[0].maxPrice,
                                  ""
                                ));
                                asyncCallback();
                              } else {
                                preComputeProductPrice.push(new preComputePrice(
                                  product.sellerProductEntity.sku,
                                  product.sellerProductEntity.sellerOperatingInfo.id,
                                  product.minPrice,
                                  product.sellerProductEntity.sellerOperatingInfo.location[0].city,
                                  product.sellerProductEntity.offer.find(findStandardOffer).unit,
                                  product.sellerProductEntity.offer.find(findMerchandiseOffer).priceInclTax,
                                  product.sellerProductEntity.offer.find(findMerchandiseOffer).unit,
                                  0,
                                  ""
                                ));
                                asyncCallback();
                              }
                            }
                          });
                        }
                      }
                    });


                  }, function(err){
                    if (err) {
                      mainCallback(err);
                      logger.error(TAG + "Error retriving product MRP. ERROR : \n" + err.stack);
                    } else {
                      logger.info(TAG + "Finished batch. Remaining : " + skuIds.length);

                      // Execute batch
                      //Creating batch update for precomputed prices.
                      var batch = db.collection('ProductPrecomputedPrice').initializeUnorderedBulkOp();

                      preComputeProductPrice.forEach(function(element){
                        batch.find({sku : element.sku}).upsert().updateOne({$set: element});
                      });

                      batch.execute(function(err, result) {
                        if (err) {
                          logger.error(TAG + "Error performing batch update. ERROR : \n" + err.stack);
                        } else {
                          var stat = {
                            "inserted" : result.nInserted,
                            "upserted" : result.nUpserted,
                            "modified" : result.nModified,
                            "matched" : result.nMatched
                          }


                          preComputeProductPrice.forEach(function(element){
                            magentoSKUs.push({
                              "sku": element.sku,
                              "price": element.productPrice,
                              "special_price": element.minPrice,
                              "price_sqft":element.merchandisePrice
                            });


                          });

                          updateMagento();
                          preComputeProductPrice = [];
                          callback(false);
                          logger.info(TAG + "Price update completed successfully. Stat : " + JSON.stringify(stat));
                        }
                      });
                      // callback();

                    }
                  });
                }
              });

          } else {
            callback(false);
          }
        }
      });

    },
    function (err, n) {


      mainCallback(err,{'message':'cron complete'});

      var cronStopTime = new Date();
      logger.info(TAG + "Price pre computation Complete : " + cronStopTime);
      logger.info(TAG + "Price pre computation total time taken : " + (cronStopTime - cronStartTime) + " ms");




    }
);


}



function preComputePrice(sku, seller, minPrice, minPriceCity, minPriceUnit, merchandisePrice, merchandisePriceUnit, productPrice, productPriceCity){
   this.sku = sku,
   this.seller = seller,
   this.minPrice = minPrice,
   this.minPriceCity = minPriceCity,
   this.minPriceUnit = minPriceUnit,
   this.merchandisePrice = merchandisePrice,
   this.merchandisePriceUnit = merchandisePriceUnit,
   this.productPrice = productPrice,
   this.productPriceCity = productPriceCity
}

function findStandardOffer(offer){
  return offer.type == 'standard';
}

function findMerchandiseOffer(offer){
  return offer.type == 'merchandise';
}


function updateMagento(){
  var logger = log.logger_productPricing;
  // console.log(magentoUpdateRunningCurrently);
  if (magentoSKUs.length && !magentoUpdateRunningCurrently) {
    magentoUpdateRunningCurrently = true;
  // Making call to magento service
  magentoStartTime = new Date();
  logger.info(TAG + "Magento upload started : " + magentoStartTime);

    var client = new restClient();

    // var uploadSuccessResults = [];
    // var uploadFailureResults = [];
    var failedSkuLog = [];

    async.whilst(
        function () { return magentoSKUs.length; },
        function (callback) {
          logger.info(TAG + "Waiting for " + (magentoPricingDelay / 1000) + " seconds before making magento service call.");
          setTimeout(function(){

                var currentSkus = magentoSKUs.splice(0, magentoBatchSize);
                var args = {
                  data: {
                    "method": "updatePrice",
                    "Authtoken": "d$J2?cKnzuNze9W",
                    "sku": currentSkus
                  }
                };
                logger.info(TAG + "Calling magento service in batchSize :  " + magentoBatchSize);
                // console.log(JSON.stringify(args));

                var req = client.post(urlConstants.getMagentoURL(env), args, function (data, response) {
                  try {
                    if (response.statusCode == 200) {
                      var magentoresp = JSON.parse(data.toString('utf8'));
                      if (magentoresp.status == 'success') {
                        failedSkuLog = failedSkuLog.concat(magentoresp.FailedSkuErrorLog);
                        // uploadSuccessResults.push(" Price updated successfully to magento. Message : " + magentoresp.message + " FailedSku: " + magentoresp.FailedSku);
                        logger.info(TAG + "Price update completed successfully on magento. Message : " + magentoresp.message + " FailedSku: " + magentoresp.FailedSku + " FailedSkuErrorLog: " + JSON.stringify(magentoresp.FailedSkuErrorLog));
                      }
                      // else if (magentoresp.status == 'failed') {
                      //   uploadFailureResults.push("Price update FAILED on magento. Message : " + magentoresp.message + " FailedSku: " + magentoresp.FailedSku + " FailedSkuErrorLog: " + JSON.stringify(magentoresp.FailedSkuErrorLog));
                      //   logger.info(TAG + "Price update FAILED on magento. Message : " + magentoresp.message);
                      // }
                    } else {
                      logger.info(TAG + "http_code : " + response.statusCode  + " Price update FAILED with MAGENTO ERROR. Input : \n" + JSON.stringify(args.data));
                      var failedSkuErrorLog = {};
                      args.data.sku.forEach(function(element){
                        failedSkuErrorLog[element.sku] = ["Price update failed with magento error code : " + response.statusCode];
                      });
                      failedSkuLog = failedSkuLog.concat(failedSkuErrorLog);
                    }
                    processedSkus += magentoBatchSize;
                    callback(false);
                  } catch (e) {
                    callback(false);
                    processedSkus += magentoBatchSize;
                    logger.error('Pricing cron error');
                    logger.error('Response Received : ' + data.toString('utf8'));
                    logger.error(e);
                  } finally {
                    logger.info(TAG + "Finished batch for magento. Remaining : " + magentoSKUs.length);
                  }

                });

                // req.on('error', function (err) {
                //   // console.log('request error', err);
                //   // uploadFailureResults.push("Price update failed on  magento. Error : " + JSON.stringify(err));
                //   logger.error(TAG + "Price update failed on  magento. Error : " + err);
                //   callback(false);
                // });

          }, magentoPricingDelay);
        },
        function (err) {
          var uploadResult = {
              // "SuccessReport" : uploadSuccessResults,
              // "FailureReport" : uploadFailureResults,
              "FailedSKUs" : failedSkuLog
          };

          // processedSkus += magentoBatchSize;
          logger.info(TAG + "processedSkus : " + processedSkus);
          logger.info(TAG + "totalSkus : " + totalSkus);

          if (processedSkus >= totalSkus) {
            logger.info(TAG + " Price update report. \n", JSON.stringify(uploadResult));
            sendFailedSkuNotification(uploadResult);
          }

          var magentoStopTime = new Date();
          logger.info(TAG + "Magento upload complete : " + magentoStopTime);
          logger.info(TAG + "Magento time taken : " + (magentoStopTime - magentoStartTime) + " ms");
          magentoUpdateRunningCurrently = false;
        }
    );
    // magentoUpdateRunningCurrently = false;
  }

}


function sendFailedSkuNotification(uploadResult){
  var logger = log.logger_productPricing;
  try {
    if (uploadResult.FailedSKUs.length > 0) {

      var workbook = new Excel.Workbook();

      workbook.creator = 'System';
      workbook.lastModifiedBy = 'System';
      workbook.created = new Date();
      workbook.modified = new Date();

      var sheet = workbook.addWorksheet('Failed SKUs');

      sheet.columns = [
        { header: 'SKU', key: 'sku', width: 15 },
        { header: 'Failure Reason', key: 'reason', width: 100 },
      ];

      uploadResult.FailedSKUs.forEach(function(element){
        for (var property in element) {
          if (element.hasOwnProperty(property)) {
              sheet.addRow({sku: property, reason: element[property][0]});
          }
        }
      });

      var filename = "/usr/NodeJslogs/temp/FailedSkuReport - " + new Date() + ".xlsx";


      workbook.xlsx.writeFile(filename)
      .then(function() {
        logger.info(TAG + 'Failed sku report generation completed.');
        //sending mail
        var attachment = [];
        attachment.push({data: pricingConstants.emailBodyPricingCronFailedSku.replace('$skus', totalSkus), alternative:true});
        attachment.push({path: filename, type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", name:filename.split('/')[4]});
        var ccEmails = "";
        var bccEmails = "";
        genericNotifications.sendEmailwithAttachment(pricingConstants.fromEmail, pricingConstants.getNotificationEmails(env), ccEmails, bccEmails, pricingConstants.emailsubjectPricingCronFailedSku + new Date(), attachment, function(error, result){
          if(error)
          {
            logger.error(TAG + "Error- Failed to send email for failed sku report." );
            // logger.error(TAG + "Error sending emails for new user registration to "+ req.body.email + ", Error: " + error);
          }
          else
          {
            logger.info(TAG + "Failed sku report sent successfully.");
          }
          fs.unlinkSync(filename);
          totalSkus = 0;
          processedSkus =0;
        });


        // res.statusCode = 200;
        // res.download(filename, function(){
        //   logger.info(TAG + 'CustomerOrderReport Report sent.');
        //   fs.unlinkSync(filename);
        // });
      });


    } else {

    }
  } catch (e) {
    logger.error('Error in failed sku report creation : ' + e.stack);
  } finally {

  }

};
