//This file will create the final report for generateCustomerOrderReport

var TAG = " MIS Report` - ";
// var log = require('../../Environment/log4js.js');
var restClient = require('node-rest-client').Client;
var env = require('../../../Environment/env.js').env;
var urlConstants = require('../../helpers/urlConstants');
var dbConfig = require('../../../Environment/mongoDatabase.js');
var Excel = require('exceljs');
var fs = require('fs');
var log = require('../../../Environment/log4js.js');
var timeConversion = require('../../helpers/timezoneConversions.js');

exports.generateCustomerOrderReport = function(req, res){
  var logger = log.logger_util;
  if (req.query.fromDate && req.query.toDate) {
    logger.info(TAG + 'Costomer Order report generation started.');

    var client = new restClient();
    var db = dbConfig.mongoDbConn;

    // logger.info(TAG + 'Calling Magento data service');
    var fromDate = req.query.fromDate;
    var toDate = req.query.toDate;

    var frmDate = new Date(fromDate);
    var toDate = new Date(toDate);

    frmDate = timeConversion.toIST(frmDate);
    toDate = timeConversion.toIST(toDate);

    frmDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);

    frmDate = timeConversion.toUTC(frmDate);
    toDate = timeConversion.toUTC(toDate);

    // frmDate.setHours(0, 0, 0, 0);
    // toDate.setHours(23, 59, 59, 999);

    // var queryObject["orderEntity.orderInfo.orderDate"] = {"$gte": frmDate,"$lte": toDate};

    var db = dbConfig.mongoDbConn;
    //.skip(pageNumber * itemsPerPage)
    db.collection('Orders').find({"orderEntity.orderInfo.orderDate" : {"$gte": frmDate,"$lte" : toDate} },
     {
       "_id":0,"orderEntity.orderInfo.orderNumber":1,
       "orderEntity.orderInfo.orderDate" : 1,
       "orderEntity.orderInfo.customerInfo":1, "orderEntity.orderInfo.orderPlatform":1}).sort({"orderEntity.orderInfo.orderNumber":-1}).toArray(function(err, results){
      if (err) {
        res.status = 500;
        res.json({'http_code':500, 'error': err.stack});
        logger.error(TAG + 'Error retriving data from mongo. ERROR : \n' + err.stack);
      } else {
        var workbook = new Excel.Workbook();

        workbook.creator = 'System';
        workbook.lastModifiedBy = 'System';
        workbook.created = new Date();
        workbook.modified = new Date();

        var sheet = workbook.addWorksheet('CustomerOrder Data');

        sheet.columns = [
          { header: 'Order No', key: 'orderId', width: 15 },
          { header: 'Order Platform', key: 'platform', width: 15 },
          { header: 'Order Date', key: 'orderDate', width: 13 },
          { header: 'Customer Id', key: 'custId', width: 12 },
          { header: 'Customer Name', key: 'name', width: 25 },
          { header: 'Mobile', key: 'mobile', width: 20 },
          { header: 'Email', key: 'email', width: 40 },
          { header: 'Persona', key: 'persona', width: 15 },
          { header: 'Segment', key: 'segment', width: 15 }
        ];

        results.forEach(function(order){
          var row = {
            orderId: order.orderEntity.orderInfo.orderNumber,
            platform: order.orderEntity.orderInfo.orderPlatform,
            orderDate: timeConversion.toIST(order.orderEntity.orderInfo.orderDate),
            custId: order.orderEntity.orderInfo.customerInfo.customerId,
            name: order.orderEntity.orderInfo.customerInfo.customerFirstname + ' ' + order.orderEntity.orderInfo.customerInfo.customerLastname,
            mobile: order.orderEntity.orderInfo.customerInfo.customerMobile,
            email: order.orderEntity.orderInfo.customerInfo.customerEmail,
            persona: order.orderEntity.orderInfo.customerInfo.primaryPersona,
            segment: order.orderEntity.orderInfo.customerInfo.segment
          };
          sheet.addRow(row);
        });

        var filename = "/usr/NodeJslogs/temp/CustomerOrderReport - " + new Date() + ".xlsx";

        logger.info(TAG + 'CustomerOrderReport Report generation completed.');
        workbook.xlsx.writeFile(filename)
        .then(function() {
          res.statusCode = 200;
          res.download(filename, function(){
            logger.info(TAG + 'CustomerOrderReport Report sent.');
            fs.unlinkSync(filename);
          });
        });

      }
    });
  } else {
    res.status = 400;
    res.json({'http_code':400, 'message': 'fromDate & toDate is mandatory'});
    logger.error(TAG + 'fromDate & toDate is mandatory.');
  }

}
