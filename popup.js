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
    dynamicContent = 0,
    renderingScores = { static: 0.33, ssr: 0.33, csr: 0.34 },
    dependencyScore = 0.5
  } = analysis;

  const formattedFrameworks = frameworks.length > 0
    ? Array.from(new Set(frameworks)).sort().join(', ')
    : 'None detected';
    
  // Build rendering type visualization
  const staticPercent = Math.round(renderingScores.static * 100);
  const ssrPercent = Math.round(renderingScores.ssr * 100);
  const csrPercent = Math.round(renderingScores.csr * 100);
  
  const renderingVisualization = `
    <div class="stat">
      <span class="stat-label">Rendering Spectrum</span>
      <div class="stat-value" style="display: block; margin-top: 5px;">
        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; color: #888;">
          <span>Static (${staticPercent}%)</span>
          <span>SSR (${ssrPercent}%)</span>
          <span>CSR (${csrPercent}%)</span>
        </div>
        <div style="display: flex; height: 8px; border-radius: 4px; overflow: hidden; background: #2d2d2d;">
          <div style="background: #4caf50; height: 100%; width: ${staticPercent}%;"></div>
          <div style="background: #17a2b8; height: 100%; width: ${ssrPercent}%;"></div>
          <div style="background: #ff4d4d; height: 100%; width: ${csrPercent}%;"></div>
        </div>
      </div>
    </div>
  `;
  
  // Build dependency visualization as a bar rather than a label
  const dependencyBar = `
    <div class="stat">
      <span class="stat-label">JavaScript Dependency</span>
      <div class="stat-value" style="display: block; margin-top: 5px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
          <span class="badge ${dependencyClass[dependencyLevel]}" style="font-size: 12px;">${dependencyLevel}</span>
          <span style="font-size: 12px; color: #888;">${Math.round(dependencyScore * 100)}% dependency</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px; color: #888;">
          <span>Low</span>
          <span>Medium</span>
          <span>High</span>
        </div>
        <div style="background: #2d2d2d; height: 8px; border-radius: 4px; position: relative;">
          <div style="position: absolute; height: 100%; width: 100%;">
            <div style="background: linear-gradient(to right, #4caf50, #ffd700, #ff4d4d); height: 100%; border-radius: 4px; opacity: 0.8;"></div>
          </div>
          <div style="position: absolute; top: -4px; height: 16px; width: 2px; background: #fff; border-radius: 1px; left: ${Math.min(100, Math.round(dependencyScore * 100))}%;"></div>
        </div>
      </div>
    </div>
  `;

  // Build quick summary
  const summaryHtml = `
    <div class="analysis-section">
      <h3>Quick Summary</h3>
      ${renderingVisualization}
      ${dependencyBar}
      <div class="stat" style="margin-top: 12px;">
        <span class="stat-label">Script Tags</span>
        <span class="stat-value">${scripts}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Frameworks</span>
        <span class="stat-value">${escapeHtml(formattedFrameworks)}</span>
      </div>
    </div>
  `;

  // Performance
  let performanceHtml = '';
  if (performance.timing) {
    const { loadTime, firstPaint, firstContentfulPaint, largestContentfulPaint, timeToInteractive } = performance.timing;
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
        </div>`;
        
    // Add LCP if available
    if (largestContentfulPaint) {
      performanceHtml += `
        <div class="stat">
          <span class="stat-label">Largest Contentful Paint</span>
          <span class="stat-value ${getPerformanceClass(largestContentfulPaint)}">
            ${formatTime(largestContentfulPaint)}
          </span>
        </div>`;
    }
    
    // Add TTI if available
    if (timeToInteractive) {
      performanceHtml += `
        <div class="stat">
          <span class="stat-label">Time to Interactive</span>
          <span class="stat-value ${getPerformanceClass(timeToInteractive)}">
            ${formatTime(timeToInteractive)}
          </span>
        </div>`;
    }
    
    // Add resource sizes if available
    if (performance.resources.totalTransferSize) {
      const transferSize = (performance.resources.totalTransferSize / 1024).toFixed(1);
      const decodedSize = (performance.resources.totalDecodedSize / 1024).toFixed(1);
      
      performanceHtml += `
        <div class="stat">
          <span class="stat-label">Page Size</span>
          <span class="stat-value">
            Transfer: ${transferSize}KB | Decoded: ${decodedSize}KB
          </span>
        </div>`;
    }
    
    performanceHtml += `
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
    const recommendation = parts[1] ? `<br><small style="color: #888;">${escapeHtml(parts[1])}</small>` : '';
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

  // Combine all sections
  content.innerHTML = `
    ${summaryHtml}
    ${performanceHtml}
    ${seoHtml}
  `;
}

/**
 * Send a message to content.js to run the analysis, then display the results.
 */
function runAnalysis() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    chrome.tabs.sendMessage(activeTab.id, { action: 'getAnalysis' }, (response) => {
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
    
    const button = document.getElementById('togglePreview');
    isPreviewActive = !isPreviewActive;
    
    if (isPreviewActive) {
      button.classList.add('active');
      chrome.tabs.sendMessage(tabs[0].id, { action: 'showPreview' });
    } else {
      button.classList.remove('active');
      chrome.tabs.sendMessage(tabs[0].id, { action: 'removePreview' });
    }
  });
}

// Add event listeners when the popup loads
document.addEventListener('DOMContentLoaded', function() {
  runAnalysis();
  document.getElementById('togglePreview').addEventListener('click', togglePreview);
});
