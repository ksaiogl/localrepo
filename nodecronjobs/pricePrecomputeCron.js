var TAG = " pricePrecomputeCronJob - ";

var log = require('../Environment/log4js.js');
var CronJob = require('cron').CronJob;
var pricing = require('../routes/priceComputation/priceComputationService.js');
var dbConfig = require('../Environment/mongoDatabase.js');

// 00 00 19 * * *
// */2 * * * * *
var pricingCron = new CronJob('00 00 01 * * *',
function() {
  var logger = log.logger_productPricing;
  var runDate = new Date();
  logger.info(TAG + "Running Cron : " + new Date());

  runDate.setHours(0, 0, 0, 0);

  var db = dbConfig.mongoDbConn;
  db.collection('cronStats').findOne({"cronName":"pricingCron", "lastRunTime":runDate},{}, function(err, result){
    if (err) {
      logger.error(TAG + "Cron failed with err : \n" + err.stack);
    } else {
      // console.log(result);
      if (result) {
        logger.info(TAG + "Cron already completed for : " + runDate);
      }else {
        var callback = function(err, stat){
          if (err) {
            logger.error(TAG + "Cron failed with err : \n" + err.stack);
          } else {
            db.collection('cronStats').update({"cronName":"pricingCron"},{"$set":{"cronName":"pricingCron","lastRunTime":runDate,"stat":stat}},{"upsert":true});
            logger.info(TAG + "Cron completed successfully. Stat : " + JSON.stringify(stat));
          }
        };
        pricing.calculateMinProductPrice("" ,callback);
      }
    }
  });


  // console.log("Start");
}
,
null,
true,
'Asia/Calcutta'
);




// pricingCron.start();
