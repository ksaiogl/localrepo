var express = require('express');
var app = express();

var omsPanel = require('./omsPanel.js');
var omsPanelSupplier = require('./supplierAdminPanel');
var omsPanelAffiliate = require('./affiliateAdminPanel');
var omsPanelCatalog = require('./catalogAdminPanel');
var omsConstants = require('./omsConstants');
var omsPanelMagento = require('./magentoWrapers');
var omsPanelProduct = require('./productWrapers');
var util = require('./util.js');
var viewOrderList = require('../customer/viewOrderList');
var viewOrder = require('../customer/viewOrder');
var env = require('../../Environment/env').env;
var omsPanelRFQ = require('./rfqAdminPanel');
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');
var omsPanelSellerOnboarding = require('./sellerOnboardingAdminPanel');
var multipart = require('connect-multiparty');		
var multipartMiddleware = multipart({uploadDir: '/usr/NodeJslogs/rfqdocs' });

//required for authentication for admin penal
var expressJwt = require('express-jwt');
var jwt = require('jsonwebtoken');

//******************** FOR API CALLS FROM ADMIN PANEL ***********************

var secret = 'MsupplyAdm1nPanelSecretKey';
var secretToken = omsConstants.getSercetKeyToken(env);
var expMins = 30;

// We are going to protect /api routes with JWT
app.use('/api', expressJwt({secret: secretToken, isRevoked: isTokenRevoked}));

//Function to ger token from a request
function getToken (req) {
	if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
		return req.headers.authorization.split(' ')[1];
	} else if (req.query && req.query.token) {
		return req.query.token;
	}
	return null;
}

//Function to check if token is revoked
function isTokenRevoked(req, payload, done){
	var db = dbConfig.mongoDbConn;
	var logger = log.logger_omsAdminPanel;
	var tokenColl = db.collection('omsBlacklistTokens');
	var token = getToken(req);

	tokenColl.find({'token' : token }, {'_id':0}).toArray(function(err, result){
		if (err) {
			done(err);
			logger.error("Error verifying token from DB. Error : \n" + err.stack);
		} else {
			if (result.length) {
				done(null, true);
			} else {
				done(null, false);
			}
		}
	});
};

//Function to insert token in db
function insertTokenDB(token, callback){
	var db = dbConfig.mongoDbConn;
	var logger = log.logger_omsAdminPanel;
	var tokenColl = db.collection('omsBlacklistTokens');
	var tokenObj = {
		token : token,
		createdAt : new Date()
	};
	tokenColl.insert(tokenObj, function(err, result){
		if (err) {
			callback(err);
			logger.error("Error inserting token to DB. Error : \n" + err.stack);
		} else {
			callback(false);
		}
	});
}

//Function that will refresh token
function refreshToken(req, callback){
	var logger = log.logger_omsAdminPanel;
	var currentToken = getToken(req);
	insertTokenDB(currentToken, function(err){
		if (err) {
			callback(err);
			logger.error("Error refreshing token. Error : \n" + err.stack);
		} else {
			req.user.iat = Date.now();
			var newToken = jwt.sign(req.user, secretToken, { expiresIn: 60 * expMins });
			callback(false, newToken);
		}
	});
}



app.get('/api/v1.0/isTokenValid', function (req, res) {
	res.statusCode =  200;
	res.json({ message : "Valid Token"});
});

//Service that will authenticate the user
app.post('/authenticate', function (req, res) {
	var callback = function(err, regres){
		if (err) {
			res.statusCode =  regres.http_code;
			res.json(regres);
		} else {
			// We are sending the profile inside the token
			var token = jwt.sign(regres.message, secretToken, { expiresIn: 60 * expMins });
			res.statusCode =  regres.http_code;
			res.json({ token: token, userData :  regres.message});
		}
	};
	omsPanel.authenticateUser(req, callback);
});

//Service that will logout the user
app.get('/api/v1.0/logout', function (req, res) {
	var currentToken = getToken(req);
	insertTokenDB(currentToken, function(err){
		if (err) {
			resJson = {
					"http_code": 500,
					"message": "Error logging out."
			};
			logger.error("Error logging out. Error : \n" + err.stack);
		} else {
			resJson = {
					"http_code": 200,
					"message": "User logged out successfully."
			};
		}
		res.statusCode =  resJson.http_code;
		res.json(resJson);
		omsPanel.audit(req, resJson.http_code, "User logout", false);
	});
});


//Router that will get order list for viewing.
app.get('/api/v1.0/viewOrderList/:view?', function(req, res){
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, resJson.http_code, "Appropriate Order list sent", false);
			}
		});
	};
	omsPanel.viewOrderList(req, callback);
});

//Router that will get order list for viewing.
app.get('/api/v1.0/searchOrderList', function(req, res){
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, resJson.http_code, "Appropriate Order list sent", false);
			}
		});
	};
	omsPanel.searchOrderList(req, callback);
});


//Router that will get orders for viewing.
app.get('/api/v1.0/viewOrder/:view?', function(req, res){
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, "Appropriate Order details sent", false);
			}
		});
	};
	omsPanel.viewOrder(req, callback );
});


//Router that will register user for admin panel.
app.post('/api/v1.0/registerUser', function(req, res){
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, regres.message, false);
			}
		});
	};
	omsPanel.register(req, callback );
});


//Router that will update user role for admin panel.
app.put('/api/v1.0/updateUserRole', function(req, res){
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, regres.message, false);
			}
		});
	};
	omsPanel.updateUserRole(req, callback );
});



//Router that will change password for user for admin panel.
app.post('/api/v1.0/changePassword', function(req, res){
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, regres.message, false);
			}
		});
	};
	omsPanel.changePassword(req, callback );
});


//Router that will change password for user for admin panel.
app.put('/api/v1.0/resetPassword', function(req, res){
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, regres.message, false);
			}
		});
	};
	omsPanel.resetPassword(req, callback);
});


//Router that will get all user for admin panel.
app.get('/api/v1.0/users/:userId?', function(req, res){
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, "Appropriate User details sent", false);
			}
		});
	};
	omsPanel.getUser(req, callback );
});


//Router that will get all user types for admin panel.
app.get('/api/v1.0/getUserTypes', function(req, res){
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, "Appropriate User Types sent", false);
			}
		});
	};
	omsPanel.getUserTypes(req, callback );
});


//Router that will update order.
app.post('/api/v1.0/updateorder', function(req, res){
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, regres.message, false);
			}
		});
	};
	omsPanel.updateOrders(req, callback);
});


//Router that will update payment status.
app.put('/api/v1.0/insertOrderPayment', function(req, res){
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, regres.message, false);
			}
		});
	};
	omsPanel.insertOrderPayment(req, callback);
});


//Router that will insertOrder.
app.post('/api/v1.0/insertOrder', function(req, res){
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, regres.message, false);
			}
		});
	};
	omsPanel.insertOrder(req, callback);
});

// ******************** FOR API FOR UTIL ***********************
//get request for MIS Report.
app.get('/api/v1.0/GenerateMisReport',function(req,res){
	util.generateMisReport(req, res);
});

//get request for generateCustomerOrderReport.
app.get('/api/v1.0/generateCustomerOrderReport',function(req,res){
	util.generateCustomerOrderReport(req, res);
});

//get request for generateNewSupplierReport.
app.get('/api/v1.0/generateNewSupplierReport',function(req,res){
	util.generateNewSupplierReport(req, res);
});

// var generateMisReport = require('./util/generateMisReport.js');
// //get request for generateCustomerOrderReport.
// app.get('/GenerateMisReport1',function(req,res){
// 	generateMisReport.generateMisReport(req, res);
// 	// util.generateCustomerOrderReport(req, res);
// });

//get request for getting city.
// /api/v1.0/getCity
app.get('/util/api/v1.0/getCity',function(req, res){
	var callback = function(err, regres){
			res.statusCode =  regres.http_code;
			res.json(regres);
			omsPanel.audit (req, regres.http_code, "Appropriate city details sent.", false);
		};
	util.getCityService(req, callback);
});

//GET Request for getting VAT Detials
app.get('/util/api/v1.0/getVatDetails',function(req, res){
	var callback = function(err, regres){
			res.statusCode =  regres.http_code;
			res.json(regres);
			omsPanel.audit (req, regres.http_code, "Appropriate VAT Details sent.", false);
		};
	util.getVatDetailsService(req, callback);
});

//get request for generating sellerIDs.
// /api/v1.0/generateSellerID/:city/:count
app.get('/api/v1.0/generateSellerID/:city/:count',function(req,res){
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, "Generated seller IDs sent.", false);
			}
		});
	};
	util.generateSellerID(req, callback);
});


//post request for creating seller.
// /api/v1.0/createSeller
app.post('/api/v1.0/createSeller',function(req,res){
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, regres.message, false);
			}
		});
	};
	omsPanel.createSeller(req, callback);
});

app.post('/api/v1.0/fetchCompanyName',function(req,res){
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, regres.message, false);
			}
		});
	};
	omsPanel.fetchCompanyName(req, callback);
});

app.get('/api/v1.0/getOrderEvent/:orderId',function(req,res){
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit (req, regres.http_code, regres.message, false);
			}
		});
	};
	omsPanel.getOrderEvents(req, callback);
});


app.post('/api/v1.0/addOrderComment',function(req,res){
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit (req, regres.http_code, regres.message, false);
			}
		});
	};
	omsPanel.addOrderComment(req, callback);
});
// ******************** FOR API CALLS FOR SUPPLIER PANEL ***********************
//Routes that will approve supplier reviews from supplier admin.
app.post('/api/v1.0/approveReviewsForSellers',function(req,res){
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, regres.message, false);
			}
		});
	};
	omsPanelSupplier.approveReviewsForSellers(req, callback);
});


// ******************** FOR API CALLS FOR SERVICE PROVIDER PANEL ***********************

//Routes for affiliate admin panel.

app.post('/api/v1.0/updateVerificationStatus',function(req,res){
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, regres.message, false);
			}
		});
	};
	omsPanelAffiliate.updateVerificationStatus(req, callback);
});


app.post('/api/v1.0/updateQc',function(req,res){
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, regres.message, false);
			}
		});
	};
	omsPanelAffiliate.updateServiceProviderQc(req, callback);
});


app.post('/api/v1.0/qcReject',function(req,res){
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, regres.message, false);
			}
		});
	};
	omsPanelAffiliate.serviceProviderQcReject(req, callback);
});


app.post('/api/v1.0/cash_dd_cheque_storepaymentinfo',function(req,res){
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, regres.message, false);
			}
		});
	};
	omsPanelAffiliate.storecash_ddPaymentinfo(req, callback);
});


app.post('/api/v1.0/qcDelist',function(req,res){
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, regres.message, false);
			}
		});
	};
	omsPanelAffiliate.serviceProviderQcdelist(req, callback);
});


//******************** FOR API CALLS FOR CATALOG ADMIN PANEL ***********************
// /api/v1.0/catalog/sellerMoq
app.route('/api/v1.0/catalog/sellerMoq')
.put(function(req, res, next) {
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, "Appropriate Seller MOQ response sent", false);
			}
		});
	};
	omsPanelCatalog.sellerMOQ(req, callback);
})
.post(function(req, res, next) {
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, "Appropriate Seller MOQ response sent", false);
			}
		});
	};
	omsPanelCatalog.sellerMOQ(req, callback);
});


app.route('/api/v1.0/catalog/sellerConsolidatedCharges')
.put(function(req, res, next) {
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, "Appropriate sellerConsolidatedCharges response sent", false);
			}
		});
	};
	omsPanelCatalog.sellerConsolidatedCharges(req, callback);
})
.post(function(req, res, next) {
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, "Appropriate sellerConsolidatedCharges response sent", false);
			}
		});
	};
	omsPanelCatalog.sellerConsolidatedCharges(req, callback);
});



app.route('/api/v1.0/catalog/sellerProduct')
.put(function(req, res, next) {
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, "Appropriate sellerProduct response sent", false);
			}
		});
	};
	omsPanelCatalog.sellerProductCharges(req, callback);
})
.post(function(req, res, next) {
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, "Appropriate sellerProduct response sent", false);
			}
		});
	};
	omsPanelCatalog.sellerProductCharges(req, callback);
});



app.route('/api/v1.0/catalog/productPrice')
.put(function(req, res, next) {
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, "Appropriate productPrice response sent", false);
			}
		});
	};
	omsPanelCatalog.ProductPrice(req, callback);
})
.post(function(req, res, next) {
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, "Appropriate productPrice response sent", false);
			}
		});
	};
	omsPanelCatalog.ProductPrice(req, callback);
});

// app.post('/api/v1.0/qcDelist',function(req,res){
// 	var callback = function(err, regres){
// 		res.statusCode =  regres.http_code;
// 		res.json(regres);
// 		omsPanel.audit (req, regres.http_code, regres.message, false);
// 	};
// 	omsPanelAffiliate.serviceProviderQcdelist(req, callback);
// });

//******************** WRAPPER SERVICES FOR PRODUCT APIs ***********************
app.post('/api/v1.0/createProductTempSku', function(req, res, next) {
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, "Appropriate create product sku response sent.", false);
			}
		});
	};
	omsPanelProduct.createProductTempSku(req, callback);
});

app.get('/api/v1.0/getSkuDetails', function(req, res, next) {
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, "fetching product sku details sent.", false);
			}
		});
	};
	omsPanelProduct.getSkuDetails(req, callback);
});


//******************** WRAPPER SERVICES FOR MAGENTO APIs ***********************
app.post('/api/v1.0/sku', function(req, res, next) {
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, "Appropriate create sku response sent.", false);
			}
		});
	};
	omsPanelMagento.createSku(req, callback);
});

app.get('/api/v1.0/sku/:sku', function(req, res, next) {
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, "Appropriate create sku response sent.", false);
			}
		});
	};
	omsPanelMagento.getSkuDetails(req, callback);
});

//******************** FOR API CALLS FOR RFQ ADMIN PANEL ***********************
app.post('/api/v1.0/approveBuilder',function(req,res){
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, "Appropriate create sku response sent.", false);
			}
		});
	};
	omsPanelRFQ.approveBuilder(req, callback);
});

//get request for generateCustomerOrderReport.
app.get('/api/v1.0/generateInquiryReport',function(req, res){
	omsPanelRFQ.generateRfqInquiryReport(req, res);
});

//get request for generateBuilderReport.
app.get('/api/v1.0/generateBuilderReport',function(req, res){
	omsPanelRFQ.generateRfqBuilderReport(req, res);
});


//=================== Supplier Internal Web Panel (RFQ Release 2) =====================//

//Router that will Post request for floating Inquiry to all suppliers.
app.post('/api/v1.0/floatInquiryToSuppliers', function(req, res){
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, regres.message, false);
			}
		});
	};
	omsPanelRFQ.floatInquiryToSuppliers(req, callback );
});

//Router that will Post request for Inquiry Structure Details.
app.post('/api/v1.0/fetchInquiryDetailsForFloat', function(req, res){
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, regres.message, false);
			}
		});
	};
	omsPanelRFQ.fetchInquiryDetailsForFloat(req, callback );
});

//Router that will Post request to create structured inquiry.
app.post('/api/v1.0/createInquiry', function(req, res){
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, regres.message, false);
			}
		});
	};
	omsPanelRFQ.createInquiry(req, callback );
});

//Router that will Post request to fetch Quotation Master.
app.post('/api/v1.0/fetchQuotationMaster', function(req, res){
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, regres.message, false);
			}
		});
	};
	omsPanelRFQ.fetchQuotationMaster(req, callback );
});

//Router that will Post request to fetch Quotation Master.
app.post('/api/v1.0/fetchMasterQuotationV2', function(req, res){
    var callback = function(err, regres){
        refreshToken(req, function(err, newToken){
            if (err) {
                res.statusCode =  500;
                var errResp = {
                    "http_code": 500,
                    "message": "Error refreshing token."
                };
                res.json(errResp);
            } else {
                res.statusCode =  regres.http_code;
                regres.token = newToken;
                res.json(regres);
                omsPanel.audit(req, regres.http_code, regres.message, false);
            }
        });
    };
    omsPanelRFQ.fetchMasterQuotationV2(req, callback );
});

//Router that will Post request to approve Supplier Float.
app.post('/api/v1.0/approveInquiryFloat', function(req, res){
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, regres.message, false);
			}
		});
	};
	omsPanelRFQ.approveFloat(req, callback );
});

//Router that will Post request for listing all inquiries irrespective of sellers.
app.post('/api/v1.0/listAllInquiry', function(req, res){
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, regres.message, false);
			}
		});
	};
	omsPanelRFQ.listInquiry(req, callback );
});

//Router that will Get request for fetching Filters for sellers.
app.get('/api/v1.0/fetchInquiryListFilters', function(req, res){
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, regres.message, false);
			}
		});
	};
	omsPanelRFQ.fetchInquiryFilters(req, callback );
});

//Router that will Post request for getting master quotation report.
app.post('/api/v1.0/getMasterQuotationReport', function(req, res){
	omsPanelRFQ.getMasterQuotationReport(req, res);
});

//Router that will Post request for getting master quotation report.
app.post('/api/v1.0/masterQuotationReportV2', function(req, res){
    omsPanelRFQ.masterQuotationReportV2(req, res);
});

//Router that will post request for view project by builder
app.post('/api/v1.0/viewproject', function(req, res){
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, regres.message, false);
			}
		});
	};
	omsPanelRFQ.viewProject(req, callback );
});

//Router that will get RFQ Purchase Mangers Cities
app.get('/api/v1.0/getRFQPurchaseMangersCities', function(req, res){
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, regres.message, false);
			}
		});
	};
	omsPanelRFQ.getRFQPurchaseMangersCities(req, callback );
});

//CORS for the browser.
/*
app.options('/api/v1.0/floatInquiryToSuppliers',function(req,res, next){
	res.send({status : 200, data:'CORS'});
});

app.options('/api/v1.0/fetchInquiryDetailsForFloat',function(req,res, next){
	res.send({status : 200, data:'CORS'});
});

app.options('/api/v1.0/createInquiry',function(req,res, next){
	res.send({status : 200, data:'CORS'});
});

app.options('/api/v1.0/fetchQuotationMaster',function(req,res, next){
	res.send({status : 200, data:'CORS'});
});

app.options('/api/v1.0/approveInquiryFloat',function(req,res, next){
	res.send({status : 200, data:'CORS'});
});

app.options('/api/v1.0/listAllInquiry',function(req,res, next){
	res.send({status : 200, data:'CORS'});
});

app.options('/api/v1.0/fetchInquiryListFilters',function(req,res, next){
	res.send({status : 200, data:'CORS'});
});

app.options('/api/v1.0/getMasterQuotationReport',function(req,res, next){
	res.send({status : 200, data:'CORS'});
});

app.options('/api/v1.0/viewproject',function(req,res, next){
	res.send({status : 200, data:'CORS'});
});

app.options('/api/v1.0/getRFQPurchaseMangersCities',function(req,res, next){
	res.send({status : 200, data:'CORS'});
});
*/
//******************** FOR API CALLS FOR restructuring user structure ***********************

var userRestructure = require('./util/userDetailRestructure');
app.get('/util/api/v1.0/userRestructure', function(req, res){
	userRestructure.userRestructure(function(err){
		if (err) {
			var regres = {
					"http_code": 500,
					"message": err.message
			};
			res.json(regres);
		} else {
			var regres = {
					"http_code": 200,
					"message": "Done."
			};
			res.json(regres);
		}
	});
});

//******************** WRAPPER SERVICES FOR SELLER ONBOARDING APIs ***********************

app.post('/api/v1.0/fetchSellerLeads',function(req,res){
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, regres.message, false);
			}
		});
	};
	omsPanelSellerOnboarding.fetchSellerLeads(req, callback);
});

app.post('/api/v1.0/updateSellerLeadDetails',function(req,res){
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, regres.message, false);
			}
		});
	};
	omsPanelSellerOnboarding.updateSellerLeadDetails(req, callback);
});

app.post('/api/v1.0/rejectSellerLead',function(req,res){
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, regres.message, false);
			}
		});
	};
	omsPanelSellerOnboarding.rejectSellerLead(req, callback);
});

app.post('/api/v1.0/approveSellerLead',function(req,res){
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, regres.message, false);
			}
		});
	};
	omsPanelSellerOnboarding.approveSellerLead(req, callback);
});

app.post('/api/v1.0/searchSeller',function(req,res){
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, regres.message, false);
			}
		});
	};
	omsPanelSellerOnboarding.searchSeller(req, callback);
});

app.post('/api/v1.0/fetchSellerDetails',function(req,res){
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, regres.message, false);
			}
		});
	};
	omsPanelSellerOnboarding.fetchSellerDetails(req, callback);
});

app.post('/api/v1.0/approveSeller',function(req,res){
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, regres.message, false);
			}
		});
	};
	omsPanelSellerOnboarding.approveSeller(req, callback);
});

app.post('/api/v1.0/rejectSeller',function(req,res){
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, regres.message, false);
			}
		});
	};
	omsPanelSellerOnboarding.rejectSeller(req, callback);
});

app.post('/api/v1.0/addBasicInfo', multipartMiddleware, function(req,res){
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, regres.message, false);
			}
		});
	};
	omsPanelSellerOnboarding.addBasicInfo(req, callback);
});

app.post('/api/v1.0/addFinancialData', multipartMiddleware, function(req,res){
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, regres.message, false);
			}
		});
	};
	omsPanelSellerOnboarding.addFinancialData(req, callback);
});

app.post('/api/v1.0/addFullfilmentDetails', function(req,res){
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, regres.message, false);
			}
		});
	};
	omsPanelSellerOnboarding.addFullfilmentDetails(req, callback);
});

app.post('/api/v1.0/addBusinessDetails', multipartMiddleware, function(req,res){
	var callback = function(err, regres){
		refreshToken(req, function(err, newToken){
			if (err) {
				res.statusCode =  500;
				var errResp = {
						"http_code": 500,
						"message": "Error refreshing token."
				};
				res.json(errResp);
			} else {
				res.statusCode =  regres.http_code;
				regres.token = newToken;
				res.json(regres);
				omsPanel.audit(req, regres.http_code, regres.message, false);
			}
		});
	};
	omsPanelSellerOnboarding.addBusinessDetails(req, callback);
});

module.exports = app;
