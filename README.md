# JavaScript Rendering Analyzer

A Chrome extension that analyzes web pages to determine their rendering approach (Static, Server-Side Rendering, or Client-Side Rendering) and JavaScript dependency level.

## Features

- **Rendering Type Detection**: Accurately identifies whether a page uses:
  - Static HTML
  - Server-Side Rendering (SSR)
  - Client-Side Rendering (CSR)
  - Shows percentage breakdown of each approach

- **Framework Detection**: Identifies popular JavaScript frameworks and meta-frameworks:
  - React & Next.js
  - Vue & Nuxt.js
  - Angular & Universal
  - Svelte & SvelteKit
  - And more...

- **JavaScript Dependency Analysis**:
  - Measures JavaScript resource usage
  - Analyzes runtime behavior
  - Provides dependency level (Low/Medium/High)

- **SEO Impact Analysis**:
  - Evaluates content accessibility
  - Checks meta tags and structure
  - Provides SEO recommendations

- **No-JavaScript Preview**:
  - Shows how the page appears without JavaScript
  - Simulates search engine crawler view
  - Compares initial vs. final content

## Installation

1. Download the extension from the Chrome Web Store
2. Click the extension icon in your Chrome toolbar
3. Grant necessary permissions when prompted

## Usage

1. Visit any web page you want to analyze
2. Click the extension icon
3. View the detailed analysis in the popup
4. Click "Show No-JS View" to see how the page appears without JavaScript

## Technical Details

The extension analyzes pages using multiple factors:

- Framework detection through DOM markers and global objects
- Content ratio comparison between initial and final HTML
- Resource usage analysis
- Runtime behavior monitoring

## Privacy & Permissions

This extension:
- Only analyzes the currently active tab
- Does not collect or transmit any data
- Does not modify page content (except when showing the no-JS preview)
- Requires minimal permissions (activeTab, scripting)

## Support

For issues or feature requests, please visit our GitHub repository.

## License

MIT License - See LICENSE file for details 