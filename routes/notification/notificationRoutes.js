//Notification API's: 
var express = require('express');
var emailNotify = require('./sendNotification.js');
var app = express();

//Post request for registering the supplier.
app.post('/api/v1.0/sendNotification',function(req,res){
	emailNotify.sendEmailAndSMSNotification(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

module.exports = app;