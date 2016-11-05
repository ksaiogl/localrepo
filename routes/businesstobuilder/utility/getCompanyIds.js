//Function to get Company Ids from session
exports.getCompanyIds = function getCompanyIds(customerSession){
	var companyIds=[];
	var companyData = customerSession.company_ids;
	if(companyData !== null && companyData.length > 0){
		for(var i=0; i<companyData.length; i++){
			if(companyData[i].status === "approved"){
				companyIds.push(parseInt(companyData[i].company_id));
			}
		}
	}
	return companyIds;
}