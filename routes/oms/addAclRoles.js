var TAG = "--- ACL Init ---    ";
var dbConfig = require('../../Environment/mongoDatabase.js');
var crypto = require("crypto");
var secret = 'MsupplyAdm1nPanelSecretKey';


exports.addUserRoles = function (){

  var db = dbConfig.mongoDbConn;

  var acl = require('acl');
  var acl = new acl(new acl.mongodbBackend(db, "acl_", true));

  // acl.removeAllow( 'CatalogPanelUser', 'Catalog', "Use");
  // acl.removeAllow( 'SuperUser', 'Users', "Modify");
  // acl.removeAllow( 'User', 'Users', "Modify");
  // acl.removeAllow( 'UserReadOnly', 'Users', "Modify");
  // acl.removeAllow( 'SupplierPanelUser', 'Users', "Modify");
  // acl.removeAllow( 'AffiliatePanelUser', 'Users', "Modify");
  // acl.removeAllow( 'Reporting', 'Users', "Modify");
  // // acl.removeAllow( 'User', 'Order', "Modify-self");
  //
  // //Role Admin
  // acl.allow('CatalogPanelUser', 'Catalog', ['View', 'Modify']);
  // acl.allow('CatalogPanelUserReadOnly', 'Catalog', ['View']);
  // acl.allow('CatalogPanelUserReadOnly', 'Users', 'Modify-self');
  // acl.allow('CatalogPanelUserReadOnly', 'Report', ['View']);
  // acl.allow('RFQPanelUser', 'RFQPanel', ['Create','View', 'Modify']);
  // acl.allow('RFQPanelUser', 'Users', 'Modify-self');
  // acl.allow('RFQPanelUserReadOnly', 'RFQPanel', ['View']);
  // acl.allow('RFQPanelUserReadOnly', 'Users', 'Modify-self');
  // acl.allow('Admin', 'Report', ['View']);
  // acl.removeAllow('Admin', 'Catalog', ['Use']);
  // acl.allow('Admin', 'Catalog', ['View', 'Modify']);
  // acl.allow('CatalogPanelUserReadOnly', 'Catalog', ['View']);
  // acl.allow('CatalogPanelUser', 'Catalog', ['View', 'Modify']);
  // acl.allow('Admin', 'RFQPanel', ['Create','View', 'Modify']);
  // acl.allow('CatalogPanelUserReadOnly', 'Users', 'Modify-self');
  // acl.allow('CatalogPanelUserReadOnly', 'Report', ['View']);

  //RFQPanelUser
  // acl.allow('Admin', 'RFQPanel', ['Create','View', 'Modify']);
  // acl.allow('RFQPanelUser', 'RFQPanel', ['Create','View', 'Modify']);
  // acl.allow('RFQPanelUser', 'Users', 'Modify-self');


  //RFQPanelUserReadOnly
  // acl.allow('RFQPanelUserReadOnly', 'RFQPanel', ['View']);
  // acl.allow('RFQPanelUserReadOnly', 'Users', 'Modify-self');

  // acl.removeAllow('Admin', 'Supplier', ['Create','View', 'Modify']);
  // acl.removeAllow('SupplierPanelUser', 'Supplier', ['Create','View', 'Modify']);

  // acl.allow('Admin', 'SupplierReviewPanel', ['Create','View', 'Modify']);
  // acl.allow('SupplierPanelUser', 'SupplierReviewPanel', ['Create','View', 'Modify']);
  //
  // acl.allow('Admin', 'Supplier', ['Create','View', 'Modify']);
  // acl.allow('SuperUser', 'Supplier', ['Create','View', 'Modify']);
  // acl.allow('UserOrderPunching', 'Supplier', ['Create','View', 'Modify']);
  // acl.allow('CatalogPanelUser', 'Supplier', ['Create','View', 'Modify']);

  //Role UserOrderPunching
  // acl.allow('UserOrderPunching', 'Order', ['Create','View']);
  // acl.allow('UserOrderPunching', 'Users', 'Modify-self');
  //
  // acl.allow('CatalogPanelUser', 'Report', ['View']);

  // acl.allow('Admin', 'SupplierInternalPanel', ['Create','View', 'Modify']);
  acl.allow('SellerOnboardingPanelUser', 'SellerOnboardingPanel', ['Create','View', 'Modify']);
  acl.allow('SellerOnboardingPanelUser', 'Users', 'Modify-self');
  acl.allow('Admin', 'SellerOnboardingPanel', ['Create','View', 'Modify']);


  console.log("New roles added successfully.");
  console.log("Current User Roles");

  acl.whatResources("Admin", function(err, result){
    console.log("Admin : ", JSON.stringify(result));
  });

  acl.whatResources("SuperUser", function(err, result){
    console.log("SuperUser : ", JSON.stringify(result));
  });

  acl.whatResources("User", function(err, result){
    console.log("User : ", JSON.stringify(result));
  });

  acl.whatResources("UserOrderPunching", function(err, result){
    console.log("UserOrderPunching : ", JSON.stringify(result));
  });

  acl.whatResources("UserReadOnly", function(err, result){
    console.log("UserReadOnly : ", JSON.stringify(result));
  });

  acl.whatResources("SupplierPanelUser", function(err, result){
    console.log("SupplierPanelUser : ", JSON.stringify(result));
  });

  acl.whatResources("AffiliatePanelUser", function(err, result){
    console.log("AffiliatePanelUser : ", JSON.stringify(result));
  });

  acl.whatResources("Reporting", function(err, result){
    console.log("Reporting : ", JSON.stringify(result));
  });

  acl.whatResources("CatalogPanelUser", function(err, result){
    console.log("CatalogPanelUser : ", JSON.stringify(result));
  });

  acl.whatResources("RFQPanelUser", function(err, result){
    console.log("RFQPanelUser : ", JSON.stringify(result));
  });

  acl.whatResources("RFQPanelUserReadOnly", function(err, result){
    console.log("RFQPanelUserReadOnly : ", JSON.stringify(result));
  });

  acl.whatResources("CatalogPanelUserReadOnly", function(err, result){
    console.log("CatalogPanelUserReadOnly : ", JSON.stringify(result));
  });

  acl.whatResources("SupplierInternalPanelUser", function(err, result){
    console.log("SupplierInternalPanelUser : ", JSON.stringify(result));
  });



}