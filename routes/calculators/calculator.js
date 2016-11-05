var express = require('express');
var app = express();
var calc = require('./calculatortypes.js');

//Post request for Get Calculation Parameters.
app.post('/api/v1.0/getParameters',function(req,res){
	if(req.body.productType !== null && req.body.productType !== ''){		
		calc.getDetails(req.body.productType, function(err, result){
			if(err){
				res.json({	http_code:500,http_message:"Internal server Error",
							status:0,message:result
						});
			}
			else{
				res.json({	http_code:200,http_message:"Ok, Success",
							status:1,data:result
						});
			}
		});
	}
	else{
		res.json({	http_code:400,http_message:"Bad request",
					status:0,message:"Product Type missing.."
				});
	}
});


module.exports = app;