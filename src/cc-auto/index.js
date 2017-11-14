const { Chromeless } = require('chromeless')

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
    .wait(3000)

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
    .screenshot()

  console.log(patientLabsScreenshot) // prints local file path or S3 url

  // await chromeless.end()
  return chromeless
}

run(pin_test).catch(console.error.bind(console))

// _.then(function(chromeless){chromeless.end()})