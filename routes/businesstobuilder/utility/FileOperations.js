var TAG = "FileOperations.js";

var fs = require('fs');
var async = require('async');
var log = require('../../../Environment/log4js.js');

var removeFilesTask = []; 

//function to remove files specified in array input.
exports.removeFiles = function removeFiles(fileList, callback){

	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;

	/*fileList.forEach(function(file){

		removeFilesTask.push(function(asyncCallback){
			try{
				fs.unlinkSync(file);
			}
			catch(e){
				logger.error(TAG + " exception araised while removing file " +file+ ", exception: "+ JSON.stringify(e));
			}
			return asyncCallback(false);
		});
		
	});

	async.parallel(removeFilesTask, function(error, results){
		if(!error){
			logger.debug(TAG + " removed all files using file removing task.");
		}
		else{
			logger.error(TAG + " can't run files removing task. error: " + JSON.stringify(error));
		}
	});

	return callback(false, null);*/
	fileList.forEach(function(file){
		try{
			fs.unlinkSync(file);
		}
		catch(e){
			logger.error(TAG + " exception araised while removing file " +file+ ", exception: "+ JSON.stringify(e));
		}
	});
	return callback(false, null);
}