var TAG = "SupplierRegistration";

var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var supNotifications = require('./supplierNotifications.js');
var crypto = require('crypto');

//Function for the registering the Service Provider.
exports.register = function register (req, callback){
	
	//Variable for Mongo DB Connection.
	var db = dbConfig.mongoDbConn;
	//Variable for Logging the messages to the file.
	var logger = log.logger_sup;
	//Log the request.
	logger.info("+++ " + TAG + " Request received for Registration. +++ ");
	//Declare the response
	var resJson;

	//Validate the request.
	if ( !(	
			req.body === undefined 	|| req.body.companyInfo === undefined || req.body.contactInfo === undefined || req.body.bankInfo === undefined || req.body.taxInfo === undefined ||
			req.body.companyInfo.companyName === undefined				|| 
			req.body.companyInfo.displayName === undefined 				|| 
			req.body.companyInfo.address.officeAddressL1 === undefined  ||
			req.body.companyInfo.address.officeAddressL2 === undefined 	||
			req.body.companyInfo.address.OfficePIN === undefined 		||
			req.body.companyInfo.address.pickupAddressL1 === undefined  ||
			req.body.companyInfo.address.pickupAddressL2 === undefined  ||
			req.body.companyInfo.address.pickupPIN === undefined 		||
			req.body.contactInfo.primaryFirstName === undefined 		||
			req.body.contactInfo.primaryLastName === undefined 			||
			req.body.contactInfo.primaryMobile === undefined 			||
			req.body.contactInfo.primaryEmail === undefined 			||
			req.body.contactInfo.interest === undefined 				||
			req.body.bankInfo.accountNumber === undefined				||
			req.body.bankInfo.IFSC  === undefined						||
			req.body.bankInfo.bankName === undefined					||
			req.body.bankInfo.branch  === undefined						||
			req.body.bankInfo.accountHolderName === undefined			||
			req.body.taxInfo.VAT_TIN  === undefined						||
			req.body.taxInfo.PAN  === undefined 						||
			req.body.agreementInfo.termAcceptance === undefined			||

			req.body.companyInfo.companyName.toString().trim().length === 0					|| 
			req.body.companyInfo.displayName.toString().trim().length === 0					||
			req.body.companyInfo.address.officeAddressL1.toString().trim().length === 0 	||
			req.body.companyInfo.address.officeAddressL2.toString().trim().length === 0 	||
			req.body.companyInfo.address.OfficePIN.toString().trim().length === 0			||
			req.body.companyInfo.address.pickupAddressL1.toString().trim().length === 0 	||
			req.body.companyInfo.address.pickupAddressL2.toString().trim().length === 0 	||
			req.body.companyInfo.address.pickupPIN.toString().trim().length === 0 		    ||
			req.body.contactInfo.primaryFirstName.toString().trim().length === 0 			||
			req.body.contactInfo.primaryLastName.toString().trim().length === 0			    ||
			req.body.contactInfo.primaryMobile.toString().trim().length === 0 				||
			req.body.contactInfo.primaryEmail.toString().trim().length === 0 				||
			req.body.contactInfo.interest.length === 0 										||
			req.body.bankInfo.accountNumber.toString().trim().length === 0					||
			req.body.bankInfo.IFSC.toString().trim().length === 0							||
			req.body.bankInfo.bankName.toString().trim().length === 0						||
			req.body.bankInfo.branch.toString().trim().length === 0							||
			req.body.bankInfo.accountHolderName.toString().trim().length === 0				||
			req.body.taxInfo.VAT_TIN.toString().trim().length === 0							||
			req.body.taxInfo.PAN.toString().trim().length === 0								||

			req.body.companyInfo.companyName === null				|| 
			req.body.companyInfo.displayName === null 				||
			req.body.companyInfo.address.officeAddressL1 === null 	||
			req.body.companyInfo.address.officeAddressL2 === null 	||
			req.body.companyInfo.address.OfficePIN === null 		||
			req.body.companyInfo.address.pickupAddressL1 === null 	||
			req.body.companyInfo.address.pickupAddressL2 === null 	||
			req.body.companyInfo.address.pickupPIN === null 		||
			req.body.contactInfo.primaryFirstName === null 			||
			req.body.contactInfo.primaryLastName === null 			||
			req.body.contactInfo.primaryMobile === null 			||
			req.body.contactInfo.primaryEmail === null 				||
			req.body.contactInfo.interest === null 					||
			req.body.bankInfo.accountNumber === null				||
			req.body.bankInfo.IFSC  === null						||
			req.body.bankInfo.bankName === null						||
			req.body.bankInfo.branch  === null						||
			req.body.bankInfo.accountHolderName === null			||
			req.body.taxInfo.VAT_TIN  === null						||
			req.body.taxInfo.PAN  === null 							||
			req.body.agreementInfo.termAcceptance === null 
		)) 
	{	

		logger.debug(TAG + " Body: " + JSON.stringify(req.body));
		//get companyInfo, userInfo, bankInfo for supplier registration
		var companyInfo = req.body.companyInfo;
		var contactInfo = req.body.contactInfo;
		var bankInfo = req.body.bankInfo;
		var taxInfo = req.body.taxInfo;
		var agreementInfo = {};
		agreementInfo = req.body.agreementInfo;

		agreementInfo.timeStamp = new Date();
		var tempColl = db.collection('TempSupplierRegistration');
		var supplierColl = db.collection('Supplier');
		var doc = 	{
					"supplierEntity": 
						{
							"companyInfo": 	{
		    									"companyName": companyInfo.companyName,
		    									"displayName": companyInfo.displayName,
		    									"address": [{
													          "type": "OFFICIAL",
													          "address1": companyInfo.address.officeAddressL1,
													          "address2": companyInfo.address.officeAddressL2,
													          "city": null,
													          "state": null,
													          "country": null,
													          "pincode": companyInfo.address.OfficePIN
													        },
													        {
													          "type": "PICKUP",
													          "address1": companyInfo.address.pickupAddressL1,
													          "address2": companyInfo.address.pickupAddressL2,
													          "city": null,
													          "state": null,
													          "country": null,
													          "pincode": companyInfo.address.pickupPIN
													        }],		
		    								},
							"contactInfo": 	{
											"primaryFirstName": contactInfo.primaryFirstName,
											"primaryLastName": contactInfo.primaryLastName,
											"primaryMobile": contactInfo.primaryMobile,
											"primaryEmail": contactInfo.primaryEmail,
											"interest" : contactInfo.interest,
											"startDate": new Date()
											},
							"bankInfo" : 	{
											"accountNumber": bankInfo.accountNumber,
		      								"IFSC": bankInfo.IFSC,
		      								"bankName": bankInfo.bankName,
		      								"branch": bankInfo.branch,
		      								"accountHolderName": bankInfo.accountHolderName
		    								},
		    				"taxInfo":  	{
		    								"VAT_TIN": taxInfo.VAT_TIN,
		      								"STNumber": taxInfo.STNumber !== undefined ? taxInfo.STNumber : null,
		      								"PAN": taxInfo.PAN
		    						   		},
		    				"agreementInfo":{
		    								"T&CAcceptance" : agreementInfo.termAcceptance,
		    								"timeStamp" : agreementInfo.timeStamp	
		    								}		   		
						}
					};

		//Validation to check whether the Service Provider is already registered.
		//Condition for duplicate registration, pan number and primary mobile number combination should be different for new registration.
		supplierColl.findOne({$or:[{"supplierEntity.taxInfo.PAN": taxInfo.PAN},{"supplierEntity.contactInfo.primaryMobile": contactInfo.primaryMobile}]},function(err, result){
			if(!err && (result === null)){

				tempColl.insert(doc, function(err, result) {
					if (err) {
						//JSON Structure to be formed for the response object.
						resJson = {	
							    "http_code" : "500",
								"message" : "Error - Registration Failed. Please try again"
						};
						logger.error(TAG + " Error - Registration Failed. err: " + err);
						return callback(true,resJson);
					} 
					else 
					{
						//Calling function that will notify Msupply support, supplier regarding new supplier registration.
						supNotifications.sendRegistrationEmail(req, function(err, result){			
						});

						resJson = {
							    "http_code" : "200",
								"message" : "Registration successful. Thank you for joining msupply family Our team Member will contact you soon."
						};

						logger.debug(TAG + " Registration successful");
						return callback(false,resJson);
					}
				});
			}
			else if(!err && (result !== null))
			{
				resJson = {
					    "http_code" : "500",
						"message" : "Supplier is already registered."
				};

				logger.error(TAG + "Supplier is already registered");
				return callback(true,resJson);
			}
			else 
			{
				resJson = {
					    "http_code" : "500",
						"message" : "Unexpected Server Error while fulfilling the request. Please re-try.."
				};

				logger.error(TAG + " Error querying mongodb: " + err);
				return callback(true,resJson);
			}
		});
	} 
	else 
	{
		resJson = {
			    "http_code" : "400",
				"message" : "Bad or ill-formed request.."
		};
		
		logger.error(TAG + "Bad or ill-formed request. reqBody: " + JSON.stringify(req.body));
		return callback(true,resJson);
	}	
};

