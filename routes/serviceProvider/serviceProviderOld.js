/**
 * http://usejsdoc.org/
 */
var express = require('express');
var app = express();
var registration = require('./registration.js');
var loginService = require('./login.js');
var account = require('./account.js');
var profile = require('./profile.js');
var paymentModes = require('./paymentmodes.js');
var serviceareas = require('./serviceareas.js');
var config = require('./serviceProviderAppConfig.js');
var spExpertise = require('./expertise.js');

//Post request for Registering the user.
app.post('/register',function(req,res){
	registration.register(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//Post request for Login Request.
app.post('/login',function(req,res){
	loginService.login(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//Post request for Forgot Password.
app.post('/forgotpassword',function(req,res){
	account.forgotPassword(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//Post request for Reset Password.
app.post('/resetpassword',function(req,res){
	account.resetPassword(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//Post request for Change Password.
app.post('/changepassword',function(req,res){
	account.changePassword(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//Post request for Update Profile.
app.post('/updateProfile',function(req,res){
	profile.updateProfile(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//GET request for fetching the payment modes.
app.get('/paymentmodes',function(req,res){
	paymentModes.fetchPaymentModes(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//Post request for fetching the service areas.
app.post('/serviceareas',function(req,res){
	serviceareas.fetchServiceAreas(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//GET request for fetching the payment modes.
app.get('/expertise',function(req,res){
	spExpertise.expertise(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//Post request for fetching the App Config.
app.get('/loadconfig',function(req,res){
	config.loadconfig(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//Post request for updating the App Info.
app.post('/updateAppInfo',function(req,res){
	config.updateAppVerAndToken(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

module.exports = app;