/**
 * MarkdownParser.js: Parses Markdown and creates Google Docs elements.
 * This script includes comprehensive handling for headings, lists (including nested lists),
 * links, and tables. It aims to convert a variety of Markdown syntaxes into corresponding
 * Google Docs elements.
 */

/**
 * Parses and inserts Markdown content into the current Google Doc.
 * @param {string} markdownText - The Markdown text to be converted.
 */
function parseAndInsertMarkdown(markdownText) {
    const lines = markdownText.split('\n');
    const doc = DocumentApp.getActiveDocument();
    const body = doc.getBody();

    let inTable = false;
    let tableLines = [];
    let inBlockquote = false;
    let blockquoteLines = [];
    let inCodeBlock = false;
    let codeBlockText = '';
	
	// Instead of clearing the body, get the current cursor position
    const cursor = doc.getCursor();
    if (cursor) {
        // Insert at cursor position
        const element = cursor.insertText(markdownText);
        if (element) {
            element.setBold(false); // Example of setting initial styling if needed
            // Add more styling as needed
        } else {
            // Fallback to appending content at the end if cursor placement fails
            body.appendParagraph(markdownText);
        }
    } else {
        // If there is no cursor (document isn't open or no selection), append at end
        body.appendParagraph(markdownText);
    }
    // Global storages for footnotes and reference-style links
    let footnotes = {};
    let referenceLinks = {};

    // First pass to extract footnotes and reference-style links
    lines.forEach(line => {
        extractFootnoteDefinition(line);
        extractLinkDefinition(line);
    });

    // Second pass to process and insert content
    lines.forEach((line) => {
        if (line.startsWith('```')) {
            if (inCodeBlock) {
                insertCodeBlock(body, codeBlockText.trim());
                codeBlockText = '';
                inCodeBlock = false;
            } else {
                inCodeBlock = true;
            }
        } else if (inCodeBlock) {
            codeBlockText += line + '\n';
        } else if (line.startsWith('---')) { // Handling horizontal rules
            insertHorizontalRule(body);
        } else if (isImage(line)) {
            if (inBlockquote) {
                blockquoteLines.push(line);
            } else {
                const imageUrl = extractImageUrl(line);
                if (imageUrl) {
                    insertImage(body, imageUrl);
                }
            }
        } else if (isBlockquote(line)) {
            inBlockquote = true;
            blockquoteLines.push(line.replace(/^>\s?/, ''));
        } else if (line.trim() === '' && inBlockquote) {
            insertBlockquote(body, processBlockquote(blockquoteLines));
            blockquoteLines = [];
            inBlockquote = false;
        } else if (isHeading(line)) {
            insertHeading(body, line);
        } else if (isList(line)) {
            insertList(body, line);
        } else if (isTable(line) && !inTable) {
            inTable = true;
            tableLines = [line];
        } else if (!isTable(line) && inTable) {
            insertTable(body, tableLines);
            tableLines = [];
            inTable = false;
        } else if (isTable(line) && inTable) {
            tableLines.push(line);
        } else if (isLink(line)) {
            insertLink(body, line);
        } else {
            // Processing for advanced formatting, footnotes, and reference-style links
            let processedText = processAdvancedFormatting(line);
            processedText = processFootnotesInText(processedText, body);
            processedText = processReferenceLinksInText(processedText);
			insertWithCustomIndentation(body, processedText); // Handles custom indentation
            if (inBlockquote) {
                blockquoteLines.push(processedText);
            } else if (!inTable) {
                body.appendParagraph(processedText);
            }
        }
    });

    // Finalize open elements at the end of the document
    if (inTable) {
        insertTable(body, tableLines);
    }
    if (inBlockquote) {
        insertBlockquote(body, processBlockquote(blockquoteLines));
    }
    if (inCodeBlock) {
        insertCodeBlock(body, codeBlockText.trim());
    }
}

/**
 * Inserts a formatted code block into the Google Doc.
 */
function insertCodeBlock(body, code) {
    const paragraph = body.appendParagraph(code.trim());
    paragraph.setFontFamily('Courier New'); // Or any monospaced font
    paragraph.setLineSpacing(1);
    paragraph.setBackgroundColor('#f7f7f7'); // Light grey background for code block
}

/**
 * Processes inline code by adding asterisks (or any simple styling) since Google Docs
 * does not support background color changes for inline text via Apps Script.
 */
function processInlineCode(line) {
    // This function needs to be implemented based on the limitations of Google Docs API.
    // Here's a placeholder for potentially bolding the inline code.
    return line.replace(/`([^`]+)`/g, (match, p1) => '**' + p1 + '**');
}

// Implement isHeading, isList, isTable, insertHeading, insertList, insertTable, isLink, insertLink, and isBlockquote as previously discussed.

// Additional required functions (isHeading, insertHeading, isList, insertList, isTable, insertTable, isLink, insertLink, isBlockquote, insertBlockquote)
// should be implemented as described in previous steps.


function isHeading(line) {
  return /^#{1,6}\s/.test(line);
}

function insertHeading(body, line) {
  const level = line.match(/^#+/)[0].length;
  const text = line.replace(/^#+\s/, '');
  body.appendParagraph(text).setHeading(DocumentApp.ParagraphHeading["HEADING" + level]);
}

/**
 * Inserts a list item into the Google Doc, supporting nested lists.
 * @param {GoogleAppsScript.Document.Body} body - The body of the document.
 * @param {string} line - The list item text.
 */
function insertList(body, line) {
  const listItemStack = []; // Stack to keep track of list items and their levels
  let currentNestingLevel = 0;

  // Split the document into lines and process each line for list items
  const lines = line.split('\n');

  lines.forEach(line => {
    if (isList(line)) {
      const listDetails = getListDetails(line);
      const text = line.trim().replace(/^(\-|\*|\+|\d+\.)\s/, ''); // Remove Markdown list syntax

      // Adjust the current nesting level based on indentation
      while (listItemStack.length > 0 && listItemStack[listItemStack.length - 1].indentLevel >= listDetails.indentLevel) {
        listItemStack.pop(); // Pop the last list item as we move back up the tree
        currentNestingLevel--;
      }

      let listItem;
      if (listDetails.isOrdered) {
        listItem = body.appendListItem(text).setGlyphType(DocumentApp.GlyphType.NUMBER).setNestingLevel(currentNestingLevel);
      } else {
        listItem = body.appendListItem(text).setGlyphType(DocumentApp.GlyphType.BULLET).setNestingLevel(currentNestingLevel);
      }

      // Add this list item to the stack and adjust the nesting level
      listItemStack.push({ listItem: listItem, indentLevel: listDetails.indentLevel });
      currentNestingLevel = listItemStack.length;
    }
  });
}

/**
 * Determines the list details, including type (ordered/unordered) and indentation level.
 * @param {string} line - A line of text.
 * @return {object} - The list details including indent level and if it's ordered.
 */
function getListDetails(line) {
  const indentLevel = line.match(/^\s*/)[0].length / 2; // Assuming two spaces per indent level
  const isOrdered = /^\s*\d+\./.test(line);
  return { indentLevel, isOrdered };
}

/**
 * Checks if a line is part of a Markdown list (ordered or unordered).
 * @param {string} line - A line of text.
 * @return {boolean} - True if the line is part of a list.
 */
function isList(line) {
  return /^\s*(\-|\*|\+|\d+\.)\s/.test(line);
}


/**
 * Checks if a line is part of a Markdown table.
 * This function now also checks for the separator line that defines alignments.
 * @param {string} line - A line of text.
 * @return {boolean} - True if the line could be part of a table.
 */
function isTable(line) {
  // Enhanced check for table row or separator line
  return /\|/.test(line) && (line.trim().indexOf('|') === 0 || /^[\|\s:\-]+$/.test(line.trim()));
}

/**
 * Inserts a Markdown table into the Google Doc, handling headers, alignment, and body rows.
 * @param {GoogleAppsScript.Document.Body} body - The body of the document.
 * @param {Array<string>} tableLines - An array of strings representing the table.
 */
function insertTable(body, tableLines) {
  // Assume the first line is headers, the second line defines alignment, and subsequent lines are body rows
  if (tableLines.length < 3) return; // A valid table requires at least 3 lines

  const headerLine = tableLines[0].split('|').filter(cell => cell.trim());
  const alignLine = tableLines[1].split('|').filter(cell => cell.trim());
  const alignments = alignLine.map(cell => {
    if (/:-+:/.test(cell)) return DocumentApp.HorizontalAlignment.CENTER;
    else if (/-+:/.test(cell)) return DocumentApp.HorizontalAlignment.RIGHT;
    else return DocumentApp.HorizontalAlignment.LEFT;
  });

  // Create the table in Google Docs
  const table = body.appendTable();
  
  // Insert header row
  const headerRow = table.appendTableRow();
  headerLine.forEach((cellText, columnIndex) => {
    const cell = headerRow.appendTableCell();
    cell.setText(cellText.trim());
    cell.setAttributes({
      HEADING: true,
      HORIZONTAL_ALIGNMENT: alignments[columnIndex] || DocumentApp.HorizontalAlignment.LEFT
    });
  });

  // Insert body rows
  for (let i = 2; i < tableLines.length; i++) { // Start from the third line
    const row = table.appendTableRow();
    const cells = tableLines[i].split('|').filter(cell => cell);
    cells.forEach((cellText, columnIndex) => {
      const cell = row.appendTableCell(cellText.trim());
      cell.setAttributes({
        HORIZONTAL_ALIGNMENT: alignments[columnIndex] || DocumentApp.HorizontalAlignment.LEFT
      });
    });
  }
}

// Global variable to store footnote references and their texts
let footnotes = {};

/**
 * Extracts footnotes from the Markdown text and stores them in a global variable.
 * @param {string} line - A line from the Markdown document.
 */
function extractFootnoteDefinition(line) {
    const match = line.match(/^\[\^(\w+)\]:\s*(.*)$/);
    if (match) {
        footnotes[match[1]] = match[2];
        return true; // Indicates this line is a footnote definition
    }
    return false; // Not a footnote definition
}

/**
 * Inserts footnote content into the Google Doc at the referenced point.
 * @param {GoogleAppsScript.Document.Body} body - The body of the Google Doc.
 * @param {string} identifier - The footnote identifier.
 */
function insertFootnoteContent(body, identifier) {
    if (footnotes[identifier]) {
        const footnote = body.appendFootnote(footnotes[identifier]);
        // Optionally, apply formatting to the footnote if needed
    }
}

/**
 * Processes the text for footnote references and replaces them with Google Docs footnotes.
 * @param {string} text - The text that may contain footnote references.
 * @param {GoogleAppsScript.Document.Body} body - The body of the Google Doc for inserting footnotes.
 * @return {string} The text with footnote references processed.
 */
function processFootnotesInText(text, body) {
    return text.replace(/\[\^(\w+)\]/g, (match, identifier) => {
        insertFootnoteContent(body, identifier);
        return ""; // Remove the Markdown footnote reference from the text
    });
}

// Global variable to store reference-style link definitions
let referenceLinks = {};

/**
 * Extracts reference-style link definitions from the Markdown text.
 * @param {string} line - A line from the Markdown document.
 */
function extractLinkDefinition(line) {
    const match = line.match(/^\[(\w+)\]:\s*(\S+)(?:\s+"(.+)")?$/);
    if (match) {
        referenceLinks[match[1]] = { url: match[2], title: match[3] || "" };
        return true; // Indicates this line is a link definition
    }
    return false; // Not a link definition
}

/**
 * Processes the text for reference-style links and applies them.
 * @param {string} text - The text that may contain reference-style links.
 * @return {string} The text with reference-style links processed.
 */
function processReferenceLinksInText(text) {
    return text.replace(/\[([^\]]+)\]\[(\w+)\]/g, (match, linkText, linkId) => {
        if (referenceLinks[linkId]) {
            // If styling inline is limited, you may opt to just return the URL next to the text or any other placeholder
            return `${linkText} (${referenceLinks[linkId].url})`; // Simplification due to Apps Script limitations
        }
        return linkText; // Fallback if the link ID wasn't found
    });
}


/**
 * Checks if a line is part of a Markdown blockquote.
 * @param {string} line - A line of text.
 * @return {boolean} - True if the line starts with a blockquote marker.
 */
function isBlockquote(line) {
  return /^\s*>/.test(line);
}

/**
 * Inserts a blockquote into the Google Doc.
 * @param {GoogleAppsScript.Document.Body} body - The body of the document.
 * @param {Array<string>} blockquoteLines - The lines of text making up the blockquote.
 */
function insertBlockquote(body, blockquoteLines) {
  // Combine lines into a single paragraph for simplicity
  // More complex handling might be needed for blockquotes containing other Markdown elements
  const blockquoteText = blockquoteLines.join('\n');
  const paragraph = body.appendParagraph(blockquoteText);
  
  // Example styling for blockquotes
  paragraph.setIndentStart(36); // Indent blockquote text
  paragraph.setLineSpacing(1.2);
  paragraph.setBackgroundColor('#f8f8f8'); // Light gray background
}

/**
 * Checks if a line contains Markdown image syntax.
 */
function isImage(line) {
    return /!\[.*\]\(.*\)/.test(line);
}

/**
 * Extracts the image URL from a Markdown image syntax line.
 */
function extractImageUrl(line) {
    const match = line.match(/!\[.*\]\((.*)\)/);
    return match ? match[1] : null;
}

/**
 * Inserts an image into the Google Doc at the current position.
 */
function insertImage(body, imageUrl) {
    // Inserting the image
    try {
        const image = UrlFetchApp.fetch(imageUrl).getBlob();
        body.appendImage(image);
    } catch (e) {
        Logger.log("Error fetching or inserting image: " + e.toString());
        // Optionally append a placeholder text or log the error
    }
}

/**
 * Process a line of text to detect and format bold, italic, and strikethrough.
 * @param {string} line - A line of Markdown text.
 * @return {string} The formatted line.
 */
function processAdvancedFormatting(line) {
    // Simulated formatting due to Google Apps Script limitations
    line = line.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>'); // Simulate bold
    line = line.replace(/__(.*?)__/g, '<b>$1</b>'); // Another way to simulate bold
    line = line.replace(/\*(.*?)\*/g, '<i>$1</i>'); // Simulate italic
    line = line.replace(/_(.*?)_/g, '<i>$1</i>'); // Another way to simulate italic
    line = line.replace(/~~(.*?)~~/g, '<strike>$1</strike>'); // Simulate strikethrough

    return line;
}

/**
 * Inserts a horizontal rule into the Google Doc.
 * @param {GoogleAppsScript.Document.Body} body - The body of the document.
 */
function insertHorizontalRule(body) {
    body.appendHorizontalRule();
}

/**
 * Inserts text with special formatting, e.g., subscript or superscript.
 * @param {GoogleAppsScript.Document.Body} body - The body of the document.
 * @param {string} text - The text to format.
 * @param {string} formatType - The type of formatting to apply ('subscript', 'superscript').
 */
function insertSpecialFormattedText(body, text, formatType) {
    const paragraph = body.appendParagraph(text);
    // Example: applying superscript to the entire paragraph
    if (formatType === 'superscript') {
        paragraph.editAsText().setSuperscript(0, text.length - 1, true);
    } else if (formatType === 'subscript') {
        paragraph.editAsText().setSubscript(0, text.length - 1, true);
    }
    // Add more conditions for other formatting types as needed
}

/**
 * Increases the left margin of a paragraph based on its indentation level.
 * This function assumes that each level of indentation is represented by two spaces in Markdown.
 * @param {GoogleAppsScript.Document.Body} body - The body of the document.
 * @param {string} line - The line of text to insert.
 */
function insertWithCustomIndentation(body, line) {
    const indentLevel = (line.match(/^(\s+)/) || [''])[0].length / 2; // Assuming two spaces per indent level
    const marginSize = 36; // Example size in points for each indentation level
    const text = line.trim();
    const paragraph = body.appendParagraph(text);
    paragraph.setIndentStart(marginSize * indentLevel);
}


