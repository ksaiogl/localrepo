/**
 * New node file
 */
var express = require('express');
var app = express();
var sellerRegistration = require('./sellerRegistration.js');
var sellerVerify = require('./sellerVerify.js');
var sellerProfile = require('./sellerProfile.js');
var path = require('path');
var sellerVerificationSceta = require('./sellerVerificationSceta.js');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart({uploadDir: '/usr/NodeJslogs/rfqdocs' });
var sellerCRM = require('./sellerCRM.js');
var generateSellerMasterID = require('./generateSellerMasterID.js');
var supplierLeadsLoader = require('./supplierLeadsLoaderRevised.js');
var sellerLeadsLoader = require('./sellerLeadsLoader.js');

//post request for registering the seller.
app.post('/api/v1.0/registerSeller', function(req, res){
	sellerRegistration.register(req, function(err, regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//post request for Validating the OTP for registration.
app.post('/api/v1.0/validateOTP', function(req, res){
	sellerRegistration.validateOTP(req, function(err, regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//post request for regenerating the OTP for registration.
app.post('/api/v1.0/regenerateOTP', function(req, res){
	sellerRegistration.regenerateOTP(req, function(err, regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//Get request for Validating the User Id for registration.
app.get('/api/v1.0/validateUserID/:userId', function(req, res){
	sellerRegistration.validateUserId(req, function(err, regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

/*** Verify email based on token **/
app.get('/api/v1.0/verifyMail/:email/:token', function(req, res){
	sellerVerify.verifyMail(req.params, function(err, regres){	
		res.statusCode =  regres.http_code;
		res.json(regres);
		// if(status.http_code == 200 && status.message == 'Email verification Successful.'){
		// 	res.sendFile(path.join(__dirname +  '/../../public/email_verified.html'));
		// }
		// else if(status.http_code == 200 && status.message == 'Email already verified'){
		// 	res.sendFile(path.join(__dirname +  '/../../public/email_already_verified.html'));
		// }
		// else if(status.http_code == 400 || status.http_code == 500){
		// 	res.sendFile(path.join(__dirname +  '/../../public/email_not_verified.html'));
		// }
		// var body = '<div style="width:50%;margin: 0 auto;padding:15px;border:1px solid #ccc"><h1>mSupply.com</h1><h2>'+status.message+'</h2></div>';
		// res.writeHead(200,{"Content-Type" : "text/html"});
		// res.write(body);
		// res.end();
	});
});

/*** Update seller Details ***/
app.post('/api/v1.0/addBasicInfo', multipartMiddleware, function(req, res){
	if(req.body.supplierSession) {
		try{
			req.body.supplierSession = JSON.parse(req.body.supplierSession);
		}catch(e){
			req.body.supplierSession = req.body.supplierSession;
		}
		sellerProfile.updateSellerDetails(req, function(err, regres){
			res.statusCode =  regres.http_code;
			res.json(regres);
		});
	}else{
		var regres = {
			"http_code": 401,
			"message": "No active session found."
		};
		res.statusCode =  regres.http_code;
		res.json(regres);
	}	
});

//post request for Adding Financial Data.
app.post('/api/v1.0/addFinancialData', multipartMiddleware, function(req, res){
	if(req.body.supplierSession) {
		try{
			req.body.supplierSession = JSON.parse(req.body.supplierSession);
		}catch(e){
			req.body.supplierSession = req.body.supplierSession;
		}
		sellerProfile.addFinancialInfo(req, function(err, regres){
			res.statusCode =  regres.http_code;
			res.json(regres);
		});
	}else{
		var regres = {
			"http_code": 401,
			"message": "No active session found."
		};
		res.statusCode =  regres.http_code;
		res.json(regres);
	}	
});

//post request for Adding Enquiry and Category Data.
app.post('/api/v1.0/addFullfilmentDetails', function(req, res){
	if(req.body.supplierSession) {
		try{
			req.body.supplierSession = JSON.parse(req.body.supplierSession);
		}catch(e){
			req.body.supplierSession = req.body.supplierSession;
		}
		sellerProfile.addEnquiryAndCategoryInfo(req, function(err, regres){
			res.statusCode =  regres.http_code;
			res.json(regres);
		});
	}else{
		var regres = {
			"http_code": 401,
			"message": "No active session found."
		};
		res.statusCode =  regres.http_code;
		res.json(regres);
	}	
});

//post request for Adding other details Data.
app.post('/api/v1.0/addBusinessDetails', multipartMiddleware, function(req, res){
	if(req.body.supplierSession) {
		try{
			req.body.supplierSession = JSON.parse(req.body.supplierSession);
		}catch(e){
			req.body.supplierSession = req.body.supplierSession;
		}
		sellerProfile.addBusinessInfo(req, function(err, regres){
			res.statusCode =  regres.http_code;
			res.json(regres);
		});
	}else{
		var regres = {
			"http_code": 401,
			"message": "No active session found."
		};
		res.statusCode =  regres.http_code;
		res.json(regres);
	}	
});

//post request for Searching the Seller for Internal Panel.
app.post('/api/v1.0/searchSeller', function(req, res){
	sellerVerificationSceta.searchSeller(req, function(err, regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//post request for fetching the seller Details.
app.post('/api/v1.0/fetchSellerDetails', function(req, res){
	sellerVerificationSceta.fetchSellerDetails(req, function(err, regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//post request for Approving the seller Details.
app.post('/api/v1.0/approveSeller', function(req, res){
	sellerVerificationSceta.approveSeller(req, function(err, regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//post request for rejecting the seller Details.
app.post('/api/v1.0/rejectSeller', function(req, res){
	sellerVerificationSceta.rejectSeller(req, function(err, regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//Post request for fetching seller lead details - CRM.
app.post('/api/v1.0/fetchSellerLeads', function(req, res){
	sellerCRM.fetchSellerLeads(req, function(err, regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//Post request for updating seller lead details - CRM.
app.post('/api/v1.0/updateSellerLeadDetails', function(req, res){
	sellerCRM.updateSellerLeadDetails(req, function(err, regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//Post request for CRM's Action on rejecting Seller Lead Entity.
app.post('/api/v1.0/rejectSellerLead', function(req, res){
	sellerCRM.rejectSellerLead(req, function(err, regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//Post request for CRM's Action on approving Seller Lead Entity.
app.post('/api/v1.0/approveSellerLead', function(req, res){
	sellerCRM.approveSellerLead(req, function(err, regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//Post request for generating Seller Master Id.
app.post('/api/v1.0/generateSellerMasterID', function(req, res){
	generateSellerMasterID.generateSellerMasterIDService(req, function(err, regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//Post request for adding Seller to SellerMaster by OMS.
app.post('/api/v1.0/addSellerOMS', function(req, res){
	sellerCRM.addSellerOMS(req, function(err, regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//Post request for fetching Seller Company Name from SellerMaster by OMS.
app.post('/api/v1.0/fetchCompanyName', function(req, res){
	sellerCRM.fetchCompanyName(req, function(err, regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//SupplierLeads loader for RFQ suppliers
app.post('/api/v1.0/supplierLeadsLoader', function(req, res){
	supplierLeadsLoader.loadLeadData(req, function(err, regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//SellerLeads loader for Seller Collection
app.post('/api/v1.0/sellerLeadsLoader', function(req, res){
	sellerLeadsLoader.loadLeadData(req, function(err, regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

// Send verify Email to seller from OMS / supplier panel..
app.post('/api/v1.0/sendVerifyMail', function(req, res){
	if(req.body.supplierSession){
		sellerVerify.sendVerifyEmail(req, function(err, regres){
			res.statusCode =  regres.http_code;
			res.json(regres);
		});
	}else{
		var regres = {
			"http_code": 401,
			"message": "No active session found."
		};
		res.statusCode =  regres.http_code;
		res.json(regres);
	}	
});
module.exports = app;