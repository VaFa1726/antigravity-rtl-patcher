/**
 * AGY RTL Engine v2.1.0
 * Intelligent RTL detection & styling for Antigravity
 *
 * This script runs inside the Electron renderer process.
 * It uses MutationObserver to watch for DOM changes and
 * automatically applies RTL direction to Persian/Arabic/Hebrew text.
 *
 * Features:
 * - Toggle panel UI with Enable/Disable switch
 * - Persistent state via localStorage
 * - Real-time apply/remove across all pages
 *
 * CSP Compatible: No use of innerHTML, eval, or inline event handlers.
 */
(function () {
  'use strict';

  // ─── Configuration ───────────────────────────────────────
  const STORAGE_KEY = 'agy-rtl-enabled';
  const PANEL_ID = 'agy-rtl-panel';
  const TOGGLE_BTN_ID = 'agy-rtl-toggle-btn';
  const STATUS_ICON_ID = 'agy-rtl-status-icon';
  const GITHUB_URL = 'https://github.com/VaFa1726/antigravity-rtl-patcher';

  // Unicode ranges for RTL scripts
  const RTL_REGEX = /[\u0591-\u07FF\u200F\u202B\u202E\uFB1D-\uFDFD\uFE70-\uFEFC]/;
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

  // ─── State ───────────────────────────────────────────────
  var isEnabled = getStoredState();
  var observer = null;
  var panelVisible = false;

  // ─── Helpers ─────────────────────────────────────────────

  function getStoredState() {
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored === null) return true; // Default: enabled
      return stored === 'true';
    } catch (e) {
      return true;
    }
  }

  function setStoredState(val) {
    try {
      localStorage.setItem(STORAGE_KEY, val ? 'true' : 'false');
    } catch (e) {
      // Ignore storage errors
    }
  }

  /**
   * Determine if a text string is primarily RTL.
   */
  function isRTL(text) {
    if (!text || text.trim().length === 0) return false;
    if (!RTL_REGEX.test(text)) return false;

    var rtlMatches = text.match(RTL_CHAR_REGEX);
    if (!rtlMatches) return false;

    var alphaChars = text.replace(/[\s\d\W]/g, '').length;
    if (alphaChars === 0) return false;

    return (rtlMatches.length / alphaChars) >= MIN_RTL_RATIO;
  }

  /**
   * Apply RTL styling to an element.
   */
  function applyRTL(element) {
    if (element.getAttribute(PROCESSED_ATTR)) return;

    var text = element.textContent || '';
    if (isRTL(text)) {
      element.setAttribute(PROCESSED_ATTR, 'true');
      element.style.direction = 'rtl';
      element.style.textAlign = 'start';
      element.style.unicodeBidi = 'plaintext';
    }
  }

  /**
   * Remove RTL styling from an element.
   */
  function removeRTL(element) {
    if (element.getAttribute(PROCESSED_ATTR)) {
      element.removeAttribute(PROCESSED_ATTR);
      element.style.direction = '';
      element.style.textAlign = '';
      element.style.unicodeBidi = '';
    }
  }

  /**
   * Scan a subtree for elements that need RTL.
   */
  function scanElement(root) {
    if (!root || root.nodeType !== Node.ELEMENT_NODE) return;

    try {
      if (root.matches && root.matches(TARGET_SELECTORS)) {
        applyRTL(root);
      }
    } catch (e) { /* Ignore */ }

    try {
      var elements = root.querySelectorAll(TARGET_SELECTORS);
      elements.forEach(function (el) {
        applyRTL(el);
      });
    } catch (e) { /* Ignore */ }
  }

  /**
   * Remove RTL from all processed elements.
   */
  function clearAllRTL() {
    try {
      var elements = document.querySelectorAll('[' + PROCESSED_ATTR + ']');
      elements.forEach(function (el) {
        removeRTL(el);
      });
    } catch (e) { /* Ignore */ }
  }

  // ─── MutationObserver ────────────────────────────────────

  function startObserver() {
    if (observer) return;

    observer = new MutationObserver(function (mutations) {
      if (!isEnabled) return;

      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (node) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            scanElement(node);
          }
        });

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

  function stopObserver() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    clearAllRTL();
  }

  // ─── Toggle Panel UI ────────────────────────────────────

  function createStatusIcon() {
    // Check if icon already exists
    if (document.getElementById(STATUS_ICON_ID)) return;

    var icon = document.createElement('div');
    icon.id = STATUS_ICON_ID;
    icon.className = 'agy-rtl-status-icon';
    icon.setAttribute('role', 'button');
    icon.setAttribute('tabindex', '0');
    icon.setAttribute('title', 'Antigravity Smart RTL');

    // RTL icon SVG
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '16');
    svg.setAttribute('height', '16');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');

    // Pilcrow/RTL icon path
    var path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path1.setAttribute('d', 'M16 4H9.5a3.5 3.5 0 1 0 0 7H12');
    svg.appendChild(path1);

    var path2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    path2.setAttribute('x1', '12');
    path2.setAttribute('y1', '4');
    path2.setAttribute('x2', '12');
    path2.setAttribute('y2', '20');
    svg.appendChild(path2);

    var path3 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    path3.setAttribute('x1', '16');
    path3.setAttribute('y1', '4');
    path3.setAttribute('x2', '16');
    path3.setAttribute('y2', '20');
    svg.appendChild(path3);

    icon.appendChild(svg);

    // Status dot
    var dot = document.createElement('span');
    dot.className = 'agy-rtl-status-dot';
    if (isEnabled) dot.classList.add('active');
    icon.appendChild(dot);

    icon.addEventListener('click', function (e) {
      e.stopPropagation();
      togglePanel();
    });

    icon.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        togglePanel();
      }
    });

    // Try to insert into the status bar, fallback to body
    var statusBar = document.querySelector('.statusbar-item.right') ||
                    document.querySelector('.statusbar') ||
                    document.querySelector('[id*="statusbar"]') ||
                    document.querySelector('.footer') ||
                    document.body;

    if (statusBar === document.body) {
      // Position fixed at bottom-right
      icon.classList.add('agy-rtl-fixed');
      document.body.appendChild(icon);
    } else {
      statusBar.appendChild(icon);
    }
  }

  function createPanel() {
    if (document.getElementById(PANEL_ID)) return;

    var panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.className = 'agy-rtl-panel';

    // ── Header ──
    var header = document.createElement('div');
    header.className = 'agy-rtl-panel-header';

    var title = document.createElement('span');
    title.className = 'agy-rtl-panel-title';
    title.textContent = 'Antigravity Smart RTL';
    header.appendChild(title);
    panel.appendChild(header);

    // ── Toggle Row ──
    var row = document.createElement('div');
    row.className = 'agy-rtl-panel-row';

    var label = document.createElement('span');
    label.className = 'agy-rtl-panel-label';
    label.textContent = 'Enabled';
    row.appendChild(label);

    var toggleWrapper = document.createElement('label');
    toggleWrapper.className = 'agy-rtl-switch';

    var checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = TOGGLE_BTN_ID;
    checkbox.checked = isEnabled;

    var slider = document.createElement('span');
    slider.className = 'agy-rtl-slider';

    toggleWrapper.appendChild(checkbox);
    toggleWrapper.appendChild(slider);
    row.appendChild(toggleWrapper);
    panel.appendChild(row);

    // ── Separator ──
    var sep = document.createElement('div');
    sep.className = 'agy-rtl-panel-sep';
    panel.appendChild(sep);

    // ── GitHub Link ──
    var ghRow = document.createElement('div');
    ghRow.className = 'agy-rtl-panel-row agy-rtl-panel-gh';

    var ghLink = document.createElement('a');
    ghLink.className = 'agy-rtl-gh-link';
    ghLink.href = GITHUB_URL;
    ghLink.target = '_blank';
    ghLink.rel = 'noopener noreferrer';

    // GitHub icon SVG
    var ghSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    ghSvg.setAttribute('width', '14');
    ghSvg.setAttribute('height', '14');
    ghSvg.setAttribute('viewBox', '0 0 16 16');
    ghSvg.setAttribute('fill', 'currentColor');

    var ghPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    ghPath.setAttribute('d', 'M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z');
    ghSvg.appendChild(ghPath);
    ghLink.appendChild(ghSvg);

    var ghText = document.createElement('span');
    ghText.textContent = ' Star on GitHub';
    ghLink.appendChild(ghText);

    ghRow.appendChild(ghLink);
    panel.appendChild(ghRow);

    // ── Event Handlers ──
    checkbox.addEventListener('change', function () {
      isEnabled = checkbox.checked;
      setStoredState(isEnabled);
      updateState();
    });

    // Close panel when clicking outside
    document.addEventListener('click', function (e) {
      var panelEl = document.getElementById(PANEL_ID);
      var iconEl = document.getElementById(STATUS_ICON_ID);
      if (panelEl && panelVisible && !panelEl.contains(e.target) && !iconEl.contains(e.target)) {
        hidePanel();
      }
    });

    document.body.appendChild(panel);
  }

  function togglePanel() {
    if (panelVisible) {
      hidePanel();
    } else {
      showPanel();
    }
  }

  function showPanel() {
    var panel = document.getElementById(PANEL_ID);
    if (!panel) {
      createPanel();
      panel = document.getElementById(PANEL_ID);
    }

    // Position the panel above the icon
    var icon = document.getElementById(STATUS_ICON_ID);
    if (icon) {
      var iconRect = icon.getBoundingClientRect();
      panel.style.bottom = (window.innerHeight - iconRect.top + 8) + 'px';
      panel.style.right = (window.innerWidth - iconRect.right) + 'px';
    }

    panel.classList.add('visible');
    panelVisible = true;
  }

  function hidePanel() {
    var panel = document.getElementById(PANEL_ID);
    if (panel) {
      panel.classList.remove('visible');
    }
    panelVisible = false;
  }

  /**
   * Update the UI and RTL state based on isEnabled.
   */
  function updateState() {
    // Update status dot
    var dot = document.querySelector('.agy-rtl-status-dot');
    if (dot) {
      if (isEnabled) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    }

    // Update toggle checkbox
    var checkbox = document.getElementById(TOGGLE_BTN_ID);
    if (checkbox) {
      checkbox.checked = isEnabled;
    }

    // Apply or remove RTL
    if (isEnabled) {
      startObserver();
    } else {
      stopObserver();
    }
  }

  // ─── Initialization ──────────────────────────────────────

  function init() {
    createStatusIcon();
    createPanel();
    updateState();
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM already loaded, wait a moment for dynamic content
    setTimeout(init, 500);
  }

  console.log('%c🌌 AGY RTL Engine v2.1.0 loaded', 'color: cyan; font-weight: bold;');
})();
