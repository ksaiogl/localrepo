var TAG = 'inquiryProject.js'
var dbConfig = require('../../../../Environment/mongoDatabase.js');
var log = require('../../../../Environment/log4js.js');
var moment = require('moment');
	
//Function for adding the New Project Details.
exports.getInquiryProjectPDF = 
function getInquiryProjectPDF (req, companyId, projectId, projectType, companyDetails, callback){
	
	//Variable for Mongo DB Connection. 
	var db = dbConfig.mongoDbConn;
	
	//Variable for Logging the messages to the file.
	var logger = log.logger_rfq;
	
	logger.info(TAG + " Entering getInquiryProjectPDF.");
	
	colBuilder = db.collection('Builder');
	
	colBuilder.findOne({"builderEntity.profileInfo.accountInfo.companyId":companyId}, {"_id":0, "builderEntity.projects":1}, function(err, result){
		if(!err && result !== null){
			
			var projects = result.builderEntity.projects[projectType];
			
			var projectData;
			for(var i=0; i<projects.length; i++){
				if(projects[i].projectId === projectId){
					projectData = projects[i];
				}
			}
			
			var fromDate = "NA";
			var toDate = "NA";
			
			if(projectData !== undefined && projectData.fromDate !== "" && projectData.toDate !== ""){
				var fromDate = moment(projectData.fromDate).format('Do MMM YYYY');
				var toDate = moment(projectData.toDate).format('Do MMM YYYY');
			}	
			
			var amenities = '';
			
			if(projectData.amenities.length >0){
				for(var j=0; j<projectData.amenities.length; j++){
					if(j !== ((projectData.amenities.length)-1)){
						amenities = amenities + '<li style="list-style-type:none;border-radius:6px;float:left;background:#637078;color:#fff;width:auto;padding:5px 7px;margin:0 5px 0 0;">'+ projectData.amenities[j] +'</li>';
					}else{
						amenities = amenities + '<li style="list-style-type:none;border-radius:6px;float:left;background:#637078;color:#fff;width:auto;padding:5px 7px;">'+ projectData.amenities[j] +'</li>';
					}	
				}
			}	
			
			var unitDetails = '';
			
			if(projectType === 'residential'){
				for(var k=0; k<projectData.propertyDetails.length; k++){
				 unitDetails = unitDetails + 
					'<tr align="left">'+
					'	<td style="padding:10px;border-bottom:1px solid #ebebeb;">'+ projectData.propertyDetails[k].unitType +'</td>'+
					'	<td style="padding:10px;border-bottom:1px solid #ebebeb;">'+ projectData.propertyDetails[k].noOfUnits +'</td>'+
					'	<td style="padding:10px;border-bottom:1px solid #ebebeb;">'+ projectData.propertyDetails[k].area +'</td>'+
					'	<td style="padding:10px;border-bottom:1px solid #ebebeb;"><span>&#8377;</span>&nbsp;'+ projectData.propertyDetails[k].pricePerSqft +'</td>'+
					'</tr>';
				}
			}	
			
			var imageURL = "";
			
			if(projectData.projectImagesURL.length>0){
				imageURL = projectData.projectImagesURL[0];
			}
			
			var companyAddress = companyDetails.companyData.street_1 + ", " + companyDetails.companyData.street_2 + ", " + companyDetails.companyData.city + ", " + companyDetails.companyData.state + ", " + companyDetails.companyData.pincode;
			
			var emailBodyText = '<table align="center" width="800" cellspacing="0" cellpadding="0" border="0" style="font-size:medium;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;background:#ffffff;">'+  
		    '<tbody>'+
			'<tr style="float:left;margin:10px 10px 0 20px;text-align:center;width:96%;line-height:35px;border-bottom:1px solid #dcdcdc;color:#58666f;font-size:22px;">'+
			'	<td width="100%" align="left">'+
			'		<strong>'+ projectData.projectName +'</strong>'+
			'	</td>'+
			'</tr>'+
			'<tr>'+
			'	<td>'+
			'	  <table width="800" cellspacing="0" cellpadding="0" border="0" align="left" style="padding-top: 20px;">'+
			'		    <tbody>'+
			'				<tr style="font-size:24px;float:left;margin:0 10px 20px 20px;text-align:center;width:96%;">'+
			'					<td align="left">'+
			'						<img width="400" height="200" alt="mSupply Benefit" src="'+ imageURL +'" style="text-align:left;box-shadow:0 0 6px 1px #c4c5c4;">'+
			'					</td>'+
			'					<td align="left" width="300" valign="top" colspan="4" style="border-bottom:none;padding:0 0 20px 20px;">'+
			'						<p style="float:left;color:#757575;font-size:13px;width:100%;"><b style="color:#adadad;font-size:13px;float:left;">Project Type:</b><br><span style="width:100%;float:left;padding:5px 15px;">'+ projectType +'</span></p>'+
			'						<p style="float:left;color:#757575;font-size:13px;width:100%;"><b style="color:#adadad;font-size:13px;float:left;">Address:</b><br>'+
			'						<span style="float:left;padding:5px 15px;width:100%;">'+ projectData.address.projectAddress.address1 +','+ projectData.address.projectAddress.address2 +',<br/>'+ projectData.address.projectAddress.city +','+ projectData.address.projectAddress.state +'</span></p>'+
			'						<p style="float:left;color:#757575;font-size:13px;width:100%;"><b style="color:#adadad;font-size:13px;float:left;">Pincode:</b><br><span style="width:100%;float:left;padding:5px 15px;">'+ projectData.address.projectAddress.pincode +'</span></p>'+
			'					</td>'+
			'				</tr>'+
			'				<tr style="color:#58666f;font-size:18px;float:left;margin:10px 10px 0 20px;text-align:center;width:96%;line-height:35px;border-bottom:1px solid #dcdcdc;">'+
			'					<td width="100%" align="left">'+
			'						<span>Project Details</span>'+
			'					</td>'+
			'				</tr>'+
			'				<tr width="700" style="margin:10px;float:left;">'+
			'					<td>'+
			'						<table width="100%" cellspacing="0" cellpadding="4" border="0" style="border-collapse:collapse;font-size:12px;color:#444;">'+
			'						   <tbody>'+
			'							   <tr>'+
			'								  <td valign="top" style="padding:10px;width:300px;color:#aaa;">Duration:</td>'+
			'								  <td valign="top" style="padding:10px;width:500px;color:#484848;">From '+ fromDate +' to '+ toDate +'</td>'+
			'							   </tr>'+
			'							   <tr>'+
			'								  <td valign="top" style="padding:10px;width:300px;color:#aaa;">Description:</td>'+
			'								  <td valign="top" style="padding:10px;width:500px;color:#484848;">'+ projectData.description +'</td>'+
			'							   </tr>'+
			'							   <tr>'+
			'								  <td valign="top" style="padding:10px;width:300px;color:#aaa;">Building Orientation:</td>'+
			'								  <td valign="top" style="padding:10px;width:500px;color:#484848;">'+ projectData.buildingOrientation +'</td>'+
			'							   </tr>'+
			'							   <tr>'+
			'								  <td style="padding:10px;width:300px;color:#aaa;">Amenities:</td>'+
			'								  <td valign="top" style="padding:10px;width:500px;">'+
			'								      <ul class="tabs" style="width: 100%;float:left;padding-left:0;">'+ amenities +'</ul>'+
			'								  </td>'+
			'							   </tr>'+
			'							   <tr>'+
			'								  <td valign="top" style="padding:10px;width:300px;color:#aaa;">Website:</td>'+
			'								  <td valign="top" style="padding:10px;width:500px;">'+ projectData.website +'</td>'+
			'							   </tr>'+
			'						   </tbody>'+
			'						</table>'+
			'					</td>'+
			'				</tr>'+
			'				<tr style="color:#58666f;font-size:18px;float:left;margin:10px 10px 12px 20px;text-align:center;width:96%;line-height:35px;border-bottom:1px solid #dcdcdc;">'+
			'					<td width="100%" align="left">'+
			'						<span>Unit Details</span>'+
			'					</td>'+
			'				</tr>'+						
			'				<tr width="700">'+
			'					<td>'+
			'						<table width="600" cellspacing="0" cellpadding="4" border="0" style="font-size: 12px;margin:0 auto;border-collapse:collapse;">'+
			'							<tbody>'+									   
			'							   <tr>'+
			'								  <th style="padding:6px;text-align:left;background:#637078;color:#fff;">Unit Type</th>'+
			'								  <th style="padding:6px;text-align:left;background:#637078;color:#fff;">No. of Units</th>'+
			'								  <th style="padding:6px;text-align:left;background:#637078;color:#fff;">Area(Sqft)</th>'+
			'								  <th style="padding:6px;text-align:left;background:#637078;color:#fff;">Price/Sqft</th>'+
			'							   </tr>'+ unitDetails +'</tbody>'+
			'						</table>'+
			'					</td>'+
			'				</tr>'+
			'				<tr width="700" style="padding:25px 0 7px 20px;float:left;width:95%;">'+
			'					<td style="width:300px;color:#aaa;">'+
			'					    <p>Total Units Sold (in%):<span style="padding:6px;width:500px;color:#484848;">'+ projectData.unitsSold +'%</span></p>'+
			'					</td>'+
			'				</tr>'+
			'				<tr style="color:#58666f;font-size:18px;float:left;margin:10px 10px 0 20px;text-align:center;width:96%;line-height:35px;border-bottom:1px solid #dcdcdc;">'+
			'					<td width="100%" align="left">'+
			'						<span>Builders Details</span>'+
			'					</td>'+
			'				</tr>'+
			'				<tr width="700" style="margin:10px 10px 0 20px;float:left;border-bottom:1px solid #dcdcdc;padding-bottom:15px;">'+
			'					<td>'+
			'						<table width="100%" cellspacing="0" cellpadding="4" border="0" style="border-collapse:collapse;font-size:12px;color:#444;">'+
			'						   <tbody>'+
			'							   <tr>'+
			'								  <td style="padding:10px;width:300px;color:#aaa;">Name:</td>'+
			'								  <td style="padding:10px;width:500px;color:#484848;">'+ companyDetails.companyData.company_name +'</td>'+
			'							   </tr>'+
			'							   <tr>'+
			'								  <td style="padding:10px;width:300px;color:#aaa;">Address:</td>'+
			'								  <td style="padding:10px;width:500px;color:#484848;">'+ companyAddress +'  </td>'+
			'							   </tr>'+
			'							   <tr>'+
			'								  <td style="padding:10px;width:300px;color:#aaa;">Phone:</td>'+
			'								  <td style="padding:10px;width:500px;color:#484848;">'+ req.body.customerSession.mobile_number +'</td>'+
			'							   </tr>'+
			'							   <tr>'+
			'								  <td style="padding:10px;width:300px;color:#aaa;">Email:</td>'+
			'								  <td style="padding:10px;width:500px;">'+ req.body.customerSession.email+'</td>'+
			'							   </tr>'+
			'						   </tbody>'+
			'						</table>'+
			'					</td>'+
			'				</tr>'+
			'		    </tbody>'+
			'		</table>	'+
			'	</td>'+
			'</tr>'+
			'<tr>'+
			'    <td align="right" style="padding: 15px 0px;">'+
			'		<p style="margin:0;float:left;width:100%;color:#637279;font-size:10px;">'+
			'		   <img alt="mail_icon" width="205" height="44" src="http://static.msupply.com/emailTemplate/registration_confirmation/registration_logo.png" style="margin-right:20px">'+	
			'		</p>'+
			'	</td>'+
			'</tr>'+
		'</tbody>'+
	'</table>';
			
			return callback(false, emailBodyText);
			
		}else if(!err && result === null){
			logger.error(TAG + " " + " There is no data for the builder ID while generating the HTML.")
			return callback(true, "Inputs Doesn't match with our records.");
		}else{
			logger.error(TAG + " " + " Inquiry Unexpected Server error while generating the HTML.")
			return callback(true, "Unexpected Server error while generating the HTML Inquiry.");
		}
	})
	
};
