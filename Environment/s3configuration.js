//This file contains Hosting details(IP adress and PORT number) where application will be deployed.
var env = require('./env.js').env;

//Object that represent s3 bucket names for all different environments.
var bucketName = {
	"prd": {
		"s3BucketName": "msupplyrfq",
		"s3BucketNameSeller" : "msupplyselleronboarding"
	},
	"stg": {
		"s3BucketName": "rfqtest",
		"s3BucketNameSeller" : "selleronboardingtest"
	},
	"dev": {
		"s3BucketName": "rfqtest",
		"s3BucketNameSeller" : "selleronboardingtest"
	},
	"loc": {
		"s3BucketName": "rfqtest",
		"s3BucketNameSeller" : "selleronboardingtest"
	}
}

var BUCKET_NAME = null;			//variable which holds the s3 bucket name of existing environment.
var BUCKET_NAME_Seller = null;

if (env === 'prd') {
	BUCKET_NAME = bucketName.prd.s3BucketName;
	BUCKET_NAME_Seller = bucketName.prd.s3BucketNameSeller;
} else if ( env === 'stg') {
	BUCKET_NAME = bucketName.stg.s3BucketName;
	BUCKET_NAME_Seller = bucketName.stg.s3BucketNameSeller;
} else if ( env === 'dev') {
	BUCKET_NAME = bucketName.dev.s3BucketName;
	BUCKET_NAME_Seller = bucketName.dev.s3BucketNameSeller;
} else {
	BUCKET_NAME = bucketName.loc.s3BucketName;
	BUCKET_NAME_Seller = bucketName.loc.s3BucketNameSeller;
}

exports.BUCKET_NAME = BUCKET_NAME;
exports.BUCKET_NAME_Seller = BUCKET_NAME_Seller;