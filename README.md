# Google Form Automation Script

Automates a three-sheet workflow:

1. **Questions** sheet -> generates a Google Form
2. **Emails** sheet -> sends the form link to every address
3. **Responses** sheet -> auto-populated with form submissions

## Setup

1. Open your Google Spreadsheet.
2. Go to **Extensions > Apps Script**.
3. Delete any code in the editor and paste the contents of `Code.gs`.
4. Click **Save** (give the project a name).
5. Select `onOpen` in the function dropdown and click **Run** (authorize when prompted).
6. Refresh your spreadsheet — a **Form Automation** menu appears in the toolbar.

## Sheet layout

### Questions sheet

| Question                  | Type             | Options                       | Required |
|---------------------------|------------------|-------------------------------|----------|
| What is your name?        | TEXT             |                               | TRUE     |
| Describe your experience. | PARAGRAPH        |                               | TRUE     |
| How did you hear about us?| MULTIPLE_CHOICE  | Friend, Online, Advertisement| TRUE     |
| Which products do you use?| CHECKBOX         | Product A, Product B, Product C | TRUE  |
| Rate our service.         | SCALE            |                               | TRUE     |
| Preferred date.           | DATE             |                               | FALSE    |

**Type** values: `TEXT`, `PARAGRAPH`, `MULTIPLE_CHOICE`, `CHECKBOX`, `DROPDOWN`, `SCALE`, `DATE`, `TIME`

**Options**: comma-separated, only needed for MULTIPLE_CHOICE, CHECKBOX, DROPDOWN.

### Emails sheet

| Email                |
|----------------------|
| person1@example.com  |
| person2@example.com  |

### Responses sheet

Leave it empty. The script creates/links it automatically when the form is generated.

## Usage

Use the **Form Automation** menu in your spreadsheet:

- **Create Form & Send Emails** — full workflow (create form, link responses, email everyone).
- **Create Form Only** — creates the form and links responses without sending emails.
- **Send Emails Only** — resends the existing form link to all emails (the form must have been created first).

## Customization

Edit the `CONFIG` object at the top of `Code.gs` to change:
- Sheet names
- Form title and description
- Email subject and body (HTML supported)
- Whether to collect respondent emails (`COLLECT_EMAIL`)

## Notes

- Google Apps Script email quota: ~100/day (consumer Gmail), ~1,500/day (Google Workspace).
- Each run of "Create Form" generates a **new** Google Form. Use "Send Emails Only" to resend without duplicating the form.
- The script stores the form ID in document properties so it can resend later.
