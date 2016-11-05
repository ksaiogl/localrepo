var TAG = "---no_of_inquiries_rised ---    ";
var dbConfig = require('../../Environment/mongoDatabase.js');
var log = require('../../Environment/log4js.js');

exports.showChart = function(req, callback){
	var db = dbConfig.mongoDbConn;
	var logger = log.logger_charts;
	var resJson;

	var inquirycollection = db.collection('InquiryMaster');
  	
if(!( req.params.companyId == null|| req.params.companyId == undefined ))
	{
  	var companyId = parseInt(req.params.companyId);

		inquirycollection.count({ "inquiryEntity.associatedCompanyId": companyId}, function (err, count){
			if (err) {
		        resJson = {
		          "http_code" : "500",
		          "message" : "Inquiry Details cannot be retrieved. Please contact engineering team."
				};
				logger.error(TAG + " Error- Getting inquiry details for the Company ID: " + companyId + ", Error: \n" + err.stack);
				callback(true, resJson);
		    }
			else 
	      	{
		      	if(count>0)
		      	{
				  var query1 = [
				    { $match: { "inquiryEntity.associatedCompanyId" : companyId } },
				    { $group: {
				      _id: { "day": {$dayOfMonth: "$inquiryEntity.inquiryTimestamp" },
				        "month": {$month: "$inquiryEntity.inquiryTimestamp"}, "year": {$year: "$inquiryEntity.inquiryTimestamp"} },
				      numberofinquiries: {$sum: 1}
				    }},
				    { $sort : { "_id.year" : 1, "_id.month" : 1, "_id.day" : 1 }}
				  ];

				  var series1 = [];
				  var years = [];
				  var maxInquiries = 0;
				  inquirycollection.aggregate(query1).toArray(function (err, result1) {
				    if (err){
				      	resJson = {
						    "http_code" : "500",
							"message" : "Internal Server Error..Please retry.."
						};
						logger.error(TAG + "Internal Server Error. err: " + err);
						return callback(true, resJson);
				    } else { 
				      result1.forEach(function (entry) {
				        if (years.indexOf(entry._id.year) == -1)
			          	{
			            	years.push(entry._id.year);
			            }
			            if(entry.numberofinquiries > maxInquiries){
			            	maxInquiries = entry.numberofinquiries;
			            }
				      });
				      series1 = makeResult(years[years.length-1], years[0]);
				      result1.forEach(function (entry) {
				      	for(var i = 0; i < series1.length; i++){
				      		var index = series1[i].indexOf((new Date(entry._id.year, entry._id.month-1, entry._id.day, 5, 30, 0, 0)).getTime());
				      		if(index != -1){
					      		series1[i][1] = entry.numberofinquiries;	
				      		}
				      	}				      
				      });
				    }
			        resJson = {
		            	"http_code" : "200",
		            	"message1" : series1,
		            	"message2" : maxInquiries
  				    };
  				    logger.debug(TAG + " Details of Chart-1 retrieved sucessfully for Company ID: " + companyId );
  				    callback(false,resJson);
				  });
			    } else {
		          resJson = {
		              "http_code": 404,
		              "message": "No results found for Company ID : " + companyId
		          };
		          callback(true,resJson);
		          logger.error(TAG + "No results found for Company ID : " + companyId);
			    }
	      	}
	  	});
	}
	else{
		resJson = {
	          "http_code": 400,
	          "message": "Bad or ill-formed request.."
	    };
	    callback(true,resJson);
	    logger.error(TAG + "Bad or ill-formed request..");
	}
};	

var makeResult = function(maxYear, minYear){
	var series1 = [];
	for(var k = minYear; k <= maxYear; k++) {
		if(k == new Date().getFullYear()) 
		{
			for(var j = 0; j < new Date().getMonth(); j++) {
				if((j+1 ==1)||(j+1 ==3)||(j+1 ==5)||(j+1 ==7)||(j+1 ==8)||(j+1 ==10)||(j+1 ==12))
				{
					for (var i = 0; i < 31; i++) {
					  	series1.push([(new Date(k, j, i+1, 5, 30, 0, 0)).getTime(),0]);
					}
				}
				else if((j+1 ==4)||(j+1 ==6)||(j+1 ==9)||(j+1 ==11))
				{
					for (var i = 0; i < 30; i++) {
					  	series1.push([(new Date(k, j, i+1, 5, 30, 0, 0)).getTime(),0]);
					}
				}
				else if((j+1 ==2)&&((k%4==0)&&(k%100!=0))||(k%400==0))
				{
					for (var i = 0; i < 29; i++) {
					  	series1.push([(new Date(k, j, i+1, 5, 30, 0, 0)).getTime(),0]);
					}
				}
				else
				{
					for (var i = 0; i < 28; i++) {
					  	series1.push([(new Date(k, j, i+1, 5, 30, 0, 0)).getTime(),0]);
					}
				}
			}
			for (var i = 0; i < new Date().getDate(); i++) {
			  	series1.push([(new Date(k, j, i+1, 5, 30, 0, 0)).getTime(),0]);
			}
		} else {
			for(var j = 0; j < 12; j++) {
				if((j+1 ==1)||(j+1 ==3)||(j+1 ==5)||(j+1 ==7)||(j+1 ==8)||(j+1 ==10)||(j+1 ==12))
				{
					for (var i = 0; i < 31; i++) {
					  	series1.push([(new Date(k, j, i+1, 5, 30, 0, 0)).getTime(),0]);
					}
				}
				else if((j+1 ==4)||(j+1 ==6)||(j+1 ==9)||(j+1 ==11))
				{
					for (var i = 0; i < 30; i++) {
					  	series1.push([(new Date(k, j, i+1, 5, 30, 0, 0)).getTime(),0]);
					}
				}
				else if((j+1 ==2)&&((k%4==0)&&(k%100!=0))||(k%400==0))
				{
					for (var i = 0; i < 29; i++) {
					  	series1.push([(new Date(k, j, i+1, 5, 30, 0, 0)).getTime(),0]);
					}
				}
				else
				{
					for (var i = 0; i < 28; i++) {
					  	series1.push([(new Date(k, j, i+1, 5, 30, 0, 0)).getTime(),0]);
					}
				}
			}
		}
	}
	return series1;
};