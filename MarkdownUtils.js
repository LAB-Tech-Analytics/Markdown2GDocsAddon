/**
 * MarkdownUtils.js
 * Implements parsing and insertion of various Markdown elements into Google Docs.
 */

const regex = {
    heading: /^(#+)\s+(.*)/,
    listItem: /^(\s*)([*\-+]|\d+\.)\s+(.*)/,
    boldItalic: /(\*\*\*|___)(.*?)\1/g,
    bold: /(\*\*|__)(.*?)\1/g,
    italic: /(\*|_)(.*?)\1/g,
    strikethrough: /~~(.*?)~~/g,
    blockquote: /^>\s*(.*)/,
    codeBlock: /^```/,
    horizontalRule: /^-{3,}$/,
    link: /\[([^\]]+)\]\(([^)]+)\)/g,
    footnote: /^\[\^(\w+)\]:\s*(.*)/,
    table: /^\|(.+)\|$/,
    tableSeparator: /^\|(:?-+:?)+\|$/,
    special: /(\^{1,2}|\~{1,2})(.*?)\1/g
};


const MarkdownUtils = {
	
	/**
 * Determines the type of the current line of Markdown text based on predefined regex patterns.
 * @param {string} line - The current line of Markdown text.
 * @param {Object} context - The current parsing context, including state about lists, blockquotes, etc.
 * @return {string} - The determined line type.
 */
	determineLineType: function(line, context) {
		// Check for code blocks first, as they can contain any other syntax without it being parsed
		if (context.inCodeBlock) {
			if (regex.codeBlock.test(line)) {
				context.inCodeBlock = false; // Exiting a code block
				return 'codeBlockEnd';
			}
			return 'codeBlockContent';
		} else if (regex.codeBlock.test(line)) {
			context.inCodeBlock = true; // Entering a code block
			return 'codeBlockStart';
		}
	// Check for other types, noting that some types (like lists and blockquotes) may have nested content
		if (regex.heading.test(line)) {
			return 'heading';
		} else if (regex.listItem.test(line)) {
			// Further context analysis could be added here for nested lists
			return 'listItem';
		} else if (regex.blockquote.test(line)) {
			// Blockquotes can contain other types, so this might initiate a nested parsing context
			return 'blockquote';
		} else if (regex.horizontalRule.test(line)) {
			return 'horizontalRule';
		} else if (regex.table.test(line) || regex.tableSeparator.test(line)) {
			// Table detection could initiate a table parsing context
			return 'table';
		} else if (regex.footnote.test(line)) {
			return 'footnote';
		} else if (regex.link.test(line)) {
			return 'link';
		} else {
			// Default case for text that doesn't match any special pattern
			// This could be plain text or contain inline formatting like bold or italic
			return 'paragraph';
		}
	},

    /**
     * Inserts formatted text into the Google Docs document at the current cursor position.
     * This function handles various formatting styles by applying corresponding Google Docs styles.
     * @param {GoogleAppsScript.Document.Body} body - The body element of the Google Docs document.
     * @param {string} text - The text to be inserted.
     * @param {number} position - The current position in the document where text will be inserted.
     * @param {Object} context - The current parsing context, including state about lists, blockquotes, etc.
     * @return {number} - The new position after inserting the text.
     */
	/**
	 * Inserts formatted text into the Google Docs document at the current cursor position.
	 * Note: Google Apps Script does not support direct insertion at a specific index position.
	 *       This function simulates it for the purpose of this example.
	 */
	insertFormattedText: function(body, text, position, context) {
		let element = body.appendParagraph(text);

		// Apply basic formatting based on regex matches
		// Note: This approach simplifies complex Markdown scenarios.
		if (text.match(regex.boldItalic)) {
			text = text.replace(regex.boldItalic, (match, p1, p2) => {
				element.editAsText().setBold(true).setItalic(true);
				return p2;
			});
		}
		if (text.match(regex.bold)) {
			text = text.replace(regex.bold, (match, p1, p2) => {
				element.editAsText().setBold(true);
				return p2;
			});
		}
		if (text.match(regex.italic)) {
			text = text.replace(regex.italic, (match, p1, p2) => {
				element.editAsText().setItalic(true);
				return p2;
			});
		}
		if (text.match(regex.strikethrough)) {
			text = text.replace(regex.strikethrough, (match, p1) => {
				element.editAsText().setStrikethrough(true);
				return p1;
			});
		}

		// Apply link formatting
		if (text.match(regex.link)) {
			text = text.replace(regex.link, (match, linkText, url) => {
				const startIndex = element.getText().indexOf(linkText);
				const endIndex = startIndex + linkText.length;
				element.editAsText().setLinkUrl(startIndex, endIndex - 1, url);
				return linkText;
			});
		}

		// For demonstration, `position` and `context` are not utilized in changing insertion behavior,
		// as Google Apps Script's Document model doesn't directly support inserting at arbitrary positions.
		// In a more complex implementation, `context` could be used to track nested structures.
		
		return position + 1; // Simulate advancing the position
	},

    /**
	 * Insertion function implementations for various Markdown elements.
	 */


	insertHeading: function(line, body, position) {
		const match = line.match(regex.heading);
		const level = match[1].length; // Number of '#' characters
		let text = match[2];
		const heading = body.appendParagraph(text);
		heading.setHeading(DocumentApp.ParagraphHeading['HEADING' + level]);

		// Apply basic formatting
		this.applyBasicFormatting(heading, text);
	},
	
	
	applyBasicFormatting: function(element, text) {
		// Bold and Italic
		[...text.matchAll(regex.boldItalic)].forEach(match => {
			const {startIndex, endIndex} = this.calculateMatchIndices(element.getText(), match[2]);
			element.editAsText().setBold(startIndex, endIndex, true).setItalic(startIndex, endIndex, true);
		});

		// Bold
		[...text.matchAll(regex.bold)].forEach(match => {
			const {startIndex, endIndex} = this.calculateMatchIndices(element.getText(), match[2]);
			element.editAsText().setBold(startIndex, endIndex, true);
		});

		// Italic
		[...text.matchAll(regex.italic)].forEach(match => {
			const {startIndex, endIndex} = this.calculateMatchIndices(element.getText(), match[2]);
			element.editAsText().setItalic(startIndex, endIndex, true);
		});

		// Strikethrough
		[...text.matchAll(regex.strikethrough)].forEach(match => {
			const {startIndex, endIndex} = this.calculateMatchIndices(element.getText(), match[1]);
			element.editAsText().setStrikethrough(startIndex, endIndex, true);
		});
	},


	calculateMatchIndices: function(fullText, matchText) {
		const startIndex = fullText.indexOf(matchText);
		const endIndex = startIndex + matchText.length - 1;
		return {startIndex, endIndex};
	},


	insertParagraph: function(line, body, position, context) {
		const paragraph = body.appendParagraph(line);
		// Apply inline formatting if necessary
		this.applyBasicFormatting(paragraph, line);
	},


	insertList: function(line, body, position, context) {
		const match = line.match(regex.listItem);
		if (!match) return; // Early exit if the line does not match list item pattern

		const indentLevel = match[1].length / 2; // Assuming two spaces per indent level for nesting
		let text = match[3]; // Extract the text part of the list item
		
		// Append the list item to the document
		const listItem = body.appendListItem('');

		// Apply the basic formatting to the list item text
		// Note: Google Apps Script does not allow direct formatting application on list items like paragraphs.
		// Therefore, we simulate this by applying formatting to a temporary paragraph, then setting the list item's text.
		let tempParagraph = body.appendParagraph(text);
		this.applyBasicFormatting(tempParagraph, text);
		
		// Extract the fully formatted text from the temporary paragraph
		// This workaround is necessary due to limitations in Google Apps Script's API
		let formattedText = tempParagraph.getText();
		
		// Set the formatted text and remove the temporary paragraph
		listItem.setText(formattedText);
		body.removeChild(tempParagraph);

		// Set nesting level for hierarchical list structures
		listItem.setNestingLevel(indentLevel);
		
		// Determine and set list item glyph type based on the marker (*, -, +, or digit.)
		if (match[2].trim().match(/^\d+\.$/)) {
			listItem.setGlyphType(DocumentApp.GlyphType.NUMBER);
		} else {
			listItem.setGlyphType(DocumentApp.GlyphType.BULLET);
		}
	},

	insertTable: function(line, body, position, context, lines, index) {
		// Initialize table parsing if not already in progress
		if (!context.inTable) {
			context.inTable = true;
			context.tableData = []; // Store table rows for processing
		}

		// Check for the end of the table or process the line
		if (regex.tableSeparator.test(line)) {
			// This line is a separator for column alignment, optionally store this for later
		} else if (line.trim() === '' || index === lines.length - 1 || !regex.table.test(lines[index + 1])) {
			// Empty line or last line of the document or next line is not a table line, indicating the end of the table
			context.tableData.push(line); // Add the current line to the table data
			
			// Create the table in Google Docs
			let table = body.appendTable();
			for (let rowData of context.tableData) {
				let row = table.appendTableRow();
				let cellData = rowData.split('|').filter(cell => cell.trim() !== ''); // Split the row into cells and filter out empty cells
				
				for (let cellText of cellData) {
					let cell = row.appendTableCell('');

					// Apply basic formatting to each cell
					let tempParagraph = body.appendParagraph(cellText.trim());
					this.applyBasicFormatting(tempParagraph, cellText);
					let formattedText = tempParagraph.getText();
					body.removeChild(tempParagraph); // Clean up temporary paragraph

					cell.setText(formattedText);
				}
			}

			// Reset table parsing context
			context.inTable = false;
			context.tableData = [];
		} else {
			// Still within the table, add line to tableData for later processing
			context.tableData.push(line);
		}
	},


	insertBlockquote: function(line, body, position, context) {
		const match = line.match(regex.blockquote);
		if (!match) return; // If the line doesn't match the blockquote pattern, exit the function

		const text = match[1];
		// Append a new paragraph for the blockquote
		const blockquote = body.appendParagraph('');

		// Apply basic formatting to the blockquote text using a temporary paragraph
		let tempParagraph = body.appendParagraph(text);
		this.applyBasicFormatting(tempParagraph, text);

		// Extract the fully formatted text from the temporary paragraph
		let formattedText = tempParagraph.getText();

		// Set the formatted text to the blockquote paragraph and remove the temporary paragraph
		blockquote.setText(formattedText);
		body.removeChild(tempParagraph);

		// Simulate blockquote formatting by setting the left indent (Google Docs doesn't have a native blockquote style)
		blockquote.setIndentFirstLine(0).setIndentStart(36); // Adjust values as needed for your styling preferences
		blockquote.setLineSpacing(1.15); // Optional: Adjust line spacing for the blockquote

		// Optionally, set a different text style for visual distinction
		blockquote.setFontFamily("Arial").setForegroundColor("#666666"); // Example styling
	},


	insertCodeBlock: function(line, body, position, context) {
		if (context.inCodeBlock) {
			// Check if we're exiting the code block
			if (regex.codeBlock.test(line)) {
				// Exiting a code block, insert the accumulated text
				if (context.codeBlockText !== '') {
					const codeBlock = body.appendParagraph(context.codeBlockText.trim());
					codeBlock.setFontFamily("Courier New"); // Use a monospace font
					codeBlock.setAttributes({
						[DocumentApp.Attribute.FONT_SIZE]: 10, // Smaller font size for code
						[DocumentApp.Attribute.BACKGROUND_COLOR]: "#f8f8f8" // Light grey background
					});
					context.codeBlockText = ''; // Reset for the next code block
				}
				context.inCodeBlock = false;
			} else {
				// Still within a code block, accumulate the text
				context.codeBlockText += line + "\n";
			}
		} else if (regex.codeBlock.test(line)) {
			// Entering a new code block context
			context.inCodeBlock = true;
			context.codeBlockText = ''; // Initialize storage for code block content
		}
	},


	insertHorizontalRule: function(body, position) {
		body.appendHorizontalRule();
	},


    /**
     * Finalizes any open elements that require closure or additional processing after all lines have been parsed.
     * This function is called after the main parsing loop to ensure all document elements are correctly finalized.
     * @param {GoogleAppsScript.Document.Body} body - The body element of the Google Docs document.
     * @param {number} position - The current position in the document.
     * @param {Object} context - The current parsing context, including state about open elements.
     */
	finalizeOpenElements: function(body, position, context) {
		// Finalize code block if open.
		if (context.inCodeBlock && context.codeBlockText !== '') {
			const codeBlock = body.appendParagraph(context.codeBlockText.trim());
			codeBlock.setFontFamily("Courier New");
			codeBlock.setAttributes({
				[DocumentApp.Attribute.FONT_SIZE]: 10,
				[DocumentApp.Attribute.BACKGROUND_COLOR]: "#f8f8f8"
			});
			context.inCodeBlock = false;
			context.codeBlockText = '';
		}

		// Example finalization for nested lists.
		if (context.currentListLevel > 0) {
			// Assuming we were tracking the current nesting level of lists in context.currentListLevel
			// Since Google Docs handles list continuation automatically, there might not be a need for explicit finalization,
			// but if we had temporary structures or counters, we'd reset them here.
			context.currentListLevel = 0; // Reset list nesting level
		}

		// Example finalization for blockquotes.
		if (context.inBlockquote) {
			// If we were using a flag like context.inBlockquote to track blockquote parsing,
			// we'd reset it here since Google Docs doesn't require explicit blockquote closing.
			context.inBlockquote = false; // Reset blockquote parsing state
			// Note: Any special indentation or styling adjustments would have been applied line-by-line during parsing.
		}

		// Example: Reset table parsing state
		if (context.inTable) {
			context.inTable = false;
			// If there were temporary structures for accumulating table rows or cells, reset them here.
			context.tableRows = [];
		}

		// Example: Reset special formatting flags
		// If your parsing process includes flags for handling special formatting (e.g., within blockquotes or lists),
		// ensure they're reset here.
		context.inSpecialFormatting = false;

		// Reset any custom counters or flags used for managing the document structure or formatting
		context.customCounter = 0; // Hypothetical example

		// If you're tracking the insertion position manually, you might want to update or reset it as well
		context.insertionPosition = position; // Reset or update based on final content

		// Reset or clear any other temporary structures or context information
		// This might include flags for specific formatting states, temporary content accumulators, etc.
		// Example:
		context.tempContent = '';

		// Note: The specifics of what needs to be reset will depend on your parsing logic and the complexity of your Markdown support.

	},



};

// Export MarkdownUtils for use in other modules if necessary
