//This file will create the final report from calling the MIS sercice

var TAG = " MIS Report` - ";
// var log = require('../../Environment/log4js.js');
var restClient = require('node-rest-client').Client;
var env = require('../../../Environment/env.js').env;
var urlConstants = require('../../helpers/urlConstants');
var dbConfig = require('../../../Environment/mongoDatabase.js');
var Excel = require('exceljs');
var async = require('async');
var fs = require('fs');
var log = require('../../../Environment/log4js.js');
var city = require('./city');

exports.generateMisReport = function(req, res){
  var logger = log.logger_util;

  logger.info(TAG + 'MIS Reporting generation started.');

  var client = new restClient();
  var db = dbConfig.mongoDbConn;

  logger.info(TAG + 'Calling Magento data service');

  client.get(urlConstants.getMisUrl(env), function (data, response) {
    logger.info(TAG + 'Response received : ' + response.statusCode);
      if (response.statusCode == 200) {

        var workbook = new Excel.Workbook();

        workbook.creator = 'System';
        workbook.lastModifiedBy = 'System';
        workbook.created = new Date();
        workbook.modified = new Date();

        var sheet = workbook.addWorksheet('MIS Data');

        async.forEachOfSeries(data,
          function(item, key, asyncCallback){
            db.collection('SellerProduct').aggregate(
              [
                {$match:{"sellerProductEntity.sku" : {$in : item.skus}}},
                {$group: { _id: null, sellers: { $addToSet: "$sellerProductEntity.sellerOperatingInfo.id" } } }
              ],
              {
                'allowDiskUse': true,
                'cursor': {'batchSize': 100 }
              }
            ).toArray(function(err, result){
              // logger.error("Item : " + item.category);
              // logger.error("Item sku Length : " + item.skus.length);
              // logger.error("Result : " + JSON.stringify(result));
              try {
                  if (err) {
                    asyncCallback(err);
                  } else {
                    item.seller = result[0] ? result[0].sellers.length : 0;
                    //Getting sku per city
                    db.collection('SellerProduct').aggregate(
                      [
                        {$match:{"sellerProductEntity.sku" : {$in : item.skus}}},
                        {$project: {"sellerProductEntity.sellerOperatingInfo.location":1,"sellerProductEntity.sku":1,"_id":0}},
                        {$unwind: "$sellerProductEntity.sellerOperatingInfo.location"},
                        {$group: {_id:"$sellerProductEntity.sellerOperatingInfo.location.city", skus: { $addToSet: "$sellerProductEntity.sku" }}}
                      ],
                      {
                        'allowDiskUse': true,
                        'cursor': {'batchSize': 100 }
                      }
                    ).toArray(function(err, result){
                      if (err) {
                        asyncCallback(err);
                      } else {
                        item.city = {};
                        result.forEach(function(element){
                          item.city[element._id] = element.skus.length ? element.skus.length : 0;
                        });
                        asyncCallback();
                      }
                    });

                  }
              } catch (e) {
                resJson = {
                    "http_code": 500,
                    "Message" : "Error from MIS service"
                };
                res.statusCode = 500;
                res.json(resJson);
                logger.error(TAG + 'Error from MIS service. ERROR : \n' + e.stack);
              }
            });
          },
          function(err){
            if (err) {
              res.status = 500;
              res.json({'http_code':500, 'error': err.stack});
              logger.error(TAG + 'Error retriving data from mongo. ERROR : \n' + err.stack);
            } else {
              city.getCity(null, function(err, resJson){

                if (err) {
                  res.statusCode = resJson.http_code;
                  res.json(resJson);
                } else {
                  var  sheetColumns = [
                    { header: 'Category', key: 'category', width: 20 },
                    { header: 'Total SKUs', key: 'totalSku', width: 15 },
                    { header: 'Active SKUs', key: 'activeSku', width: 20 },
                    { header: 'Seller', key: 'seller', width: 15 },
                    { header: 'Brand', key: 'brand', width: 15 }
                  ];
                  resJson.message.forEach(function(element){
                    sheetColumns.push({ header: element.city, key: element.cityCodeNumeric, width: 15 });
                  });
                  sheet.columns = sheetColumns;

                  data.forEach(function(element){
                    var row = {
                      category: element.category,
                      totalSku: element.all_sku,
                      activeSku: element.active_sku,
                      seller: element.seller,
                      brand: element.brands
                    };

                    for (var city in element.city) {
                      if (element.city.hasOwnProperty(city)) {
                        row[city] = element.city[city];
                      }
                    }
                    sheet.addRow(row);
                  });

                  var filename = "/usr/NodeJslogs/temp/MISReport - " + new Date() + ".xlsx";

                  logger.info(TAG + 'MIS Report generation completed.');
                  workbook.xlsx.writeFile(filename)
                      .then(function() {
                        res.statusCode = 200;
                        res.download(filename, function(){
                          logger.info(TAG + 'MIS Report sent.');
                          fs.unlinkSync(filename);
                        });
                      });
                }

              });
            }
        });
      } else {
        resJson = {
            "http_code": response.statusCode,
            "Message" : "Error from MIS service"
        };
        res.statusCode = 500;
        res.json(resJson);
      }
    });
}

// function findCityName(cityCode, cities){
//   var returnObj;
//   cities.forEach(function(element){
//     if (element.cityCodeNumeric == cityCode) {
//       returnObj = element.city;
//     }
//   });
//   return returnObj;
// }
