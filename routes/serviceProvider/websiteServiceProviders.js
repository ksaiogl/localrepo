/**
 * New node file
 */

var TAG = "websiteServiceProviders.js";
var log = require('../../Environment/log4js.js');
var dbConfig = require('../../Environment/mongoDatabase.js');
var spNotifications = require('./serviceProviderNotifications.js');
var unique = require("array-unique");
var expert = require("./expertise.js");
var timezoneConversions = require('../helpers/timezoneConversions.js');

//Function to fetch All Service Providers.
exports.listAllServiceProviders = 
function listAllServiceProviders (req, callback){
		
		//Variable for Logging the messages to the file.
		var logger = log.logger_sp;
		
		//Get the IP Address of the client.
		var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
		
		logger.info(ip + " " + TAG + " Request received for fetching the Service Providers for Website.");
		
		//Declare the response
		var resJson, serviceAreas = [];
		
		//Variable for Mongo DB Connection. 
		var db = dbConfig.mongoDbConn;
		
		//Validate the request.
		if ( !(	req === null || 
				req.query.cityName === undefined || req.query.cityName.toString().trim().length === 0)) {
		
		var col = db.collection('ServiceProvider');
		col.find({"serviceProviderEntity.profileInfo.basicInfo.expertise":{$exists: true}, "serviceProviderEntity.profileInfo.accountInfo.qcVerified": true, "serviceProviderEntity.profileInfo.businessInfo.serviceAreas.city": req.query.cityName},{"serviceProviderEntity.projectsInfo": 0, "serviceProviderEntity.passwords": 0,"_id": 0}).toArray(function(err, result) {
			if(!err && (result !== null)){
				var spResult = [];
				var experience = 0;
				var j = 0;
				
				for(var i=0,j=0;i<result.length;i++,j++){

					if(result[i].serviceProviderEntity.profileInfo.accountInfo.serviceProviderId === 1523){
						j--;
						continue;
					} else {
						if(result[i].serviceProviderEntity.profileInfo.basicInfo.establishment !== null){
							experience = (new Date().getFullYear() - new Date(result[i].serviceProviderEntity.profileInfo.basicInfo.establishment).getFullYear());
						}else{
							experience = 0;
						}
						
						spResult[j] = {
								"serviceProviderId": result[i].serviceProviderEntity.profileInfo.accountInfo.serviceProviderId,
								"firstName":result[i].serviceProviderEntity.profileInfo.basicInfo.proprietorFirstName,
								"lastName":result[i].serviceProviderEntity.profileInfo.basicInfo.proprietorLastName,
								"companyName":result[i].serviceProviderEntity.profileInfo.basicInfo.company,
								"mobile":result[i].serviceProviderEntity.profileInfo.accountInfo.mobile,
								"email":result[i].serviceProviderEntity.profileInfo.accountInfo.email,
								"photoURL":result[i].serviceProviderEntity.profileInfo.basicInfo.photoURL,
								"yearsOfExperience": experience,
								"expertise":result[i].serviceProviderEntity.profileInfo.basicInfo.expertise,
								"operatingHours":result[i].serviceProviderEntity.profileInfo.businessInfo.operatingHours,
								"materialsAndLabourInfo": result[i].serviceProviderEntity.profileInfo.businessInfo.materialsAndLabourInfo,
								"doesRenovation": result[i].serviceProviderEntity.profileInfo.businessInfo.doesRenovation,
								"noOfProjectsCompleted": result[i].serviceProviderEntity.profileInfo.businessInfo.noOfProjectsCompleted,
								"qcVerified" : result[i].serviceProviderEntity.profileInfo.accountInfo.qcVerified,
								"verificationStatus" : result[i].serviceProviderEntity.profileInfo.accountInfo.verificationStatus,
								"paymentStatus": result[i].serviceProviderEntity.profileInfo.accountInfo.paymentStatus
						}

						try{
							spResult[j].minProjectValue = result[i].serviceProviderEntity.profileInfo.businessInfo.minProjectValue.fixed;
						}
						catch(exception){
							spResult[j].minProjectValue = 0;
						}

						if(result[i].serviceProviderEntity.profileInfo.businessInfo.serviceAreas !== undefined){
							for(var k = 0; k < result[i].serviceProviderEntity.profileInfo.businessInfo.serviceAreas.length; k++){
								serviceAreas.push(result[i].serviceProviderEntity.profileInfo.businessInfo.serviceAreas[k].city);
							}
							spResult[j].serviceCities = serviceAreas;
							serviceAreas = [];
						}
						else{
							spResult[j].serviceCities = serviceAreas;
							serviceAreas = [];
						}

						if(result[i].serviceProviderEntity.profileInfo.accountInfo.verificationPaymentMadeby !== undefined){
							spResult[j].verificationPaymentMadeby = result[i].serviceProviderEntity.profileInfo.accountInfo.verificationPaymentMadeby;
						}
						else{
							spResult[j].verificationPaymentMadeby = null;
						}

						for(var l = 0;l < result[i].serviceProviderEntity.profileInfo.basicInfo.address.length; l++){
							if(result[i].serviceProviderEntity.profileInfo.basicInfo.address[l].type === "OFFICIAL"){
								spResult[j].officialAddress = result[i].serviceProviderEntity.profileInfo.basicInfo.address[l];
							}
						}

					}	
				}
				
				logger.debug(ip + " " + TAG +  " List of Service Providers successfully fetched for Website.");
				resJson = {
					    "http_code" : "200",
						"message" : spResult
				};
				return callback(false, resJson);
				
			} else if(!err && (result === null)) {
				resJson = {
					    "http_code" : "500",
						"message" : "There are no Service Providers with Active Status."
				};
				logger.error(ip + " " + TAG + "  Fetching Service Provider to website from DB failed " + JSON.stringify(resJson));
				return callback(true, resJson);
			}else {
				resJson = {
					    "http_code" : "500",
						"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
				};
				logger.error(ip + " " + TAG + " Fetching Service Provider to website from DB failed: " + err);
				return callback(true, resJson);
				}
		});		
		}else {
			resJson = {
				    "http_code" : "400",
					"message" : "Bad or ill-formed request.."
			};
			logger.error(TAG + " " + JSON.stringify(resJson));
			return callback(false,resJson);
		}	
};


//Function to Capture the Details of the customer.
exports.captureDetails = 
function captureDetails (req, callback){
		
		//Variable for Logging the messages to the file.
		var logger = log.logger_sp;
		
		//Get the IP Address of the client.
		var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
		
		logger.info(ip + " " + TAG + " Request received for capturing the customer data from Website.");
		
		logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));
		
		//Declare the response
		var resJson;
		
		//Variable for Mongo DB Connection. 
		var db = dbConfig.mongoDbConn;
		
		//Validate the request.
		if ( !(	req === null || 
				req.body === null ||
				req.body.customerFirstName === undefined ||
				req.body.customerFirstName === null ||
				req.body.customerFirstName.toString().trim().length === 0 ||
				req.body.customerLastName === undefined ||
				req.body.customerLastName === null ||
				req.body.customerLastName.toString().trim().length === 0 ||
				req.body.mobileNumber === undefined ||
				req.body.mobileNumber === null ||
				req.body.mobileNumber.toString().trim().length === 0 ||
				req.body.email === undefined ||
				req.body.email === null ||
				req.body.email.toString().trim().length === 0||
				req.body.expertiseRequested === undefined ||
				req.body.expertiseRequested === null ||
				req.body.description === undefined ||
				req.body.customerConsent === undefined )) {
			
			//Adding extra fields.

			req.body.requestTimeStamp = new Date();
			req.body.cstmrNotificationSentOn = null;
			req.body.sprtNotificationSentOn = null;
			if(req.body.serviceProviderChosen !== null){
				req.body.serviceProviderChosen.spNotificationSentOn = null
			}

			if(req.body.description === null){
				req.body.description = "";
			}

			var col = db.collection('CustomerRequests');
			col.insert(req.body, {w:1}, function(err, result) {
				if (err) {
					//JSON Structure to be formed for the response object.
					resJson = {	
						    "http_code" : "500",
							"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
					};
					logger.error(ip + " " + TAG + " " + JSON.stringify(err));
					return callback(false,resJson);
				}
				else{
					
					resJson = {
						    "http_code" : "200",
							"message" : "Capturing of Customer Details successful."
					};
					logger.debug(ip + " " + TAG + " " + JSON.stringify(resJson));
					
					
					if(req.body.serviceProviderChosen !== null){
						//GCM notification for service provider, regarding customer interest.
						spNotifications.sendLeadsNotification(req, function(error, result){
						});
					}

					//Email Notifications to Internal mSupply Team to know the customer requests.
					spNotifications.sendServiceProviderRequestEmail(req, function(err, result){
						
					});

					//Email/SMS Notifications to customer regarding service chosen.
					spNotifications.sendCustomerRequestEmail(req, function(err, result){
						
					});

					return callback(true, resJson);
				}
			});	
		}else {
			resJson = {
				    "http_code" : "400",
					"message" : "Bad or ill-formed request.."
			};
			logger.error(TAG + " " + JSON.stringify(resJson));
			return callback(false,resJson);
		}	
};

//Function to fetch All Service Providers.
exports.profileDetails = 
function profileDetails (req, callback){
		
	//Variable for Logging the messages to the file.
	var logger = log.logger_sp;
	
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	
	logger.info(ip + " " + TAG + " Request received for fetching the Profile Details of Service Providers for Website.");
	
	//Declare the response
	var resJson;
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Validate the request.
	if ( !(	req === null || 
			req.body === null||
			req.body.mobile === undefined ||
			req.body.mobile === null ||
			req.body.mobile.toString().trim().length === 0)) {
		
	var mobile = req.body.mobile;
	var col = db.collection('ServiceProvider');
	col.findOne({"serviceProviderEntity.profileInfo.accountInfo.mobile":mobile,"serviceProviderEntity.profileInfo.basicInfo.expertise":{$exists: true}}
	,{"serviceProviderEntity.passwords": 0,"_id": 0}, function(err, result) {
		if(!err && (result !== null)){
			
			/*var projects = [];
			
			for(var i=0;i<result.serviceProviderEntity.projectsInfo.length;i++){
				projects[i] = {
					"projectName" : result[i].serviceProviderEntity.projectsInfo[i].name,
					"startDate" : result[i].serviceProviderEntity.projectsInfo[i].startDate,
					"endDate" : result[i].serviceProviderEntity.projectsInfo[i].endDate,
					"imageURL" : result[i].serviceProviderEntity.projectsInfo[i].imageURL,
					"customerReviews" : result[i].serviceProviderEntity.projectsInfo[i].customerReviews,
				}
			}*/
			
			var address = null;
			for(var i=0;i<result.serviceProviderEntity.profileInfo.basicInfo.address.length;i++){
				if(result.serviceProviderEntity.profileInfo.basicInfo.address[i].type === "OFFICIAL"){
					address = result.serviceProviderEntity.profileInfo.basicInfo.address[i];
					break;
				}else{
					continue;
				}	
			}

			spResult = {
				
				"header":{
					"photoURL": result.serviceProviderEntity.profileInfo.basicInfo.photoURL,
					"status": result.serviceProviderEntity.profileInfo.accountInfo.verificationStatus,
					"companyName": result.serviceProviderEntity.profileInfo.basicInfo.company,
					"serviceAreas": result.serviceProviderEntity.profileInfo.businessInfo.serviceAreas
				},
				
				"officialDetails":{
					"companyName": result.serviceProviderEntity.profileInfo.basicInfo.company,
					"establishedDate": new Date(result.serviceProviderEntity.profileInfo.basicInfo.establishment),
					"noOfProjectsCompleted": result.serviceProviderEntity.profileInfo.businessInfo.noOfProjectsCompleted
				},
				
				"officialAddress" : address,
				
				"expertise":result.serviceProviderEntity.profileInfo.basicInfo.expertise,
				
				"projectsInfo":result.serviceProviderEntity.projectsInfo,
				
				"contract":{
					"operatingHours" : result.serviceProviderEntity.profileInfo.businessInfo.operatingHours,
					"manPower" : result.serviceProviderEntity.profileInfo.basicInfo.manPower,
					"contractSize" : result.serviceProviderEntity.profileInfo.businessInfo.contractSize,
					"materialsAndLabourInfo" : result.serviceProviderEntity.profileInfo.businessInfo.materialsAndLabourInfo
				},
				"rateCard":{
					"consultationCharges" : result.serviceProviderEntity.profileInfo.businessInfo.consultationCharges, 
	                "maxProjectValue" : result.serviceProviderEntity.profileInfo.businessInfo.maxProjectValue, 
	                "minProjectValue" : result.serviceProviderEntity.profileInfo.businessInfo.minProjectValue, 
	                "visitingCharges" : result.serviceProviderEntity.profileInfo.businessInfo.visitingCharges,
				}
			}
			
			logger.debug(ip + " " + TAG +  " Profile details of Service Providers successfully fetched for Website.");
			resJson = {
				    "http_code" : "200",
					"message" : spResult
			};
			return callback(false, resJson);
			
		} else if(!err && (result === null)) {
			resJson = {
				    "http_code" : "500",
					"message" : "There are no Service Providers with Active Status."
			};
			logger.error(ip + " " + TAG + "  Fetching Service Provider's profile data to website from DB failed " + JSON.stringify(resJson));
			return callback(true, resJson);
		}else {
			resJson = {
				    "http_code" : "500",
					"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
			};
			logger.error(ip + " " + TAG + " Fetching Service Provider's profile data to website from DB failed " + err);
			return callback(true, resJson);
		}
	});		
	}else {
		resJson = {
			    "http_code" : "400",
				"message" : "Bad or ill-formed request.."
		};
		logger.error(TAG + " " + JSON.stringify(resJson));
		return callback(false,resJson);
	}	
};

//Function to fetch unique expertise.
exports.uniqueExpertise = 
function uniqueExpertise (req, callback){
		
		//Variable for Logging the messages to the file.
		var logger = log.logger_sp;
		
		//Get the IP Address of the client.
		var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
		
		logger.info(ip + " " + TAG + " Request received for fetching the unique expertise for Website.");
		
		//Declare the response
		var resJson;
		
		//Variable for Mongo DB Connection. 
		var db = dbConfig.mongoDbConn;
		//Validate the request.
		if ( !(	req === null || 
				req.query.cityName === undefined || req.query.cityName.toString().trim().length === 0)) {
		
		var col = db.collection('ServiceProvider');
		col.find({"serviceProviderEntity.profileInfo.basicInfo.expertise":{$exists: true}, "serviceProviderEntity.profileInfo.accountInfo.qcVerified": true, "serviceProviderEntity.profileInfo.businessInfo.serviceAreas.city": req.query.cityName},{"serviceProviderEntity.profileInfo.basicInfo.expertise": 1}).toArray(function(err, result) {
			if(!err && (result !== null)){
				var spResult = [];
				var duplicateExpertise = [];
				var expertiseFetch = [];
				var expertiseList = [];
				
				expert.expertiseFromDB(function(err,resJson){
					logger.info(TAG + " Request processed sucessfully for fetching the Experstise.");
					if(!err){
						expertiseFetch = resJson.message.expertise;
						
						for(var i=0;i<expertiseFetch.length;i++){
							expertiseList.push(expertiseFetch[i].type);
						}
						
						//var expertiseList = ["Civil Contractor","Interior Designer","Architect","Masonry Contractor","Flooring Contractor","Landscaping Consultant","Gardening Consultant","Electrical Contractor","Carpentry Contractor","Home Automation","Plumbing Contractor","Painting Contractor","Solar Solutions","Security Solutions","Granite Layer","Construction Project Manager","Tile Layer","Valuator","Legal Advisor","Borewell services","Civil Engineer","Project Manager","Elevator maintenance","Metal Fabricators","Pest Control","Water proofing solutions","Water suppliers","Wood carving","Others","Educating","Analysis","Test","Handling"];
						var expertiseListWithCount = [];
						var expertiseListWithCountZero = [];
						
						for(var i=0;i<result.length;i++){
							if(result[i].serviceProviderEntity.profileInfo.basicInfo.expertise !== undefined){
								try{
									var expertise = result[i].serviceProviderEntity.profileInfo.basicInfo.expertise;
								}catch(error){
									
								}	
								
								if(expertise !== null && expertise.length >0){
									//console.log("-----------------expertise start i-----------------------");
									//console.log(expertise);
									//console.log(result[i].serviceProviderEntity.profileInfo.accountInfo.serviceProviderId);
									for(var j=0;j<expertise.length;j++){
										duplicateExpertise.push(expertise[j].type);
									}
									//console.log("-----------------expertise end i-----------------------");
								}	
							}	
						}
						
						for(var i=0; i<expertiseList.length; i++){
							
							var expertiseSingle = expertiseList[i];
							var count = 0;
							
							for(var j=0; j<duplicateExpertise.length; j++){
								if(expertiseSingle === duplicateExpertise[j]){
									count++;
								}else{
									continue;
								}
							}
							if(count != 0){
								expertiseListWithCount.push({"type":expertiseSingle,"count":count});
							}else{
								expertiseListWithCountZero.push({"type":expertiseSingle,"count":count});
							}	
						}
						
						//Sort the expertise based on the Numbers.
						expertiseListWithCount.sort(function(a, b) {
						    return (b.count) - (a.count);
						});
						
						expertiseListWithCountZero.sort(function(a,b) {
						    if ( a.type < b.type )
						        return -1;
						    if ( a.type > b.type )
						        return 1;
						    return 0;
						});
						
						for(var i=0; i<expertiseListWithCountZero.length; i++){
							expertiseListWithCount.push(expertiseListWithCountZero[i]);
						}
						
						logger.debug(ip + " " + TAG +  " List of unique expertise successfully fetched for Website.");
						resJson = {
							    "http_code" : "200",
								"message" : expertiseListWithCount
						};
						return callback(false, resJson);
					}	
				});
				
			} else if(!err && (result === null)) {
				resJson = {
					    "http_code" : "500",
						"message" : "There are no unique expertise to fetch."
				};
				logger.error(ip + " " + TAG + "  Fetching Service Provider unique expertise to website from DB failed " + JSON.stringify(resJson));
				return callback(true, resJson);
			}else {
				resJson = {
					    "http_code" : "500",
						"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
				};
				logger.error(ip + " " + TAG + " Fetching Service Provider unique expertise to website from DB failed: " + err);
				return callback(true, resJson);
				}
		});		
		}else {
			resJson = {
				    "http_code" : "400",
					"message" : "Bad or ill-formed request.."
			};
			logger.error(TAG + " " + JSON.stringify(resJson));
			return callback(false,resJson);
		}	
};


exports.listAllServiceProvidersNotQC = 
function listAllServiceProvidersNotQC (req, callback){
		
		//Variable for Logging the messages to the file.
		var logger = log.logger_sp;
		
		//Get the IP Address of the client.
		var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
		
		logger.info(ip + " " + TAG + " Request received for fetching the Service Providers for Website whose QualityChechk is yet to be done.");
		
		//Declare the response
		var resJson;
		
		//Variable for Mongo DB Connection. 
		var db = dbConfig.mongoDbConn;
		
		//Validate the request.
		if ( !(	req === null || 
				req.body === null)) {
		
		var col = db.collection('ServiceProvider');
		col.find({"serviceProviderEntity.profileInfo.basicInfo.expertise":{$exists: true}, "serviceProviderEntity.profileInfo.accountInfo.qcVerified": false},{"serviceProviderEntity.projectsInfo": 0, "serviceProviderEntity.passwords": 0,"_id": 0}).toArray(function(err, result) {
			if(!err && (result !== null)){
				var spResult = [];
				var experience = 0;
				var serviceAreas, cities = [];
				var j = 0;
				
				for(var i=0,j=0;i<result.length;i++,j++){
					cities = [];
					if(result[i].serviceProviderEntity.profileInfo.accountInfo.serviceProviderId === 1523){
						j--;
						continue;
					} else {
						if(result[i].serviceProviderEntity.profileInfo.basicInfo.establishment !== null){
							experience = (new Date().getFullYear() - new Date(result[i].serviceProviderEntity.profileInfo.basicInfo.establishment).getFullYear());
						}else{
							experience = 0;
						}
						
						spResult[j] = {
								"serviceProviderId": result[i].serviceProviderEntity.profileInfo.accountInfo.serviceProviderId,
								"firstName":result[i].serviceProviderEntity.profileInfo.basicInfo.proprietorFirstName,
								"lastName":result[i].serviceProviderEntity.profileInfo.basicInfo.proprietorLastName,
								"companyName":result[i].serviceProviderEntity.profileInfo.basicInfo.company,
								"mobile":result[i].serviceProviderEntity.profileInfo.accountInfo.mobile,
								"email":result[i].serviceProviderEntity.profileInfo.accountInfo.email,
								"photoURL":result[i].serviceProviderEntity.profileInfo.basicInfo.photoURL,
								"yearsOfExperience": experience,
								"expertise":result[i].serviceProviderEntity.profileInfo.basicInfo.expertise,
								"operatingHours":result[i].serviceProviderEntity.profileInfo.businessInfo.operatingHours,
								"materialsAndLabourInfo": result[i].serviceProviderEntity.profileInfo.businessInfo.materialsAndLabourInfo,
								"doesRenovation": result[i].serviceProviderEntity.profileInfo.businessInfo.doesRenovation,
								"noOfProjectsCompleted": result[i].serviceProviderEntity.profileInfo.businessInfo.noOfProjectsCompleted,
								"qcVerified" : result[i].serviceProviderEntity.profileInfo.accountInfo.qcVerified,
								"verificationStatus" : result[i].serviceProviderEntity.profileInfo.accountInfo.verificationStatus,
								"paymentStatus": result[i].serviceProviderEntity.profileInfo.accountInfo.paymentStatus
						}

						try{
							spResult[j].minProjectValue = result[i].serviceProviderEntity.profileInfo.businessInfo.minProjectValue.fixed;
						}
						catch(exception){
							spResult[j].minProjectValue = 0;
						}

						try{
							spResult[j].registrationTimeStamp = timezoneConversions.toIST(result[i].serviceProviderEntity.profileInfo.accountInfo.startDate);
						}
						catch(exception){
							spResult[j].registrationTimeStamp = null;
						}

						try{
							serviceAreas = result[i].serviceProviderEntity.profileInfo.businessInfo.serviceAreas;

							for(var k = 0; k < serviceAreas.length; k++){
								cities.push(serviceAreas[k].city);
							}
						}
						catch(exception){
							spResult[j].cities = cities;
						}
						
						spResult[j].cities = cities;

						if(result[i].serviceProviderEntity.profileInfo.accountInfo.verificationPaymentMadeby !== undefined){
							spResult[j].verificationPaymentMadeby = result[i].serviceProviderEntity.profileInfo.accountInfo.verificationPaymentMadeby;
						}
						else{
							spResult[j].verificationPaymentMadeby = null;
						}

						for(var l = 0;l < result[i].serviceProviderEntity.profileInfo.basicInfo.address.length; l++){
							if(result[i].serviceProviderEntity.profileInfo.basicInfo.address[l].type === "OFFICIAL"){
								spResult[j].officialAddress = result[i].serviceProviderEntity.profileInfo.basicInfo.address[l];
							}
						}

					}	
				}
				
				logger.debug(ip + " " + TAG +  " List of Service Providers successfully fetched for Website.");
				resJson = {
					    "http_code" : "200",
						"message" : spResult
				};
				return callback(false, resJson);
				
			} else if(!err && (result === null)) {
				resJson = {
					    "http_code" : "500",
						"message" : "There are no Service Providers with Active Status."
				};
				logger.error(ip + " " + TAG + "  Fetching Service Provider to website from DB failed " + JSON.stringify(resJson));
				return callback(true, resJson);
			}else {
				resJson = {
					    "http_code" : "500",
						"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
				};
				logger.error(ip + " " + TAG + " Fetching Service Provider to website from DB failed: " + err);
				return callback(true, resJson);
				}
		});		
		}else {
			resJson = {
				    "http_code" : "400",
					"message" : "Bad or ill-formed request.."
			};
			logger.error(TAG + " " + JSON.stringify(resJson));
			return callback(false,resJson);
		}	
};

exports.updateServiceProviderQc = 
function updateServiceProviderQc (req, callback){
	//Variable for Logging the messages to the file.
	var logger = log.logger_sp;
	
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	
	logger.info(ip + " " + TAG + " Request received for updating QC of Service Providers for Website.");
	
	//Declare the response
	var resJson;
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;

	//Validate the request.
		if ( !(	req === null || req.body === null || req.body.serviceProviderId === undefined || req.body.serviceProviderId.toString().trim().length === 0)) {
			var col = db.collection('ServiceProvider');
			col.update({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": req.body.serviceProviderId},
									  {	$set: 
									  		{
									  			"serviceProviderEntity.profileInfo.accountInfo.qcVerified": true
									  		}
									  }, function(error, result){
									  	try{
											result = JSON.parse(result);
										}
										catch(err){
											resJson = {
												    "http_code" : "500",
													"message" : "Error - Updation Failed. Please try again."
											};
											logger.error(TAG + " Exception - exception araised during parsing result - "+err);
											return callback(true, resJson);
										}
									  	
									  	if(error)
									  	{
									  		resJson = {
												    "http_code" : "500",
													"message" : "Error - Updation Failed. Please try again."
											};
									  		return callback(true, resJson);
									  	}
									  	else if(result.n < 1)
									  	{
									  		resJson = {
												    "http_code" : "200",
													"message" : "ServiceProvider data not found."
											};
									  		logger.error(TAG + " Record Not Found - Failed Updating QcVerified flag for serviceprovider : "+req.body.serviceProviderId);
									  		return callback(true, resJson);
									  	} 
										else
										{
											//Trigger email/sms notification to service provider regarding succesfull quality check and listing him in website.
											spNotifications.notifyServiceProviderOnQCVerification(req.body.serviceProviderId, function(err, result){
															
											});

											resJson = {
												    "http_code" : "200",
													"message" : "Updation successfull."
											};
											return callback(false, resJson);
										}
			});
		}
		else{
			resJson = {
				    "http_code" : "400",
					"message" : "Bad or ill-formed request.."
			};
			logger.error(TAG + " " + JSON.stringify(resJson));
			return callback(false,resJson);
		}
};


exports.serviceProviderQcReject = 
function serviceProviderQcReject (req, callback){
	//Variable for Logging the messages to the file.
	var logger = log.logger_sp;
	
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	
	logger.info(ip + " " + TAG + " Request received for updating QC of Service Providers for Website to reject.");
	
	//Declare the response
	var resJson;
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;

	//Validate the request.
		if ( !(	req === null || req.body === null || req.body.serviceProviderId === undefined || req.body.serviceProviderId.toString().trim().length === 0 || req.body.desc === undefined || req.body.desc.toString().trim().length === 0)) {
			var col = db.collection('ServiceProvider');
			col.update({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": req.body.serviceProviderId},
									  {	$set: 
									  		{
									  			"serviceProviderEntity.profileInfo.accountInfo.qcVerified": "rejected",
									  			"serviceProviderEntity.profileInfo.accountInfo.qcrejectReason": req.body.desc,
									  			"serviceProviderEntity.profileInfo.accountInfo.qcrejectedtimestamp": new Date()
									  		}
									  }, function(error, result){
									  	try{
											result = JSON.parse(result);
										}
										catch(err){
											resJson = {
												    "http_code" : "500",
													"message" : "Error - Updation Failed. Please try again."
											};
											logger.error(TAG + " Exception - exception araised during parsing result - "+err);
											return callback(true, resJson);
										}
									  	
									  	if(error)
									  	{
									  		resJson = {
												    "http_code" : "500",
													"message" : "Error - Updation Failed. Please try again."
											};
									  		return callback(true, resJson);
									  	}
									  	else if(result.n < 1)
									  	{
									  		resJson = {
												    "http_code" : "200",
													"message" : "ServiceProvider data not found."
											};
									  		logger.error(TAG + " Record Not Found - Failed Updating QcVerified flag for serviceprovider : "+req.body.serviceProviderId);
									  		return callback(true, resJson);
									  	} 
										else
										{
											logger.error(TAG + " Updated QcVerified flag of serviceprovider : "+req.body.serviceProviderId+", to rejected.");
											//Trigger email/sms notification to service provider regarding succesfull quality check and listing him in website.
											spNotifications.notifyServiceProviderOnQCRejection(req.body.serviceProviderId, req.body.desc, function(err, result){
															
											});
											
											resJson = {
												    "http_code" : "200",
													"message" : "Updation successfull."
											};
											return callback(false, resJson);
										}
			});
		}
		else{
			resJson = {
				    "http_code" : "400",
					"message" : "Bad or ill-formed request.."
			};
			logger.error(TAG + " " + JSON.stringify(resJson));
			return callback(false,resJson);
		}
};


exports.updateVerificationStatus = 
function updateVerificationStatus (req, callback){
	//Variable for Logging the messages to the file.
	var logger = log.logger_sp;
	
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	
	logger.info(ip + " " + TAG + " Request received for updating VerificationStatus of Service Providers for Website.");
	
	//Declare the response
	var resJson;
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;

	//Validate the request.
		if ( !(	req === null || req.body === null || req.body.serviceProviderId === undefined || req.body.serviceProviderId.toString().trim().length === 0 )) {
			var col = db.collection('ServiceProvider');

			col.find({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": req.body.serviceProviderId}).toArray(function(error, result){
				if(!error){
					if(result.length > 0)
					{
						var paymentStatus = result[0].serviceProviderEntity.profileInfo.accountInfo.paymentStatus;
						if(paymentStatus === "Completed"){
							col.update({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": req.body.serviceProviderId},
									  {	$set: 
									  		{
									  			"serviceProviderEntity.profileInfo.accountInfo.verificationStatus": "Completed"
									  		}
									  }, function(error, result){
									  	try{
											result = JSON.parse(result);
										}
										catch(err){
											resJson = {
												    "http_code" : "500",
													"message" : "Error - Updation Failed. Please try again."
											};
											logger.error(TAG + " Exception - exception araised during parsing result while updating verificationStatus - "+err);
											return callback(true, resJson);
										}
									  	
									  	if(error)
									  	{
									  		resJson = {
												    "http_code" : "500",
													"message" : "Error - Updation Failed. Please try again."
											};
									  		return callback(true, resJson);
									  	}
									  	else if(result.n < 1)
									  	{
									  		resJson = {
												    "http_code" : "200",
													"message" : "ServiceProvider data not found."
											};
									  		logger.error(TAG + " Record Not Found - Failed Updating verificationStatus flag for serviceprovider : "+req.body.serviceProviderId);
									  		return callback(false, resJson);
									  	} 
										else
										{
											logger.error(TAG + " Updated verificationStatus flag of serviceprovider : "+req.body.serviceProviderId+", to Completed.");
						
											resJson = {
												    "http_code" : "200",
													"message" : "Updation successfull."
											};
											return callback(false, resJson);
										}
							});
						}
						else{
							resJson = {
							    "http_code" : "200",
								"message" : "Payment is not done by the service provider."
							};
					  		logger.error(TAG + " Payment is not done - Failed Updating verificationStatus flag for serviceprovider : "+req.body.serviceProviderId);
					  		return callback(false, resJson);
						}
						
					}
					else if(result.length === 0){
						resJson = {
							    "http_code" : "200",
								"message" : "ServiceProvider data not found."
						};
				  		logger.error(TAG + " Record Not Found - Failed Updating verificationStatus flag for serviceprovider : "+req.body.serviceProviderId);
				  		return callback(false, resJson);
					}
					else{
						resJson = {
						    "http_code" : "500",
							"message" : "Error - Updation Failed. Please try again."
						};
						logger.error(TAG + " Error occured while fetching Service provider data of - "+req.body.serviceProviderId);
						return callback(true, resJson);
					}
				}
				else{
					resJson = {
						    "http_code" : "500",
							"message" : "Error - Updation Failed. Please try again."
					};
					logger.error(TAG + " Error occured while updating verificationStatus - "+err);
					return callback(true, resJson);
				}
			});

		}
		else{
			resJson = {
				    "http_code" : "400",
					"message" : "Bad or ill-formed request.."
			};
			logger.error(TAG + " " + JSON.stringify(resJson));
			return callback(true, resJson);
		}
}


exports.serviceProviderQcdelist = 
function serviceProviderQcdelist (req, callback){
	//Variable for Logging the messages to the file.
	var logger = log.logger_sp;
	
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	
	logger.info(ip + " " + TAG + " Request received for updating QC of Service Providers for Website to delist.");
	
	//Declare the response
	var resJson;
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;

	//Validate the request.
		if ( !(	req === null || req.body === null || req.body.serviceProviderId === undefined || req.body.serviceProviderId.toString().trim().length === 0 || req.body.desc === undefined || req.body.desc.toString().trim().length === 0)) {
			var col = db.collection('ServiceProvider');
			col.update({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": req.body.serviceProviderId},
									  {	$set: 
									  		{
									  			"serviceProviderEntity.profileInfo.accountInfo.qcVerified": "delisted",
									  			"serviceProviderEntity.profileInfo.accountInfo.qcdelistReason": req.body.desc,
									  			"serviceProviderEntity.profileInfo.accountInfo.qcdelistedtimestamp": new Date()
									  		}
									  }, function(error, result){
									  	try{
											result = JSON.parse(result);
										}
										catch(err){
											resJson = {
												    "http_code" : "500",
													"message" : "Error - Updation Failed. Please try again."
											};
											logger.error(TAG + " Exception - exception araised during parsing result while updating qcVerified to delist- "+err);
											return callback(true, resJson);
										}
									  	
									  	if(error)
									  	{
									  		resJson = {
												    "http_code" : "500",
													"message" : "Error - Updation Failed. Please try again."
											};
									  		return callback(true, resJson);
									  	}
									  	else if(result.n < 1)
									  	{
									  		resJson = {
												    "http_code" : "200",
													"message" : "ServiceProvider data not found."
											};
									  		logger.error(TAG + " Record Not Found - Failed Updating QcVerified flag to delisted for serviceprovider : "+req.body.serviceProviderId);
									  		return callback(false, resJson);
									  	} 
										else
										{
											logger.error(TAG + " Updated QcVerified flag of serviceprovider : "+req.body.serviceProviderId+", to delisted.");
											
											resJson = {
												    "http_code" : "200",
													"message" : "Updation successfull."
											};
											return callback(false, resJson);
										}
			});
		}
		else{
			resJson = {
				    "http_code" : "400",
					"message" : "Bad or ill-formed request.."
			};
			logger.error(TAG + " " + JSON.stringify(resJson));
			return callback(true, resJson);
		}
};

exports.listQcRejected = 
function listQcRejected (req, callback){
	//Variable for Logging the messages to the file.
	var logger = log.logger_sp;
	
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	
	logger.info(ip + " " + TAG + " Request received for listing service providers who are rejected while quality check.");
	
	//Declare the response
	var resJson;
	var finalResult = [];
	var spdoc = {}, serviceAreas = [];
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	var col = db.collection('ServiceProvider');

	col.find({"serviceProviderEntity.profileInfo.accountInfo.qcrejectReason":{$exists: true}, "serviceProviderEntity.profileInfo.accountInfo.qcrejectedtimestamp":{$exists: true}, "serviceProviderEntity.profileInfo.accountInfo.qcVerified": "rejected"}, {}).sort({"serviceProviderEntity.profileInfo.accountInfo.qcrejectedtimestamp": -1})
	.toArray(function(error, result){
		if(!error){
			if(result.length > 0)
			{
				for(var i = 0; i < result.length; i++){
					spdoc['serviceProviderId'] = result[i].serviceProviderEntity.profileInfo.accountInfo.serviceProviderId;
					spdoc['firstName'] = result[i].serviceProviderEntity.profileInfo.basicInfo.proprietorFirstName;
					spdoc['lastName'] = result[i].serviceProviderEntity.profileInfo.basicInfo.proprietorLastName;
					spdoc['mobile'] = result[i].serviceProviderEntity.profileInfo.accountInfo.mobile;
					spdoc['email'] = result[i].serviceProviderEntity.profileInfo.accountInfo.email;
					spdoc['photoURL'] = result[i].serviceProviderEntity.profileInfo.basicInfo.photoURL;
					spdoc['verificationStatus'] = result[i].serviceProviderEntity.profileInfo.accountInfo.verificationStatus;
					spdoc['paymentStatus'] = result[i].serviceProviderEntity.profileInfo.accountInfo.paymentStatus;
					if(result[i].serviceProviderEntity.profileInfo.accountInfo.qcrejectReason !== undefined){
						spdoc['qcrejectReason'] = result[i].serviceProviderEntity.profileInfo.accountInfo.qcrejectReason;
					}
					else{
						spdoc['qcrejectReason'] = null;
					}

					if(result[i].serviceProviderEntity.profileInfo.accountInfo.qcrejectedtimestamp !== undefined){
						spdoc['qcrejectedtimestamp'] = timezoneConversions.toIST(result[i].serviceProviderEntity.profileInfo.accountInfo.qcrejectedtimestamp);
					}
					else{
						spdoc['qcrejectedtimestamp'] = null;
					}

					if(result[i].serviceProviderEntity.profileInfo.businessInfo.serviceAreas !== undefined){
						for(var k = 0; k < result[i].serviceProviderEntity.profileInfo.businessInfo.serviceAreas.length; k++){
							serviceAreas.push(result[i].serviceProviderEntity.profileInfo.businessInfo.serviceAreas[k].city);
						}
						spdoc['serviceCities'] = serviceAreas;
						serviceAreas = [];
					}
					else{
						spdoc['serviceCities'] = serviceAreas;
						serviceAreas = [];
					}

					if(result[i].serviceProviderEntity.profileInfo.accountInfo.verificationPaymentMadeby !== undefined){
						spdoc['verificationPaymentMadeby'] = result[i].serviceProviderEntity.profileInfo.accountInfo.verificationPaymentMadeby;
					}
					else{
						spdoc['verificationPaymentMadeby'] = null;
					}

					for(var l = 0;l < result[i].serviceProviderEntity.profileInfo.basicInfo.address.length; l++){
						if(result[i].serviceProviderEntity.profileInfo.basicInfo.address[l].type === "OFFICIAL"){
							spdoc['officialAddress'] = result[i].serviceProviderEntity.profileInfo.basicInfo.address[l];
						}
					}

					finalResult.push(spdoc);
					spdoc = {};
					
				}
				resJson = {
					    "http_code" : "200",
						"message" : finalResult
				};
				return callback(false, resJson);
			}
			else if(result.length === 0){
				logger.debug(TAG + " Records Not Found - listing service providers who are rejected while quality check.");
				resJson = {
					    "http_code" : "200",
						"message" : []
				};
				return callback(false, resJson);
			}
		}
		else{
			logger.error(TAG + " Error - listing service providers who are rejected while quality check.");
			resJson = {
				    "http_code" : "500",
					"message" : "Error - Listing Failed. Please try again."
			};
			return callback(true, resJson);
		}
	});

}

exports.listQcDelisted = 
function listQcDelisted (req, callback){
	//Variable for Logging the messages to the file.
	var logger = log.logger_sp;
	
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	
	logger.info(ip + " " + TAG + " Request received for listing service providers who are delisted while quality check.");
	
	//Declare the response
	var resJson;
	var finalResult = [];
	var spdoc = {}, serviceAreas = [];
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	var col = db.collection('ServiceProvider');

	col.find({"serviceProviderEntity.profileInfo.accountInfo.qcdelistReason":{$exists: true}, "serviceProviderEntity.profileInfo.accountInfo.qcdelistedtimestamp":{$exists: true}, "serviceProviderEntity.profileInfo.accountInfo.qcVerified": "delisted"}, {}).sort({"serviceProviderEntity.profileInfo.accountInfo.qcdelistedtimestamp": -1})
	.toArray(function(error, result){
		if(!error){
			if(result.length > 0)
			{
				for(var i = 0; i < result.length; i++){

					spdoc['serviceProviderId'] = result[i].serviceProviderEntity.profileInfo.accountInfo.serviceProviderId;
					spdoc['firstName'] = result[i].serviceProviderEntity.profileInfo.basicInfo.proprietorFirstName;
					spdoc['lastName'] = result[i].serviceProviderEntity.profileInfo.basicInfo.proprietorLastName;
					spdoc['mobile'] = result[i].serviceProviderEntity.profileInfo.accountInfo.mobile;
					spdoc['email'] = result[i].serviceProviderEntity.profileInfo.accountInfo.email;
					spdoc['photoURL'] = result[i].serviceProviderEntity.profileInfo.basicInfo.photoURL;
					spdoc['verificationStatus'] = result[i].serviceProviderEntity.profileInfo.accountInfo.verificationStatus;
					spdoc['paymentStatus'] = result[i].serviceProviderEntity.profileInfo.accountInfo.paymentStatus;

					if(result[i].serviceProviderEntity.profileInfo.accountInfo.qcdelistReason !== undefined){
						spdoc['qcdelistReason'] = result[i].serviceProviderEntity.profileInfo.accountInfo.qcdelistReason;
					}
					else{
						spdoc['qcdelistReason'] = null;
					}

					if(result[i].serviceProviderEntity.profileInfo.accountInfo.qcdelistedtimestamp !== undefined){
						spdoc['qcdelistedtimestamp'] = timezoneConversions.toIST(result[i].serviceProviderEntity.profileInfo.accountInfo.qcdelistedtimestamp);
					}
					else{
						spdoc['qcdelistedtimestamp'] = null;
					}

					if(result[i].serviceProviderEntity.profileInfo.businessInfo.serviceAreas !== undefined){
						for(var k = 0; k < result[i].serviceProviderEntity.profileInfo.businessInfo.serviceAreas.length; k++){
							serviceAreas.push(result[i].serviceProviderEntity.profileInfo.businessInfo.serviceAreas[k].city);
						}
						spdoc['serviceCities'] = serviceAreas;
						serviceAreas = [];
					}
					else{
						spdoc['serviceCities'] = serviceAreas;
						serviceAreas = [];
					}

					if(result[i].serviceProviderEntity.profileInfo.accountInfo.verificationPaymentMadeby !== undefined){
						spdoc['verificationPaymentMadeby'] = result[i].serviceProviderEntity.profileInfo.accountInfo.verificationPaymentMadeby;
					}
					else{
						spdoc['verificationPaymentMadeby'] = null;
					}

					for(var l = 0;l < result[i].serviceProviderEntity.profileInfo.basicInfo.address.length; l++){
						if(result[i].serviceProviderEntity.profileInfo.basicInfo.address[l].type === "OFFICIAL"){
							spdoc['officialAddress'] = result[i].serviceProviderEntity.profileInfo.basicInfo.address[l];
						}
					}
					
					finalResult.push(spdoc);
					spdoc = {};
					
				}
				
				resJson = {
					    "http_code" : "200",
						"message" : finalResult
				};
				return callback(false, resJson);
			}
			else if(result.length === 0){
				logger.debug(TAG + " Records Not Found - listing service providers who are delisted while quality check.");
				resJson = {
					    "http_code" : "200",
						"message" : []
				};
				return callback(false, resJson);
			}
		}
		else{
			logger.error(TAG + " Error - listing service providers who are delisted while quality check.");
			resJson = {
				    "http_code" : "500",
					"message" : "Error - Listing Failed. Please try again."
			};
			return callback(true, resJson);
		}
	});

}
