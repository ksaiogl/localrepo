/***********************************************************************
**** This function returns the Hard-Coded JSON based on product type  ***** 
***********************************************************************/
var TAG = "calculator.js";
var dbConfig = require('../../Environment/mongoDatabase.js');
var async = require('async');

exports.getDetails = function(productType, callback){		
	var result;

	if(productType === 'reinforcementSteelTMT'){

		result = {
				"reinforcementSteelTMT": {
					"options": [{
						"size": 750,
						"properties": [{
							"areaPerStorey": 750,
							"areaPerStoreyUnit": "sqft",
							"numberOfStorey": 1,
							"totalBuiltUpArea": 750,
							"totalBuiltUpAreaUnit": "sqft",
							"diameterOfSteel8mm": 8,
							"noOfBundles8mm": 9,
							"weightOfBundles8mm": 0.047,
							"diameterOfSteel10mm": 10,
							"noOfBundles10mm": 13,
							"weightOfBundles10mm": 0.052,
							"diameterOfSteel12mm": 12,
							"noOfBundles12mm": 7,
							"weightOfBundles12mm": 0.053,
							"diameterOfSteel16mm": 16,
							"noOfBundles16mm": 9,
							"weightOfBundles16mm": 0.057,
							"diameterOfSteel20mm": 20,
							"noOfBundles20mm": 4,
							"weightOfBundles20mm": 0.059,
							"totalSteelBundlesRequired": 42
						}, {
							"areaPerStorey": 750,
							"areaPerStoreyUnit": "sqft",
							"numberOfStorey": 2,
							"totalBuiltUpArea": 1500,
							"totalBuiltUpAreaUnit": "sqft",
							"diameterOfSteel8mm": 8,
							"noOfBundles8mm": 24,
							"weightOfBundles8mm": 0.047,
							"diameterOfSteel10mm": 10,
							"noOfBundles10mm": 22,
							"weightOfBundles10mm": 0.052,
							"diameterOfSteel12mm": 12,
							"noOfBundles12mm": 34,
							"weightOfBundles12mm": 0.053,
							"diameterOfSteel16mm": 16,
							"noOfBundles16mm": 8,
							"weightOfBundles16mm": 0.057,
							"diameterOfSteel20mm": 20,
							"noOfBundles20mm": 6,
							"weightOfBundles20mm": 0.059,
							"totalSteelBundlesRequired": 94
						}, {
							"areaPerStorey": 750,
							"areaPerStoreyUnit": "sqft",
							"numberOfStorey": 3,
							"totalBuiltUpArea": 2250,
							"totalBuiltUpAreaUnit": "sqft",
							"diameterOfSteel8mm": 8,
							"noOfBundles8mm": 41,
							"weightOfBundles8mm": 0.047,
							"diameterOfSteel10mm": 10,
							"noOfBundles10mm": 41,
							"weightOfBundles10mm": 0.052,
							"diameterOfSteel12mm": 12,
							"noOfBundles12mm": 43,
							"weightOfBundles12mm": 0.053,
							"diameterOfSteel16mm": 16,
							"noOfBundles16mm": 7,
							"weightOfBundles16mm": 0.057,
							"diameterOfSteel20mm": 20,
							"noOfBundles20mm": 9,
							"weightOfBundles20mm": 0.059,
							"totalSteelBundlesRequired": 141
						}]
					}, {
						"size": 1000,
						"properties": [{
							"areaPerStorey": 1000,
							"areaPerStoreyUnit": "sqft",
							"numberOfStorey": 1,
							"totalBuiltUpArea": 1000,
							"totalBuiltUpAreaUnit": "sqft",
							"diameterOfSteel8mm": 8,
							"noOfBundles8mm": 16,
							"weightOfBundles8mm": 0.047,
							"diameterOfSteel10mm": 10,
							"noOfBundles10mm": 16,
							"weightOfBundles10mm": 0.052,
							"diameterOfSteel12mm": 12,
							"noOfBundles12mm": 14,
							"weightOfBundles12mm": 0.053,
							"diameterOfSteel16mm": 16,
							"noOfBundles16mm": 7,
							"weightOfBundles16mm": 0.057,
							"diameterOfSteel20mm": 20,
							"noOfBundles20mm": 5,
							"weightOfBundles20mm": 0.059,
							"totalSteelBundlesRequired": 58
						}, {
							"areaPerStorey": 1000,
							"areaPerStoreyUnit": "sqft",
							"numberOfStorey": 2,
							"totalBuiltUpArea": 2000,
							"totalBuiltUpAreaUnit": "sqft",
							"diameterOfSteel8mm": 8,
							"noOfBundles8mm": 33,
							"weightOfBundles8mm": 0.047,
							"diameterOfSteel10mm": 10,
							"noOfBundles10mm": 25,
							"weightOfBundles10mm": 0.052,
							"diameterOfSteel12mm": 12,
							"noOfBundles12mm": 25,
							"weightOfBundles12mm": 0.053,
							"diameterOfSteel16mm": 16,
							"noOfBundles16mm": 24,
							"weightOfBundles16mm": 0.057,
							"diameterOfSteel20mm": 20,
							"noOfBundles20mm": 14,
							"weightOfBundles20mm": 0.059,
							"totalSteelBundlesRequired": 121
						}, {
							"areaPerStorey": 1000,
							"areaPerStoreyUnit": "sqft",
							"numberOfStorey": 3,
							"totalBuiltUpArea": 3000,
							"totalBuiltUpAreaUnit": "sqft",
							"diameterOfSteel8mm": 8,
							"noOfBundles8mm": 58,
							"weightOfBundles8mm": 0.047,
							"diameterOfSteel10mm": 10,
							"noOfBundles10mm": 37,
							"weightOfBundles10mm": 0.052,
							"diameterOfSteel12mm": 12,
							"noOfBundles12mm": 72,
							"weightOfBundles12mm": 0.053,
							"diameterOfSteel16mm": 16,
							"noOfBundles16mm": 11,
							"weightOfBundles16mm": 0.057,
							"diameterOfSteel20mm": 20,
							"noOfBundles20mm": 21,
							"weightOfBundles20mm": 0.059,
							"totalSteelBundlesRequired": 199
						}]
					}, {
						"size": 1250,
						"properties": [{
							"areaPerStorey": 1250,
							"areaPerStoreyUnit": "sqft",
							"numberOfStorey": 1,
							"totalBuiltUpArea": 1250,
							"totalBuiltUpAreaUnit": "sqft",
							"diameterOfSteel8mm": 8,
							"noOfBundles8mm": 18,
							"weightOfBundles8mm": 0.047,
							"diameterOfSteel10mm": 10,
							"noOfBundles10mm": 27,
							"weightOfBundles10mm": 0.052,
							"diameterOfSteel12mm": 12,
							"noOfBundles12mm": 21,
							"weightOfBundles12mm": 0.053,
							"diameterOfSteel16mm": 16,
							"noOfBundles16mm": 6,
							"weightOfBundles16mm": 0.057,
							"diameterOfSteel20mm": 20,
							"noOfBundles20mm": 2,
							"weightOfBundles20mm": 0.059,
							"totalSteelBundlesRequired": 74
						}, {
							"areaPerStorey": 1250,
							"areaPerStoreyUnit": "sqft",
							"numberOfStorey": 2,
							"totalBuiltUpArea": 2500,
							"totalBuiltUpAreaUnit": "sqft",
							"diameterOfSteel8mm": 8,
							"noOfBundles8mm": 42,
							"weightOfBundles8mm": 0.047,
							"diameterOfSteel10mm": 10,
							"noOfBundles10mm": 53,
							"weightOfBundles10mm": 0.052,
							"diameterOfSteel12mm": 12,
							"noOfBundles12mm": 26,
							"weightOfBundles12mm": 0.053,
							"diameterOfSteel16mm": 16,
							"noOfBundles16mm": 16,
							"weightOfBundles16mm": 0.057,
							"diameterOfSteel20mm": 20,
							"noOfBundles20mm": 18,
							"weightOfBundles20mm": 0.059,
							"totalSteelBundlesRequired": 155
						}, {
							"areaPerStorey": 1250,
							"areaPerStoreyUnit": "sqft",
							"numberOfStorey": 3,
							"totalBuiltUpArea": 3750,
							"totalBuiltUpAreaUnit": "sqft",
							"diameterOfSteel8mm": 8,
							"noOfBundles8mm": 68,
							"weightOfBundles8mm": 0.047,
							"diameterOfSteel10mm": 10,
							"noOfBundles10mm": 58,
							"weightOfBundles10mm": 0.052,
							"diameterOfSteel12mm": 12,
							"noOfBundles12mm": 70,
							"weightOfBundles12mm": 0.053,
							"diameterOfSteel16mm": 16,
							"noOfBundles16mm": 6,
							"weightOfBundles16mm": 0.057,
							"diameterOfSteel20mm": 20,
							"noOfBundles20mm": 28,
							"weightOfBundles20mm": 0.059,
							"totalSteelBundlesRequired": 230
						}]
					}, {
						"size": 1500,
						"properties": [{
							"areaPerStorey": 1500,
							"areaPerStoreyUnit": "sqft",
							"numberOfStorey": 1,
							"totalBuiltUpArea": 1500,
							"totalBuiltUpAreaUnit": "sqft",
							"diameterOfSteel8mm": 8,
							"noOfBundles8mm": 21,
							"weightOfBundles8mm": 0.047,
							"diameterOfSteel10mm": 10,
							"noOfBundles10mm": 32,
							"weightOfBundles10mm": 0.052,
							"diameterOfSteel12mm": 12,
							"noOfBundles12mm": 16,
							"weightOfBundles12mm": 0.053,
							"diameterOfSteel16mm": 16,
							"noOfBundles16mm": 13,
							"weightOfBundles16mm": 0.057,
							"diameterOfSteel20mm": 20,
							"noOfBundles20mm": 4,
							"weightOfBundles20mm": 0.059,
							"totalSteelBundlesRequired": 86
						}, {
							"areaPerStorey": 1500,
							"areaPerStoreyUnit": "sqft",
							"numberOfStorey": 2,
							"totalBuiltUpArea": 3000,
							"totalBuiltUpAreaUnit": "sqft",
							"diameterOfSteel8mm": 8,
							"noOfBundles8mm": 45,
							"weightOfBundles8mm": 0.047,
							"diameterOfSteel10mm": 10,
							"noOfBundles10mm": 56,
							"weightOfBundles10mm": 0.052,
							"diameterOfSteel12mm": 12,
							"noOfBundles12mm": 34,
							"weightOfBundles12mm": 0.053,
							"diameterOfSteel16mm": 16,
							"noOfBundles16mm": 32,
							"weightOfBundles16mm": 0.057,
							"diameterOfSteel20mm": 20,
							"noOfBundles20mm": 16,
							"weightOfBundles20mm": 0.059,
							"totalSteelBundlesRequired": 183
						}, {
							"areaPerStorey": 1500,
							"areaPerStoreyUnit": "sqft",
							"numberOfStorey": 3,
							"totalBuiltUpArea": 4500,
							"totalBuiltUpAreaUnit": "sqft",
							"diameterOfSteel8mm": 8,
							"noOfBundles8mm": 68,
							"weightOfBundles8mm": 0.047,
							"diameterOfSteel10mm": 10,
							"noOfBundles10mm": 69,
							"weightOfBundles10mm": 0.052,
							"diameterOfSteel12mm": 12,
							"noOfBundles12mm": 54,
							"weightOfBundles12mm": 0.053,
							"diameterOfSteel16mm": 16,
							"noOfBundles16mm": 56,
							"weightOfBundles16mm": 0.057,
							"diameterOfSteel20mm": 20,
							"noOfBundles20mm": 25,
							"weightOfBundles20mm": 0.059,
							"totalSteelBundlesRequired": 272
						}]
					}]
				},
				"images": {
					"calculatorHeaderImage": "https://s3-eu-west-1.amazonaws.com/msupplycalculators/TMTSteel/TMTSteel_HeaderImage.png",
					"imageURLs": ["https://s3-eu-west-1.amazonaws.com/msupplycalculators/TMTSteel/fe-415.png","https://s3-eu-west-1.amazonaws.com/msupplycalculators/TMTSteel/fe-500.png","https://s3-eu-west-1.amazonaws.com/msupplycalculators/TMTSteel/fe-500D.png","https://s3-eu-west-1.amazonaws.com/msupplycalculators/TMTSteel/fe-550D.png","https://s3-eu-west-1.amazonaws.com/msupplycalculators/TMTSteel/fe-600.png"]
				}
			};
		callback(false, result);
	}else if(productType === 'blockWork'){

	   result ={
				"BrickAndBlock": {

					"solidConcreteBlockWork": {
						"activity": "Solid concrete block work",
						"unitOfWork": "sqm",
						"coeffecient": {
							"block": 12.5,
							"blockUnit": "Number",
							"cement": 0.15,
							"cementUnit": "Bag",
							"sand": 0.95,
							"sandUnit": "cft"
						},
						"size": ["8inch solid concrete block", "6inch solid concrete block", "4inch solid concrete block"]
					},
					"aacLightWeightBlockWork": {
						"activity": "AAC Light weight block work",
						"unitOfWork": "sqm",
						"coeffecient": {
							"block": 8.5,
							"blockUnit": "Number",
							"cement": 0.11,
							"cementUnit": "Bag",
							"sand": 0.85,
							"sandUnit": "cft"
						},
						"size": ["8inch AAC light weight block", "6inch AAC light weight block", "4inch AAC light weight block"]
					},
					"porothermClayBlockWork": {
						"activity": "Porotherm clay block work",
						"unitOfWork": "sqm",
						"coeffecient": {
							"block": 12.5,
							"blockUnit": "Number",
							"cement": 0.12,
							"cementUnit": "Bag",
							"sand": 0.9,
							"sandUnit": "cft"
						},
						"size": ["8inch Porotherm clay block", "6inch Porotherm clay block", "4inch Porotherm clay block"]
					},
					"brickWork": {
						"activity": "Brick work",
						"unitOfWork": "cum",
						"coeffecient": {
							"brick": 500,
							"brickUnit": "Number",
							"cement": 1.25,
							"cementUnit": "Bag",
							"sand": 9,
							"sandUnit": "cft"
						},
						"size": ["9inch Brick work"]
					},
					"halfBrickWork": {
						"activity": "Half Brick work",
						"unitOfWork": "sqm",
						"coeffecient": {
							"brick": 60,
							"brickUnit": "Number",
							"cement": 0.15,
							"cementUnit": "Bag",
							"sand": 1.05,
							"sandUnit": "cft"
						},
						"size": ["4.5inch Half Brick work"]
					}	
				},
				"images":{
					"calculatorHeaderImage":"https://s3-eu-west-1.amazonaws.com/msupplycalculators/Brick_Block/Bricks_HeaderImage.png",
					"imageURLs":["https://s3-eu-west-1.amazonaws.com/msupplycalculators/Brick_Block/AACblock.png","https://s3-eu-west-1.amazonaws.com/msupplycalculators/Brick_Block/ClayBlock.png",
					             "https://s3-eu-west-1.amazonaws.com/msupplycalculators/Brick_Block/ClayBrick.png","https://s3-eu-west-1.amazonaws.com/msupplycalculators/Brick_Block/SolidConcreteBlock.png"]
				}
			};
	   callback(false, result);
	}else if(productType === 'plaster'){

		result = {
			"plaster": {
				"ceilingPlastering": {
					"activity": "12mm Ceiling plastering CM 1:4",
					"unitOfWork": "sqm",
					"cement": 0.11,
					"cementUnit": "Bag",
					"mSand": 0.9,
					"mSandUnit":"cft"
				},
				"internalPlastering": {
					"activity": "15mm internal plastering CM 1:5",
					"unitOfWork": "sqm",
					"cement": 0.11,
					"cementUnit": "Bag",
					"mSand": 1,
					"mSandUnit":"cft"
				},
				"roughPlaster": {
					"activity": "12mm rough plaster in CM 1:5",
					"unitOfWork": "sqm",
					"cement": 0.09,
					"cementUnit": "Bag",
					"mSand": 0.9,
					"mSandUnit":"cft"
				},
				"doubleCoatExternalPlaster": {
					"activity": "25mm double coat external plaster in CM 1:5",
					"unitOfWork": "sqm",
					"cement": 0.23,
					"cementUnit": "Bag",
					"mSand": 1.2,
					"mSandUnit":"cft"
				},
				"singleCoatExternalPlaster": {
					"activity": "20mm single coat external plaster in CM 1:6",
					"unitOfWork": "sqm",
					"cement": 0.17,
					"cementUnit": "Bag",
					"mSand": 1,
					"mSandUnit":"cft"
				}
			},
			"images":{
				"calculatorHeaderImage":"http://www.msupply.com/media/catalog/product/0/0/00201000404.jpg",
				"imageURLs":["http://www.msupply.com/media/catalog/product/0/0/00201000404.jpg","http://www.msupply.com/media/catalog/product/0/0/00201000404.jpg"]
			}
		};
		callback(false, result);
	}else if(productType === 'ceramicAndVetrified'){

		//Variable for Mongo DB Connection. 
		var db = dbConfig.mongoDbConn;
		
		result =
		{
		          "ceramicAndVetrified" : {
		               "flooringWork" : {
		                    "typeOfWork" : "Flooring Work",
		                    "workKind" : {
		                         "ceramicTile" : {
		                              "activity" : "Ceramic Tile",
		                              "unitOfWork" : "sqm",
		                              "coeffecient" : {
		                                   "ceramicTile" : "",
		                                   "ceramicTileUnit" : "Tile",
		                                   "cement" : 0.28,
		                                   "cementUnit" : "Bag",
		                                   "sand" : 1.45,
		                                   "sandUnit" : "cft"
		                              },
		                              "material" : "Ceramic floor tile",
		                              "tileSizes" : []
		                         },
		                         "vitrifiedTile" : {
		                              "activity" : "Vitrified Tile",
		                              "unitOfWork" : "sqm",
		                              "coeffecient" : {
		                                   "vitrifiedTile" : "",
		                                   "vitrifiedTileUnit" : "Tile",
		                                   "cement" : 0.28,
		                                   "cementUnit" : "Bag",
		                                   "sand" : 1.45,
		                                   "sandUnit" : "cft"
		                              },
		                              "material" : "Vitrified floor tile",
		                              "tileSizes" : []
		                         }
		                    }
		               },
		               "wallTilingWork" : {
		                    "typeOfWork" : "Wall Tiling Work",
		                    "workKind" : {
		                         "ceramicTile" : {
		                              "activity" : "Ceramic Tile",
		                              "unitOfWork" : "sqm",
		                              "coeffecient" : {
		                                   "ceramicTile" : "",
		                                   "ceramicTileUnit" : "Tile",
		                                   "cement" : 0.24,
		                                   "cementUnit" : "Bag",
		                                   "sand" : 1.2,
		                                   "sandUnit" : "cft"
		                              },
		                              "material" : "Ceramic wall tile",
		                              "tileSizes" : []
		                         },
		                         "vitrifiedTile" : {
		                              "activity" : "Vitrified Tile",
		                              "unitOfWork" : "sqm",
		                              "coeffecient" : {
		                                   "vitrifiedTile" : "",
		                                   "vitrifiedTileUnit" : "Tile",
		                                   "cement" : 0.24,
		                                   "cementUnit" : "Bag",
		                                   "sand" : 1.2,
		                                   "sandUnit" : "cft"
		                              },
		                              "material" : "Vitrified wall tile",
		                              "tileSizes" : []
		                         }
		                    }
		               }
		          },
		          "images" : {
		               "calculatorHeaderImage" : "https://s3-eu-west-1.amazonaws.com/msupplycalculators/Ceramic/Tiles.png",
		               "imageURLs" : ["https://s3-eu-west-1.amazonaws.com/msupplycalculators/Ceramic/Ceramic-tiles.png","https://s3-eu-west-1.amazonaws.com/msupplycalculators/Ceramic/Vitrified-tiles.png"]
		          }
		     };


		
		var vetAndCeramic = db.collection('Calculators');
		
		vetAndCeramic.find({},
				{"_id":0}).toArray(function(err, presult){
					
			if(!err && (presult !== null)){
				
				async.forEachSeries(presult,
				 		function(dbresult, callback){
				
					var material = dbresult.Material;
					var application = dbresult.Application;
					var element;
					
					if(material === "Vitrified tile" && application === "Floor Tiles"){
						
						element = {
								"tileDimension": dbresult.Size_MKS,
								"length":dbresult.Length_MKS,
								"breadth":dbresult.Breadth_MKS,
								"tileDimensionUnit": dbresult.Length_MKS_Measure,
								"noOfTilesRequired": "",
								"tileUnit": dbresult.Pack_size_UOM,
								"tilesPerBox": dbresult.Pack_Size
							};
						
						result.ceramicAndVetrified.flooringWork.workKind.vitrifiedTile.tileSizes.push(element);
						return callback(false);
					}else if(material === "Vitrified tile" && application === "Wall tiles"){
						
						element = {
								"tileDimension": dbresult.Size_MKS,
								"length":dbresult.Length_MKS,
								"breadth":dbresult.Breadth_MKS,
								"tileDimensionUnit": dbresult.Length_MKS_Measure,
								"noOfTilesRequired": "",
								"tileUnit": dbresult.Pack_size_UOM,
								"tilesPerBox": dbresult.Pack_Size
							};
						
						result.ceramicAndVetrified.wallTilingWork.workKind.vitrifiedTile.tileSizes.push(element);
						return callback(false);
					}else if(material === "Ceramic tile" && application === "Floor Tiles"){
						
						element = {
								"tileDimension": dbresult.Size_MKS,
								"length":dbresult.Length_MKS,
								"breadth":dbresult.Breadth_MKS,
								"tileDimensionUnit": dbresult.Length_MKS_Measure,
								"noOfTilesRequired": "",
								"tileUnit": dbresult.Pack_size_UOM,
								"tilesPerBox": dbresult.Pack_Size
							};
						
						result.ceramicAndVetrified.flooringWork.workKind.ceramicTile.tileSizes.push(element);
						return callback(false);
					}else if(material === "Ceramic tile" && application === "Wall tiles"){
						
						element = {
								"tileDimension": dbresult.Size_MKS,
								"length":dbresult.Length_MKS,
								"breadth":dbresult.Breadth_MKS,
								"tileDimensionUnit": dbresult.Length_MKS_Measure,
								"noOfTilesRequired": "",
								"tileUnit": dbresult.Pack_size_UOM,
								"tilesPerBox": dbresult.Pack_Size
							};
						
						result.ceramicAndVetrified.wallTilingWork.workKind.ceramicTile.tileSizes.push(element);
						return callback(false);
					}
				},
				//Final Function to be called upon completion of all functions.
 				function(error)
 				{
 			 		if(!error){
 			 			return callback(false, result);	
 			 		}else{
 						return callback(true, result);
 			 		}
 				});
			}
		});
	}else if(productType === 'graniteAndMarble'){

		result =   {
				"graniteAndMarble": {
					"graniteSlabFlooring": {
			               "typeOfWork": "Granite Slab Flooring",
			                "workKind" : {
						"granite": {
							"activity": "Granite",
							"unitOfWork": "sft",
							"coeffecient": {
								"material": 1.1,
								"materialUnit": "Slab",
								"cement": 0.026,
								"cementUnit": "Bag",
								"sand": 0.135,
								"sandUnit": "cft"
							},
							"material": "Granite slab",
							"slabSizes": [{
								"9ft*3ft": {
									"l": 9,
									"b": 3
								}
							}]
						}
			                }
					},
					"marbleSlabFlooring": {
			               "typeOfWork": "Marble Slab Flooring",
			                "workKind" : {
						"indianMarble": {
							"activity": "Indian Marble",
							"unitOfWork": "sft",
							"coeffecient": {
								"material": 1.1,
								"materialUnit": "Slab",
								"cement": 0.026,
								"cementUnit": "Bag",
								"sand": 0.135,
								"sandUnit": "cft"
							},
							"material": "Marble slab",
							"slabSizes": [{
								"10ft*6ft": {
									"l": 10,
									"b": 6
								}
							}]
						},
						"italianMarble": {
							"activity": "Italian Marble",
							"unitOfWork": "sft",
							"coeffecient": {
								"material": 1.1,
								"materialUnit": "Slab",
								"cement": 0.026,
								"cementUnit": "Bag",
								"sand": 0.135,
								"sandUnit": "cft"
							},
							"material": "Marble slab",
							"slabSizes": [{
								"10ft*6ft": {
									"l": 10,
									"b": 6
								}
							}]
						}
			                }
					}
				},
				"images": {
					"calculatorHeaderImage": "https://s3-eu-west-1.amazonaws.com/msupplycalculators/Granite_Marble/Granite_HeaderImage.png",
					"imageURLs": ["https://s3-eu-west-1.amazonaws.com/msupplycalculators/Granite_Marble/granite1.png","https://s3-eu-west-1.amazonaws.com/msupplycalculators/Granite_Marble/marble.png"]
				}
			};
		callback(false, result);
	}else if(productType === 'rccConcreteWorks'){

		result = {
	"rccConcreteWorks":{
		"SITE MIX CONCRETE":{
			"RCCM20":{
				"activity":"Site Mix Concrete (SMC)",
				"grade":"RCC-M20 (1:1.5:3)",
				"unitOfWork":"cum",
				"cement":6.7,
				"cementUnit":"Bag",
				"mmCA20":16.105,
				"mmCAUnit20":"cft",
				"mmCA12":16.105,
				"mmCAUnit12":"cft",
				"sand":18.36,
				"sandUnit":"cft"
			},
			"RCCM25":{
				"activity":"Site Mix Concrete (SMC)",
				"grade":"RCC-M25 (1:1:2)",
				"unitOfWork":"cum",
				"cement":8,
				"cementUnit":"Bag",
				"mmCA20":16.105,
				"mmCAUnit20":"cft",
				"mmCA12":16.105,
				"mmCAUnit12":"cft",
				"sand":18.36,
				"sandUnit":"cft"
			}
		},
		"READY MIX CONCRETE":{
			"RMCM20":{
				"activity":"Ready Mix Concrete (RMC)",
				"grade":"RMC-M20",
				"unitOfWork":"cum",
				"rmc":1.05,
				"rmcUnit":"cum"
			},
			"RMCM25":{
				"activity":"Ready Mix Concrete (RMC)",
				"grade":"RMC-M25",
				"unitOfWork":"cum",
				"rmc":1.05,
				"rmcUnit":"cum"
			},
			"RMCM30":{
				"activity":"Ready Mix Concrete (RMC)",
				"grade":"RMC-M30",
				"unitOfWork":"cum",
				"rmc":1.05,
				"rmcUnit":"cum"
			},
			"RMCM35":{
				"activity":"Ready Mix Concrete (RMC)",
				"grade":"RMC-M35",
				"unitOfWork":"cum",
				"rmc":1.05,
				"rmcUnit":"cum"
			},
			"RMCM40":{
				"activity":"Ready Mix Concrete (RMC)",
				"grade":"RMC-M40",
				"unitOfWork":"cum",
				"rmc":1.05,
				"rmcUnit":"cum"
			}
		}
	},
	"work":["Rectangular Footing","Roof Beam/Plinth Beam","Rectangular/Sqare Columns","Round/Circular Columns","Trapezoidal","Roof Slab"],
	"images":{
		"calculatorHeaderImage":"https://s3-eu-west-1.amazonaws.com/msupplycalculators/Concrete_RCC/Rcc.png",
		"imageURLs":["https://s3-eu-west-1.amazonaws.com/msupplycalculators/Concrete_RCC/Ready-Mix-Concrete.png","https://s3-eu-west-1.amazonaws.com/msupplycalculators/Concrete_RCC/Site-Mix-Concrete(SMC).png"]
	}
};
		callback(false, result);
	}else if(productType === 'masonry'){

		result = {
			"masonry":{
				"randomRubbleMasonry":{
					"activity":"Random Rubble Masonry",
					"unitOfWork":"cft",
					"boulders":1.4,
					"bouldersUnit":"cft",
					"cement":0.05,
					"cementUnit":"Bag",
					"sand":0.35,
					"sandUnit":"cft"
				},
				"sizeStoneMasonry":{
					"activity":"Size stone masonry",
					"unitOfWork":"cft",
					"sizeStones":3.55,
					"sizeStonesUnit":"Number",
					"boulders":0.18,
					"bouldersUnit":"cft",
					"cement":0.04,
					"cementUnit":"Bag",
					"sand":0.32,
					"sandUnit":"cft"
				},
				"soling":{
					"activity":"Soling - 6inch",
					"unitOfWork":"sft",
					"6inchSoling":0.7,
					"40mmSize":0.15,
					"sand":0.1,
					"sandUnit":"cft"
				}		
			},
			"images":{
				"calculatorHeaderImage":"https://s3-eu-west-1.amazonaws.com/msupplycalculators/Granite_Marble/StoneWall/Stones_HeaderImage.png",
				"imageURLs":["https://s3-eu-west-1.amazonaws.com/msupplycalculators/Granite_Marble/StoneWall/Size+stone.png","https://s3-eu-west-1.amazonaws.com/msupplycalculators/Granite_Marble/StoneWall/Boulders.png"]
			}
		};
		callback(false, result);
	}else if(productType === 'pccConcreteWorks'){
		
		result = {
	"pccConcreteWorks":{
		"SMC":{
			"PCCM7.5":{
				"activity":"Site Mix Concrete (SMC)",
				"grade":"PCC-M7.5 (1:4:8)",
				"unitOfWork":"cum",
				"cement":3.42,
				"cementUnit":"Bag",
				"mmCA40":33.21,
				"mmCAUnit40":"cft",
				"sand":18.36,
				"sandUnit":"cft"
			},
			"PCCM10":{
				"activity":"Site Mix Concrete (SMC)",
				"grade":"PCC-M10 (1:3:6)",
				"unitOfWork":"cum",
				"cement":4.47,
				"cementUnit":"Bag",
				"mmCA20":16.105,
				"mmCAUnit20":"cft",
				"mmCA12":16.105,
				"mmCAUnit12":"cft",
				"sand":18.36,
				"sandUnit":"cft"
			},
			"PCCM15":{
				"activity":"Site Mix Concrete (SMC)",
				"grade":"PCC-M15 (1:2:4)",
				"unitOfWork":"cum",
				"cement":6.36,
				"cementUnit":"Bag",
				"mmCA20":16.105,
				"mmCAUnit20":"cft",
				"mmCA12":16.105,
				"mmCAUnit12":"cft",
				"sand":18.36,
				"sandUnit":"cft"
			}	
		},
		"RMC":{
			"RMCM5":{
				"activity":"Ready Mix Concrete (RMC)",
				"grade":"RMC-M5",
				"unitOfWork":"cum",
				"rmc":1.05,
				"rmcUnit":"cum"
			},
			"RMCM7.5":{
				"activity":"Ready Mix Concrete (RMC)",
				"grade":"RMC-M7.5",
				"unitOfWork":"cum",
				"rmc":1.05,
				"rmcUnit":"cum"
			},
			"RMCM10":{
				"activity":"Ready Mix Concrete (RMC)",
				"grade":"RMC-M10",
				"unitOfWork":"cum",
				"rmc":1.05,
				"rmcUnit":"cum"
			},
			"RMCM15":{
				"activity":"Ready Mix Concrete (RMC)",
				"grade":"RMC-M15",
				"unitOfWork":"cum",
				"rmc":1.05,
				"rmcUnit":"cum"
			}	
		}
	},
	"work":["Footing PCC","Flooring PCC","Screed Concrete"],
	"images":{
		"calculatorHeaderImage":"https://s3-eu-west-1.amazonaws.com/msupplycalculators/Concrete_PCC/Concrete_HeaderImage.png",
		"imageURLs":["https://s3-eu-west-1.amazonaws.com/msupplycalculators/Concrete_PCC/Ready-Mix-Concrete.png","https://s3-eu-west-1.amazonaws.com/msupplycalculators/Concrete_PCC/Site-Mix-Concrete(SMC).png"]
	}
};
		callback(false, result);
	} else if(productType === 'painting'){
		
		result = {
	"paintingMaterial": {
		"interiorPaint": {
			"typeOfWork": "Interior Paint",
			"workKind": {
				"distemper": {
					"activity": "Distemper Internal walls & ceiling",
					"unitOfWork": "sft",
					"coeffecient": {
						"primer": 70,
						"primerUnit": "liter",
						"putty": 30,
						"puttyUnit": "kg",
						"distemper": 9,
						"distemperUnit": "kg"
					}
				},
				"emulsion": {
					"activity": "Emulsion Internal walls & ceiling",
					"unitOfWork": "sft",
					"coeffecient": {
						"primer": 70,
						"primerUnit": "liter",
						"putty": 30,
						"puttyUnit": "kg",
						"emulsion": 105,
						"emulsionUnit": "liter"
					}
				}
			}
		},
		"exteriorPaint": {
			"typeOfWork": "Exterior Paint",
			"workKind": {
				"cementPaint": {
					"activity": "Cement Paint External walls",
					"unitOfWork": "sft",
					"coeffecient": {
						"cementPaint": 11,
						"cementPaintUnit": "kg"
					}
				},
				"emulsion": {
					"activity": "Emulsion Paint External walls",
					"unitOfWork": "sft",
					"coeffecient": {
						"primer": 120,
						"primerUnit": "liter",
						"emulsion": 55,
						"emulsionUnit": "liter"
					}
				}
			}
		},
		"enamelPaint": {
			"typeOfWork": "Enamel Paint",
			"workKind": {
				"enamelWooden": {
					"activity": "Enamel Paint Wooden Doors",
					"unitOfWork": "sft",
					"coeffecient": {
						"primer": 40,
						"primerUnit": "liter",
						"putty": 30,
						"puttyUnit": "kg",
						"enamel": 95,
						"enamelUnit": "liter"
					}
				},
				"enamelInternalWall": {
					"activity": "Enamel Paint Internal walls",
					"unitOfWork": "sft",
					"coeffecient": {
						"primer": 40,
						"primerUnit": "liter",
						"putty": 30,
						"puttyUnit": "kg",
						"enamel": 105,
						"enamelUnit": "liter"
					}
				}
			}
		}
	},		
		"images": {
			"calculatorHeaderImage": "https://s3-eu-west-1.amazonaws.com/msupplycalculators/Paints/Paint.png",
			"imageURLs": [
				"https://s3-eu-west-1.amazonaws.com/msupplycalculators/Paints/Enamel-Paint.png",
				"https://s3-eu-west-1.amazonaws.com/msupplycalculators/Paints/Enamel-Paint2.png",
				"https://s3-eu-west-1.amazonaws.com/msupplycalculators/Paints/Exterior-Emulsion-paint.png",
				"https://s3-eu-west-1.amazonaws.com/msupplycalculators/Paints/Exterior-cement-paint.png",
				"https://s3-eu-west-1.amazonaws.com/msupplycalculators/Paints/Interior-painting-Distemper.png",
				"https://s3-eu-west-1.amazonaws.com/msupplycalculators/Paints/Interior-painting-Emulsion.png",
				"https://s3-eu-west-1.amazonaws.com/msupplycalculators/Paints/Wall-Primer.png",
				"https://s3-eu-west-1.amazonaws.com/msupplycalculators/Paints/Wall-Putty.png",
			]
		}
};
		callback(false, result);
	}
	else if(productType === 'plastering'){
		
		result = {
	"Plastering": {
		"mm12CeilingPlastering": {
			"activity": "12mm thick Ceiling plaster in CM - 1:4",
			"unitOfWork": "sqm",
			"cement": 0.11,
			"cementUnit": "Bag",
			"sand": 0.65,
			"sandUnit": "cft"
		},
		"mm15InternalPlastering": {
			"activity": "15mm thick Internal wall plaster in CM - 1:6",
			"unitOfWork": "sqm",
			"cement": 0.09,
			"cementUnit": "Bag",
			"sand": 0.8,
			"sandUnit": "cft"
		},
		"mm20ExternalPlastering": {
			"activity": "20mm thick External wall plaster in CM - 1:4",
			"unitOfWork": "sqm",
			"cement": 0.175,
			"cementUnit": "Bag",
			"sand": 1.05,
			"sandUnit": "cft"
		},
		"mm15RoughPlastering": {
			"activity": "15mm thick Rough plaster in CM - 1:6",
			"unitOfWork": "sqm",
			"cement": 0.09,
			"cementUnit": "Bag",
			"sand": 0.8,
			"sandUnit": "cft"
		}
	},
	"images": {
		"calculatorHeaderImage": "https://s3-eu-west-1.amazonaws.com/msupplycalculators/Plastering/Plastering.jpg",
		"imageURLs": [
			"https://s3-eu-west-1.amazonaws.com/msupplycalculators/Plastering/accoplast.png",
			"https://s3-eu-west-1.amazonaws.com/msupplycalculators/Plastering/block_jointing.png",
			"https://s3-eu-west-1.amazonaws.com/msupplycalculators/Plastering/easy_plast.png",
			"https://s3-eu-west-1.amazonaws.com/msupplycalculators/Plastering/mortar_plasticier.png",
			"https://s3-eu-west-1.amazonaws.com/msupplycalculators/Plastering/pre-mix.png",
			"https://s3-eu-west-1.amazonaws.com/msupplycalculators/Plastering/ready_mix.png"
		]
	}
};	

		callback(false, result);
	}else {

		result = "There is no product type available.please try again.";
		callback(false, result);
	}	
};
