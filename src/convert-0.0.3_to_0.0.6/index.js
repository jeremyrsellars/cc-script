const child_process = require('child_process')
const path = require('path')
const { Chromeless } = require('chromeless')
const { excelDate, appendCsv, appendCsv2, writeFile, readFile } = require('./utils')

var mvPath = process.env.mv || "C:\\Program Files\\Git\\usr\\bin\\mv.exe"
var mv = function mv (src, dest){
    if(src == dest || !src || !dest) return src;
    // console.log("Moving " + src + " -> " + dest)
    child_process.execFile(mvPath, [src, dest])
    return dest;
}

var debug = process.argv[1].endsWith("repl.js")

var longTimeout = 840000
var abortTimeout = longTimeout * 0.2

var abort = function abort(e) {
  console.error("Something didn't work right.  Aborting: " + !debug)
  console.error(e)
  if(!debug) setTimeout(function(){process.exit(1)}, abortTimeout);
  appendCsv("errors.csv", [excelDate(), e])
}

const unhandledRejectionOnlyOnce = process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason)
  abort(reason)
});

// Key codes
const key_downArrow = 40
const key_upArrow = 38
const key_enter = 13

//
// Selectors
//

// Patient Search Results:
var sel_firstGridCell = 'tbody.v-grid-body td'
// Patient Search - Select patient Override screen:
var sel_overrideOther = '.override-options :last-child input'
var sel_performOverrideButton = '.v-button-menu-item-button-primary'
// Patient Dashboard
var sel_lablist = 'img[src*="lab-list.svg"]'
var sel_searchInput = '#search-input-prompt'
var sel_labs = sel_firstGridCell + ", div.module-view div div.clinical-label.v-label-view-text"
var sel_error = ".v-label-error"





var args = process.argv.slice(2);
var [sourceFile, destFile] = args;

var lineReader = require('readline').createInterface({
  input: require('fs').createReadStream(sourceFile)
});

lineReader.on('line', function (line) {
  var fnMatch = line.match(/"[^"]+.png"/)
  if(!fnMatch) return

  var htmlFile = fnMatch[0]
    .replace(/"/g,"")
    .replace (/\.\d\.[a-z]+/i,"")
    .replace(".png",".html")
  var html = readFile(htmlFile)
  console.log(html.match(/\.v-label-error/g))
  var htmlMatch = html.match(/(v-label-error[^\>]+\>)(.*?)\</i)
  appendCsv2(destFile, line, htmlMatch ? [htmlMatch[2], "NotAvailable.png"] : [null,null])
});

// _.then(function(chromeless){chromeless.end()})
