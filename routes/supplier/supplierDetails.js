var TAG = "SupplierDetails- ";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');

//Function for the getSupplierDetails.
exports.getSupplierDetailsService = function(req, callback){

	//Variable for Logging the messages to the file.
	var logger = log.logger_sup;
	//Log the request.
	logger.info("+++ " + TAG + " Request received for SupplierDetails . +++ ");
	//Declare the response
	var resJson;

	//Validate the request.
	if (req.query.sellerID)
	{
		logger.debug(TAG + " Body: " + JSON.stringify(req.body));
		var sellerID = req.query.sellerID.trim();
		getSupplierDetails(sellerID, function(err, code, result){
			resJson = {
				"http_code" : code,
				"message" : result
			};
			callback(err,resJson);
		});
	}
	else
	{
		resJson = {
			"http_code" : "400",
			"message" : "Bad or ill-formed request.."
		};
		logger.error(TAG + "Bad or ill-formed request.. sellerID is mandatory. ");
		callback(true,resJson);
	}
};




//Function for the getSupplierDetails.
function getSupplierDetails(sellerID, callback, internal){

	//Variable for Mongo DB Connection.
	var db = dbConfig.mongoDbConn;
	//Variable for Logging the messages to the file.
	var logger = log.logger_sup;
	//Log the request.
	logger.info("+++ " + TAG + " Request received for SupplierDetails . +++ ");

	var sellerCol = db.collection('SellerMaster');	
	
	var supplierProjection = {
		"_id": 0,
		"sellerEntity.profileInfo.basicInfo": 1
	};

	if (internal) {
		supplierProjection["supplierEntity.appInfo"] = 1;
	}

	sellerCol.findOne({"sellerEntity.profileInfo.accountInfo.sellerId": sellerID}, supplierProjection, function(err, result) {
		if(!err && (result !== null))
		{
			result.supplier = result.sellerEntity;
			delete result.sellerEntity;
			// resJson = {
			// 	"http_code" : "200",
			// 	"message" : result
			// };
			logger.info(TAG + "Supplier Details retrieved for sellerId : " + sellerID);
			callback(false, 200, result);
		}
		else if(!err && (result === null))
		{
			logger.error(TAG + "SellerID does not exist for the Input" + "sellerID: " + sellerID);
			return callback(true, 404, "SellerID does not exist for the Input. Please try again.");
			// sellerCol.findOne({"sellerEntity.identifier.sellerId":sellerID},{"_id":0, "sellerEntity.companyInfo": 1,"sellerEntity.sellerDetails": 1}, function(err, result){
			// 	if(!err && (result !== null)){
			// 		var contactInfo = {
			// 			"primaryFirstName": "",
			// 			"primaryLastName": "",
			// 			"image": "",
			// 			"secondaryFirstName": "",
			// 			"secondaryLastName": "",
			// 			"primaryMobile": "",
			// 			"secondaryMobile": "",
			// 			"primaryEmail": "",
			// 			"secondaryEmail": ""
			// 		};


			// 		if (result.sellerEntity.sellerDetails) {

			// 			if (result.sellerEntity.sellerDetails.email) {
			// 				contactInfo.primaryEmail = result.sellerEntity.sellerDetails.email;
			// 			}
			// 			if (result.sellerEntity.sellerDetails.phone) {
			// 				contactInfo.primaryMobile = result.sellerEntity.sellerDetails.phone;
			// 			}

			// 			delete result.sellerEntity.sellerDetails;
			// 		}

			// 		result.sellerEntity.contactInfo = contactInfo;

			// 		result.supplier = result.sellerEntity;
			// 		delete result.sellerEntity;
			// 		logger.info(TAG + "Supplier Details retrieved for sellerId : " + sellerID);
			// 		callback(false, 200, result);
			// 	}else if(!err && (result === null)){
					
			// 		logger.error(TAG + "SellerID does not exist for the Input" + "sellerID: " + sellerID);
			// 		return callback(true, 404, "SellerID does not exist for the Input. Please try again.");
			// 	}
			// 	else{
					
			// 		logger.error(TAG + "Fetching Seller Name Failed with Server Error : \n" + err.stack);
			// 		callback(true, 500, "Internal server error. Please try again");
			// 	}
			// });
		}
		else
		{			
			logger.error(TAG + "Internal server error, Server Error: \n" + err.stack);
			callback(true, 500, "Internal server error. Please try again");
		}
	});

};

exports.getSupplierDetails = getSupplierDetails;
