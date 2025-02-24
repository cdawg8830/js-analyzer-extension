let isPreviewActive = false;

/**
 * Simple utility to format times in ms or s.
 */
function formatTime(ms) {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Map performance timing to color-coded classes for display.
 */
function getPerformanceClass(timing) {
  if (timing < 1000) return 'performance-good';
  if (timing < 3000) return 'performance-warning';
  return 'performance-poor';
}

/**
 * Updates the popup with the analysis results.
 */
function updateAnalysisContent(analysis) {
  const dependencyClass = {
    'High': 'dependency-high',
    'Medium': 'dependency-medium',
    'Low': 'dependency-low',
    'Unknown': 'dependency-unknown'
  };

  const content = document.getElementById('analysis-content');
  
  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  let {
    renderingType = 'Unknown',
    dependencyLevel = 'Unknown',
    scripts = 0,
    frameworks = [],
    performance = {},
    links = { total: 0, jsLinks: 0, htmlLinks: 0, brokenLinks: 0 },
    seoIssues = [],
    dynamicContent = 0
  } = analysis;

  const formattedFrameworks = frameworks.length > 0
    ? Array.from(new Set(frameworks)).sort().join(', ')
    : 'None detected';

  // Build quick summary
  const summaryHtml = `
    <div class="analysis-section">
      <h3>Quick Summary</h3>
      <div class="stat">
        <span class="stat-label">JavaScript Dependency</span>
        <span class="stat-value ${dependencyClass[dependencyLevel]}">${dependencyLevel}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Script Tags</span>
        <span class="stat-value">${scripts}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Dynamic Elements</span>
        <span class="stat-value">${dynamicContent}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Frameworks</span>
        <span class="stat-value">${escapeHtml(formattedFrameworks)}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Rendering Type</span>
        <span class="stat-value">${renderingType}</span>
      </div>
    </div>
  `;

  // Performance
  let performanceHtml = '';
  if (performance.timing) {
    const { loadTime, firstPaint, firstContentfulPaint } = performance.timing;
    performanceHtml = `
      <div class="analysis-section">
        <h3>Performance Metrics</h3>
        <div class="stat">
          <span class="stat-label">Load Time</span>
          <span class="stat-value ${getPerformanceClass(loadTime)}">
            ${formatTime(loadTime)}
          </span>
        </div>
        <div class="stat">
          <span class="stat-label">First Paint</span>
          <span class="stat-value ${getPerformanceClass(firstPaint)}">
            ${formatTime(firstPaint)}
          </span>
        </div>
        <div class="stat">
          <span class="stat-label">First Contentful Paint</span>
          <span class="stat-value ${getPerformanceClass(firstContentfulPaint)}">
            ${formatTime(firstContentfulPaint)}
          </span>
        </div>
        <div class="stat">
          <span class="stat-label">Resources</span>
          <span class="stat-value">
            JS: ${performance.resources.js} | 
            CSS: ${performance.resources.css} | 
            Images: ${performance.resources.images}
          </span>
        </div>
      </div>
    `;
  }

  // Link analysis
  const linkAnalysisHtml = `
    <div class="analysis-section">
      <h3>Link Analysis</h3>
      <div class="link-analysis">
        <div class="link-stat">
          <div class="link-stat-value">${links.total}</div>
          <div class="link-stat-label">Total Links</div>
        </div>
        <div class="link-stat">
          <div class="link-stat-value">${links.htmlLinks}</div>
          <div class="link-stat-label">HTML Links</div>
        </div>
        <div class="link-stat">
          <div class="link-stat-value">${links.jsLinks}</div>
          <div class="link-stat-label">JS Links</div>
        </div>
        <div class="link-stat">
          <div class="link-stat-value ${links.brokenLinks > 0 ? 'dependency-high' : ''}">
            ${links.brokenLinks}
          </div>
          <div class="link-stat-label">Broken Links</div>
        </div>
      </div>
    </div>
  `;

  // SEO issues & recommendations
  const seoIssuesHtml = seoIssues.map(issue => {
    const parts = issue.split(' - ');
    const mainIssue = escapeHtml(parts[0] || '');
    const recommendation = parts[1] ? `<br><small>${escapeHtml(parts[1])}</small>` : '';
    return `
      <div class="stat" style="margin-bottom: 8px;">
        <span class="stat-value" style="display: flex; align-items: flex-start;">
          <span style="color: #ff4d4d; margin-right: 8px;">*</span>
          <span style="flex-grow: 1;">
            ${mainIssue}
            ${recommendation}
          </span>
        </span>
      </div>
    `;
  }).join('');

  let seoHtml = '';
  if (seoIssuesHtml) {
    seoHtml = `
      <div class="analysis-section">
        <h3>SEO Issues</h3>
        ${seoIssuesHtml}
      </div>
    `;
  }

  content.innerHTML = [
    summaryHtml,
    performanceHtml,
    // linkAnalysisHtml,  // Commented out to hide link analysis
    seoHtml
  ].join('\n');
}

/**
 * Send a message to content.js to run the analysis, then display the results.
 */
function runAnalysis() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    chrome.tabs.sendMessage(activeTab.id, { action: 'analyze' }, (response) => {
      if (!response) {
        document.getElementById('analysis-content').innerHTML = `
          <div style="color: #ff4d4d;">
            Unable to analyze this page. Are you on a valid tab?
          </div>
        `;
        return;
      }
      updateAnalysisContent(response);
    });
  });
}

/**
 * Toggles the preview (split view) between JS-enabled and JS-disabled iframes
 * by messaging the content script to inject one or the other.
 */
function togglePreview() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0] || !tabs[0].url || tabs[0].url.startsWith('chrome://')) {
      return;
    }

    if (isPreviewActive) {
      // Hide preview
      chrome.tabs.sendMessage(tabs[0].id, { action: 'removePreview' });
      isPreviewActive = false;
      document.getElementById('togglePreview').innerText = 'Toggle Split View';
    } else {
      // Show preview
      chrome.tabs.sendMessage(tabs[0].id, { action: 'showPreview' });
      isPreviewActive = true;
      document.getElementById('togglePreview').innerText = 'Close Split View';
    }
  });
}

/**
 * Exports the displayed analysis data as a PDF (using jsPDF).
 */
function exportPDF() {
  // Example of how you might gather content from the popup and generate PDF.
  const analysisEl = document.getElementById('analysis-content');
  const doc = new jsPDF.jsPDF();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text("Clif's JavaScript Analyzer - Report", 14, 20);
  doc.setFontSize(10);
  doc.text(analysisEl.innerText, 14, 30, { maxWidth: 180 });
  
  doc.save('analysis_report.pdf');
}

// Initialize popup
document.addEventListener('DOMContentLoaded', function() {
  // Set up button listeners
  document.getElementById('togglePreview').addEventListener('click', togglePreview);
  document.getElementById('exportPDF').addEventListener('click', exportPDF);

  // Show loading state
  const content = document.getElementById('analysis-content');
  content.innerHTML = `
    <div class="analysis-section">
      <h3>Analyzing page...</h3>
      <div class="stat">
        <span class="stat-value">Please wait while we analyze the JavaScript content...</span>
      </div>
    </div>
  `;

  // Listen for analysis results
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'analysisResult') {
      if (message.error) {
        content.innerHTML = `
          <div class="analysis-section">
            <h3>Error</h3>
            <div class="stat">
              <span class="stat-value">${message.message || 'Analysis failed. Please try again.'}</span>
            </div>
          </div>
        `;
      } else {
        updateAnalysisContent(message.result);
      }
    }
  });

  // Get current state and analysis
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (!tabs[0] || !tabs[0].url || tabs[0].url.startsWith('chrome://')) {
      content.innerHTML = `
        <div class="analysis-section">
          <h3>Error</h3>
          <div class="stat">
            <span class="stat-value">Cannot analyze this page. Please try on a regular web page.</span>
          </div>
        </div>
      `;
      return;
    }

    // Request analysis
    chrome.tabs.sendMessage(tabs[0].id, {action: 'getAnalysis'});
  });
});
