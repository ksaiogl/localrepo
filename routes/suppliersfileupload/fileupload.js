var TAG = "---Suppliers File Upload ---    ";
var log = require('../../Environment/log4js.js');
var fs = require('fs');
var path = require('path');
var xlsxj = require("xlsx-to-json");
var equals = require('array-equal');
var async = require("async");
var citieslist = require('./citieslist.js');
var supplierModule = require('../businesstobuilder/buildersuppliers.js');

exports.upload = function(req, callback){

	//Variable for Logging the messages to the file.
	var logger = log.logger_suppliersfileupload;

	//Declare the response.
	var resJson;

	var request = req;

	//getting form details.
	var multiparty = require('multiparty');
    var form = new multiparty.Form();

    //header of upload template excel file.
    var header = ['Walls_And_Flooring',
  'CustomerCompanyName','SupplierName',
  'PhoneNumber',
  'EmailId',
  'State',
  'City',
  'Pincode',
  'Amenities',
  'Bathroom',
  'Building_Management',
  'Building_Material',
  'Carpentry',
  'Construction_Equipment',
  'Electrical',
  'Escalators_And_Elevators',
  'Glass_And_Facade',
  'Hardware',
  'Kitchen',
  'Landscaping_Products',
  'Paints',
  'Plumbing',
  'Roofing',
  'Safety_Products',
  'Tools_And_Spares' ];
    
    form.parse(req, function (err, fields, files) {
        if (err) {
	        resJson = {
	            "http_code": 500,
	            "message": "Unable to retrieve Form Data."
	        };
	        logger.error(TAG + "Unable to retrieve Form Data. ERROR : \n" + err.stack);
	        callback(true,resJson);
	    } else {
	    	//Validate the request.
	    	if(fields.companyId == '' || files.fileName == undefined){
	        	resJson = {
		            "http_code": 500,
		            "message": "Either companyId or file is missing"
		        };
		        callback(true,resJson);
	        } else 
	        {
	        	//retrieving data from form.
		        var companyId = fields.companyId;
		        var uploadedFile = files.fileName[0];

		        fs.readFile(uploadedFile.path, function (err, data) {
		        	if (err) {
				        resJson = {
				            "http_code": 500,
				            "message": "Unable to read Uploaded Excel file."
				        };
				        logger.error(TAG + "Unable to read Uploaded Excel file. ERROR : \n" + err.stack);
				        callback(true,resJson);
				    } else
				    {    
			            //file details
			            var fileSize = uploadedFile.size/(1000000);
			            var extName = path.extname(uploadedFile.originalFilename);
			            var uploadedFileName = path.basename(uploadedFile.originalFilename, extName);
			                
			            //file validations, checking size limit: 2MB, checking extensions: xls, xlsx.
			            if(fileSize < 2 && extName == ".xlsx")
			            {
				            var exceltojson;
				            if (extName == ".xlsx"){
				                //converting xls, xlsx to json
				                xlsxj({
				                    input: uploadedFile.path,
				                    output: null,
				                    sheet: "Details"
				                },  function (err, result) {
			                        if (err) {
			                            resJson = {
								            "http_code": 500,
								            "message": "Error - Excel file conversion to Json failed. Please contact engineering team."
								        };
								        logger.error(TAG + "Error - Excel file conversion to Json failed. ERROR : \n" + err.stack);
								        callback(true,resJson);
			                        } else {

			                        	console.log("result")
			                        	console.log(result)
			                        	console.log("Object.keys(result[0])")
			                        	console.log(Object.keys(result[0]))

			                            //validating uploaded file is of same template or not
			                            if(result.length == 0){
			                            	resJson = {
								              "http_code": 400,
								              "message": "Uploaded excel file contains no Data!! for companyId: " + companyId
								          	};
								          	logger.error(TAG + "Uploaded excel file contains no Data!! for companyId: " + companyId);
								          	callback(true,resJson);
			                            }
			                            //validating uploaded file is of same template or not
			                            else if(!equals(Object.keys(result[0]),header)){
			                                resJson = {
								              "http_code": 400,
								              "message": "Please Upload excel file of given template only!! for companyId: " + companyId
								          	};
								          	logger.error(TAG + "Please Upload excel file of given template only!! for companyId: " + companyId);
								          	callback(true,resJson);
			                            } else if(validateJson(result,companyId) == 0) {
			                            	//deleting excel file
			                            	fs.unlinkSync(uploadedFile.path);

			                            	//making the contents of log file empty
							    			fs.writeFileSync('/usr/NodeJslogs/log_'+companyId+'.txt', '');	

		    								var rowcount = 2;
		    								var errorCount = 0;
		    								var addedCount = 0;
		    								var httpCode = [];

		    								async.forEachSeries(result, function(key, callback){

									        	var categories = [];
									        	if(key.Bathroom != "")
									        	{
									        		var subcategories = (key.Bathroom.split(', '));
									        		categories.push({
										        		"mainCategory": "Bathroom",
										        		"subCategories": subcategories
										        	});
									        	} 
									        	if(key.Building_Material != "")
									        	{
									        		var subcategories = (key.Building_Material.split(', '));
									        		categories.push({
										        		"mainCategory": "BuildingMaterial",
										        		"subCategories": subcategories
										        	});
									        	}
									        	if(key.Carpentry != "")
									        	{
									        		var subcategories = (key.Carpentry.split(', '));
									        		categories.push({
										        		"mainCategory": "Carpentry",
										        		"subCategories": subcategories
										        	});
									        	}
									        	if(key.Construction_Equipment != "")
									        	{
									        		var subcategories = (key.Construction_Equipment.split(', '));
									        		categories.push({
										        		"mainCategory": "ConstructionEquipment",
										        		"subCategories": subcategories
										        	});
									        	}
									        	if(key.Electrical != "")
									        	{
									        		var subcategories = (key.Electrical.split(', '));
									        		categories.push({
										        		"mainCategory": "Electrical",
										        		"subCategories": subcategories
										        	});
									        	}
									        	if(key.Hardware != "")
									        	{
									        		var subcategories = (key.Hardware.split(', '));
									        		categories.push({
										        		"mainCategory": "Hardware",
										        		"subCategories": subcategories
										        	});
									        	} 
									        	if(key.Kitchen != "")
									        	{
									        		var subcategories = (key.Kitchen.split(', '));
									        		categories.push({
										        		"mainCategory": "Kitchen",
										        		"subCategories": subcategories
										        	});
									        	}
									        	if(key.Paints != "")
									        	{
									        		var subcategories = (key.Paints.split(', '));
									        		categories.push({
										        		"mainCategory": "Paints",
										        		"subCategories": subcategories
										        	});
									        	}
									        	if(key.Plumbing != "")
									        	{
									        		var subcategories = (key.Plumbing.split(', '));
									        		categories.push({
										        		"mainCategory": "Plumbing",
										        		"subCategories": subcategories
										        	});
									        	}
									        	if(key.Roofing != "")
									        	{
									        		var subcategories = (key.Roofing.split(', '));
									        		categories.push({
										        		"mainCategory": "Roofing",
										        		"subCategories": subcategories
										        	});
									        	}
									        	if(key.Tools_And_Spares != "")
									        	{
									        		var subcategories = (key.Tools_And_Spares.split(', '));
									        		categories.push({
										        		"mainCategory": "ToolsAndSpares",
										        		"subCategories": subcategories
										        	});
									        	}
									        	if(key.Walls_And_Flooring != "")
									        	{
									        		var subcategories = (key.Walls_And_Flooring.split(', '));
									        		categories.push({
										        		"mainCategory": "WallsAndFlooring",
										        		"subCategories": subcategories
										        	});
									        	}
									        	if(key.Amenities != "")
									        	{
									        		var subcategories = (key.Amenities.split(', '));
									        		categories.push({
										        		"mainCategory": "Amenities",
										        		"subCategories": subcategories
										        	});
									        	}
									        	if(key.Building_Management != "")
									        	{
									        		var subcategories = (key.Building_Management.split(', '));
									        		categories.push({
										        		"mainCategory": "BuildingManagement",
										        		"subCategories": subcategories
										        	});
									        	}
									        	if(key.Escalators_And_Elevators != "")
									        	{
									        		var subcategories = (key.Escalators_And_Elevators.split(', '));
									        		categories.push({
										        		"mainCategory": "EscalatorsAndElevators",
										        		"subCategories": subcategories
										        	});
									        	}
									        	if(key.Glass_And_Facade != "")
									        	{
									        		var subcategories = (key.Glass_And_Facade.split(', '));
									        		categories.push({
										        		"mainCategory": "GlassAndFacade",
										        		"subCategories": subcategories
										        	});
									        	}
									        	if(key.Landscaping_Products != "")
									        	{
									        		var subcategories = (key.Landscaping_Products.split(', '));
									        		categories.push({
										        		"mainCategory": "LandscapingProducts",
										        		"subCategories": subcategories
										        	});
									        	}
									        	if(key.Safety_Products != "")
									        	{
									        		var subcategories = (key.Safety_Products.split(', '));
									        		categories.push({
										        		"mainCategory": "SafetyProducts",
										        		"subCategories": subcategories
										        	});
									        	}
									        	//calling addsupplier function
								        		addSupplierdetails
								        		(
								        			parseInt(companyId),
													key.PhoneNumber,
													key.EmailId.toLowerCase(),
													key.CustomerCompanyName,
													key.SupplierName,
													key.City.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1);}),
													key.State.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1);}),
													key.Pincode,
													categories,
													rowcount,
													request,
													function(err, result){
														if(err){
							                            	fs.appendFileSync('/usr/NodeJslogs/log_'+companyId+'.txt',
		                										"Row"+result.rowcount+"\thttp_code: "+result.http_code+"\tmessage: "+result.message+"\r\n");
							                            	errorCount++;
							                            	httpCode.push(result.http_code);
							                            	callback(false);
														} else {
															fs.appendFileSync('/usr/NodeJslogs/log_'+companyId+'.txt',
		                										"Row"+result.rowcount+"\thttp_code: "+result.http_code+"\tmessage: "+result.message+"\r\n");
															addedCount++;
							                            	httpCode.push(result.http_code);
															callback(false);
														}	
													}
								        		);
									        rowcount++;
											},
							 		 		//Final Function to be called upon completion of all functions.
							 				function(error)
							 				{
							 					var http_code;
							 					var message;
								 				if(!error){
								 					if(httpCode.indexOf(400) >= 0){
								 						http_code = 400;
								 						message = "Few Suppliers should contain Sub categories for companyId: " + companyId
								 						if(addedCount > 0) {
								 							message += " and " + addedCount + " Suppliers added Successfully for companyId: " + companyId 
								 						}
								 					}
								 					else if(errorCount > 0 && addedCount == 0) {
								 						http_code = 500;
								 						message = "Either all Suppliers have already been added for companyId: " + companyId + " or companyId: " + companyId + " doesn't Exist."
								 					} else if(addedCount > 0) {
								 						http_code = 200;
								 						message = addedCount + " Suppliers added Successfully for companyId: " + companyId
								 					}
							 			 			resJson = {
			                            	  		  "http_code": http_code,
							 			 			  "message": message,
										              "id": companyId,
									              	  "attachment": 1
										          	};	
							 			 			return callback(false,resJson);
								 			 	}	
							 				});	    
			                            } else {
			                            	resJson = {	
			                            	  "http_code": 400,
				              				  "message": "Uploaded Excel file contains errors for companyId: " + companyId,	
								              "id": companyId,
							              	  "attachment": 1
								          	};	
								          	logger.error(TAG + "Uploaded Excel file contains errors for companyId: " + companyId);
					 			 			return callback(true,resJson);
			                            } 
			                        }
				                });
				            }
			            } else if (!(extName == ".xlsx")){
			            	resJson = {
				              "http_code": 400,
				              "message": "Please Upload excel file of type .xlsx only!! for companyId: " + companyId
				          	};
				          	logger.error(TAG + "Please Upload excel file of type .xlsx only!! for companyId: " + companyId);
				          	callback(true,resJson);
			            } else if (!(fileSize < 2)){
			            	resJson = {
				              "http_code": 400,
				              "message": "File size exceeded 2MB!! for companyId: " + companyId
				          	};
				          	logger.error(TAG + "File size exceeded 2MB!! for companyId: " + companyId);
				          	callback(true,resJson);
			            }
			        }    	
		        });
			}
		}	
    });
};	

function newindexOf(arr, key, val) {
	for (var i = 0; i < arr.length; i++) {
	  if (arr[i][key] == val) {
	    return i;
	  }
	}
	return -1;
}

//function to validate json data
var validateJson = function (result, id) {

    //making the contents of log file empty
    fs.writeFileSync('/usr/NodeJslogs/log_'+id+'.txt', '');
    
    var count = 2;
    var errorCount = 0;
    for (var key in result)
    {
        if (result.hasOwnProperty(key))
        {
            //CustomerCompanyName
            if(result[key].CustomerCompanyName == ""){
                fs.appendFileSync('/usr/NodeJslogs/log_'+id+'.txt',
                    "Row"+count+"\tProblem found in: CustomerCompanyName"+"\tDescription: CustomerCompanyName is Mandatory\r\n");
                errorCount+=1;
            } else if(!(/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?\s]*$/i.test(result[key].CustomerCompanyName))){
                fs.appendFileSync('/usr/NodeJslogs/log_'+id+'.txt',
                    "Row"+count+"\tProblem found in: CustomerCompanyName"+"\tDescription: CustomerCompanyName is invalid\r\n");
                errorCount+=1;
            } else if(result[key].CustomerCompanyName.length > 100) {
                fs.appendFileSync('/usr/NodeJslogs/log_'+id+'.txt',
                    "Row"+count+"\tProblem found in: CustomerCompanyName"+"\tDescription: CustomerCompanyName cannot be more than 100 characters\r\n");
                errorCount+=1;
            }

            //SupplierName
            if(result[key].SupplierName == ""){
                fs.appendFileSync('/usr/NodeJslogs/log_'+id+'.txt',
                    "Row"+count+"\tProblem found in: SupplierName"+"\tDescription: SupplierName is Mandatory\r\n");
                errorCount+=1;
            } else if(!(/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?\s]*$/i.test(result[key].SupplierName))){
                fs.appendFileSync('/usr/NodeJslogs/log_'+id+'.txt',
                    "Row"+count+"\tProblem found in: SupplierName"+"\tDescription: SupplierName is invalid\r\n");
                errorCount+=1;
            } else if(result[key].SupplierName.length > 100) {
                fs.appendFileSync('/usr/NodeJslogs/log_'+id+'.txt',
                    "Row"+count+"\tProblem found in: SupplierName"+"\tDescription: SupplierName cannot be more than 100 characters\r\n");
                errorCount+=1;
            }

            //Phone Number
            if(result[key].PhoneNumber == ""){
                fs.appendFileSync('/usr/NodeJslogs/log_'+id+'.txt',
                    "Row"+count+"\tProblem found in: Mobile"+"\tDescription: Phone Number is Mandatory\r\n");
                errorCount+=1;
            }
            else if(!(/^\d{10}$/.test(result[key].PhoneNumber))){
                fs.appendFileSync('/usr/NodeJslogs/log_'+id+'.txt',
                    "Row"+count+"\tProblem found in: Mobile"+"\tDescription: Phone Number is not valid\r\n");
                errorCount+=1;
            }


            //EmailId
            if(result[key].EmailId == ""){
                fs.appendFileSync('/usr/NodeJslogs/log_'+id+'.txt',
                    "Row"+count+"\tProblem found in: EmailId"+"\tDescription: EmailId is Mandatory\r\n");
                errorCount+=1;
            }
            else if(!(/^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i.test(result[key].EmailId))){
                fs.appendFileSync('/usr/NodeJslogs/log_'+id+'.txt',
                    "Row"+count+"\tProblem found in: EmailId"+"\tDescription: EmailId is not valid\r\n");
                errorCount+=1;
            }

            var state = result[key].State.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1);});
            var city = result[key].City.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1);});
            var stateindex = newindexOf(citieslist.citiesList,'state',state);
            if(stateindex != -1){
            	var cityindex = citieslist.citiesList[stateindex].cities.indexOf(city);
            } else {
            	var cityindex = null;
            }
            	
            //State
            if(result[key].State == ""){
                fs.appendFileSync('/usr/NodeJslogs/log_'+id+'.txt',
                    "Row"+count+"\tProblem found in: State"+"\tDescription: State is Mandatory\r\n");
                errorCount+=1;
            } else if(stateindex == -1){
            	fs.appendFileSync('/usr/NodeJslogs/log_'+id+'.txt',
                    "Row"+count+"\tProblem found in: State"+"\tDescription: State is invalid\r\n");
                errorCount+=1;
            }

            //City
            if(result[key].City == ""){
                fs.appendFileSync('/usr/NodeJslogs/log_'+id+'.txt',
                    "Row"+count+"\tProblem found in: City"+"\tDescription: City is Mandatory\r\n");
                errorCount+=1;
            } else if(cityindex == -1){
            	fs.appendFileSync('/usr/NodeJslogs/log_'+id+'.txt',
                    "Row"+count+"\tProblem found in: City"+"\tDescription: City is not in State selected\r\n");
                errorCount+=1;
            }

            //Pincode
            if(result[key].Pincode == ""){
                fs.appendFileSync('/usr/NodeJslogs/log_'+id+'.txt',
                    "Row"+count+"\tProblem found in: Pincode"+"\tDescription: Pincode is Mandatory\r\n");
                errorCount+=1;
            }
            else if(!(/^\d{6}$/.test(result[key].Pincode))) {
                fs.appendFileSync('/usr/NodeJslogs/log_'+id+'.txt',
                    "Row"+count+"\tProblem found in: Pincode"+"\tDescription: Pincode is not valid\r\n");
                errorCount+=1;
           	}
            count += 1;
        }
    }
    return errorCount;
};

//function to add supplier to a builder
function addSupplierdetails(companyId,mobile,email,companyName,SupplierName,city,state,pincode,categories,rowcount,request,callback){

    var logger = log.logger_suppliersfileupload;
    var resJson;
    var Header = function(name){
    		return request.header('x-forwarded-for');
    };
    var req = {
    	"header": Header,
    	"connection": request.connection,
	    "body": {
	          	"companyId": companyId,
		        "mobile": mobile,
		        "email": email,
		        "sellerName": SupplierName,
		        "companyName":companyName,
		        "city": city,
		        "state": state,
		        "pincode": pincode,
		        "categories": categories
			}
    };
    supplierModule.addSupplier(req, function(error, response){
	    if(error) {
	    	resJson = {
              	"http_code": parseInt(response.http_code),
              	"message": response.message,
              	"rowcount": rowcount
          	};
	        logger.error(TAG + " Adding supplier details failed. error: " + JSON.stringify(response));
            return callback(true, resJson);
	    }
	    else {
 	    	if(response.http_code === '200')
            {
            	resJson = {
	              	"http_code": parseInt(response.http_code),
	              	"message": response.message,
	              	"rowcount": rowcount
	          	};
            	logger.debug(TAG + " Adding supplier details Succesful.");
		    	return callback(false, resJson);
            }
            else{
            	resJson = {
	              	"http_code": parseInt(response.http_code),
	              	"message": response.message,
	              	"rowcount": rowcount
	          	};
            	logger.error(TAG + " Adding supplier details failed. result: " + JSON.stringify(response));
            	return callback(true, resJson);
            }
		}
	});
};