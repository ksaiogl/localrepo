//Function that will return two decimal points, WITHOUT rounding.
exports.get2Decimalpoint = function(num){
	return Math.floor(num * 100) / 100;
}