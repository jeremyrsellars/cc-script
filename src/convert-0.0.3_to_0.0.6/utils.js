const fs = require('fs');

Number.prototype.padLeft = function(base,chr){
    var  len = (String(base || 10).length - String(this).length)+1;
    return len > 0? new Array(len).join(chr || '0')+this : this;
}
// usage
//=> 3..padLeft() => '03'
//=> 3..padLeft(100,'-') => '--3'

function excelDate (d) {
	//=> '05/17/2012 10:52:21'
    if (!d) d = new Date();
    return    [(d.getMonth()+1).padLeft(),
               d.getDate().padLeft(),
               d.getFullYear()].join('/') +' ' +
              [d.getHours().padLeft(),
               d.getMinutes().padLeft(),
               d.getSeconds().padLeft()].join(':');
}

function csv (row) {
	var csv = ""
	for(var i = 0; i < row.length; i++){
		var cell = row[i]
		if(cell == null) {
			cell = ""
		} else if(typeof cell == "number") {
			cell = cell.toString()
		} else {
			cell = "\"" + cell.toString().replace(/"/g, "\"\"") + "\""
		}
		csv += cell + ","
	}
	csv += "\r\n"
	return csv;
}

function appendCsv (file, row) {
    var s = csv(row)
    fs.appendFileSync(file, s)
    console.log(s)
}

function appendCsv2 (file, initalCsv, additionalFields) {
    var s = csv(additionalFields)
    fs.appendFileSync(file, initalCsv + "," + s)
    console.log(s)
}

function writeFile (file, contents) {
	fs.appendFileSync(file, contents)
}

function readFile (file, contents) {
    fs.appendFileSync(file, contents)
}


module.exports = {
	excelDate: excelDate,
	appendCsv: appendCsv,
    writeFile: writeFile,
    readFile: readFile,
}
