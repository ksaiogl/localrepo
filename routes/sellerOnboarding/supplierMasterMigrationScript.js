var TAG = "supplierMasterMigrationScript.js";
var async = require("async");
var underscore = require('underscore');
var mongoClient =  require('mongodb').MongoClient;

//Mongodb connection
//var url = 'mongodb://msupply:supply123@abhinandan-Latitude-E5450:27017,abhinandan-Latitude-E5450:27018/msupplyDB';
//var url = 'mongodb://52.30.181.28:27017/msupplyDB';
var url = 'mongodb://localhost:27017/msupplyDB';
var db = null;
mongoClient.connect(url, function(err, dbConn) {
    if(err)
    {
        console.log("Error connecting to Mongo server. err: " + err);
    }
    else
    {
      db = dbConn;
      console.log("Connected to Mongo server.");
      
      var supplierCol = db.collection('Supplier');
      
      var sellerCol = db.collection('SellerMaster');
      
      var recordStatistics = {
		  "totalrecords" : 0,
		  "migratedToSellerCollection" : 0,
		  "ExistingInSeller" : 0
      };
	
      var existsInSeller = 0;
      
      var migratedToSeller = 0;
      
      supplierCol.find({}, {"_id":0}).toArray(function(err, result){
    	  
    	  if(!err && result.length > 0){
    		
    		recordStatistics.totalrecords = result.length;
    		  
    		async.forEachSeries(result,
  			 		function(suppObj, callback){
    			
    			sellerCol.findOne({"sellerEntity.profileInfo.financialInfo.taxInfo.VAT_TIN": suppObj.supplierEntity.taxInfo.VAT_TIN}, 
    					{"_id": 0, "sellerEntity.profileInfo.financialInfo.taxInfo.VAT_TIN" : 1}, function(verr, vresult){
    				
					if(!verr && vresult !== null){
						//Continue for other results.
						existsInSeller = existsInSeller + 1;
						recordStatistics.ExistingInSeller = existsInSeller;
						console.log("Duplicate VAT or TIN Number : " + suppObj.supplierEntity.taxInfo.VAT_TIN);
						return callback(false);
					}else if(!verr && vresult === null){
						
						var wareHouseAddress = [];
						wareHouseAddress.push(suppObj.supplierEntity.companyInfo.address[0]);
						
						wareHouseAddress[0].addressId = parseInt("1");
						
						delete wareHouseAddress[0]['type'];
						
						var invoiceAddress = [];
						invoiceAddress.push(suppObj.supplierEntity.companyInfo.address[1]);
						
						invoiceAddress[0].addressId = parseInt("1");
						
						delete invoiceAddress[0]['type'];
						
						var doc = 
								{
								    "sellerEntity" : {
								        "profileInfo" : {
								            "accountInfo" : {
								                "sellerId" : suppObj.supplierEntity.identifier.sellerId, 
								                "userId" : suppObj.supplierEntity.contactInfo.primaryMobile, 
								                "passwordHash" : suppObj.supplierEntity.passwords.passwordHash,
								                "previousPasswordHash" : suppObj.supplierEntity.passwords.previousPasswordHash,
								                "leadSource" : "", 
								                "crmId" : suppObj.supplierEntity.identifier.crmId
								            }, 
								            "basicInfo" : {
								                "email" : suppObj.supplierEntity.contactInfo.primaryEmail, 
								                "mobile" : suppObj.supplierEntity.contactInfo.primaryMobile, 
								                "contactPerson" : "", 
								                "title" : "", 
								                "telephoneNumber" : "", 
								                "profileImageURL" : "", 
								                "companyInfo" : {
								                    "companyName" : suppObj.supplierEntity.companyInfo.companyName, 
								                    "displayName" : suppObj.supplierEntity.companyInfo.displayName, 
								                    "businessType" : suppObj.supplierEntity.identifier.persona, 
								                    "establishment" : suppObj.supplierEntity.companyInfo.establishment, 
								                    "faxNo" : "", 
								                    "companyImageURL" : "", 
								                    "websiteURL" : suppObj.supplierEntity.companyInfo.website, 
								                    "wareHouseAddress" : wareHouseAddress, 
								                    "invoiceAddress" : invoiceAddress
								                 }
								            }, 
								            "financialInfo" : {
								                "taxInfo" : {
								                    "state" : "", 
								                    "VAT_TIN" : suppObj.supplierEntity.taxInfo.VAT_TIN, 
								                    "VATDocumentURL" : "", 
								                    "PAN" : "", 
								                    "PANDocumentURL" : "", 
								                    "CST" : suppObj.supplierEntity.taxInfo.STNumber, 
								                    "CSTDocumentURL" : ""
								                }, 
								                "bankInfo" : {
								                    "accountHolderName" : suppObj.supplierEntity.bankInfo.accountHolderName, 
								                    "accountNumber" : suppObj.supplierEntity.bankInfo.accountNumber, 
								                    "IFSCCode" : suppObj.supplierEntity.bankInfo.IFSC, 
								                    "accountType" : "", 
								                    "cancelledChequeDoucmentURL" : ""
								                }, 
								                "paymentAndCreditInfo" : {
								                    "paymentTerms" : [
								
								                    ], 
								                    "paymentMode" : [
								
								                    ], 
								                    "creditTermsProvided" : false, 
								                    "creditPeriod" : "", 
								                    "creditLimit" : ""
								                }
								            }, 
								            "enquiryAndCategoryInfo" : {
								                "minimumEnquiryValue" : "", 
								                "maxEnquiryValue" : "", 
								                "leadTime" : "", 
								                "PANIndia" : false, 
								                "stateAndCity" : [
								
								                ], 
								                "categories" : [
								
								                ]
								            },
								            "businessInfo": {
								        		"annualTurnOver": "",
								        		"productionTradeCapacity": "",
								        		"productionTradeCapacityUnit": "",
								        		"noOfEmployeees": "",
								        		"customerReference": [],
								        		"testReportOne": "",
								        		"testReportOneURL": "",
								        		"testReportTwo": "",
								        		"testReportTwoURL": "",
								        		"testReportThree": "",
								        		"testReportThreeURL": "",
								        		"certificateOne": "",
								        		"certificateOneURL": "",
								        		"certificateTwo": "",
								        		"certificateTwoURL": "",
								        		"certificateThree": "",
								        		"certificateThreeURL": "",
								        		"importMaterials": false,
								        		"importLicenseNumber": "",
								        		"hseFlag": false,
								        		"ehsFlsg": false,
								        		"ohsasFlag": false,
								        		"workedWithEcommerce": false,
								        		"systemBillingName": "",
								        		"ownTransport": false,
								        		"noOfVehicles": "",
								        		"categoryDetails": ""
								        	}
								        }, 
								        "sellerTermsInfo" : {
								            "termsAccepted" : true,
								            "termsAcceptedTimeStamp" : suppObj.supplierEntity.agreementInfo.timeStamp, 
								            "firstTimeLogin" : suppObj.supplierEntity.firstTimeLogin, 
								            "lastLoginTime" : suppObj.supplierEntity.lastLoginTime, 
								            "lastLoginSource" : "",
								            "migratedSupplier" : true
								        }, 
								        "sellerVerificationInfo" : {
								            "emailVerified" : false, 
								            "emailVerifiedTimeStamp" : "", 
								            "crmApprovedTimeStamp" : ""
								        }, 
								        "sellerAccessInfo" : {
								            "hasEnquiryAccess" : "", 
								            "hasQuoteAccess" : "", 
								            "hasPOAccess" : ""
								        }, 
								        "sellerVerificationStatus" : ""
								    }
								};
						
						if(suppObj.supplierEntity.RFQAuthEnabled === true){
							doc.sellerEntity.sellerVerificationStatus = "verified"
							doc.sellerEntity.sellerAccessInfo.hasEnquiryAccess = true;
							doc.sellerEntity.sellerAccessInfo.hasQuoteAccess = true;
							doc.sellerEntity.sellerAccessInfo.hasPOAccess = true;
						}else{
							doc.sellerEntity.sellerVerificationStatus = "verified"
							doc.sellerEntity.sellerAccessInfo.hasEnquiryAccess = false;
							doc.sellerEntity.sellerAccessInfo.hasQuoteAccess = false;
							doc.sellerEntity.sellerAccessInfo.hasPOAccess = false;
						}
						
						sellerCol.insert(doc, function(ierr, iresult){
							
							if(!err){
								
								migratedToSeller = migratedToSeller + 1;
								recordStatistics.migratedToSellerCollection = migratedToSeller;
								
								return callback(false);
							}else{
								return callback(true);
							}
							
						});
						
					}else{
						console.log("VAT_TIN find one failed VAT No : " + suppObj.supplierEntity.taxInfo.VAT_TIN + " Error : " + JSON.stringify(verr));
						return callback(false);
					}
    			});
    		},
    		//Final Function to be called upon completion of all functions.
			function(error)
			{
		 		if(!error){
		 			
		 			console.log("Sucessfully Migrated the Data from Supplier to Seller Collection Below are the stats");
		 			console.log("Statistics :");
		 			console.log("----------------------------------------------------------------");
		 			console.log("Total Records to be migrated : " + recordStatistics.totalrecords);
		 			console.log("Records migrated to Seller Collection : " + recordStatistics.migratedToSellerCollection);
		 			console.log("Which Got Failed because VAT existing in the Master : " + recordStatistics.ExistingInSeller);
		 			console.log("----------------------------------------------------------------");
		 		}else{
		 			console.log("Data Migration from Supplier to Seller Failed");
		 		}
			});
    		  
    	  }else if(!err && result.length === 0){
    		  
    		console.log("No Suppliers Found to be migrated...");
		    
    	  }else{
    		  
    		  console.log("Error for migrating the data...");
    		  
    	  }
    	  
      });
      
    }    
});