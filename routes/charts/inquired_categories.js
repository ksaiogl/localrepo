var TAG = "---inquired_categories ---    ";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var async = require('async');
var restClient = require('node-rest-client').Client;
var urlConstants = require('../helpers/urlConstants');
var env = require('../../Environment/env.js').env;

var companyId;
var filter;
var maincategories;
var subcategories;
var series2;
var maincategoriesinquirycount;
var subcategoriesinquirycount;
var subcategoriesinquirycountfiltered;
var totalNofInquiries;

exports.showChart = function(req, callback){
	var db = dbConfig.mongoDbConn;
	var logger = log.logger_charts;
	var resJson;

	var inquirycollection = db.collection('InquiryMaster');


	if(!( req.params.companyId == null || req.params.companyId == undefined || req.params.filter == null || req.params.filter == undefined))
	{  	
	  	companyId =  parseInt(req.params.companyId);
	  	filter = req.params.filter;
		inquirycollection.count({ "inquiryEntity.associatedCompanyId": companyId}, function (err, count){
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
			      maincategories = [];
			      subcategories = [];
			      series2 = [];
			      maincategoriesinquirycount = [];
			      subcategoriesinquirycount = [];
			      subcategoriesinquirycountfiltered = [];
			      totalNofInquiries = 0;

  				  async.waterfall([
			        function(callback1) 
			        	{ getSubCategories(callback1); }, 
			        function(maincategories,subcategories,maincategoriesinquirycount,
			        		subcategoriesinquirycount,subcategoriesinquirycountfiltered,totalNofInquiries,
			        		callback1)
			        	{ getInquiriesBySubCategories(maincategories,subcategories,maincategoriesinquirycount,
			        		subcategoriesinquirycount,subcategoriesinquirycountfiltered,totalNofInquiries,
			        		callback1); }, 
			        function(maincategories,subcategories,maincategoriesinquirycount,
			        		subcategoriesinquirycount,subcategoriesinquirycountfiltered,totalNofInquiries,
			        		callback1)
			        	{ filterSubcategories(maincategories,subcategories,maincategoriesinquirycount,
			        		subcategoriesinquirycount,subcategoriesinquirycountfiltered,totalNofInquiries,
			        		callback1); }, 
			        function(maincategories,subcategories,maincategoriesinquirycount,
			        		subcategoriesinquirycount,subcategoriesinquirycountfiltered,totalNofInquiries,
			        		callback1)
			        	{ makeResult(maincategories,subcategories,maincategoriesinquirycount,
			        		subcategoriesinquirycount,subcategoriesinquirycountfiltered,totalNofInquiries,
			        		callback1); }, 
			        function(maincategories,subcategories,maincategoriesinquirycount,
			        		subcategoriesinquirycount,subcategoriesinquirycountfiltered,totalNofInquiries,
			        		callback1)
			        	{ sortSubcategories(maincategories,subcategories,maincategoriesinquirycount,
			        		subcategoriesinquirycount,subcategoriesinquirycountfiltered,totalNofInquiries,
			        		callback1); }, 
			        function(maincategories,subcategories,maincategoriesinquirycount,
			        		subcategoriesinquirycount,subcategoriesinquirycountfiltered,totalNofInquiries,
			        		callback1)
			        	{ makeFinalResult(maincategories,subcategories,maincategoriesinquirycount,
			        		subcategoriesinquirycount,subcategoriesinquirycountfiltered,totalNofInquiries,
			        		callback1); }	
			    	],
			    	function finalCallback(err, result1, result2) {
						var logger = log.logger_charts;
						 resJson = {
				            "http_code" : "200",
				            "message1" : result1,
				            "message2" : result2
		  				  };
		  				  logger.debug(TAG + " Details of Chart-2 retrieved sucessfully for Company ID: " + companyId );
		  				  callback(false,resJson);
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

function getSubCategories(callback1){
	var client = new restClient();

	client.get(urlConstants.getCategoriesDetailURL(env), function (data) {
		var MainCategories = data.message[0].subCategories;
		for (var i=0; i<MainCategories.length; i++) {
			maincategoriesinquirycount.push(0);
          	maincategories.push(MainCategories[i].categoryDisplayName);
      		subcategoriesinquirycount.push([]);
      		subcategories.push([]);
          	for (var j=0; j<MainCategories[i].subCategories.length; j++) {
          		subcategories[i].push(MainCategories[i].subCategories[j].categoryDisplayName);
          	}		
		}
		maincategoriesinquirycount.push(0);
		maincategories.push("Others");
		subcategoriesinquirycount.push([]);
		subcategories.push([]);
		subcategories[MainCategories.length].push("Others");
	  	callback1(null,maincategories,subcategories,maincategoriesinquirycount,
			        		subcategoriesinquirycount,subcategoriesinquirycountfiltered,totalNofInquiries);
	});
}


function getInquiriesBySubCategories(maincategories,subcategories,maincategoriesinquirycount,
			        		subcategoriesinquirycount,subcategoriesinquirycountfiltered,totalNofInquiries,callback1){
	var db = dbConfig.mongoDbConn;

	var inquirycollection = db.collection('InquiryMaster');

	if(filter == 'All') {
		var query22 = [
	        { $match : { "inquiryEntity.associatedCompanyId" : companyId } },
	        { $unwind: "$inquiryEntity.categories" },
	        { $group: {
	          _id: "$inquiryEntity.categories",
	          numberofinquiries: { $sum: 1 }
	        } },
	        { $sort : { "_id" : 1 } }
	      ];
	} else if(filter == '1M') {
		var query22 = [
			{ $match : { "inquiryEntity.associatedCompanyId" : companyId } },
	        { $unwind: "$inquiryEntity.categories" },
	        { $match: { 
	          	$and: [ 
	          			{ "inquiryEntity.inquiryTimestamp" : { $gte : new Date(new Date().getFullYear(), new Date().getMonth()-1, new Date().getDate() ) } } , 
	          			{ "inquiryEntity.inquiryTimestamp" : { $lte : new Date() } } 
	          	] 
	        } },
	        { $group: {
	          _id: "$inquiryEntity.categories",
	          numberofinquiries: { $sum: 1 }
	        } },
	        { $sort : { "_id" : 1 } }
		];
	} else if(filter == '3M') {
		var query22 = [
			{ $match : { "inquiryEntity.associatedCompanyId" : companyId } },
	        { $unwind: "$inquiryEntity.categories" },
	        { $match: { 
	          	$and: [ 
	          			{ "inquiryEntity.inquiryTimestamp" : { $gte : new Date(new Date().getFullYear(), new Date().getMonth()-3, new Date().getDate() ) } } , 
	          			{ "inquiryEntity.inquiryTimestamp" : { $lte : new Date() } } 
	          	] 
	        } },
	        { $group: {
	          _id: "$inquiryEntity.categories",
	          numberofinquiries: { $sum: 1 }
	        } },
	        { $sort : { "_id" : 1 } }
		];
	} else if(filter == '6M') {
		var query22 = [
			{ $match : { "inquiryEntity.associatedCompanyId" : companyId } },
	        { $unwind: "$inquiryEntity.categories" },
	        { $match: { 
	          	$and: [ 
	          			{ "inquiryEntity.inquiryTimestamp" : { $gte : new Date(new Date().getFullYear(), new Date().getMonth()-6, new Date().getDate() ) } } , 
	          			{ "inquiryEntity.inquiryTimestamp" : { $lte : new Date() } } 
	          	] 
	        } },
	        { $group: {
	          _id: "$inquiryEntity.categories",
	          numberofinquiries: { $sum: 1 }
	        } },
	        { $sort : { "_id" : 1 } }
		];
	} else if(filter == '1Y') {
		var query22 = [
			{ $match : { "inquiryEntity.associatedCompanyId" : companyId } },
	        { $unwind: "$inquiryEntity.categories" },
	        { $match: { 
	          	$and: [ 
	          			{ "inquiryEntity.inquiryTimestamp" : { $gte : new Date(new Date().getFullYear(), new Date().getMonth()-12, new Date().getDate() ) } } , 
	          			{ "inquiryEntity.inquiryTimestamp" : { $lte : new Date() } } 
	          	] 
	        } },
	        { $group: {
	          _id: "$inquiryEntity.categories",
	          numberofinquiries: { $sum: 1 }
	        } },
	        { $sort : { "_id" : 1 } }
		];
	} else if(filter == 'YTD') {
		var query22 = [
			{ $match : { "inquiryEntity.associatedCompanyId" : companyId } },
	        { $unwind: "$inquiryEntity.categories" },
	        { $match: { 
	          	$and: [ 
	          			{ "inquiryEntity.inquiryTimestamp" : { $gte : new Date(new Date().getFullYear(), 0, 1 ) } } , 
	          			{ "inquiryEntity.inquiryTimestamp" : { $lte : new Date() } } 
	          	] 
	        } },
	        { $group: {
	          _id: "$inquiryEntity.categories",
	          numberofinquiries: { $sum: 1 }
	        } },
	        { $sort : { "_id" : 1 } }
		];
	} else {
		var date = filter.split(" - ");
		var startDate = new Date(date[0]);
		var endDate = new Date(date[1]);
		var query22 = [
			{ $match : { "inquiryEntity.associatedCompanyId" : companyId } },
	        { $unwind: "$inquiryEntity.categories" },
	        { $match: { 
	          	$and: [ 
	          			{ "inquiryEntity.inquiryTimestamp" : { $gte : startDate } } , 
	          			{ "inquiryEntity.inquiryTimestamp" : { $lte : endDate } } 
	          	] 
	        } },
	        { $group: {
	          _id: "$inquiryEntity.categories",
	          numberofinquiries: { $sum: 1 }
	        } },
	        { $sort : { "_id" : 1 } }
		];
	}

	inquirycollection.aggregate(query22).toArray(function(err, result22) {
        if(err){
          res.json(err);
        } else {	
          result22.forEach(function (entry) {		
            totalNofInquiries += entry.numberofinquiries;
          });  	
          result22.forEach(function (entry) {
            for(var i=0; i<subcategories.length; i++){
              if(subcategories[i].indexOf(entry._id) != -1){
                maincategoriesinquirycount[i] += entry.numberofinquiries;
                subcategoriesinquirycount[i][subcategories[i].indexOf(entry._id)] = 
                	[entry._id, entry.numberofinquiries*100/totalNofInquiries];
              }
            }
          });
	  	callback1(null,maincategories,subcategories,maincategoriesinquirycount,
			        		subcategoriesinquirycount,subcategoriesinquirycountfiltered,totalNofInquiries);
        }
      });
}

function filterSubcategories(maincategories,subcategories,maincategoriesinquirycount,
			        		subcategoriesinquirycount,subcategoriesinquirycountfiltered,totalNofInquiries,callback1){
	for(var i=0; i<subcategories.length; i++) {
	    subcategoriesinquirycountfiltered[i] = subcategoriesinquirycount[i].filter(function filterArray(value) {
	      return value != '';
	    });
	}
	callback1(null,maincategories,subcategories,maincategoriesinquirycount,
			        		subcategoriesinquirycount,subcategoriesinquirycountfiltered,totalNofInquiries);
}			   

function makeResult(maincategories,subcategories,maincategoriesinquirycount,
			        		subcategoriesinquirycount,subcategoriesinquirycountfiltered,totalNofInquiries,callback1){
	for(var j=0; j<maincategories.length; j++){
        series2.push(
            {
              name: maincategories[j],
              y: maincategoriesinquirycount[j],
              data: subcategoriesinquirycountfiltered[j]
            }
        );
    }
	callback1(null,maincategories,subcategories,maincategoriesinquirycount,
			        		subcategoriesinquirycount,subcategoriesinquirycountfiltered,totalNofInquiries);
}		

function sortSubcategories(maincategories,subcategories,maincategoriesinquirycount,
			        		subcategoriesinquirycount,subcategoriesinquirycountfiltered,totalNofInquiries,callback1){
	for(var k=0; k<subcategoriesinquirycountfiltered.length; k++){
        subcategoriesinquirycountfiltered[k].sort(function(a, b) {
          if (a[1] < b[1]) return 1;
          if (a[1] > b[1]) return -1;
          return 0;
        });
    }
	callback1(null,maincategories,subcategories,maincategoriesinquirycount,
			        		subcategoriesinquirycount,subcategoriesinquirycountfiltered,totalNofInquiries);
}		

function makeFinalResult(maincategories,subcategories,maincategoriesinquirycount,
			        		subcategoriesinquirycount,subcategoriesinquirycountfiltered,totalNofInquiries,callback1){
	series2.sort(function(a, b) {
        return b.y - a.y;
    });
	callback1(null,series2,totalNofInquiries);
}		        			     			        			     			