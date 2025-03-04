let previewContainer = null;

/**
 * Creates and injects an <iframe> to preview the page either with or without JavaScript.
 */
function createPreviewIframe(originalContent, disableJavaScript) {
  const iframe = document.createElement('iframe');
  
  if (disableJavaScript) {
    // Get rendering scores if available
    const renderingScores = window._pageRenderingScores || { static: 0.33, ssr: 0.33, csr: 0.34 };
    const primaryType = window._pageRenderingType || 'Unknown';
    
    // JavaScript-disabled view
    fetch(window.location.href, {
      headers: {
        'Accept': 'text/html',
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'X-Requested-With': 'ClifsJSAnalyzer',
        'Cache-Control': 'no-cache'
      }
    })
      .then(response => response.text())
      .then(html => {
        // Check if there's actually meaningful content in the HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const bodyText = doc.body ? doc.body.innerText.trim() : '';
        
        // Sites with high CSR scores and minimal initial content
        if ((bodyText.length < 200 && renderingScores.csr > 0.5) || renderingScores.csr > 0.7) {
          // For CSR-heavy sites with minimal initial HTML content, provide an informative message
          iframe.srcdoc = `
            <!DOCTYPE html>
            <html>
              <head>
                <style>
                  body { margin: 0; padding: 20px; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; line-height: 1.5; }
                  .message { background: #f1f8ff; border: 1px solid #c8e1ff; color: #0366d6; padding: 15px; border-radius: 6px; margin-bottom: 20px; }
                  .raw-content { margin-top: 20px; padding: 15px; background: #f6f8fa; border-radius: 6px; max-height: 300px; overflow: auto; font-family: monospace; font-size: 13px; }
                  .rendering-bar { display: flex; margin: 20px 0; height: 10px; border-radius: 5px; overflow: hidden; box-shadow: inset 0 1px 2px rgba(0,0,0,0.1); }
                  .static-segment { background: #28a745; height: 100%; }
                  .ssr-segment { background: #17a2b8; height: 100%; }
                  .csr-segment { background: #dc3545; height: 100%; }
                  .legend { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; }
                  h3 { margin-top: 0; color: #0366d6; }
                  h4 { margin-top: 20px; margin-bottom: 10px; color: #24292e; }
                </style>
              </head>
              <body>
                <div class="message">
                  <h3>JavaScript Is Required For This Page</h3>
                  <p>This page relies significantly on client-side JavaScript for rendering content.</p>
                  <p>This view simulates what search engines see without JavaScript execution.</p>
                  
                  <div class="legend">
                    <span>Static (${Math.round(renderingScores.static * 100)}%)</span>
                    <span>SSR (${Math.round(renderingScores.ssr * 100)}%)</span>
                    <span>CSR (${Math.round(renderingScores.csr * 100)}%)</span>
                  </div>
                  <div class="rendering-bar">
                    <div class="static-segment" style="width: ${renderingScores.static * 100}%"></div>
                    <div class="ssr-segment" style="width: ${renderingScores.ssr * 100}%"></div>
                    <div class="csr-segment" style="width: ${renderingScores.csr * 100}%"></div>
                  </div>
                </div>
                
                <h4>Raw HTML Content:</h4>
                <div class="raw-content">${html.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
              </body>
            </html>
          `;
        } else {
          // Normal sandboxed environment for SSR or Static sites
          iframe.sandbox = '';
          iframe.srcdoc = `
            <!DOCTYPE html>
            <html>
              <head>
                <style>
                  body { margin: 0; padding: 20px; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
                  .rendering-info { background: #f1f8ff; border: 1px solid #c8e1ff; color: #0366d6; padding: 15px; margin-bottom: 20px; border-radius: 6px; }
                  .rendering-bar { display: flex; margin: 15px 0; height: 10px; border-radius: 5px; overflow: hidden; box-shadow: inset 0 1px 2px rgba(0,0,0,0.1); }
                  .static-segment { background: #28a745; height: 100%; }
                  .ssr-segment { background: #17a2b8; height: 100%; }
                  .csr-segment { background: #dc3545; height: 100%; }
                  .legend { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; }
                  h3 { margin-top: 0; color: #0366d6; }
                </style>
              </head>
              <body>
                <div class="rendering-info">
                  <h3>Page Without JavaScript</h3>
                  <p>This site has significant content in its initial HTML, which is good for search engines.</p>
                  
                  <div class="legend">
                    <span>Static (${Math.round(renderingScores.static * 100)}%)</span>
                    <span>SSR (${Math.round(renderingScores.ssr * 100)}%)</span>
                    <span>CSR (${Math.round(renderingScores.csr * 100)}%)</span>
                  </div>
                  <div class="rendering-bar">
                    <div class="static-segment" style="width: ${renderingScores.static * 100}%"></div>
                    <div class="ssr-segment" style="width: ${renderingScores.ssr * 100}%"></div>
                    <div class="csr-segment" style="width: ${renderingScores.csr * 100}%"></div>
                  </div>
                </div>
                
                ${html}
              </body>
            </html>
          `;
        }
      })
      .catch(error => {
        iframe.srcdoc = `
          <html>
            <head>
              <style>
                body { margin: 0; padding: 20px; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
                .error { background: #fff5f5; border: 1px solid #fc8181; color: #c53030; padding: 15px; border-radius: 6px; }
                h3 { margin-top: 0; }
              </style>
            </head>
            <body>
              <div class="error">
                <h3>Unable to load JavaScript-disabled view</h3>
                <p>This could be due to site security restrictions or CORS policies.</p>
                <p>Error details: ${error.message}</p>
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
    scriptExecutionTime: 0,
    webVitals: {}
  };

  const navigationEntry = performance.getEntriesByType('navigation')[0];
  if (navigationEntry) {
    metrics.timing = {
      loadTime: navigationEntry.loadEventEnd - navigationEntry.navigationStart,
      domContentLoaded: navigationEntry.domContentLoadedEventEnd - navigationEntry.navigationStart,
      firstPaint: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      timeToInteractive: navigationEntry.domInteractive - navigationEntry.startTime
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

  // Try to get Largest Contentful Paint if available
  const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
  if (lcpEntries && lcpEntries.length > 0) {
    metrics.timing.largestContentfulPaint = lcpEntries[0].startTime;
    metrics.webVitals.lcp = lcpEntries[0].startTime;
  }

  // Resources
  const resourceEntries = performance.getEntriesByType('resource');
  metrics.resources.total = resourceEntries.length;
  
  // Enhanced resource categorization
  resourceEntries.forEach(res => {
    const url = res.name.toLowerCase();
    if (url.endsWith('.js') || url.includes('.js?') || url.includes('/js/')) {
      metrics.resources.js++;
    }
    if (url.endsWith('.css') || url.includes('.css?') || url.includes('/css/')) {
      metrics.resources.css++;
    }
    if (/\.(png|jpe?g|gif|webp|svg|ico|avif)($|\?)/i.test(url)) {
      metrics.resources.images++;
    }
  });

  // Script execution time (optional custom measures)
  const scriptTiming = performance
    .getEntriesByType('measure')
    .filter(entry => entry.name.startsWith('script-execution-'))
    .reduce((total, entry) => total + entry.duration, 0);
  metrics.scriptExecutionTime = scriptTiming;

  // Check for Cumulative Layout Shift (CLS) support
  if ('LayoutShift' in window && window.PerformanceObserver) {
    metrics.webVitals.clsSupported = true;
  }

  // Add total transfer size if available
  if (navigationEntry && navigationEntry.transferSize) {
    metrics.resources.totalTransferSize = navigationEntry.transferSize;
    metrics.resources.totalDecodedSize = navigationEntry.decodedBodySize;
  }

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
            'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
            'X-Requested-With': 'ClifsJSAnalyzer'
          },
          // Using no-cors mode can help with some CORS issues, but provides limited response data
          // omit credentials to avoid cookie-based auth issues
          cache: 'no-store' // Avoid cached responses
        });
        
        if (response.ok) {
          const html = await response.text();
          
          // Verify we got actual HTML back, not an error page or redirect
          if (html.includes('<!DOCTYPE html>') || html.includes('<html')) {
            return html;
          }
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

// Framework detection with comprehensive markers
function createFrameworkDetection(scriptSources) {
  return {
    // Modern React Ecosystem
    'React': {
      markers: [
        () => window.__REACT_DEVTOOLS_GLOBAL_HOOK__,
        () => document.querySelector('[data-reactroot], [data-reactid]'),
        () => document.documentElement.innerHTML.includes('_reactRootContainer'),
        () => scriptSources.includes('react'),
        () => document.querySelector('#root'),  // Common React root
        () => window.__REACT_ERROR_OVERLAY__,
        () => window.__REACT_QUERY_DEVTOOLS__
      ],
      isCSR: true  // Mark React as primarily CSR
    },
    'Next.js': {
      markers: [
        () => document.querySelector('#__next') && document.querySelector('script#__NEXT_DATA__'),  // Require both
        () => window.__NEXT_DATA__,
        () => document.querySelector('meta[name="generator"][content*="Next.js"]')
      ],
      isSSR: true,
      overridesFramework: 'React'  // Next.js overrides React's CSR designation
    },
    'Remix': {
      markers: [
        () => window.__remixContext,
        () => document.querySelector('script[type="text/remix-data"]'),
        () => scriptSources.includes('@remix-run/')
      ],
      isSSR: true
    },
    // Vue Ecosystem
    'Vue': {
      markers: [
        () => window.Vue,
        () => document.querySelector('[data-v-]'),
        () => scriptSources.includes('vue'),
        () => document.querySelector('[v-cloak], [v-show], [v-if]')
      ]
    },
    'Nuxt.js': {
      markers: [
        () => document.querySelector('#__nuxt'),
        () => document.querySelector('script#__NUXT_DATA__'),
        () => window.__NUXT__,
        () => scriptSources.includes('/_nuxt/')
      ],
      isSSR: true
    },
    // Angular Ecosystem
    'Angular': {
      markers: [
        () => window.angular,
        () => document.querySelector('[ng-version]'),
        () => scriptSources.includes('angular'),
        () => document.querySelector('[ng-app], [ng-controller]'),
        () => window.getAllAngularRootElements
      ]
    },
    'Universal': {
      markers: [
        () => document.querySelector('script[src*="server/main"]'),
        () => document.querySelector('script#__UNIVERSAL_DATA__')
      ],
      isSSR: true
    },
    // Svelte Ecosystem
    'Svelte': {
      markers: [
        () => scriptSources.includes('svelte'),
        () => document.querySelector('style[data-svelte]')
      ]
    },
    'SvelteKit': {
      markers: [
        () => document.documentElement.hasAttribute('data-sveltekit'),
        () => window.__SVELTEKIT_APP__,
        () => document.querySelector('script[data-sveltekit]')
      ],
      isSSR: true
    },
    // Other Modern Frameworks
    'Astro': {
      markers: [
        () => document.documentElement.hasAttribute('data-astro-cid'),
        () => document.querySelector('script[type="module"][data-astro-script]'),
        () => document.querySelector('meta[name="generator"][content*="Astro"]')
      ],
      isSSR: true
    },
    'Qwik': {
      markers: [
        () => window.qwikCity,
        () => document.querySelector('[q\\:container]'),
        () => scriptSources.includes('@builder.io/qwik')
      ],
      isSSR: true
    },
    'Solid': {
      markers: [
        () => window.$SOLID,
        () => document.querySelector('[data-hk]'),
        () => scriptSources.includes('@solidjs/'),
      ]
    },
    'SolidStart': {
      markers: [
        () => document.querySelector('script[solid-entry]'),
        () => document.querySelector('meta[name="generator"][content*="SolidStart"]')
      ],
      isSSR: true
    },
    'Gatsby': {
      markers: [
        () => window.___gatsby,
        () => document.querySelector('div#___gatsby'),
        () => scriptSources.includes('gatsby')
      ],
      isSSR: true
    }
  };
}

// Detect frameworks present on the page
function detectFrameworks(scriptSources) {
  // Reset detection state
  const detectedFrameworks = [];
  const ssrFrameworks = [];
  const csrFrameworks = [];
  const overriddenFrameworks = new Set();

  // Create fresh framework detection configuration
  const frameworkDetection = createFrameworkDetection(scriptSources);

  for (const [framework, config] of Object.entries(frameworkDetection)) {
    // Check if any markers match
    const isPresent = config.markers.some(marker => {
      try {
        return marker();
      } catch (e) {
        console.debug(`Framework detection error for ${framework}:`, e);
        return false;
      }
    });

    if (isPresent) {
      detectedFrameworks.push(framework);
      
      // Handle framework overrides
      if (config.overridesFramework) {
        overriddenFrameworks.add(config.overridesFramework);
      }
      
      if (config.isSSR) {
        ssrFrameworks.push(framework);
      }
      if (config.isCSR && !overriddenFrameworks.has(framework)) {
        csrFrameworks.push(framework);
      }
    }
  }

  return { 
    detectedFrameworks, 
    ssrFrameworks,
    csrFrameworks: csrFrameworks.filter(f => !overriddenFrameworks.has(f))
  };
}

/**
 * Compare textContent from raw HTML vs. textContent from final (JS-modified) DOM.
 * Returns probability scores for different rendering types instead of a single determination.
 */
function calculateRenderingScores(rawHtml, finalHtml, detectedFrameworks, ssrFrameworks, csrFrameworks) {
  const parser = new DOMParser();
  const rawDoc = parser.parseFromString(rawHtml, 'text/html');
  
  const rawText = (rawDoc.body && rawDoc.body.innerText) ? rawDoc.body.innerText.trim() : '';
  const finalText = document.body ? document.body.innerText.trim() : '';
  
  if (!rawText || !finalText) {
    return {
      static: 0.1,
      ssr: 0.1, 
      csr: 0.8,
      primaryType: 'CSR'
    };
  }

  const contentRatio = rawText.length / finalText.length;
  
  // Check for definitive framework indicators first
  const hasSSRFramework = ssrFrameworks.length > 0;
  const hasCSRFramework = csrFrameworks.length > 0;
  
  // Additional CSR indicators
  const hasClientRouting = document.querySelector('script[src*="react-router"], script[src*="vue-router"]') !== null;
  const hasStateManagement = window.__REDUX_STORE__ || window.__VUEX__ || window.ng || window.__INITIAL_STATE__;
  const hasDynamicImports = Array.from(document.getElementsByTagName('script'))
    .some(s => s.src && (s.src.includes('chunk') || s.src.includes('bundle')));
  
  // Check for dynamic content insertion
  const hasLargeContentDiff = contentRatio < 0.5;
  const hasModerateContentDiff = contentRatio < 0.8;

  let scores;
  
  // SSR Framework Detection (highest priority)
  if (hasSSRFramework) {
    scores = {
      static: 0.1,
      ssr: 0.8,
      csr: 0.1
    };
  }
  // Pure CSR Framework Detection
  else if (hasCSRFramework || (hasClientRouting && hasDynamicImports)) {
    scores = {
      static: 0.1,
      ssr: 0.1,
      csr: 0.8
    };
  }
  // Static Site Detection (high content ratio, no framework)
  else if (contentRatio > 0.9 && !hasStateManagement && !hasDynamicImports) {
    scores = {
      static: 0.8,
      ssr: 0.1,
      csr: 0.1
    };
  }
  // Mixed/Hybrid Detection
  else if (hasModerateContentDiff || hasStateManagement) {
    scores = {
      static: 0.3,
      ssr: 0.3,
      csr: 0.4
    };
  }
  // Default to Static if no other strong indicators
  else {
    scores = {
      static: 0.6,
      ssr: 0.2,
      csr: 0.2
    };
  }

  const primaryType = scores.ssr > 0.5 ? 'SSR' : 
                     scores.static > 0.5 ? 'Static' : 'CSR';
  
  return {
    ...scores,
    primaryType,
    contentRatio,
    hasLargeContentDiff,
    hasClientRouting,
    hasStateManagement,
    hasDynamicImports
  };
}

/**
 * Calculate JavaScript dependency level based on multiple factors
 */
function calculateDependencyLevel(analysis, renderingScores) {
  // Start with base dependency from rendering type
  let dependencyScore = 0;
  
  // 1. Framework Dependency (0.4 weight)
  const hasHeavyFramework = analysis.frameworks.some(fw => 
    ['React', 'Angular', 'Vue', 'Svelte', 'Solid'].includes(fw)
  );
  const hasSSRFramework = analysis.frameworks.some(fw =>
    ['Next.js', 'Nuxt.js', 'SvelteKit', 'Remix'].includes(fw)
  );
  
  const frameworkScore = hasHeavyFramework ? 0.8 : 
                        hasSSRFramework ? 0.4 : 0.2;
  
  // 2. Resource Dependency (0.3 weight)
  const jsCount = analysis.performance.resources.js || 0;
  const resourceScore = Math.min(1, jsCount / 15); // Normalize, max at 15 JS files
  
  // 3. Runtime Behavior (0.3 weight)
  const runtimeScore = (
    (renderingScores.hasLargeContentDiff ? 0.4 : 0) +
    (renderingScores.hasClientRouting ? 0.2 : 0) +
    (renderingScores.hasStateManagement ? 0.2 : 0) +
    (renderingScores.hasDynamicImports ? 0.2 : 0)
  );
  
  // Calculate weighted final score
  dependencyScore = (
    (frameworkScore * 0.4) +
    (resourceScore * 0.3) +
    (runtimeScore * 0.3)
  );
  
  // Map to Low/Medium/High
  if (dependencyScore > 0.7) {
    return { level: 'High', score: dependencyScore };
  } else if (dependencyScore > 0.4) {
    return { level: 'Medium', score: dependencyScore };
  } else {
    return { level: 'Low', score: dependencyScore };
  }
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
      dependencyLevel: 'Unknown',
      renderingScores: {
        static: 0.2,
        ssr: 0.3,
        csr: 0.5
      }
    };

    const rawHtml = await fetchRawHTML();
    const scriptElements = Array.from(document.getElementsByTagName('script'));
    const scriptSources = scriptElements.map(s => s.src || s.textContent).join(' ');

    // Framework detection
    const { detectedFrameworks, ssrFrameworks, csrFrameworks } = detectFrameworks(scriptSources);
    analysis.frameworks = detectedFrameworks;

    // Calculate rendering scores with enhanced detection
    const renderingScores = calculateRenderingScores(
      rawHtml, 
      document.documentElement.outerHTML, 
      detectedFrameworks, 
      ssrFrameworks,
      csrFrameworks
    );
    
    // Update rendering scores and type
    analysis.renderingScores = {
      static: renderingScores.static,
      ssr: renderingScores.ssr,
      csr: renderingScores.csr
    };
    analysis.renderingType = renderingScores.primaryType;
    
    // Calculate dependency level with new logic
    const dependencyResult = calculateDependencyLevel(analysis, renderingScores);
    analysis.dependencyLevel = dependencyResult.level;
    analysis.dependencyScore = dependencyResult.score;
    
    // Store rendering info globally
    window._pageRenderingType = renderingScores.primaryType;
    window._pageRenderingScores = analysis.renderingScores;
    
    // SEO recommendations based on analysis
    if (analysis.renderingScores.csr > 0.6) {
      analysis.seoIssues.push(
        'High client-side rendering may impact SEO - Consider implementing SSR or pre-rendering for better search engine visibility'
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
    if (!document.querySelector('title')) {
      analysis.seoIssues.push('Missing title tag - Add a descriptive page title');
    } else if (document.title.length < 10 || document.title.length > 60) {
      analysis.seoIssues.push('Title tag length issue - Use a title between 10-60 characters for optimal SEO');
    }

    if (!document.querySelector('meta[name="description"]')) {
      analysis.seoIssues.push('Missing meta description - Add a meta description tag for better search results');
    } else {
      const metaDesc = document.querySelector('meta[name="description"]').getAttribute('content');
      if (metaDesc && (metaDesc.length < 50 || metaDesc.length > 160)) {
        analysis.seoIssues.push('Meta description length issue - Use 50-160 characters for optimal visibility');
      }
    }

    if (!document.querySelector('h1')) {
      analysis.seoIssues.push('Missing H1 heading - Add a primary heading for better content structure');
    } else if (document.querySelectorAll('h1').length > 1) {
      analysis.seoIssues.push('Multiple H1 headings - Use only one H1 heading per page for clear hierarchy');
    }

    // Check heading structure
    if (document.querySelectorAll('h2').length > 0 && document.querySelectorAll('h1').length === 0) {
      analysis.seoIssues.push('Using H2 without H1 - Improve heading hierarchy by adding an H1 element');
    }

    // Check for viewport meta tag
    if (!document.querySelector('meta[name="viewport"]')) {
      analysis.seoIssues.push('Missing viewport meta tag - Add viewport settings for mobile-friendly display');
    }

    // Check for canonical URL
    if (!document.querySelector('link[rel="canonical"]')) {
      analysis.seoIssues.push('Missing canonical tag - Add a canonical link to prevent duplicate content issues');
    }

    // Check for image alt text
    const imagesWithoutAlt = document.querySelectorAll('img:not([alt])').length;
    if (imagesWithoutAlt > 0) {
      analysis.seoIssues.push(`${imagesWithoutAlt} images missing alt text - Add descriptive alt text for accessibility and SEO`);
    }

    // Check for language specification
    if (!document.documentElement.hasAttribute('lang')) {
      analysis.seoIssues.push('Missing language attribute - Add a lang attribute to the HTML tag');
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
      dependencyLevel: 'Unknown',
      renderingScores: {
        static: 0.33,
        ssr: 0.33,
        csr: 0.34
      }
    };
  }
}

// Message listener for extension commands
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getAnalysis') {
    // Clear any previous analysis state
    window._pageRenderingType = undefined;
    window._pageRenderingScores = undefined;
    
    // Run the analysis and send response
    analyzePage()
      .then(result => {
        sendResponse(result);
      })
      .catch(error => {
        console.error('Analysis error:', error);
        sendResponse({
          error: true,
          message: error.message || 'Analysis failed'
        });
      });
    return true; // Keep the message channel open for async response
  } else if (request.action === 'showPreview') {
    // Remove any existing preview first
    if (previewContainer) {
      previewContainer.remove();
      previewContainer = null;
    }
    
    // Create new preview container
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
