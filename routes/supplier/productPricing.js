var TAG = "ProductPricing- ";
//Web Service for retrieving Product details from Magento API and Product MOQ from Mongo Java API.

var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var magentoAPI = require('../magento/magentoAPI.js');
var javaAPI = require('../javaAPI/javaProductAPI.js'); //request to Mongo Java API.

exports.getProductDetails = function getProductDetails (req, callback){
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	//Variable for Logging the messages to the file.	
	var logger = log.logger_sup;
	//Log the request.
	logger.info("+++ " + TAG + " Request received for productPricing. +++ ");
	//Declare the response
	var resJson;

	if ( !( req.body === null || req.body.sellerId === undefined || req.body.skuId === undefined 
		|| req.body.sellerId.toString().trim().length === 0 
		|| req.body.skuId.toString().trim().length === 0))
	{
		
		logger.debug(TAG + " Body: " + JSON.stringify(req.body));
		var sellerId = req.body.sellerId;
		var skuId = req.body.skuId;

		magentoAPI.getProductDetailsAPI(req, function(merr, mresult){	
			try
			{
				mresult = JSON.parse(mresult);
			}
			catch(err)
			{
				resJson = {
					    "http_code" : "500",
						"message" : "Error retrieving Product Details. Please retry..."
				};
				console.log("Error retrieving Product Details from Magento API for sellerId : " + sellerId + ", SKUId: " + skuId + ", err: " + merr)
				logger.error(TAG + "From Parse, Error retrieving Product Details from Magento API for sellerId : " + sellerId + ", SKUId: " + skuId + ", err: " + merr);
				return callback(true, resJson);
			}

			if(!merr && mresult.data !== null)
			{	
				logger.debug(TAG + "Success - Product details fetched from Magento API for sellerId :" + sellerId + ", skuId: " + skuId + "mresult: " + mresult);
				var product = { 
					"productDetails":
					{	
						"skuId": skuId,
						"productName": mresult.data.Name,
						"sellingPrice": mresult.data.Price,
						"priceUnit": mresult.data["Weight Unit"],
						"inventory": mresult.data.Qty,
						"status": mresult.data.Status,
						"noOfUnits": mresult.data["No of units"],
						"skuImage": mresult.data["Small Image"],
						"competitivePrice": mresult.data.competitive_price,
						"quantityUnit" : null
					}
				}
				//Call Java API to get the MOQ for the product.
				javaAPI.getProductMOQ(sellerId, skuId, mresult.data.Price, function(error, result){	
					if(!error)
					{	
						// Add the Product MOQ to Output JSON object.
						product.productDetails.quantityUnit = result.message.sellerMOQEntity.MBQInfo.mbqUom;
						resJson = {
						    "http_code" : "200",
							"message" : product
						};
						logger.debug(TAG + "Success - MOQ details fetched from java API for sellerId : " + sellerId + ", skuId: " + skuId);
						return callback(false, resJson);
					}
					else
					{
						resJson = {
						    "http_code" : "500",
							"message" : "Error retrieving Product Details. Please retry..."
						};
						logger.error(TAG + "Error retrieving Product MOQ from Java API for sellerId : " + sellerId + ", skuId: " + skuId + "error: " + error);
						return callback(true, resJson);
					}
				});						
			}
			else if (!merr && mresult.data === null)
			{
				resJson = {
					    "http_code" : "500",
						"message" : "No Product Details available. Please retry..."
				};
				logger.error(TAG + "No Product Details available from Magento API for sellerId : " + sellerId + ", skuId: " + skuId);
				return callback(true, resJson);
			}
			else
			{
				resJson = {
					    "http_code" : "500",
						"message" : "Error retrieving Product Details. Please retry..."
				};
				logger.error(TAG + "Error retrieving Product Details from Magento API for sellerId : " + sellerId + ", SKUId: " + skuId + ", err: " + merr);
				return callback(true, resJson);
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
		callback(true,resJson);
	}
};
