var TAG = "project.js";

var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var s3Upload = require('./s3Upload.js');
var fileOperations = require('./utility/FileOperations.js');
var timezoneConversions = require('../helpers/timezoneConversions.js');
var s3 = require('../../Environment/s3configuration.js');

//Function for adding the New Project Details.
exports.addProject = 
function addProject (req, callback){
	
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;
	
	logger.info(ip + " " + TAG + " Entering addProject.");
	
	//Log the request.
	logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));

	//console.log("Req body: "+JSON.stringify(req.body));
	//console.log("Req files: "+JSON.stringify(req.files));
	//Declare the response
	var resJson;
	
	if( !(	req === null ||
			req.body === null ||
			req.body.projectType === null 	||
			req.body.projectType === undefined 	||
			req.body.projectType.toString().trim().length === 0 )){

			if(req.body.projectType === "residential"){
				addResidentialProject(req, function(error, result){
					if(error){
						getFiles(req, function(error, result){
							fileOperations.removeFiles(result, function(error, result){

							});
						});
					}

					return callback(error, result);
				});
			}
			else if(req.body.projectType === "commercial"){
				addCommercialProject(req, function(error, result){

					if(error){
						getFiles(req, function(error, result){
							fileOperations.removeFiles(result, function(error, result){

							});
						});
					}

					return callback(error, result);
				});
			}
			else{
				getFiles(req, function(error, result){
					fileOperations.removeFiles(result, function(error, result){

					});
				});

				resJson = {
				    "http_code" : "400",
					"message" : "Bad or ill-formed request.."
				};
				logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
				return callback(true, resJson);
			}
	}
	else{

		getFiles(req, function(error, result){
			fileOperations.removeFiles(result, function(error, result){

			});
		});
		
		resJson = {
		    "http_code" : "400",
			"message" : "Bad or ill-formed request.."
		};
		logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
		return callback(true, resJson);
	}
}

//Function that will add residential project.
function addResidentialProject(req, callback){

	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;

	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;
	
	logger.info(ip + " " + TAG + " Entering addResidentialProject.");
	
	//Declare the response
	var resJson;

	//Validate the request.
	if ( !(	
		
		req === null || 
		req.body === null || 
		req.body.companyId === null  	|| 
		req.body.projectName === null 	||
		req.body.projectType === null 	||
		req.body.address1 === null 	||
		//req.body.address2 === null 	||
		req.body.city === null 	||
		req.body.state === null 	||
		req.body.pincode === null 	||

		req.body.companyId === undefined  	|| 
		req.body.projectName === undefined 	||
		req.body.projectType === undefined 	||
		req.body.address1 === undefined 	||
		//req.body.address2 === undefined 	||
		req.body.city === undefined 	||
		req.body.state === undefined 	||
		req.body.pincode === undefined 	||

		req.body.companyId.toString().trim().length === 0  	|| 
		req.body.projectName.toString().trim().length === 0 	||
		req.body.projectType.toString().trim().length === 0 ||
		req.body.address1.toString().trim().length === 0 ||
		//req.body.address2.toString().trim().length === 0 ||
		req.body.city.toString().trim().length === 0	||
		req.body.state.toString().trim().length === 0 ||
		req.body.pincode.toString().trim().length === 0	)){

		var col = db.collection('Builder');
	
		var doc = {
			"projectName": req.body.projectName,
			"residenceType": "",
			"address": {},
			"fromDate": "",
			"toDate": "",
			"projectStage": "",
			"propertyDetails": [],
			"unitsSold": 0,
			"description": "",
			"buildingOrientation": "",
			"website": "",
			"amenities": [],
			"projectImagesURL": [],
			"brouchure": []
		};

			//Calling function that will upload all the images to aws s3.
			uploadImages(req, function(error, result){

				if(error){
					resJson = {
						    "http_code" : "500",
							"message" : " Internal Server Error..Please retry.."
					};

					logger.error(TAG + " Internal Server Error. error: " + error);
					return callback(true, resJson);
				}
				else{

					//Assigning values got from form.
					doc.address.projectAddress = {};
					doc.address.projectAddress["address1"] = req.body.address1;
					//doc.address.projectAddress["address2"] = req.body.address2;
					doc.address.projectAddress["city"] = req.body.city;
					doc.address.projectAddress["state"] = req.body.state;
					doc.address.projectAddress["pincode"] = req.body.pincode;
					
					if(req.body.address2 !== undefined){
						doc.address.projectAddress["address2"] = req.body.address2;
					}else{
						doc.address.projectAddress["address2"] = "";
					}

					if(req.body.residenceType !== undefined){
						doc['residenceType'] = req.body.residenceType;
					}

					if(req.body.fromDate !== undefined){
						doc.fromDate = getDateObj(req.body.fromDate);
					}

					if(req.body.toDate !== undefined){
						doc.toDate = getDateObj(req.body.toDate);
					}

					if(req.body.projectStage !== undefined){
						doc['projectStage'] = req.body.projectStage;
					}

					if(req.body.unitType !== undefined && req.body.noOfUnits !== undefined && req.body.area !== undefined && req.body.pricePerSqft !== undefined){
						doc['propertyDetails'] = getpropertyDetails(req.body.unitType, req.body.noOfUnits, req.body.area, req.body.pricePerSqft);
					}
					else{
						doc['propertyDetails'] = getpropertyDetails("", 0, 0, 0);
					}

					if(req.body.unitsSold !== undefined){
						if(!isNaN(parseFloat(req.body.unitsSold))){
							doc['unitsSold'] =  parseFloat(req.body.unitsSold);
						}
					}

					if(req.body.description !== undefined){
						doc['description'] = req.body.description;
					}

					if(req.body.buildingOrientation !== undefined){
						doc['buildingOrientation'] = req.body.buildingOrientation;
					}

					if(req.body.website !== undefined){
						doc['website'] = req.body.website;
					}

					if(req.body.amenities !== undefined){
						doc['amenities'] = convertToArray(req.body.amenities);
					}
					
					doc.projectImagesURL = result.projectImagesURL;
					doc.brouchure = result.brochure;

					var IMAGES = doc.projectImagesURL;
					var FinalImages = [];
					for(var i = 0; i < IMAGES.length; i++){
						if (IMAGES[i] === null || IMAGES[i] === undefined)
							continue;
						else
							FinalImages.push(IMAGES[i]);
					}

					doc.projectImagesURL = FinalImages;

					req.body.companyId = parseInt(req.body.companyId);

					col.findOne({"builderEntity.profileInfo.accountInfo.companyId": req.body.companyId},
						{"builderEntity.projects.residential": 1}, function(error, result){
							if(!error && (result !== null))
							{
								//calculating project id based on project count.
							    var length = result.builderEntity.projects.residential.length;
							    if(length === 0){
								   	doc['projectId'] = parseInt(length + 1);
								}else {
									doc['projectId'] = parseInt(result.builderEntity.projects.residential[length - 1].projectId + 1);
								}

								col.update({"builderEntity.profileInfo.accountInfo.companyId": req.body.companyId},
										{ $push: {"builderEntity.projects.residential": doc}},function(error, result) {
									if (error) {
										//JSON Structure to be formed for the response object.
										resJson = {	
											    "http_code" : "500",
												"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
										};
										logger.error(ip + " " + TAG + " " + JSON.stringify(error));
										return callback(true, resJson);
									} else {
										resJson = {
											    "http_code" : "200",
												"message" : "New Project Details added successfully."
										};
										logger.debug(ip + " " + TAG + " " + JSON.stringify(resJson));
										return callback(false, resJson);
									}
								});
							}
							else if(!error && (result === null))
							{
								resJson = {
									    "http_code" : "500",
										"message" : "The inputs does not match with our records..Please retry.."
								};

								logger.error(TAG + " Invalid Inputs, Inputs doesnt match with the database records, companyId': " + req.body.companyId);
								return callback(true, resJson);
							}
							else
							{
								resJson = {
									    "http_code" : "500",
										"message" : " Internal Server Error..Please retry.."
								};

								logger.error(TAG + " Internal Server Error. error: " + error);
								return callback(true, resJson);
							}	
					});

				}
			});

		}
		else{
			resJson = {
			    "http_code" : "400",
				"message" : "Bad or ill-formed request.."
			};
			logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
			return callback(true, resJson);
		}
}

//Function that will add commercial project.
function addCommercialProject(req, callback){

	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;

	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;
	
	logger.info(ip + " " + TAG + " Entering addCommercialProject.");
	
	//Declare the response
	var resJson;

	//Validate the request.
	if ( !(	 
		req === null || 
		req.body === null || 
		req.body.companyId === null  	|| 
		req.body.projectName === null 	||
		req.body.projectType === null 	||
		req.body.address1 === null 	||
		//req.body.address2 === null 	||
		req.body.city === null 	||
		req.body.state === null 	||
		req.body.pincode === null 	||

		req.body.companyId === undefined  	|| 
		req.body.projectName === undefined 	||
		req.body.projectType === undefined 	||
		req.body.address1 === undefined 	||
		//req.body.address2 === undefined 	||
		req.body.city === undefined 	||
		req.body.state === undefined 	||
		req.body.pincode === undefined 	||

		req.body.companyId.toString().trim().length === 0  	|| 
		req.body.projectName.toString().trim().length === 0 	||
		req.body.projectType.toString().trim().length === 0 ||
		req.body.address1.toString().trim().length === 0 ||
		//req.body.address2.toString().trim().length === 0 ||
		req.body.city.toString().trim().length === 0	||
		req.body.state.toString().trim().length === 0   ||
		req.body.pincode.toString().trim().length === 0	)) {
		
		var col = db.collection('Builder');
		
		var doc = {
			"projectName": req.body.projectName,
			"applicationType": [],
			"address": {},
			"fromDate": "",
			"toDate": "",
			"projectStage": "",
			"noOfWorkstations": 0,
			"noOfRooms": 0,
			"unitsSold": 0,
			"description": "",
			"buildingOrientation": "",
			"website": "",
			"amenities": [],
			"projectImagesURL": [],
			"brouchure": []
		};

		//Calling function that will upload all the images to aws s3.
		uploadImages(req, function(error, result){

			if(error){
				resJson = {
					    "http_code" : "500",
						"message" : " Internal Server Error..Please retry.."
				};

				logger.error(TAG + " Internal Server Error. error: " + error);
				return callback(true, resJson);
			}
			else{

				//Assigning values got from form.
				doc.address.projectAddress = {};
				doc.address.projectAddress["address1"] = req.body.address1;
				//doc.address.projectAddress["address2"] = req.body.address2;
				doc.address.projectAddress["city"] = req.body.city;
				doc.address.projectAddress["state"] = req.body.state;
				doc.address.projectAddress["pincode"] = req.body.pincode;
				
				if(req.body.address2 !== undefined){
					doc.address.projectAddress["address2"] = req.body.address2;
				}else{
					doc.address.projectAddress["address2"] = "";
				}
				
				if(req.body.applicationType !== undefined){
					doc['applicationType'] = convertToArray(req.body.applicationType);
				}

				if(req.body.fromDate !== undefined){
					doc.fromDate = getDateObj(req.body.fromDate);
				}

				if(req.body.toDate !== undefined){
					doc.toDate = getDateObj(req.body.toDate);
				}

				if(req.body.projectStage !== undefined){
					doc['projectStage'] = req.body.projectStage;
				}

				if(req.body.noOfWorkstations !== undefined){
					if(!isNaN(parseFloat(req.body.noOfWorkstations))){
						doc['noOfWorkstations'] =  parseFloat(req.body.noOfWorkstations);
					}
				}

				if(req.body.noOfRooms !== undefined){
					if(!isNaN(parseFloat(req.body.noOfRooms))){
						doc['noOfRooms'] =  parseFloat(req.body.noOfRooms);
					}
				}

				if(req.body.unitsSold !== undefined){
					if(!isNaN(parseFloat(req.body.unitsSold))){
						doc['unitsSold'] = parseFloat(req.body.unitsSold);
					}
				}

				if(req.body.description !== undefined){
					doc['description'] = req.body.description;
				}

				if(req.body.buildingOrientation !== undefined){
					doc['buildingOrientation'] = req.body.buildingOrientation;
				}

				if(req.body.website !== undefined){
					doc['website'] = req.body.website;
				}

				if(req.body.amenities !== undefined){
					doc['amenities'] = convertToArray(req.body.amenities);
				}
					
				doc['projectImagesURL'] = result.projectImagesURL;
				doc['brouchure'] = result.brochure;

				var IMAGES = doc['projectImagesURL'];
					var FinalImages = [];
					for(var i = 0; i < IMAGES.length; i++){
						if (IMAGES[i] === null || IMAGES[i] === undefined)
							continue;
						else
							FinalImages.push(IMAGES[i]);
					}

				doc['projectImagesURL'] = FinalImages;

				req.body.companyId = parseInt(req.body.companyId);

				col.findOne({"builderEntity.profileInfo.accountInfo.companyId": req.body.companyId},
					{"builderEntity.projects.commercial": 1}, function(error, result){
						if(!error && (result !== null))
						{
							//calculating project id based on project count.
						    var length = result.builderEntity.projects.commercial.length;
						    if(length === 0){
							   	doc['projectId'] = parseInt(length + 1);
							}else {
								doc['projectId'] = parseInt(result.builderEntity.projects.commercial[length - 1].projectId + 1);
							}

							col.update({"builderEntity.profileInfo.accountInfo.companyId": req.body.companyId},
									{ $push: {"builderEntity.projects.commercial": doc}},function(error, result) {
								if (error) {
									//JSON Structure to be formed for the response object.
									resJson = {	
										    "http_code" : "500",
											"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
									};
									logger.error(ip + " " + TAG + " " + JSON.stringify(error));
									return callback(true, resJson);
								} else {
									resJson = {
										    "http_code" : "200",
											"message" : "New Project Details added successfully."
									};
									logger.debug(ip + " " + TAG + " " + JSON.stringify(resJson));
									return callback(false, resJson);
								}
							});
						}
						else if(!error && (result === null))
						{
							resJson = {
								    "http_code" : "500",
									"message" : "The inputs does not match with our records..Please retry.."
							};

							logger.error(TAG + " Invalid Inputs, Inputs doesnt match with the database records, companyId': " + req.body.companyId);
							return callback(true, resJson);
						}
						else
						{
							resJson = {
								    "http_code" : "500",
									"message" : " Internal Server Error..Please retry.."
							};

							logger.error(TAG + " Internal Server Error. error: " + error);
							return callback(true, resJson);
						}	
				});

			}
			
			});
		}
		else{
			resJson = {
			    "http_code" : "400",
				"message" : "Bad or ill-formed request.."
			};
			logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
			return callback(true, resJson);
		}
}

//Function for viewing project details.
exports.viewProject = 
function viewProject (req, callback){

	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;
	
	logger.info(ip + " " + TAG + " Entering viewProject.");
	
	//Log the request.
	logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));

	//Declare the response
	var resJson;

	//Validate the request.
	if ( !(	req === null || 
		req.body === null || 
		req.body.companyId === null ||
		req.body.companyId === undefined  	
		//req.body.companyId.toString().trim().length === 0 
		)) {

		var col = db.collection('Builder');
		
		col.find({"builderEntity.profileInfo.accountInfo.companyId": { $in: req.body.companyId }}).toArray(function(error, result){
				
				if(!error && (result.length > 0))
				{
					var totalProjects = 0;
					var finanlResult = {};
					finanlResult["residential"] = [];
					finanlResult["commercial"] = [];
					finanlResult["projectsCount"] = 0;
					
					try{

						for(var k = 0; k < result.length; k++){
							//Converting date object to string.
							for(var i = 0; i < result[k].builderEntity.projects.residential.length; i++){
								result[k].builderEntity.projects.residential[i].fromDate = getDateString(result[k].builderEntity.projects.residential[i].fromDate);
								result[k].builderEntity.projects.residential[i].toDate = getDateString(result[k].builderEntity.projects.residential[i].toDate);
								result[k].builderEntity.projects.residential[i]["companyId"] = result[k].builderEntity.profileInfo.accountInfo.companyId === undefined ? "": result[k].builderEntity.profileInfo.accountInfo.companyId;
								//result[k].builderEntity.projects.residential[i]["comapanyName"] = result[k].builderEntity.profileInfo.accountInfo.comapanyName === undefined ? "": result[k].builderEntity.profileInfo.accountInfo.comapanyName;
								finanlResult["residential"].push(result[k].builderEntity.projects.residential[i]);
							}

							for(var i = 0; i < result[k].builderEntity.projects.commercial.length; i++){
								result[k].builderEntity.projects.commercial[i].fromDate = getDateString(result[k].builderEntity.projects.commercial[i].fromDate);
								result[k].builderEntity.projects.commercial[i].toDate = getDateString(result[k].builderEntity.projects.commercial[i].toDate);
								result[k].builderEntity.projects.commercial[i]["companyId"] = result[k].builderEntity.profileInfo.accountInfo.companyId === undefined ? "": result[k].builderEntity.profileInfo.accountInfo.companyId;
								//result[k].builderEntity.projects.commercial[i]["comapanyName"] = result[k].builderEntity.profileInfo.accountInfo.comapanyName === undefined ? "": result[k].builderEntity.profileInfo.accountInfo.comapanyName;
								finanlResult["commercial"].push(result[k].builderEntity.projects.commercial[i]);
							}

							totalProjects = totalProjects + result[k].builderEntity.projects.residential.length + result[k].builderEntity.projects.commercial.length;
						}

						//Adding count of projects.
						finanlResult["projectsCount"] = totalProjects;

						resJson = {
						    "http_code" : "200",
							"message" : finanlResult
						};

						logger.debug(ip + " " + TAG + " successfully listed projects.");
						return callback(false, resJson);
					}
					catch(e){
						resJson = {
						    "http_code" : "500",
							"message" : "Internal Server Error..Please retry.."
						};
						logger.debug(ip + " " + TAG + " " + JSON.stringify(resJson));
						return callback(true, resJson);
					}	
				}
				else if(!error && (result.length <= 0))
				{
					resJson = {
						    "http_code" : "500",
							"message" : "The inputs does not match with our records..Please retry.."
					};

					logger.error(TAG + " Invalid Inputs, Inputs doesnt match with the database records, companyId': " + req.body.companyId);
					return callback(true, resJson);
				}
				else
				{
					resJson = {
						    "http_code" : "500",
							"message" : "Internal Server Error..Please retry.."
					};

					logger.error(TAG + " Internal Server Error. error: " + error);
					return callback(true, resJson);
				}
			});		
	}
	else{
		resJson = {
		    "http_code" : "400",
			"message" : "Bad or ill-formed request.."
		};
		logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
		return callback(true, resJson);
		}
	}

//Function for removing project details.
exports.removeProject = 
function removeProject (req, callback){
	
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;
	
	logger.info(ip + " " + TAG + " Entering remove project.");
	
	//Log the request.
	logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));

	//Declare the response
	var resJson;
	
	//Validate the request.
	if ( !(	req === null || 
		req.body === null || 
		req.body.companyId === null  	|| 
		req.body.projectType === null	||
		req.body.projectId === null	||
		req.body.companyId === undefined  	||
		req.body.projectType === undefined	||
		req.body.projectId === undefined	||
		req.body.companyId.toString().trim().length === 0 ||
		req.body.projectType.toString().trim().length === 0	||
		req.body.projectId.toString().trim().length === 0 )) {

		var col = db.collection('Builder');
		var projectType = "builderEntity.projects."+req.body.projectType;
		
		req.body.companyId = parseInt(req.body.companyId);
		req.body.projectId = parseInt(req.body.projectId);
		
		var querObj = {};
		if(req.body.projectType === "residential"){
			querObj = {
				"builderEntity.projects.residential": {
					"projectId": req.body.projectId
				}
			}
		}
		else if(req.body.projectType === "commercial"){
			querObj = {
				"builderEntity.projects.commercial": {
					"projectId": req.body.projectId
				}
			}
		}

		col.update({"builderEntity.profileInfo.accountInfo.companyId": req.body.companyId},
			{ $pull: querObj },function(error, result) {
			if(error){
				//JSON Structure to be formed for the response object.
				resJson = {	
				    "http_code" : "500",
					"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
				};
				logger.error(ip + " " + TAG + " cannot remove project. Error: " + JSON.stringify(error));
				return callback(true, resJson);
			}
			else{

				try{
					result = JSON.parse(result);
				}
				catch(err){
					logger.error(TAG + " Exception - exception araised during parsing result - "+ JSON.stringify(err));
					resJson = {	
					    "http_code" : "500",
						"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
					};
					logger.error(ip + " " + TAG + " cannot remove project. Error: " + JSON.stringify(err));
					return callback(true, resJson);
				}

				if(result.nModified === 0){
					resJson = {
					    "http_code" : "500",
						"message" : "The inputs does not match with our records..Please retry.."
					};
					logger.error(ip + " " + TAG + "The inputs does not match with our records. "+JSON.stringify(result));
					logger.error(TAG + " Invalid Inputs, Inputs doesnt match with the database records, companyId: "+req.body.companyId+", projectType: "+req.body.projectType+", projectId: "+req.body.projectId);
					return callback(true, resJson);
				}
				else{
					resJson = {
					    "http_code" : "200",
						"message" : "Project removed successfully."
					};
					logger.debug(ip + " " + TAG + " Project removed successfully. ");
					return callback(false, resJson);
				}
			}
		});
	}
	else{
		resJson = {
		    "http_code" : "400",
			"message" : "Bad or ill-formed request.."
		};
		logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
		return callback(true, resJson);
	}
}

//Function for updating project details.
exports.updateProject = 
function updateProject (req, callback){
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;
	
	logger.info(ip + " " + TAG + " Entering updateProject.");
	
	//Log the request.
	logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));

	//Declare the response
	var resJson;

	if( !(	req === null ||
			req.body === null ||
			req.body.projectType === null 	||
			req.body.projectType === undefined 	||
			req.body.projectType.toString().trim().length === 0 )){

			if(req.body.projectType === "residential"){
				updateResidentialProject(req, function(error, result){
					if(error){
						getFiles(req, function(error, result){
							fileOperations.removeFiles(result, function(error, result){

							});
						});
					}
					return callback(error, result);
				});
			}
			else if(req.body.projectType === "commercial"){
				updateCommercialProject(req, function(error, result){
					if(error){
						getFiles(req, function(error, result){
							fileOperations.removeFiles(result, function(error, result){

							});
						});
					}
					return callback(error, result);
				});
			}
			else{

				getFiles(req, function(error, result){
					fileOperations.removeFiles(result, function(error, result){

					});
				});

				resJson = {
				    "http_code" : "400",
					"message" : "Bad or ill-formed request.."
				};
				logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
				return callback(true, resJson);
			}
	}
	else{

		getFiles(req, function(error, result){
			fileOperations.removeFiles(result, function(error, result){

			});
		});

		resJson = {
		    "http_code" : "400",
			"message" : "Bad or ill-formed request.."
		};
		logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
		return callback(true, resJson);
	}
}


//Function for updating residential project details.
function updateResidentialProject (req, callback){
	
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;
	
	logger.info(ip + " " + TAG + " Entering updateResidentialProject.");
	
	//Log the request.
	logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));

	//Declare the response
	var resJson;

	//Validate the request.
	if ( !(	req === null || 
		req.body === null || 
		req.body.companyId === null  	||
		req.body.projectId === null		|| 
		req.body.projectName === null 	||
		req.body.projectType === null 	||
		req.body.address1 === null 	||
		//req.body.address2 === null 	||
		req.body.city === null 	||
		req.body.state === null 	||
		req.body.pincode === null 	||

		req.body.companyId === undefined  	||
		req.body.projectId === undefined	|| 
		req.body.projectName === undefined 	||
		req.body.projectType === undefined 	||
		req.body.address1 === undefined 	||
		//req.body.address2 === undefined 	||
		req.body.city === undefined 	||
		req.body.state === undefined 	||
		req.body.pincode === undefined 	||

		req.body.companyId.toString().trim().length === 0  	|| 
		req.body.projectId.toString().trim().length === 0  	|| 
		req.body.projectName.toString().trim().length === 0 	||
		req.body.projectType.toString().trim().length === 0 ||
		req.body.address1.toString().trim().length === 0 ||
		//req.body.address2.toString().trim().length === 0 ||
		req.body.city.toString().trim().length === 0	||
		req.body.state.toString().trim().length === 0   ||
		req.body.pincode.toString().trim().length === 0 )) {
		
		var col = db.collection('Builder');
		
		req.body.companyId = parseInt(req.body.companyId);
		req.body.projectId = parseInt(req.body.projectId);
		
		var doc = {
			"projectId": req.body.projectId,
			"projectName": req.body.projectName,
			"residenceType": "",
			"address": {},
			"fromDate": "",
			"toDate": "",
			"projectStage": "",
			"propertyDetails": [],
			"unitsSold": 0,
			"description": "",
			"buildingOrientation": "",
			"website": "",
			"amenities": [],
			"projectImagesURL": [],
			"brouchure": []
		};
		
		//Calling function that will upload all the images to aws s3.
		uploadImages(req, function(error, imgResult){

			if(error){
				resJson = {
					    "http_code" : "500",
						"message" : " Internal Server Error..Please retry.."
				};

				logger.error(TAG + " Internal Server Error. error: " + error);
				return callback(true, resJson);
			}
			else
			{
				//Assigning values got from form.
				doc.address.projectAddress = {};
				doc.address.projectAddress["address1"] = req.body.address1;
				//doc.address.projectAddress["address2"] = req.body.address2;
				doc.address.projectAddress["city"] = req.body.city;
				doc.address.projectAddress["state"] = req.body.state;
				doc.address.projectAddress["pincode"] = req.body.pincode;
				
				if(req.body.address2 !== undefined){
					doc.address.projectAddress["address2"] = req.body.address2;
				}else{
					doc.address.projectAddress["address2"] = "";
				}
				
				if(req.body.residenceType !== undefined){
					doc['residenceType'] = req.body.residenceType;
				}

				if(req.body.fromDate !== undefined){
					doc.fromDate = getDateObj(req.body.fromDate);
				}

				if(req.body.toDate !== undefined){
					doc.toDate = getDateObj(req.body.toDate);
				}

				if(req.body.projectStage !== undefined){
					doc['projectStage'] = req.body.projectStage;
				}

				if(req.body.unitType !== undefined && req.body.noOfUnits !== undefined && req.body.area !== undefined && req.body.pricePerSqft !== undefined){
					doc['propertyDetails'] = getpropertyDetails(req.body.unitType, req.body.noOfUnits, req.body.area, req.body.pricePerSqft);
				}
				else{
					doc['propertyDetails'] = getpropertyDetails("", 0, 0, 0);
				}

				if(req.body.unitsSold !== undefined){
					if(!isNaN(parseFloat(req.body.unitsSold))){
						doc['unitsSold'] =  parseFloat(req.body.unitsSold);
					}
				}

				if(req.body.description !== undefined){
					doc['description'] = req.body.description;
				}

				if(req.body.buildingOrientation !== undefined){
					doc['buildingOrientation'] = req.body.buildingOrientation;
				}

				if(req.body.website !== undefined){
					doc['website'] = req.body.website;
				}

				if(req.body.amenities !== undefined){
					doc['amenities'] = convertToArray(req.body.amenities);
				}
				
				doc['projectImagesURL'] = [];
				doc['brouchure'] = [];
				
				if(req.body.brochureFile !== undefined){
					doc['brouchure'].push(req.body.brochureFile);
				}	
				else if(imgResult.brochure.length > 0){
					doc['brouchure'] = doc['brouchure'].concat(imgResult.brochure);
				}
				
				col.aggregate([
					{ 
					  $match: {"builderEntity.profileInfo.accountInfo.companyId": req.body.companyId}
					},
					{
						$unwind: "$builderEntity.projects.residential"
					},
					{ 
					  $match: {"builderEntity.projects.residential.projectId": req.body.projectId}
					}
				],function(error, result){
					if(!error && result.length > 0 )
					{
						//Fetching existing images stored.
						var projectImagesURLs = result[0].builderEntity.projects.residential.projectImagesURL;
						
						//Removing files that are to be removed.
						if(req.body.deletedImagePath !== undefined){
						 	projectImagesURLs = getFilesToAdd(projectImagesURLs, req.body.deletedImagePath);
					    }				    

					    //Adding New files added.
			    		doc['projectImagesURL'] = projectImagesURLs.concat(imgResult.projectImagesURL);

			    		var IMAGES = doc['projectImagesURL'];
						var FinalImages = [];
						for(var i = 0; i < IMAGES.length; i++){
							if (IMAGES[i] === null || IMAGES[i] === undefined)
								continue;
							else
								FinalImages.push(IMAGES[i]);
						}

						doc['projectImagesURL'] = FinalImages;
			    		
						col.update({
							"builderEntity.profileInfo.accountInfo.companyId": req.body.companyId,
							"builderEntity.projects.residential.projectId": req.body.projectId
							},
							{ 
								$set: {
									"builderEntity.projects.residential.$": doc
								}
							},function(error, result) {
							if(error){
								//JSON Structure to be formed for the response object.
								resJson = {	
								    "http_code" : "500",
									"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
								};
								logger.error(ip + " " + TAG + " cannot update project. Error: " + JSON.stringify(error));
								return callback(true, resJson);
							}
							else{

								try{
									result = JSON.parse(result);
								}
								catch(err){
									logger.error(TAG + " Exception - exception araised during parsing result - "+ JSON.stringify(err));
									resJson = {	
									    "http_code" : "500",
										"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
									};
									logger.error(ip + " " + TAG + " cannot update project. Error: " + JSON.stringify(err));
									return callback(true, resJson);
								}

								if(result.nModified === 0){
									resJson = {
									    "http_code" : "200",
										"message" : "Project updated successfully."
									};
									return callback(false, resJson);
								}
								else{
									resJson = {
									    "http_code" : "200",
										"message" : "Project updated successfully."
									};
									logger.debug(ip + " " + TAG + " Project updated successfully. ");
									return callback(false, resJson);
								}
							}
						});

					}
					else if(!error && result.length < 1)
					{
						resJson = {
						    "http_code" : "500",
							"message" : "The inputs does not match with our records..Please retry.."
						};
						logger.error(ip + " " + TAG + "The inputs does not match with our records. "+JSON.stringify(result));
						logger.error(TAG + " Invalid Inputs, Inputs doesnt match with the database records, companyId: "+req.body.companyId+", projectType: "+req.body.projectType+", projectId: "+req.body.projectId);
						return callback(true, resJson);
					}
					else
					{
						resJson = {	
						    "http_code" : "500",
							"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
						};
						logger.error(ip + " " + TAG + " cannot update project. Error: " + JSON.stringify(err));
						return callback(true, resJson);
					}
				});
		}
			
		});
	}
	else{
		resJson = {
		    "http_code" : "400",
			"message" : "Bad or ill-formed request.."
		};
		logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
		return callback(true, resJson);
	}
}

//Function for updating commercial project details.
function updateCommercialProject (req, callback){
	
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;
	
	logger.info(ip + " " + TAG + " Entering updateCommercialProject.");
	
	//Log the request.
	logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));

	//Declare the response
	var resJson;

	//Validate the request.
	if ( !(	
		req === null || 
		req.body === null || 
		req.body.companyId === null  	|| 
		req.body.projectName === null 	||
		req.body.projectType === null 	||
		req.body.address1 === null 	||
		//req.body.address2 === null 	||
		req.body.city === null 	||
		req.body.state === null 	||
		req.body.pincode === null 	||

		req.body.companyId === undefined  	|| 
		req.body.projectName === undefined 	||
		req.body.projectType === undefined 	||
		req.body.address1 === undefined 	||
		//req.body.address2 === undefined 	||
		req.body.city === undefined 	||
		req.body.state === undefined 	||
		req.body.pincode === undefined 	||

		req.body.companyId.toString().trim().length === 0  	|| 
		req.body.projectName.toString().trim().length === 0 	||
		req.body.projectType.toString().trim().length === 0 ||
		req.body.address1.toString().trim().length === 0 ||
		//req.body.address2.toString().trim().length === 0 ||
		req.body.city.toString().trim().length === 0	||
		req.body.state.toString().trim().length === 0 	||
		req.body.pincode.toString().trim().length === 0 )) {
		
		var col = db.collection('Builder');

		req.body.companyId = parseInt(req.body.companyId);
		req.body.projectId = parseInt(req.body.projectId);
		
		var doc = {
			"projectId": req.body.projectId,
			"projectName": req.body.projectName,
			"applicationType": [],
			"address": {},
			"fromDate": "",
			"toDate": "",
			"projectStage": "",
			"noOfWorkstations": 0,
			"noOfRooms": 0,
			"unitsSold": 0,
			"description": "",
			"buildingOrientation": "",
			"website": "",
			"amenities": [],
			"projectImagesURL": [],
			"brouchure": []
		};

		//Calling function that will upload all the images to aws s3.
		uploadImages(req, function(error, imgResult){
			//console.log("uploadImages 1");
			if(error){
				resJson = {
					    "http_code" : "500",
						"message" : " Internal Server Error..Please retry.."
				};

				logger.error(TAG + " Internal Server Error. error: " + error);
				return callback(true, resJson);
			}
			else
			{
				//Assigning values got from form.
				doc.address.projectAddress = {};
				doc.address.projectAddress["address1"] = req.body.address1;
				//doc.address.projectAddress["address2"] = req.body.address2;
				doc.address.projectAddress["city"] = req.body.city;
				doc.address.projectAddress["state"] = req.body.state;
				doc.address.projectAddress["pincode"] = req.body.pincode;

				if(req.body.address2 !== undefined){
					doc.address.projectAddress["address2"] = req.body.address2;
				}else{
					doc.address.projectAddress["address2"] = "";
				}
				
				if(req.body.applicationType !== undefined){
					doc['applicationType'] = convertToArray(req.body.applicationType);
				}

				if(req.body.fromDate !== undefined){
					doc.fromDate = getDateObj(req.body.fromDate);
				}

				if(req.body.toDate !== undefined){
					doc.toDate = getDateObj(req.body.toDate);
				}

				if(req.body.projectStage !== undefined){
					doc['projectStage'] = req.body.projectStage;
				}

				if(req.body.noOfWorkstations !== undefined){
					if(!isNaN(parseFloat(req.body.noOfWorkstations))){
						doc['noOfWorkstations'] =  parseFloat(req.body.noOfWorkstations);
					}
				}

				if(req.body.noOfRooms !== undefined){
					if(!isNaN(parseFloat(req.body.noOfRooms))){
						doc['noOfRooms'] =  parseFloat(req.body.noOfRooms);
					}
				}

				if(req.body.unitsSold !== undefined){
					if(!isNaN(parseFloat(req.body.unitsSold))){
						doc['unitsSold'] =  parseFloat(req.body.unitsSold);
					}
				}

				if(req.body.description !== undefined){
					doc['description'] = req.body.description;
				}

				if(req.body.buildingOrientation !== undefined){
					doc['buildingOrientation'] = req.body.buildingOrientation;
				}

				if(req.body.website !== undefined){
					doc['website'] = req.body.website;
				}

				if(req.body.amenities !== undefined){
					doc['amenities'] = convertToArray(req.body.amenities);
				}

				doc['projectImagesURL'] = [];
				doc['brouchure'] = [];

				if(req.body.brochureFile !== undefined){
					doc['brouchure'].push(req.body.brochureFile);
				}	
				else if(imgResult.brochure.length > 0){
					doc['brouchure'] = doc['brouchure'].concat(imgResult.brochure);
				}

				col.aggregate([
					{ 
					  $match: {"builderEntity.profileInfo.accountInfo.companyId": req.body.companyId}
					},
					{
						$unwind: "$builderEntity.projects.commercial"
					},
					{ 
					  $match: {"builderEntity.projects.commercial.projectId": req.body.projectId}
					}
				],function(error, result){	
					if(!error && result.length > 0 )
					{

						//Fetching existing images stored.
						var projectImagesURLs = result[0].builderEntity.projects.commercial.projectImagesURL;
						
						//Removing files that are to be removed.
						if(req.body.deletedImagePath !== undefined){
						 	projectImagesURLs = getFilesToAdd(projectImagesURLs, req.body.deletedImagePath);
					    }				    

					    //Adding New files added.
			    		doc['projectImagesURL'] = projectImagesURLs.concat(imgResult.projectImagesURL);

			    		var IMAGES = doc['projectImagesURL'];
						var FinalImages = [];
						for(var i = 0; i < IMAGES.length; i++){
							if (IMAGES[i] === null || IMAGES[i] === undefined)
								continue;
							else
								FinalImages.push(IMAGES[i]);
						}

						doc['projectImagesURL'] = FinalImages;

						col.update({
								"builderEntity.profileInfo.accountInfo.companyId": req.body.companyId,
								"builderEntity.projects.commercial.projectId": req.body.projectId
							},
							{ 
								$set: {
									"builderEntity.projects.commercial.$": doc
								}
							},function(error, result) {
							if(error){
								//JSON Structure to be formed for the response object.
								resJson = {	
								    "http_code" : "500",
									"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
								};
								logger.error(ip + " " + TAG + " cannot update project. Error: " + JSON.stringify(error));
								return callback(true, resJson);
							}
							else{

								try{
									result = JSON.parse(result);
								}
								catch(err){
									logger.error(TAG + " Exception - exception araised during parsing result - "+ JSON.stringify(err));
									resJson = {	
									    "http_code" : "500",
										"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
									};
									logger.error(ip + " " + TAG + " cannot update project. Error: " + JSON.stringify(err));
									return callback(true, resJson);
								}

								if(result.nModified === 0){
									resJson = {
									    "http_code" : "200",
										"message" : "Project updated successfully."
									};
									return callback(false, resJson);
								}
								else{
									resJson = {
									    "http_code" : "200",
										"message" : "Project updated successfully."
									};
									logger.debug(ip + " " + TAG + " Project updated successfully. ");
									return callback(false, resJson);
								}
							}
						});
					}
					else if(!error && result.length < 1)
					{
						resJson = {
						    "http_code" : "500",
							"message" : "The inputs does not match with our records..Please retry.."
						};
						logger.error(ip + " " + TAG + "The inputs does not match with our records. "+JSON.stringify(result));
						logger.error(TAG + " Invalid Inputs, Inputs doesnt match with the database records, companyId: "+req.body.companyId+", projectType: "+req.body.projectType+", projectId: "+req.body.projectId);
						return callback(true, resJson);
					}
					else
					{
						resJson = {	
						    "http_code" : "500",
							"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
						};
						logger.error(ip + " " + TAG + " cannot update project. Error: " + JSON.stringify(err));
						return callback(true, resJson);
					}
				});
	
		}
	});

	}
	else{
		resJson = {
		    "http_code" : "400",
			"message" : "Bad or ill-formed request.."
		};
		logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
		return callback(true, resJson);
	}
}

//function that will call image uploader function.
function uploadImages(req, callback){
	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;
	//console.log("uploadImages 2");
	var fileTypes = ["projectImageFile", "brochureFile"];
	var tempfilesToRemove = [];
	var filesToUpload = [];
	var finanlResult = {
		"projectImagesURL": [],
		"brochure": []
	};
	var mapping = {
		"projectImageFile" : {
			"typeOfFile": "projectImages",
			"pathToUpload": "Project",
			"acl": "public-read"
		},
		"brochureFile" : {
			"typeOfFile": "brochureFile",
			"pathToUpload": "Brochure",
			"acl": "public-read"
		}
	}

	//console.log("Req Files: "+JSON.stringify(req.files));

	try{

		if(req.files !== undefined){

			//console.log("req.files not undefined.");

			//checking file atributes.
			fileTypes.forEach(function(fileType){
				//console.log("In for each.");
				if(req.files[fileType] !== undefined){
					//console.log("Got images for : "+req.files[fileType]);
					if(Array.isArray(req.files[fileType])){					//if attribute is array.
						req.files[fileType].forEach(function(fileattr){		//getting file name, path of each file in array.
							if(fileattr.size !== 0){
								
								var pathToUpload = "/"+ s3.BUCKET_NAME +"/builder"+req.body.customerSession.id+"/"+mapping[fileType].pathToUpload;
								
								filesToUpload.push(
									{
										"typeOfFile": mapping[fileType].typeOfFile,
										"pathToUpload": pathToUpload,
										"acl": mapping[fileType].acl,
										"filePath": fileattr.path,
										"fileName": fileattr.name
									}
								);	
							}
							else{
								tempfilesToRemove.push(fileattr.path); //If attribute is array and is temporary file with size 0.      
							}
						});
					}
					else{
						if(req.files[fileType].size !== 0){					//if attribute is not array and size is greater than 0 bytes.
							
							var pathToUpload = "/"+ s3.BUCKET_NAME +"/builder"+req.body.customerSession.id+"/"+mapping[fileType].pathToUpload;
							
							filesToUpload.push(
								{
									"typeOfFile": mapping[fileType].typeOfFile,
									"pathToUpload": pathToUpload,
									"acl": mapping[fileType].acl,
									"filePath": req.files[fileType].path,
									"fileName": req.files[fileType].name
								}
							);
						}
						else{
							tempfilesToRemove.push(req.files[fileType].path); //If attribute is not array and is temporary file with size 0.      
						}
					}
				}
			});

			if(filesToUpload.length !== 0){
				s3Upload.intializeS3(filesToUpload, function(error, result){
					
					if(error){
						var filestoRemove = [];

						filesToUpload.forEach(function(file){
							filestoRemove.push(file.filePath);
						});

						fileOperations.removeFiles(filestoRemove.concat(tempfilesToRemove), function(error, result){

						});

						return callback(true, result);
					}
					else{
						fileOperations.removeFiles(tempfilesToRemove, function(error, result){

						});
						
						for(var i = 0; i < result.message.length; i++){
							if(result.message[i].typeOfFile === "projectImages"){
								//console.log("Images list from s3:");
								//console.log(result.message[i].url);
								finanlResult.projectImagesURL.push(result.message[i].url);
							}
							else if(result.message[i].typeOfFile === "brochureFile"){
								finanlResult.brochure.push(result.message[i].url);
							}
						}

						return callback(false, finanlResult);
					}
				});
			}
			else{
				fileOperations.removeFiles(tempfilesToRemove, function(error, result){

				});
				return callback(false, finanlResult);
			}
		}
		else{
			return callback(false, finanlResult);
		}
		
	}
	catch(e){
		logger.error(TAG + " exception araised while fetching files from form, exception: "+ JSON.stringify(e));
		return callback(false, finanlResult);
	}
}

//Function that will combine single objects into array.
function convertToArray(values){
	var arrayValues = [];		
	//If is array. 
	if(Array.isArray(values)){	
		for(var i = 0; i < values.length; i++){
	        arrayValues.push(values[i]);
		}
		return arrayValues;
	}
	else{
		arrayValues.push(values);
		return arrayValues;
	}
}

//Function that will combine unitType, noOfUnits, area, priceSrft values into a single object.
function getpropertyDetails(unitType, noOfUnits, area, priceSrft){

	var propertyDetails = [];

	var obj = {
		"unitType" : "", 
        "noOfUnits" : 0, 
        "area" : 0, 
        "pricePerSqft" : 0
  	};

	//If is array. 
	if(Array.isArray(unitType)){
		for(var i = 0; i < unitType.length; i++){
			
			obj.unitType = unitType[i];
	        obj.noOfUnits = isNaN(parseFloat(noOfUnits[i])) ? 0 : parseFloat(noOfUnits[i]); 
	        obj.area = isNaN(parseFloat(area[i])) ? 0 : parseFloat(area[i]); 
	        obj.pricePerSqft = isNaN(parseFloat(priceSrft[i])) ? 0 : parseFloat(priceSrft[i]);
	        propertyDetails.push(obj);
	        obj = {};
		}
	}
	else{
		obj.unitType = unitType;
        obj.noOfUnits = isNaN(parseFloat(noOfUnits)) ? 0 : parseFloat(noOfUnits); 
        obj.area = isNaN(parseFloat(area)) ? 0 : parseFloat(area); 
        obj.pricePerSqft = isNaN(parseFloat(priceSrft)) ? 0 : parseFloat(priceSrft);
        propertyDetails.push(obj);
	}
	return propertyDetails;
}

//Function that will get date object for date string.
function getDateString(date){
	if(timezoneConversions.validateDate(date)){
		return timezoneConversions.convertDatetoString(date);
	}
	else{
		return "";
	}
}

//Function that will get date object for date string.
function getDateObj(date){
	if(timezoneConversions.validateDate(new Date(date))){
		return new Date(date);
	}
	else{
		return date;
	}
}

//Function that will list the files in file object.
function getFiles(req, callback){
	var fileTypes = ["projectImageFile", "brochureFile"];
	var tempfilesToRemove = [];

	if(req.files !== undefined){
		//checking file atributes.
		fileTypes.forEach(function(fileType){
			if(req.files[fileType] !== undefined){
				if(Array.isArray(req.files[fileType])){					//if attribute is array.
					req.files[fileType].forEach(function(fileattr){		//getting file name, path of each file in array.
						tempfilesToRemove.push(fileattr.path);
					});
				}
				else{
					tempfilesToRemove.push(req.files[fileType].path);
				}
			}
		});
	}

	return callback(false, tempfilesToRemove);
}

function getFilesToAdd(files, filesToRemove){
	var index, newFiles;

	if(! Array.isArray(files)){
		newFiles = [];
		newFiles.push(files); 
	}
	else{
		newFiles = files;
	}

	if(Array.isArray(filesToRemove)){
		for(var i = 0; i < filesToRemove.length; i++){
			index = newFiles.indexOf(filesToRemove[i]);
			if (index > -1) {
			    newFiles.splice(index, 1);
			}
		}
	}
	else{
		index = newFiles.indexOf(filesToRemove);
		if (index > -1) {
		    newFiles.splice(index, 1);
		}
	}
	return newFiles;
}


//Function for viewing project details for get request.
exports.viewProjectDetails = 
function viewProjectDetails (req, callback){

	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;
	
	logger.info(ip + " " + TAG + " Entering viewProjectDetails.");
	
	//Log the request.
	//logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));

	//Declare the response
	var resJson;

	//Validate the request.
	if ( !(	req === null || 
		req.query === null || 
		req.query.companyId === null ||
		req.query.companyId === undefined || 	
		req.query.companyId.toString().trim().length === 0 
		)) {

		var col = db.collection('Builder');
		
		col.find({"builderEntity.profileInfo.accountInfo.companyId": parseInt(req.query.companyId) }).toArray(function(error, result){
				
				if(!error && (result.length > 0))
				{
					var totalProjects = 0;
					var finanlResult = {};
					finanlResult["residential"] = [];
					finanlResult["commercial"] = [];
					finanlResult["projectsCount"] = 0;
					
					try{

						for(var k = 0; k < result.length; k++){
							//Converting date object to string.
							for(var i = 0; i < result[k].builderEntity.projects.residential.length; i++){
								result[k].builderEntity.projects.residential[i].fromDate = getDateString(result[k].builderEntity.projects.residential[i].fromDate);
								result[k].builderEntity.projects.residential[i].toDate = getDateString(result[k].builderEntity.projects.residential[i].toDate);
								result[k].builderEntity.projects.residential[i]["companyId"] = result[k].builderEntity.profileInfo.accountInfo.companyId === undefined ? "": result[k].builderEntity.profileInfo.accountInfo.companyId;
								//result[k].builderEntity.projects.residential[i]["comapanyName"] = result[k].builderEntity.profileInfo.accountInfo.comapanyName === undefined ? "": result[k].builderEntity.profileInfo.accountInfo.comapanyName;
								finanlResult["residential"].push(result[k].builderEntity.projects.residential[i]);
							}

							for(var i = 0; i < result[k].builderEntity.projects.commercial.length; i++){
								result[k].builderEntity.projects.commercial[i].fromDate = getDateString(result[k].builderEntity.projects.commercial[i].fromDate);
								result[k].builderEntity.projects.commercial[i].toDate = getDateString(result[k].builderEntity.projects.commercial[i].toDate);
								result[k].builderEntity.projects.commercial[i]["companyId"] = result[k].builderEntity.profileInfo.accountInfo.companyId === undefined ? "": result[k].builderEntity.profileInfo.accountInfo.companyId;
								//result[k].builderEntity.projects.commercial[i]["comapanyName"] = result[k].builderEntity.profileInfo.accountInfo.comapanyName === undefined ? "": result[k].builderEntity.profileInfo.accountInfo.comapanyName;
								finanlResult["commercial"].push(result[k].builderEntity.projects.commercial[i]);
							}

							totalProjects = totalProjects + result[k].builderEntity.projects.residential.length + result[k].builderEntity.projects.commercial.length;
						}

						//Adding count of projects.
						finanlResult["projectsCount"] = totalProjects;

						resJson = {
						    "http_code" : "200",
							"message" : finanlResult
						};

						logger.debug(ip + " " + TAG + " successfully listed projects.");
						return callback(false, resJson);
					}
					catch(e){
						resJson = {
						    "http_code" : "500",
							"message" : "Internal Server Error..Please retry.."
						};
						logger.debug(ip + " " + TAG + " " + JSON.stringify(resJson));
						return callback(true, resJson);
					}	
				}
				else if(!error && (result.length <= 0))
				{
					resJson = {
						    "http_code" : "500",
							"message" : "The inputs does not match with our records..Please retry.."
					};

					logger.error(TAG + " Invalid Inputs, Inputs doesnt match with the database records, companyId': " + req.query.companyId);
					return callback(true, resJson);
				}
				else
				{
					resJson = {
						    "http_code" : "500",
							"message" : "Internal Server Error..Please retry.."
					};

					logger.error(TAG + " Internal Server Error. error: " + error);
					return callback(true, resJson);
				}
			});		
	}
	else{
		resJson = {
		    "http_code" : "400",
			"message" : "Bad or ill-formed request.."
		};
		logger.error(ip + " " +TAG + " " + JSON.stringify(resJson));
		return callback(true, resJson);
		}
	}


//Function for viewing project details for get request.
exports.listCompanys = 
function listCompanys (req, callback){
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;
	
	logger.info(ip + " " + TAG + " Entering listCompanys.");
	
	//Declare the response
	var resJson;

	var col = db.collection('Builder');
		
	col.find({}, {"builderEntity.profileInfo.accountInfo.companyId": 1}).toArray(function(error, result){
		if(!error && (result.length > 0))
		{
			var companyids = [];

			for(var i = 0; i < result.length; i++){
				try{
					companyids.push(result[i].builderEntity.profileInfo.accountInfo.companyId);
				}
				catch(e){
					logger.info(TAG + " exception in listCompanys: "+JSON.stringify(e));
				}
			}

			resJson = {
				    "http_code" : "200",
					"message" : {
						"companyids": companyids
					}
			};

			logger.error(TAG + " successfully listed companyids ");
			return callback(false, resJson);	
		}
		else if(!error && (result.length <= 0))
		{
			resJson = {
				    "http_code" : "404",
					"message" : {
						"companyids": companyids
					}
			};

			logger.error(TAG + " Cant find companyids ");
			return callback(true, resJson);
		}
		else
		{
			resJson = {
				    "http_code" : "500",
					"message" : "Internal Server Error..Please retry.."
			};

			logger.error(TAG + " Internal Server Error. error: " + error);
			return callback(true, resJson);
		}
	});
}	