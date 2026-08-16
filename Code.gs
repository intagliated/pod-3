/**
 * Google Form Automation Script
 * ------------------------------
 * Reads a Questions sheet, generates a Google Form, links a Responses sheet,
 * and emails the form link to everyone in an Emails sheet.
 *
 * Setup: Extensions > Apps Script > paste this file > Save > run onOpen once
 * to authorize > refresh the spreadsheet > use the "Form Automation" menu.
 */

// ============================= CONFIG =====================================
const CONFIG = {
  QUESTIONS_SHEET: 'Questions',
  EMAILS_SHEET: 'Emails',
  RESPONSES_SHEET: 'Responses',

  FORM_TITLE: 'Feedback Form',
  FORM_DESCRIPTION: 'Please complete the form below.',

  EMAIL_SUBJECT: 'Please fill out this form',
  // {{formUrl}} is replaced with the live form link before sending.
  EMAIL_BODY:
    '<p>Hello,</p>' +
    '<p>Please take a moment to fill out this form:</p>' +
    '<p><a href="{{formUrl}}">{{formUrl}}</a></p>' +
    '<p>Thank you!</p>',

  // If true, the form will require respondents to sign in and will collect
  // their email address automatically.
  COLLECT_EMAIL: false
};
// ============================================================================

const DOC_PROPS = PropertiesService.getDocumentProperties();
const PROP_FORM_ID = 'FORM_AUTOMATION_FORM_ID';
const PROP_FORM_URL = 'FORM_AUTOMATION_FORM_URL';

/**
 * Adds the custom menu when the spreadsheet is opened.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Form Automation')
    .addItem('Create Form & Send Emails', 'createFormAndSendEmails')
    .addItem('Create Form Only', 'createFormOnly')
    .addItem('Send Emails Only', 'sendEmailsOnly')
    .addToUi();
}

// ============================ MENU ACTIONS =================================

function createFormAndSendEmails() {
  const formUrl = createForm_();
  sendEmails_(formUrl);
  SpreadsheetApp.getUi().alert('Form created and emails sent!\n\n' + formUrl);
}

function createFormOnly() {
  const formUrl = createForm_();
  SpreadsheetApp.getUi().alert('Form created!\n\n' + formUrl);
}

function sendEmailsOnly() {
  const formUrl = DOC_PROPS.getProperty(PROP_FORM_URL);
  if (!formUrl) {
    SpreadsheetApp.getUi().alert(
      'No form found. Please run "Create Form Only" or "Create Form & Send Emails" first.'
    );
    return;
  }
  sendEmails_(formUrl);
  SpreadsheetApp.getUi().alert('Emails sent to everyone in the ' + CONFIG.EMAILS_SHEET + ' sheet.');
}

// ============================ CORE LOGIC ====================================

/**
 * Builds the Google Form from the Questions sheet, links responses back into
 * this spreadsheet's Responses sheet, and stores the form ID/URL for reuse.
 * Returns the published form URL.
 */
function createForm_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const questionsSheet = ss.getSheetByName(CONFIG.QUESTIONS_SHEET);
  if (!questionsSheet) {
    throw new Error('Sheet "' + CONFIG.QUESTIONS_SHEET + '" not found.');
  }

  const data = questionsSheet.getDataRange().getValues();
  const rows = data.slice(1).filter(r => r[0]); // skip header, skip blank rows

  if (rows.length === 0) {
    throw new Error('No questions found in "' + CONFIG.QUESTIONS_SHEET + '".');
  }

  const form = FormApp.create(CONFIG.FORM_TITLE);
  form.setDescription(CONFIG.FORM_DESCRIPTION);
  form.setCollectEmail(CONFIG.COLLECT_EMAIL);

  rows.forEach(row => {
    const [question, type, optionsRaw, required] = row;
    addQuestionToForm_(form, String(question), String(type).trim().toUpperCase(), optionsRaw, required);
  });

  linkResponsesSheet_(ss, form);

  const formUrl = form.getPublishedUrl();
  DOC_PROPS.setProperty(PROP_FORM_ID, form.getId());
  DOC_PROPS.setProperty(PROP_FORM_URL, formUrl);

  return formUrl;
}

/**
 * Adds a single item to the form based on its type.
 */
function addQuestionToForm_(form, question, type, optionsRaw, required) {
  const isRequired = required === true || String(required).trim().toUpperCase() === 'TRUE';
  const options = optionsRaw
    ? String(optionsRaw).split(',').map(o => o.trim()).filter(o => o.length > 0)
    : [];

  switch (type) {
    case 'TEXT':
      form.addTextItem().setTitle(question).setRequired(isRequired);
      break;

    case 'PARAGRAPH':
      form.addParagraphTextItem().setTitle(question).setRequired(isRequired);
      break;

    case 'MULTIPLE_CHOICE': {
      const item = form.addMultipleChoiceItem().setTitle(question);
      if (options.length > 0) item.setChoiceValues(options);
      item.setRequired(isRequired);
      break;
    }

    case 'CHECKBOX': {
      const item = form.addCheckboxItem().setTitle(question);
      if (options.length > 0) item.setChoiceValues(options);
      item.setRequired(isRequired);
      break;
    }

    case 'DROPDOWN': {
      const item = form.addListItem().setTitle(question);
      if (options.length > 0) item.setChoiceValues(options);
      item.setRequired(isRequired);
      break;
    }

    case 'SCALE':
      form.addScaleItem()
        .setTitle(question)
        .setBounds(1, 5)
        .setRequired(isRequired);
      break;

    case 'DATE':
      form.addDateItem().setTitle(question).setRequired(isRequired);
      break;

    case 'TIME':
      form.addTimeItem().setTitle(question).setRequired(isRequired);
      break;

    default:
      throw new Error(
        'Unknown question type "' + type + '" for question "' + question + '". ' +
        'Valid types: TEXT, PARAGRAPH, MULTIPLE_CHOICE, CHECKBOX, DROPDOWN, SCALE, DATE, TIME.'
      );
  }
}

/**
 * Points the form's responses at this spreadsheet, then renames the
 * auto-created response sheet to CONFIG.RESPONSES_SHEET (replacing any
 * existing empty sheet of that name).
 */
function linkResponsesSheet_(ss, form) {
  // Remove a pre-existing empty Responses sheet so the new one can take its name.
  const existing = ss.getSheetByName(CONFIG.RESPONSES_SHEET);
  if (existing) {
    ss.deleteSheet(existing);
  }

  const sheetNamesBefore = ss.getSheets().map(s => s.getName());

  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  // Apps Script needs a moment for the linked sheet to appear.
  Utilities.sleep(1000);

  const sheetNamesAfter = ss.getSheets().map(s => s.getName());
  const newSheetName = sheetNamesAfter.find(name => sheetNamesBefore.indexOf(name) === -1);

  if (newSheetName) {
    ss.getSheetByName(newSheetName).setName(CONFIG.RESPONSES_SHEET);
  }
}

/**
 * Emails the form link to every address in the Emails sheet.
 */
function sendEmails_(formUrl) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const emailsSheet = ss.getSheetByName(CONFIG.EMAILS_SHEET);
  if (!emailsSheet) {
    throw new Error('Sheet "' + CONFIG.EMAILS_SHEET + '" not found.');
  }

  const data = emailsSheet.getDataRange().getValues();
  const emails = data
    .slice(1) // skip header
    .map(r => String(r[0]).trim())
    .filter(e => e.length > 0 && e.indexOf('@') > -1);

  if (emails.length === 0) {
    throw new Error('No valid email addresses found in "' + CONFIG.EMAILS_SHEET + '".');
  }

  const remainingQuota = MailApp.getRemainingDailyQuota();
  if (remainingQuota < emails.length) {
    throw new Error(
      'Not enough email quota remaining today (' + remainingQuota + ' left, ' +
      emails.length + ' needed). Try again tomorrow or reduce the recipient list.'
    );
  }

  const htmlBody = CONFIG.EMAIL_BODY.replace(/{{formUrl}}/g, formUrl);
  const plainBody = 'Please fill out this form: ' + formUrl;

  emails.forEach(email => {
    GmailApp.sendEmail(email, CONFIG.EMAIL_SUBJECT, plainBody, {
      htmlBody: htmlBody
    });
  });
}
