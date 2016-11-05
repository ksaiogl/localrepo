/**
 * New node file
 */
var express = require('express');
var app = express();
var builderRegistration = require('./builderRegistration.js');
var builderProjects = require('./builderProjects.js');
var supplierModule = require('./buildersuppliers.js');
var s3Operations = require('./s3Upload.js');
var rfqStatesCities = require('./rfqStatesCities.js');
var rfqCategoriesSubcategories = require('./rfqCategoriesSubcategories.js');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart({uploadDir: '/usr/NodeJslogs/rfqdocs' });
var inquiries = require('./rfqInquiries.js');

//post request for adding builder details.
// app.post('/api/v1.0/addbuilderdetails', function(req, res){
//  builderRegistration.addBuilder(req, function(err, regres){
//    res.statusCode =  regres.http_code;
//    res.json(regres);
//  });
// });

//post request for adding project by builder.
app.post('/api/v1.0/addproject', multipartMiddleware, function(req, res){
  if(req.body.customerSession){
      try{
        req.body.customerSession = JSON.parse(req.body.customerSession);
        builderProjects.addProject(req, function(err, regres){
          res.statusCode =  regres.http_code;
          res.json(regres);
        });
      }
      catch(e){
        builderProjects.addProject(req, function(err, regres){
          res.statusCode =  regres.http_code;
          res.json(regres);
        });
      }
    }
    else{
      var regres = {
             "http_code": 401,
             "message": "No active session found."
          };
         res.statusCode =  regres.http_code;
         res.json(regres);
      }
});

//post request for view project by builder.
app.post('/api/v1.0/viewproject', function(req, res){
  builderProjects.viewProject(req, function(err, regres){
    res.statusCode =  regres.http_code;
    res.json(regres);
  });
});

//post request for remove project by builder.
app.post('/api/v1.0/removeproject', function(req, res){
  builderProjects.removeProject(req, function(err, regres){
    res.statusCode =  regres.http_code;
    res.json(regres);
  });
});

//post request for update project by builder.
app.post('/api/v1.0/updateproject', multipartMiddleware, function(req, res){

  if(req.body.customerSession){
      try{
        req.body.customerSession = JSON.parse(req.body.customerSession);
        builderProjects.updateProject(req, function(err, regres){
          res.statusCode =  regres.http_code;
          res.json(regres);
        });
      }
      catch(e){
        builderProjects.updateProject(req, function(err, regres){
          res.statusCode =  regres.http_code;
          res.json(regres);
        });
      }
    }
    else{
      var regres = {
             "http_code": 401,
             "message": "No active session found."
          };
         res.statusCode =  regres.http_code;
         res.json(regres);
      }

});

//get request for listing states by builder.
app.get('/api/v1.0/getstates', function(req, res){
  rfqStatesCities.getStates(req, function(err, regres){
    res.statusCode =  regres.http_code;
    res.json(regres);
  });
});

//post request for listing cities by states.
app.post('/api/v1.0/getcities', function(req, res){
  rfqStatesCities.getCities(req, function(err, regres){
    res.statusCode =  regres.http_code;
    res.json(regres);
  });
});

//get request for listing all categories and subcategories.
app.get('/api/v1.0/getcategory_subcategories', function(req, res){
  rfqCategoriesSubcategories.getAllcategoriesSubcategories(req, function(err, regres){
    res.statusCode =  regres.http_code;
    res.json(regres);
  });
});

//post request for listing all categories and subcategories with number of suppliers present for particular buidler.
app.post('/api/v1.0/getcategory_subcategories_count', function(req, res){
  if(req.body.customerSession){
        rfqCategoriesSubcategories.getAllcategoriesSubcategoriesCount(req, function(err, regres){
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

//CORS for the browser.
app.options('/api/v1.0/getcities',function(req,res, next){
  res.send({status : 200, data:'CORS'});
});

//Post request adding the supplier.
app.post('/api/v1.0/addSupplier',function(req,res){
    supplierModule.addSupplier(req, function(err,regres){
      res.statusCode =  regres.http_code;
      res.json(regres);
    });
});

//post request for listing cities by builder.
app.post('/api/v1.0/getbuildercities', function(req, res){
  if(req.body.customerSession){
        rfqStatesCities.getCitiesbyBuilder(req, function(err, regres){
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

//Post request for deleting the supplier.
app.post('/api/v1.0/deleteSupplier',function(req,res){
  supplierModule.deleteSupplier(req, function(err,regres){
    res.statusCode =  regres.http_code;
    res.json(regres);
  });
});

//Post request for updating the supplier data.
app.post('/api/v1.0/updateSupplier',function(req,res){
  supplierModule.updateSupplierDetails(req, function(err,regres){
    res.statusCode =  regres.http_code;
    res.json(regres);
  });
});

//Post request for Fetching the Supplier Data.
app.post('/api/v1.0/fetchSuppliers',function(req,res){
  if(req.body.customerSession){
          supplierModule.fetchSuppliers(req, function(err,regres){
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

//Post request for Favourite the Supplier.
app.post('/api/v1.0/favouriteSupplier',function(req,res){
  supplierModule.favouriteSupplier(req, function(err,regres){
    res.statusCode =  regres.http_code;
    res.json(regres);
  });
});

//Post request for Fetching the Favourite Supplier.
app.post('/api/v1.0/fetchFavouriteSuppliers',function(req,res){
  supplierModule.fetchFavouriteSuppliers(req, function(err,regres){
    res.statusCode =  regres.http_code;
    res.json(regres);
  });
});

//Post request for Fetching the Favourite Supplier.
app.post('/api/v1.0/raiseInquiry', multipartMiddleware, function(req,res){
  
  if(req.body.customerSession){
  		try{
  			req.body.customerSession = JSON.parse(req.body.customerSession);
	        inquiries.raiseInquiry(req, function(err,regres){
	            res.statusCode =  regres.http_code;
	            res.json(regres);
	        });
	  	}
  		catch(e){
  			inquiries.raiseInquiry(req, function(err,regres){
	            res.statusCode =  regres.http_code;
	            res.json(regres);
	        });
  		}
  }else{
            var regres = {
               "http_code": 401,
               "message": "No active session found."
            };
           res.statusCode =  regres.http_code;
           res.json(regres);
       }
});

//Post request for Fetching the Supplier Data for Inquiry.
app.post('/api/v1.0/fetchSuppliersForInquiry',function(req,res){
  supplierModule.fetchSuppliersForInquiry(req, function(err,regres){
    res.statusCode =  regres.http_code;
    res.json(regres);
  });
});


//Post request for Fetching the Supplier Data for Inquiry.
app.post('/api/v1.0/inquiryStatistics',function(req,res){
  if(req.body.customerSession){
            inquiries.inquiryStatistics(req, function(err,regres){
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

//Post request for Fetching the Supplier Data for Inquiry.
app.post('/api/v1.0/myInquiryList',function(req,res){
  if(req.body.customerSession){
        inquiries.inquiryList(req, function(err,regres){
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

//Post request for Fetching the Dashboard Numbers.
app.post('/api/v1.0/dashboardStatistics',function(req,res){
  if(req.body.customerSession){
        inquiries.dashboardStatistics(req, function(err,regres){
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

//get request for view project by builder.
app.get('/api/v1.0/viewproject', function(req, res){
  builderProjects.viewProjectDetails(req, function(err, regres){
    res.statusCode =  regres.http_code;
    res.json(regres);
  });
});

//get request for listing all company ids in builder collection.
app.get('/api/v1.0/listCompanyIds', function(req, res){
  builderProjects.listCompanys(req, function(err, regres){
    res.statusCode =  regres.http_code;
    res.json(regres);
  });
});

module.exports = app;
