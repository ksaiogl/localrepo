//This file contains functions that will help in conversions.
var TAG = "Conversions";

var momentTimezone = require('moment-timezone');
var moment = require('moment');
//Function used to convert JavaScript UTC date object to JavaScript IST date object.
exports.toIST = function(UTCDATE){
        var now = momentTimezone();
        now.tz("Asia/Kolkata");
        var timediff = now.utcOffset()/60;
        var ISTDATE = new Date(moment.utc(UTCDATE).add(timediff,'hours').format('YYYY-MM-DD HH:mm'));
        return ISTDATE;
};

//Function used to convert JavaScript IST date object to JavaScript UTC date object.
exports.toUTC = function(ISTDATE){
        var now = momentTimezone();
        now.tz("Asia/Kolkata");
        var timediff = now.utcOffset()/60;
        var UTCDATE =  new Date(moment.utc(ISTDATE).subtract(timediff,'hours').format('YYYY-MM-DD HH:mm'));
        return UTCDATE;
};

//To send it the IST time in Notifications.
//Function used to convert JavaScript UTC date object to JavaScript IST date object to send the timestam in Notifications.
exports.ConvertToIST = function(UTCDATE){

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

//Function to validate date.
exports.validateDate = function(d){
    if ( Object.prototype.toString.call(d) === "[object Date]" ) {
      // it is a date
      if ( isNaN( d.getTime() ) ) {  // d.valueOf() could also work
        // date is not valid
        return false;
      }
      else {
        // date is valid
        return true;
      }
    }
    else {
      // not a date
      return false;
    }
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

//Funciton that will get string representation ["mm/dd/yyy"] of date object.
exports.convertDatetoString =  function(dateObj) {
  function pad(s) { return (s < 10) ? '0' + s : s; }
  var d = new Date(dateObj);
  return [pad(d.getMonth()+1), pad(d.getDate()), d.getFullYear()].join('/');
}