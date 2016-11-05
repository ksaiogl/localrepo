var TAG = "---most_preferred_supplier ---    ";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var async = require('async');

var companyId;
var suppliers;
var suppliernames;
var categories;
var series31;
var series32;
var inquiries3;

exports.showChart = function(req, callback){
	var db = dbConfig.mongoDbConn;
	var logger = log.logger_charts;
	var resJson;

	var inquirycollection = db.collection('InquiryMaster');

	if(!( req.params.companyId == null || req.params.companyId == undefined ))
	{  	
	  	companyId =  parseInt(req.params.companyId);
	  	console.log(companyId);
		inquirycollection.count({ "inquiryEntity.associatedCompanyId": companyId }, function (err, count){
			if (err) {
		        resJson = {
		          "http_code" : "500",
		          "message" : "Inquiry Details cannot be retrieved. Please contact engineering team."
				};
				logger.error(TAG + " Error- Getting inquiry details for the Company ID: " + companyId + ", Error: \n" + err.stack);
				callback(true, resJson);
	      } else 
	      	{
		      	if(count>0)
		      	{
			      suppliers = [];
			      suppliernames = [];
			      categories = [];
			      series31 = [];
			      series32 = [];
			      inquiries3 =[];
  				
  				  async.waterfall([
				        function(callback1) 
				        	{ getInquiriesbySupplierId(callback1); }, 
				        function(suppliers,suppliernames,categories,inquiries3,
				        		callback1) 
				        	{ getSupplierName(suppliers,suppliernames,categories,inquiries3,
				        		callback1); }, 
				        function(suppliers,suppliernames,categories,inquiries3,
				        		callback1) 
				        	{ getInquiriesbyCategories(suppliers,suppliernames,categories,inquiries3,
				        		callback1); },
				        function(suppliers,suppliernames,categories,inquiries3,
				        		callback1)
				        	{ makeResult1(suppliers,suppliernames,categories,inquiries3,
				        		callback1); },
				        function(suppliers,suppliersChosenNames,categories,inquiries3,series31,
				        		callback1)
				        	{ filterInquiries(suppliers,suppliersChosenNames,categories,inquiries3,series31,
				        		callback1); },
				        function(suppliers,suppliersChosenNames,Categories,inquiries,series31,
				        		callback1)
				        	{ makeResult2(suppliers,suppliersChosenNames,Categories,inquiries,series31,
				        		callback1); },			
				    	],
				    	function finalCallback(err, results1, results2, results3) {
				    		if(err){
				    			var logger = log.logger_charts;
								resJson = {
						            "http_code" : "500",
						            "message" : "Unable to retrieve data for Chart-3 Most Preferred Suppliers"
				  				};
				  				logger.error(TAG + " Details of Chart-3 retrieving failed for Company ID: " + companyId + " error:"+ JSON.stringify(results1));
				  				callback(true,resJson);		
				    		} else {
				    			var logger = log.logger_charts;
								resJson = {
									"http_code" : "200",
									"message1" : results1,
									"message2" : results2,
									"message3" : results3
								  };
								logger.debug(TAG + " Details of Chart-3 retrieved sucessfully for Company ID: " + companyId );
								callback(false,resJson);
				    		}
						}
					);	
				} else {
		          resJson = {
		              "http_code": 404,
		              "message": "No results found for Company ID : " + companyId
		          };
		          callback(true,resJson);
		          logger.error(TAG + "No results found for Company ID : " + companyId);
			    }
	      	}
	  	});
	}
	else{
		resJson = {
	          "http_code": 400,
	          "message": "Bad or ill-formed request.."
	    };
	    callback(true,resJson);
	    logger.error(TAG + "Bad or ill-formed request..");
	}
};	

function getInquiriesbySupplierId(callback1){
	var db = dbConfig.mongoDbConn;

	var inquirycollection = db.collection('InquiryMaster');
	var query31 = [
	    { $match : { "inquiryEntity.associatedCompanyId" : companyId } },
	    { $unwind: "$inquiryEntity.suppliersChosen" },
	    { $match: { "inquiryEntity.suppliersChosen.supplierId" : { $exists: true } } },
	    { $group: {
	      _id: { SupplierId: "$inquiryEntity.suppliersChosen.supplierId" },
	      numberofinquiries: { $sum: 1 }
	    } },
	    { $sort : { "numberofinquiries" : -1 , _id: 1 } }
	  ];
	inquirycollection.aggregate(query31).toArray(function (err, result31) {
	    if(err){
	      callback1(true,err);
	    }
	    else{
	      result31.forEach(function (entry) {
	      	suppliers.push(entry._id.SupplierId);
	      	categories.push([]);
	      });
	      callback1(null,suppliers,suppliernames,categories,inquiries3);
	    }
  	});
}  	

function getSupplierName(suppliers,suppliernames,categories,inquiries3,callback1){
	var db = dbConfig.mongoDbConn;

  	var buildercollection = db.collection('Builder');	
  	var query32 = [
	    { $match: { "builderEntity.profileInfo.accountInfo.companyId": companyId } },
	    { $unwind: "$builderEntity.mySuppliers.suppliersIds" },
	    { $project: { SupplierId: "$builderEntity.mySuppliers.suppliersIds.supplierId",
	      SupplierName: "$builderEntity.mySuppliers.suppliersIds.companyName" , _id: 0} }
	  ];	
	buildercollection.aggregate(query32).toArray(function (err, result32) {
		if(err){
		  callback1(true,err);
		}
		else{
		  result32.forEach(function (entry) {
			suppliernames.push({'id': entry.SupplierId, 'name': entry.SupplierName});
		  });
		  callback1(null,suppliers,suppliernames,categories,inquiries3);
		}
	});
}	

function newindexOf(arr, key, val) {
	for (var i = 0; i < arr.length; i++) {
	  if (arr[i][key] == val) {
		return i;
	  }
	}
	return null;
}

 function getInquiriesbyCategories(suppliers,suppliernames,categories,inquiries3,callback1){
 	var db = dbConfig.mongoDbConn;

	var inquirycollection = db.collection('InquiryMaster');
	var query33 = [
	    { $match : { "inquiryEntity.associatedCompanyId" : companyId } },
	    { $unwind: "$inquiryEntity.suppliersChosen" },
	    { $match: { "inquiryEntity.suppliersChosen.supplierId" : { $exists: true } } },
	    { $group: {
	      _id: { SupplierId: "$inquiryEntity.suppliersChosen.supplierId", Category: "$inquiryEntity.suppliersChosen.categories" },
	      numberofinquiries: { $sum: 1 }
	    } },
	    { $sort : { "numberofinquiries": -1, "_id" : 1 } }
	  ];
	inquirycollection.aggregate(query33).toArray(function (err, result33) {
		if (err) {
		  callback1(true,err);
		}
		else
		{
		  result33.forEach(function (entry) {
			if(suppliers.indexOf(entry._id.SupplierId) >= 0)
			{
			  if(categories[suppliers.indexOf(entry._id.SupplierId)].indexOf(entry._id.Category) == -1
				  && categories[suppliers.indexOf(entry._id.SupplierId)].length < 3)
			  {
				categories[suppliers.indexOf(entry._id.SupplierId)].push(entry._id.Category);
				inquiries3
				  [
					3*suppliers.indexOf(entry._id.SupplierId) + 
					categories[suppliers.indexOf(entry._id.SupplierId)].length -1
				  ] = entry.numberofinquiries;
			  }
			}
		  });
		  callback1(null,suppliers,suppliernames,categories,inquiries3);
		}
	});  		  
}   
	
function makeResult1(suppliers,suppliernames,categories,inquiries3,callback1){
	var suppliersChosenNames = [];
	for(var i=0; i<suppliers.length; i++)
	{	
		if(newindexOf(suppliernames,'id',suppliers[i]) != null){
      		series31.push(
			  {
				name: suppliernames[newindexOf(suppliernames,'id',suppliers[i])].name,
				categories: categories[i]
			  }
			);
			suppliersChosenNames.push(suppliernames[newindexOf(suppliernames,'id',suppliers[i])].name);
      	} else {
      		series31.push(
			  {
				name: "Deleted Supplier",
				categories: categories[i]
			  }
			);
      	}
	}
	callback1(null,suppliers,suppliersChosenNames,categories,inquiries3,series31);
}

function filterInquiries(suppliers,suppliersChosenNames,categories,inquiries3,series31,callback1){
	var Categories = [].concat.apply([], categories);
    var inquiries = inquiries3.filter(function filterArray(value) {
      return value != '';
    });
    callback1(null,suppliers,suppliersChosenNames,Categories,inquiries,series31);
}

function makeResult2(suppliers,suppliersChosenNames,Categories,inquiries,series31,callback1){
	for(var j=0; j< inquiries.length; j++)
	{
		if(inquiries[j] != undefined){
			series32.push(
				{
				  y: inquiries[j],
				  color: (Categories.indexOf(Categories[j]))
				}
			);
		}
	}
	callback1(null,series31,series32,suppliersChosenNames);
}