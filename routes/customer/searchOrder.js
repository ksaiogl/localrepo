//@author Soumya Bardhan
//File that contains buisness logic for viewing customer order.
var TAG = "--- View Customer Order List---    ";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var async = require('async');
var timeConversion = require('../helpers/timezoneConversions.js');
var supplierDetails = require('../supplier/supplierDetails.js');
var request = require("request");
// var host_detail = require('../../Environment/hostDetails.js');
var urlConstants = require('../helpers/urlConstants');
var restClient = require('node-rest-client').Client;
var client = new restClient();
var env = require('../../Environment/env.js').env;

var searchOrderList = function (req, callback) {
  var logger = log.logger_OMS;

  var itemsPerPage = parseInt(req.query.itemsPerPage);
  var pageNumber =  parseInt(req.query.page);

  if (req.query.search && req.query.itemsPerPage && req.query.page) {
    var searchQuery = req.query.search;

    var query = {};

    // incase the search query in number
    if (isNaN(parseInt(searchQuery))) {
      var splits = searchQuery.split(' ');
      if (splits.length > 1) {
        query["$or"] = [
          {
            "orderEntity.orderInfo.customerInfo.customerFirstname" : {'$in' : [new RegExp(splits[0].replace(/\s/g, '.*').replace(/\(/g, '\\(').replace(/\)/g, '\\)'), 'i')]}
          },
          {
            "orderEntity.orderInfo.customerInfo.customerLastname" : {'$in' : [new RegExp(splits[1].replace(/\s/g, '.*').replace(/\(/g, '\\(').replace(/\)/g, '\\)'), 'i')]}
          }
        ];
      } else {
        query["$or"] = [
          {
            "orderEntity.orderInfo.customerInfo.customerFirstname" : {'$in' : [new RegExp(searchQuery.replace(/\s/g, '.*').replace(/\(/g, '\\(').replace(/\)/g, '\\)'), 'i')]}
          },
          {
            "orderEntity.orderInfo.customerInfo.customerLastname" : {'$in' : [new RegExp(searchQuery.replace(/\s/g, '.*').replace(/\(/g, '\\(').replace(/\)/g, '\\)'), 'i')]}
          }
        ];
      }

    } else {
      query["orderEntity.orderInfo.orderNumber"] = {'$in' : [new RegExp(searchQuery.replace(/\s/g, '.*').replace(/\(/g, '\\(').replace(/\)/g, '\\)'))]};
    }

    var db = dbConfig.mongoDbConn;

    var projection = {
      "_id":0,
      "orderEntity.orderInfo.orderNumber":1,
      "orderEntity.orderInfo.orderDate":1,
      "orderEntity.orderInfo.orderStatus":1,
      "orderEntity.orderInfo.sellerInfo":1,
      "orderEntity.orderInfo.orderType":1,
      "orderEntity.orderInfo.orderTotals":1,
      "orderEntity.orderInfo.orderPlatform":1,
      "orderEntity.orderInfo.customerInfo":1,
      // "orderEntity.paymentInfo":1
    };

    db.collection('Orders').find(query, projection).limit((pageNumber + 1) * itemsPerPage).sort({"orderEntity.orderInfo.orderNumber":-1}).toArray(function(err, results){
      if (err) {
        resJson = {
          "http_code": 500,
          "message": "Error - Search Order Failed. Please contact engineering team."
        };
        callback(true,resJson);
        logger.error(TAG + "Error in view Search. ERROR : \n" + err.stack);
      } else {

        db.collection('Orders').find(query).count(function(err, count){
          if (err) {
            resJson = {
              "http_code": 500,
              "message": "Error - search Order count Failed. Please contact engineering team."
            };
            callback(true,resJson);
            logger.error(TAG + "Error in view order. ERROR : \n" + err.stack);
          } else {
            // outputJSON.orderCount = count;
            resJson = {
              "http_code": 200,
              "message": results.slice(pageNumber * itemsPerPage),
              "orderCount" : count
            };
            callback(false,resJson);

          }
        });

      }
    });


  } else {
    resJson = {
      "http_code": 400,
      "message": "Search, itemsPerPage, page param is mandatory."
    };
    callback(false,resJson);
    logger.error(TAG + " ERROR : " + resJson.message);
  }

}

exports.searchOrderList = searchOrderList;
