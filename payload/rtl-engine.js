/**
 * AGY RTL Engine v2.0.0
 * Intelligent RTL detection & styling for Antigravity IDE
 * 
 * This script runs inside the Electron renderer process.
 * It uses MutationObserver to watch for DOM changes and
 * automatically applies RTL direction to Persian/Arabic/Hebrew text.
 * 
 * CSP Compatible: No use of innerHTML, eval, or inline event handlers.
 */
(function () {
  'use strict';

  // Unicode ranges for RTL scripts
  const RTL_REGEX = /[\u0591-\u07FF\u200F\u202B\u202E\uFB1D-\uFDFD\uFE70-\uFEFC]/;

  // Minimum ratio of RTL characters to consider text as RTL
  const RTL_CHAR_REGEX = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/g;
  const MIN_RTL_RATIO = 0.3;

  // Attribute to mark processed elements
  const PROCESSED_ATTR = 'data-agy-rtl';

  // Selectors to target (chat messages, markdown output, editor tooltips)
  const TARGET_SELECTORS = [
    // Chat and AI response areas
    '.chat-response-content p',
    '.chat-response-content li',
    '.chat-response-content h1',
    '.chat-response-content h2',
    '.chat-response-content h3',
    '.chat-response-content h4',
    '.chat-response-content blockquote',
    // Markdown preview
    '.markdown-body p',
    '.markdown-body li',
    '.markdown-body h1',
    '.markdown-body h2',
    '.markdown-body h3',
    '.markdown-body blockquote',
    // Generic rendered text
    '.rendered-markdown p',
    '.rendered-markdown li',
    '.rendered-markdown h1',
    '.rendered-markdown h2',
    '.rendered-markdown h3',
    '.rendered-markdown blockquote',
    // Monaco editor hover & tooltips
    '.monaco-hover-content p',
    '.suggest-details p',
    // Notifications
    '.notification-toast-container p',
    // Generic paragraphs and spans in webview
    'p', 'li', 'h1', 'h2', 'h3', 'h4', 'blockquote',
  ].join(', ');

  /**
   * Determine if a text string is primarily RTL.
   */
  function isRTL(text) {
    if (!text || text.trim().length === 0) return false;

    // Quick check: does it contain any RTL character at all?
    if (!RTL_REGEX.test(text)) return false;

    // Count RTL characters vs total alphabetic characters
    const rtlMatches = text.match(RTL_CHAR_REGEX);
    if (!rtlMatches) return false;

    const alphaChars = text.replace(/[\s\d\W]/g, '').length;
    if (alphaChars === 0) return false;

    return (rtlMatches.length / alphaChars) >= MIN_RTL_RATIO;
  }

  /**
   * Apply RTL styling to an element.
   */
  function applyRTL(element) {
    if (element.getAttribute(PROCESSED_ATTR)) return;

    const text = element.textContent || '';
    if (isRTL(text)) {
      element.setAttribute(PROCESSED_ATTR, 'true');
      element.style.direction = 'rtl';
      element.style.textAlign = 'start';
      element.style.unicodeBidi = 'plaintext';
    }
  }

  /**
   * Scan a subtree for elements that need RTL.
   */
  function scanElement(root) {
    if (!root || root.nodeType !== Node.ELEMENT_NODE) return;

    // Check if the root itself matches
    try {
      if (root.matches && root.matches(TARGET_SELECTORS)) {
        applyRTL(root);
      }
    } catch (e) {
      // Ignore selector errors
    }

    // Scan children
    try {
      const elements = root.querySelectorAll(TARGET_SELECTORS);
      elements.forEach(function (el) {
        applyRTL(el);
      });
    } catch (e) {
      // Ignore errors
    }
  }

  /**
   * Initialize the MutationObserver.
   */
  function initObserver() {
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        // Handle added nodes
        mutation.addedNodes.forEach(function (node) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            scanElement(node);
          }
        });

        // Handle text content changes
        if (mutation.type === 'characterData' && mutation.target.parentElement) {
          applyRTL(mutation.target.parentElement);
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    // Initial full-page scan
    scanElement(document.body);
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initObserver);
  } else {
    // DOM already loaded, wait a moment for dynamic content
    setTimeout(initObserver, 500);
  }

  console.log('%c🌌 AGY RTL Engine v2.0.0 loaded', 'color: cyan; font-weight: bold;');
})();
