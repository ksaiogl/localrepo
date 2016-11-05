/**
 * http://usejsdoc.org/
 */
var express = require('express');
var app = express();
var registration = require('./registration.js');
var temp_registration = require('./temporary_serviceproviderRegistration.js');
var loginService = require('./login.js');
var logoutService = require('./logout.js');
var account = require('./account.js');
var profile = require('./profile.js');
var paymentModes = require('./paymentmodes.js');
var serviceareas = require('./serviceareas.js');
var servicecities = require('./serviceCities.js');
var config = require('./serviceProviderAppConfig.js');
var spExpertise = require('./expertise.js');
var terms = require('./termsandconditions.js');
var website = require('./websiteServiceProviders.js');
var projects = require('./projects.js');
var s3cred = require('./serviceProviders3Credentials.js');
var serviceProviderLeads = require('./serviceProviderLeads.js');
var serviceProviderlatestNotifications = require('./latestNotifications.js');
var basecharges = require('./basecharges.js');
var serviceProviderTypes = require('./serviceProviderTypes.js');
var serviceProviderReg = require('./serviceProviderRegistration.js');


//Post request for Registering the user.
app.post('/api/v1.0/register',function(req,res){
	registration.register(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//Post request for Registering the user.
app.post('/api/v1.0/temp_register',function(req,res){
	temp_registration.register(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//Post request for Login Request.
app.post('/api/v1.0/login',function(req,res){
	loginService.login(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//Post request for Logout Request.
app.post('/api/v1.0/logout',function(req,res){
	logoutService.logout(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//Post request for Forgot Password.
app.post('/api/v1.0/forgotpassword',function(req,res){
	account.forgotPassword(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//Post request for Reset Password.
app.post('/api/v1.0/resetpassword',function(req,res){
	account.resetPassword(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//Post request for Change Password.
app.post('/api/v1.0/changepassword',function(req,res){
	account.changePassword(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//Post request for Update Profile.
app.post('/api/v1.0/updateProfile',function(req,res){
	profile.updateProfile(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//GET request for fetching the payment modes.
app.get('/api/v1.0/paymentmodes',function(req,res){
	paymentModes.fetchPaymentModes(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//POST request for storing the payment information.
app.post('/api/v1.0/storepaymentinfo',function(req,res){
	paymentModes.storePaymentinfo(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//POST request for storing the payment information for cash/dd/cheque.
app.post('/api/v1.0/cash_dd_cheque_storepaymentinfo',function(req,res){
	paymentModes.storecash_ddPaymentinfo(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//POST request for fetching the payment information.
app.post('/api/v1.0/getpaymentinfo',function(req,res){
	paymentModes.getPaymentinfo(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//Post request for fetching the service areas.
app.post('/api/v1.0/serviceareas',function(req,res){
	serviceareas.fetchServiceAreas(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//Post request for fetching the service cities.
app.get('/api/v1.0/servicecities',function(req,res){
	servicecities.getServiceCities(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//GET request for fetching the payment modes.
app.get('/api/v1.0/expertise',function(req,res){
	spExpertise.expertise(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//GET request for fetching the App Config.
app.get('/api/v1.0/loadconfig',function(req,res){
	config.loadconfig(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//Post request for updating the App Info.
app.post('/api/v1.0/updateAppInfo',function(req,res){
	config.updateAppVerAndToken(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//Post request for validating terms.
app.post('/api/v1.0/validateTerms',function(req,res){
	terms.validateTerms(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//GET request for Listing Service Providers for web-site.
app.get('/api/v1.0/listServiceProviders',function(req,res){
	website.listAllServiceProviders(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//GET request for Listing Service Providers for admin web-site whose Quality check has to do yet.
app.get('/api/v1.0/listAllServiceProvidersNotQC',function(req,res){
	website.listAllServiceProvidersNotQC(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//POST request for updating QCVerified flag of Service Provider.
app.post('/api/v1.0/updateQc',function(req,res){
	website.updateServiceProviderQc(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//POST request for updating QCVerified flag of Service Provider to reject also capturing rejecting reason.
app.post('/api/v1.0/qcReject',function(req,res){
	website.serviceProviderQcReject(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//POST request for updating VerificationStatus flag of Service Provider to completed.
app.post('/api/v1.0/updateVerificationStatus',function(req,res){
	website.updateVerificationStatus(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//POST request for updating QCVerified flag of Service Provider to delisted also capturing delisting reason.
app.post('/api/v1.0/qcDelist',function(req,res){
	website.serviceProviderQcdelist(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//GET request for listing Service Provider who are rejected during quality check.
app.get('/api/v1.0/listQcRejected',function(req,res){
	website.listQcRejected(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//GET request for listing Service Provider who are delisted during quality check.
app.get('/api/v1.0/listQcDelisted',function(req,res){
	website.listQcDelisted(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//GET Request for getting Service Provider Types
app.get('/api/v1.0/getServiceProviderTypes',function(req,res){
	serviceProviderTypes.getServiceProviderTypes(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});


//POST Request for inserting Service Provider Details
app.post('/api/v1.0/addServiceProvider',function(req,res){
	serviceProviderReg.addServiceProvider(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});



//CORS for the browser.
app.options('/api/v1.0/listServiceProviders',function(req,res, next){
	res.send({status : 200, data:'CORS'});
});

//CORS for the browser.
app.options('/api/v1.0/listAllServiceProvidersNotQC',function(req,res, next){
	res.send({status : 200, data:'CORS'});
});

//CORS for the browser.
app.options('/api/v1.0/updateQc',function(req,res, next){
	res.send({status : 200, data:'CORS'});
});

//CORS for the browser.
app.options('/api/v1.0/captureDetails',function(req,res, next){
	res.send({status : 200, data:'CORS'});
});

//CORS for the browser.
app.options('/api/v1.0/profileDetails',function(req,res, next){
	res.send({status : 200, data:'CORS'});
});

//CORS for the browser.
app.options('/api/v1.0/qcReject',function(req,res, next){
	res.send({status : 200, data:'CORS'});
});

//CORS for the browser.
app.options('/api/v1.0/updateVerificationStatus',function(req,res, next){
	res.send({status : 200, data:'CORS'});
});

//CORS for the browser.
app.options('/api/v1.0/qcDelist',function(req,res, next){
	res.send({status : 200, data:'CORS'});
});

//CORS for the browser.
app.options('/api/v1.0/listQcRejected',function(req,res, next){
	res.send({status : 200, data:'CORS'});
});

//CORS for the browser.
app.options('/api/v1.0/listQcDelisted',function(req,res, next){
	res.send({status : 200, data:'CORS'});
});

//POST request for capturing the customer Data from web-site.
app.post('/api/v1.0/captureDetails',function(req,res){
	website.captureDetails(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//POST request for fetching the profile details of Service Provider for web-site.
app.post('/api/v1.0/profileDetails',function(req,res){
	website.profileDetails(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//GET request for fetching Service Providers expertise for web-site.
app.get('/api/v1.0/uniqueExpertise',function(req,res){
	website.uniqueExpertise(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//Post request for Adding New Project Details.
app.post('/api/v1.0/addNewProject', function(req,res){
	projects.addProject(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);	
	});
});

//Post request for Updating the Existing Project Details.
app.post('/api/v1.0/updateProject', function(req,res){
	projects.editProject(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);	
	});
});

//Post request for Deleting the Existing Project.
app.post('/api/v1.0/deleteProject', function(req,res){
	projects.deleteProject(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);	
	});
});

//Post request for adding projectids to the Existing Project.
app.post('/api/v1.0/addProjectIds', function(req,res){
	projects.addProjectIds(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);	
	});
});

//POST request for fetching the S3 Credentials.
app.post('/api/v1.0/gets3Credentials',function(req,res){
	s3cred.fetchCredentials(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//POST request for validating the registration OTP.
app.post('/api/v1.0/validateRegisterOTP',function(req,res){
	registration.validateOTP(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//POST request for Resending the OTP.
app.post('/api/v1.0/resendOTP',function(req,res){
	registration.resendOTP(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//POST request for fetching leads of service provider.
app.post('/api/v1.0/serviceProviderLeads',function(req, res){
	serviceProviderLeads.getCustomerDetails(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//POST request for fetching latest notifications of service provider.
app.post('/api/v1.0/latestNotifications',function(req, res){
	serviceProviderlatestNotifications.getNotifications(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//POST request for fetching base charges/surplus charges for registration of service provider.
app.post('/api/v1.0/basecharges',function(req, res){
	basecharges.calculateCharges(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

module.exports = app;
