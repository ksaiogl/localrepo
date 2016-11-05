var express = require('express');
var app = express();
var supplierCrm = require('./supplierCrm');
var supplierOrderList = require('./supplierViewOrderList');
var supplierOrder = require('./supplierViewOrder');
var serviceProviderCrm = require('./serviceProviderCrm');
var updateContact = require('./updateContact');


// ***************************************  Supplier ******************************************

//Router that will upload supplier to crm.
app.get('/supplier/api/v1.0/uploadSupplier', function(req, res){
  supplierCrm.uploadToCRM(req, 'upload', function(err, regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//Router that will update supplier to crm.
app.get('/supplier/api/v1.0/updateSupplier', function(req, res){
  supplierCrm.uploadToCRM(req, 'update', function(err, regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//Router that will list order for supplier.
app.get('/supplier/api/v1.0/viewSupplierOrderList', function(req, res){
	supplierOrderList.viewSupplierOrderList(req, function(err, regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//Router that will display order details for supplier.
app.get('/supplier/api/v1.0/viewSupplierOrder', function(req, res){
	supplierOrder.viewSupplierOrder(req, function(err, regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});



// ***************************************  ServiceProvider ******************************************

//Router that will upload ServiceProvider to crm.
app.get('/affiliate/api/v1.0/uploadServiceProvider', function(req, res){
  serviceProviderCrm.uploadToCRM(req, 'upload', function(err, regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});

//Router that will update ServiceProvider to crm.
app.get('/affiliate/api/v1.0/updateServiceProvider', function(req, res){
  serviceProviderCrm.uploadToCRM(req, 'update', function(err, regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});


// ***************************************  update contact from CRM ******************************************

//Router that will upload ServiceProvider to crm.
app.get('/api/v1.0/updateContact/:crmid', function(req, res){
  updateContact.updateContact(req, function(err, regres){
		res.statusCode =  regres.http_code;
		res.json(regres);
	});
});


module.exports = app;
