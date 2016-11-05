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

var viewOrderList = function (req, callback) {

  // Variable for Logging the messages to the file.
  var logger = log.logger_OMS;

  try {
    if (req.query.itemsPerPage != null && req.query.page != null && !isNaN(parseInt(req.query.itemsPerPage)) && !isNaN(parseInt(req.query.page))) {

      var customerId = parseInt(req.query.customerId);
      var itemsPerPage = parseInt(req.query.itemsPerPage);
      var pageNumber =  parseInt(req.query.page);
      var orderStatus = req.query.orderStatus;
      var fromDate = req.query.fromDate;
      var toDate = req.query.toDate;

      // Log the request.
      logger.info(TAG + "Request received for view order list. REQ : " + req.url);
      var queryObject = {}

      if (req.params.view == 'admin') {
        if (customerId) {
          queryObject["orderEntity.orderInfo.customerInfo.customerId"] = customerId;
        }
      } else if (customerId) {
        queryObject["orderEntity.orderInfo.customerInfo.customerId"] = customerId;
      } else {
        resJson = {
          "http_code": 400,
          "message": "customer Id is mandatory for calls from Web or Mobile."
        };
        callback(false,resJson);
        logger.error(TAG + " ERROR : " + resJson.message);
        return;
      }


      if (orderStatus) {
        switch (orderStatus) {
          case "In Progress": {
            finalorderStatus = ["OnHold","Confirmed","Accepted", "Ready To Ship", "Shipped", "Partially Accepted","Ready to Ship - Partial","Partially Shipped"];
            break;
          }
          case "Delivered": {
            finalorderStatus = ["Delivered", "Partially delivered"];
            break;
          }
          case "Unpaid": {
            finalorderStatus = ["Pending","Failed"];
            break;
          }
          case "Cancelled": {
            finalorderStatus = ["Cancelled"];
            break;
          }

        }

        queryObject["orderEntity.orderInfo.orderStatus"] = {"$in":finalorderStatus};
        //queryObject["orderEntity.orderInfo.orderStatus"] = {"$in":orderStatus.split(',')};
      }
      if (fromDate && toDate) {
        var frmDate = new Date(fromDate);
        var toDate = new Date(toDate);

        frmDate = timeConversion.toIST(frmDate);
        toDate = timeConversion.toIST(toDate);

        frmDate = timeConversion.toUTC(frmDate);
        toDate = timeConversion.toUTC(toDate);

        frmDate.setHours(0, 0, 0, 0);
        toDate.setHours(23, 59, 59, 999);

        queryObject["orderEntity.orderInfo.orderDate"] = {"$gte": frmDate,"$lte": toDate};
        // queryObject["orderEntity.orderInfo.orderDate"] = {"$gte": new Date(fromDate),"$lte": new Date(toDate)};
      }

      var outputJSON = {
        orders:[]
      };
      var db = dbConfig.mongoDbConn;
      //.skip(pageNumber * itemsPerPage)
      db.collection('Orders').find(queryObject,{"_id":0,"orderEntity.orderInfo":1, "orderEntity.financials":1}).limit((pageNumber + 1) * itemsPerPage).sort({"orderEntity.orderInfo.orderNumber":-1}).toArray(function(err, results){

        if (err) {
          resJson = {
            "http_code": 500,
            "message": "Error - View Order Failed. Please contact engineering team."
          };
          callback(true,resJson);

          logger.error(TAG + "Error in view order. ERROR : \n" + err.stack);
        } else {
          if (results == null) {
            resJson = {
              "http_code": 404,
              "message": "No document found for customerId : " + customerId + " with status : " + orderStatus
            };
            callback(true,resJson);

            logger.info(TAG + "No document found for customerId : " + customerId + " with status : " + orderStatus);
          } else {
            results = results.slice(pageNumber * itemsPerPage);
            if (results.length) {


              async.each(results, function(resultElement, callback){
                var orderItemCount = 0;

                async.each(resultElement.orderEntity.orderInfo.sellerInfo,function(sellerInfo, callback){
                  orderItemCount += sellerInfo.orderItemInfo.length;

                  //  logger.info(TAG + "Quering to get details for seller : " + sellerInfo.sellerId);
                  supplierDetails.getSupplierDetails(sellerInfo.sellerId, function(err, code, result){
                    if (err) {
                      // resJson = {
                      //     "http_code": 500,
                      //     "message": "Error - View Order Failed. Please contact engineering team."
                      // };
                      sellerInfo.companyName = "";
                      sellerInfo.displayName = "";
                      callback();
                      // callback(true,result);
                      // logger.error(TAG + "Error in view order. ERROR : " + result.message);
                      //  callback(err);
                    } else {
                      //  logger.info(TAG + "Details retrived for seller : " + sellerInfo.sellerId + " Result : " + JSON.stringify(result));
                      if (result == null) {
                        sellerInfo.companyName = "";
                        sellerInfo.displayName = "";
                      } else {
                        sellerInfo.companyName = result.supplier.profileInfo.basicInfo.companyInfo.companyName;
                        sellerInfo.displayName = result.supplier.profileInfo.basicInfo.companyInfo.displayName;
                      }
                      callback();

                    }

                  });

                },function(err){
                  if (err) {
                    callback(err);
                  } else {
                    //calling callback of outer async
                    resultElement.orderItemCount = orderItemCount;
                    callback();
                  }
                });
              }, function(err){
                if (err) {
                  resJson = {
                    "http_code": 500,
                    "message": "Error - Order view Failed. Please contact engineering team."
                  };
                  callback(true,resJson);
                  logger.error(TAG + " ERROR : \n" + err.stack);
                }else {

                  // Iterating over the retrived results and creating the desired structure
                  results.forEach(function(element){
                    var orderObj = {
                      orderInfo:{
                        orderDate:timeConversion.toIST(element.orderEntity.orderInfo.orderDate),
                        orderPlatform:element.orderEntity.orderInfo.orderPlatform,
                        orderNumber: element.orderEntity.orderInfo.orderNumber,
                        orderStatus: element.orderEntity.orderInfo.orderStatus,
                        reasonForCancellation:element.orderEntity.orderInfo.reasonForCancellation,
                        cancelledBy:element.orderEntity.orderInfo.cancelledBy,
                        orderTotals:element.orderEntity.orderInfo.orderTotals,
                        orderItems:[],
                        sellerPenality : [],
                        orderItemCount:element.orderItemCount
                      },
                      customerInfo:element.orderEntity.orderInfo.customerInfo
                    };

                    var orderTotals;

                    if (element.orderEntity.orderInfo.orderTotals_A) {
                      orderObj.orderTotals = element.orderEntity.orderInfo.orderTotals_A;
                      orderTotals = element.orderEntity.orderInfo.orderTotals_A;
                    } else {
                      orderObj.orderTotals = element.orderEntity.orderInfo.orderTotals;
                      orderTotals = element.orderEntity.orderInfo.orderTotals;
                    }

                    var customerGatewayCharges = orderTotals.customerGatewayCharges;
                    var customerGatewayChargesBasis = orderTotals.customerGatewayChargesBasis;
                    if (req.params.view == 'admin') {
                      orderObj.orderInfo.createdBy = element.orderEntity.orderInfo.createdBy ? element.orderEntity.orderInfo.createdBy : "";
                      orderObj.orderInfo.creditBy = element.orderEntity.orderInfo.creditBy ? element.orderEntity.orderInfo.creditBy : "";
                      orderObj.orderInfo.rfqOrder = element.orderEntity.orderInfo.rfqOrder;
                      orderObj.orderInfo.rfqEnquiryId = element.orderEntity.orderInfo.rfqEnquiryId;
                    }

                    orderObj.orderInfo.orderType = element.orderEntity.orderInfo.orderType ? element.orderEntity.orderInfo.orderType : "";
                    orderObj.orderInfo.creditDays = element.orderEntity.orderInfo.creditDays ? element.orderEntity.orderInfo.creditDays : 0;


                    var customerGatewayCharges = element.orderEntity.orderInfo.orderTotals.customerGatewayCharges;
                    var customerGatewayChargesBasis = element.orderEntity.orderInfo.orderTotals.customerGatewayChargesBasis;

                    //Populate order items
                    element.orderEntity.orderInfo.sellerInfo.forEach(function(sellerElement){

                      //var itemTotals = 0;
                      sellerElement.orderItemInfo.forEach(function(element){

                        //calculate Price + VAT per unit chanrges and send it as a new field in the output.
                        var pricePlusVAT = (element.VAT_Value/element.quantity)+element.price;
                        //get the lineitem total to calulate the penality for each supplier
                        //itemTotals = itemTotals + element.total;

                        var itemInfoObj =
                        {
                          sellerId: sellerElement.sellerId,
                          companyName:sellerElement.companyName,
                          displayName:sellerElement.companyName,
                          pricePlusVAT: pricePlusVAT,
                        };

                        for (var property in element)
                        {
                          if (element.hasOwnProperty(property))
                          {
                            itemInfoObj[property] = element[property];
                          }
                        }

                        //Converting dates to IST
                        element.minDeliveryDate = timeConversion.toIST(element.minDeliveryDate);
                        element.maxDeliveryDate = timeConversion.toIST(element.maxDeliveryDate);
                        element.lastUpdatedOn = timeConversion.toIST(element.lastUpdatedOn);

                        delete itemInfoObj.estimatedDeliveryDays;
                        orderObj.orderInfo.orderItems.push(itemInfoObj);
                      });
                    });

                    //calculate the penality charges for the supplier.
                    var sellerFinancials = element.orderEntity.financials.seller;
                    for(var i=0; i<sellerFinancials.length; i++)
                    {
                      var sellerSubtotal = sellerFinancials[i].sellerTotal.subtotal;
                      var sellerVAT = sellerFinancials[i].sellerTotal.VAT;
                      var sellerExcise = sellerFinancials[i].sellerTotal.excise;
                      var shippingAndHandlingAnd3PLCharges = sellerFinancials[i].sellerTotal.shippingAndHandlingAnd3PLCharges;
                      var totalValue = sellerSubtotal + sellerVAT + sellerExcise + shippingAndHandlingAnd3PLCharges;
                      if(customerGatewayChargesBasis === "Percentage")
                      {
                        var penality = ((totalValue * customerGatewayCharges)/100);
                      }
                      else
                      {
                        var penality = 0;
                      }
                      orderObj.orderInfo.sellerPenality.push({"sellerId": sellerFinancials[i].sellerId,
                      "penalityforOrderCancellation": penality});
                    }
                    outputJSON.orders.push(orderObj);
                  });

                  outputJSON.itemsPerPage = itemsPerPage;
                  outputJSON.pageNumber = pageNumber;

                  db.collection('Orders').find(queryObject).count(function(err, count){
                    if (err) {
                      resJson = {
                        "http_code": 500,
                        "message": "Error - View Order Failed. Please contact engineering team."
                      };
                      callback(true,resJson);
                      logger.error(TAG + "Error in view order. ERROR : \n" + err.stack);
                    } else {
                      outputJSON.orderCount = count;

                      if (req.params.view == 'admin') {
                        resJson =
                        {
                          "http_code": 200,
                          "message": outputJSON
                        };
                        callback(false, resJson);
                      } else {

                        /*** to get sku url **/
                        async.each(outputJSON.orders, function(order, asyncMainCallback) {

                          async.each(order.orderInfo.orderItems, function(orderItem, asyncInternalCallback) {
                            client.registerMethod("productGetMethod", urlConstants.getSkuDetailsURL(env) + "?skuId=" + orderItem.SKUId, 'GET');

                            client.methods.productGetMethod(function (data, response) {
                              if (response.statusCode == 200) {
                                orderItem["sku_url"] = urlConstants.getSkuDetailsURL(env) + data.message.productEntity.searchURL;
                              } else {
                                orderItem["sku_url"] = "";
                              }
                              asyncInternalCallback();

                            });

                          }, function(err) {
                            asyncMainCallback()
                          });

                        }, function(err) {
                          resJson =
                          {
                            "http_code": 200,
                            "message": outputJSON
                          };
                          callback(false, resJson);

                        });

                      }

                    }
                  });
                }
              });
            }else {
              resJson = {
                "http_code": 200,
                "message": "No data found for the requested page."
              };
              callback(false,resJson);
              logger.error(TAG + " ERROR : " + resJson.message);
            }

          }
        }
      });
    } else {
      resJson = {
        "http_code": 400,
        "message": "itemsPerPage & page are mandatory query parameters and should be of type integer."
      };
      callback(false,resJson);
      logger.error(TAG + " ERROR : " + resJson.message);
    }
  } catch (err) {
    resJson = {
      "http_code": 500,
      "message": err.stack
    };
    callback(true,resJson);
    logger.error(TAG + " ERROR : \n" + err.stack);
  }

}

exports.viewOrderList = viewOrderList;
