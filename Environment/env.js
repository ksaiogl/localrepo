var TAG = 'env.js';

//Get Deployment Environment from deployment command line
//Example: node <app.js> <env> 
var env = process.argv[2];
if (!( env === 'prd' || env === 'stg' || env === 'dev' || env === 'loc')) {
	throw new Error("The environment should be one of 'prd'(Production) or 'stg'(Staging) or 'dev'(Development) or 'loc'(Local)..");
}
exports.env = env;

 