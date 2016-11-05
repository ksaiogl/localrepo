//@author Soumya Bardhan
//File that contains buisness logic for viewing customer order.
var TAG = "--- View Customer Order ---    ";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var async = require('async');
var timeConversion = require('../helpers/timezoneConversions.js');
var supplierDetails = require('../supplier/supplierDetails.js');
var request = require("request");
var host_detail = require('../../Environment/hostDetails.js');

var viewOrder = function(req, callback){
  try {

    // Variable for Logging the messages to the file.
    var logger = log.logger_OMS;
    var customerId = parseInt(req.query.customerId);

    // Log the request.
    logger.info(TAG + "Request received for view order list. REQ : " + req.url);

    var queryObject = {};

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

    var orderIds = req.query.orderIds.split(',');
    // orderIds.forEach(function(element, index){
    //   orderIds[index] = parseInt(element);
    // });

    queryObject["orderEntity.orderInfo.orderNumber"] = {"$in":orderIds};

    var outputJSON = [];

    var db = dbConfig.mongoDbConn;

    db.collection('Orders').find(queryObject, {"_id":0}).toArray(function(err, results){
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
              "message": "No document found for orderIds : " + orderIds
          };
          callback(true,resJson);
          logger.info(TAG + "No document found for orderIds : " + orderIds);
        } else {

          //Getting seller name for the orders
          async.each(results, function(resultElement, callback){

            async.each(resultElement.orderEntity.orderInfo.sellerInfo,function(sellerInfo, callback){
              // logger.info(TAG + "Quering to get details for seller : " + sellerInfo.sellerId);
              supplierDetails.getSupplierDetails(sellerInfo.sellerId, function(err, code, result){
                  if (err) {
                    // resJson = {
                    //     "http_code": 500,
                    //     "message": "Error - View Order Failed. Please contact engineering team."
                    // };
                    // callback(true,result);
                    // logger.error(TAG + "Error in view order. ERROR : " + result.message);
                    sellerInfo.companyName = "";
                    sellerInfo.displayName = "";
                    callback();
                  } else {
                    // logger.info(TAG + "Details retrived for seller : " + sellerInfo.sellerId + " Result : " + JSON.stringify(result));
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
              // db.collection('Supplier').findOne({"supplierEntity.identifier.sellerId": sellerInfo.sellerId},{"_id": 0, "supplierEntity.companyInfo.companyName": 1,"supplierEntity.companyInfo.displayName": 1},function(err, result){
              //   if (err) {
              //     resJson = {
              //         "http_code": 500,
              //         "message": "Error - View Order Failed. Please contact engineering team."
              //     };
              //       callback(true,resJson);
              //     logger.error(TAG + "Error in view order. ERROR : \n" + err.stack);
              //     callback(err);
              //   } else {
              //     // logger.info(TAG + "Details retrived for seller : " + sellerInfo.sellerId + " Result : " + JSON.stringify(result));
              //     if (result == null) {
              //       sellerInfo.companyName = "";
              //       sellerInfo.displayName = "";
              //     } else {
              //       sellerInfo.companyName = result.supplierEntity.companyInfo.companyName;
              //       sellerInfo.displayName = result.supplierEntity.companyInfo.displayName;
              //     }
              //     callback();
              //
              //   }
              // });
            },function(err){
              if (err) {
                callback(err);
              } else {
                //calling callback of outer async
                callback();
              }
            });
          }, function(err){
            if (err) {
              resJson = {
                  "http_code": 500,
                  "message": "Error - Order detail Failed. Please contact engineering team."
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
                    billingAddress:{},
                    shippingAddress:{},
                    // orderTotals:element.orderEntity.orderInfo.orderTotals,
                    // orderTotals_A:element.orderEntity.orderInfo.orderTotals_A,
                    // customerRefunds:element.orderEntity.orderInfo.customerRefunds,
                    sellerPenality : [],
                    orderItems:[]
                  },
                  paymentInfo:element.orderEntity.paymentInfo,
                  customerInfo:element.orderEntity.orderInfo.customerInfo
                };

                var orderTotals;

                if (element.orderEntity.orderInfo.orderTotals_A) {
                  orderObj.orderInfo.orderTotals = element.orderEntity.orderInfo.orderTotals_A;
                  orderObj.orderInfo.orderTotals_original = element.orderEntity.orderInfo.orderTotals;
                  orderTotals = element.orderEntity.orderInfo.orderTotals_A;
                } else {
                  orderObj.orderInfo.orderTotals = element.orderEntity.orderInfo.orderTotals;
                  orderTotals = element.orderEntity.orderInfo.orderTotals;
                }

                var customerGatewayCharges = orderTotals.customerGatewayCharges;
                var customerGatewayChargesBasis = orderTotals.customerGatewayChargesBasis;

                //Adding additional calculated fields in the OrderTotals.
                orderObj.orderInfo.orderTotals.subtotalWithVAT = orderTotals.ActualSubtotal + orderTotals.ActualVAT;
                orderObj.orderInfo.orderTotals.totalServiceCharges = orderTotals.serviceTaxOnConvenienceFee + orderTotals.convenienceFee + orderTotals.gatewayChargesOnTotal;

                //Adding tag for price without excise
                orderTotals.totalWithoutExcise = orderTotals.total - orderTotals.excise;

                //Populate shipping & billing address
                element.orderEntity.orderInfo.orderDeliveryAddress.forEach(function(element){
                  if (element.addressType == 'Billing') {
                    orderObj.orderInfo.billingAddress = element;
                  }
                  else if(element.addressType == 'Shipping'){
                    orderObj.orderInfo.shippingAddress = element;
                  }
                });

                //Populate order items
                element.orderEntity.orderInfo.sellerInfo.forEach(function(sellerElement){

                  //var itemTotals = 0;
                  sellerElement.orderItemInfo.forEach(function(element){
                    //calculate Price + VAT per unit chanrges and send it as a new field in the output.
                    var pricePlusVAT = (element.VAT_Value/element.quantity)+element.price;
                    //get the lineitem total to calulate the penality for each supplier
                    //itemTotals = itemTotals + element.total;
                    
                    var itemInfoObj = {
                      sellerId: sellerElement.sellerId,
                      companyName:sellerElement.companyName,
                      displayName:sellerElement.companyName,
                      pricePlusVAT: pricePlusVAT,
                    };                    
                    for (var property in element) {
                      if (element.hasOwnProperty(property))
                      {
                        itemInfoObj[property] = element[property];
                      }
                    }
                    //Converting dates to IST
                    element.minDeliveryDate = timeConversion.toIST(element.minDeliveryDate);
                    element.maxDeliveryDate = timeConversion.toIST(element.maxDeliveryDate);
                    element.lastUpdatedOn = timeConversion.toIST(element.lastUpdatedOn);

                    //Adding tag for price without excise
                    itemInfoObj.totalWithoutExcise = itemInfoObj.total - itemInfoObj.excise_Value;

                    delete itemInfoObj.estimatedDeliveryDays;
                    orderObj.orderInfo.orderItems.push(itemInfoObj);
                  });

                  //Details specific to admin panel
                  if (req.params.view == 'admin') {
                    orderObj.financials = element.orderEntity.financials;
                  }
                });

                if (req.params.view == 'admin') {
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
                      // var penality = ((totalValue * customerGatewayCharges)/100);
                      var penality = 0;
                    }
                    else
                    {
                      var penality = 0;
                    }
                    orderObj.orderInfo.sellerPenality.push({"sellerId": sellerFinancials[i].sellerId,
                      "penalityforOrderCancellation": penality});
                  }
                  orderObj.orderInfo.createdBy = element.orderEntity.orderInfo.createdBy ? element.orderEntity.orderInfo.createdBy : "";
                  orderObj.orderInfo.creditBy = element.orderEntity.orderInfo.creditBy ? element.orderEntity.orderInfo.creditBy : "";
                  orderObj.orderInfo.rfqOrder = element.orderEntity.orderInfo.rfqOrder;
                  orderObj.orderInfo.rfqEnquiryId = element.orderEntity.orderInfo.rfqEnquiryId;
                }


                orderObj.orderInfo.orderType = element.orderEntity.orderInfo.orderType ? element.orderEntity.orderInfo.orderType : "";
                orderObj.orderInfo.creditDays = element.orderEntity.orderInfo.creditDays ? element.orderEntity.orderInfo.creditDays : 0;
                outputJSON.push(orderObj);

              });
              
               //async starts
                async.series([
                    function(callback){
                    /*** to get sku url **/
                    var counter = 0;
                    outputJSON[0].orderInfo.orderItems.forEach(function(data){                      
                        var WHICH_HOST = host_detail.WEB_HOST;                     
                        var url = 'http://'+WHICH_HOST.host+'/product/api/v1.0/getSkuDetails?skuId='+data.SKUId;
                        request({
                            url: url, //URL to hit
                            method: 'GET'
                        }, function(error, response, body){
                            if(error) {
                                logger.error(TAG + "Request to get SKU Details failed " + error);
                            }
                            else {
                                body = JSON.parse(body);
                                logger.debug(TAG + "Request to get SKU Details succssful");
                                var sku_url = ((body.message.productEntity !== null && body.message.productEntity !== '' && body.message.productEntity !== undefined) ? body.message.productEntity.searchURL : '');
                                data["sku_url"] = 'https://'+WHICH_HOST.host+'/'+sku_url;
                                counter++;
                                if(counter == outputJSON[0].orderInfo.orderItems.length){
                                    callback(false);
                                }                                                        
                            }
                        });                        
                    });
                    
                }], function(err){
                  resJson = {
                      "http_code": 200,
                      "message": outputJSON
                  };
                  callback(false, resJson);
                });
                //Async Ends
          }
        });
        }
      }
    });    
  } catch (err) {
    resJson = {
        "http_code": 500,
        "message": err.stack
    };
    callback(true,resJson);
    logger.error(TAG + " ERROR : \n" + err.stack);
  }
}

exports.viewOrder = viewOrder;
