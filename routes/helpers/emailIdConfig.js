//Email ID configuraion based on environment.
//supportEmailSupplierActivation --> The support team to which Supplier Activation email to be sent.
//fulfillmentEmail -> fulfillment team to which all the Order related email to be sent.(Legacy emails which doesnt use Notification services, SupplierNotifications)
//notificationServiceSupportEmail -> fulfillmentEmail team for all Order Management used by Notification Serive.
//fromEmailMsupplySupport -> Support email used to send the emails from MSUPPLY domain.
/*"prd": {
		"supportEmailSupplierActivation": "<support@msupply.com>, <abhinandan@msupply.com>, <spoorti@msupply.com>",
		"fulfillmentEmail": "<fulfillment@msupply.com>, <pallav@msupply.com>, <abhinandan@msupply.com>, <debasis@msupply.com>",
		"notificationServiceSupportEmail": ["fulfillment@msupply.com", "pallav@msupply.com","debasis@msupply.com","abhinandan@msupply.com"],
		"fromEmailMsupplySupport": "support@msupply.com"
	}*/
//fulfillmentEmail -> Only Old Supplier notification services are using it. 	
var emailIds = {
	"prd": {
		"supportEmailSupplierActivation": "<mithun@msupply.com>, <macrin@msupply.com>, <ayushi_i@msupply.com>, <abhinandan@msupply.com>, <spoorti@msupply.com>",
		"supportEmailSupplierActivation_bcc": "<abhinandan@msupply.com>",
		"fulfillmentEmail": "<suppliersupport@msupply.com>",
		"fulfillmentEmail_bcc": "<mallesh_c@msupply.com>, <mahesh_c@msupply.com>, <farooque_c@msupply.com>, <abhinandan@msupply.com>, <debasis@msupply.com>",
		"notificationServiceSupportEmail": [],
		"notificationServiceSupportEmail_bcc": ["mallesh_c@msupply.com","mahesh_c@msupply.com","farooque_c@msupply.com","debasis@msupply.com","abhinandan@msupply.com"],
		"customerSupportEmail" : ["customersupport@msupply.com"],
		"supplierSupportEmail" : ["suppliersupport@msupply.com"],
		"fromEmailMsupplySupport": "noreply@msupply.com"
	},
	"stg": {
		"supportEmailSupplierActivation": "<shashidhar@msupply.com>",
		"supportEmailSupplierActivation_bcc": "<reshma_c@msupply.com>,<abhinandan@msupply.com>",
		"fulfillmentEmail": "<shashidhar@msupply.com>",
		"fulfillmentEmail_bcc": "<reshma_c@msupply.com>, <abhinandan@msupply.com>",
		"notificationServiceSupportEmail": [],
		"notificationServiceSupportEmail_bcc": ["reshma_c@msupply.com","abhinandan@msupply.com"],
		"customerSupportEmail" : ["shashidhar@msupply.com"],
		"supplierSupportEmail" : ["shashidhar@msupply.com"],
		"fromEmailMsupplySupport": "noreply@msupply.com"
	},
	"dev": {
		"supportEmailSupplierActivation": "<shashidhar@msupply.com>, <abhinandan@msupply.com>",
		"supportEmailSupplierActivation_bcc": "<abhinandan@msupply.com>",
		"fulfillmentEmail": "<abhinandan@msupply.com>",
		"fulfillmentEmail_bcc": "<shashidhar@msupply.com>, <abhinandan@msupply.com>",
		"notificationServiceSupportEmail": ["abhinandan@msupply.com"],
		"notificationServiceSupportEmail_bcc": ["shashidhar@msupply.com"],
		"customerSupportEmail" : [],
		"supplierSupportEmail" : [],
		"fromEmailMsupplySupport": "noreply@msupply.com"
	},
	"prf": {
		"supportEmailSupplierActivation": "<shashidhar@msupply.com>, <abhinandan@msupply.com>",
		"supportEmailSupplierActivation_bcc": "<abhinandan@msupply.com>",
		"fulfillmentEmail": "<abhinandan@msupply.com>",
		"fulfillmentEmail_bcc": "<shashidhar@msupply.com>, <abhinandan@msupply.com>",
		"notificationServiceSupportEmail": ["abhinandan@msupply.com"],
		"notificationServiceSupportEmail_bcc": ["shashidhar@msupply.com"],
		"customerSupportEmail" : [],
		"supplierSupportEmail" : [],
		"fromEmailMsupplySupport": "noreply@msupply.com"
	},
	"loc": {
		"supportEmailSupplierActivation": "<shashidhar@msupply.com>, <abhinandan@msupply.com>",
		"supportEmailSupplierActivation_bcc": "<abhinandan@msupply.com>",
		"fulfillmentEmail": "<abhinandan@msupply.com>",
		"fulfillmentEmail_bcc": "<shashidhar@msupply.com>, <abhinandan@msupply.com>",
		"notificationServiceSupportEmail": ["abhinandan@msupply.com"],
		"notificationServiceSupportEmail_bcc": ["shashidhar@msupply.com"],
		"customerSupportEmail" : [],
		"supplierSupportEmail" : [],
		"fromEmailMsupplySupport": "noreply@msupply.com"
	}
}

var rfqEmailIds = {
		"prd": {
			"rfqInquiries": "<rfqinquiries@msupply.com>,<sachin@msupply.com>,<vikas@msupply.com>,<mallesh_c@msupply.com>,<farooque_c@msupply.com>,<Sanjayj@msupply.com>,<pradeep@msupply.com>,<debasis@msupply.com>,<niraj@msupply.com>,<shashidhar@msupply.com>",
			"supplierSceta": ["suppliersupport@msupply.com", "sachin@msupply.com", "vikas@msupply.com", "mallesh_c@msupply.com", "farooque_c@msupply.com", "macrin@msupply.com", "mithun@msupply.com", "manojb@msupply.com", "niraj@msupply.com", "Sanjayj@msupply.com"],
			"rfqInquiriesConsolidatedReport": ["<farooque_c@msupply.com>", "<sachin@msupply.com>", "<sanjayj@msupply.com>", "<vikas@msupply.com>", "<mallesh_c@msupply.com>", "<shreya@msupply.com>", "<aurobindo@msupply.com>", "<kapil@msupply.com>", "<shivarama@msupply.com>"],
			"rfqBuildersConsolidatedReport": ["<farooque_c@msupply.com>", "<sachin@msupply.com>", "<sanjayj@msupply.com>", "<vikas@msupply.com>", "<mallesh_c@msupply.com>", "<shreya@msupply.com>", "<sreenath@msupply.com>", "<aurobindo@msupply.com>", "<kapil@msupply.com>", "<shivarama@msupply.com>"]
		},
		"stg": {
			"rfqInquiries": "<nikhisha@msupply.com>,<shashidhar@msupply.com>",
			"supplierSceta": ["shashidhar@msupply.com"],
			"rfqInquiriesConsolidatedReport": ["<shashidhar@msupply.com>"],
			"rfqBuildersConsolidatedReport": ["<shashidhar@msupply.com>"]
		},
		"dev": {
			"rfqInquiries": "<nikhisha@msupply.com>,<shashidhar@msupply.com>",
			"supplierSceta": ["shashidhar@msupply.com"],
			"rfqInquiriesConsolidatedReport": ["<shashidhar@msupply.com>"],
			"rfqBuildersConsolidatedReport": ["<shashidhar@msupply.com>"]
		},
		"prf": {
			"rfqInquiries": "shashidhar@msupply.com",
			"supplierSceta": ["shashidhar@msupply.com"],
			"rfqInquiriesConsolidatedReport": ["<shashidhar@msupply.com>"],
			"rfqBuildersConsolidatedReport": ["<shashidhar@msupply.com>"]
		},
		"loc": {
			"rfqInquiries": "shashidhar@msupply.com",
			"supplierSceta": ["shashidhar@msupply.com"],
			"rfqInquiriesConsolidatedReport": ["<shashidhar@msupply.com>"],
			"rfqBuildersConsolidatedReport": ["<shashidhar@msupply.com>"]
		}
	}	

var RFQSupplierEmailIds = {
		"prd": {
			"SupplierInquiriesCC": ["supplier-response@msupply.com"],
			"SupplierInquiriesBCC": ["shashidhar@msupply.com", "abhinandan@msupply.com"]
		},
		"stg": {
			"SupplierInquiriesCC": ["shashidhar@msupply.com"],
			"SupplierInquiriesBCC": []
		},
		"dev": {
			"SupplierInquiriesCC": ["shashidhar@msupply.com", "balkishan@msupply.com "],
			"SupplierInquiriesBCC": ["shashidhar@msupply.com", "abhinandan@msupply.com"]
		},
		"prf": {
			"SupplierInquiriesCC": ["shashidhar@msupply.com", "balkishan@msupply.com "],
			"SupplierInquiriesBCC": ["shashidhar@msupply.com", "abhinandan@msupply.com"]
		},
		"loc": {
			"SupplierInquiriesCC": ["shashidhar@msupply.com", "balkishan@msupply.com "],
			"SupplierInquiriesBCC": ["shashidhar@msupply.com", "abhinandan@msupply.com"]
		}
}

exports.emailIds = emailIds;
exports.rfqEmailIds = rfqEmailIds;
exports.RFQSupplierEmailIds = RFQSupplierEmailIds;
