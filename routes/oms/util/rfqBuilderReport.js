//This file will create the final report for generateCustomerOrderReport

var TAG = " RFQ Company Report - ";
// var log = require('../../Environment/log4js.js');
var env = require('../../../Environment/env.js').env;
var urlConstants = require('../../helpers/urlConstants');
var dbConfig = require('../../../Environment/mongoDatabase.js');
var Excel = require('exceljs');
var fs = require('fs');
var log = require('../../../Environment/log4js.js');
var timezoneConversions = require('../../helpers/timezoneConversions.js');
var async = require('async');
var magento = require('../../magento/magentoAPI.js');

exports.generateRfqCompanyReport = function(req, res){
	var logger = log.logger_util;
    logger.info(TAG + 'RFQ Company report generation started.');

    var db = dbConfig.mongoDbConn;

    var taskArray = [];

    var BuilderColl = db.collection("Builder");
	BuilderColl.find({}).toArray(function(error, result){
          if(error){
            res.status = 500;
            res.json({'http_code':500, 'error': error.stack});
            logger.error(TAG + " Error while fetching Company details in Builder collection, Error :"+error);
          }
          else if(result.length < 1) {
            res.status = 400;
            res.json({'http_code':400, 'error': 'There is no data in Builder collection.'});
            logger.error(TAG + "  There is no data in Builder collection.");
          }
          else{
            logger.info(TAG + " Data found in company collection.");
			var slno = 0;
			logger.info(TAG + " started pushing function to array.");
			result.forEach(function(element, index, array){
				var companyDetials = {};
				slno = slno + 1;
				companyDetials["slno"] = slno;
				companyDetials["companyId"] = element.builderEntity.profileInfo.accountInfo.companyId;
				companyDetials["companyName"] = "";
				companyDetials["establishedYear"] = "";
				companyDetials["addressline1"] = "";
				companyDetials["addressline2"] = "";
				companyDetials["city"] = "";
				companyDetials["state"] = "";
				companyDetials["pincode"] = "";

				taskArray.push(function(callback){
					//Magento Customer ID is the company ID which should be passed.
					magento.getCustomerDetailsFromMagento(element.builderEntity.profileInfo.accountInfo.companyId, function(error, mresult){
						if( (!error) && mresult.body.companyData){

							companyDetials.companyName = (mresult.body.companyData.company_name ? mresult.body.companyData.company_name : "");
							companyDetials.establishedYear = mresult.body.companyData.established_year;
							companyDetials.addressline1 = mresult.body.companyData.street_1;
							companyDetials.addressline2 = mresult.body.companyData.offical_address.street_2;
							companyDetials.city = mresult.body.companyData.offical_address.city;
							companyDetials.state = mresult.body.companyData.offical_address.state;
							companyDetials.pincode = (mresult.body.companyData.offical_address.pincode === 0 ? '' : mresult.body.companyData.offical_address.pincode);

							callback(false, companyDetials);
						}
						else{
							logger.error(TAG + " company details not found for company id: "+element.builderEntity.profileInfo.accountInfo.companyId);
							callback(false, companyDetials);
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
					  { header: 'Sl no', key: 'slno', width: 10},
					  { header: 'Company ID', key: 'companyId', width: 15},
					  { header: 'Company Name', key: 'companyName', width: 25},
					  { header: 'established Year', key: 'establishedYear', width: 25},
					  { header: 'Address line1', key: 'addressline1', width: 40},
					  { header: 'Address line2', key: 'addressline2', width: 40},
					  { header: 'City', key: 'city', width: 25},
					  { header: 'State', key: 'state', width: 25},
					  { header: 'Pincode', key: 'pincode', width: 20}
					];

					var pathToCreate = "/usr/NodeJslogs/rfqdocs/CompanyReport.xlsx";
                    createExcel(xlsxColumns, asyncResults, pathToCreate, "Company List", function(err, result){
                      if(!err){
                        logger.debug(TAG + " successfull created excel report.");
                        res.statusCode = 200;
                        res.download(pathToCreate, function(){
                          logger.info(TAG + 'RFQ Buidler Report sent.');
                          fs.unlinkSync(pathToCreate);
                        });
                      }
                      else{
                      	res.status = 500;
                		res.json({'http_code':500, 'error': 'Internal server error.'});
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
