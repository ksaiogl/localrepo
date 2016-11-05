var express = require('express');
var app = express();
var chart1 = require('./no_of_inquiries_rised.js');
var chart2 = require('./inquired_categories.js');
var chart3 = require('./most_preferred_supplier.js');
var chart4 = require('./inquiries_by_projects.js');

//Router that will get chart-1 ( Number of Inquiries raised by builder according to months and days ) details for a builder.
app.get('/api/v1.0/no_of_inquiries_rised/:companyId', function(req, res){
  chart1.showChart(req, function(err, regres){
		if(regres.http_code == 200){
			res.json(regres);
		} else {
			res.statusCode =  regres.http_code;
			res.json(regres);
		}
	});
});


//Router that will get chart-2 ( Number of Inquiries raised by builder according to categories and sub categories ) details for a builder.
app.get('/api/v1.0/inquired_categories/:companyId/:filter', function(req, res){
  chart2.showChart(req, function(err, regres){
		if(regres.http_code == 200){
			res.json(regres);
		} else {
			res.statusCode =  regres.http_code;
			res.json(regres);
		}
	});
});

//Router that will get chart-3 ( Top 5 preferred suppliers and their respective top 3 categories ) details for a builder.
app.get('/api/v1.0/most_preferred_supplier/:companyId', function(req, res){
  chart3.showChart(req, function(err, regres){
		if(regres.http_code == 200){
			res.json(regres);
		} else {
			res.statusCode =  regres.http_code;
			res.json(regres);
		}
	});
});

//Router that will get chart-4 ( Top 5 projects inquired for and inquiries of categories) details for a builder.
app.get('/api/v1.0/inquiries_by_projects/:companyId/:categories', function(req, res){
  chart4.showChart(req, function(err, regres){
  		if(regres.http_code == 200){
  			res.json(regres);
		} else {
			res.statusCode =  regres.http_code;
			res.json(regres);
		}
	});
});



//CORS for the browser.
app.options('/api/v1.0/no_of_inquiries_rised/:companyId',function(req,res, next){
	res.send({status : 200, data:'CORS'});
});

app.options('/api/v1.0/inquired_categories/:companyId/:filter',function(req,res, next){
	res.send({status : 200, data:'CORS'});
});

app.options('/api/v1.0/most_preferred_supplier/:companyId',function(req,res, next){
	res.send({status : 200, data:'CORS'});
});

app.options('/api/v1.0/inquiries_by_projects/:companyId/:categories',function(req,res, next){
	res.send({status : 200, data:'CORS'});
});


module.exports = app;