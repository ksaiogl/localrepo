/**
 * http://usejsdoc.org/
 */
var TAG = "Profile";

var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var magento = require('../magento/magentoAPI.js');
var spNotifications = require('./serviceProviderNotifications.js');
var crm_serviceprovider = require('./crm_serviceprovider.js');

var crypto = require('crypto');

//Function for the updating the Service Provider.
exports.updateProfile = 
function updateProfile (req, callback){
	
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_sp;
	
	logger.info(ip + " " + TAG + " " + " Update Profile Request Received.");
	
	//Log the request.
	logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));

	//Declare the response
	var resJson;
	
	//Collection for the Service Provider.
	var col = db.collection('ServiceProvider');
	
	//Collection for the Service Provider Update History.
	var history = db.collection('ServiceProviderUpdateHistory');
	
	if(!(req.body.serviceProviderId === null ||
		req.body.serviceProviderId === undefined ||
		req.body.serviceProviderId.toString().trim().length === 0 ))
	{
		var field = req.body.fieldToUpdate;
		
		if(field === "operatingHours"){
			col.findOne({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": req.body.serviceProviderId},{"_id": 0},function(err, presult){
				if(!err && presult !== null){
					col.update({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": req.body.serviceProviderId},
							{$set : {"serviceProviderEntity.profileInfo.businessInfo.operatingHours":req.body.operatingHours}},function(err, result) {
						if(!err && (result !== null)){
							
							try{
								var historyOPHours = presult.serviceProviderEntity.profileInfo.businessInfo.operatingHours;
							}catch(error){
								
							}finally{
								history.insert({
									"serviceProviderHistory": {
										"serviceProviderId": req.body.serviceProviderId,
										"fieldUpdated": req.body.fieldToUpdate,
										"oldValue": historyOPHours,
										"newValue": req.body.operatingHours,
										"updatedTime": new Date()
									}
								});
							}	
							
							resJson = {
								    "http_code" : "200",
									"message" : "Hours of operation Updation Successful."
							};
							logger.info(ip + " " + TAG + " " + JSON.stringify(resJson));
							return callback(false,resJson);
						} else {
							resJson = {
								    "http_code" : "500",
									"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
							};
							
							logger.error(ip + " " + TAG + " Hours of operation Updation Failed" + JSON.stringify(resJson) + " Error :" +  JSON.stringify(err));
							return callback(true,resJson);
						}
					});
				}else if(!err && presult === null){
					resJson = {
						    "http_code" : "500",
							"message" : "Inputs Doesn't Match with our records. Please re-try.."
					};
					logger.error(ip + " " + TAG + " " + JSON.stringify(resJson));
					return callback(true,resJson);
				}else{
					resJson = {
						    "http_code" : "500",
							"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
					};
					logger.error(ip + " " + TAG + " " + JSON.stringify(resJson) + " Error :" + JSON.stringify(err));
					return callback(true,resJson);
				}
			 });
		} else if(field === "paymentModes"){
			col.findOne({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": req.body.serviceProviderId},{"_id": 0},function(err, presult){
				if(!err && presult !== null){
					col.update({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": req.body.serviceProviderId},
							{$set : {"serviceProviderEntity.profileInfo.businessInfo.paymentModes":req.body.paymentModes}},function(err, result) {
						if(!err && (result !== null)){
							
							try{
								var historyPModes = presult.serviceProviderEntity.profileInfo.businessInfo.paymentModes;
							}catch(error){
								
							}finally{
								history.insert({
									"serviceProviderHistory": {
										"serviceProviderId": req.body.serviceProviderId,
										"fieldUpdated": req.body.fieldToUpdate,
										"oldValue": historyPModes,
										"newValue": req.body.paymentModes,
										"updatedTime": new Date()
									}
								});
							}
							
							resJson = {
								    "http_code" : "200",
									"message" : "Payment Modes Updation Successful."
							};
							logger.info(ip + " " + TAG + " " + JSON.stringify(resJson));
							return callback(false,resJson);
						} else {
							resJson = {
								    "http_code" : "500",
									"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
							};
							
							logger.error(ip + " " + TAG + " " + JSON.stringify(resJson) + " Error :" + JSON.stringify(err));
							return callback(true,resJson);
						}
					});
				}else if(!err && presult === null){
					resJson = {
						    "http_code" : "500",
							"message" : "Inputs Doesn't Match with our records. Please re-try.."
					};
					logger.error(ip + " " + TAG + " " + JSON.stringify(resJson));
					return callback(true,resJson);
				}else{
					resJson = {
						    "http_code" : "500",
							"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
					};
					logger.error(ip + " " + TAG + " " + JSON.stringify(resJson) + " Error:" + JSON.stringify(err));
					return callback(true,resJson);
				}
			 });
		} else if(field === "serviceAreas"){
			col.findOne({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": req.body.serviceProviderId},{"_id": 0},function(err, presult){
				if(!err && presult !== null){
					col.update({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": req.body.serviceProviderId},
							{$set : {"serviceProviderEntity.profileInfo.businessInfo.serviceAreas":req.body.serviceAreas}},function(err, result) {
						if(!err && (result !== null)){
							
							try{
								var historySAreas = presult.serviceProviderEntity.profileInfo.businessInfo.serviceAreas;
							}catch(error){
								
							}finally{
								history.insert({
									"serviceProviderHistory": {
										"serviceProviderId": req.body.serviceProviderId,
										"fieldUpdated": req.body.fieldToUpdate,
										"oldValue": historySAreas,
										"newValue": req.body.serviceAreas,
										"updatedTime": new Date()
									}
								});
							}
							
							resJson = {
								    "http_code" : "200",
									"message" : "Service Areas Updation Successful."
							};
							logger.info(ip + " " + TAG + " " + JSON.stringify(resJson));
							return callback(false,resJson);
						} else {
							resJson = {
								    "http_code" : "500",
									"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
							};
							
							logger.error(ip + " " + TAG + " " + JSON.stringify(resJson) + " Error:" + JSON.stringify(err));
							return callback(true,resJson);
						}
					});
				}else if(!err && presult === null){
					resJson = {
						    "http_code" : "500",
							"message" : "Inputs Doesn't Match with our records. Please re-try.."
					};
					logger.error(ip + " " + TAG + " " + JSON.stringify(resJson));
					return callback(true,resJson);
				}else{
					resJson = {
						    "http_code" : "500",
							"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
					};
					logger.error(ip + " " + TAG + " " + JSON.stringify(resJson) + " Error:" + JSON.stringify(err));
					return callback(true,resJson);
				}
			 });
		}else if(field === "legalApproval"){
			col.findOne({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": req.body.serviceProviderId},{"_id": 0},function(err, presult){
				if(!err && presult !== null){
					col.update({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": req.body.serviceProviderId},
							{$set : {"serviceProviderEntity.profileInfo.businessInfo.legalApproval":req.body.legalApproval}},function(err, result) {
						if(!err && (result !== null)){
							
							try{
								var historyLApproval = presult.serviceProviderEntity.profileInfo.businessInfo.legalApproval;
							}catch(error){
								
							}finally{
								history.insert({
									"serviceProviderHistory": {
										"serviceProviderId": req.body.serviceProviderId,
										"fieldUpdated": req.body.fieldToUpdate,
										"oldValue": historyLApproval,
										"newValue": req.body.legalApproval,
										"updatedTime": new Date()
									}
								});
							}
							
							resJson = {
								    "http_code" : "200",
									"message" : "Legal Approval Updation Successful."
							};
							logger.info(ip + " " + TAG + " " + JSON.stringify(resJson));
							return callback(false,resJson);
						} else {
							resJson = {
								    "http_code" : "500",
									"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
							};
							
							logger.error(ip + " " + TAG + " " + JSON.stringify(resJson) + " Error :" + JSON.stringify(err));
							return callback(true,resJson);
						}
					});
				}else if(!err && presult === null){
					resJson = {
						    "http_code" : "500",
							"message" : "Inputs Doesn't Match with our records. Please re-try.."
					};
					logger.error(ip + " " + TAG + " " + JSON.stringify(resJson));
					return callback(true,resJson);
				}else{
					resJson = {
						    "http_code" : "500",
							"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
					};
					logger.error(ip + " " + TAG + " " + JSON.stringify(resJson) + " Error :" + JSON.stringify(err));
					return callback(true,resJson);
				}
			 });
		}else if(field === "accountInfo"){
			var mobile = req.body.accountInfo.mobile;
			var email = req.body.accountInfo.email;

			//Checking database for duplicate mobile nubmer or email id.
			col.find({
			  "serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": { $ne: req.body.serviceProviderId},
			  $or: [
				{"serviceProviderEntity.profileInfo.accountInfo.mobile": mobile},
				{"serviceProviderEntity.profileInfo.accountInfo.email": email}
				]
			}).toArray(function(error, result){
				if(error){
					resJson = {
						    "http_code" : "500",
							"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
					};
					logger.error(TAG + " Error while fetching Service Provider Information for serviceProviderId: " + req.body.serviceProviderId);
					return callback(true, resJson);
				}
				else if(result.length > 0){
					//Checking database for duplicate mobile nubmer or email id and sending appropriate message.
					for(var i = 0; i < result.length; i++){
						try{
							if(result[i].serviceProviderEntity.profileInfo.accountInfo.mobile === mobile){
								resJson = {
									    "http_code" : "500",
										"message" : "Couldn't update Account Info, Because Mobile Number is in use from another user."
								};
								
								logger.error(TAG + " Couldn't update Account Info for serviceProviderId: " + req.body.serviceProviderId + ", mobile number " +mobile+ " is in use.");
								return callback(true, resJson);
							}
							else if(result[i].serviceProviderEntity.profileInfo.accountInfo.email === email){
								resJson = {
									    "http_code" : "500",
										"message" : "Couldn't update Account Info, Because Email ID is in use from another user."
								};
								
								logger.error(TAG + " Couldn't update Account Info for serviceProviderId: " + req.body.serviceProviderId + ", email id " +email+ " is in use.");
								return callback(true, resJson);
							}
						}
						catch(exception){
							resJson = {
							    "http_code" : "500",
								"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
							};
							logger.error(TAG + " Exception while fetching Service Provider Information for serviceProviderId: " + req.body.serviceProviderId +", Exception :"+exception);
							return callback(true, resJson);
						}
					}
				}
				else{
					//Updating in mysql.
					magento.updateProfileDetailsInMagento(req, function(output, mresult){
						if(output){

							getServiceProviderDetailsbyId(req.body.serviceProviderId, function(error, result){
								if(error){
						    		resJson = {
									    "http_code" : "500",
											"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
									};
									logger.error(ip + " " + TAG + " Account Info fetched from Mongo DB result is undefined " + " Error :" + error.message);
									return callback(true, resJson);
						    	}
						    	else{
						    		var accountInfo = {};

						    		col.update({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": req.body.serviceProviderId},
									{$set : {"serviceProviderEntity.profileInfo.accountInfo.firstName":req.body.accountInfo.firstName,
										"serviceProviderEntity.profileInfo.accountInfo.lastName":req.body.accountInfo.lastName,
										"serviceProviderEntity.profileInfo.accountInfo.mobile":req.body.accountInfo.mobile,
										"serviceProviderEntity.profileInfo.accountInfo.email":req.body.accountInfo.email}},function(err, updResult) {
										if(!err){

											//calling CRM upload API.
											crm_serviceprovider.crmUpdation(req.body.serviceProviderId, function(error, result){
												
											});
											
											try{
												accountInfo = {
													"firstName": result.ServiceProvider.serviceProviderEntity.profileInfo.accountInfo.firstName,
													"lastName": result.ServiceProvider.serviceProviderEntity.profileInfo.accountInfo.lastName,
													"mobile": result.ServiceProvider.serviceProviderEntity.profileInfo.accountInfo.mobile,
													"email": result.ServiceProvider.serviceProviderEntity.profileInfo.accountInfo.email
												};
											}catch(error){
												resJson = {
													    "http_code" : "500",
														"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
												};
												logger.error(ip + " " + TAG + " Account Info fetched from Mongo DB result is undefined " + " Error :" + error.message);
												return callback(true, resJson);
											}

											history.insert({
												"serviceProviderHistory": {
													"serviceProviderId": req.body.serviceProviderId,
													"fieldUpdated": req.body.fieldToUpdate,
													"oldValue": accountInfo,
													"newValue": req.body.accountInfo,
													"updatedTime": new Date()
												}
											});
											
											//Email and SMS Notifications for Service Provider for Successful Profile Updation.
											spNotifications.notifyServiceProviderProfileupdation(req.body.accountInfo, function(err, result){
												
											});
											
											resJson = {
												    "http_code" : "200",
													"message" : "Account Information Updation Successful."
											};
											logger.info(TAG + " Account Information Updation Successful for serviceProviderId: " + req.body.serviceProviderId);
											return callback(false, resJson);
										}
										else{
											resJson = {
												    "http_code" : "500",
													"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
											};
											logger.error(TAG + " updation failed in mongodb for serviceProviderId: " + req.body.serviceProviderId);
											return callback(true, resJson);
										}
										});
						    	}
							});
						}
						else{

							if(mresult.status === "Mobile"){
								resJson = {
									    "http_code" : "500",
										"message" : "Couldn't update Account Info, Because Mobile Number is in use from another user."
								};
								logger.error(TAG + " Unexpected Server Error in mysql.");
								return callback(true, resJson);
							}
							else if(mresult.status === "Email"){
								resJson = {
									    "http_code" : "500",
										"message" : "Couldn't update Account Info, Because Email ID is in use from another user."
								};
								logger.error(TAG + " Unexpected Server Error in mysql.");
								return callback(true, resJson);
							}
							else{
								resJson = {
									    "http_code" : "500",
										"message" : "Unexpected Server Error while fulfilling the request."
								};
								logger.error(TAG + " Unexpected Server Error in mysql.");
								return callback(true, resJson);
							}
						}
					});
				}
			});

			
		}else if(field === "expertise"){
			col.findOne({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": req.body.serviceProviderId},{"_id": 0},function(err, presult){
				if(!err && presult !== null){
					col.update({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": req.body.serviceProviderId},
							{$set : {"serviceProviderEntity.profileInfo.basicInfo.expertise":req.body.expertise}},function(err, result) {
						if(!err && (result !== null)){
							
							try{
								var expertiseList = presult.serviceProviderEntity.profileInfo.basicInfo.expertise;
							}catch(error){
		
							}finally{
								history.insert({
									"serviceProviderHistory": {
										"serviceProviderId": req.body.serviceProviderId,
										"fieldUpdated": req.body.fieldToUpdate,
										"oldValue": expertiseList,
										"newValue": req.body.expertise,
										"updatedTime": new Date()
									}
								});
							}
							
							resJson = {
								    "http_code" : "200",
									"message" : "Expertise Updation Successful."
							};
							logger.info(ip + " " + TAG + " " + JSON.stringify(resJson));
							return callback(false,resJson);
						} else {
							resJson = {
								    "http_code" : "500",
									"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
							};
							
							logger.error(ip + " " + TAG + " " + JSON.stringify(resJson) + " Error:" + JSON.stringify(err));
							return callback(true,resJson);
						}
					});
				}else if(!err && presult === null){
					resJson = {
						    "http_code" : "500",
							"message" : "Inputs Doesn't Match with our records. Please re-try.."
					};
					logger.error(ip + " " + TAG + " " + JSON.stringify(resJson));
					return callback(true,resJson);
				}else{
					resJson = {
						    "http_code" : "500",
							"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
					};
					logger.error(ip + " " + TAG + " " + JSON.stringify(resJson) + " Error:" + JSON.stringify(err));
					return callback(true,resJson);
				}
			 });
		}else if(field === "noOfProjectsCompleted"){
			col.findOne({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": req.body.serviceProviderId},{"_id": 0},function(err, presult){
				if(!err && presult !== null){
					col.update({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": req.body.serviceProviderId},
							{$set : {"serviceProviderEntity.profileInfo.businessInfo.noOfProjectsCompleted":req.body.noOfProjectsCompleted}},function(err, result) {
						if(!err && (result !== null)){
							
							try{
								var noOfProjects = presult.serviceProviderEntity.profileInfo.businessInfo.noOfProjectsCompleted;
							}catch(error){
		
							}finally{
								history.insert({
									"serviceProviderHistory": {
										"serviceProviderId": req.body.serviceProviderId,
										"fieldUpdated": req.body.fieldToUpdate,
										"oldValue": noOfProjects,
										"newValue": req.body.noOfProjectsCompleted,
										"updatedTime": new Date()
									}
								});
							}
							
							resJson = {
								    "http_code" : "200",
									"message" : "No Of Projects Updation Successful."
							};
							logger.info(ip + " " + TAG + " " + JSON.stringify(resJson));
							return callback(false,resJson);
						} else {
							resJson = {
								    "http_code" : "500",
									"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
							};
							
							logger.error(ip + " " + TAG + " " + JSON.stringify(resJson) + " Error:" + JSON.stringify(err));
							return callback(true,resJson);
						}
					});
				}else if(!err && presult === null){
					resJson = {
						    "http_code" : "500",
							"message" : "Inputs Doesn't Match with our records. Please re-try.."
					};
					logger.error(ip + " " + TAG + " " + JSON.stringify(resJson));
					return callback(true,resJson);
				}else{
					resJson = {
						    "http_code" : "500",
							"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
					};
					logger.error(ip + " " + TAG + " " + JSON.stringify(resJson) + " Error:" + JSON.stringify(err));
					return callback(true,resJson);
				}
			 });
		}else if(field === "officialAddress"){
			col.findOne({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": req.body.serviceProviderId},{"_id": 0},function(err, presult){
				if(!err && presult !== null){
					
					var address = [];
					
					try{
						if(presult.serviceProviderEntity.profileInfo.basicInfo.address !== undefined){
							address[0] = req.body.officialAddress;
						}else{
							address = presult.serviceProviderEntity.profileInfo.basicInfo.address;
							
							for(var i=0; i<address.length; i++){
								if(address[i].type === "OFFICIAL"){
									address[i] = req.body.officialAddress;
									console.log(address[i]);
									break;
								}
							}
						}
					}catch(error){
						address[0] = req.body.officialAddress;
					}	
					
				col.update({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": req.body.serviceProviderId},
							{$set : {"serviceProviderEntity.profileInfo.basicInfo.address":address}},function(err, result) {
						if(!err && (result !== null)){
							try{
								var addressHistory = presult.serviceProviderEntity.profileInfo.basicInfo.address;
							}catch(error){
								
							}finally{
								history.insert({
									"serviceProviderHistory": {
										"serviceProviderId": req.body.serviceProviderId,
										"fieldUpdated": req.body.fieldToUpdate,
										"oldValue": addressHistory,
										"newValue": req.body.officialAddress,
										"updatedTime": new Date()
									}
								});
							}
							
							//calling CRM upload API.
							crm_serviceprovider.crmUpdation(req.body.serviceProviderId, function(error, result){
								
							});
							
							resJson = {
								    "http_code" : "200",
									"message" : "Official Address Updation Successful."
										
							};
							logger.info(ip + " " + TAG + " " + JSON.stringify(resJson));
							return callback(false,resJson);
						} else {
							resJson = {
								    "http_code" : "500",
									"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
							};
							
							logger.error(ip + " " + TAG + " " + JSON.stringify(resJson) + " Error:" + JSON.stringify(err));
							return callback(true,resJson);
						}
					});
				}else if(!err && presult === null){
					resJson = {
						    "http_code" : "500",
							"message" : "Inputs Doesn't Match with our records. Please re-try.."
					};
					logger.error(ip + " " + TAG + " " + JSON.stringify(resJson));
					return callback(true,resJson);
				}else{
					resJson = {
						    "http_code" : "500",
							"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
					};
					logger.error(ip + " " + TAG + " " + JSON.stringify(resJson) + " Error:" + JSON.stringify(err));
					return callback(true,resJson);
				}
			 });
		}else if(field === "doesRenovation"){
			col.findOne({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": req.body.serviceProviderId},{"_id": 0},function(err, presult){
				if(!err && presult !== null){
					col.update({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": req.body.serviceProviderId},
							{$set : {"serviceProviderEntity.profileInfo.businessInfo.doesRenovation":req.body.doesRenovation}},function(err, result) {
						if(!err && (result !== null)){
							
							try{
								var renovationFlag = presult.serviceProviderEntity.profileInfo.businessInfo.doesRenovation;
							}catch(error){
								
							}finally{
								history.insert({
									"serviceProviderHistory": {
										"serviceProviderId": req.body.serviceProviderId,
										"fieldUpdated": req.body.fieldToUpdate,
										"oldValue": renovationFlag,
										"newValue": req.body.doesRenovation,
										"updatedTime": new Date()
									}
								});
							}
							
							resJson = {
								    "http_code" : "200",
									"message" : "Does Renovation Updation Successful."
							};
							logger.info(ip + " " + TAG + " " + JSON.stringify(resJson));
							return callback(false,resJson);
						} else {
							resJson = {
								    "http_code" : "500",
									"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
							};
							
							logger.error(ip + " " + TAG + " " + JSON.stringify(resJson) + " Error :" + JSON.stringify(err));
							return callback(true,resJson);
						}
					});
				}else if(!err && presult === null){
					resJson = {
						    "http_code" : "500",
							"message" : "Inputs Doesn't Match with our records. Please re-try.."
					};
					logger.error(ip + " " + TAG + " " + JSON.stringify(resJson));
					return callback(true,resJson);
				}else{
					resJson = {
						    "http_code" : "500",
							"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
					};
					logger.error(ip + " " + TAG + " " + JSON.stringify(resJson) + " Error :" + JSON.stringify(err));
					return callback(true,resJson);
				}
			 });
		}else if(field === "materialsAndLabourInfo"){
			col.findOne({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": req.body.serviceProviderId},{"_id": 0},function(err, presult){
				if(!err && presult !== null){
					col.update({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": req.body.serviceProviderId},
							{$set : {"serviceProviderEntity.profileInfo.businessInfo.materialsAndLabourInfo":req.body.materialsAndLabourInfo}},function(err, result) {
						if(!err && (result !== null)){
							
							try{
								var matLabourInfo = presult.serviceProviderEntity.profileInfo.businessInfo.materialsAndLabourInfo;
							}catch(error){
								
							}finally{
								history.insert({
									"serviceProviderHistory": {
										"serviceProviderId": req.body.serviceProviderId,
										"fieldUpdated": req.body.fieldToUpdate,
										"oldValue": matLabourInfo,
										"newValue": req.body.materialsAndLabourInfo,
										"updatedTime": new Date()
									}
								});
							}
							
							resJson = {
								    "http_code" : "200",
									"message" : "Material And Labour Information Update Successful."
							};
							logger.info(ip + " " + TAG + " " + JSON.stringify(resJson));
							return callback(false,resJson);
						} else {
							resJson = {
								    "http_code" : "500",
									"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
							};
							
							logger.error(ip + " " + TAG + " " + JSON.stringify(resJson) + " Error :" + JSON.stringify(err));
							return callback(true,resJson);
						}
					});
				}else if(!err && presult === null){
					resJson = {
						    "http_code" : "500",
							"message" : "Inputs Doesn't Match with our records. Please re-try.."
					};
					logger.error(ip + " " + TAG + " " + JSON.stringify(resJson));
					return callback(true,resJson);
				}else{
					resJson = {
						    "http_code" : "500",
							"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
					};
					logger.error(ip + " " + TAG + " " + JSON.stringify(resJson) + " Error :" + JSON.stringify(err));
					return callback(true,resJson);
				}
			 });
		}else if(field === "feesAndCharges"){
			col.findOne({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": req.body.serviceProviderId},{"_id": 0},function(err, presult){
				if(!err && presult !== null){
					col.update({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": req.body.serviceProviderId},
							{$set : {"serviceProviderEntity.profileInfo.businessInfo.consultationCharges":req.body.feesAndCharges.consultationCharges,
								"serviceProviderEntity.profileInfo.businessInfo.maxProjectValue":req.body.feesAndCharges.maxProjectValue,
								"serviceProviderEntity.profileInfo.businessInfo.minProjectValue":req.body.feesAndCharges.minProjectValue,
								"serviceProviderEntity.profileInfo.businessInfo.visitingCharges":req.body.feesAndCharges.visitingCharges}},function(err, result) {
						if(!err && (result !== null)){
							var consolidatedCharges;
							try{
								var consultationCharges = presult.serviceProviderEntity.profileInfo.businessInfo.consultationCharges;
								var maxProjectValue = presult.serviceProviderEntity.profileInfo.businessInfo.maxProjectValue;
								var minProjectValue = presult.serviceProviderEntity.profileInfo.businessInfo.minProjectValue;
								var visitingCharges = presult.serviceProviderEntity.profileInfo.businessInfo.visitingCharges;
								consolidatedCharges = consultationCharges + ", " + maxProjectValue + ", " + minProjectValue + ", " + visitingCharges;
							}catch(error){
								
							}finally{
								history.insert({
									"serviceProviderHistory": {
										"serviceProviderId": req.body.serviceProviderId,
										"fieldUpdated": req.body.fieldToUpdate,
										"oldValue": consolidatedCharges,
										"newValue": req.body.feesAndCharges,
										"updatedTime": new Date()
									}
								});
							}
							
							resJson = {
								    "http_code" : "200",
									"message" : "Fees And Charges Information Update Successful."
							};
							logger.info(ip + " " + TAG + " " + JSON.stringify(resJson));
							return callback(false,resJson);
						} else {
							resJson = {
								    "http_code" : "500",
									"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
							};
							
							logger.error(ip + " " + TAG + " " + JSON.stringify(resJson) + " Error :" + JSON.stringify(err));
							return callback(true,resJson);
						}
					});
				}else if(!err && presult === null){
					resJson = {
						    "http_code" : "500",
							"message" : "Inputs Doesn't Match with our records. Please re-try.."
					};
					logger.error(ip + " " + TAG + " " + JSON.stringify(resJson));
					return callback(true,resJson);
				}else{
					resJson = {
						    "http_code" : "500",
							"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
					};
					logger.error(ip + " " + TAG + " " + JSON.stringify(resJson) + " Error :" + JSON.stringify(err));
					return callback(true,resJson);
				}
			 });
		}else if(field === "basicInfo"){
			col.findOne({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": req.body.serviceProviderId},{"_id": 0},function(err, presult){
				if(!err && presult !== null){
					col.update({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": req.body.serviceProviderId},
							{$set : {"serviceProviderEntity.profileInfo.basicInfo.photoURL":req.body.basicInfo.photoURL,
								"serviceProviderEntity.profileInfo.basicInfo.proprietorFirstName":req.body.basicInfo.proprietorFirstName,
								"serviceProviderEntity.profileInfo.basicInfo.proprietorLastName":req.body.basicInfo.proprietorLastName,
								"serviceProviderEntity.profileInfo.basicInfo.company":req.body.basicInfo.company,
								"serviceProviderEntity.profileInfo.basicInfo.establishment":req.body.basicInfo.establishment,
								"serviceProviderEntity.profileInfo.basicInfo.website":req.body.basicInfo.website,
								"serviceProviderEntity.profileInfo.basicInfo.email":req.body.basicInfo.email,
								"serviceProviderEntity.profileInfo.basicInfo.mobile":req.body.basicInfo.mobile}},function(err, result) {
						if(!err && (result !== null)){
							try{
								
								var basicInfo = {
									"basicInfo" : 
										{
							                "photoURL" : req.body.basicInfo.photoURL, 
							                "proprietorFirstName" : req.body.basicInfo.proprietorFirstName, 
							                "proprietorLastName" : req.body.basicInfo.proprietorLastName, 
							                "company" :req.body.basicInfo.company, 
							                "establishment" : req.body.basicInfo.establishment,
							                "website" :req.body.basicInfo.website, 
							                "email" : req.body.basicInfo.email, 
							                "mobile" : req.body.basicInfo.mobile,
										}
									}
							}catch(error){
								
							}finally{
								history.insert({
									"serviceProviderHistory": {
										"serviceProviderId": req.body.serviceProviderId,
										"fieldUpdated": req.body.fieldToUpdate,
										"oldValue": presult.serviceProviderEntity.profileInfo.basicInfo,
										"newValue": basicInfo,
										"updatedTime": new Date()
									}
								});
							}
							
							//calling CRM upload API.
							crm_serviceprovider.crmUpdation(req.body.serviceProviderId, function(error, result){
								
							});

							resJson = {
								    "http_code" : "200",
									"message" : "Basic-Info Information Update Successful."
							};
							logger.info(ip + " " + TAG + " " + JSON.stringify(resJson));
							return callback(false,resJson);
						} else {
							resJson = {
								    "http_code" : "500",
									"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
							};
							
							logger.error(ip + " " + TAG + " " + JSON.stringify(resJson) + " Error :" + JSON.stringify(err));
							return callback(true,resJson);
						}
					});
				}else if(!err && presult === null){
					resJson = {
						    "http_code" : "500",
							"message" : "Inputs Doesn't Match with our records. Please re-try.."
					};
					logger.error(ip + " " + TAG + " " + JSON.stringify(resJson));
					return callback(true,resJson);
				}else{
					resJson = {
						    "http_code" : "500",
							"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
					};
					logger.error(ip + " " + TAG + " " + JSON.stringify(resJson) + " Error :" + JSON.stringify(err));
					return callback(true,resJson);
				}
			 });
		}  
	}
		else {
		resJson = {
			    "http_code" : "400",
				"message" : "Bad or ill-formed request.."
		};
		logger.error(ip + " " + TAG + " " + JSON.stringify(resJson));
		return callback(true,resJson);
	}	
};

//Function that will get serviceprovider details for serviceprovider id given.
function getServiceProviderDetailsbyId(serviceproviderId, callback){

	var db = dbConfig.mongoDbConn;
	var logger = log.logger_sp;
	var ServiceProviderCol = db.collection('ServiceProvider');
	var finalResult = {
		ServiceProvider : null
	}
	ServiceProviderCol.find({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": serviceproviderId}).toArray(function(error, result){
		if(error){
			logger.error(TAG + " Error while fetching serviceProvider information for serviceProvider id: "+serviceproviderId);
			return callback(true);
		}
		else if(!error && result.length === 0){
			logger.debug(TAG + " Service Provider information not found for serviceProvider id: "+serviceproviderId);
			return callback(true);
		}
		else if(!error && result.length > 0){
			logger.debug(TAG + " Got service provider information for serviceProvider id: "+serviceproviderId);
			try{
				finalResult.ServiceProvider = result[0];
			}
			catch(exception){
				logger.error(TAG + " Exception araised while fetching serviceprovider info from ServiceProvider id: "+serviceproviderId+", exception : "+exception);
				return callback(true);
			}
			return callback(false, finalResult);
		}
	});
}						
						
						
