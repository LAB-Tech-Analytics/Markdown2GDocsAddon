# Markdown to Google Docs Add-on

The Markdown to Google Docs Add-on is designed to convert Markdown formatted text into Google Docs format, supporting a wide range of Markdown elements including headings, lists, tables, blockquotes, inline and block code, images, and more.

## Current State

The add-on includes several key scripts and files:
- `Code.js`: The main Google Apps Script file that integrates the add-on with Google Docs, including creating custom menus and dialog boxes.
- `Dialog.html`: A dialog for users to input Markdown text.
- `Styles.html`: CSS styles for the dialog.
- `MarkdownParser.js`: Core logic for parsing Markdown and creating corresponding Google Docs elements.
- `Utils.js`: Utility functions supporting the main parsing logic, including error handling and debugging.

### Features

- **Basic Markdown Elements**: Headings, lists (unordered, ordered), and links.
- **Advanced Markdown Elements**: Tables (with basic support for headers and alignment), blockquotes, inline and block code, and images.
- **Custom Formatting**: Handling of footnotes, reference-style links, and horizontal rules.

## Usage

1. **Opening the Add-on**: Once installed, the add-on can be accessed from the Google Docs menu under "Markdown Converter".
2. **Converting Markdown**: Users can paste their Markdown text into the provided dialog box and click the "Convert" button to apply the formatting to their current Google Docs document.

## Limitations

- **Inline Styling**: Due to the limitations of Google Apps Script, certain inline styles like bold and italic within block elements (e.g., within lists or blockquotes) may not be accurately represented.
- **Complex Tables**: Advanced table features such as colspan, rowspan, and custom cell formatting are not supported.
- **Nested Markdown Elements**: The current implementation may not correctly handle complex nested Markdown elements within blockquotes or lists.

## Future Implementations Suggestions

- **Enhanced Table Support**: Implement advanced features for tables including column span, row span, and more sophisticated alignment options.
- **Nested Elements**: Improve parsing logic to accurately handle nested Markdown elements, particularly within blockquotes and lists.
- **Performance Optimization**: For large documents or complex Markdown text, performance optimizations may be necessary to ensure a smooth user experience.
- **Inline Styling Enhancements**: Explore workarounds or alternative approaches to better support inline styling within Google Docs limitations.

## Testing

- **Unit Tests**: Developing a suite of unit tests for key functions within `MarkdownParser.js` and `Utils.js` to ensure reliability and handle edge cases.
- **Integration Tests**: Testing the integration with Google Docs, especially for complex documents, to identify and address any issues with real-world usage scenarios.

Contributions, bug reports, and feature requests are welcome to help improve the add-on. For detailed instructions on contributing or reporting issues, please refer to the project's GitHub repository.

---

This README aims to provide a clear overview of the add-on's capabilities, setup, and use. For more detailed documentation on specific features or development guidelines, please refer to the accompanying documentation in the project repository.
