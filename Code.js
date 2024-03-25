// Main script file for the Google Docs Add-on

/**
 * Called when the document is opened. Adds a custom menu to Google Docs.
 */
function onOpen() {
  DocumentApp.getUi()
    .createMenu('Markdown Converter')
    .addItem('Convert Markdown', 'showMarkdownDialog')
    .addToUi();
}

/**
 * Displays the dialog or sidebar for the user to input Markdown content.
 */
function showMarkdownDialog() {
  const html = HtmlService.createHtmlOutputFromFile('Dialog')
    .setWidth(400)
    .setHeight(300)
    .setTitle('Markdown to Google Docs');
  DocumentApp.getUi().showModalDialog(html, 'Convert Markdown to Google Docs');
}

/**
 * Parses and inserts Markdown content into the Google Doc, called from the dialog.
 * This function should be linked with the Markdown parsing logic implemented.
 * @param {string} markdownText - The Markdown text to be converted.
 */
function parseAndInsertMarkdown(markdownText) {
  // Directly call the newly defined function to convert and insert the Markdown
  convertToGoogleDocs(markdownText);
  // Provide user feedback upon completion
  DocumentApp.getUi().alert('Markdown conversion completed.');
}


/**
 * Loads the necessary libraries or modules, such as the Markdown parser.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
      .getContent();
}
