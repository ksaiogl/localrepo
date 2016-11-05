var TAG = "---inquiries_by_projects ---    ";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var async = require('async');

var companyId;
var projectnames;
var categoryinquires;
var Categories;
var allCategories;
var series4;

exports.showChart = function(req, callback){
	var db = dbConfig.mongoDbConn;
	var logger = log.logger_charts;
	var resJson;

	var inquirycollection = db.collection('InquiryMaster');
  	
	if(!(req.params.companyId == null || req.params.companyId == undefined || req.params.categories == null || req.params.categories == undefined))
	{
		companyId =  parseInt(req.params.companyId);
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
					projectnames = [];
					categoryinquires = [];
					otherinquiries = [];
					Categories = req.params.categories.split(",");
					for(var i=0; i<Categories.length; i++){
						categoryinquires.push([]);	
					}
					allCategories = [];
					series4 = [];

					async.waterfall([
				        function(callback1) 
				        	{ getProjectNames(callback1); }, 
				        function(projectnames,Categories,categoryinquires,otherinquiries,
				        		callback1) 
				        	{ getCategoryInquiries(projectnames,Categories,categoryinquires,otherinquiries,
				        		callback1); },
				        function(projectnames,Categories,categoryinquires,otherinquiries,
				        		callback1) 
				        	{ getAllCategories(projectnames,Categories,categoryinquires,otherinquiries,
				        		callback1); },	
				        function(projectnames,Categories,categoryinquires,otherinquiries,
				        		allCategories,callback1)
				        	{ makeResult(projectnames,Categories,categoryinquires,otherinquiries,
				        		allCategories,callback1); },	
				    	],
				    	function finalCallback(err, results1, results2) {
				    		if(err){
				    			var logger = log.logger_charts;
								resJson = {
						            "http_code" : "500",
						            "message" : "Unable to retrieve data for Chart-4 Inquiries by Projects"
				  				};
				  				logger.error(TAG + " Details of Chart-4 retrieving failed for Company ID: " + companyId + " error:"+ JSON.stringify(results1));
				  				callback(true,resJson);		
				    		} else {
				    			var logger = log.logger_charts;
								resJson = {
								    "http_code" : "200",
								    "message1" : results1,
								    "message2" : results2
								};
								logger.debug(TAG + " Details of Chart-4 retrieved sucessfully for Company ID: " + companyId );
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

function getProjectNames(callback1){
	var db = dbConfig.mongoDbConn;

	var inquirycollection = db.collection('InquiryMaster');
	var query41 = [
		{ $match : { "inquiryEntity.associatedCompanyId" : companyId } },
		{ $unwind: "$inquiryEntity.categories" },
		{ $match: { "inquiryEntity.associatedProjectName" : { $ne: null } } },
		{ $group: {
		  _id: { ProjectName: "$inquiryEntity.associatedProjectName"},
		  numberofinquiries: { $sum: 1 }
		} },
		{ $sort : { "numberofinquiries" : -1 } },
		{ $limit: 5}  
	];
  inquirycollection.aggregate(query41).toArray(function(err, result41) {
    if(err){
      callback1(true,err);
    }
    else{
      result41.forEach(function (entry) {
        projectnames.push(entry._id.ProjectName);
        for(var i=0; i<Categories.length; i++){
			categoryinquires[i].push(0);	
		}
        otherinquiries.push(entry.numberofinquiries);
      });
  	callback1(null,projectnames,Categories,categoryinquires,otherinquiries);
    }
  });
}

function getCategoryInquiries(projectnames,Categories,categoryinquires,otherinquiries,callback1){
	var db = dbConfig.mongoDbConn;

	var inquirycollection = db.collection('InquiryMaster');
	async.forEachSeries(Categories, function(key, callback){
		var query42 = [
			{ $match : { "inquiryEntity.associatedCompanyId" : companyId } },
			{ $unwind: "$inquiryEntity.categories" },
			{ $match: { "inquiryEntity.associatedProjectName" : { $ne: null } } },
			{ $match : { "inquiryEntity.categories" : key } },
			{ $group: {
			  _id: { ProjectName: "$inquiryEntity.associatedProjectName" },
			  numberofinquiries: { $sum: 1 }
			} },
			{ $sort : { "_id" : 1 } }
		];
		inquirycollection.aggregate(query42).toArray(function(err, result42) {
			if(err){
			  callback(true,err);
			}
			else{	
			  result42.forEach(function (entry) {
			  	var index = Categories.indexOf(key);
				categoryinquires[index][projectnames.indexOf(entry._id.ProjectName)] = entry.numberofinquiries;
				otherinquiries[projectnames.indexOf(entry._id.ProjectName)] -= entry.numberofinquiries;
			  });
			  callback(false)
			}
		});	
	}, function(err, result){
		if(err){
			callback1(true,result);
		}else{
			callback1(null,projectnames,Categories,categoryinquires,otherinquiries);
		}
	});	
}

function getAllCategories(projectnames,Categories,categoryinquires,otherinquiries,callback1){
	var db = dbConfig.mongoDbConn;

	var inquirycollection = db.collection('InquiryMaster');
	var query43 = [
		{ $match : { "inquiryEntity.associatedCompanyId" : companyId } },
		{ $unwind: "$inquiryEntity.categories" },
		{ $match: { "inquiryEntity.associatedProjectName" : { $ne: null } } },
		{ $group: {
		  _id: null,
		  categories: { $addToSet : "$inquiryEntity.categories" }
		} },
		{ $project: { _id : 0, categories : 1 } } 
	];
	inquirycollection.aggregate(query43).toArray(function(err, result43) {
	    if(err){
	      callback1(true,err);
	    }
	    else{
	      if(result43.length != 0){
	      	allCategories = result43[0].categories;
	      }		
	  	callback1(null,projectnames,Categories,categoryinquires,otherinquiries,allCategories);
	    }
	});
}

function makeResult(projectnames,Categories,categoryinquires,otherinquiries,allCategories,callback1){
	series4.push(
      {
        name: projectnames,
        categories: Categories,
        categoryinquires: categoryinquires,
        otherinquiries: otherinquiries
      }
  	);
	callback1(null,series4,allCategories);  
}