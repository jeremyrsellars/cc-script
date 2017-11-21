const child_process = require('child_process')
const path = require('path')
const { Chromeless } = require('chromeless')
const { excelDate, appendCsv2, writeFile, readFile } = require('./utils')

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
  appendCsv2("errors.csv", [excelDate(), e])
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

async function run(csvLine, fn) {
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

  const inputHtml = readFile(fn).replace(/<script[^>]*>[\\s\\S]*?<\/script>/gi, "")

  var staticScreenshot = await chromeless
    .setHtml(inputHtml)
    .wait(1000)
    .screenshot(null, screenshotOptions(fn + "." + screenshotIndex++ + ".static"))
    .catch(abort)
  setFinalScreenShotPath(staticScreenshot = mv(staticScreenshot, lastScreenShotPathUglyHack))

  console.log(staticScreenshot) // prints local file path or S3 url

  var error = await chromeless.exists(sel_error)

  if(error){
    var errorScreenShot = await chromeless
      .wait(100) // 1/10th of a second to let it paint.
      .screenshot(sel_error, screenshotOptions(fn + "." + screenshotIndex++ + ".error"))
      .catch(abort)
    errorScreenShot = mv(errorScreenShot, lastScreenShotPathUglyHack)

    var errorMessages = await chromeless.evaluate(() => {
      // this will be executed in Chrome
      const msgs = [].map.call(
        document.querySelectorAll('.v-label-error'),
        div => (div.innerText)
      )
      return msgs.join(" ...... ")
    })
  }

  appendCsv2(fn + ".csv",
    csvLine,
    [errorMessages,
     errorScreenShot])
  writeFile(fn + "." + t + ".html", html)

  console.log(patientLabsScreenshot) // prints local file path or S3 url

  if(!debug) await chromeless.end()

  return chromeless
}

var args = process.argv.slice(2);
var fns = args.length > 0 ? args : [];

for(var p = 0; p < fns.length; p++) {
  var lineReader = require('readline').createInterface({
    input: require('fs').createReadStream(fns[p])
  });

  lineReader.on('line', function (line) {
    var fnMatch = line.match(/"[^"]+.png"/)
    if(fnMatch)
      run(line, fnMatch[0].replace(/"/g,""))
  });
}

// _.then(function(chromeless){chromeless.end()})
