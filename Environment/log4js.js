var TAG = 'log4js.js';
var log4js = require('log4js');
var env = require('./env.js').env;
var fs = require('fs');

var logger_sp;
var logger_sup;
var logger_cus;
var logger_jobs;
var logger_helpers;
var logger_notification;
var logger_OMS;
var logger_omsAdminPanel;
var logger_productPricing;
var logger_charts;
var logger_suppliersfileupload;
var logger_sellerLead;
var logger_sellerMaster;
var logger_seller;

var log4jsEnv = {
		"prd":
		{
			"logDir": "/usr/NodeJslogs",
			"logLevel" : "DEBUG",
			"maxLogSize": 10048576, //10MB
      	  	"backups": 10
		},

		"stg":
		{
			"logDir": "/usr/NodeJslogs",
			"logLevel" : "DEBUG",
			"maxLogSize": 10048576,
      	  	"backups": 5
		},

		"dev":
		{
			"logDir": "/usr/NodeJslogs",
			"logLevel" : "DEBUG",
			"maxLogSize": 10048576,
      	  	"backups": 5
		},
		"loc":
		{
			"logDir": "/usr/NodeJslogs",
			"logLevel" : "DEBUG",
			"maxLogSize": 10048576,
      	  	"backups": 3
		}
};


var log4jsEnvParams = null;
if (env === 'prd') {
	log4jsEnvParams = log4jsEnv.prd;
} else if ( env === 'stg') {
	log4jsEnvParams = log4jsEnv.stg;
} else if ( env === 'dev') {
	log4jsEnvParams = log4jsEnv.dev;
} else {
	log4jsEnvParams = log4jsEnv.loc;
}

var logDir = log4jsEnvParams.logDir;

var maxLogSize = log4jsEnvParams.maxLogSize;

var backups = log4jsEnvParams.backups;

var logLevel = log4jsEnvParams.logLevel;

var log4jsConfig = {

	"appenders": [
		{
			"type": "file",
			"filename": logDir + "/" + "serviceProvider.log",
			"maxLogSize": maxLogSize,
			"backups": backups,
			"category": "serviceProvider"
		},
		{
			"type": "file",
			"filename": logDir + "/" + "customer.log",
			"maxLogSize": maxLogSize,
			"backups": backups,
			"category": "customer"
		},
		{
			"type": "file",
			"filename": logDir + "/" + "supplier.log",
			"maxLogSize": maxLogSize,
			"backups": backups,
			"category": "supplier"
		},
		{
			"type": "file",
			"filename": logDir + "/" + "NodeJobs.log",
			"maxLogSize": maxLogSize,
			"backups": backups,
			"category": "NodeJobs"
		},
		{
			"type": "file",
			"filename": logDir + "/" + "helpers.log",
			"maxLogSize": maxLogSize,
			"backups": backups,
			"category": "helpers"
		},
		{
			"type": "file",
			"filename": logDir + "/" + "notification.log",
			"maxLogSize": maxLogSize,
			"backups": backups,
			"category": "notification"
		},
		{
			"type": "file",
			"filename": logDir + "/" + "OMS.log",
			"maxLogSize": maxLogSize,
			"backups": backups,
			"category": "OMS"
		},
		{
			"type": "file",
			"filename": logDir + "/" + "omsAdminPanel.log",
			"maxLogSize": maxLogSize,
			"backups": backups,
			"category": "omsAdminPanel"
		},
		{
			"type": "file",
			"filename": logDir + "/" + "crm.log",
			"maxLogSize": maxLogSize,
			"backups": backups,
			"category": "crm"
		},
		{
			"type": "file",
			"filename": logDir + "/" + "productPricing.log",
			"maxLogSize": maxLogSize,
			"backups": backups,
			"category": "productPricing"
		},
		{
			"type": "file",
			"filename": logDir + "/" + "util.log",
			"maxLogSize": maxLogSize,
			"backups": backups,
			"category": "utilities"
		},
		{
			"type": "file",
			"filename": logDir + "/" + "businesstobuilder_RFQ.log",
			"maxLogSize": maxLogSize,
			"backups": backups,
			"category": "rfq"
		},
		{
			"type": "file",
			"filename": logDir + "/" + "charts.log",
			"maxLogSize": maxLogSize,
			"backups": backups,
			"category": "charts"
		},
		{
			"type": "file",
			"filename": logDir + "/" + "suppliersfileupload.log",
			"maxLogSize": maxLogSize,
			"backups": backups,
			"category": "suppliersfileupload"
		},
		{
			"type": "file",
			"filename": logDir + "/" + "sellerLead.log",
			"maxLogSize": maxLogSize,
			"backups": backups,
			"category": "sellerLead"
		},
		{
			"type": "file",
			"filename": logDir + "/" + "sellerMaster.log",
			"maxLogSize": maxLogSize,
			"backups": backups,
			"category": "sellerMaster"
		},
		{
			"type": "file",
			"filename": logDir + "/" + "seller_onboarding.log",
			"maxLogSize": maxLogSize,
			"backups": backups,
			"category": "selleronboarding"
		}
	]
};

function createLogDir (callback) {
	fs.exists(logDir, function(exists) {
		if (!(exists)) {
			fs.mkdir(logDir, function(err) {
				if (err) {
					console.log("Log Directory Cannot be Created: " + logDir + "." +err);
					throw new Error();
				} else {
					callback(true, "Log Directory created: " + logDir);
				}
			});
		} else {
			callback(true, "Log Directory Exists: " + logDir);
		}
	});
}


/*function createLogFile(logFile,callback) {
	fs.exists(logFile, function(exists) {
		if (!(exists)) {
			fs.writeFile(logFile,"",function(err) {
				if (err) {
					console.log("Log File Cannot be Created: " + logFile + "." +err);
					throw new Error();
				} else {
					callback(true,"Log File Created: " + logFile);
				}
			});
		} else{
			callback(true, "Log File Exists: " + logFile);
		}
	});
}*/


//Configure logger_sp, logger_sup, logger_cus, logger_jobs
createLogDir(function(success,result) {

	if (success) {
		//Log for Service Provider.
		log4js.configure(log4jsConfig,{});

		logger_sp = log4js.getLogger("serviceProvider");
		logger_sp.setLevel(logLevel);
		exports.logger_sp = logger_sp;

		//Log for Supplier.
		logger_sup = log4js.getLogger("supplier");
		logger_sup.setLevel(logLevel);
		exports.logger_sup = logger_sup;

		//Log for customer.
		logger_cus = log4js.getLogger("customer");
		logger_cus.setLevel(logLevel);
		exports.logger_cus = logger_cus;

		//Log for dailyNotificationNodeJobs. (Node cron Jobs for Notifications)
		logger_jobs = log4js.getLogger("NodeJobs");
		logger_jobs.setLevel(logLevel);
		exports.logger_jobs = logger_jobs;

		//Log for helpers (generic).
		logger_helpers = log4js.getLogger("helpers");
		logger_helpers.setLevel(logLevel);
		exports.logger_helpers = logger_helpers;

		//Log for email service (generic).
		logger_notification = log4js.getLogger("notification");
		logger_notification.setLevel(logLevel);
		exports.logger_notification = logger_notification;

		//Log for OMS.
		logger_OMS = log4js.getLogger("OMS");
		logger_OMS.setLevel(logLevel);
		exports.logger_OMS = logger_OMS;

		//Log for omsAdminPanel.
		logger_omsAdminPanel = log4js.getLogger("omsAdminPanel");
		logger_omsAdminPanel.setLevel(logLevel);
		exports.logger_omsAdminPanel = logger_omsAdminPanel;

		//Log for productPricing.
		logger_productPricing = log4js.getLogger("productPricing");
		logger_productPricing.setLevel(logLevel);
		exports.logger_productPricing = logger_productPricing;

		//Log for CRM.
		logger_crm = log4js.getLogger("crm");
		logger_crm.setLevel(logLevel);
		exports.logger_crm = logger_crm;

		//Log for utilities.
		logger_util = log4js.getLogger("utilities");
		logger_util.setLevel(logLevel);
		exports.logger_util = logger_util;

		//Log for CustomerAdminPanel.
		logger_productPricing = log4js.getLogger("productPricing");
		logger_productPricing.setLevel(logLevel);
		exports.logger_productPricing = logger_productPricing;

		//Log for Business to Builder (RFQ).
		logger_rfq = log4js.getLogger("rfq");
		logger_rfq.setLevel(logLevel);
		exports.logger_rfq = logger_rfq;

		//Log for charts.
		logger_charts = log4js.getLogger("charts");
		logger_charts.setLevel(logLevel);
		exports.logger_charts = logger_charts;
		
		//Log for suppliersfileupload.
		logger_suppliersfileupload = log4js.getLogger("suppliersfileupload");
		logger_suppliersfileupload.setLevel(logLevel);
		exports.logger_suppliersfileupload = logger_suppliersfileupload;

		//Log for sellerLead.
		logger_sellerLead = log4js.getLogger("sellerLead");
		logger_sellerLead.setLevel(logLevel);
		exports.logger_sellerLead = logger_sellerLead;

		//Log for sellerMaster.
		logger_sellerMaster = log4js.getLogger("sellerMaster");
		logger_sellerMaster.setLevel(logLevel);
		exports.logger_sellerMaster = logger_sellerMaster;
		
		//Log for seller onboarding.
		logger_seller = log4js.getLogger("selleronboarding");
		logger_seller.setLevel(logLevel);
		exports.logger_seller = logger_seller;
	}
});