var TAG = "project.js";

var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var async = require('async');

//Function for adding the New Project Details.
exports.addProject = 
function addProject (req, callback){
	
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_sp;
	
	logger.info(ip + " " + TAG + " Entering addProject.");
	
	//Log the request.
	logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));

	//Declare the response
	var resJson;
	
	//Validate the request.
	if ( !(	req === null || 
			req.body === null || 
			req.body.serviceProviderId === null  	|| 
			req.body.mobile === null 	||
			req.body.name === null 	|| 
			req.body.startDate === null     ||
			req.body.endDate === null  	|| 
			req.body.city === null 	||
			req.body.location === null 	||
			req.body.value === null     ||
			req.body.valueCurrency === null 	|| 
			req.body.materialAndLaborInfo === null     ||
			req.body.serviceProviderId === undefined  	|| 
			req.body.mobile === undefined 	||
			req.body.name === undefined 	||
			req.body.startDate === undefined        ||
			req.body.endDate === undefined  	|| 
			req.body.city === undefined 	||
			req.body.location === undefined 	||
			req.body.value === undefined        ||
			req.body.valueCurrency === undefined 	||
			req.body.materialAndLaborInfo === undefined        ||
			req.body.serviceProviderId.toString().trim().length === 0  	|| 
			req.body.mobile.toString().trim().length === 0 	||
			req.body.name.toString().trim().length === 0 ||
			req.body.startDate.toString().trim().length === 0 ||
			req.body.endDate.toString().trim().length === 0  	|| 
			req.body.city.toString().trim().length === 0 	||
			req.body.location.toString().trim().length === 0 	||
			req.body.value.toString().trim().length === 0 ||
			req.body.valueCurrency.toString().trim().length === 0 ||
			req.body.materialAndLaborInfo.toString().trim().length === 0 )) {
		
			var serviceProviderId = req.body.serviceProviderId;
			var mobile = req.body.mobile;
			var imageURL = req.body.imageURL;
			var projectName = req.body.name;
			var startDate = req.body.startDate;
			var endDate = req.body.endDate;
			var description = req.body.description;
			var city = req.body.city;
			var location = req.body.location;
			var projectValue = req.body.value;
			var projectValueCurrency = req.body.valueCurrency;
			var materialAndLaborInfo = req.body.materialAndLaborInfo;
		
		var col = db.collection('ServiceProvider');
		var doc = {
				"projectId":0,
				"imageURL":imageURL,
				"name":projectName,
				"startDate":startDate,
				"endDate":endDate,
				"description":description,
				"city":city,
				"location":location,
				"value":projectValue,
				"valueCurrency":projectValueCurrency, 
				"materialAndLaborInfo":materialAndLaborInfo,
		};

	col.findOne({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": serviceProviderId,"serviceProviderEntity.profileInfo.accountInfo.mobile": mobile},
			{"serviceProviderEntity.projectsInfo": 1},function(err, result){
		
	   if(!err && (result !== null)){

		   var length = result.serviceProviderEntity.projectsInfo.length;
		   
		   if(length === 0){
			   	doc.projectId  = length + 1;
				result.serviceProviderEntity.projectsInfo[0] = doc
			}else {
				doc.projectId = (result.serviceProviderEntity.projectsInfo[length - 1].projectId + 1);
				result.serviceProviderEntity.projectsInfo[length] = doc
			}	
			   
			col.update({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": serviceProviderId,"serviceProviderEntity.profileInfo.accountInfo.mobile": mobile},
					{$set : {"serviceProviderEntity.projectsInfo":result.serviceProviderEntity.projectsInfo}},function(err, result) {
				if (err) {
					//JSON Structure to be formed for the response object.
					resJson = {	
						    "http_code" : "500",
							"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
					};
					logger.error(ip + " " + TAG + " " + JSON.stringify(err));
					return callback(false,resJson);
				} else {
					resJson = {
						    "http_code" : "200",
							"message" : "New Project Details added successfully."
					};
					logger.debug(ip + " " + TAG + " " + JSON.stringify(resJson));
					return callback(true,resJson);
				}
			});
	   }else if(!err && (result === null)){
			resJson = {
				    "http_code" : "500",
					"message" : "Adding New Project Details Failed. Please try again."
			};
			logger.debug(ip + " " + TAG + " User with " + mobile + " no is already registered" + JSON.stringify(resJson));
			return callback(true,resJson);
		}else{
			resJson = {	
				    "http_code" : "500",
					"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
			};
			logger.error(ip + " " + TAG + " " + JSON.stringify(err));
			return callback(false,resJson);
		}
	});  
} else {
	resJson = {
		    "http_code" : "400",
			"message" : "Bad or ill-formed request.."
	};
	logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
	return callback(false,resJson);
	}
};

//Function for Editing the Project Details.
exports.editProject = 
function editProject (req, callback){
	
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_sp;
	
	logger.info(ip + " " + TAG + " Entering editProject.");
	
	//Log the request.
	logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));

	//Declare the response
	var resJson;
	
	//Validate the request.
	if ( !(	req === null || 
			req.body === null || 
			req.body.serviceProviderId === null  	|| 
			req.body.mobile === null 	||
			req.body.projectId === null 	||
			req.body.name === null 	|| 
			req.body.startDate === null     ||
			req.body.endDate === null  	|| 
			req.body.city === null 	||
			req.body.location === null 	||
			req.body.value === null     ||
			req.body.valueCurrency === null 	|| 
			req.body.materialAndLaborInfo === null     ||
			req.body.serviceProviderId === undefined  	|| 
			req.body.mobile === undefined 	||
			req.body.projectId === undefined 	||
			req.body.name === undefined 	||
			req.body.startDate === undefined        ||
			req.body.endDate === undefined  	|| 
			req.body.city === undefined 	||
			req.body.location === undefined 	||
			req.body.value === undefined        ||
			req.body.valueCurrency === undefined 	||
			req.body.materialAndLaborInfo === undefined        ||
			req.body.serviceProviderId.toString().trim().length === 0  	|| 
			req.body.mobile.toString().trim().length === 0 	||
			req.body.projectId.toString().trim().length === 0 	||
			req.body.name.toString().trim().length === 0 ||
			req.body.startDate.toString().trim().length === 0 ||
			req.body.endDate.toString().trim().length === 0  	|| 
			req.body.city.toString().trim().length === 0 	||
			req.body.location.toString().trim().length === 0 	||
			req.body.value.toString().trim().length === 0 ||
			req.body.valueCurrency.toString().trim().length === 0 ||
			req.body.materialAndLaborInfo.toString().trim().length === 0 )) {
		
			var serviceProviderId = req.body.serviceProviderId;
			var mobile = req.body.mobile;
			var projectId = req.body.projectId;
			var imageURL = req.body.imageURL;
			var projectName = req.body.name;
			var startDate = req.body.startDate;
			var endDate = req.body.endDate;
			var description = req.body.description;
			var city = req.body.city;
			var location = req.body.location;
			var projectValue = req.body.value;
			var projectValueCurrency = req.body.valueCurrency;
			var materialAndLaborInfo = req.body.materialAndLaborInfo;
		
		var col = db.collection('ServiceProvider');
		var doc = {
				"projectId":projectId,
				"imageURL":imageURL,
				"name":projectName,
				"startDate":startDate,
				"endDate":endDate,
				"description":description,
				"city":city,
				"location":location,
				"value":projectValue,
				"valueCurrency":projectValueCurrency, 
				"materialAndLaborInfo":materialAndLaborInfo,
		};

	col.findOne({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": serviceProviderId,"serviceProviderEntity.profileInfo.accountInfo.mobile": mobile},
			{"serviceProviderEntity.projectsInfo": 1},function(err, result){
		
	   if(!err && (result !== null)){
		
		if(result.serviceProviderEntity.projectsInfo !== null){
			var length = result.serviceProviderEntity.projectsInfo.length;
			for(var i = 0; i<length; i++){
				if(result.serviceProviderEntity.projectsInfo[i].projectId === projectId){
					result.serviceProviderEntity.projectsInfo[i] = doc;
				}	
			}	
		}
		   
		col.update({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": serviceProviderId,"serviceProviderEntity.profileInfo.accountInfo.mobile": mobile},
				{$set : {"serviceProviderEntity.projectsInfo":result.serviceProviderEntity.projectsInfo}},function(err, result) {
			if (err) {
				//JSON Structure to be formed for the response object.
				resJson = {	
					    "http_code" : "500",
						"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
				};
				logger.error(ip + " " + TAG + " " + JSON.stringify(err));
				return callback(false,resJson);
			} else {
				resJson = {
					    "http_code" : "200",
						"message" : "Project Details Updated successfully."
				};
				logger.debug(ip + " " + TAG + " " + JSON.stringify(resJson));
				return callback(true,resJson);
			}
		});
	   }else if(!err && (result === null)){
			resJson = {
				    "http_code" : "500",
					"message" : "Updating Project Details Failed. Please try again."
			};
			logger.debug(ip + " " + TAG + " User with " + mobile + " no is already registered" + JSON.stringify(resJson));
			return callback(true,resJson);
		}else{
			resJson = {	
				    "http_code" : "500",
					"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
			};
			logger.error(ip + " " + TAG + " " + JSON.stringify(err));
			return callback(false,resJson);
		}
	});  
} else {
	resJson = {
		    "http_code" : "400",
			"message" : "Bad or ill-formed request.."
	};
	logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
	return callback(false,resJson);
	}
};

//Function for Deleting the project.
exports.deleteProject = 
function deleteProject (req, callback){
	
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_sp;
	
	logger.info(ip + " " + TAG + " Entering Deleting Project.");
	
	//Log the request.
	logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));

	//Declare the response
	var resJson;
	
	//Validate the request.
	if ( !(	req === null || 
			req.body === null || 
			req.body.serviceProviderId === null  	|| 
			req.body.mobile === null 	||
			req.body.projectId === null 	||
			req.body.serviceProviderId === undefined  	|| 
			req.body.mobile === undefined 	||
			req.body.projectId === undefined 	||
			req.body.serviceProviderId.toString().trim().length === 0  	|| 
			req.body.mobile.toString().trim().length === 0 	||
			req.body.projectId.toString().trim().length === 0)) {
		
			var serviceProviderId = req.body.serviceProviderId;
			var mobile = req.body.mobile;
			var projectId = req.body.projectId;
		
		var col = db.collection('ServiceProvider');

	col.findOne({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": serviceProviderId,"serviceProviderEntity.profileInfo.accountInfo.mobile": mobile},
			{"serviceProviderEntity.projectsInfo": 1},function(err, result){
		
	   if(!err && (result !== null)){ 
		   
		if(result.serviceProviderEntity.projectsInfo.length !== 0){
			var length = result.serviceProviderEntity.projectsInfo.length;
			for(var i = 0; i<length; i++){
				if(result.serviceProviderEntity.projectsInfo[i].projectId === projectId){
					result.serviceProviderEntity.projectsInfo.splice(i,1);
					break;
				}	
			}	
		}else{
			resJson = {
				    "http_code" : "200",
					"message" : "There are no projects to delete."
			};
			logger.debug(ip + " " + TAG + " " + JSON.stringify(resJson));
			return callback(true,resJson);
		}
		
		col.update({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": serviceProviderId,"serviceProviderEntity.profileInfo.accountInfo.mobile": mobile},
				{$set : {"serviceProviderEntity.projectsInfo":result.serviceProviderEntity.projectsInfo}},function(err, result) {
			if (err) {
				//JSON Structure to be formed for the response object.
				resJson = {	
					    "http_code" : "500",
						"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
				};
				logger.error(ip + " " + TAG + " " + JSON.stringify(err));
				return callback(false,resJson);
			} else {
				resJson = {
					    "http_code" : "200",
						"message" : "Project Deleted successfully."
				};
				logger.debug(ip + " " + TAG + " " + JSON.stringify(resJson));
				return callback(true,resJson);
			}
		});
	   }else if(!err && (result === null)){
			resJson = {
				    "http_code" : "500",
					"message" : "Deleting Project Failed. Please try again."
			};
			logger.debug(ip + " " + TAG + " Deleting the project failed." + JSON.stringify(resJson));
			return callback(true,resJson);
		}else{
			resJson = {	
				    "http_code" : "500",
					"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
			};
			logger.error(ip + " " + TAG + " " + JSON.stringify(err));
			return callback(false,resJson);
		}
	});  
} else {
	resJson = {
		    "http_code" : "400",
			"message" : "Bad or ill-formed request.."
	};
	logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
	return callback(false,resJson);
	}
};



//Function for adding ids to the project.
exports.addProjectIds = 
function addProjectIds (req, callback){
	
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_sp;
	
	logger.info(ip + " " + TAG + " Entering addding ids to Project.");
	
	//Log the request.
	logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));

	//Declare the response
	var resJson;
	
	//Validate the request.
	if ( !(	req === null || 
			req.body === null || 
			req.body.serviceProviderIds === null  	|| 
			req.body.serviceProviderIds === undefined  	|| 
			req.body.serviceProviderIds.toString().trim().length === 0)) {
		
			var serviceProviderIds = req.body.serviceProviderIds;
		
		var col = db.collection('ServiceProvider');

	col.find({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": {$in:serviceProviderIds}},
			{"serviceProviderEntity.projectsInfo": 1,"serviceProviderEntity.profileInfo.accountInfo":1}).toArray(function(err, result){
		
	   if(!err && (result !== null)){ 
		   
		if(result.length !== 0){
			var length = result.length;
			
			async.forEachSeries(result,
				function(requestObj, asyncCallback){
					var projectsLength = requestObj.serviceProviderEntity.projectsInfo.length;
					for(var j=0; j<projectsLength ;j++){
						requestObj.serviceProviderEntity.projectsInfo[j].projectId = (j+1);
					}

					col.update({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId":requestObj.serviceProviderEntity.profileInfo.accountInfo.serviceProviderId},
						{$set:{"serviceProviderEntity.projectsInfo":requestObj.serviceProviderEntity.projectsInfo}},function(err,presult){

						if(!err){
							logger.debug(ip + " " + TAG + " " + " Updating the project ID's Successful.");
							return asyncCallback(false);	
						}
						else{
							logger.debug(ip + " " + TAG + " " + JSON.stringify(resJson));
							return asyncCallback(true);
						}	
					});
				},
				//Final Function to be called upon completion of all functions.
			function(error)
			{
			 	if(error){
			 		resJson = {	
					    "http_code" : "500",
						"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
					};
					logger.error(ip + " " + TAG + " " + JSON.stringify(err));
					return callback(true, resJson);
			 	}
			 	else{
			 		resJson = {
					    "http_code" : "200",
						"message" : "Updated projectIds successfully."
					};
					logger.debug(ip + " " + TAG + " " + JSON.stringify(resJson));
					return callback(false, resJson);
			 	}
			});
				
		}
		else{
			resJson = {
				    "http_code" : "200",
					"message" : "There are no projects to update projectID."
			};
			logger.debug(ip + " " + TAG + " " + JSON.stringify(resJson));
			return callback(true,resJson);
		}
		
	   }
	   else if(!err && (result === null)){
			resJson = {
				    "http_code" : "200",
					"message" : "No record found. Please try again."
			};
			logger.debug(ip + " " + TAG + " no records found for Updating projectID" + JSON.stringify(resJson));
			return callback(false, resJson);
		}
		else{
			resJson = {
				    "http_code" : "500",
					"message" : "Updating ProjectID Failed. Please try again."
			};
			logger.debug(ip + " " + TAG + " Updating the projectID failed." + JSON.stringify(resJson));
			return callback(true, resJson);
		}
	});  
}
else {
	resJson = {
		    "http_code" : "400",
			"message" : "Bad or ill-formed request.."
	};
	logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
	return callback(false, resJson);
}
};

