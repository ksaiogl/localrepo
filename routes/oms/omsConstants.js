exports.fromEmail = "support@msupply.com";

// exports.emailsubjectPasswordReset = "Password reset for OMS Internal Admin Panel";
//
// exports.emailsubjectNewRegistration = "OMS Internal Admin Panel Account Details";
//
// exports.bodyTextPasswordReset = "Hi $NAME, <br><br> Your Password for OMS Internal Admin Panel has been reset to : $PASSWORD <br> <br>Plese login with the new password. You will be asked to change the passord on first login. <br><br>OMS Url : http://52.19.234.4/msupply.in/mSupplyInternalPanel/login.html<br><br>Regards,<br>mSupply Support.";
//
// exports.bodyNewRegistration = "Hi $NAME, <br><br> Your OMS Internal Admin Panel account has been created. <br><br>UserName : $USER <br>Password : $PASSWORD <br> <br>You will be asked to change the passord on first login. <br><br>OMS Url : http://52.19.234.4/msupply.in/mSupplyInternalPanel/login.html<br><br>Regards,<br>mSupply Support.";


exports.emailsubjectPasswordReset = function (env){
  if (env === 'prd') {
    return "Password reset for OMS Internal Admin Panel";
  } else {
    return "Password reset for OMS Internal Admin Panel - Staging";
  }
}



exports.emailsubjectNewRegistration = function (env){
  if (env === 'prd') {
    return "OMS Internal Admin Panel Account Details";
  } else {
    return "OMS Internal Admin Panel Account Details - Staging";
  }
}



exports.bodyNewRegistration = function (env){
  if (env === 'prd') {
    return "Hi $NAME, <br><br> Your OMS Internal Admin Panel account has been created. <br><br>UserName : $USER <br>Password : $PASSWORD <br> <br>You will be asked to change the password on first login. <br><br>OMS Url : http://52.19.234.4/msupply.in/mSupplyInternalPanel/login.html<br><br>Regards,<br>mSupply Support.";
  } if (env === 'stg') {
    return "Hi $NAME, <br><br> Your OMS Internal Admin Panel account has been created. <br><br>UserName : $USER <br>Password : $PASSWORD <br> <br>You will be asked to change the password on first login. <br><br>OMS Url : http://52.19.234.4/msupply.in/mSupplyAdminStaging/login.html<br><br>Regards,<br>mSupply Support.";
  } if (env === 'dev') {
    return "Hi $NAME, <br><br> Your OMS Internal Admin Panel account has been created. <br><br>UserName : $USER <br>Password : $PASSWORD <br> <br>You will be asked to change the password on first login. <br><br>OMS Url : http://52.19.234.4/msupply.in/mSupplyAdminDev/login.html<br><br>Regards,<br>mSupply Support.";
  }
}



exports.bodyTextPasswordReset = function (env){
  if (env === 'prd') {
    return "Hi $NAME, <br><br> Your Password for OMS Internal Admin Panel has been reset to : $PASSWORD <br> <br>Plese login with the new password. You will be asked to change the password on first login. <br><br>OMS Url : http://52.19.234.4/msupply.in/mSupplyInternalPanel/login.html<br><br>Regards,<br>mSupply Support.";
  } if (env === 'stg') {
    return "Hi $NAME, <br><br> Your Password for OMS Internal Admin Panel has been reset to : $PASSWORD <br> <br>Plese login with the new password. You will be asked to change the password on first login. <br><br>OMS Url : http://52.19.234.4/msupply.in/mSupplyAdminStaging/login.html<br><br>Regards,<br>mSupply Support.";
  } if (env === 'dev') {
    return "Hi $NAME, <br><br> Your Password for OMS Internal Admin Panel has been reset to : $PASSWORD <br> <br>Plese login with the new password. You will be asked to change the password on first login. <br><br>OMS Url : http://52.19.234.4/msupply.in/mSupplyAdminDev/login.html<br><br>Regards,<br>mSupply Support.";
  }
}

exports.getSercetKeyToken = function (env){
  if (env === 'prd') {
    return "M5upp1yAdm1nPan3lS3cr3tK3y";
  } else {
    return "M5upp1yAdm1nPan31S3cr3tK3yStag1ng";
  }
}
