var TAG = "--- ACL Init ---    ";
var dbConfig = require('../../Environment/mongoDatabase.js');
var crypto = require("crypto");
var secret = 'MsupplyAdm1nPanelSecretKey';


exports.init = function (){

  var db = dbConfig.mongoDbConn;

  db.listCollections({name:"acl_resources"}).toArray(function(err, names){

    if (err) {
      console.log("Error in acl init : \n" + err.stack);

    } else {

        if (names.length == 0) {

            var acl = require('acl');
            var acl = new acl(new acl.mongodbBackend(db, "acl_", true));

            //Role Admin
            acl.allow('Admin', 'Order', ['Create','View', 'Modify']);
            acl.allow('Admin', 'Users', ['Create','View', 'Modify', 'Modify-self']);
            acl.allow('Admin', 'SupplierReviewPanel', ['Create','View', 'Modify']);
            acl.allow('Admin', 'Affiliate', ['Create','View', 'Modify']);
            acl.allow('Admin', 'Report', ['View']);
            acl.allow('Admin', 'Catalog', ['Use']);
            acl.allow('Admin', 'Catalog', ['View', 'Modify']);
            acl.allow('Admin', 'RFQPanel', ['Create','View', 'Modify']);
            acl.allow('Admin', 'SupplierInternalPanel', ['Create','View', 'Modify']);
            acl.allow('Admin', 'SellerOnboardingPanel', ['Create','View', 'Modify']);

            //Role SuperUser
            acl.allow('SuperUser', 'Order', ['Create','View', 'Modify']);
            acl.allow('SuperUser', 'Users', ['View', 'Modify-self']);
            acl.allow('SuperUser', 'Supplier', ['Create','View', 'Modify']);

            //Role User Order Punching
            acl.allow('UserOrderPunching', 'Order', ['Create','View']);
            acl.allow('UserOrderPunching', 'Users', 'Modify-self');
            acl.allow('UserOrderPunching', 'Supplier', ['Create','View', 'Modify']);

            //Role User
            acl.allow('User', 'Order', ['View', 'Modify']);
            acl.allow('User', 'Users', 'Modify-self');

            //Role UserReadOnly
            acl.allow('UserReadOnly', 'Order', 'View');
            acl.allow('UserReadOnly', 'Users', 'Modify-self');

            //Role supplierUser
            acl.allow('SupplierPanelUser', 'SupplierReviewPanel', ['Create','View', 'Modify']);
            acl.allow('SupplierPanelUser', 'Users', 'Modify-self');

            //Role affiliateUser
            acl.allow('AffiliatePanelUser', 'Affiliate', ['Create','View', 'Modify']);
            acl.allow('AffiliatePanelUser', 'Users', 'Modify-self');

            //Reporting
            acl.allow('Reporting', 'Report', ['View']);
            acl.allow('Reporting', 'Users', 'Modify-self');
            acl.allow('Reporting', 'Order', 'View');

            //Catalog
            acl.allow('CatalogPanelUser', 'Catalog', ['View', 'Modify']);
            acl.allow('CatalogPanelUser', 'Users', 'Modify-self');
            acl.allow('CatalogPanelUser', 'Report', ['View']);
            acl.allow('CatalogPanelUser', 'Supplier', ['Create','View', 'Modify']);

            //RFQPanelUser
            acl.allow('RFQPanelUser', 'RFQPanel', ['Create','View', 'Modify']);
            acl.allow('RFQPanelUser', 'Users', 'Modify-self');


            //RFQPanelUserReadOnly
            acl.allow('RFQPanelUserReadOnly', 'RFQPanel', ['View']);
            acl.allow('RFQPanelUserReadOnly', 'Users', 'Modify-self');

            //CatalogReadOnly
            acl.allow('CatalogPanelUserReadOnly', 'Catalog', ['View']);
            acl.allow('CatalogPanelUserReadOnly', 'Users', 'Modify-self');
            acl.allow('CatalogPanelUserReadOnly', 'Report', ['View']);


            //RFQPanelUser
            acl.allow('RFQPanelUser', 'RFQPanel', ['Create','View', 'Modify']);
            acl.allow('RFQPanelUser', 'Users', 'Modify-self');


            //RFQPanelUserReadOnly
            acl.allow('RFQPanelUserReadOnly', 'RFQPanel', ['View']);
            acl.allow('RFQPanelUserReadOnly', 'Users', 'Modify-self');

            //Supplier Internal Panel User
            acl.allow('SupplierInternalPanelUser', 'SupplierInternalPanel', ['Create','View', 'Modify']);
            acl.allow('SupplierInternalPanelUser', 'Users', 'Modify-self');

            //Seller Onboarding Panel User
            acl.allow('SellerOnboardingPanelUser', 'SellerOnboardingPanel', ['Create','View', 'Modify']);
            acl.allow('SellerOnboardingPanelUser', 'Users', 'Modify-self');

            //Adding Default admin user
            var updateQuery = {
              "$setOnInsert":{
                "userAuth" : {
                    "username" : "msadmin",
                    "password" : crypto.createHash('md5').update("msupply@engg" + secret).digest('hex')
                },
                "userDetails" : {
                    "userId" : 0,
                    "firstName" : "Msupply Default Admin",
                    "lastName" : "",
                    "email" : "",
                    "mobile" : "",
                    "firstLogin" : false,
                    "userType" : ["Admin"]
                }
              }
            }

        // db.collection('AdminUsers').insert(insertQuery,function(err,result){
            db.collection('AdminUsers').update({"userAuth.username":"msadmin"}, updateQuery, {upsert: true}, function(err,result){
              if (err) {
                console.log("acl initialization failed. ERR : " + err.stack);
              } else {
                acl.addUserRoles(0, "Admin");
                console.log("acl initialized.");
              }
            });

        }

    }
  });



}