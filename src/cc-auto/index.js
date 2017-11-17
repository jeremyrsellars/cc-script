const child_process = require('child_process')
const path = require('path')
const { Chromeless } = require('chromeless')
const { excelDate, appendCsv, writeFile } = require('./utils')

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

// Patient Identification numbers
const pin_test='11256872'

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

async function run(pin) {
  const chromeless = new Chromeless({waitTimeout:longTimeout})
  var lastScreenShotPathUglyHack = ''
  var finalScreenShotPath = null
  var screenshotIndex = 0;

  var setFinalScreenShotPath = (p) => {
    if(p) finalScreenShotPath = p
  }

  var t = excelDate().replace(/\/|:/g, "-");
  var screenshotOptions = function screenshotOptions (name){
    var fn = name + "." + t + ".png"
    var fp = path.join(process.cwd(), fn)
    lastScreenShotPathUglyHack = fp
    return { filePath: fp}
  }
  

  var loginScreenshot = await chromeless
    .goto('https://clinicalconnect.ca/connect/login')
    .type(process.env.ccusr, 'input[id="login-form-username"]')
    .type(process.env.ccpwd, 'input[id="login-form-password"]')
    .type('partners', 'select[class="v-select-select"]')
    .press(key_downArrow)
    .press(key_upArrow)
    .press(key_enter)
    .wait('#header-simple-search')
    .screenshot(null, screenshotOptions(pin + "." + screenshotIndex++ + ".login"))
    .catch(abort)
  setFinalScreenShotPath(loginScreenshot = mv(loginScreenshot, lastScreenShotPathUglyHack))

  console.log(loginScreenshot) // prints local file path or S3 url
  
  var wait = 1000;   // a second to let it paint.
  const searchStart = new Date();
  var patientListScreenshot = await chromeless
    .wait(wait/2)
    .wait(     'input[id="header-simple-search"]')
    .click(    'input[id="header-simple-search"]')
    .type(pin, 'input[id="header-simple-search"]')
    .wait(wait/2)
    .press(key_enter)
    .wait(sel_firstGridCell)
    .wait(wait)
    .screenshot(null, screenshotOptions(pin + "." + screenshotIndex++ + ".patients"))
    .catch(abort)
  const searchEnd = new Date();

  setFinalScreenShotPath(patientListScreenshot = mv(patientListScreenshot, lastScreenShotPathUglyHack))
  
  console.log(patientListScreenshot) // prints local file path or S3 url

  // Open first Patient from search results
  await chromeless
    .wait(sel_firstGridCell)
    .wait(3000) // 1 second to let it paint.
    .click(sel_firstGridCell)
    .catch(abort)
  
  const lookupStart = new Date();
  console.log('lookupStart:' + lookupStart);

  // it may be necessary to skip a the "that's not your patient.... override screen".
  await chromeless
    .wait(sel_overrideOther, 20000)
    .click(sel_overrideOther, 20000)
    .wait(sel_performOverrideButton, 20000)
    .click(sel_performOverrideButton, 20000)
    .catch(function(){})
  
  var patientScreenshot = await chromeless
    .wait(sel_lablist)
    .screenshot(null, screenshotOptions(pin + "." + screenshotIndex++ + ".patient"))
    .catch(abort)
  setFinalScreenShotPath(patientScreenshot = mv(patientScreenshot, lastScreenShotPathUglyHack))

  console.log(patientScreenshot) // prints local file path or S3 url

  await chromeless
    .wait(100) // 1/10th of a second to let it paint.
    .click(sel_lablist)
    .wait(sel_searchInput)
    .wait(sel_firstGridCell)
    .catch(abort);

  var patientLabsScreenshot = await chromeless
    .wait(100) // 1/10th of a second to let it paint.
    .screenshot(null, screenshotOptions(pin + "." + screenshotIndex++ + ".labs"))
    .catch(abort)
  const lookupEnd = new Date();
  console.log('lookupEnd:' + lookupEnd);
  setFinalScreenShotPath(patientLabsScreenshot = mv(patientLabsScreenshot, lastScreenShotPathUglyHack))

  const html = await chromeless
    .html()
    .catch(abort)

  appendCsv(pin + ".csv",
    [excelDate(searchStart),
     searchEnd - searchStart - (2 * wait),
     excelDate(lookupStart),
     lookupEnd - lookupStart,
     excelDate(lookupEnd),
     finalScreenShotPath])
  writeFile(pin + "." + t + ".html", html)

  console.log(patientLabsScreenshot) // prints local file path or S3 url

  if(!debug) await chromeless.end()

    return chromeless
}

var args = process.argv.slice(2);
var pins = args.length > 0 ? args : [pin_test];

for(var p = 0; p < pins.length; p++) {
    var x = setTimeout(function(pin){
        console.log(pin)
        run(pin).catch(console.error.bind(console))
    }, 1000, pins[p])
}

// _.then(function(chromeless){chromeless.end()})