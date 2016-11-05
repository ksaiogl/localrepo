var TAG = "Registration";

var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var magento = require('../magento/magentoAPI.js');
var spNotifications = require('./serviceProviderNotifications.js');
var crm_serviceprovider = require('./crm_serviceprovider.js');

//Module for generating the OTP.
var otp = require('otplib/lib/totp');

var crypto = require('crypto');
var request = require("request");

//Function for the registering the Service Provider.
exports.register = 
function register (req, callback){
	
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_sp;
	
	logger.info(ip + " " + TAG + " Entering register.");
	
	//Log the request.
	logger.info(ip + " " + TAG + " " + JSON.stringify(req.body));

	//Declare the response
	var resJson;
	
	//Validate the request.
	if ( !(	req === null || 
			req.body === null || 
			req.body.firstName === null  	|| 
			req.body.lastName === null 	||
			req.body.mobile === null 	||
			req.body.password === null 	|| 
			req.body.email === null     ||
			req.body.expertise === null ||
			req.body.companyName === null ||
			req.body.establishedYear === null ||
			req.body.addressLine1 === null ||
			req.body.city === null ||
			req.body.state === null ||
			req.body.pincode === null ||
			req.body.proprietorFirstName === null ||
			req.body.proprietorLastName === null ||
			req.body.typeOfFirm === null ||
			req.body.dob === null ||
			req.body.firstName === undefined  	|| 
			req.body.lastName === undefined 	||
			req.body.mobile === undefined 	||
			req.body.password === undefined 	||
			req.body.email === undefined        ||
			req.body.expertise === undefined ||
			req.body.companyName === undefined ||
			req.body.establishedYear === undefined ||
			req.body.addressLine1 === undefined ||
			req.body.city === undefined ||
			req.body.state === undefined ||
			req.body.pincode === undefined ||
			req.body.proprietorFirstName === undefined ||
			req.body.proprietorLastName === undefined ||
			req.body.typeOfFirm === undefined ||
			req.body.dob === undefined ||
			req.body.firstName.toString().trim().length === 0  	|| 
			req.body.lastName.toString().trim().length === 0 	||
			req.body.mobile.toString().trim().length === 0 	||
			req.body.email.toString().trim().length === 0 ||
			req.body.password.toString().trim().length === 0 ||
			req.body.companyName.toString().trim().length === 0 ||
			req.body.establishedYear.toString().trim().length === 0 ||
			req.body.addressLine1.toString().trim().length === 0 ||
			req.body.city.toString().trim().length === 0 ||
			req.body.state.toString().trim().length === 0 ||
			req.body.pincode.toString().trim().length === 0 ||
			req.body.proprietorFirstName.toString().trim().length === 0 ||
			req.body.proprietorLastName.toString().trim().length === 0 ||
			req.body.typeOfFirm.toString().trim().length === 0 ||
			req.body.dob.toString().trim().length === 0)) {

		var firstName = req.body.firstName;
		var lastName = req.body.lastName;
		var mobile = req.body.mobile;
		var emailId = req.body.email;	
		var pass = req.body.password;
		
		var expertise = req.body.expertise;
		var companyName = req.body.companyName;
		var estdYear = req.body.establishedYear;
		var website = req.body.website;
		var addrLine1 = req.body.addressLine1;
		var addrLine2 = req.body.addressLine2;
		var city = req.body.city;
		var state = req.body.state;
		var pincode = req.body.pincode;
		
		var propFirstName = req.body.proprietorFirstName;
		var propLastName = req.body.proprietorLastName;
		var typeFirm = req.body.typeOfFirm;
		
		var fatherName = req.body.fatherName === undefined ? null : req.body.fatherName;
		var dob = req.body.dob;

		//Default service ares for service provider.
		var initalServiceArea = {
            "city" : req.body.city, 
            "cityServiceAreas" : [

            ]
        };
        var spServiceAreas = [];
        spServiceAreas.push(initalServiceArea);
        
		// user secret key 
		var secret = otp.utils.generateSecret();
		// OTP code 
		var code = otp.generate(secret);
		
		var col = db.collection('ServiceProvider');
		var passwordHash = crypto.createHash('md5').update(pass).digest('hex');
		var doc = {
				"serviceProviderEntity": {
					"profileInfo": {
						"accountInfo": {
							"customerId": 0,
							"serviceProviderId": 0,
							"firstName": firstName,
							"lastName": lastName,
							"mobile": mobile,
							"email": emailId,
							"serviceTaxNumber": null,
							"PAN": null,
							"TIN": null,
							"AadharNumber": null,
							"startDate": new Date(),
							"endDate": "",
							"lastLogin":"",
							"isActive": false,
							"qcVerified" : false,
							"verificationStatus": "NA",
							"paymentStatus":"NA",
							"termsAccepted":false,
							"termsAcceptedTime":null,
							"verificationStatusMail":"Not Sent"
						}, 
			            "basicInfo" : {
			                "photoURL" : null, 
			                "proprietorFirstName" : propFirstName, 
			                "proprietorLastName" : propLastName, 
			                "company" : companyName, 
			                "typeOfFirm" : typeFirm, 
			                "establishment" : estdYear, 
			                "manPower" : null, 
			                "website" : website, 
			                "email" : null, 
	                        "telephone" : null, 
	                        "mobile" : null,
	                        "dob": dob,
	                        "fatherName": fatherName,
			                "expertise" : expertise, 
			                "address" : [
			                    {
			                        "type" : "OFFICIAL", 
			                        "address1" : addrLine1, 
			                        "address2" : addrLine2, 
			                        "address3" : null, 
			                        "city" : city, 
			                        "state" : state, 
			                        "country" : "India", 
			                        "pincode" : pincode
			                    }
			                ]
			            },
			             "businessInfo" : {
				                "operatingHours" : null, 
				                "contractSize" : null, 
				                "paymentModes" : null, 
				                "serviceAreas" : spServiceAreas, 
				                "natureOfBusiness" : null, 
				                "noOfProjectsCompleted" : 0, 
				                "noOfBranches" : 0, 
				                "legalApproval" : false, 
				                "doesRenovation" : "No", 
				                "branchList" : null, 
				                "consultationCharges" : null, 
				                "maxProjectValue" : null, 
				                "minProjectValue" : null, 
				                "visitingCharges" : null, 
				                "materialsAndLabourInfo" : ""
						}
					 },
					"passwords": {
						"lastGeneratedOTP": 0,
						"previousPasswordHash": "",
						"passwordHash": passwordHash,
						"registrationOTP": code
					}, 
					"projectsInfo" : [],
					"appInfo": {
			            "currentAppVersion" : null, 
			            "cloudTokenID" : []
			        }
				}
		};

		//Validation to check whether the Service Provider is already registered.
		col.find({$or: [{"serviceProviderEntity.profileInfo.accountInfo.mobile": mobile}, 
			{"serviceProviderEntity.profileInfo.accountInfo.email": emailId}]}).toArray(function(err, result){
			
			if(!err && (result.length !== 0)){
				
				//Checking database for duplicate mobile nubmer or email id and sending appropriate message.
				for(var i = 0; i < result.length; i++){
					try{
						if(result[i].serviceProviderEntity.profileInfo.accountInfo.mobile === mobile){
							resJson = {
								    "http_code" : "500",
									"message" : "Mobile Number is already registered."
							};
							
							logger.error(TAG + " Couldn't register service provider, since mobile number: " + mobile + " is already in use.");
							return callback(true, resJson);
						}
						else if(result[i].serviceProviderEntity.profileInfo.accountInfo.email === emailId){
							resJson = {
								    "http_code" : "500",
									"message" : "Email ID is already registered."
							};
							
							logger.error(TAG + " Couldn't register service provider, since email id: " + emailId + " is already in use.");
							return callback(true, resJson);
						}
					}
					catch(exception){
						resJson = {
						    "http_code" : "500",
							"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
						};
						logger.error(TAG + " Exception while fetching Service Provider Information for mobile: " + mobile +", email: "+emailId +", Exception: "+exception);
						return callback(true, resJson);
					}
				}
			}
			else if(!err && (result.length === 0)){
				magento.registerInMagento(req, function(output, result, customerId, customerType){
				if(output){
					
					//Updating the Customer ID for the Service Provider.
					doc.serviceProviderEntity.profileInfo.accountInfo.customerId = customerId;
					
					//Updating the service Provider ID for the Service Provider.
					doc.serviceProviderEntity.profileInfo.accountInfo.serviceProviderId = customerId;
					

					col.findOne({"serviceProviderEntity.profileInfo.accountInfo.serviceProviderId": customerId},function(error, result){
						if(!error && result !== null){
							resJson = {
								    "http_code" : "500",
									"message" : "Email ID is already registered."
							};
							logger.debug(ip + " " + TAG + " User with " + emailId + "  is already registered" + JSON.stringify(resJson));
							return callback(true, resJson);
						}
						else if(!error && result === null){
							//Using the {w:1} option ensure you get the error back if the document fails to insert correctly.
							doc.serviceProviderEntity.profileInfo.accountInfo['customerType'] = customerType;
							col.insert(doc, {w:1}, function(err, result) {
								if (err) {
									//JSON Structure to be formed for the response object.
									resJson = {	
										    "http_code" : "500",
											"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
									};
									logger.error(ip + " " + TAG + " " + JSON.stringify(err));
									return callback(false, resJson);
								} else {
									
									//Email and SMS Notifications for Service Provider for Successful Registration.
									spNotifications.sendRegistrationEmail(emailId, firstName, mobile, pass, function(err, result){
										
									});
									
									resJson = {
										    "http_code" : "200",
											//"message" : "Thank you for registering with us. Please ensure you have submitted the following:\n Checklist \n List of required documents (Please tick the ones you have) \n PAN Card \n VAT certificate \n TIN  \n Cancelled Cheque \n Service Tax No. \n TAN \n Professional Tax (PT) \n Company – Shop & establishment license from labor department",
											"message" : "We're sending you an OTP - please verify your mobile number to activate your account."
									};
									
									request("http://smsc.smsconnexion.com/api/gateway.aspx?action=send&username=msupply&passphrase=123456&message=Hi! OTP for Registering as Service Provider with mSupply.com : " + code + "    -Team mSupply" +"&phone=" + mobile, function(err, response, body) {
										if(!err){  
											logger.debug(ip + " " + TAG +  " OTP " + code + " for mobile no "+ mobile + " sent Sucessfully,");
											resJson = {
												    "http_code" : "200",
													"message" : " OTP sent to your mobile number. Please use it to register with mSupply.com."
											};
											//return callback(false, resJson);
										}else{
											resJson = {
												    "http_code" : "500",
													"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
											};
											logger.error(ip + " " + TAG + " OTP not sent for user with mobile no..." + mobile + " Problem with the gateway");
											//return callback(true, resJson);
										}	
									});

									//calling CRM upload API.
									crm_serviceprovider.crmRegistration(customerId, function(error, result){
										
									});
									
									logger.debug(ip + " " + TAG + " " + JSON.stringify(resJson));
									return callback(true, resJson);
								}
							});
						}
						else{
							resJson = {
								    "http_code" : "500",
									"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
							};
							logger.error(ip + " " + TAG + JSON.stringify(resJson));
							return callback(true, resJson);
						}
					});
					
				} else {
					resJson = {
						    "http_code" : "500",
							"message" : "Looks like you have two logins on msupply.com - please contact our help desk."
					};
					logger.error(ip + " " + TAG + " MYSQL ERROR " + JSON.stringify(result));
					return callback(true,resJson);
				}
			});
			} else {
				resJson = {
					    "http_code" : "500",
						"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
				};
				logger.error(ip + " " + TAG + JSON.stringify(resJson));
				return callback(true, resJson);
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

//Function for the Validating the Registration OTP.
exports.validateOTP = 
function validateOTP (req, callback){
	
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_sp;
	
	logger.info(ip + " " + TAG + " Entering Validate OTP.");
	
	//Log the request.
	logger.info(ip + " " + TAG  + " " + JSON.stringify(req.body));
	
	//Declare the response
	var resJson;
	
	//Validate the request.
	if ( !(	req === null || 
			req.body === null ||
			req.body.OTP === undefined || 
			req.body.mobile === undefined ||
			req.body.OTP === null || 
			req.body.mobile === null ||
			req.body.OTP.toString().trim().length === 0 ||
			req.body.mobile.toString().trim().length === 0)) {
		
	var OTP = req.body.OTP;
	var mobile = req.body.mobile;
	
	var col = db.collection('ServiceProvider');
	col.findOne({"serviceProviderEntity.passwords.registrationOTP": OTP,"serviceProviderEntity.profileInfo.accountInfo.mobile": mobile},{"_id": 0 },function(err, nresult) {
		if(!err && (nresult !== null)){
			
		col.update({"serviceProviderEntity.profileInfo.accountInfo.mobile": mobile},{$set :{"serviceProviderEntity.passwords.registrationOTP": 0,"serviceProviderEntity.profileInfo.accountInfo.isActive": true}},function(err, result) {
			if(!err){
				resJson = {
					    "http_code" : "200",
						//"message" : "OTP Validated Successfully you are now a registered Service Provider with mSupply.com"
						"message" : "Verified mobile number successfully. You are now a registered Service Provider with msupply.com"
				};
				logger.debug(ip + " " + TAG + " Verified mobile number successfully. You are now a registered Service Provider with msupply.com.");

				//Trigger sms notification to service provider regarding succesfull account activation.
				spNotifications.notifyServiceProviderOnAccountActivation(mobile, function(err, result){
								
				});

				return callback(false, resJson);
			}else{
				resJson = {
					    "http_code" : "500",
						"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
				};
				logger.error(ip + " " + TAG + " Validate OTP Failed for Registration: " + err);
				return callback(true, resJson);
			}
		});
			
		} else if(!err && (nresult === null)) {
			resJson = {
				    "http_code" : "500",
					"message" : "Inputs Doesn't match with our records.Please retry.."
			};
			logger.error(ip + " " + TAG + " OTP and Mobile Number didn't match : " + err);
			return callback(true, resJson);
		}else {
			resJson = {
				    "http_code" : "500",
					"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
			};
			logger.error(ip + " " + TAG + " Validate OTP Failed : " + err);
			return callback(true, resJson);
		}
	});		
	}else {
		resJson = {
			    "http_code" : "400",
				"message" : "Bad or ill-formed request.."
		};
		logger.error(ip + " " + TAG + " " + JSON.stringify(resJson));
		return callback(false,resJson);
	}
};


//Function for the Resending the Registration OTP.
exports.resendOTP = 
function resendOTP (req, callback){
	
	//Get the IP Address of the client.
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_sp;
	
	logger.info(ip + " " + TAG + " Entering Resend OTP.");
	
	//Log the request.
	logger.info(ip + " " + TAG  + " " + JSON.stringify(req.body));
	
	//Declare the response
	var resJson;
	
	//Validate the request.
	if ( !(	req === null || 
			req.body === null ||
			req.body.mobile === undefined ||
			req.body.mobile === null ||
			req.body.mobile.toString().trim().length === 0)) {
		
	var mobile = req.body.mobile;
	
	var col = db.collection('ServiceProvider');
	col.findOne({"serviceProviderEntity.profileInfo.accountInfo.mobile": mobile},{"_id": 0,"serviceProviderEntity.passwords":1},function(err, nresult) {
		if(!err && (nresult !== null)){
			
			var registerOTP = nresult.serviceProviderEntity.passwords.registrationOTP;
			
			request("http://smsc.smsconnexion.com/api/gateway.aspx?action=send&username=msupply&passphrase=123456&message=Hi! OTP for Registering as Service Provider with mSupply.com : " + registerOTP + "    -Team mSupply" +"&phone=" + mobile, function(err, response, body) {
				if(!err){  
					logger.debug(ip + " " + TAG +  " OTP for registration resend " + registerOTP + " for mobile no "+ mobile + " sent Sucessfully,");
					resJson = {
						    "http_code" : "200",
							"message" : "OTP sent to your mobile number. Please use it to register with mSupply.com."
					};
					return callback(false, resJson);
				}else{
					resJson = {
						    "http_code" : "500",
							"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
					};
					logger.error(ip + " " + TAG + " OTP not sent for user with mobile no..." + mobile + " Problem with the gateway");
					return callback(true, resJson);
				}	
			});
			
		} else if(!err && (nresult === null)) {
			resJson = {
				    "http_code" : "500",
					"message" : "Inputs Doesn't match with our records.Please retry.."
			};
			logger.error(ip + " " + TAG + " OTP and Mobile Number didn't match : " + err);
			return callback(true, resJson);
		}else {
			resJson = {
				    "http_code" : "500",
					"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
			};
			logger.error(ip + " " + TAG + " Validate OTP Failed : " + err);
			return callback(true, resJson);
		}
	});		
	}else {
		resJson = {
			    "http_code" : "400",
				"message" : "Bad or ill-formed request.."
		};
		logger.error(ip + " " + TAG + " " + JSON.stringify(resJson));
		return callback(false,resJson);
	}
};