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

exports.generateNewSupplierReport = function(req, res){
  var logger = log.logger_util;
  if (req.query.fromDate && req.query.toDate) {
    logger.info(TAG + 'New Supplier report generation started.');

    var client = new restClient();
    var db = dbConfig.mongoDbConn;

    // logger.info(TAG + 'Calling Magento data service');
    var fromDate = req.query.fromDate;
    var toDate = req.query.toDate;

    var frmDate = new Date(fromDate);
    var toDateQ = new Date(toDate);

    frmDate = timeConversion.toIST(frmDate);
    toDateQ = timeConversion.toIST(toDateQ);

    frmDate.setHours(0, 0, 0, 0);
    toDateQ.setHours(23, 59, 59, 999);


    frmDate = timeConversion.toUTC(frmDate);
    toDateQ = timeConversion.toUTC(toDateQ);

    // frmDate.setHours(0, 0, 0, 0);
    // toDateQ.setHours(23, 59, 59, 999);

    // var queryObject["orderEntity.orderInfo.orderDate"] = {"$gte": frmDate,"$lte": toDate};

    var db = dbConfig.mongoDbConn;
    //.skip(pageNumber * itemsPerPage)
    db.collection('Seller').find({"sellerEntity.sellerDetails": { $exists: true }, "sellerEntity.updationInfo.date" : {"$gte": frmDate,"$lte" : toDateQ} },
     {"_id":0}).toArray(function(err, results){
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

        var sheet = workbook.addWorksheet('NewSupplier Data');

        sheet.columns = [
          { header: 'Seller ID', key: 'sellerId', width: 15 },
          { header: 'Company Name', key: 'companyName', width: 15 },
          { header: 'Display Name', key: 'displayName', width: 13 },
          { header: 'Billing City', key: 'city', width: 12 },
          { header: 'PAN', key: 'PAN', width: 25 },
          { header: 'VAT_TIN', key: 'VAT_TIN', width: 20 },
          { header: 'Email', key: 'email', width: 40 },
          { header: 'Phone', key: 'phone', width: 15 },
          { header: 'Bank Info / Account Holder Name', key: 'accountHolderName', width: 15 },
          { header: 'Bank Info / Branch', key: 'branch', width: 15 },
          { header: 'Bank Info / Bank Name', key: 'bankName', width: 15 },
          { header: 'Bank Info / Accoutn Number', key: 'accountNumber', width: 15 },
          { header: 'Bank Info / IFSC', key: 'IFSC', width: 15 },
          { header: 'Created By', key: 'by', width: 15 },
          { header: 'Date', key: 'date', width: 15 }
        ];
        results.forEach(function(seller){
          var row = {
            sellerId: seller.sellerEntity.identifier.sellerId,
            companyName: seller.sellerEntity.companyInfo.companyName,
            displayName: seller.sellerEntity.companyInfo.displayName,
            city: seller.sellerEntity.sellerDetails.city ? seller.sellerEntity.sellerDetails.city : "",
            PAN: seller.sellerEntity.sellerDetails.PAN ? seller.sellerEntity.sellerDetails.PAN : "",
            VAT_TIN: seller.sellerEntity.sellerDetails.VAT_TIN ? seller.sellerEntity.sellerDetails.VAT_TIN : "",
            email: seller.sellerEntity.sellerDetails.email ? seller.sellerEntity.sellerDetails.email : "",
            phone: seller.sellerEntity.sellerDetails.phone ? seller.sellerEntity.sellerDetails.phone : "",
            accountHolderName: seller.sellerEntity.sellerDetails.bankInfo ? (seller.sellerEntity.sellerDetails.bankInfo.accountHolderName ? seller.sellerEntity.sellerDetails.bankInfo.accountHolderName : "") : "",
            branch: seller.sellerEntity.sellerDetails.bankInfo ? (seller.sellerEntity.sellerDetails.bankInfo.branch ? seller.sellerEntity.sellerDetails.bankInfo.branch : "") : "",
            bankName: seller.sellerEntity.sellerDetails.bankInfo ? (seller.sellerEntity.sellerDetails.bankInfo.bankName ? seller.sellerEntity.sellerDetails.bankInfo.bankName : "") : "",
            accountNumber: seller.sellerEntity.sellerDetails.bankInfo ? (seller.sellerEntity.sellerDetails.bankInfo.accountNumber ? seller.sellerEntity.sellerDetails.bankInfo.accountNumber : "") : "",
            IFSC: seller.sellerEntity.sellerDetails.bankInfo ? (seller.sellerEntity.sellerDetails.bankInfo.IFSC ? seller.sellerEntity.sellerDetails.bankInfo.IFSC : "") : "",
            by: seller.sellerEntity.updationInfo.by,
            date: timeConversion.toIST(seller.sellerEntity.updationInfo.date)
          };
          sheet.addRow(row);
        });

        var filename = "/usr/NodeJslogs/temp/NewSupplierReport - " + new Date() + ".xlsx";

        logger.info(TAG + 'NewSupplierReport Report generation completed.');
        workbook.xlsx.writeFile(filename)
        .then(function() {
          res.statusCode = 200;
          res.download(filename, function(){
            logger.info(TAG + 'NewSupplierReport Report sent.');
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
