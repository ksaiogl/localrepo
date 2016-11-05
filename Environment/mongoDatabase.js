var TAG = 'mongoDatabase.js';
var mongoClient =  require('mongodb').MongoClient;

var env = require('./env.js').env;
console.log(TAG + " " +"Deployment Environment is: " + env);

var dbConfig = {
			"prd":
			{
				"type": "replicaSet",
				"user": "msupply",
				"pwd": "supply123",
				"mongod": ["mongo1.msupply.com:27017","mongo2.msupply.com:27017"],
				"database": "msupplyDB"
			},

			"stg":
			{
				"type": "replicaSet",
				"user": "msupply",
				"pwd": "supply123",
				"mongod": ["mongo1.msupply:27017","mongo2.msupply:27017","mongo3.msupply:27017"],
				"database": "msupplyDB"
			},

			"dev":
			{
				"type" : "singleInstance",
				"user": "",
				"pwd": "",
				"mongod":["52.30.181.28:27017"],
				"database": "msupplyDB"
			},


            "loc":
            {
                "type": "singleInstance",
                "user": "",
                "pwd": "",
                "mongod": ["localhost:27017"],
                "database": "msupplyDB"
            }
            //
            //"loc":
            //{
            //    "type": "singleInstance",
            //    "user": "msupply",
            //    "pwd": "supply123",
            //    "mongod": ["localhost:27017"],
            //    "database": "msupplyDB"
            //}
		};

var connParams = null;
if (env === 'prd') {
	connParams = dbConfig.prd;
} else if ( env === 'stg') {
	connParams = dbConfig.stg;
} else if ( env === 'dev') {
	connParams = dbConfig.dev;
} else {
	connParams = dbConfig.loc;
}
var mongod = connParams.mongod;

var databaseURL = null;
var mongoDbConn = null;

var hosts = null;
for (var i=0; i<mongod.length; i++){
	if (i === 0) {
    	hosts = mongod[0];
    }else {
    	hosts = hosts + ',' + mongod[i];
    }
}

var dbConnUrl = null;
if (!( connParams.user === "" && connParams.pwd === "")) {
		dbConnUrl = 'mongodb://' + connParams.user + ':' + connParams.pwd + '@' + hosts + '/' + connParams.database;
	// dbConnUrl = 'mongodb://' + connParams.user + ':' + connParams.pwd + '@' + hosts + '/' + connParams.database + '?replicaSet=msupply&connectTimeoutMS=300000&socketTimeoutMS=300000';
	console.log(dbConnUrl);
} else {
	dbConnUrl = 'mongodb://' + hosts + '/' + connParams.database ;
}


exports.createMongoConn = function(callback) {

		mongoClient.connect(dbConnUrl,function (err, database) {
			if (err) {
				callback(true);
			} else {
				console.log('Connection established to: ', dbConnUrl);
				exports.mongoDbConn = database;
				callback(false);
			}
		});
}

//Export the connection
//module.exports = mongoDbConn;
