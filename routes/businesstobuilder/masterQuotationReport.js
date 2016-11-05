/**
 * Created by Balkishan on 26-08-2016.
 */
//This file will create the final report for masterQuotation

var TAG = " Master Quotation Report - ";
var dbConfig = require('../../Environment/mongoDatabase.js');
var Excel = require('exceljs');
var fs = require('fs');
var log = require('../../Environment/log4js.js');
var timezoneConversions = require('../helpers/timezoneConversions.js');
var async = require('async');

var magento = require('../../routes/magento/magentoAPI.js');

var quotationMaster = require('./quotationMaster.js');


exports.getMasterQuotationReport = function (req, res) {
    var logger = log.logger_rfq;

    logger.info(TAG + 'RFQ inquiry report generation started.');

    quotationMaster.fetchQuotationMaster(req, function (err, regres) {
        //res.statusCode =  regres.http_code;
        //res.json(regres);

        if(!err){
            var result = regres.message;
            delete result.associatedProjectId;

            logger.debug(TAG + " started creating excel report.");

            var pathToCreate = "/usr/NodeJslogs/rfqdocs/masterQuotationReport.xlsx";

            createExcel(result, pathToCreate, "Master Quotations", function (err, result) {
                if (!err) {
                    logger.debug(TAG + " successfull created excel report.");

                    res.statusCode = 200;
                    res.download(pathToCreate, function () {
                        logger.info(TAG + 'RFQ Inquiry Report sent.');

                        if(fs.statSync(pathToCreate).isFile()) { // delete file
                            //fs.unlinkSync(pathToCreate);
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

    //console.log("dd",result.deliveryByDate);
    //console.log("dd Tc",timezoneConversions.toIST(new Date(result.deliveryByDate)));
    inquiryInfo['Customer Expected Delivery Date'] = result.deliveryByDate ? timezoneConversions.toIST(new Date(result.deliveryByDate)).toDateString() : "";
    //inquiryInfo['Customer Expected Delivery Date'] = inquiryInfo['Customer Expected Delivery Date'].substring(0, inquiryInfo['Customer Expected Delivery Date'].indexOf('at'));

    //console.log("rd",result.respondByDate);
    inquiryInfo['Supplier Respond By Date'] = result.respondByDate ? result.respondByDate.toDateString() : "NA"; // result.respondByDate.toDateString() || "";
    //inquiryInfo['Supplier Respond By Date'] = inquiryInfo['Supplier Respond By Date'].substring(0, inquiryInfo['Supplier Respond By Date'].indexOf('at'));

    //console.log("id",result.valid_until);
    inquiryInfo['Enquiry Validity'] = result.valid_until ? result.valid_until.toDateString() : "";//result.inquiryDeactivationDate.toDateString() || "";
    //inquiryInfo['Enquiry Validity'] = inquiryInfo['Enquiry Validity'].substring(0, inquiryInfo['Enquiry Validity'].indexOf('at'));

    //console.log(inquiryInfo);

    var logger = log.logger_rfq;

    logger.debug(TAG + " Starting creation of Excel.");

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

    var items = result.items;
    var suppliers = result.associatedSuppliers;
    var products = result.associatedProducts;

    var sup = {};

    var supKey = Object.keys(suppliers);

    for (var j = 0; j < supKey.length; j++) {
        for (var i = 0; i < products.length; i++) {
            var quote;
            if (items[products[i]]['sellers'].hasOwnProperty(supKey[j]))
                quote = items[products[i]]['sellers'][supKey[j]]['quotations'];
            else {
                quote = [];
            }

            if (sup[supKey[j]] === undefined)
                sup[supKey[j]] = quote.length;
            else {
                if (sup[supKey[j]] < quote.length) {
                    sup[supKey[j]] = quote.length;
                }
            }
        }
    }

    sheet.addRow([""]);
    sheet.addRow(["Quotation Details"]);
    sheet.getColumn(1).border = getBorderForColumn();

    //addAlignment(sheet,'middle','center');

    var productBrands = ["Brand","Rate","Amount","VAT %"];
    var productBrandLength = productBrands.length;

    var supRow = ["","","","","",""];
    for (var i = 0; i < supKey.length; i++) {
        supRow.push(suppliers[supKey[i]].companyName+" ("+supKey[i]+")");
        for (var j = 0; j < productBrandLength * sup[supKey[i]] - 1; j++) {
            supRow.push("");
        }
    }

    sheet.addRow(supRow);
    addStyles(sheet,'FF2BAEAB');
    addFont(sheet,11,'FF000000',false);
    addAlignment(sheet,'middle','center');

    //merge cells of suppliers

    var supRow1 = ["S-No","Material", "Sub-Category", "Units","Quantity","Grade/Spec"];
    var curCol = supRow1.length+1;
    for (var i = 0; i < supKey.length; i++) {
        if(sup[supKey[i]] == 0){
            supRow1.push("");
            continue;
        }
        for (var j = 0; j < productBrandLength * sup[supKey[i]]; j++) {
            supRow1.push(productBrands[j%productBrandLength]);
        }
    }

    sheet.addRow(supRow1);
    addStyles(sheet,'FF47D1CE');
    addAlignment(sheet,'middle','right');

    var blockNum = 0;
    var sellerBlockTotal = [];
    var sellerBlockVat = [];
    var sellerBlockGrandTotal = [];
    var sellerBlockDeliveryCharges = [];
    var sellerBlockStatus = [];
    var sellerBlockRemarks = [];
    var sellerBlockCSTCharges = [];
    var sellerBlockQuoteValidUpTo = [];
    var sellerBlockDeliveryTime = [];
    var sellerBlockPaymentTerms = [];

    var mapStatus = {
        "EnquirySent":"New",
        "IntentToQuote":"Pending To Quote",
        "QuoteSubmitted":"Quoted",
        "QuoteAmended":"Quoted",
        "NotIntentToQuote":"Rejected",
        "Expired":"Enquiry Expired",
        "EditInProgress":"Edit In Progress",
        "PendingApproval":"Pending Approval"
    };

    for (var i = 0; i < products.length; i++) {
        var productIdentifier = products[i];
        var productSubCategory = items[products[i]]['subCategory'];
        var quantity = items[products[i]]['quantity'];
        var quantityUnit = items[products[i]]['quantityUnit'];
        var productSpecs = items[products[i]]['productSpec'];
        var specValues = [];
        for(var k = 0;k<productSpecs.length;k++){
            specValues[k] = productSpecs[k].value;
        }

        var rowValues = [];
        rowValues.push(i+1,productIdentifier, productSubCategory, quantityUnit,quantity,specValues.join(', '));

        for (var j = 0; j < supKey.length; j++) {
            var supplierStatus ="";
            var supplierRemarks = "";
            var supplierDeliveryCharges = "";
            var supplierCSTCharges = "";
            var supplierQuoteValidUpTo = "";
            var supplierDeliveryTime = "";
            var supplierPaymentTerms = "";
            //console.log("bfr",supKey[j],supplierPaymentTerms);

            if (sup[supKey[j]] == 0) {
                if (sellerBlockTotal[blockNum] === undefined)
                    sellerBlockTotal.push(0);
                else {
                    sellerBlockTotal[blockNum] += 0;
                }
                if (sellerBlockVat[blockNum] === undefined)
                    sellerBlockVat.push(0);
                else {
                    sellerBlockVat[blockNum] += 0;
                }

                if(items[products[i]]['sellers'][supKey[j]] !== undefined){
                    supplierDeliveryCharges = items[products[i]]['sellers'][supKey[j]]['deliveryCharges'] || "NA";
                    supplierStatus = items[products[i]]['sellers'][supKey[j]]['supplierStatus'] || "NA";
                    supplierRemarks = items[products[i]]['sellers'][supKey[j]]['sellerRemarks'] || "NA";

                    supplierDeliveryTime = items[products[i]]['sellers'][supKey[j]]['deliveryTime'] || "NA";
                    supplierCSTCharges = items[products[i]]['sellers'][supKey[j]]['CSTCharges'] || "NA";
                    supplierQuoteValidUpTo = items[products[i]]['sellers'][supKey[j]]['quoteValidUpTo'] || "NA";
                }

                supplierLevelBlock(sellerBlockDeliveryCharges,j,supplierDeliveryCharges || "");
                supplierLevelBlock(sellerBlockStatus,j,mapStatus[supplierStatus] || "");
                supplierLevelBlock(sellerBlockRemarks,j,supplierRemarks || "");
                supplierLevelBlock(sellerBlockCSTCharges,j,supplierCSTCharges || "");
                supplierLevelBlock(sellerBlockQuoteValidUpTo,j,supplierQuoteValidUpTo || "");
                supplierLevelBlock(sellerBlockDeliveryTime,j,supplierDeliveryTime || "");

                blockNum++;
                rowValues.push("");
                supplierLevelBlock(sellerBlockPaymentTerms,j,supplierPaymentTerms || "NA");

                continue;
            }
            else{
                if(items[products[i]]['sellers'][supKey[j]] !== undefined){
                    supplierDeliveryCharges = items[products[i]]['sellers'][supKey[j]]['deliveryCharges'] || "NA";
                    supplierStatus = items[products[i]]['sellers'][supKey[j]]['supplierStatus'] || "NA";
                    supplierRemarks = items[products[i]]['sellers'][supKey[j]]['sellerRemarks'] || "NA";

                    supplierDeliveryTime = items[products[i]]['sellers'][supKey[j]]['deliveryTime'] || "NA";
                    supplierCSTCharges = items[products[i]]['sellers'][supKey[j]]['CSTCharges'] || "NA";
                    supplierQuoteValidUpTo = items[products[i]]['sellers'][supKey[j]]['quoteValidUpTo'] || "NA";
                }
                supplierLevelBlock(sellerBlockDeliveryCharges,j,supplierDeliveryCharges || "");
                supplierLevelBlock(sellerBlockStatus,j,mapStatus[supplierStatus] || "");
                supplierLevelBlock(sellerBlockRemarks,j,supplierRemarks || "");
                supplierLevelBlock(sellerBlockCSTCharges,j,supplierCSTCharges || "");
                supplierLevelBlock(sellerBlockQuoteValidUpTo,j,supplierQuoteValidUpTo || "");
                supplierLevelBlock(sellerBlockDeliveryTime,j,supplierDeliveryTime || "");
            }
            //console.log("afr");

            for (var l = 0; l < sup[supKey[j]]; l++) {
                var amount = 0;
                var vat = 0;
                if (items[products[i]]['sellers'].hasOwnProperty(supKey[j]) && items[products[i]]['sellers'][supKey[j]]['quotations'][l] !== undefined) {
                    var curQuote = items[products[i]]['sellers'][supKey[j]]['quotations'][l];
                    var brand = curQuote.brand || "";
                    var rate = curQuote.quotedPrice || 0;
                    var VATPercentage = curQuote.VAT || 0;
                    vat = curQuote.VATAmt || 0;
                    amount = curQuote.quotedPrice*curQuote.quantity || 0;

                    if(supplierPaymentTerms === ""){
                        var supplierPaymentMode = items[products[i]]['sellers'][supKey[j]]['quotations'][0]['paymentMode'];
                        var supplierPaymentCreditDays = items[products[i]]['sellers'][supKey[j]]['quotations'][0]['creditDays'];
                        supplierPaymentTerms = supplierPaymentMode+(supplierPaymentCreditDays ? (" - "+supplierPaymentCreditDays+" Days"):(""));
                        supplierLevelBlock(sellerBlockPaymentTerms,j,supplierPaymentTerms || "NA");
                    }

                    rowValues.push(brand, rate, amount, VATPercentage);
                }
                else {
                    rowValues.push("", "", "", "");
                }

                if (sellerBlockTotal[blockNum] === undefined)
                    sellerBlockTotal.push(amount);
                else {
                    sellerBlockTotal[blockNum] += amount;
                }

                if (sellerBlockVat[blockNum] === undefined)
                    sellerBlockVat.push(vat);
                else {
                    sellerBlockVat[blockNum] += vat;
                }
                blockNum++;
            }

            //console.log("afr");
            //console.log("afr",supKey[j],supplierPaymentTerms);
            //supplierLevelBlock(sellerBlockPaymentTerms,j,supplierPaymentTerms || "");

        }
        sheet.addRow(rowValues);
        sheet.lastRow.border = getBorderForColumn();

        //addStyles(sheet,'FF9E9E9E');
        addAlignment(sheet,'middle','right');

        blockNum = 0;
    }

    for(var i = 0;i<sellerBlockTotal.length;i++){
        sellerBlockGrandTotal.push(sellerBlockTotal[i]+sellerBlockVat[i]);
    }

    sheet.addRow([""]);


    sheet.addRow(createRow(sup, supKey, sellerBlockTotal, productBrandLength, "Total Amount"));
    sheet.lastRow.border = getBorderForColumn();
    //addStyles(sheet,'FF9E9E9E');
    addAlignment(sheet,'middle','right');

    sheet.addRow(createRow(sup, supKey, sellerBlockVat, productBrandLength, "Total VAT Charges"));
    sheet.lastRow.border = getBorderForColumn();
    //addStyles(sheet,'FF9E9E9E');
    addAlignment(sheet,'middle','right');

    sheet.addRow(createRow(sup, supKey, sellerBlockGrandTotal, productBrandLength, "GRAND TOTAL"));
    sheet.lastRow.border = getBorderForColumn();
    //addStyles(sheet,'FF9E9E9E');
    addAlignment(sheet,'middle','right');

    sheet.addRow(createSupplierLevelRow(sup, supKey, sellerBlockPaymentTerms, productBrandLength, "Supplier Payment Terms"));
    sheet.lastRow.border = getBorderForColumn();
    //addStyles(sheet,'FF9E9E9E');
    addAlignment(sheet,'middle','right');

    sheet.addRow(createSupplierLevelRow(sup, supKey, sellerBlockDeliveryCharges, productBrandLength, "Transportation Charges"));
    sheet.lastRow.border = getBorderForColumn();
    //addStyles(sheet,'FF9E9E9E');
    addAlignment(sheet,'middle','right');

    sheet.addRow(createSupplierLevelRow(sup, supKey, sellerBlockDeliveryTime, productBrandLength, "Delivery Time"));
    sheet.lastRow.border = getBorderForColumn();
    //addStyles(sheet,'FF9E9E9E');
    addAlignment(sheet,'middle','right');

    sheet.addRow(createSupplierLevelRow(sup, supKey, sellerBlockCSTCharges, productBrandLength, "Tax Levied as per CST ?"));
    sheet.lastRow.border = getBorderForColumn();
    //addStyles(sheet,'FF9E9E9E');
    addAlignment(sheet,'middle','right');

    sheet.addRow(createSupplierLevelRow(sup, supKey, sellerBlockQuoteValidUpTo, productBrandLength, "Quote Valid Upto"));
    sheet.lastRow.border = getBorderForColumn();
    //addStyles(sheet,'FF9E9E9E');
    addAlignment(sheet,'middle','right');

    sheet.addRow(createSupplierLevelRow(sup, supKey, sellerBlockRemarks, productBrandLength, "Supplier Remarks"));
    sheet.lastRow.border = getBorderForColumn();
    //addStyles(sheet,'FF9E9E9E');
    addAlignment(sheet,'middle','right');

    sheet.addRow(createSupplierLevelRow(sup, supKey, sellerBlockStatus, productBrandLength, "Quotation Status"));
    sheet.lastRow.border = getBorderForColumn();
    //addStyles(sheet,'FF9E9E9E');
    addAlignment(sheet,'middle','right');

    var curColIndex = curCol;

    var sheetColumns = [];
    for(var i = 0;i<curCol;i++){
        sheetColumns.push({header: "", key: "key", width: 35})
    }

    for (var i = 0; i < supKey.length; i++) {
        var style = getStyleForColumn(i);
        //console.log(style);
        var val = sup[supKey[i]];
        if (val == 0) {
            //console.log(curColIndex);
            sheet.getColumn(curColIndex).fill = style;
            sheet.getColumn(curColIndex).border = getBorderForColumn();
            sheetColumns.push({header: "", key: "value", width: 25, outlineLevel: 1});
            curColIndex++;
        }
        for (var j = 0; j < productBrandLength * val; j++) {
            //console.log(curColIndex);
            sheet.getColumn(curColIndex).fill = style;
            sheet.getColumn(curColIndex).border = getBorderForColumn();
            sheetColumns.push({header: "", key: "value", width: 25, outlineLevel: 1});
            curColIndex++;
        }
    }

    sheet.columns = sheetColumns;

    var quoteStart = 6+Object.keys(inquiryInfo).length;

    sheet.getRow(quoteStart+1).fill = {
        type: 'none',
        pattern: 'solid',
        fgColor: {argb: 'FF2BAEAB'}
    };

    sheet.getRow(quoteStart+2).fill = {
        type: 'none',
        pattern: 'solid',
        fgColor: {argb: 'FF47D1CE'}
    };

    ///usr/NodeJslogs/rfqdocs/some.xlsx
    //"D:/usr/NodeJslogs/rfqdocs/masterQuotationReport.xlsx"
    workbook.xlsx.writeFile(pathToCreate)
        .then(function (err) {
            if (!err) {
                callback(false, pathToCreate);
            } else {
                callback(true, "Creating and Writing to excel file failed");
            }
        });
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
