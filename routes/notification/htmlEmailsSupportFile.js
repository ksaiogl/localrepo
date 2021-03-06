//constant values that are used in html files both in supplier and service provider will be defined here.
var log = require('../../Environment/log4js.js');
var momentTimezone = require('moment-timezone');
var moment = require('moment');

var generic_values = {
  "support_email": "support@msupply.com",
  "supplier_support_email": "suppliersupport@msupply.com",
  "customer_support_email": "customersupport@msupply.com",
  "support_contactnumber": "18004199555",
  "office_address": "#117, 27th Main, HSR Layout, Sector-2, Next to NIFT, Bangalore-560102, Karnataka, India",
  "website_url": "www.msupply.com"
}

exports.generic_values = generic_values;
// To check if the number is a Number or integer.
exports.isNumber = function isNumber(input, callback){
  var logger = log.logger_notification;
  try
  { 
    return(!isNaN(input));
  }
  catch(e)
  {
    console.log("Exception in isNumber function - " + e);
    logger.error("Exception in isNumber function- :- error :" + e);
    return callback(false);
  }
};

//To send it the IST time in Notifications.
//Function used to convert JavaScript UTC date object to JavaScript IST date object to send the timestam in Notifications.
exports.ConvertToIST = function ConvertToIST (UTCDATE){

    var now = momentTimezone();
    now.tz("Asia/Kolkata");
    var timediff = now.utcOffset()/60;
    var ISTDATE = new Date(moment.utc(UTCDATE).add(timediff,'hours').format('YYYY-MM-DD HH:mm:ss'));
    
    var monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    //Handling cases where hours, minutes, seconds are less than 10, where getHours(), getMinutes(), getSeconds() will return value as single digit.
    var time = (ISTDATE.getHours()<10?'0':'') + ISTDATE.getHours()+':'+(ISTDATE.getMinutes()<10?'0':'') + ISTDATE.getMinutes()+':'+(ISTDATE.getSeconds()<10?'0':'') +ISTDATE.getSeconds();
    var date = monthNames[ISTDATE.getMonth()]+' '+ISTDATE.getDate()+', '+ISTDATE.getFullYear()+' at '+formatTime(tConvert(time));
    return date;
};

//Function that will convert hours from 24 hour format to 12 hour format.
function tConvert (time) {
  // Check correct time format and split into components
  time = time.toString ().match (/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];

  if (time.length > 1) { // If time format correct
    time = time.slice (1);  // Remove full string match value
    time[5] = +time[0] < 12 ? 'AM' : 'PM'; // Set AM/PM
    time[0] = +time[0] % 12 || 12; // Adjust hours
  }

  return time.join (''); // return adjusted time or original string
}

//Function that will remove seconds part of time value returned from function tConvert.
function formatTime(time){
  var res = time.split(":");

  if(res.length > 2){
    if(res[2].indexOf('AM') >= 0){
      return res[0]+':'+res[1]+' AM';
    }
    else{
      return res[0]+':'+res[1]+' PM';
    }
  }
  
  return time;
}

//Function used to convert JavaScript UTC date object to JavaScript IST date object.
exports.toIST = function(UTCDATE){
        var now = momentTimezone();
        now.tz("Asia/Kolkata");
        var timediff = now.utcOffset()/60;
        var ISTDATE = new Date(moment.utc(UTCDATE).add(timediff,'hours').format('YYYY-MM-DD HH:mm'));
        return ISTDATE;
};
