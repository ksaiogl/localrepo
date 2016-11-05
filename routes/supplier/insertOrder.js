//@author Soumya Bardhan
//File that contains buisness logic for inserting order.
var TAG = "--- Order Creation ---    ";
var TAG_PAYMENT = "--- Order Payment Updation ---    ";
var env = require('../../Environment/env.js').env;
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var supNotifications = require('./supplierNotifications');
var cusNotifications = require('../customer/customerNotifications');
var V = require('jsonschema').Validator;
var validator = new V();
var orderSchema = require('../helpers/orderSchemaValidator.json');
var orderPayment = require('../helpers/orderPaymentValidator.json');
var _ = require("underscore");
var supplierDetails = require('./supplierDetails.js');
var orderEvent = require('../oms/orderEvents').orderEvents;
var orderFootprint = require('../oms/orderFootprint');

// var globalMaxDeliveryDate;
// var globalMinDeliveryDate;

// Function exported to insert new order into database
var insertOrder = function(req, callback) {
    try {
        // Variable for Logging the messages to the file.
        var logger = log.logger_OMS;

        var inputJSON = req.body;

        // Log the request.
        logger.info(TAG + "Request received for Order Creation. Input : \n" + JSON.stringify(inputJSON));

        //Create outputJSON
        var outputJSON = {
            "orderEntity": {}
        };

        //Validating the request
        validation_result = validator.validate(inputJSON, orderSchema);

        var errors = [];
        var shippingAddress;
        inputJSON.orderInfo.orderDeliveryAddress.forEach(function(element){
          if (element.addressType == "Shipping") {
            shippingAddress = element;
          }
        });

        if (shippingAddress.pinCode != inputJSON.kartMessage.pincode) {
          errors.push("Kart charges pincode and shippingAddress pincode should be same.");
        }

        // if (!(inputJSON.orderInfo.rfqOrder && inputJSON.orderInfo.rfqEnquiryId)) {
        //   errors.push("For RFQ orders rfqOrder should be true and rfqEnquiryId is mandatory.");
        // }

        if (validation_result.errors.length > 0 || errors.length > 0) {

          if (validation_result.errors.length > 0) {
            for (error in validation_result.errors){
              errors.push(validation_result.errors[error].stack);
            }
          }

          var errorMessage = {
            "errorMessage" : "Bad or ill-formed request.",
            "errors" : errors

          };
          resJson = {
              "http_code": 400,
              "message": errorMessage
          };
            callback(true,resJson);
            logger.error(TAG + "Bad or ill-formed request. \n" + JSON.stringify(errors));
            return;
        }else {
          var orderType = inputJSON.orderInfo.orderType ? inputJSON.orderInfo.orderType : "";
          var user = req.user ? req.user.email : "";
          var creditDays = inputJSON.orderInfo.creditDays ? inputJSON.orderInfo.creditDays : 0;
          var rfqOrder = inputJSON.orderInfo.rfqOrder ? inputJSON.orderInfo.rfqOrder : false;
          var rfqEnquiryId = inputJSON.orderInfo.rfqEnquiryId ? inputJSON.orderInfo.rfqEnquiryId : "";

           buildOrderEntity(inputJSON.orderInfo.orderDeliveryAddress, inputJSON.orderInfo.orderPlatform, orderType, user, creditDays, rfqOrder, rfqEnquiryId, inputJSON.orderInfo.customerInfo, inputJSON.paymentInfo, inputJSON.orderInfo.orderItemInfo, inputJSON.kartMessage.KartInfo, inputJSON.kartMessage.SellerChargesConsolidation, inputJSON.kartMessage.ShippingChargesSummary, inputJSON.kartMessage.KartChargesConsolidation, inputJSON.kartMessage.SellerFreebies, inputJSON.kartMessage.CheckoutSellerFreebies, function(err, outputJSON){
            if (err) {
              resJson = {
                  "http_code": 500,
                  "message": "Error - Order Creation Failed. Please contact engineering team."
              };
                callback(true,resJson);
                logger.error(TAG + " ERROR : \n" + err.stack);
            } else {
              //Inserting to DB.
              DbInsert(outputJSON,function(err, message){

                if (err) {
                  resJson = {
                      "http_code": 500,
                      "message": "Error - Order Creation Failed. Please contact engineering team."
                  };
                    callback(true,resJson);
                    logger.error(TAG + " ERROR : \n" + err.stack);
                }else {
                  resJson = {
                      "http_code": 200,
                      "message": message
                  };
                  callback(false,resJson);
                  logger.info(TAG + " SUCCESS : Order created successfully with orderNumber : " + message.orderId);
                  //Logging order foot print
                  orderFootprint.addOrderEvent(orderEvent.CREATION, message.orderId, req);

                  if (orderStatus == 'OnHold') {
                    cusNotifications.customerOrderOnHoldNotification(outputJSON);
                    cusNotifications.msupplyOrderOnHoldNotification(outputJSON);
                  }
                }
              });
            }
          });
        }
    } catch (err) {
      resJson = {
          "http_code": 500,
          "message": err.stack
      };
        callback(true,resJson);
        logger.error(TAG + " ERROR : \n" + err.stack);
    }
};




function buildOrderEntity(deliveryAddress, orderPlatform, orderType, createdBy, creditDays, rfqOrder, rfqEnquiryId, customerInfo, paymentInfo, orderItemInfo, kartInfo, SellerChargesConsolidation, ShippingChargesSummary, KartChargesConsolidation, Freebies, checkoutSellerFreebies, callback) {
  try {
    var outputJSON = {
        "orderEntity": {
          "orderInfo":{}
        }
    };

    //Taking the current server date as the order date as the the api is called as soon as the order is placed.
    orderDate = new Date();

    // Setting date object
    outputJSON.orderEntity.orderInfo.orderDate = orderDate;

    // Setting Order Platform
    outputJSON.orderEntity.orderInfo.orderPlatform = orderPlatform;

    // Setting Order Type
    if (orderType) {
      outputJSON.orderEntity.orderInfo.orderType = orderType;
    } else {
      outputJSON.orderEntity.orderInfo.orderType = "Non Credit";
    }

    // Setting createdBy
    if (createdBy) {
      outputJSON.orderEntity.orderInfo.createdBy = createdBy;
    } else {
      outputJSON.orderEntity.orderInfo.createdBy = "System";
    }

    // Setting creditDays
    if (creditDays) {
      outputJSON.orderEntity.orderInfo.creditDays = creditDays;
    } else {
      outputJSON.orderEntity.orderInfo.creditDays = 0;
    }

    //For RFQ orders
    outputJSON.orderEntity.orderInfo.rfqOrder = rfqOrder;
    outputJSON.orderEntity.orderInfo.rfqEnquiryId = rfqEnquiryId;

    if (outputJSON.orderEntity.orderInfo.orderType == "Credit") {
      outputJSON.orderEntity.orderInfo.creditBy = "Supplier";
    } else {
      outputJSON.orderEntity.orderInfo.creditBy = "";
    }


    //Creating place holder for orderNumber which will be updated just before insertion into DB.
    outputJSON.orderEntity.orderInfo.orderNumber = "";

    // Setting order status depending on payment mode
    // if (paymentInfo.paymentMode == 'COD') {
    //     orderStatus = 'Confirmed';
    // } else
    if (paymentInfo.paymentMode == 'Cheque' || paymentInfo.paymentMode == 'DD' || paymentInfo.paymentMode == 'COD') {
        orderStatus = 'OnHold';
    } else  {
        orderStatus = 'Pending';
    }

    outputJSON.orderEntity.orderInfo.orderStatus = orderStatus;

    // Creating place holders
    outputJSON.orderEntity.orderInfo.reasonForCancellation = 'NA';
    outputJSON.orderEntity.orderInfo.cancelledBy = 'NA';

    // Setting delivery and billing address from input
    outputJSON.orderEntity.orderInfo.orderDeliveryAddress = deliveryAddress;
    //Rename the fields as required in the order store
    KartChargesConsolidation.Customer.ActualSubtotal = KartChargesConsolidation.Customer.subtotal;
    KartChargesConsolidation.Customer.ActualVAT = KartChargesConsolidation.Customer.VAT;

    // Setting order totals
    delete KartChargesConsolidation.Customer.subtotalWithVAT;
    delete KartChargesConsolidation.Customer.threePLCharges;
    delete KartChargesConsolidation.Customer.shippingAndHandlingCharges;
    delete KartChargesConsolidation.Customer.shippingCharges;
    delete KartChargesConsolidation.Customer.handlingCharges;
    delete KartChargesConsolidation.Customer.VAT;
    delete KartChargesConsolidation.Customer.subtotal;
    delete KartChargesConsolidation.Customer.priceDisplayInclVAT;

    outputJSON.orderEntity.orderInfo.orderTotals = KartChargesConsolidation.Customer;

    //Iterating Customer Block

    var tempCustomerGatewayCharges;

    for (var i in KartChargesConsolidation.Customer.customerGatewayCharges) {
      if (paymentInfo.paymentMode == KartChargesConsolidation.Customer.customerGatewayCharges[i].gatewayPaymentMode) {
        tempCustomerGatewayCharges = KartChargesConsolidation.Customer.customerGatewayCharges[i];
      }
    }

    if (tempCustomerGatewayCharges) {
      outputJSON.orderEntity.orderInfo.orderTotals.gatewayChargesOnTotal = tempCustomerGatewayCharges.gatewayCharges;
      outputJSON.orderEntity.orderInfo.orderTotals.grossTotalWithGatewayCharges = tempCustomerGatewayCharges.grossTotalWithGatewayCharges;
    } else {
      outputJSON.orderEntity.orderInfo.orderTotals.gatewayChargesOnTotal = 0;
      outputJSON.orderEntity.orderInfo.orderTotals.grossTotalWithGatewayCharges = outputJSON.orderEntity.orderInfo.orderTotals.grossTotal;
    }

    delete KartChargesConsolidation.Customer.customerGatewayCharges;

    // Iterating information Block
    var tempCustomerGatewayChargesInfo;

    for (var i in KartChargesConsolidation.Information.customerGatewayChargesInfo) {
      if (paymentInfo.paymentMode == KartChargesConsolidation.Information.customerGatewayChargesInfo[i].gatewayPaymentMode) {
        tempCustomerGatewayChargesInfo = KartChargesConsolidation.Information.customerGatewayChargesInfo[i];
      }
    }

    if (tempCustomerGatewayChargesInfo) {
      outputJSON.orderEntity.orderInfo.orderTotals.customerGatewayCharges = tempCustomerGatewayChargesInfo.customerGatewayCharges;
      outputJSON.orderEntity.orderInfo.orderTotals.customerGatewayChargesBasis = tempCustomerGatewayChargesInfo.customerGatewayChargesBasis;
    } else {
      outputJSON.orderEntity.orderInfo.orderTotals.customerGatewayCharges = 0;
      outputJSON.orderEntity.orderInfo.orderTotals.customerGatewayChargesBasis = "";
    }



    // Updating seller info
    outputJSON.orderEntity.orderInfo.sellerInfo = [];


    ShippingChargesSummary.forEach(
        function(element) {
            var sellerID = element.sellerId;
            var sellerInfoObj = {
                "sellerId": sellerID,
                "pod": [],
                "orderAcknowledged": false,
                "orderItemInfo": [],
                "sellerOrderStatus":orderStatus
            };

            // Update details for seller
            // Seller shipped items
            if (element.sellerDeliverableSkus.length > 0) {
                var sellerSKUs = element.sellerDeliverableSkus;
                sellerSKUs.forEach(
                    function(element) {
                        var sku = element;
                        var obj = createSellerInfoObj(sku, sellerID, orderItemInfo, kartInfo);
                        obj.shippedBySeller = true;
                        obj.threePLName = "NA";
                        sellerInfoObj.orderItemInfo.push(obj);
                    });
            }
            // Update details for 3PL
            // 3PL shipped items
            if (element['3PLInfo'].length > 0) {
                var threePlInfo = element['3PLInfo'];
                threePlInfo.forEach(
                    function(element) {
                        var threePlName = element["3PLName"];
                        var threePlSKU = element["3PLDeliverableSkus"];
                        threePlSKU.forEach(
                            function(element) {
                                var sku = element;
                                var obj = createSellerInfoObj(sku, sellerID, orderItemInfo, kartInfo);
                                obj.shippedBySeller = false;
                                obj.threePLName = threePlName;
                                sellerInfoObj.orderItemInfo.push(obj);
                            });
                    });
            }

            // Freebies items
            if (Freebies.length > 0) {
              Freebies.forEach(
                function(element) {
                  if (element.sellerId == sellerID) {
                    element.freebies.forEach(function(element){
                      var obj = createFreebieObj(element, sellerID, checkoutSellerFreebies);
                      obj.shippedBySeller = true;
                      obj.threePLName = "NA";
                      sellerInfoObj.orderItemInfo.push(obj);
                    });
                  }
                });
              }

            outputJSON.orderEntity.orderInfo.sellerInfo.push(sellerInfoObj);
        });

    // Update payment info
    outputJSON.orderEntity.paymentInfo = paymentInfo;

    // update financials
    outputJSON.orderEntity.financials = {
        "seller": [],
    };

    SellerChargesConsolidation
        .forEach(function(element) {
            var sellerObj = {
                "sellerId": element.sellerId,
                "sellerTotal": element.Customer,
                "sellerFinancial": element.Finance
            }
            outputJSON.orderEntity.financials.seller.push(sellerObj);
        });

    outputJSON.orderEntity.financials.orderFinancials = KartChargesConsolidation.Finance;
    var temp;
    for (var i in KartChargesConsolidation.Finance.lossOnGatewayCharges) {
      if (paymentInfo.paymentMode == KartChargesConsolidation.Finance.lossOnGatewayCharges[i].gatewayPaymentMode) {
        temp = KartChargesConsolidation.Finance.lossOnGatewayCharges[i];
        break;
      }
    }
    outputJSON.orderEntity.financials.orderFinancials.lossOnGatewayCharges = [];
    if (temp) {
      outputJSON.orderEntity.financials.orderFinancials.lossOnGatewayCharges.push(temp);
    }

    // Setting customer Info from input
    outputJSON.orderEntity.orderInfo.customerInfo = customerInfo;
    if (customerInfo.primaryPersona == "Owner") {
      outputJSON.orderEntity.orderInfo.customerInfo.segment = "B2C";
    } else {
      outputJSON.orderEntity.orderInfo.customerInfo.segment = "B2B";
    }

    callback(false, outputJSON);

  } catch (err) {
      callback(err);
  }
}

function createSellerInfoObj(sku, sellerID, orderItemInfo, kartInfo) {
  var orderItem;
  var kartItem;

  orderItemInfo.forEach(
      function(element) {
          if (element.sku === sku && element.sellerId === sellerID) {
            orderItem = element;
              // var kartItem;
              for (var i in kartInfo) {
                  if (kartInfo[i].sku === sku && kartInfo[i].sellerId === sellerID) {
                      kartItem = kartInfo[i];
                  }
              }

          }
      });

      var obj = {
          "SKUId": orderItem.sku,
          "productName": orderItem.skuName.replace(/"/g, "'"),
          "SKUImage": orderItem.skuImageURL,
          "price": kartItem.unitPrice,
          "priceUnit": orderItem.qtyUnit,
          "estimatedDeliveryDays": orderItem.estimatedDeliveryDays,
          "subTotal": kartItem.subtotal,
          "total": kartItem.subtotal + (kartItem.VATAmountOnUnitPrice * kartItem.qty),
          "VAT_Value": kartItem.VATAmountOnUnitPrice * kartItem.qty,
          "excise_Value": kartItem.exciseAmountOnUnitPrice * kartItem.qty,
          "quantity": kartItem.qty,
          "quantityUnit": orderItem.qtyUnit,
          "itemStatus": orderStatus,
          "reasonForCancellation": '',
          "cancelledBy": '',
          "lastUpdatedOn":orderDate,
          "deliveredOn": null,
          "courierName": "",
          "shipmentNo": "",
          "courierName": "",
          "shipmentNo": ""
      }

    // Computing min and max delivey date
    var minMaxRange = orderItem.estimatedDeliveryDays;
    var splits = minMaxRange.split('-');
    if (splits.length > 1) {
        minDays = parseInt(splits[0]);
        maxDays = parseInt(splits[1]);
    } else {
        minDays = maxDays = parseInt(splits[0]);
    }

    var minDate = new Date();
    minDate.setDate(orderDate.getDate() + minDays);

    var maxDate = new Date();
    maxDate.setDate(orderDate.getDate() + maxDays);

    obj.minDeliveryDate = minDate;
    obj.maxDeliveryDate = maxDate;
    //
    // globalMinDeliveryDate = minDate < globalMinDeliveryDate ? minDate : globalMinDeliveryDate;
    // globalMaxDeliveryDate = maxDate < globalMaxDeliveryDate ? maxDate : globalMaxDeliveryDate;

    return obj;
}


function createFreebieObj(freeElement, sellerID, checkoutSellerFreebies) {
  var returnObj;

  checkoutSellerFreebies.forEach(function(element){
    if (element.sku == freeElement.id && element.seller_id == sellerID) {
      var obj = {
        "SKUId": freeElement.id,
        "productName": element.skuName.replace(/"/g, "'"),
        "SKUImage": element.skuImageURL,
        "price": 0,
        "priceUnit": element.ProductUnit,
        "estimatedDeliveryDays": "",
        "subTotal": 0,
        "total": 0,
        "VAT_Value": 0,
        "excise_Value": 0,
        "quantity": freeElement.qty,
        "quantityUnit": element.ProductUnit,
        "itemStatus": orderStatus,
        "reasonForCancellation": '',
        "cancelledBy": '',
        "lastUpdatedOn":orderDate,
        "deliveredOn": null,
        "courierName": "",
        "shipmentNo": "",
        "courierName": "",
        "shipmentNo": ""
      }

      // Computing min and max delivey date
      var minMaxRange = element.EstimatedDeliveryDays;
      var splits = minMaxRange.split('-');
      if (splits.length > 1) {
        minDays = parseInt(splits[0]);
        maxDays = parseInt(splits[1]);
      } else {
        minDays = maxDays = parseInt(splits[0]);
      }

      var minDate = new Date();
      minDate.setDate(orderDate.getDate() + minDays);

      var maxDate = new Date();
      maxDate.setDate(orderDate.getDate() + maxDays);

      obj.minDeliveryDate = minDate;
      obj.maxDeliveryDate = maxDate;

      returnObj = obj;
    }
  });

  return returnObj;
}

// Function for inserting order in Order DB
function DbInsert(outputJSON, callback) {
    // Variable for Mongo DB Connection.
    var db = dbConfig.mongoDbConn;
    // Variable for Logging the messages to the file.
    var logger = log.logger_OMS;

    //Generate order id and insert into db.
    generateOrderId(function(err, id){
      if (err) {
        callback(err);

        // logger.error(TAG + " ERROR : \n" + err.stack);
      } else {
        //Setting the orderId.
        outputJSON.orderEntity.orderInfo.orderNumber = id;

        var orderColl = db.collection('Orders');

        orderColl.insert(outputJSON,
            function(err, result) {
                if (err) {
                  callback(err);
                        // logger.error(TAG + "Error in Order creation. ERROR : \n" + err.stack);
                } else {
                  var message= {
                    status : "Success - Order Created Successfully.",
                    orderId : outputJSON.orderEntity.orderInfo.orderNumber,
                    orderStatus : outputJSON.orderEntity.orderInfo.orderStatus
                  }
                  callback(false, message);
                }
            });
      }
    });


};

//Functin to generate order id
function generateOrderId(callback){
  var db = dbConfig.mongoDbConn;
  db.collection('counters').findAndModify({ _id: 'orderId' },null, { $inc: { seq: 1 } }, {new: true}, function(err, result){
    if (err) {
      callback(err);
    } else {
      callback(false, new Date().getFullYear() + ('00000' + result.value.seq).slice(-6));
    }
  });
}

function sendSupplierNotifications(outputJSON) {
  // Variable for Logging the messages to the file.
  var logger = log.logger_OMS;
    // Send Notifications
    // var db = dbConfig.mongoDbConn;
    // var supplierColl = db.collection('Supplier');
    outputJSON.orderEntity.orderInfo.sellerInfo
        .forEach(function(element) {
          supplierDetails.getSupplierDetails(element.sellerId,
          function(err, code, result){
            if (err) {
              logger.error(TAG + " Seller Data reteival failed with : " + result.message);
            } else {
              // element.primaryEmail = result.supplier.contactInfo.primaryEmail;
              // element.primaryMobile = result.supplier.contactInfo.primaryMobile;
              element.primaryEmail = result.supplier.profileInfo.basicInfo.email;
              element.primaryMobile = result.supplier.profileInfo.basicInfo.mobile;
              if (result.supplier.appInfo) {
                element.cloudTokenID = result.supplier.appInfo.cloudTokenID;
              } else {
                element.cloudTokenID = null;
              }
              //Sending notification to supplier.
              if (outputJSON.orderEntity.orderInfo.orderType == "Credit") {
                supNotifications.supplierCreditOrderNotification(outputJSON, element);
              } else {
                supNotifications.supplierOrderNotification(outputJSON, element);
              }

            }
          },
        true);
            // supplierColl
            //     .findOne({
            //             "supplierEntity.identifier.sellerId": element.sellerId
            //         }, {
            //             "supplierEntity.contactInfo.primaryEmail": 1,
            //             "supplierEntity.contactInfo.primaryMobile": 1,
            //             "supplierEntity.appInfo": 1
            //         },
            //         function(err, result) {
            //             if (!err && result !== null) {
            //                 element.primaryEmail = result.supplierEntity.contactInfo.primaryEmail;
            //                 element.primaryMobile = result.supplierEntity.contactInfo.primaryMobile;
            //                 if (result.supplierEntity.appInfo === undefined) {
            //                     element.cloudTokenID = null;
            //                 } else {
            //                     element.cloudTokenID = result.supplierEntity.appInfo.cloudTokenID;
            //                 }
            //                 //Sending notification to supplier.
            //                 supNotifications.supplierOrderNotification(outputJSON, element);
            //             } else if (!err && result === null) {
            //                 logger.error(TAG + " Seller details for sellerId : " + element.sellerId + " not found. Can't send notifications.");
            //             } else if (err) {
            //                 logger.error(TAG + " Error retriving seller details for sellerId : " + element.sellerId + ". Can't send notifications. Error - \n" + err);
            //             }
            //         });
        });
};

// ____                                  _     ____                  _
// |  _ \ __ _ _   _ _ __ ___   ___ _ __ | |_  / ___|  ___ _ ____   _(_) ___ ___
// | |_) / _` | | | | '_ ` _ \ / _ \ '_ \| __| \___ \ / _ \ '__\ \ / / |/ __/ _ \
// |  __/ (_| | |_| | | | | | |  __/ | | | |_   ___) |  __/ |   \ V /| | (_|  __/
// |_|   \__,_|\__, |_| |_| |_|\___|_| |_|\__| |____/ \___|_|    \_/ |_|\___\___|
//            |___/

function insertOrderPayment(req, callback){

    // Variable for Logging the messages to the file.
    var logger = log.logger_OMS;

    var inputJSON = req.body;

    // Log the request.
    logger.info(TAG_PAYMENT + "Request received for paymentInfo updation. Input : \n" + JSON.stringify(inputJSON));
    // console.log(JSON.stringify(inputJSON));

    //Validating the request
    validation_result = validator.validate(inputJSON, orderPayment);

    var errors = [];
    if (inputJSON.paymentInfo.paymentMode != "Cheque" && inputJSON.paymentInfo.paymentMode != "DD" && inputJSON.paymentInfo.paymentMode != "COD" & (inputJSON.paymentInfo.status == null || inputJSON.paymentInfo.orderStatus != null)) {
      errors.push("status is required and orderStatus should not be there incase of online payments.");
    } else if ((inputJSON.paymentInfo.paymentMode == "Cheque" || inputJSON.paymentInfo.paymentMode == "DD" || inputJSON.paymentInfo.paymentMode == "COD") && (inputJSON.paymentInfo.status == null && inputJSON.paymentInfo.orderStatus == null) ) {
      errors.push("Either status or orderStatus is required in case of offline payments.");
    }


    if (validation_result.errors.length > 0 || errors.length > 0) {

      if (validation_result.errors.length > 0) {
        for (error in validation_result.errors){
          errors.push(validation_result.errors[error].stack);
        }
      }

      var errorMessage = {
        "errorMessage" : "Bad or ill-formed request.",
        "errors" : errors

      };
      resJson = {
          "http_code": 400,
          "message": errorMessage
      };
        callback(true,resJson);
        logger.error(TAG_PAYMENT + "Bad or ill-formed request. \n" + JSON.stringify(errors));
    } else {
      var db = dbConfig.mongoDbConn;

  // earlier query "orderEntity.orderInfo.orderNumber":inputJSON.orderId,"orderEntity.orderInfo.orderStatus":{$in:["OnHold", "Pending"]}
  // "orderEntity.orderInfo.orderStatus":{$in:["OnHold", "Pending"]}
  // ,"orderEntity.orderInfo.sellerInfo":1,"orderEntity.orderInfo.orderStatus":1,"orderEntity.paymentInfo":1
      db.collection('Orders').findOne({"orderEntity.orderInfo.orderNumber":inputJSON.orderId},{"_id":0},function(err, result){

        // This Variable is used only for passing as a parameter to notification.
        var orderJSON = result;

        if (err) {
          resJson = {
              "http_code": 500,
              "message": "Error - Order paymentInfo updation Failed. Please contact engineering team."
          };
            callback(true,resJson);
              logger.error(TAG_PAYMENT + "Error in paymentInfo updation. ERROR : \n" + err.stack);
        }else {
          if (result == null) {
            resJson = {
                "http_code": 404,
                "message": "No document found for orderId : " + inputJSON.orderId
            };
              callback(true,resJson);
            logger.info(TAG_PAYMENT + "No document found for or order already Confirmed for orderId : " + inputJSON.orderId);
          } else {
            var initialStatus = result.orderEntity.orderInfo.orderStatus;
            var initialPaymentStatus = result.orderEntity.paymentInfo.status;
            var newStatus = result.orderEntity.orderInfo.orderStatus;
            var paymentInfo = result.orderEntity.paymentInfo;
            var sendEmail = false;
            if (inputJSON.paymentInfo.paymentMode == "COD" || inputJSON.paymentInfo.paymentMode == "Cheque" || inputJSON.paymentInfo.paymentMode == "DD") {


              if (inputJSON.paymentInfo.status) {
                if (result.orderEntity.paymentInfo.status == 'Pending' && newStatus != 'Failed') {
                  paymentInfo.amountPaid = inputJSON.paymentInfo.status == "Failed" ? 0 : result.orderEntity.orderInfo.orderTotals.grossTotalWithGatewayCharges;
                  paymentInfo.currency = inputJSON.paymentInfo.currency;
                  paymentInfo.status = inputJSON.paymentInfo.status;
                  paymentInfo.paymentMode = inputJSON.paymentInfo.paymentMode;
                  paymentInfo.transactionId = inputJSON.paymentInfo.transactionId;
                }

                if (inputJSON.paymentInfo.status == "Success") {
                  if (result.orderEntity.orderInfo.orderStatus == 'OnHold') {
                    newStatus = "Confirmed";
                    sendEmail = true;
                  }
                  else if (result.orderEntity.orderInfo.orderStatus == 'Failed') {
                    resJson = {
                        "http_code": 400,
                        "message": "Order status is not OnHold"
                    };
                      callback(true,resJson);
                      return;
                  }
                } else if (inputJSON.paymentInfo.status == "Failed") {
                  // paymentInfo.amountPaid = 0;
                  //Kingfisher
                  if (result.orderEntity.orderInfo.orderStatus == 'OnHold') {
                    newStatus = "Failed";
                  }
                  else if (result.orderEntity.orderInfo.orderStatus == 'Failed') {
                    resJson = {
                        "http_code": 400,
                        "message": "Order status is not OnHold"
                    };
                      callback(true,resJson);
                      return;
                  }
                }
              } else if (inputJSON.paymentInfo.orderStatus == "Confirmed") {
                if (result.orderEntity.orderInfo.orderStatus == 'OnHold') {
                  newStatus = "Confirmed";
                  sendEmail = true;
                }else {
                  resJson = {
                      "http_code": 400,
                      "message": "Order status is not OnHold"
                  };
                    callback(true,resJson);
                    return;
                }
              } else if (inputJSON.paymentInfo.orderStatus == "Failed") {
                if (result.orderEntity.orderInfo.orderStatus == 'OnHold') {
                  newStatus = "Failed";
                }else {
                  resJson = {
                      "http_code": 400,
                      "message": "Order status is not OnHold"
                  };
                    callback(true,resJson);
                    return;
                }
              }
            } else if (inputJSON.paymentInfo.status == "Success") {
              if (result.orderEntity.orderInfo.orderStatus == 'Pending') {
                newStatus = "Confirmed";
                sendEmail = true;
                paymentInfo = inputJSON.paymentInfo;
              }else {
                resJson = {
                    "http_code": 400,
                    "message": "Order status is not Pending"
                };
                  callback(true,resJson);
                  return;
              }
            } else if (inputJSON.paymentInfo.status == "Failed") {
              if (result.orderEntity.orderInfo.orderStatus == 'Pending') {
                newStatus = "Failed";
                paymentInfo = inputJSON.paymentInfo;
              }else {
                resJson = {
                    "http_code": 400,
                    "message": "Order status is not Pending"
                };
                  callback(true,resJson);
                  return;
              }
            }
            // updating item status
            if (initialStatus != newStatus) {
              result.orderEntity.orderInfo.sellerInfo.forEach(function(element){
                element.sellerOrderStatus = newStatus;
                element.orderItemInfo.forEach(function(element){
                  element.itemStatus = newStatus;
                });
              });
            }

            var updateDoc = {
              "orderEntity.orderInfo.orderStatus" : newStatus,
              "orderEntity.orderInfo.sellerInfo":result.orderEntity.orderInfo.sellerInfo,
              "orderEntity.paymentInfo" : paymentInfo
            }
            // if (_.isEmpty(paymentInfo) == false) {
            //   updateDoc = {
            //     "orderEntity.orderInfo.orderStatus" : newStatus,
            //     "orderEntity.orderInfo.sellerInfo" : result.orderEntity.orderInfo.sellerInfo,
            //     "orderEntity.paymentInfo" : paymentInfo
            //   }
            //
            // }
            db.collection('Orders').update({"orderEntity.orderInfo.orderNumber":inputJSON.orderId},{$set:updateDoc},function(err, results){
              if (err) {
                resJson = {
                    "http_code": 500,
                    "message": "Error - Order paymentInfo updation Failed. Please contact engineering team."
                };
                  callback(true,resJson);
                    logger.error(TAG_PAYMENT + "Error in paymentInfo updation. ERROR : \n" + err.stack);
              } else {
                if (results.result.n == 0) {
                  resJson = {
                      "http_code": 404,
                      "message": "No document found during update for orderId : " + inputJSON.orderId
                  };
                  callback(true,resJson);
                  logger.info(TAG_PAYMENT + "No document found for orderId : " + inputJSON.orderId);
                } else {
                  resJson = {
                      "http_code": 200,
                      "message": "Payment Info updated successfully for orderId : " + inputJSON.orderId
                  };
                  callback(true,resJson);
                  logger.info(TAG_PAYMENT + "Payment Info updated successfully for orderId : " + inputJSON.orderId);
                  if ((initialStatus != newStatus) || (initialPaymentStatus != paymentInfo.status)) {
                    orderFootprint.addOrderEvent(orderEvent.PAYMENT_UPDATION, inputJSON.orderId, req);
                  }
                  // Send notifications to suppliers
                  if (sendEmail) {
                      sendSupplierNotifications(orderJSON);
                      cusNotifications.customerOrderConfirmationNotification(orderJSON);
                    }
                }
              }
            });
          }
        }
      });
    }
}


exports.insertOrder = insertOrder;
exports.insertOrderPayment = insertOrderPayment;
