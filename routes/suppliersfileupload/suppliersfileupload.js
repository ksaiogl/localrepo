var TAG = "---Suppliers File Upload ---    ";
var log = require('../../Environment/log4js.js');
var express = require('express');
var app = express();
var fs = require('fs');
var path = require('path');
var fileupload = require('./fileupload.js');

app.post('/api/v1.0/fileupload', function(req, res){

	//Variable for Logging the messages to the file.
	var logger = log.logger_suppliersfileupload;

  	fileupload.upload(req, function(err, regres){
	  	if(regres.attachment == 1)
	  	{
	  		//reading the contents of log file.
	  		fs.readFile('/usr/NodeJslogs/log_'+regres.id+'.txt', 'utf8', function read(err, data) {
			    if (err) {
			        var resJson = {
	            		"http_code": 500,
	            		"message": "Unable to read log file."
			        };
			        logger.error(TAG + "Unable to read log file. ERROR : " + JSON.stringify(err));
			        res.statusCode =  regres.http_code
					res.json(resJson);
			    } else {
			    	//deleting log file.
			    	fs.unlinkSync('/usr/NodeJslogs/log_'+regres.id+'.txt');

			    	var resJson = {
			    		"http_code": regres.http_code,
	            		"message": regres.message,
	            		"status": data.replace(/\t/g, '     ').split("\r\n")
	            					.filter(function(val) { return val !== ""; })
			        };
					res.statusCode =  regres.http_code;
					res.json(resJson);
			    }
			});
	  	} else {
			res.statusCode =  regres.http_code;
			res.json(regres);
		}
	});
});

//CORS for the browser.
app.options('/api/v1.0/fileupload',function(req,res, next){
	res.send({status : 200, data:'CORS'});
});

module.exports = app;