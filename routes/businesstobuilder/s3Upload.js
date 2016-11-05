var TAG = "s3Upload.js";
var AWS = require('aws-sdk'); 
var log = require('../../Environment/log4js.js');
var dbConfig = require('../../Environment/mongoDatabase.js');
var fs = require('fs');
var mime = require('mime-types');
var async = require('async');

var s3;

var taskArray = [];

exports.intializeS3 = 
function intializeS3 (filesToUpload, callback){

	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;

	var colS3Credentials = db.collection('S3Credentials');
	
	colS3Credentials.findOne({},{"_id":0},function(err, result){
		
		if(!err && result !== null){
			AWS.config.update({accessKeyId: result.AWS_ACCESS_KEY_ID, secretAccessKey: result.AWS_SECRET_ACCESS_KEY});
			AWS.config.update({region: 'eu-west-1'});
			s3 = new AWS.S3();
			
			parallelS3Uploads(filesToUpload, function(err, result){
				return callback(err, result);
			});
		}else {
			resJson = {	
				    "http_code" : "500",
					"message" : "Internal Server Error while uploading file to s3."
			};
			logger.error(ip + " " + TAG + " Intialize the s3 failed." + JSON.stringify(err));
			return callback(true, resJson);
		}
	});
}	

//Function for performing the parallel uploads to s3.
function parallelS3Uploads (filesToUpload, callback){
	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;
	
	logger.info(TAG + " Request received for uploading the file or image to s3.");
	
	createParallelTasks(filesToUpload, function(err){
		if(err){
			resJson = {	
				    "http_code" : "500",
					"message" : "Image Upload to s3 failed."
			};
			logger.error(TAG + " create parallel tasks s3 failed." + JSON.stringify(err));
			return callback(false, resJson);
		}else{
		
			async.parallel(taskArray, function(err, results){
					if(!err){

						taskArray = [];
						resJson = {	
							    "http_code" : "200",
								"message" : results
						};
						logger.debug(TAG + " async parallel tasks s3 Successful." + JSON.stringify(err));
						return callback(false, resJson);
					}else{
						resJson = {	
							    "http_code" : "500",
								"message" : "Image Upload to s3 failed."
						};
						logger.error(TAG + " async parallel tasks s3 failed." + JSON.stringify(err));
						return callback(false, resJson);
				}
			});
		}	
	});
};

//This function is used to create the parallel tasks.
function createParallelTasks(filesToUpload, callback){
	async.series([
          function(scallback){

	    	  for(var i=0; i<filesToUpload.length; i++){
	    			var path = filesToUpload[i].filePath;
	    			var fileName = filesToUpload[i].fileName;
	    			
	    			taskPush(path, fileName, filesToUpload[i].pathToUpload, filesToUpload[i].acl, filesToUpload[i].typeOfFile);
	    	  }
        	  scallback();
          }
      ],
	  function(err, results){
		return callback(false);
	});
}

function taskPush(path, fileName, pathToUpload, acl, typeOfFile){
	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;
	taskArray.push(
		function(callback){
			
			var filepath = path;
			
			var type = mime.lookup(filepath);
			
			var stream = fs.createReadStream(filepath);
			
			var bucketPath = pathToUpload;
			
			var key = fileName;

			var params = {
			  Bucket: bucketPath,
			  Key: key,
			  ACL: acl,
			  ContentType: type,
			  Expires: 32472180000,
			  Body:stream
			};
			
			uploadObjectToS3(params, typeOfFile, function(err, data){
				if(!err){
					
					try{
						//This will delete the file which gets created in temp.
						fs.unlinkSync(filepath);
					}
					catch(e){
						logger.error(TAG + " exception araised while removing file " +filepath+ ", exception: "+ JSON.stringify(e));
					}

					return callback(err, data);
				}else{
					return callback(err);
				}
			});
        }
	);
}

//This Function is used for uploading the object to s3.
function uploadObjectToS3(params, typeOfFile, callback){
	var bucketName = params.Bucket;
	var keyName = params.Key;
	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;

	s3.putObject(params, function(err, data) {
		  if (err){

			  resJson = {	
					    "http_code" : "500",
						"message" : "Image Upload to s3 failed."
				};
			logger.error(TAG + " s3 Put Object tasks s3 failed." + JSON.stringify(err));
			return callback(false, resJson);
		  } 	  
		  else{
			var params = {Bucket: bucketName, Key: keyName};
			var urlWithData = s3.getSignedUrl('getObject', params);
			var url = urlWithData.split("?"); 
			
			var response = {
					"typeOfFile": typeOfFile,
					"url": url[0]
				};	
			return callback(false, response);
		  }	  
	});
}