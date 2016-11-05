//This file will create the final report for generateCustomerOrderReport

var TAG = " RFQ Inquiry Report - ";
// var log = require('../../Environment/log4js.js');
var env = require('../../../Environment/env.js').env;
var urlConstants = require('../../helpers/urlConstants');
var dbConfig = require('../../../Environment/mongoDatabase.js');
var Excel = require('exceljs');
var fs = require('fs');
var log = require('../../../Environment/log4js.js');
var timeConversion = require('../../helpers/timezoneConversions.js');
var async = require('async');
var magento = require('../../magento/magentoAPI.js');

exports.generateRfqInquiryReport = function(req, res){
  var logger = log.logger_util;
  if (req.query.fromDate && req.query.toDate) {
    logger.info(TAG + 'RFQ inquiry report generation started.');

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

    var taskArray = [];

    var inquiryMasterColl = db.collection("InquiryMaster");
    inquiryMasterColl.find({"inquiryEntity.inquiryTimestamp" : {"$gte": frmDate,"$lte" : toDateQ}}).toArray(function(error, result){
          if(error){
            res.status = 500;
            res.json({'http_code':500, 'error': error.stack});
            logger.error(TAG + " Error while fetching inquiry details in InquiryMaster collection, Error :"+error);
          }
          else if(result.length < 1) {
            res.status = 400;
            res.json({'http_code':400, 'error': 'There is no data in InquiryMaster collection for the specified date range.'});
            logger.error(TAG + "  There is no data in InquiryMaster collection.");
          }
          else{

            logger.info(TAG + " Data found in inquiry master collection.");
            logger.debug(TAG + " started creating task array that contains function that will call customer details api.");
            var slno = 0;
            result.forEach(function(element, index, array){
              var inquiryDetails = {};
              slno = slno + 1;

              inquiryDetails["slno"] = slno;
              inquiryDetails["inquiryDate"] = timeConversion.toIST(element.inquiryEntity.inquiryTimestamp);
              inquiryDetails["inquiryId"] = element.inquiryEntity.inquiryId;
              inquiryDetails["inquiryDeactivationDate"] = timeConversion.toIST(element.inquiryEntity.inquiryDeactivationDate);
              inquiryDetails["inquiryStatus"] = element.inquiryEntity.inquiryStatus;
              inquiryDetails["categories"] = element.inquiryEntity.categories.toString();
              inquiryDetails["deliverBydate"] = element.inquiryEntity.deliveryByDate;
              inquiryDetails["paymentMode"] = element.inquiryEntity.paymentModes;
              inquiryDetails["creditDays"] = element.inquiryEntity.creditDaysNeeded;
              inquiryDetails["requirement"] = element.inquiryEntity.detailsOfRequirement;
              inquiryDetails["inquiryStatus"] = element.inquiryEntity.inquiryStatus;
              inquiryDetails["noOfQuotations"] = element.inquiryEntity.noOfQuotationsDesiredRange;
              inquiryDetails["attachment"] = element.inquiryEntity.inquiryAttachmentFilePathS3;
              inquiryDetails["companyId"] = element.inquiryEntity.associatedCompanyId;
              inquiryDetails["companyName"] = element.inquiryEntity.companyName;
              inquiryDetails["customerId"] = element.inquiryEntity.associatedbuilderId;
              inquiryDetails["customerName"] = null;
              inquiryDetails["mobile"] = null;
              inquiryDetails["email"] = null;

              //Fetching customer details includes API call, so instead of calling customer details api for each customer one after
              //other, storing function that will do this task in a array, and passing this array to async to execute parallelly.
              taskArray.push(function(callback){
                //calling function that will get customer details from magento.
                magento.getDetailsOfCustomerFromMagento(element.inquiryEntity.associatedbuilderId, function(error, mresult){
                  if((!error) &&  mresult.body.message.customerData ){

                    inquiryDetails.customerName = mresult.body.message.customerData.first_name +" "+mresult.body.message.customerData.last_name;
                    inquiryDetails.mobile = mresult.body.message.customerData.mobile_number;
                    inquiryDetails.email = mresult.body.message.customerData.email;

                    if(!element.inquiryEntity.shipToProjectAddress){
                      inquiryDetails.shippingAddress_addressLine1 = element.inquiryEntity.shippingAddress.addressLine1;
                      inquiryDetails.shippingAddress_addressLine2 = element.inquiryEntity.shippingAddress.addressLine2;
                      inquiryDetails.shippingAddress_city = element.inquiryEntity.shippingAddress.city;
                      inquiryDetails.shippingAddress_state = element.inquiryEntity.shippingAddress.state;
                      inquiryDetails.shippingAddress_pincode = element.inquiryEntity.shippingAddress.pincode;

                      callback(false, inquiryDetails);
                    }
                    else{
                      getProjectDetails(element.inquiryEntity.associatedCompanyId, element.inquiryEntity.associatedProjectId, element.inquiryEntity.associatedProjectType, function(error, result){

                        if(result === null){
                          logger.error(TAG + " project details not found for company Id: "+element.inquiryEntity.associatedCompanyId+", projectType: "+element.inquiryEntity.associatedProjectType+", projectId: "+element.inquiryEntity.associatedProjectId);

                          inquiryDetails.shippingAddress_addressLine1 = "";
                          inquiryDetails.shippingAddress_addressLine2 = "";
                          inquiryDetails.shippingAddress_city = "";
                          inquiryDetails.shippingAddress_state = "";
                          inquiryDetails.shippingAddress_pincode = "";
                        }
                        else{
                          inquiryDetails.shippingAddress_addressLine1 = result.address1;
                          inquiryDetails.shippingAddress_addressLine2 = result.address2;
                          inquiryDetails.shippingAddress_city = result.city;
                          inquiryDetails.shippingAddress_state = result.state;
                          inquiryDetails.shippingAddress_pincode = result.pincode;
                        }
                        callback(false, inquiryDetails);
                      });
                    }
                  }
                  else{
                    callback(false, inquiryDetails);
                  }
                });
              });
            });

            logger.info(TAG + " finished creating task array.");

            async.parallelLimit(taskArray, 50, function(error, asyncResults){
              if(!error){

                logger.debug(TAG + " successfull executed all tasks in array parallelly.");
                logger.debug(TAG + " started creating excel report.");

                var xlsxColumns = [

                        { header: 'Sl no', key: 'slno', width: 5},
                        { header: 'Inquiry ID', key: 'inquiryId', width: 15},
                        { header: 'Company ID', key: 'companyId', width: 15},
                        { header: 'Company Name', key: 'companyName', width: 30},
                        { header: 'Customer ID', key: 'customerId', width: 15},
                        { header: 'Customer Name', key: 'customerName', width: 30},
                        { header: 'Customer Phone', key: 'mobile', width: 15},
                        { header: 'Customer Email', key: 'email', width: 30},
                        { header: 'Date of Enquiry', key: 'inquiryDate', width: 15},
                        { header: 'Requirement Details', key: 'requirement', width: 50},
                        { header: 'Categories', key: 'categories', width: 30},
                        { header: 'Deliver by Date', key: 'deliverBydate', width: 20},
                        { header: 'Payment Mode', key: 'paymentMode', width: 20},
                        { header: 'Credit Days Needed', key: 'creditDays', width: 25},
                        { header: 'Shipping Address-Line1', key: 'shippingAddress_addressLine1', width: 30},
                        { header: 'Shipping Address-Line2', key: 'shippingAddress_addressLine2', width: 30},
                        { header: 'City', key: 'shippingAddress_city', width: 20},
                        { header: 'State', key: 'shippingAddress_state', width: 20},
                        { header: 'Pincode', key: 'shippingAddress_pincode', width: 15},
                        { header: 'Inquiry Active Till', key: 'inquiryDeactivationDate', width: 15},
                        { header: 'Inquiry Status', key: 'inquiryStatus', width: 15},
                        { header: 'No of Quotations Desired', key: 'noOfQuotations', width: 15},
                        { header: 'Attachment', key: 'attachment', width: 350}
                      ];

                    var pathToCreate = "/usr/NodeJslogs/rfqdocs/InquiryMISDailyReport.xlsx";

                    createExcel(xlsxColumns, asyncResults, pathToCreate, "Inquiry List", function(err, result){
                      if(!err){
                        logger.debug(TAG + " successfull created excel report.");

                        res.statusCode = 200;
                        res.download(pathToCreate, function(){
                          logger.info(TAG + 'RFQ Inquiry Report sent.');
                          fs.unlinkSync(pathToCreate);
                        });

                      }
                      else{
                        logger.error(TAG + " error while creating excel report.");
                      }
                    });
              }
              else{
                res.status = 500;
                res.json({'http_code':500, 'error': 'Internal server error.'});
                logger.error(TAG + " error in executing all tasks in array serially.");
              }
            });

          }
    });
  }
  else{
    res.status = 400;
    res.json({'http_code':400, 'message': 'fromDate & toDate is mandatory'});
    logger.error(TAG + 'fromDate & toDate is mandatory.');
  }

}

function getProjectDetails(companyId, projectId, projectType, callback){
  //Variable for Mongo DB Connection.
  var db = dbConfig.mongoDbConn;
  var builderColl = db.collection("Builder");

  //Variable for Logging the messages to the file.
  var logger = log.logger_util;
  var finalResult = null;
  builderColl.findOne({"builderEntity.profileInfo.accountInfo.companyId": companyId},
      {"_id": 0, "builderEntity.projects" : 1}, function(error, result){
        if(!error && (result !== null))
        {
          for(var i = 0; i < result.builderEntity.projects[projectType].length; i++){
            if(projectId === result.builderEntity.projects[projectType][i].projectId){
              finalResult = result.builderEntity.projects[projectType][i].address.projectAddress;
              break;
            }
          }
          return callback(false, finalResult);
        }
        else if(!error && (result === null))
        {
          logger.error(TAG + " Invalid Inputs, Inputs doesnt match with the database records, companyId': " + companyId);
          return callback(true, finalResult);
        }
        else
        {
          logger.error(TAG + " Internal Server Error. error: " + error);
          return callback(true, finalResult);
        }
      });
}

function createExcel(columns, rows, pathToCreate, sheetName, callback){
    var workbook = new Excel.Workbook();

     var sheet = workbook.addWorksheet(sheetName);

     sheet.columns = columns;

     for(var i = 0; i < rows.length; i++){
       sheet.addRow(rows[i]);
     }

     workbook.xlsx.writeFile(pathToCreate)
     .then(function(err) {
      if(!err){
        callback(false, pathToCreate);
      }else{
        callback(true, "Creating and Writing to excel file failed");
      }
     });
}