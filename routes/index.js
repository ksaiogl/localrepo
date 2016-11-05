var express = require('express');
var router = express.Router();
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'mSupply.com' });
});

router.post('/samplepost/:data/:ex',function(req,res){
        var x =req.param('data');
        var y = req.param('ex');
        res.send(x+'<br/>'+y);
});

module.exports = router;
