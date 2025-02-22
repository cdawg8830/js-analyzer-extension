let previewContainer = null;

// Function to create and inject the preview iframe
function createPreviewIframe(originalContent, disableJavaScript) {
  const iframe = document.createElement('iframe');
  
  if (disableJavaScript) {
    // For JavaScript disabled view, fetch the page with no-JavaScript
    fetch(window.location.href, {
      headers: {
        'Accept': 'text/html',
        'User-Agent': 'Mozilla/5.0 (compatible; SEOBot/1.0; +http://example.com/bot.html)'
      }
    })
    .then(response => response.text())
    .then(html => {
      // Create a sandboxed environment with minimal permissions
      iframe.sandbox = '';  // Most restrictive sandbox
      iframe.srcdoc = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { margin: 0; }
              * { font-family: inherit; }
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
    // For JavaScript enabled view, use a more permissive sandbox
    iframe.sandbox = 'allow-scripts allow-same-origin allow-forms';
    iframe.src = window.location.href;
  }
  
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  return iframe;
}

// Function to get page analysis
async function analyzePage() {
  try {
    const analysis = {
      totalElements: document.getElementsByTagName('*').length,
      scripts: Array.from(document.getElementsByTagName('script')).length,
      dynamicContent: 0,
      seoIssues: [],
      frameworks: []
    };

    // Enhanced framework detection
    try {
      // Collect all script sources first
      const scriptElements = Array.from(document.getElementsByTagName('script'));
      const scriptSources = scriptElements
        .map(script => script.src || script.textContent)
        .join(' ');
      
      // More precise framework detection using DOM properties and specific attributes
      const frameworkChecks = {
        'React': () => {
          return window.__REACT_DEVTOOLS_GLOBAL_HOOK__ ||
                 window.React || 
                 document.querySelector('[data-reactroot], [data-react-helmet], [data-reactid]') ||
                 scriptSources.includes('react');
        },
        'Vue.js': () => {
          return window.Vue ||
                 document.querySelector('[data-v-], [v-cloak], [v-show], [v-if]') ||
                 scriptSources.includes('vue.') ||
                 document.documentElement.outerHTML.includes('data-v-');
        },
        'Angular': () => {
          return window.angular ||
                 document.querySelector('[ng-version], [ng-app], .ng-binding, [ng-controller]') ||
                 scriptSources.includes('angular') ||
                 document.documentElement.outerHTML.includes('ng-version');
        },
        'Next.js': () => {
          return window.__NEXT_DATA__ ||
                 document.querySelector('#__next, script#__NEXT_DATA__') ||
                 scriptSources.includes('/_next/') ||
                 document.documentElement.outerHTML.includes('__NEXT_DATA__');
        }
      };

      // Perform framework detection with logging
      for (const [framework, check] of Object.entries(frameworkChecks)) {
        try {
          if (check()) {
            console.log(`Detected ${framework} using specific markers`);
            analysis.frameworks.push(framework);
          }
        } catch (e) {
          console.warn(`Error checking for ${framework}:`, e);
        }
      }

      // Remove duplicates and clean up framework list
      analysis.frameworks = [...new Set(analysis.frameworks)];
      console.log('Final frameworks detected:', analysis.frameworks);

    } catch (e) {
      console.warn('Framework detection limited:', e);
    }

    // Enhanced dynamic content detection
    try {
      // Check for dynamic content indicators
      const dynamicIndicators = {
        infiniteScroll: document.querySelector('[data-infinite-scroll]') || 
                       document.querySelector('.infinite-scroll') ||
                       document.querySelector('[data-load-more]'),
        lazyLoading: document.querySelector('[loading="lazy"]') ||
                    document.querySelector('[data-lazy]') ||
                    document.querySelector('.lazy'),
        dynamicForms: document.querySelector('form[data-dynamic]') ||
                     document.querySelector('form[data-ajax]'),
        ajaxContent: document.querySelector('[data-ajax]') ||
                    document.querySelector('[data-dynamic]')
      };

      analysis.dynamicContent = Object.values(dynamicIndicators).filter(Boolean).length;

      // Take a snapshot of the DOM and check for changes
      const initialElements = document.getElementsByTagName('*').length;
      await new Promise(resolve => setTimeout(resolve, 1000));
      const finalElements = document.getElementsByTagName('*').length;
      
      if (finalElements > initialElements) {
        analysis.dynamicContent += 1;
      }
    } catch (e) {
      console.warn('Dynamic content detection limited:', e);
    }

    // Enhanced SEO analysis
    const seoChecks = {
      noScript: !document.querySelector('noscript'),
      metaDescription: !document.querySelector('meta[name="description"]'),
      metaViewport: !document.querySelector('meta[name="viewport"]'),
      emptyH1: Array.from(document.getElementsByTagName('h1')).some(h1 => !h1.textContent.trim()),
      brokenLinks: Array.from(document.getElementsByTagName('a')).some(a => !a.href || a.href === '#'),
      missingAltText: Array.from(document.getElementsByTagName('img')).some(img => !img.alt),
      clientSideRouting: document.querySelector('[role="main"]') || document.querySelector('#root') || document.querySelector('#__next'),
      hasHydrationMarkers: document.documentElement.outerHTML.includes('data-reactroot') || 
                         document.documentElement.outerHTML.includes('ng-version') ||
                         document.documentElement.outerHTML.includes('data-v-')
    };

    console.log('SEO Checks Results:', seoChecks);
    console.log('Frameworks Detected:', analysis.frameworks);

    // Always add framework-related warnings if frameworks are detected
    if (analysis.frameworks.length > 0) {
      console.log('Processing framework-related issues');
      
      // Add framework warning with specific details
      const frameworkWarning = `${analysis.frameworks.join(', ')} detected - Client-side rendering may affect SEO`;
      analysis.seoIssues.push(frameworkWarning);
      console.log('Added framework warning:', frameworkWarning);
      
      // Add specific framework-related warnings
      if (seoChecks.noScript) {
        const noscriptWarning = 'No <noscript> tag found - Add fallback content for users without JavaScript';
        analysis.seoIssues.push(noscriptWarning);
        console.log('Added noscript warning:', noscriptWarning);
      }
      
      if (seoChecks.hasHydrationMarkers) {
        const hydrationWarning = 'Client-side hydration detected - Consider implementing SSR for better SEO';
        analysis.seoIssues.push(hydrationWarning);
        console.log('Added hydration warning:', hydrationWarning);
      }

      // Always add CSR warning for framework usage
      const csrWarning = 'Client-side rendering detected - Consider implementing SSR or dynamic rendering';
      analysis.seoIssues.push(csrWarning);
      console.log('Added CSR warning:', csrWarning);
    }

    // Add other SEO warnings regardless of framework detection
    if (seoChecks.metaDescription) {
      const metaWarning = 'Missing meta description - Add a descriptive meta description';
      analysis.seoIssues.push(metaWarning);
      console.log('Added meta description warning:', metaWarning);
    }

    if (analysis.dynamicContent > 0) {
      const dynamicWarning = 'Dynamic content detected - Ensure critical content is in initial HTML';
      analysis.seoIssues.push(dynamicWarning);
      console.log('Added dynamic content warning:', dynamicWarning);
    }

    if (seoChecks.missingAltText) {
      const altWarning = 'Images missing alt text - Add descriptive alt text for accessibility and SEO';
      analysis.seoIssues.push(altWarning);
      console.log('Added alt text warning:', altWarning);
    }

    // Clean up and deduplicate SEO issues
    analysis.seoIssues = [...new Set(analysis.seoIssues)].filter(Boolean);
    console.log('Final SEO Issues:', analysis.seoIssues);

    // Determine JavaScript dependency level based on framework detection and SEO checks
    let dependencyLevel = 'Low';
    if (analysis.frameworks.length > 0) {
      dependencyLevel = 'High'; // Any framework usage indicates high dependency
    } else if (analysis.dynamicContent > 0) {
      dependencyLevel = 'Medium';
    }

    analysis.dependencyLevel = dependencyLevel;
    console.log('Final Dependency Level:', dependencyLevel);

    return { 
      success: true, 
      analysis,
      technicalDetails: {
        totalScripts: analysis.scripts,
        frameworks: analysis.frameworks,
        dynamicFeatures: analysis.dynamicContent
      }
    };
  } catch (error) {
    console.warn('Analysis error:', error);
    // Return partial analysis even if full analysis fails
    return { 
      success: false, 
      error: 'Limited analysis due to site security restrictions',
      partialAnalysis: {
        scripts: document.getElementsByTagName('script').length,
        seoIssues: ['Analysis limited due to site security restrictions'],
        dependencyLevel: 'Unknown'
      }
    };
  }
}

// Function to create the preview container
function createPreviewContainer() {
  const container = document.createElement('div');
  container.id = 'seo-preview-container';
  container.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #0a0a0a;
    z-index: 999999;
    display: flex;
    flex-direction: row;
  `;

  const leftPane = document.createElement('div');
  leftPane.style.cssText = `
    width: 50%;
    height: 100%;
    border-right: 1px solid #333;
    position: relative;
    display: flex;
    flex-direction: column;
  `;
  
  const rightPane = document.createElement('div');
  rightPane.style.cssText = `
    width: 50%;
    height: 100%;
    position: relative;
    display: flex;
    flex-direction: column;
  `;

  // Create header for left pane
  const leftHeader = document.createElement('div');
  leftHeader.style.cssText = `
    padding: 10px;
    background: #0a0a0a;
    border-bottom: 1px solid #333;
  `;
  leftHeader.innerHTML = '<h2 style="text-align: center; margin: 0; color: #fff;">With JavaScript</h2>';

  // Create header for right pane
  const rightHeader = document.createElement('div');
  rightHeader.style.cssText = `
    padding: 10px;
    background: #0a0a0a;
    border-bottom: 1px solid #333;
  `;
  rightHeader.innerHTML = '<h2 style="text-align: center; margin: 0; color: #fff;">Without JavaScript</h2>';

  // Create content containers with white background
  const leftContent = document.createElement('div');
  leftContent.style.cssText = `
    flex: 1;
    background: white;
    overflow: auto;
  `;

  const rightContent = document.createElement('div');
  rightContent.style.cssText = `
    flex: 1;
    background: white;
    overflow: auto;
  `;

  // Add close button
  const closeButton = document.createElement('button');
  closeButton.textContent = '×';
  closeButton.style.cssText = `
    position: absolute;
    top: 10px;
    right: 10px;
    border: none;
    background: none;
    font-size: 24px;
    cursor: pointer;
    z-index: 1000000;
    color: #fff;
    padding: 5px 10px;
    border-radius: 4px;
  `;
  closeButton.onmouseover = () => closeButton.style.backgroundColor = 'rgba(255,255,255,0.1)';
  closeButton.onmouseout = () => closeButton.style.backgroundColor = 'transparent';
  closeButton.onclick = () => container.remove();

  // Assemble the panes
  leftPane.appendChild(leftHeader);
  leftPane.appendChild(leftContent);
  rightPane.appendChild(rightHeader);
  rightPane.appendChild(rightContent);

  container.appendChild(leftPane);
  container.appendChild(rightPane);
  container.appendChild(closeButton);

  return {
    container,
    leftContent,
    rightContent
  };
}

// Message listener for extension commands
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'showPreview') {
    try {
      const originalContent = document.documentElement.outerHTML;
      previewContainer = createPreviewContainer();
      document.body.appendChild(previewContainer.container);

      // Create iframe with JavaScript enabled (left pane)
      const jsEnabledIframe = createPreviewIframe(originalContent, false);
      previewContainer.leftContent.appendChild(jsEnabledIframe);

      // Create iframe with JavaScript disabled (right pane)
      const jsDisabledIframe = createPreviewIframe(originalContent, true);
      previewContainer.rightContent.appendChild(jsDisabledIframe);

      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ 
        success: false, 
        error: 'Unable to create preview due to site security restrictions'
      });
    }
  } else if (request.action === 'hidePreview') {
    if (previewContainer) {
      previewContainer.container.remove();
      previewContainer = null;
    }
    sendResponse({ success: true });
  } else if (request.action === 'getAnalysis') {
    // Immediately send a response to keep the message port open
    analyzePage()
      .then(result => {
        try {
          sendResponse(result);
        } catch (e) {
          console.warn('Error sending analysis response:', e);
          sendResponse({
            success: false,
            error: 'Error processing analysis',
            partialAnalysis: {
              scripts: document.getElementsByTagName('script').length,
              seoIssues: ['Analysis limited due to technical issues'],
              dependencyLevel: 'Unknown'
            }
          });
        }
      })
      .catch(error => {
        console.warn('Analysis error:', error);
        sendResponse({
          success: false,
          error: 'Error during analysis',
          partialAnalysis: {
            scripts: document.getElementsByTagName('script').length,
            seoIssues: ['Analysis failed due to an error'],
            dependencyLevel: 'Unknown'
          }
        });
      });
    return true; // Keep the message channel open
  } else if (request.action === 'getState') {
    sendResponse({ isPreviewActive: !!previewContainer });
  }
  return true;
}); 