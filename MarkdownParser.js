// Assumes MarkdownUtils.js is available and properly modularized

/**
 * Entry point for parsing and inserting Markdown into Google Docs.
 * @param {string} markdownText - The Markdown text to be converted and inserted.
 */
function parseAndInsertMarkdown(markdownText) {
    const doc = DocumentApp.getActiveDocument();
    const body = doc.getBody();
    const cursor = doc.getCursor();
    let position = cursor ? cursor.getSurroundingTextOffset() : body.getText().length;

    // Split the Markdown text into lines for line-by-line processing
    const lines = markdownText.split('\n');
    let context = { inList: false, listLevel: 0, inTable: false, inBlockquote: false, inCodeBlock: false };

    lines.forEach((line, index) => {
        // Determine the context and type of the line (e.g., heading, list)
        let type = MarkdownUtils.determineLineType(line, context);

        // Based on the line type, call the appropriate function in MarkdownUtils
        // Each function is responsible for parsing its content and inserting it into the document
        // The functions also update the cursor position accordingly
        switch (type) {
            case 'heading':
                position = MarkdownUtils.insertHeading(line, body, position);
                break;
            case 'paragraph':
                position = MarkdownUtils.insertParagraph(line, body, position, context);
                break;
            case 'list':
                position = MarkdownUtils.insertList(line, body, position, context);
                break;
            case 'table':
                if (context.inTable || MarkdownUtils.isTableSeparator(line)) {
                    position = MarkdownUtils.insertTable(line, body, position, context, lines, index);
                }
                break;
            case 'blockquote':
                position = MarkdownUtils.insertBlockquote(line, body, position, context);
                break;
            case 'codeBlock':
                position = MarkdownUtils.insertCodeBlock(line, body, position, context);
                break;
            case 'horizontalRule':
                position = MarkdownUtils.insertHorizontalRule(body, position);
                break;
            // Additional cases for footnotes, reference links, etc.
            default:
                position = MarkdownUtils.insertFormattedText(body, line, position, context); // Fallback for any non-matched types
        }
    });

    // Ensure contextually open elements like tables or lists are properly closed
    MarkdownUtils.finalizeOpenElements(body, position, context);
}
