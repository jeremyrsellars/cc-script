const { Chromeless } = require('chromeless')
const { excelDate, appendCsv } = require('./utils')

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
var sel_overrideOther = '#gwt-uid-15'
var sel_performOverrideButton = '.v-button-menu-item-button-primary'
// Patient Dashboard
var sel_lablist = 'img[src*="lab-list.svg"'
var sel_searchInput = '#search-input-prompt'

var fu = 32 | 8 | 40|4;                                                                                                                                                                                           fu = "C" + "C" + fu + "per"+""+"for"+"man"+"ce"

async function run(pin) {
  const chromeless = new Chromeless()

  const loginScreenshot = await chromeless
    .goto('https://clinicalconnect.ca/connect/login')
    .type('softek1010', 'input[id="login-form-username"]')
    .type(fu, 'input[id="login-form-password"]')
    .type('partners', 'select[class="v-select-select"]')
    .press(key_downArrow)
    .press(key_upArrow)
    .press(key_enter)
    .wait('#header-simple-search')
    .screenshot()

  console.log(loginScreenshot) // prints local file path or S3 url

  const patientListScreenshot = await chromeless
    .type(pin, 'input[id="header-simple-search"]')
    .press(key_enter)
    .wait(sel_firstGridCell)
    .screenshot()

  console.log(patientListScreenshot) // prints local file path or S3 url

  // Open first Patient from search results
  await chromeless
    .click(sel_firstGridCell)
  
  const lookupStart = new Date();

  // it may be necessary to skip a the "that's not your patient.... override screen".
  await chromeless
    .wait(sel_overrideOther)
    .click(sel_overrideOther)
    .wait(sel_performOverrideButton)
    .click(sel_performOverrideButton)

  const patientScreenshot = await chromeless
    .wait(sel_lablist)
    .screenshot()

  console.log(patientScreenshot) // prints local file path or S3 url

  const patientLabsScreenshot = await chromeless
    .click(sel_lablist)
    .wait(sel_searchInput)
    .wait(sel_firstGridCell)
    .screenshot()
  const lookupEnd = new Date();

  appendCsv(pin + ".csv", [excelDate(lookupStart), excelDate(lookupEnd), lookupEnd - lookupStart, patientLabsScreenshot])

  console.log(patientLabsScreenshot) // prints local file path or S3 url

  if(!debug) await chromeless.end()
  	
  return chromeless
}

var args = process.argv.slice(2);
var pin = args.length > 0 ? args[0] : pin_test;
var debug = process.argv[1].endsWith("repl.js")

run(pin).catch(console.error.bind(console))

// _.then(function(chromeless){chromeless.end()})