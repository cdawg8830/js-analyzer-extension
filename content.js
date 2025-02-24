let previewContainer = null;

/**
 * Creates and injects an <iframe> to preview the page either with or without JavaScript.
 */
function createPreviewIframe(originalContent, disableJavaScript) {
  const iframe = document.createElement('iframe');
  
  if (disableJavaScript) {
    // JavaScript-disabled view
    fetch(window.location.href, {
      headers: {
        'Accept': 'text/html',
        'User-Agent': 'Mozilla/5.0 (compatible; SEOBot/1.0; +http://example.com/bot.html)'
      }
    })
      .then(response => response.text())
      .then(html => {
        // Create sandboxed environment
        iframe.sandbox = '';
        iframe.srcdoc = `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { margin: 0; }
              </style>
            </head>
            <body>${html}</body>
          </html>
        `;
      })
      .catch(error => {
        iframe.srcdoc = `
          <html>
            <body style="margin: 0; padding: 20px; font-family: system-ui;">
              <div style="background: #f8d7da; color: #721c24; padding: 15px; border-radius: 4px;">
                Unable to load JavaScript-disabled view due to site security restrictions.
              </div>
            </body>
          </html>
        `;
      });
  } else {
    // JavaScript-enabled view
    iframe.sandbox = 'allow-scripts allow-same-origin allow-forms';
    iframe.src = window.location.href;
  }
  
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  return iframe;
}

/**
 * Collects basic performance metrics.
 */
async function collectPerformanceMetrics() {
  const metrics = {
    timing: {},
    resources: {
      total: 0,
      js: 0,
      css: 0,
      images: 0
    },
    scriptExecutionTime: 0
  };

  const navigationEntry = performance.getEntriesByType('navigation')[0];
  if (navigationEntry) {
    metrics.timing = {
      loadTime: navigationEntry.loadEventEnd - navigationEntry.navigationStart,
      domContentLoaded: navigationEntry.domContentLoadedEventEnd - navigationEntry.navigationStart,
      firstPaint: 0,
      firstContentfulPaint: 0
    };
  }

  // Paint timing
  const paints = performance.getEntriesByType('paint');
  paints.forEach(p => {
    if (p.name === 'first-paint') {
      metrics.timing.firstPaint = p.startTime;
    } else if (p.name === 'first-contentful-paint') {
      metrics.timing.firstContentfulPaint = p.startTime;
    }
  });

  // Resources
  const resourceEntries = performance.getEntriesByType('resource');
  metrics.resources.total = resourceEntries.length;
  resourceEntries.forEach(res => {
    if (res.name.endsWith('.js')) metrics.resources.js++;
    if (res.name.endsWith('.css')) metrics.resources.css++;
    if (/\.(png|jpe?g|gif|webp|svg)$/i.test(res.name)) metrics.resources.images++;
  });

  // Script execution time (optional custom measures)
  const scriptTiming = performance
    .getEntriesByType('measure')
    .filter(entry => entry.name.startsWith('script-execution-'))
    .reduce((total, entry) => total + entry.duration, 0);
  metrics.scriptExecutionTime = scriptTiming;

  return metrics;
}

/**
 * Basic link analysis for display in the popup (not used for SSR detection).
 */
function analyzeSiteLinks() {
  const links = Array.from(document.getElementsByTagName('a'));
  const linkAnalysis = {
    total: links.length,
    jsLinks: 0,
    htmlLinks: 0,
    brokenLinks: 0,
    linkDetails: []
  };

  links.forEach(link => {
    const href = link.getAttribute('href') || '';
    const isBroken = !href || href === '#';
    if (isBroken) {
      linkAnalysis.brokenLinks++;
    } else if (href.startsWith('javascript:')) {
      linkAnalysis.jsLinks++;
    } else {
      linkAnalysis.htmlLinks++;
    }

    linkAnalysis.linkDetails.push({
      text: link.textContent.trim(),
      href: href || 'No href',
      isBroken
    });
  });

  return linkAnalysis;
}

/**
 * Fetch raw server HTML for comparison with the final DOM.
 */
async function fetchRawHTML() {
  try {
    // First try: Use the current document's HTML
    const currentHtml = document.documentElement.outerHTML;
    
    // Second try: Attempt fetch only if we're on http/https
    if (window.location.protocol.startsWith('http')) {
      try {
        const response = await fetch(window.location.href, {
          headers: {
            'Accept': 'text/html',
            'User-Agent': 'ClifsJSAnalyzer/1.0'
          },
          credentials: 'same-origin'  // This helps with CORS
        });
        if (response.ok) {
          return await response.text();
        }
      } catch (fetchErr) {
        console.warn('Fetch failed, using current HTML:', fetchErr);
      }
    }
    
    // Fallback: Return the current HTML
    return currentHtml;
  } catch (err) {
    console.warn('HTML capture error:', err);
    // Last resort fallback
    return document.documentElement.outerHTML;
  }
}

/**
 * Compare textContent from raw HTML vs. textContent from final (JS-modified) DOM.
 * Returns 'SSR', 'CSR', 'Static', or 'Hybrid' based on thresholds.
 */
function determineRenderingType(rawHtml, finalHtml, frameworks) {
  // If we have frameworks, start with CSR assumption
  let renderingType = frameworks.length > 0 ? 'CSR' : 'Unknown';

  // Check for clear CSR indicators
  const hasRootContainer = document.querySelector('#root, #app, #__next, #__nuxt');
  const hasClientRouter = document.querySelector('[ng-view], [ui-view], [router-view]');
  const hasFrameworkMarkers = document.querySelector('[data-reactroot], [ng-version], [data-v-]');
  
  if (hasRootContainer || hasClientRouter || hasFrameworkMarkers) {
    return 'CSR';
  }

  if (!rawHtml) {
    return renderingType;
  }

  // Convert raw HTML + final HTML to text
  const parser = new DOMParser();
  const rawDoc = parser.parseFromString(rawHtml, 'text/html');
  const rawText = (rawDoc.body && rawDoc.body.innerText) ? rawDoc.body.innerText.trim() : '';
  const finalText = (document.body && document.body.innerText) ? document.body.innerText.trim() : '';

  if (!finalText || !rawText) {
    return renderingType;
  }

  const rawLen = rawText.length;
  const finalLen = finalText.length;
  const ratio = rawLen / finalLen;

  // More aggressive CSR detection
  if (ratio < 0.2 || frameworks.length > 0) {
    return 'CSR';
  }

  // Only consider SSR if we have very high content match
  if (ratio >= 0.7) {
    if (frameworks.length === 0) {
      return 'Static';
    }
    // Even with high ratio, if we have frameworks, lean towards CSR
    return frameworks.length > 0 ? 'CSR' : 'SSR';
  }

  return 'Hybrid';
}

/**
 * Analyzes frameworks, calls the rendering detection logic, sets dependency level, returns analysis.
 */
async function analyzePage() {
  try {
    const analysis = {
      totalElements: document.getElementsByTagName('*').length,
      scripts: document.getElementsByTagName('script').length,
      dynamicContent: 0,
      seoIssues: [],
      frameworks: [],
      performance: await collectPerformanceMetrics(),
      links: analyzeSiteLinks(),
      renderingType: 'Unknown',
      dependencyLevel: 'Unknown'
    };

    const rawHtml = await fetchRawHTML();
    const scriptElements = Array.from(document.getElementsByTagName('script'));
    const scriptSources = scriptElements.map(s => s.src || s.textContent).join(' ');

    // Framework detection (more aggressive)
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__ || scriptSources.includes('react') || document.querySelector('[data-reactroot]')) {
      analysis.frameworks.push('React');
    }
    if (window.Vue || document.querySelector('[data-v-]') || scriptSources.includes('vue')) {
      analysis.frameworks.push('Vue');
    }
    if (window.angular || document.querySelector('[ng-version]') || scriptSources.includes('angular')) {
      analysis.frameworks.push('Angular');
    }
    if (scriptSources.includes('Svelte')) {
      analysis.frameworks.push('Svelte');
    }

    // Next.js detection (separate from React)
    if (document.querySelector('#__next') || window.__NEXT_DATA__) {
      analysis.frameworks.push('Next.js');
    }
    if (document.querySelector('#__nuxt') || window.__NUXT__) {
      analysis.frameworks.push('Nuxt.js');
    }

    // Determine rendering type
    analysis.renderingType = determineRenderingType(rawHtml, document.documentElement.outerHTML, analysis.frameworks);

    // More aggressive dependency level determination
    if (analysis.frameworks.length > 0 || analysis.renderingType === 'CSR') {
      analysis.dependencyLevel = 'High';
    } else if (analysis.renderingType === 'Hybrid') {
      analysis.dependencyLevel = 'Medium';
    } else if (analysis.renderingType === 'Static' || analysis.renderingType === 'SSR') {
      analysis.dependencyLevel = analysis.frameworks.length > 0 ? 'High' : 'Low';
    } else {
      analysis.dependencyLevel = 'Unknown';
    }

    // Add SEO recommendations based on analysis
    if (analysis.renderingType === 'CSR') {
      analysis.seoIssues.push(
        'Client-side rendering may impact SEO - Consider implementing SSR or pre-rendering for better search engine visibility'
      );
      if (!document.querySelector('meta[name="description"]')) {
        analysis.seoIssues.push(
          'Missing meta description - Add a meta description tag that will be present in initial HTML'
        );
      }
      if (analysis.frameworks.length > 0) {
        analysis.seoIssues.push(
          `Using ${analysis.frameworks.join(', ')} - Consider using the SSR version (Next.js, Nuxt.js, etc.) for better SEO`
        );
      }
    }

    if (analysis.dependencyLevel === 'High') {
      analysis.seoIssues.push(
        'High JavaScript dependency may affect crawling - Consider reducing JavaScript reliance for core content'
      );
    }

    const loadTime = analysis.performance?.timing?.loadTime || 0;
    if (loadTime > 3000) {
      analysis.seoIssues.push(
        'Slow page load time may impact SEO - Optimize JavaScript and resource loading for better performance'
      );
    }

    // Check for common SEO elements
    if (!document.querySelector('h1')) {
      analysis.seoIssues.push('Missing H1 heading - Add a primary heading for better content structure');
    }

    if (!document.querySelector('title')) {
      analysis.seoIssues.push('Missing title tag - Add a descriptive page title');
    }

    console.log('Analyze Page Result:', {
      frameworks: analysis.frameworks,
      renderingType: analysis.renderingType,
      dependencyLevel: analysis.dependencyLevel,
      scriptCount: analysis.scripts,
      seoIssues: analysis.seoIssues
    });

    return analysis;
  } catch (err) {
    console.error('Error analyzing page:', err);
    return {
      error: true,
      message: err.message,
      renderingType: 'Unknown',
      dependencyLevel: 'Unknown'
    };
  }
}

// Message listener for extension commands
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getAnalysis') {
    // Immediately send a basic response to keep the message port open
    sendResponse({
      status: 'analyzing',
      message: 'Analysis in progress...'
    });

    // Then run the analysis
    analyzePage()
      .then(result => {
        // Send the result through a new message
        chrome.runtime.sendMessage({
          action: 'analysisResult',
          result: result
        });
      })
      .catch(error => {
        console.error('Analysis error:', error);
        chrome.runtime.sendMessage({
          action: 'analysisResult',
          error: true,
          message: error.message || 'Analysis failed'
        });
      });
  } else if (request.action === 'showPreview') {
    // Create preview container if it doesn't exist
    if (!previewContainer) {
      previewContainer = document.createElement('div');
      previewContainer.id = 'jsAnalyzerPreviewContainer';
      previewContainer.style.position = 'fixed';
      previewContainer.style.top = '0';
      previewContainer.style.right = '0';
      previewContainer.style.width = '50vw';
      previewContainer.style.height = '100vh';
      previewContainer.style.zIndex = '999999';
      previewContainer.style.borderLeft = '2px solid #333';
      previewContainer.style.background = '#fff';
      previewContainer.style.boxShadow = '-2px 0 8px rgba(0,0,0,0.15)';
      
      // Create the no-JS preview iframe
      const iframe = createPreviewIframe(document.documentElement.outerHTML, true);
      previewContainer.appendChild(iframe);
      document.body.appendChild(previewContainer);
    }
    sendResponse({ status: 'success' });
  } else if (request.action === 'removePreview') {
    if (previewContainer) {
      previewContainer.remove();
      previewContainer = null;
    }
    sendResponse({ status: 'success' });
  }
  return true; // Keep the message channel open
});

// For quick console debugging
window._clifAnalyzePage = analyzePage;
