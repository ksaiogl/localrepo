var express = require('express');
var app = express();

// var customerAdminPanel = require('./customerAdminPanel.js');
var viewOrderList = require('./viewOrderList.js');
var viewOrder = require('./viewOrder.js');
var state = require('./stateCodes.js');
var customerLead = require('./customerLead.js');
var searchOrderList = require('./searchOrder.js');

// ******************** FOR API CALLS FROM WEB/MOBILE ***********************

//Router that will get order list for viewing.
app.get('/api/v1.0/viewOrderList/:view?', function(req, res){
	var callback = function(err, regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	};
	viewOrderList.viewOrderList(req, callback );
});

//Router that will get orders for viewing.
app.get('/api/v1.0/viewOrder/:view?', function(req, res){
	var callback = function(err, regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	};
	viewOrder.viewOrder(req, callback );
});

// Gives details for magento active states
app.get('/api/v1.0/getState/:state?', function(req, res){
	var callback = function(err, regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	};
	state.getState(req.query.state, callback);
});

// Adds Customer Query Details to CustomerLead
app.post('/api/v1.0/addCustomerLead', function(req, res){
	var callback = function(err, regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	};
	customerLead.addCustomerLead(req, callback);
});

//Router that will get order list for search criteria.
app.get('/api/v1.0/searchOrderList', function(req, res){
	var callback = function(err, regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	};
	searchOrderList.searchOrderList(req, callback);
});


module.exports = app;
