/**
 * Created by Balkishan on 26-08-2016.
 */
//This file will create the final report for masterQuotation

var TAG = "masterQuotationReport_V2.js - ";
var dbConfig = require('../../Environment/mongoDatabase.js');
var Excel = require('exceljs');
var fs = require('fs');
var log = require('../../Environment/log4js.js');
var timezoneConversions = require('../helpers/timezoneConversions.js');
var async = require('async');

var magento = require('../../routes/magento/magentoAPI.js');
var newQuotationMaster = require('./masterQuotation_V2.js');

exports.getMasterQuotationReport = function (req, res) {
    var logger = log.logger_rfq;

    logger.info(TAG + 'RFQ inquiry report generation started.');

    newQuotationMaster.fetchQuotationMaster(req, function (err, regres) {
        if(!err){
            var result = regres.message;
            delete result.associatedProjectId;

            logger.debug(TAG + " started creating excel report.");

            var pathToCreate = "/usr/NodeJslogs/rfqdocs/newMasterQuotationReport.xlsx";

            createExcel(result, pathToCreate, "New Master Quotations", function (err, result) {
                if (!err) {
                    logger.debug(TAG + " successful created excel report.");

                    res.statusCode = 200;
                    res.download(pathToCreate, function () {
                        logger.info(TAG + 'RFQ Inquiry Report sent.');

                        if(fs.statSync(pathToCreate).isFile()) { // delete file
                            fs.unlinkSync(pathToCreate);
                        }
                    });
                }
                else {
                    logger.error(TAG + " error while creating excel report.");
                }
            });

        }

        else{
            res.statusCode =  regres.http_code;
            res.json(regres);
        }
    });
};

function createExcel(result, pathToCreate, sheetName, callback) {
    var logger = log.logger_rfq;
    logger.debug(TAG + " Starting creation of Excel.");

    var inquiryInfo = {};
    inquiryInfo['Enquiry ID'] = result.inquiryId;
    inquiryInfo['Enquiry Version'] = result.inquiryVersion;
    inquiryInfo['Enquiry Status'] = result.status;
    inquiryInfo['Customer ID'] = result.associatedbuilderId;
    //inquiryInfo['Customer Details'] = result.customerName || "";
    inquiryInfo['Customer First Name'] = result.customerFirstName || "";
    inquiryInfo['Customer Last Name'] = result.customerLastName || "";
    inquiryInfo['Company Name'] = result.companyName || "";

    inquiryInfo['Project Details'] = result.associatedProjectName;
    inquiryInfo['Expected Number of Quotations'] = result.noOfQuotationsDesiredRange;

    inquiryInfo['Customer Payment Terms'] = result.paymentModes+(result.creditDaysNeeded ? (" - "+result.creditDaysNeeded):(""));
    inquiryInfo['Customer Delivery Location'] = [result.shippingAddress.addressLine1,
        result.shippingAddress.addressLine2,
        result.shippingAddress.city,
        result.shippingAddress.state,
        result.shippingAddress.pincode].join(", ");

    inquiryInfo['Customer Expected Delivery Date'] = result.deliveryByDate ? timezoneConversions.toIST(new Date(result.deliveryByDate)).toDateString() : "";

    inquiryInfo['Supplier Respond By Date'] = result.respondByDate ? result.respondByDate.toDateString() : "NA"; // result.respondByDate.toDateString() || "";

    inquiryInfo['Enquiry Validity'] = result.valid_until ? result.valid_until.toDateString() : "";//result.inquiryDeactivationDate.toDateString() || "";

    //inquiryInfo['suppliers Chosen'] = result.suppliersChosen;
    inquiryInfo['Quote From MSupply Suppliers'] = result.quoteFromMSupplySuppliers+"";
    inquiryInfo['Advance Payment'] = result.advancePayment+"";
    inquiryInfo['Advance Payment Amount'] = result.advancePaymentAmount+"";
    inquiryInfo['Target Price For Quotation'] = result.targetPriceForQuotation+"";

    inquiryInfo['Packing And Freight Requirements'] = result.packingAndFreightRequirements+"";
    inquiryInfo['Enquiry City'] = result.inquiryCity+"";

    inquiryInfo['Customer Remarks'] = result.customerRemarks+"";

    var workbook = new Excel.Workbook();
    var sheet = workbook.addWorksheet(sheetName);

    sheet.addRow([""]);
    sheet.addRow(["mSupply.com"]);
    sheet.lastRow.height = 35;
    addFont(sheet,26,'FF808080',true);
    addAlignment(sheet,'middle','center');

    sheet.addRow(["Build. Renovate. Do Interiors"]);
    sheet.lastRow.height = 20;
    addFont(sheet,12,'AA808080',false);
    addAlignment(sheet,'middle','center');

    sheet.getRow(2).getCell(2).value = "Techno Commercial Comparative Statement";
    //sheet.getRow(2).getCell(2).height = 30;
    sheet.getRow(2).getCell(2).font = {
        name: 'Arial',
        family: 4,
        color: { argb: 'FF000000' },
        size: 20,
        underline: false,
        bold: true
    };

    sheet.getRow(2).getCell(2).fill = {
        type: 'none',
        pattern: 'solid',
        fgColor: {argb: 'FF2BAEAB'}
    };

    sheet.mergeCells("B2:E3");

    sheet.addRow([""]);

    Object.keys(inquiryInfo).forEach(function (key) {
        var row = [key, inquiryInfo[key]];
        sheet.addRow(row);
        sheet.lastRow.border = getBorderForColumn();
        addAlignment(sheet,'middle','left');
        //addStyles(sheet,'FF009688');
    });

    var productIdentifiers = result.products;
    var suppliers = result.suppliers;

    var rowStart = Object.keys(inquiryInfo).length+4+8;
    var colStart = 1;

    sheet.getRow(rowStart-4).fill = {
        type: 'none',
        pattern: 'solid',
        fgColor: {argb: 'FF29B6F6'}
    };

    sheet.getRow(rowStart-4).fill = {
        type: 'none',
        pattern: 'solid',
        fgColor: {argb: 'FF4FC3F7'}
    };

    sheet.getRow(rowStart-3).fill = {
        type: 'none',
        pattern: 'solid',
        fgColor: {argb: 'FF81D4FA'}
    };

    sheet.getRow(rowStart-2).fill = {
        type: 'none',
        pattern: 'solid',
        fgColor: {argb: 'FFB3E5FC'}
    };

    var productsDetailsArray = [];

    for(var i = 0;i<productIdentifiers.length;i++){

        var material = productIdentifiers[i].productIdentifier;
        var subCategory = productIdentifiers[i].details.subCategory;
        var units = productIdentifiers[i].details.quantityUnit;
        var quantity = productIdentifiers[i].details.quantity;

        var productSpecs = productIdentifiers[i].details.productSpecs;
        var specValues = [];
        for(var k = 0;k<productSpecs.length;k++){
            specValues[k] = productSpecs[k].value;
        }
        productsDetailsArray.push([i+1,material,subCategory,units,quantity,specValues.join(', ')]);
    }

    sheet.getRow(rowStart-5).getCell(1).value = "Quotation Details";
    sheet.getRow(rowStart-4).getCell(productsDetailsArray[0].length).value = "Associated Suppliers";
    sheet.getRow(rowStart-3).getCell(productsDetailsArray[0].length).value = "Payment Terms";
    //sheet.getRow(rowStart-3).getCell(productsDetailsArray[0].length).value = "Brands";
    renderSheet(rowStart-1,colStart,[["S-No","Material","Sub-Category","Units","Quantity","Grade/Spec"]],sheet);

    sheet.getRow(rowStart+productIdentifiers.length+1).getCell(productsDetailsArray[0].length).value = "Total Amount";
    sheet.getRow(rowStart+productIdentifiers.length+2).getCell(productsDetailsArray[0].length).value = "Total VAT Charges";
    sheet.getRow(rowStart+productIdentifiers.length+3).getCell(productsDetailsArray[0].length).value = "GRAND Total";

    var outNum = 4;
    sheet.getRow(rowStart+productIdentifiers.length+outNum).getCell(productsDetailsArray[0].length).value = "Transportation Charges";
    outNum+=1;
    sheet.getRow(rowStart+productIdentifiers.length+outNum).getCell(productsDetailsArray[0].length).value = "Delivery Time";
    outNum+=1;
    sheet.getRow(rowStart+productIdentifiers.length+outNum).getCell(productsDetailsArray[0].length).value = "Tax Levied as per CST ?";
    outNum+=1;
    sheet.getRow(rowStart+productIdentifiers.length+outNum).getCell(productsDetailsArray[0].length).value = "Quote Valid Upto";
    outNum+=1;
    sheet.getRow(rowStart+productIdentifiers.length+outNum).getCell(productsDetailsArray[0].length).value = "Supplier Remarks";
    outNum+=1;
    sheet.getRow(rowStart+productIdentifiers.length+outNum).getCell(productsDetailsArray[0].length).value = "Quotation Status";
    outNum+=1;

    renderSheet(rowStart,colStart,productsDetailsArray,sheet);
    colStart+=productsDetailsArray[0].length;

    var mapStatus = {
        "New":"New",
        "EnquirySent":"New",
        "IntentToQuote":"Pending To Quote",
        "QuoteSubmitted":"Quoted",
        "QuoteAmended":"Quoted",
        "NotIntentToQuote":"Rejected",
        "Expired":"Enquiry Expired",
        "EditInProgress":"Edit In Progress",
        "PendingApproval":"Pending Approval"
    };

    var brandIdx = 0;
    var supplierArray = [];

    for(var j = 0;j<suppliers.length;j++){
        var curSeller = suppliers[j];
        sheet.getRow(rowStart-4).getCell(colStart).value = curSeller.inquirySellerEntity.sellers.companyName+" ("+ curSeller.sellerId+")";

        if(curSeller.payments.length===0){
            colStart+=1;
        }

        var paymentArray = [];
        for(var k = 0;k<curSeller.payments.length;k++){

            var curPayment = curSeller.payments[k];
            sheet.getRow(rowStart-3).getCell(colStart).value = curPayment.paymentTerms;

            var brandArray = [];
            for(var l = 0;l<curPayment.brand.length;l++){
                brandIdx++;
                var curBrand = curPayment.brand[l];
                //sheet.getRow(rowStart-3).getCell(colStart).value = curBrand.brandName;
                renderSheet(rowStart-1,colStart,[["Brand","Rate","Amount","VAT"]],sheet);

                var identifierArray = [];
                var total = 0;
                var totalVat = 0;
                var grandTotal = 0;

                for(var m = 0;m<curBrand.identifiers.length;m++){

                    if(curBrand.identifiers[m].Quotations[0] !== undefined){
                        var amt = curBrand.identifiers[m].Quotations[0].quantity * curBrand.identifiers[m].Quotations[0].quotedPrice || 0;
                        var VATAmt = curBrand.identifiers[m].Quotations[0].VATAmt || 0;
                        total += amt;
                        totalVat += VATAmt;
                        quotationRow(curBrand.identifiers[m].Quotations[0],curBrand.brandName,identifierArray);
                    }
                    else
                        quotationRow({},curBrand.brandName,identifierArray)
                }
                renderSheet(rowStart,colStart,identifierArray,sheet);
                colStart += identifierArray[0].length;
                grandTotal = total+VATAmt;
                sheet.getRow(rowStart+productIdentifiers.length+1).getCell(colStart-1).value = total || 0;
                sheet.getRow(rowStart+productIdentifiers.length+2).getCell(colStart-1).value = totalVat || 0;
                sheet.getRow(rowStart+productIdentifiers.length+3).getCell(colStart-1).value = grandTotal || 0;

                brandArray.push(identifierArray);
            }
            paymentArray.push(brandArray);
        }
        supplierArray.push(paymentArray);

        var num = 4;
        sheet.getRow(rowStart+productIdentifiers.length+num).getCell(colStart-1).value = curSeller.inquirySellerEntity.sellers.deliveryCharges || "NA";
        num+=1;
        sheet.getRow(rowStart+productIdentifiers.length+num).getCell(colStart-1).value = curSeller.inquirySellerEntity.sellers.deliveryTime || "NA";
        num+=1;
        sheet.getRow(rowStart+productIdentifiers.length+num).getCell(colStart-1).value = curSeller.inquirySellerEntity.sellers.CSTCharges || "NA";
        num+=1;
        sheet.getRow(rowStart+productIdentifiers.length+num).getCell(colStart-1).value = curSeller.inquirySellerEntity.sellers.quoteValidUpTo || "NA";
        num+=1;
        sheet.getRow(rowStart+productIdentifiers.length+num).getCell(colStart-1).value = curSeller.inquirySellerEntity.sellers.sellerRemarks || "NA";
        num+=1;
        sheet.getRow(rowStart+productIdentifiers.length+num).getCell(colStart-1).value = mapStatus[curSeller.inquirySellerEntity.sellers.status] || "NA";
        num+=1;
    }

    var sheetColumns = [];
    for(var i = 0;i<productsDetailsArray[0].length;i++){
        sheetColumns.push({header: "", key: "key", width: 35})
    }
    for(var i = 0;i<colStart-productsDetailsArray[0].length;i++){
        sheetColumns.push({header: "", key: "value", width: 25, outlineLevel: 1});
    }

    for(i = 0;i<rowStart+productIdentifiers.length+outNum;i++){
        sheet.getRow(i+1).border = getBorderForColumn();
        if(i<4)
            sheet.getRow(i+1).alignment = { vertical: "middle", horizontal: "center" };
        else if(i<Object.keys(inquiryInfo).length+6)
            sheet.getRow(i+1).alignment = { vertical: "middle", horizontal: "left" };
        else
            sheet.getRow(i+1).alignment = { vertical: "middle", horizontal: "right" };
    }

    sheet.columns = sheetColumns;



    workbook.xlsx.writeFile(pathToCreate)
        .then(function (err) {
            if (!err) {
                callback(false, pathToCreate);
            } else {
                callback(true, "Creating and Writing to excel file failed");
            }
        });
}

function renderSheet(rowStart,colStart,identifierArray,sheet){
    for(var i = rowStart;i<identifierArray.length+rowStart;i++){
        for(var j = colStart;j<identifierArray[i-rowStart].length+colStart;j++){
            sheet.getRow(i).getCell(j).value = identifierArray[i-rowStart][j-colStart];
        }
    }
}

function quotationRow(quote,brand,quoteRow){
    if(Object.keys(quote).length !== 0){
        var rate = quote.quotedPrice;
        var amount = quote.quotedPrice * quote.quantity;
        var VATAmt = quote.VATAmt;
        quoteRow.push([brand,rate,amount,VATAmt]);
    }
    else{
        quoteRow.push(["NA",0,0,0]);
    }
}

function addFont(sheet, size, color,bold){
    sheet.lastRow.font = {
        name: 'Arial',
        family: 4,
        color: { argb: color },
        size: size,
        underline: false,
        bold: bold
    };
}

function addAlignment(sheet, verAlign,horiAlign){
    sheet.lastRow.alignment = { vertical: verAlign, horizontal: horiAlign };
}

function addStyles(sheet,color){
    sheet.lastRow.fill = {
        type: 'none',
        pattern: 'solid',
        fgColor: {argb: color}
    };
    sheet.lastRow.border = {
        top: {style: 'thin'},
        left: {style: 'thin'},
        bottom: {style: 'thin'},
        right: {style: 'thin'}
    };
}

function getBorderForColumn() {
    return {
        top: {style: 'thin'},
        left: {style: 'thin'},
        bottom: {style: 'thin'},
        right: {style: 'thin'}
    };
}
function getStyleForColumn(curCol) {
    if (curCol % 2 == 0) {
        return {
            type: 'none',
            pattern: 'solid',
            fgColor: {argb: 'FFBDBDBD'}
        };
    }
    return {
        type: 'none',
        pattern: 'solid',
        fgColor: {argb: 'FF757575'}
    };
}

function createSupplierLevelRow(sup, supKey, array,pbLength, title) {
    var blockNum = 0;
    var rowValues = [];
    rowValues.push("","", "", "","",title);
    for (var j = 0; j < supKey.length; j++) {
        for (var l = 0; l < pbLength*sup[supKey[j]]-1; l++) {
            rowValues.push("");
            blockNum++;
        }
        rowValues.push(array[j]+"");
    }
    return rowValues;
}

function createRow(sup, supKey, array,pbLength, title) {
    var blockNum = 0;
    var rowValues = [];
    rowValues.push("","", "", "","",title);
    for (var j = 0; j < supKey.length; j++) {

        if (sup[supKey[j]] == 0) {
            rowValues.push(array[blockNum]);
            blockNum++;
            continue;
        }

        for (var l = 0; l < sup[supKey[j]]; l++) {
            for(var k = 0;k<pbLength-1;k++){
                rowValues.push("");
            }
            rowValues.push(array[blockNum]);
            blockNum++;
        }
    }
    return rowValues;
}

function supplierLevelBlock(blockArray,j,value){
    if(blockArray[j] === undefined){
        blockArray[j] = value;
    }
    else{
        if(blockArray[j].toString() === "")
            blockArray[j] += value;
    }
}
