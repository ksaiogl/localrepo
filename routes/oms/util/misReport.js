var mysql =  require('mysql');
var env = require('../../Environment/env.js').env;
var utilConstants = require('./utilConstants');
var dbConfig = require('../../Environment/mongoDatabase.js');
var async = require('async');

var pool = mysql.createPool(utilConstants.getMysqlPoolConfig(env));


exports.getMisReport = function(req, res){

  var all_sku = {};
  var active_sku = {};
  var brands = {};
  var category_sku = {};
  var category_sku_count = {};
  var final_report = [];

  pool.getConnection(function(err,connection){

    if (err) {
      // console.log(err.stack);
      // connection.release();
      res.json({"code" : 500, "status" : "Error in connection database"});
      return;
    }

    // console.log('connected as id ' + connection.threadId);

    async.series([
      function(asyncCallback){
        // get all skus
        connection.query(utilConstants.allSkus,function(err,rows){
          if(!err) {
            rows.forEach(function(element){
              if (all_sku[element.ParentCategory]) {
                all_sku[element.ParentCategory] = element.SKU;
              } else {
                all_sku[element.ParentCategory] = element.SKU;
              }
            });
          }
          asyncCallback(null);
        });
      },
      function(asyncCallback){
        // get active skus
        connection.query(utilConstants.activeSkus,function(err,rows){
          if(!err) {
            rows.forEach(function(element){
              if (active_sku[element.ParentCategory]) {
                active_sku[element.ParentCategory] = element.SKU;
              } else {
                active_sku[element.ParentCategory] = element.SKU;
              }
            });
          }
          asyncCallback(null);
        });
      },
      function(asyncCallback){
        // get brands
        connection.query(utilConstants.brand,function(err,rows){
          if(!err) {
            rows.forEach(function(element){
              if (brands[element.ParentCategory]) {
                brands[element.ParentCategory] = element.Brand;
              } else {
                brands[element.ParentCategory] = element.Brand;
              }
            });
          }
          asyncCallback(null);
        });
      },
      function(asyncCallback){
        // get category skus
        connection.query(utilConstants.categorySkuQuery,function(err,rows){
          if(!err) {
            rows.forEach(function(element){
              if (category_sku[element.ParentCategory]) {
                category_sku[element.ParentCategory].push(element.SKU);
              } else {
                category_sku[element.ParentCategory] = [];
                category_sku[element.ParentCategory].push(element.SKU);
              }
            });
          }
          asyncCallback(null);
        });

      }
    ],
    function(err, results){
      connection.release();
      // var db = dbConfig.mongoDbConn;
      if (err) {
        res.status = 500;
        res.json({'http_code':500, 'error': err.stack});
      } else {

        for (var property in all_sku) {
          if (all_sku.hasOwnProperty(property))
          {
            final_report.push(
              {
                "category" : property,
                "all_sku" : all_sku[property],
                "active_sku" : active_sku[property],
                "brands" : brands[property],
                "skus" : category_sku[property]
              }
            );
          }
        }

        res.status = 200;
        res.json(final_report);
      }

    });

    connection.on('error', function(err) {
      res.json({"code" : 500, "status" : "Error in connection database"});
      return;
    });
  });

}
