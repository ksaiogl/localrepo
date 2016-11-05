exports.getMysqlPoolConfig = function (env){

  if (env === 'prd') {
    return {
      connectionLimit : 5,
      host     : 'msupply-new.cjwmdg3sib3d.eu-west-1.rds.amazonaws.com',
      user     : 'msupplyprod',
      password : 'ap1gk6tYz7ip',
      database : 'msupply',
      debug    :  false
    };
  } else if(env === 'stg' || env === 'dev') {
    return {
      connectionLimit : 5,
      host     : 'msupply-stg.cjwmdg3sib3d.eu-west-1.rds.amazonaws.com',
      user     : 'mSupplystg',
      password : 'mSupplyCartstg',
      database : 'mSupplystg',
      debug    :  false
    }
  } else if(env === 'loc') {
    return {
      connectionLimit : 5,
      host     : 'localhost',
      user     : 'root',
      password : '',
      database : 'magentoDB',
      debug    :  false
    }
  }

}


//********** SQL Queries ****************

exports.categorySkuQuery = "SELECT E.value as ParentCategory , P.sku as 'SKU' FROM zaybx_catalog_category_entity A right join zaybx_catalog_category_entity_int B on A.entity_id=B.entity_id join zaybx_catalog_category_entity D on D.entity_id = A.parent_id join zaybx_catalog_category_entity_varchar E on E.entity_id=D.entity_id join zaybx_catalog_category_product F on F.category_id = A.entity_id join zaybx_catalog_product_entity P on P.entity_id = F.product_id left join zaybx_catalog_product_entity_varchar Z on Z.entity_id = P.entity_id and Z.attribute_id = 71 WHERE B.value=1 and B.attribute_id=42 and A.entity_id!=139 and E.attribute_id=41 and P.sku not like '%-%'";


exports.allSkus = "SELECT E.value as ParentCategory , count(P.sku)  as 'SKU' FROM zaybx_catalog_category_entity A right join zaybx_catalog_category_entity_int B on A.entity_id=B.entity_id join zaybx_catalog_category_entity D on D.entity_id = A.parent_id join zaybx_catalog_category_entity_varchar E on E.entity_id=D.entity_id join zaybx_catalog_category_product F on F.category_id = A.entity_id join zaybx_catalog_product_entity P on P.entity_id = F.product_id left join zaybx_catalog_product_entity_varchar Z on Z.entity_id = P.entity_id and Z.attribute_id = 71 WHERE B.value=1 and B.attribute_id=42 and A.entity_id!=139 and E.attribute_id=41 and P.sku not like '%-%' group by ParentCategory";


exports.activeSkus = "SELECT E.value as ParentCategory , count(P.sku)  as 'SKU' FROM zaybx_catalog_category_entity A right join zaybx_catalog_category_entity_int B on A.entity_id=B.entity_id join zaybx_catalog_category_entity D on D.entity_id = A.parent_id join zaybx_catalog_category_entity_varchar E on E.entity_id=D.entity_id join zaybx_catalog_category_product F on F.category_id = A.entity_id join zaybx_catalog_product_entity P on P.entity_id = F.product_id left join zaybx_catalog_product_entity_varchar Z on Z.entity_id = P.entity_id and Z.attribute_id = 71 left join zaybx_catalog_product_entity_int Q on P.entity_id = Q.entity_id and Q.attribute_id = 96 WHERE B.value=1 and B.attribute_id=42 and A.entity_id!=139 and E.attribute_id=41 and Q.value = 1 and P.sku not like '%-%' group by ParentCategory";


exports.brand = "SELECT E.value as ParentCategory , Count(distinct I.value) as 'Brand' FROM zaybx_catalog_category_entity A right join zaybx_catalog_category_entity_int B on A.entity_id=B.entity_id join zaybx_catalog_category_entity D on D.entity_id = A.parent_id join zaybx_catalog_category_entity_varchar E on E.entity_id=D.entity_id join zaybx_catalog_category_product F on F.category_id = A.entity_id join zaybx_catalog_product_entity P on P.entity_id = F.product_id left join zaybx_catalog_product_entity_varchar Z on Z.entity_id = P.entity_id and Z.attribute_id = 71 left join zaybx_catalog_product_entity_int J on J.entity_id = P.entity_id and J.attribute_id=81 left join zaybx_eav_attribute_option_value I on I.option_id = J.value WHERE B.value=1 and B.attribute_id=42 and A.entity_id!=139 and E.attribute_id=41 and P.sku not like '%-%' group by ParentCategory";
