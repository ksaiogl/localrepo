var TAG = "--- OrderEvent ---    ";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var orderEvents = require('./orderEvents').orderEvents;
var timeConversion = require('../helpers/timezoneConversions.js');

exports.getOrderEvent = function(orderId, callback){
  var logger = log.logger_OMS;
  var db = dbConfig.mongoDbConn;
  var orderEventColl = db.collection('OrderEvents');
  orderEventColl.find({'orderId' : orderId}, {"_id":0}).toArray(function(err, result){
    if (err) {
      callback(err);
      logger.error("Error retriving events for order : " + orderId + ". Error : \n" + err.stack);
    } else {
      if (result[0]) {
        result[0].events.forEach(function(element){
          element.eventAt = timeConversion.toIST(element.eventAt);
        });
        callback(false, result[0]);
      } else {
        callback(true);
      }
    }
  });
}

exports.addOrderEvent = function(event, orderId, req, callback){
  var logger = log.logger_OMS;
  switch (event) {
    case orderEvents.CREATION : {
      logOrderCreation(event, orderId, req);
      break;
    }
    case orderEvents.PAYMENT_UPDATION : {
      logPaymentUpdation(event, orderId, req);
      break;
    }
    case orderEvents.ORDER_UPDATION : {
      logOrderUpdation(event, orderId, req);
      break;
    }
    case orderEvents.COMMENT : {
      logOrderComment(event, orderId, req, callback);
      break;
    }
    default: logger.error("Unregonised Event : " + event);
  }
}

function logOrderCreation(event, orderId, req){
  var logger = log.logger_OMS;
  var eventObj = {
    eventType : orderEvents.get(event).value,
    eventAt : new Date(),
    eventBy : req.user ? req.user.email : 'SYSTEM',
    eventComment : '',
    eventDesc : 'Order created from ' + req.body.orderInfo.orderPlatform
  }
  //Inserting event in DB
  insertEvent(eventObj, orderId);
}

function logPaymentUpdation(event, orderId, req){
  var logger = log.logger_OMS;
  var eventObj = {
    eventType : orderEvents.get(event).value,
    eventAt : new Date(),
    eventBy : req.user ? req.user.email : 'SYSTEM',
    eventComment : '',
    eventDesc : req.body.paymentInfo.status ? ('Payment status updated : ' + req.body.paymentInfo.status) : req.body.paymentInfo.orderStatus ? ('Order status updated : ' + req.body.paymentInfo.orderStatus) : ''
  }
  //Inserting event in DB
  insertEvent(eventObj, orderId);
}

function logOrderUpdation(event, orderId, req){
  var logger = log.logger_OMS;
  var eventObj = {
    eventType : orderEvents.get(event).value,
    eventAt : new Date(),
    eventBy : req.user ? req.user.email : 'Supplier',
    eventComment : '',
    eventDesc : ''
  }

  var changedStatus = req.body.updateOrderItem[0].status;
  var skus = [];
  req.body.updateOrderItem.forEach(function(element){
    skus.push(element.skuid);
  });
  if (req.body.orderLevelUpdation && changedStatus == 'Cancelled' ) {
    eventObj.eventDesc = 'Order Cancelled for skus : ' + skus.toString() + ' for supplier : ' + req.body.sellerId;
  } else {
    eventObj.eventDesc = 'Item status changed to ' + changedStatus + ' for skus : ' + skus.toString() + ' for supplier ' + req.body.sellerId + '.';
  }

  //Inserting event in DB
  insertEvent(eventObj, orderId);
}


function logOrderComment(event, orderId, req, callback){
  var logger = log.logger_OMS;
  var eventObj = {
    eventType : orderEvents.get(event).value,
    eventAt : new Date(),
    eventBy : req.user.email,
    eventComment : req.body.comment,
    eventDesc : 'Comment posted'
  }
  //Inserting event in DB
  insertEvent(eventObj, orderId, callback);
}


function insertEvent(eventObj, orderId, callback){
  var logger = log.logger_OMS;
  var db = dbConfig.mongoDbConn;
  var orderEventColl = db.collection('OrderEvents');
  orderEventColl.update(
    {'orderId' : orderId},
    {$push:{
      'events' : {
        $each:[eventObj],
        $sort : {'eventAt':-1}
      }
    }
  },
     {upsert : true},
      function(err, result){
      if (err) {
        logger.error("Error inserting event in DB. Error : \n", err.stack);
        if (callback) {
          callback(err);
        }
      } else {
        logger.info("Event successfully inserted in DB.");
        if (callback) {
          callback(err);
        }
      }
  });
}
