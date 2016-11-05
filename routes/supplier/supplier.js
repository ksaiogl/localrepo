//Supplier API's:

var express = require('express');
var app = express();
var registration = require('./registration.js');
var loginService = require('./login.js');
var account = require('./account.js');
var supplierConfigService = require('./supplierConfigService.js');
var productPricing = require('./productPricing.js');
var reportOrders = require('./reportOrders.js');
var insertOrder = require('./insertOrder.js');
var orderDashboard = require('./orderDashboard.js');
var supplierDetails = require('./supplierDetails.js');
var presentDayOrderDetails = require('./todaysOrderDetails.js');
var supplierLogout = require('./supplierLogout.js');
var supplierUpdatePOD = require('./supplierPOD.js');
var manageNotifications = require('./manageNotifications.js');
var supplierReviews = require('./supplierReviewsRatings.js');
var supplierSessionManagement = require('./supplierSessionManagement.js');
var getLatestOrderStatus = require('./getLatestOrderStatus.js');

//Post request for registering the supplier.
app.post('/api/v1.0/register',function(req,res){
	registration.register(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});


//Post request for supplier login request.
app.post('/api/v1.0/login',function(req,res){
	supplierSessionManagement.createSupplierSession(req.body.mobile, function(err, response){
		if(!err)
		{	
			loginService.login(req, response, function(err,regres){
				res.statusCode =  regres.http_code;
				res.json(regres);
			});
		}
		else
		{
			res.statusCode =  response.http_code;
			res.json(response);
		}	
	});	
});

//Post request for supplier logout request.
app.post('/api/v1.0/logout',function(req,res){
	supplierSessionManagement.validateSupplierSession(req, function(err, response){
		if(!err)
		{
			supplierLogout.logout(req, function(err,regres){
				res.statusCode =  regres.http_code;
				res.json(regres);
			});
		}
		else
		{
			res.statusCode =  response.http_code;
			res.json(response);
		}	
	});
});

//Post request for supplier forgot password.
app.post('/api/v1.0/forgotpassword',function(req,res){
	account.forgotPassword(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//Post request for supplier reset password.
app.post('/api/v1.0/resetpassword',function(req,res){		
	account.resetPassword(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//Post request for supplier change password.
app.post('/api/v1.0/changepassword',function(req,res){
	supplierSessionManagement.validateSupplierSessionWithMobile(req, function(err, response){
		if(!err)
		{
			account.changePassword(req, function(err,regres){
				res.statusCode =  regres.http_code;
				res.json(regres);
			});
		}
		else
		{
			res.statusCode =  response.http_code;
			res.json(response);
		}	
	});	
});

//get request for getting App configuration.
app.get('/api/v1.0/loadconfig',function(req,res){
	supplierConfigService.loadconfig(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//post request for updating currentAppVersion and cloudTokenID.
app.post('/api/v1.0/updateAppInfo',function(req,res){
	supplierSessionManagement.validateSupplierSessionWithMobile(req, function(err, response){
		if(!err)
		{	
			supplierConfigService.updateAppinfo(req, function(err,regres){
				res.statusCode =  regres.http_code;
				res.json(regres);
			});
		}
		else
		{
			res.statusCode =  response.http_code;
			res.json(response);
		}	
	});	
});


//post request for retrieving Product details from Magento API and Java MOQ.
app.post('/api/v1.0/getProductDetails',function(req,res){
	productPricing.getProductDetails(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});	
});

//post request for updating currentAppVersion and cloudTokenID.
app.post('/api/v1.0/updatePOD',function(req,res){
	supplierUpdatePOD.updateSellerPOD(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});


//get request for getting Supplier details
app.get('/api/v1.0/getSupplierDetails',function(req,res){
	supplierDetails.getSupplierDetailsService(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//POST request for fetching latest notifications of Supplier.
app.post('/api/v1.0/latestNotifications',function(req, res){
	supplierSessionManagement.validateSupplierSession(req, function(err, response){
		if(!err)
		{
			manageNotifications.getNotifications(req, function(err,regres){
				res.statusCode =  regres.http_code;
				res.json(regres);
			});
		}
		else
		{
			res.statusCode =  response.http_code;
			res.json(response);
		}	
	});
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Order API.

//Loading File that contains buisness logic for order API.
//var createOrder = require('./createOrder.js');
var updateOrder = require('./updateOrder.js');
var orderSummary = require('./orderSummary.js');
var listOrder = require('./listOrder.js');
var insertOrder = require('./insertOrder.js');
//Handling different api calls and calling respective function to get response.
//Router that will take new order.

//CORS for the browser.
app.options('/api/v1.0/updateorder',function(req,res, next){
	res.send({status : 200, data:'CORS'});
});

//Router that will update order.
app.post('/api/v1.0/updateorder', function(req, res){
	supplierSessionManagement.validateSupplierSession(req, function(err, response){
		if(!err)
		{
			updateOrder.updateOrders(req, function(err, regres){
				res.statusCode =  regres.http_code;
				res.json(regres);
			});
		}
		else
		{
			res.statusCode =  response.http_code;
			res.json(response);
		}	
	});	
});

//Router that will list summary of order.
app.post('/api/v1.0/ordersummary', function(req, res){
	supplierSessionManagement.validateSupplierSession(req, function(err, response){
		if(!err)
		{	
			orderSummary.getSummary(req, function(err, regres){
				res.statusCode =  regres.http_code;
				res.json(regres);
			});
		}
		else
		{
			res.statusCode =  response.http_code;
			res.json(response);
		}	
	});		
});


//Router that will list Order Line Item details for an Order.
app.post('/api/v1.0/listorder', function(req, res){
	supplierSessionManagement.validateSupplierSession(req, function(err, response){
		if(!err)
		{
			listOrder.listOrders(req, function(err, regres){
				res.statusCode =  regres.http_code;
				res.json(regres);
			});
		}
		else
		{
			res.statusCode =  response.http_code;
			res.json(response);
		}	
	});	
});

//Router that will list Order Line Item details for an Order.
app.post('/api/v1.0/getLatestOrderStatus', function(req, res){
	supplierSessionManagement.validateSupplierSession(req, function(err, response){
		if(!err)
		{
			getLatestOrderStatus.getOrderStatus(req, function(err, regres){
				res.statusCode =  regres.http_code;
				res.json(regres);
			});
		}
		else
		{
			res.statusCode =  response.http_code;
			res.json(response);
		}	
	});	
});




//Router that will get reports data.
app.post('/api/v1.0/reportOrders', function(req, res){
	supplierSessionManagement.validateSupplierSession(req, function(err, response){
		if(!err)
		{
			reportOrders.getreportOrders(req, function(err, regres){
				res.statusCode =  regres.http_code;
				res.json(regres);
			});
		}
		else
		{
			res.statusCode =  response.http_code;
			res.json(response);
		}	
	});
});

//Router that will get reports data.
app.post('/api/v1.0/OrderDashboard', function(req, res){
	supplierSessionManagement.validateSupplierSession(req, function(err, response){
		if(!err)
		{
			orderDashboard.getDashboardData(req, function(err, regres){
				res.statusCode =  regres.http_code;
				res.json(regres);
			});
		}
		else
		{
			res.statusCode =  response.http_code;
			res.json(response);
		}	
	});
});

//Router that will insert new order.
app.post('/api/v1.0/insertOrder', function(req, res){
	insertOrder.insertOrder(req, function(err, regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//CORS for the browser.
app.options('/api/v1.0/insertOrderPayment',function(req,res, next){
	res.send({status : 200, data:'CORS'});
});

//Router that will update payment status.
app.put('/api/v1.0/insertOrderPayment', function(req, res){
	insertOrder.insertOrderPayment(req, function(err, regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//Router that will get present day order details.
app.post('/api/v1.0/todaysOrderDetails', function(req, res){
	supplierSessionManagement.validateSupplierSession(req, function(err, response){
		if(!err)
		{
			presentDayOrderDetails.getTodaysOrderDetails(req, function(err, regres){
				res.statusCode =  regres.http_code;
				res.json(regres);
			});
		}
		else
		{
			res.statusCode =  response.http_code;
			res.json(response);
		}	
	});
});

//Services for the supplier Reviews and Ratings.
app.post('/api/v1.0/consolidatedReviews',function(req,res){
	supplierReviews.fetchConsolidatedReviews(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});


//Services for the supplier Reviews and Ratings.
app.post('/api/v1.0/reviewsForSeller',function(req,res){
	supplierReviews.fetchReviewsForSeller(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//Services for the supplier Reviews and Ratings.
app.post('/api/v1.0/reviewsForAllSeller',function(req,res){
	supplierReviews.fetchReviewsForAllSeller(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//Services for the supplier Reviews and Ratings.
app.post('/api/v1.0/reviewSeller',function(req,res){
	supplierReviews.addReviewForSeller(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//Services for fetching the Unapproved supplier Reviews and Ratings for Admin.
app.get('/api/v1.0/unapprovedReviewsForSellers',function(req,res){
	supplierReviews.fetchUnapprovedReviews(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});


//We might have to remove this Route once Admin Pannel is live.
//Services for approving the reviews from Admin.
app.post('/api/v1.0/approveReviewsForSellers',function(req,res){
	supplierReviews.approveReviewsForSellers(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//Services for approving the reviews from Admin.
app.post('/api/v1.0/fetchSellerName',function(req,res){
	supplierReviews.fetchSellerName(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//Service for checking whether order is reviewed.
app.post('/api/v1.0/isOrderReviewed',function(req,res){
	supplierReviews.isOrderReviewed(req, function(err,regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

module.exports = app;
