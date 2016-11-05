var express = require('express');
var app = express();
var pricing = require('./priceComputationService.js');




//Router that will get order list for viewing.
app.get('/api/v1.0/runPricingCron', function(req, res){
	var callback = function(err, stat){
    if (err) {
      res.statusCode =  500;
      res.send("Error");
    } else {
			var message = {
				stats : stat,
				Status : "Price pre computation complete. Update to magento triggered."
			}
      res.statusCode =  200;
      res.json(message);
    }
	};
  var skus = "";
  if (req.query.skus) {
    skus = req.query.skus;
  }
	pricing.calculateMinProductPrice(skus ,callback);
});


module.exports = app;
