var TAG = "rfqCategoriesSubcategories.js";

var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var async = require('async');
var fetchCompanyIds = require('./utility/getCompanyIds.js');

//Function for fetching categories and subcategories.
exports.getAllcategoriesSubcategories = 
function getAllcategoriesSubcategories (req, callback){
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;
	
	logger.info(ip + " " + TAG + " Entering listing categories and subcategories.");
	
	//Log the request.
	logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));

	//Declare the response
	var resJson;

	var col = db.collection('RFQCategories');
	var subcategoriesList = {};

	col.find({}, {"_id": 0, "categories": 1}).toArray(function(error, result){
		if(error){
			resJson = {
				    "http_code" : "500",
					"message" : "Error while listing all categories and subcategories. Please try later."
			};
			logger.error(TAG + " listing all categories and subcategories failed. Error:" + result);
			return callback(true, resJson);
		}
		else if(!error && result.length > 0){
			resJson = {
			    "http_code" : "200",
				"message" : result[0]
			};
			return callback(false, resJson);
		}
		else if(!error && result.length === 0){
			subcategoriesList["categories"] = [];
			resJson = {
				    "http_code" : "500",
					"message" : subcategoriesList
			};
			logger.error(TAG + " No categories and subcategories found.");
			return callback(true, resJson);
		}
	});
}

//Function for fetching categories and subcategories along with count of suppliers for particular builder.
exports.getAllcategoriesSubcategoriesCount = 
function getAllcategoriesSubcategoriesCount (req, callback){
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;
	
	logger.info(ip + " " + TAG + " Entering listing categories and subcategories along with count of suppliers.");
	
	//Log the request.
	logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));

	//Declare the response
	var resJson;

	var rfqCatCol = db.collection('RFQCategories');
	var rfqBuilderCol = db.collection('Builder');
	
	var maincategory = {}, subcategories = {};
	var finalResult = {
    	"category": []
    };

    var companyIds = fetchCompanyIds.getCompanyIds(req.body.customerSession);

	var finalObj = {}, mainCatObj = {}, subCatObj = {}, subcat = [];
	async.series([
		function(asyncCallback){		//Finding count of main category.

			rfqBuilderCol.aggregate([{
		  		$match: {
		  			"builderEntity.profileInfo.accountInfo.companyId": {
						$in: companyIds
					}
		  	  	}
			  	},
			  	{
					$unwind: "$builderEntity.mySuppliers.suppliersIds"
			  	},
			  	{
					$unwind: "$builderEntity.mySuppliers.suppliersIds.categories"
			  	},
			  	{
			  		$group: {
			  			_id: "$builderEntity.mySuppliers.suppliersIds.categories.mainCategory",
			  			total: { $sum: 1}
			  		}
			  	}], function(error, result){
				if(error){
					logger.error(TAG + " counting of main category for companyIds: "+companyIds+", failed. Error:" + result);
					return asyncCallback(false);
				}
				else if(!error && result.length > 0){
					for(var i = 0; i < result.length; i++){
						maincategory[result[i]._id] = result[i].total
					}

					return asyncCallback(false);
				}
				else if(!error && result.length === 0){
					logger.error(TAG + " main categories not found for companyIds: "+companyIds);
					return asyncCallback(false);
				}
			})
		},
		function(asyncCallback){		//Finding count of sub category.

			rfqBuilderCol.aggregate([{
		  		$match: {
		  			"builderEntity.profileInfo.accountInfo.companyId": {
						$in: companyIds
					}
		  	  	}
			  	},
			  	{
					$unwind: "$builderEntity.mySuppliers.suppliersIds"
			  	},
			  	{
					$unwind: "$builderEntity.mySuppliers.suppliersIds.categories"
			  	},
			  	{
					$unwind: "$builderEntity.mySuppliers.suppliersIds.categories.subCategories"
			  	},
			  	{
			  		$group: {
			  			_id: {
			  			  	"masterCategory": "$builderEntity.mySuppliers.suppliersIds.categories.mainCategory",
			  				"subcategories": "$builderEntity.mySuppliers.suppliersIds.categories.subCategories"
			  				},
			  			total: { $sum: 1}
			  		}
			  	}], function(error, result){
				if(error){
					logger.error(TAG + " count of sub category for companyIds: "+companyIds+", failed. Error:" + result);
					return asyncCallback(false);
				}
				else if(!error && result.length > 0){
					for(var i = 0; i < result.length; i++){
						subcategories[result[i]._id.masterCategory + result[i]._id.subcategories] = result[i].total
					}

					return asyncCallback(false);
				}
				else if(!error && result.length === 0){
					logger.error(TAG + " sub categories not found for companyIds: "+companyIds);
					return asyncCallback(false);
				}
			})
		},
		function(asyncCallback){		//Fetching categories ans sub categories.
			
			rfqCatCol.find({}, {"_id": 0, "categories": 1}).toArray(function(error, result){
				if(error){
					logger.error(TAG + " listing all categories and subcategories failed. Error:" + result);
					return asyncCallback(false);
				}
				else if(!error && result.length > 0){
					var categories = result[0].categories;
					
					var maincategoryCount = 0, totalcategoryCount = 0;

					for(var i = 0; i < categories.length; i++){
						mainCatObj = {
							"name" : categories[i].mainCategory
						};

						for(var j = 0; j < categories[i].subCategories.length; j++){
							subCatObj = {
									"name": categories[i].subCategories[j]
							}

							if(subcategories[categories[i].mainCategory+categories[i].subCategories[j]] === undefined){
								subCatObj["count"] = 0;
							}
							else{
								subCatObj["count"] = subcategories[categories[i].mainCategory+categories[i].subCategories[j]];
								maincategoryCount = maincategoryCount + subcategories[categories[i].mainCategory+categories[i].subCategories[j]];
							}

							subcat.push(subCatObj);
						}

						//adding "select all" object.
						/*subcat.unshift(
							{
					        	"name": "Select All",
					         	"count": maincategoryCount
						    }
						);*/

						if(maincategory[categories[i].mainCategory] === undefined){
							mainCatObj["count"] = 0;
						}
						else{
							mainCatObj["count"] = maincategoryCount;
							totalcategoryCount = totalcategoryCount + maincategoryCount;
						}

						finalObj = {
							"maincategory" : mainCatObj,
							"subcategories": subcat
						}

						finalResult.category.push(finalObj);
						subcat = [];
						maincategoryCount = 0;
					}
					//adding all categories object.
					finalResult.category.unshift(
						{
							"maincategory": {
					        	"name": "All Categories",
					         	"count": totalcategoryCount
					        },
					        "subcategories": []
					    }
					);
					return asyncCallback(false);
				}
				else if(!error && result.length === 0){
					logger.error(TAG + " No categories and subcategories found.");
					return asyncCallback(false);
				}
			});
		}
	], function(error){	//Final function to be called.
		if(error){
			finalResult.category = [];
			resJson = {
			    "http_code" : "500",
				"message" : finalResult
			};
			return callback(true, resJson);
			logger.error(TAG + " Error inserting new notifications to ServiceProviderNotifications for serviceProviderId: "+companyIds);
		}
		else{
			resJson = {
			    "http_code" : "200",
				"message" : finalResult
			};
			return callback(false, resJson);
		}
	});
	
		
}
