var TAG = 'app.js';

var express = require('express');
var app = express();
var env = require('./Environment/env.js').env;
var routes = require('./routes/index.js');
var path = require('path');
var aclinit = require('./routes/oms/aclInit');
var aclRoleUpdate = require('./routes/oms/addAclRoles');

// This flag determines if any new roles should be added to prod. Should always be false.
var aclupdate = false;

//below file will be loaded on start of applicaiton, used to schedule node cron jobs.
var dailyNotificationNodeJobs = require('./nodecronjobs/dailyNotificationNodeJobs.js');
var pricingCronJobs = require('./nodecronjobs/pricePrecomputeCron');
var rfqInquirymisCron = require('./nodecronjobs/rfqInquirymisCron');
var rfqInquiryExpireCron = require('./nodecronjobs/rfqInquiryExpireCron');
var supplierNotificationforExpringInquiryCron = require('./nodecronjobs/supplierNotificationforExpringInquiryCron.js');


//configs for redis and session management.
var redisConfigFile = require('./Environment/redis.js');
var redisConfig = redisConfigFile.getRedisConfig(env);
var session = require('express-session');
var redisStore = require('connect-redis')(session);

//redisConfigFile.createRedisConn(function(err){
	//if (!err) 
	//{
		app.use(session({
		    secret: redisConfigFile.getSessionEncryptionKey(env),
		    // create new redis store.
				store: new redisStore({client: redisConfigFile.redisConn,ttl : 60 * 30}),
		    saveUninitialized: false,
		    resave: false,
		    cookie: { secure: false, maxAge: null, SameSite:false, domain:'.msupply.com'}
		}));

		var bodyParser = require('body-parser');
		app.use(bodyParser.json());
		app.use(bodyParser.urlencoded({ extended: false }));

		var dbConfig = require('./Environment/mongoDatabase.js');
		var log = require('./Environment/log4js.js');

		// view engine setup
		app.set('views', path.join(__dirname, 'views'));
		app.set('view engine', 'jade');

		//CORS issue in the Browser.
		app.use(function(req, res, next) {
			  res.header("Access-Control-Allow-Origin", req.headers.origin);
			  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
			  res.header("Access-Control-Allow-Methods", "POST, GET, PUT, OPTIONS");
			  res.header("Access-Control-Allow-Credentials", true);
			  next();
		});

		//Routing
		var serviceProvider = require('./routes/serviceProvider/serviceProvider.js');
		var supplier = require('./routes/supplier/supplier.js');
		var notification = require('./routes/notification/notificationRoutes.js');
		var customer = require('./routes/customer/customer.js');
		var pricing = require('./routes/priceComputation/priceComputation.js');
		var crm = require('./routes/crm/crm.js');
		var oms = require('./routes/oms/oms.js');
		var calculator = require('./routes/calculators/calculator.js');
		var builder = require('./routes/businesstobuilder/businesstobuilder.js');
		var rfqSupplier = require('./routes/businesstobuilder/rfqSupplier.js');
		var charts = require('./routes/charts/charts.js');
		var sellerOnboarding = require('./routes/sellerOnboarding/sellerOnboarding.js');
		var suppliersfileupload = require('./routes/suppliersfileupload/suppliersfileupload.js');


		app.use('/', routes);
		app.use('/supplier',supplier);
		app.use('/serviceProvider',serviceProvider);
		app.use('/notification',notification);
		app.use('/customer',customer);
		app.use('/pricing',pricing);
		app.use('/crm',crm);
		app.use('/oms',oms);
		app.use('/calculator',calculator);
		app.use('/builder', builder);
		app.use('/charts',charts);
		app.use('/rfqSupplier', rfqSupplier);
		app.use('/seller', sellerOnboarding);
		app.use('/suppliersfileupload', suppliersfileupload);
		app.use('/static', express.static(__dirname+'/public'));

		app.use(function(err, req, res, next) {
				res.status(err.status || 500);
				res.json({
					http_code : err.status || 500,
					message : err.message
				});
				console.log("req:- "+req.url);
				console.log("time : " + new Date());
				console.log("error triggered from app.js:- "+err.stack);
		});

			//Initialize connection once
			dbConfig.createMongoConn(function(error){
				if(error){
					console.log('Unable to connect to the mongoDB server. Error:', error);
				}
				else{
					aclinit.init();
					if (aclupdate) {
						aclRoleUpdate.addUserRoles();
					}
						if (env === "prd") {
							app.listen(8080);
							console.log('Listening on port 8080');
						} else if (env === "stg") {
							app.listen(8081);
							console.log('Listening on port 8081');
						} else if (env === "dev") {
							app.listen(8082);
							console.log('Listening on port 8082');
						}else {
							//loc
							app.listen(8083);
							console.log('Listening on port 8083');
						}
				}
			});
	//}
//});
