# SEO JavaScript Dependency Analyzer

A Chrome extension that helps SEO professionals analyze how JavaScript affects webpage rendering and SEO performance.

## Features

- Side-by-side preview of pages with and without JavaScript
- Detailed analysis of JavaScript dependencies
- Framework detection (React, Vue, Angular, Next.js, Gatsby)
- Dynamic content analysis
- SEO recommendations

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the directory containing this extension

## Usage

1. Navigate to any webpage you want to analyze
2. Click the extension icon in your Chrome toolbar
3. Click "Show Side-by-Side Preview" to see how the page renders with and without JavaScript
4. Click "Show Analysis Details" to view detailed information about:
   - JavaScript dependencies
   - Framework detection
   - Dynamic content analysis
   - SEO recommendations

## Note About Icons

The current version uses placeholder icons. For production use, you should replace the icons in the `icons` directory with your own custom icons in the following sizes:
- 16x16 pixels (icons/icon16.png)
- 48x48 pixels (icons/icon48.png)
- 128x128 pixels (icons/icon128.png)

## Development

The extension consists of the following files:
- `manifest.json`: Extension configuration
- `popup.html`: Extension popup interface
- `popup.js`: Popup interaction logic
- `content.js`: Page analysis and preview functionality

## Contributing

Feel free to submit issues and enhancement requests! 