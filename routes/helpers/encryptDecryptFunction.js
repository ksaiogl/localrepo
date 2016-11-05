//This file contains functions to Encrypt and Decrypt a Key.
var TAG = "encryptDecrypt- ";
var aes = require('aes-cross');
var key = new Buffer([9,9,3,8,5,7,7,8,9,9,1,1,5,4,5,7]);
var iv = new Buffer([1,9,5,8,3,3,7,7,4,6,5,5,0,0,9,9]);

exports.encrypt = function(inputText, callback){
	try
	{	
		var enc = aes.encText(inputText,key,iv);
		return callback(false, enc);
	}
	catch(e)
	{
		console.log("Error in encryption, error:" + e);
	}	
}

exports.decrypt = function(inputText, callback){
	try
	{
		var dec = aes.decText(inputText,key,iv);
		return callback(false, dec);
	}
	catch(e)
	{
		console.log("Error in decryption, error:" + e);
		return callback(true, e);
	}
}