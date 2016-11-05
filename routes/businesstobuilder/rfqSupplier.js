
/**
 * New node file
 */
var express = require('express');
var app = express();

var supplierLogin = require('./login.js');
var floatInquiry = require('./floatInquiry.js');
var sellerInquirySummary = require('./sellerInquirySummary.js');
var inquiryDetailsForFloat = require('./inquiryDetailsForFloat.js');
var sellerInquiryNotifications = require('./sellerInquiryNotifications.js');
var InquiryFilters = require('./inquiryFilters.js');
var inquiryViewDetails = require('./inquiryViewDetails.js');
var inquiryViewQuotations = require('./inquiryViewQuotations.js');
var submitQuotation = require('./submitQuotation.js');
var supplierDashboardStatistics = require('./supplierDashboardStatistics.js');
var createStructuredInquiry = require('./createStructuredInquiry.js');
var quotationMaster = require('./quotationMaster.js');
var updateSellerQuotationStatus = require('./updateSellerQuotationStatus.js');
var approveInquiryFloat = require('./approveInquiryFloat.js');
var listAllInquiries = require('./listInquiry.js');

var masterQuotationReport = require('./masterQuotationReport.js');
var RFQPurchaseMangersCities = require('./RFQPurchaseMangersCities.js');

var masterQuotationV2 = require('./masterQuotation_V2.js');
var masterQuotationReport_V2 = require('./masterQuotationReport_V2.js');
var quoteComparative = require('./quoteComparative.js');
var magentoApi = require('../magento/magentoAPI.js');


//New Authentication services
//var auth = require('./auth.js');
//#################### Routes for Supplier Web Pannel ###########//

//post request for login by supplier.
app.post('/api/v1.0/supplierlogin', function(req, res){
 	supplierLogin.login(req, function(err, regres){
 		res.statusCode =  regres.http_code;
 		req.body.supplierSession  = regres.message;
 		res.json(regres);
 	});
});

// Get Supplier Details....
app.post('/api/v1.0/getSupplierDetails', function(req,res){
	supplierLogin.getDetails(req, function(err, regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

/*
app.post('/api/v1.0/supplierlogin', function(req, res){
	auth.authenticateUser(req, function(err, regres){
		res.statusCode =  regres.http_code;
		req.body.supplierSession  = regres.message;
		res.json(regres);
	});
});*/

/*
//post request for otp to change password by supplier.
app.post('/api/v1.0/supplierforgotpassword', function(req, res){
	auth.forgotPassword(req, function(err, regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});*/

// app.get('/api/v1.0/supplierlogout', function(req, res){
// 	if(req.body.supplierSession) {
// 		req.session.destroy(function(){
// 			var regres = {
// 				"http_code": 200,
// 				"message": "User logged out successfully."
// 			};
// 			res.statusCode =  regres.http_code;
// 			res.json(regres);
// 		});
// 	} else {
// 		var regres = {
// 			"http_code": 401,
// 			"message": "No active session found."
// 		};
// 		res.statusCode =  regres.http_code;
// 		res.json(regres);
// 	}
// });

//post request for otp to change password by supplier.
app.get('/api/v1.0/supplierforgotpassword/:userId', function(req, res){
	supplierLogin.forgotPassword(req, function(err, regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});	
});
// Verify the forgot password token
app.post('/api/v1.0/verifyToken', function(req, res){
	supplierLogin.verifyToken(req, function(err, regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

// //post request for reset password by supplier.
// app.post('/api/v1.0/supplierresetpassword', function(req, res){
// 	supplierLogin.resetPassword(req, function(err, regres){
// 		res.statusCode =  regres.http_code;
// 		res.json(regres);
// 	});
// });

/*
//post request for reset password by supplier.
app.post('/api/v1.0/supplierresetpassword', function(req, res){
	auth.resetPassword(req, function(err, regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});
*/

//post request for change password by supplier.
app.post('/api/v1.0/supplierchangepassword', function(req, res){
	if(req.body.supplierSession) 
	{
		supplierLogin.changePassword(req, function(err, regres){
			res.statusCode =  regres.http_code;
			res.json(regres);
		});
	}
	else 
	{
		var regres = {
			"http_code": 401,
			"message": "No active session found."
		};
		res.statusCode =  regres.http_code;
		res.json(regres);
	}	
});

//post request for change password by supplier.
app.post('/api/v1.0/updateSupplierTerms', function(req, res){
    if(req.body.supplierSession) 
	{
	    supplierLogin.updateSupplierTerms(req, function(err, regres){
	        res.statusCode =  regres.http_code;
	        res.json(regres);
	    });
	}
	else 
	{
		var regres = {
			"http_code": 401,
			"message": "No active session found."
		};
		res.statusCode =  regres.http_code;
		res.json(regres);
	}    
});

/*
//post request for change password by supplier.
app.post('/api/v1.0/supplierchangepassword', function(req, res){
	if(req.body.supplierSession) {
		auth.changePassword(req, function(err, regres){
			res.statusCode =  regres.http_code;
			res.json(regres);
		});
	} else {
		var regres = {
			"http_code": 400,
			"message": "No active session found."
		};
		res.statusCode =  regres.http_code;
		res.json(regres);
	}
});
*/

//Post request for floating Inquiry to all suppliers.
app.post('/api/v1.0/floatInquiryToSuppliers',function(req,res){
	floatInquiry.floatInquiryToSuppliers(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//Post request for inquiry Seller Summary.
app.post('/api/v1.0/sellerInquirySummary',function(req,res){
	if(req.body.supplierSession) 
	{
		sellerInquirySummary.inquirySummary(req, function(err,regres){
			res.statusCode =  regres.http_code;
			res.json(regres);
		});
	}
	else 
	{
		var regres = {
			"http_code": 401,
			"message": "No active session found."
		};
		res.statusCode =  regres.http_code;
		res.json(regres);
	}	
});

//Post request for Create Seller Notifications for Inquiry
app.post('/api/v1.0/insertSellerInquiryNotifications',function(req,res){
    sellerInquiryNotifications.sellerNotifications(req, function(err,regres){
        res.statusCode =  regres.http_code;
        res.json(regres);
    });
});

//Post request for fetching Seller Notifications for Inquiry
app.post('/api/v1.0/fetchSellerInquiryNotifications',function(req,res){
    sellerInquiryNotifications.fetchSellerNotifyNew(req, function(err,regres){
        res.statusCode =  regres.http_code;
        res.json(regres);
    });
});

//Get request for fetching Filters for sellers
app.get('/api/v1.0/fetchInquiryListFilters',function(req,res){
    InquiryFilters.fetchInquiryFilters(req,function(err,regres){
        res.statusCode =  regres.http_code;
        res.json(regres);
    });
});

//Post request for Inquiry Structure Details
app.post('/api/v1.0/fetchInquiryDetailsForFloat',function(req,res){
	inquiryDetailsForFloat.inquiryDetailsForSupplierFloat(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});


//Post request for inquiry View Details
app.post('/api/v1.0/inquiryViewDetails',function(req,res){
	if(req.body.supplierSession) 
	{
		inquiryViewDetails.fetchInquiryViewDetails(req, function(err,regres){
			res.statusCode =  regres.http_code;
			res.json(regres);
		});
	}
	else 
	{
		var regres = {
			"http_code": 401,
			"message": "No active session found."
		};
		res.statusCode =  regres.http_code;
		res.json(regres);
	}	
});

//Post request for fetch Inquiry Quotations
app.post('/api/v1.0/inquiryViewQuotations',function(req,res){
	if(req.body.supplierSession) 
	{
	    inquiryViewQuotations.fetchInquiryQuotations(req, function(err,regres){
	        res.statusCode =  regres.http_code;
	        res.json(regres);
	    });
	}
	else 
	{
		var regres = {
			"http_code": 401,
			"message": "No active session found."
		};
		res.statusCode =  regres.http_code;
		res.json(regres);
	}    
});

//Post request for fetch Inquiry Quotations
app.post('/api/v1.0/submitQuotation',function(req,res){
	if(req.body.supplierSession) 
	{
	    submitQuotation.insertQuotation(req, function(err,regres){
	        res.statusCode =  regres.http_code;
	        res.json(regres);
	    });
	}
	else 
	{
		var regres = {
			"http_code": 401,
			"message": "No active session found."
		};
		res.statusCode =  regres.http_code;
		res.json(regres);
	}    
});

//Post request for fetch supplier dashboard statistics
app.post('/api/v1.0/supplierDashboardStatistics',function(req,res){
	if(req.body.supplierSession) 
	{
	    supplierDashboardStatistics.fetchSupplierDashboardStatistics(req, function(err,regres){
	        res.statusCode =  regres.http_code;
	        res.json(regres);
	    });
	}
	else 
	{
		var regres = {
			"http_code": 401,
			"message": "No active session found."
		};
		res.statusCode =  regres.http_code;
		res.json(regres);
	}    
});

//Post request to create structured inquiry.
app.post('/api/v1.0/createInquiry',function(req,res){
    createStructuredInquiry.structureEnquiry(req, function(err,regres){
        res.statusCode =  regres.http_code;
        res.json(regres);
    });
});

//Post request to fetch Quotation Master.
app.post('/api/v1.0/fetchQuotationMaster',function(req,res){
    quotationMaster.fetchQuotationMaster(req, function(err,regres){
        res.statusCode =  regres.http_code;
        res.json(regres);
    });
});

//Post request to create structured inquiry.
app.post('/api/v1.0/updateSellerQuotationStatus',function(req,res){
	if(req.body.supplierSession) 
	{
	    updateSellerQuotationStatus.updateQuotationStatus(req, function(err,regres){
	        res.statusCode =  regres.http_code;
	        res.json(regres);
	    });
	}
	else 
	{
		var regres = {
			"http_code": 401,
			"message": "No active session found."
		};
		res.statusCode =  regres.http_code;
		res.json(regres);
	}    
});

//Post request approve Supplier Float.
app.post('/api/v1.0/approveInquiryFloat',function(req,res){
    approveInquiryFloat.approveFloat(req, function(err,regres){
        res.statusCode =  regres.http_code;
        res.json(regres);
    });
});
//Post request for listing all inquiries irrespective of sellers.
app.post('/api/v1.0/listAllInquiry',function(req,res){
	listAllInquiries.listInquiry(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//Post request for listing all inquiries irrespective of sellers.
app.post('/api/v1.0/getMasterQuotationReport',function(req,res){
    masterQuotationReport.getMasterQuotationReport(req,res);
});

//Post request for listing all inquiries irrespective of sellers.
app.get('/api/v1.0/getRFQPurchaseMangersCities',function(req,res){
    RFQPurchaseMangersCities.getRFQPurchaseMangersCities(req, function(err,regres){
        res.statusCode =  regres.http_code;
        res.json(regres);
    });
});

//Post request for listing all inquiries irrespective of sellers.
app.post('/api/v1.0/fetchMasterQuotationV2',function(req,res){
    masterQuotationV2.fetchQuotationMaster(req, function(err,regres){
        res.statusCode =  regres.http_code;
        res.json(regres);
    });
});

//Post request for listing all inquiries irrespective of sellers.
app.post('/api/v1.0/masterQuotationReportV2',function(req,res){
    masterQuotationReport_V2.getMasterQuotationReport(req,res);
});

//Post request for listing all inquiries irrespective of sellers.
app.post('/api/v1.0/fetchQuoteComparative',function(req,res){
    quoteComparative.fetchQuoteComparative(req, function(err,regres){
        res.statusCode =  regres.http_code;
        res.json(regres);
    });
});

//Post request to create structured inquiry.
app.post('/api/v1.0/getUserDetails',function(req,res){
    if(req.body.supplierSession)
    {
        magentoApi.getDetailsOfCustomerFromMagento(req.body.customer_id, function(err,regres){
            if(!err){
                var resJson = {
                    "http_code": regres.statusCode,
                    "message": regres.body.message.customerData
                };
                res.statusCode =  regres.statusCode;
                res.json(resJson);
            }
            else{
                var resJson = {
                    "http_code": regres.statusCode,
                    "message": regres
                };
                res.statusCode =  regres.statusCode;
                res.json(resJson);
            }
        });
    }
    else
    {   
        var regres = {
            "http_code": 401,
            "message": "No active session found."
        };
        res.statusCode =  regres.statusCode;
        res.json(regres);
    }
});
module.exports = app;
