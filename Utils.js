/**
 * Utils.js: Utility functions for Markdown Converter Add-on.
 */

// Logging and Debugging
function log(message) {
  Logger.log(message);
}

function debug(obj) {
  Logger.log(JSON.stringify(obj, null, 2));
}

// Error Handling
function handleError(error) {
  Logger.log('Error: ' + error.toString());
  // Extend this to handle different types of errors differently
}

// Markdown Helpers
function extractLink(markdownLine) {
  const match = markdownLine.match(/\[([^\]]+)\]\(([^)]+)\)/);
  return match ? { text: match[1], url: match[2] } : null;
}

function isNestedList(markdownLine) {
  return /^\s+/.test(markdownLine);
}

// Google Docs API Wrappers
function insertParagraph(body, text) {
  return body.appendParagraph(text);
}

function insertLink(body, text, url) {
  const paragraph = body.appendParagraph(text);
  paragraph.setLinkUrl(url);
}

// This is a starting point. You might find that other utilities are necessary as you
// continue to develop and refine your add-on.
