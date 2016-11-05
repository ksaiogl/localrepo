var dbConfig = require('../../../Environment/mongoDatabase.js');
var log = require('../../../Environment/log4js.js');


exports.userRestructure = function(callback){
  var db = dbConfig.mongoDbConn;
  var batch = db.collection('AdminUsers').initializeUnorderedBulkOp();
  db.collection('AdminUsers').find().toArray(function(err, result){
    if (err) {
      console.log("Error : \n", err.stack);
    } else {
      result.forEach(function(element){
        var newUserType = [];
        newUserType.push(element.userDetails.userType);
        element.userDetails.userType = newUserType;
        console.log(element);
        // {sku : element.sku}
        batch.find({'userAuth.username' : element.userAuth.username }).upsert().updateOne({$set: element});
      });

      batch.execute(function(err, result) {
        if (err) {
          logger.error(TAG + "Error performing batch update. ERROR : \n" + err.stack);
          callback(true);
        } else {
          var stat = {
            "inserted" : result.nInserted,
            "upserted" : result.nUpserted,
            "modified" : result.nModified,
            "matched" : result.nMatched
          }
          console.log(stat);
          callback(false);
        }
      });

    }
  });

}
