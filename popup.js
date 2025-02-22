let isPreviewActive = false;

function updateAnalysisContent(analysis) {
  const dependencyClass = {
    'High': 'dependency-high',
    'Medium': 'dependency-medium',
    'Low': 'dependency-low',
    'Unknown': 'dependency-unknown'
  };

  const content = document.getElementById('analysis-content');
  
  // Add HTML escaping function
  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  
  // Handle partial analysis case
  const isPartialAnalysis = !analysis.frameworks && analysis.seoIssues.length === 1;
  
  let dependencyLevel = analysis.dependencyLevel || 'Unknown';
  let frameworks = analysis.frameworks || [];
  let dynamicContent = analysis.dynamicContent || 0;
  let seoIssues = analysis.seoIssues || [];

  // Format frameworks list to be more readable
  const formattedFrameworks = frameworks.length > 0 
    ? frameworks.filter((f, i) => frameworks.indexOf(f) === i)
        .sort((a, b) => a.localeCompare(b))
        .join(', ')
    : 'None detected';

  // Generate recommendations HTML
  const getRecommendationsHtml = () => {
    if (!seoIssues.length) return '';
    
    const recommendations = [];
    if (dependencyLevel === 'High') {
      recommendations.push(
        '<li>Implement server-side rendering (SSR) for critical content</li>',
        '<li>Add comprehensive <code>&lt;noscript&gt;</code> fallback content</li>',
        '<li>Consider pre-rendering static pages where possible</li>'
      );
    }
    if (dependencyLevel === 'Medium') {
      recommendations.push(
        '<li>Evaluate which JavaScript is truly necessary for core functionality</li>',
        '<li>Implement progressive enhancement for non-critical features</li>',
        '<li>Consider hybrid rendering approaches (SSR + CSR)</li>'
      );
    }
    if (frameworks.length > 0) {
      recommendations.push(
        `<li>Consider using ${frameworks.includes('React') ? 'Next.js' : 'an SSR framework'} for better SEO</li>`,
        '<li>Implement dynamic rendering for search engines</li>'
      );
    }
    recommendations.push('<li>Ensure critical content renders without JavaScript</li>');

    return `
      <div class="recommendations">
        <h3>Recommendations</h3>
        <ul style="margin: 0; padding-left: 20px; color: #666;">
          ${recommendations.join('\n')}
        </ul>
      </div>
    `;
  };

  // Generate SEO issues HTML
  const getSeoIssuesHtml = () => {
    console.log('Generating SEO issues HTML for:', seoIssues);
    return seoIssues.map(issue => {
      console.log('Processing issue:', issue);
      const parts = issue.split(' - ');
      const mainIssue = escapeHtml(parts[0]);
      const recommendation = parts[1] ? escapeHtml(parts[1]) : '';
      console.log('Split parts:', { mainIssue, recommendation });
      
      return `
        <div class="stat" style="margin-bottom: 8px;">
          <span class="stat-value" style="display: flex; align-items: flex-start;">
            <span style="color: #ff4d4d; margin-right: 8px; flex-shrink: 0;">*</span>
            <span style="flex-grow: 1;">
              ${mainIssue}
              ${recommendation ? `<br><span style="color: #666; font-size: 0.9em; display: block; margin-top: 4px;">> ${recommendation}</span>` : ''}
            </span>
          </span>
        </div>
      `;
    }).join('');
  };

  // Build the final HTML
  const summaryHtml = `
    <div class="analysis-section">
      <h3>Quick Summary</h3>
      <div class="stat">
        <span class="stat-label">JavaScript Dependency</span>
        <span class="stat-value ${dependencyClass[dependencyLevel]}">${dependencyLevel}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Script Tags</span>
        <span class="stat-value">${analysis.scripts}</span>
      </div>
      ${!isPartialAnalysis ? `
      <div class="stat">
        <span class="stat-label">Dynamic Elements</span>
        <span class="stat-value">${dynamicContent}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Frameworks</span>
        <span class="stat-value">${formattedFrameworks}</span>
      </div>
      ` : ''}
    </div>
  `;

  const analysisHtml = isPartialAnalysis 
    ? `
      <div class="analysis-section">
        <h3>Limited Analysis Available</h3>
        <div class="stat">
          <span class="stat-value">Due to site security restrictions, only basic analysis is available.</span>
        </div>
      </div>
    `
    : `
      <div class="analysis-section">
        <h3>SEO Impact</h3>
        ${frameworks.length > 0 || seoIssues.length > 0 
          ? getSeoIssuesHtml()
          : `<div class="stat">
              <span class="stat-value" style="display: flex; align-items: flex-start;">
                <span style="color: #4CAF50; margin-right: 8px;">✓</span>
                <span>No significant SEO issues detected</span>
              </span>
            </div>`
        }
      </div>
      ${getRecommendationsHtml()}
    `;

  content.innerHTML = summaryHtml + analysisHtml;
}

// Function to toggle the preview
function togglePreview() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const action = isPreviewActive ? 'hidePreview' : 'showPreview';
    chrome.tabs.sendMessage(tabs[0].id, {action: action}, function(response) {
      if (response && response.success) {
        isPreviewActive = !isPreviewActive;
        const button = document.getElementById('togglePreview');
        button.textContent = isPreviewActive ? 'Hide Split View' : 'Show Split View';
      }
    });
  });
}

// Initialize popup
document.addEventListener('DOMContentLoaded', function() {
  // Set up button listeners
  document.getElementById('togglePreview').addEventListener('click', togglePreview);

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

    // Set a timeout to handle cases where the content script doesn't respond
    const timeout = setTimeout(() => {
      content.innerHTML = `
        <div class="analysis-section">
          <h3>Error</h3>
          <div class="stat">
            <span class="stat-value">Analysis timed out. Please refresh the page and try again.</span>
          </div>
        </div>
      `;
    }, 5000); // 5 second timeout

    try {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'getAnalysis'}, function(response) {
        clearTimeout(timeout); // Clear the timeout since we got a response

        if (chrome.runtime.lastError) {
          console.warn('Runtime error:', chrome.runtime.lastError);
          content.innerHTML = `
            <div class="analysis-section">
              <h3>Error</h3>
              <div class="stat">
                <span class="stat-value">Could not analyze this page. Please refresh the page and try again.</span>
              </div>
            </div>
          `;
          return;
        }

        if (!response) {
          content.innerHTML = `
            <div class="analysis-section">
              <h3>Error</h3>
              <div class="stat">
                <span class="stat-value">No analysis data available. Please try reloading the page.</span>
              </div>
            </div>
          `;
          return;
        }

        if (response.success && response.analysis) {
          updateAnalysisContent(response.analysis);
        } else if (response.partialAnalysis) {
          updateAnalysisContent(response.partialAnalysis);
        } else {
          content.innerHTML = `
            <div class="analysis-section">
              <h3>Limited Access</h3>
              <div class="stat">
                <span class="stat-value">${response.error || 'Unable to analyze this page due to security restrictions.'}</span>
              </div>
            </div>
          `;
        }
      });
    } catch (error) {
      clearTimeout(timeout);
      console.error('Error sending message:', error);
      content.innerHTML = `
        <div class="analysis-section">
          <h3>Error</h3>
          <div class="stat">
            <span class="stat-value">An error occurred while analyzing the page. Please try again.</span>
          </div>
        </div>
      `;
    }
  });
}); 