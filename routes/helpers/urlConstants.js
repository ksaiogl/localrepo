var environment = require('../../Environment/env.js').env;

exports.getMagentoURL = function(env){
  if (env === 'prd') {
    return "https://www.msupply.com/services/V2/api.php";
  }
  if (env === 'stg') {
    return "http://staging.msupply.com/services/V2/api.php";
  }else if(env === 'dev' || env === 'loc') {
    return "http://dev.msupply.com/services/V2/api.php";
  }
}


exports.getCrmContactURL = function(env){
  if (env === 'prd') {
    return "https://msupply.custhelp.com/services/rest/connect/v1.3/contacts/";
  } else if(env === 'stg' || env === 'dev' || env === 'loc') {
    // return "https://msupply.custhelp.com/services/rest/connect/v1.3/contacts/";
    return "https://msupply--tst1.custhelp.com/services/rest/connect/v1.3/contacts/";
  }
}


exports.getCustomerCrmURL = function (env){
  if (env === 'prd') {
    return "http://www.msupply.com/services/api.php";
  } else if(env === 'stg' || env === 'dev' || env === 'loc') {
    return "http://staging.msupply.com/services/api.php";
  }
}


exports.getMisUrl = function(env){
  if (env === 'prd') {
    return "http://nodejs2.msupply-internal.local/admin/api/GenerateMisReport";
  } else if(env === 'stg') {
    return "http://nodejs2.stg.msupply-internal.local/admin/api/GenerateMisReport";
  } else if(env === 'dev' || env === 'loc') {
    return "http://nodejs2.dev.msupply.com/admin/api/GenerateMisReport";
  }
}


exports.getSellerMoqURL = function(env){
  if (env === 'prd') {
    return "http://tomcat.msupply-internal.local/PlatformUIServices/api/v1.0/sellerMoq/";
  } else if(env === 'stg') {
    return "http://tomcat.stg.msupply-internal.local/PlatformUIServices/api/v1.0/sellerMoq/";
  } else if(env === 'dev' || env === 'loc') {
    return "http://tomcat.dev.msupply-internal.local/PlatformUIServices/api/v1.0/sellerMoq/";
  }
}


exports.sellerConsolidatedChargesURL =function (env){
  if (env === 'prd') {
    return "http://tomcat.msupply-internal.local/PlatformUIServices/api/v1.0/sellerConsolidatedCharges/";
  } else if(env === 'stg') {
    return "http://tomcat.stg.msupply-internal.local/PlatformUIServices/api/v1.0/sellerConsolidatedCharges/";
  } else if(env === 'dev' || env === 'loc') {
    return "http://tomcat.dev.msupply.com/PlatformUIServices/api/v1.0/sellerConsolidatedCharges/";
  }
}


exports.sellerProductURL =function (env){
  if (env === 'prd') {
    return "http://tomcat.msupply-internal.local/PlatformUIServices/api/v1.0/sellerProduct/";
  } else if(env === 'stg') {
    return "http://tomcat.stg.msupply-internal.local/PlatformUIServices/api/v1.0/sellerProduct/";
  } else if(env === 'dev' || env === 'loc') {
    return "http://tomcat.dev.msupply.com/PlatformUIServices/api/v1.0/sellerProduct/";
  }
}


exports.sellerProductPriceURL =function (env){
  if (env === 'prd') {
    return "http://tomcat.msupply-internal.local/PlatformUIServices/api/v1.0/productPrice/";
  } else if(env === 'stg') {
    return "http://tomcat.stg.msupply-internal.local/PlatformUIServices/api/v1.0/productPrice/";
  } else if(env === 'dev' || env === 'loc') {
    return "http://tomcat.dev.msupply.com/PlatformUIServices/api/v1.0/productPrice/";
  }
}


exports.getOrderSurveyURL = function (){
  var env = environment;
  if (env === 'prd') {
    return "http://www.msupply.com/ordersurvey/ordersurvey?";
  } else if(env === 'stg' || env === 'dev' || env === 'loc') {
    return "http://staging.msupply.com/ordersurvey/ordersurvey?";
  }
}

exports.getRfqMagentoURL = function(env){
  if (env === 'prd') {
    return "http://customer.msupply.com/services/api.php";
  } else if(env === 'stg') {
    return "http://staging.msupply.com/var/customerservices/api.php";
  } else if(env === 'dev' || env === 'loc') {
    return "http://dev.msupply.com/var/customerservices/api.php";
  }
}

exports.getProductDetailURL = function(env){
  if (env === 'prd') {
    return "http://nodejs2.msupply-internal.local/user/api/v3.0/getProductDetailsAdmin/";
  } else if(env === 'stg') {
    return "http://nodejs2.stg.msupply-internal.local/user/api/v3.0/getProductDetailsAdmin/";
  } else if(env === 'dev' || env === 'loc') {
    return "http://nodejs2.dev.msupply.com/user/api/v3.0/getProductDetailsAdmin/";
  }
}


exports.getBuilderDetails =function (env){
  if (env === 'prd') {
    return "http://nodejs2.msupply-internal.local/user/api/v4.0/getUserDetails";
  } else if(env === 'stg') {
    return "http://nodejs2.stg.msupply-internal.local/user/api/v4.0/getUserDetails";
  } else if(env === 'dev') {
    // return "http://nodejs2.dev.msupply-internal.local/user/api/v4.0/getUserDetails";
    return "http://nodejs2.dev.msupply.com/user/api/v4.0/getUserDetails";
  } else if(env === 'loc') {
    return "http://nodejs2.dev.msupply.com/user/api/v4.0/getUserDetails";
  }
}

exports.getCategoriesDetailURL = function(env){
  if (env === 'prd') {
    return "https://www.msupply.com/product/api/v1.0/category/";
  } else if(env === 'stg') {
    return "http://stg.msupply.com/product/api/v1.0/category/";
  } else if(env === 'dev' || env === 'loc') {
    return "http://devl.msupply.com/product/api/v1.0/category/";
  }
}

exports.getProductTempSkuURL = function(env){
  if (env === 'prd') {
    return "https://www.msupply.com/product/api/v1.0/productTempSkus";
  }
  else if (env === 'stg') {
    return "http://nodejs-product.stg.msupply-internal.local/product/api/v1.0/productTempSkus";
  }else if(env === 'dev') {
    return "http://nodejs-product.dev.msupply-internal.local/product/api/v1.0/productTempSkus";
  }else if( env === 'loc'){
    return "http://localhost:8083/product/api/v1.0/productTempSkus";
  }
}

exports.getSkuDetailsURL = function(env){
  if (env === 'prd') {
    return "https://www.msupply.com/product/api/v1.0/getSkuDetails";
  }
  else if (env === 'stg') {
    return "http://nodejs-product.stg.msupply-internal.local/product/api/v1.0/getSkuDetails";
  }else if(env === 'dev') {
    return "http://nodejs-product.dev.msupply-internal.local/product/api/v1.0/getSkuDetails";
  }else if( env === 'loc'){
    return "http://nodejs-product.dev.msupply.com/product/api/v1.0/getSkuDetails";
  }
}