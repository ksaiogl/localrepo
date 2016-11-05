exports.getNotificationEmails = function(env){
  if (env === 'prd') {
    // return "<soumya@msupply.com>";
    return "<niraj@msupply.com>, <kapil@msupply.com>, <arunprasath@msupply.com>, <ashok@msupply.com>, <ashwini@msupply.com>, <aurobindo@msupply.com>, <soumya@msupply.com>, <sanjayj@msupply.com>, <ankit@msupply.com>, <anish@msupply.com>, <debasis@msupply.com>" ;
  } else if(env === 'stg' || env === 'dev' || env === 'loc') {
    return "<soumya@msupply.com>";
  }
}

exports.fromEmail = "support@msupply.com";

exports.emailsubjectPricingCronFailedSku = "Pricing Cron Failed SKU report for : ";

exports.emailBodyPricingCronFailedSku = "Hi All, <br><br> PFA the failed sku report.<br>Pricing cron was run for $skus skus.<br><br>Regards,<br>mSupply Support.";
