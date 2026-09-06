/**
 * AGY RTL — Preload Injection Snippet
 * Appended to Antigravity's preload.js at patch time.
 *
 * Only applies RTL direction to individual text elements containing
 * Persian/Arabic/Hebrew characters. Does NOT change the app layout.
 *
 * MARKER: __AGY_RTL_INJECTED__
 */
(function _agyRtlPreloadInit() {
  if (typeof document === 'undefined') {
    const { webFrame } = require('electron');
    webFrame.executeJavaScript(`(${_agyRtlRendererMain.toString()})();`);
    return;
  }
  _agyRtlRendererMain();
})();

function _agyRtlRendererMain() {
  'use strict';

  if (window.__AGY_RTL_LOADED__) return;
  window.__AGY_RTL_LOADED__ = true;

  // ─── Config ──────────────────────────────────────────────
  var STORAGE_KEY = 'agy-rtl-enabled';
  var PANEL_ID = 'agy-rtl-panel';
  var TOGGLE_BTN_ID = 'agy-rtl-toggle-btn';
  var STATUS_ICON_ID = 'agy-rtl-status-icon';
  var GITHUB_URL = 'https://github.com/VaFa1726/antigravity-rtl-patcher';
  var PROCESSED_ATTR = 'data-agy-rtl';

  var RTL_REGEX = /[\u0591-\u07FF\u200F\u202B\u202E\uFB1D-\uFDFD\uFE70-\uFEFC]/;
  var RTL_CHAR_REGEX = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/g;
  var MIN_RTL_RATIO = 0.25;

  // ─── State ───────────────────────────────────────────────
  var isEnabled = getStoredState();
  var observer = null;
  var panelVisible = false;
  var hoverTimeout = null;

  // ─── CSS ─────────────────────────────────────────────────
  var CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;700&display=swap');

    /* RTL styling — applied per-element, NOT globally */
    [${PROCESSED_ATTR}="true"] {
      direction: rtl !important;
      text-align: right !important;
      unicode-bidi: plaintext !important;
      font-family: 'Vazirmatn', system-ui, -apple-system, 'Segoe UI', sans-serif !important;
      line-height: 1.8 !important;
    }

    /* Keep code LTR inside RTL blocks */
    [${PROCESSED_ATTR}="true"] code,
    [${PROCESSED_ATTR}="true"] pre {
      direction: ltr !important;
      text-align: left !important;
      unicode-bidi: isolate !important;
      font-family: 'Cascadia Code', 'Fira Code', 'JetBrains Mono', Consolas, monospace !important;
      display: inline-block;
    }
    [${PROCESSED_ATTR}="true"] code {
      margin: 0 3px;
      padding: 1px 5px;
      border-radius: 3px;
    }
    [${PROCESSED_ATTR}="true"] li {
      list-style-position: inside;
    }

    /* === Status Bar Icon === */
    .agy-rtl-status-icon {
      position: fixed;
      bottom: 6px;
      right: 16px;
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      height: 28px;
      padding: 0 12px;
      cursor: pointer;
      border-radius: 14px;
      user-select: none;
      -webkit-user-select: none;
      transition: background .2s, opacity .2s, box-shadow .2s;
      opacity: .6;
      font-family: -apple-system, 'Segoe UI', system-ui, sans-serif;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: .03em;
      color: #888;
      background: rgba(128,128,128,.08);
    }
    .agy-rtl-status-icon:hover {
      opacity: 1;
      background: rgba(128,128,128,.15);
      color: #aaa;
    }
    .agy-rtl-status-icon.active {
      color: #5ba0d6;
      opacity: .85;
      background: rgba(91,160,214,.08);
    }
    .agy-rtl-status-icon.active:hover {
      opacity: 1;
      background: rgba(91,160,214,.15);
      box-shadow: 0 0 12px rgba(91,160,214,.12);
    }
    .agy-rtl-status-icon svg {
      flex-shrink: 0;
    }

    /* === Panel === */
    .agy-rtl-panel {
      position: fixed;
      z-index: 100000;
      width: 260px;
      background: #1e1e1e;
      border: 1px solid #333;
      border-radius: 10px;
      box-shadow: 0 12px 40px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.04);
      padding: 0;
      opacity: 0;
      visibility: hidden;
      transform: translateY(6px);
      transition: opacity .15s ease, transform .15s ease, visibility .15s ease;
      font-family: -apple-system, 'Segoe UI', system-ui, sans-serif;
      font-size: 13px;
      color: #ccc;
      overflow: hidden;
      direction: ltr !important;
      text-align: left !important;
    }
    .agy-rtl-panel.visible {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }
    .agy-rtl-panel-header {
      padding: 14px 16px 12px;
      background: rgba(255,255,255,.03);
      border-bottom: 1px solid #2a2a2a;
    }
    .agy-rtl-panel-title {
      font-size: 13px;
      font-weight: 600;
      color: #e0e0e0;
    }
    .agy-rtl-panel-body {
      padding: 8px 16px 12px;
    }
    .agy-rtl-panel-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 0;
    }
    .agy-rtl-panel-label {
      font-size: 13px;
      color: #b0b0b0;
    }

    /* Toggle */
    .agy-rtl-switch {
      position: relative;
      display: inline-block;
      width: 36px;
      height: 20px;
      cursor: pointer;
      flex-shrink: 0;
    }
    .agy-rtl-switch input { opacity: 0; width: 0; height: 0; position: absolute; }
    .agy-rtl-slider {
      position: absolute;
      inset: 0;
      background: #444;
      border-radius: 20px;
      transition: background .2s;
    }
    .agy-rtl-slider::before {
      content: '';
      position: absolute;
      width: 14px;
      height: 14px;
      left: 3px;
      bottom: 3px;
      background: #fff;
      border-radius: 50%;
      transition: transform .2s;
      box-shadow: 0 1px 2px rgba(0,0,0,.3);
    }
    .agy-rtl-switch input:checked + .agy-rtl-slider {
      background: #4b9cf5;
    }
    .agy-rtl-switch input:checked + .agy-rtl-slider::before {
      transform: translateX(16px);
    }

    /* Footer */
    .agy-rtl-panel-footer {
      padding: 8px 16px;
      background: rgba(255,255,255,.02);
      border-top: 1px solid #2a2a2a;
      text-align: center;
    }
    .agy-rtl-gh-link {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      color: #555;
      text-decoration: none;
      font-size: 11px;
      transition: color .15s;
    }
    .agy-rtl-gh-link:hover { color: #9cdcfe; }
  `;

  // ─── Helpers ─────────────────────────────────────────────

  function getStoredState() {
    try { var s = localStorage.getItem(STORAGE_KEY); return s === null ? false : s === 'true'; }
    catch (e) { return false; }
  }
  function setStoredState(v) {
    try { localStorage.setItem(STORAGE_KEY, v ? 'true' : 'false'); } catch (e) {}
  }
  function isRTL(text) {
    if (!text || text.trim().length === 0) return false;
    if (!RTL_REGEX.test(text)) return false;
    var m = text.match(RTL_CHAR_REGEX);
    if (!m) return false;
    var alpha = text.replace(/[\s\d\W]/g, '').length;
    return alpha > 0 && (m.length / alpha) >= MIN_RTL_RATIO;
  }
  function applyRTL(el) {
    if (el.getAttribute(PROCESSED_ATTR)) return;
    // Skip the RTL panel/icon itself
    if (el.closest && (el.closest('#' + PANEL_ID) || el.closest('#' + STATUS_ICON_ID))) return;
    var directText = Array.from(el.childNodes)
        .filter(n => n.nodeType === Node.TEXT_NODE)
        .map(n => n.textContent)
        .join(' ');
    if (directText.trim().length > 0 && isRTL(directText)) {
      el.setAttribute(PROCESSED_ATTR, 'true');
    }
  }
  function removeRTL(el) {
    if (el.getAttribute(PROCESSED_ATTR)) {
      el.removeAttribute(PROCESSED_ATTR);
      el.removeAttribute('dir'); // Ensure dir is cleaned up if it was left over from older versions
    }
  }

  // Wide selectors — catch all text-bearing elements
  var SELECTORS = [
    'p', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'td', 'th', 'span', 'a', 'label',
    'button',
  ].join(',');

  function scanElement(root) {
    if (!root || root.nodeType !== 1) return;
    // Skip our own UI
    if (root.id === PANEL_ID || root.id === STATUS_ICON_ID) return;
    if (root.closest && (root.closest('#' + PANEL_ID) || root.closest('#' + STATUS_ICON_ID))) return;

    try { if (root.matches && root.matches(SELECTORS)) applyRTL(root); } catch (e) {}
    try { root.querySelectorAll(SELECTORS).forEach(applyRTL); } catch (e) {}
  }
  function clearAllRTL() {
    try { document.querySelectorAll('[' + PROCESSED_ATTR + ']').forEach(removeRTL); } catch (e) {}
  }

  // ─── Observer ────────────────────────────────────────────

  function startObserver() {
    if (observer) return;
    observer = new MutationObserver(function (muts) {
      if (!isEnabled) return;
      muts.forEach(function (m) {
        m.addedNodes.forEach(function (n) { if (n.nodeType === 1) scanElement(n); });
        if (m.type === 'characterData' && m.target.parentElement) applyRTL(m.target.parentElement);
      });
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    scanElement(document.body);
  }

  function stopObserver() {
    if (observer) { observer.disconnect(); observer = null; }
    clearAllRTL();
  }

  // ─── UI ──────────────────────────────────────────────────

  function injectCSS() {
    if (document.getElementById('agy-rtl-styles')) return;
    var s = document.createElement('style');
    s.id = 'agy-rtl-styles';
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  function createStatusIcon() {
    if (document.getElementById(STATUS_ICON_ID)) return;

    var icon = document.createElement('div');
    icon.id = STATUS_ICON_ID;
    icon.className = 'agy-rtl-status-icon' + (isEnabled ? ' active' : '');
    icon.setAttribute('title', 'Antigravity Smart RTL');

    // Globe SVG
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '15');
    svg.setAttribute('height', '15');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.8');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');

    var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '12'); circle.setAttribute('cy', '12'); circle.setAttribute('r', '10');
    svg.appendChild(circle);
    var line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line1.setAttribute('x1', '2'); line1.setAttribute('y1', '12');
    line1.setAttribute('x2', '22'); line1.setAttribute('y2', '12');
    svg.appendChild(line1);
    var ell = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    ell.setAttribute('d', 'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z');
    svg.appendChild(ell);
    icon.appendChild(svg);

    var lbl = document.createElement('span');
    lbl.textContent = 'RTL';
    lbl.style.cssText = 'direction:ltr!important;';
    icon.appendChild(lbl);

    // Hover to open panel
    icon.addEventListener('mouseenter', function () {
      clearTimeout(hoverTimeout);
      hoverTimeout = setTimeout(function () { showPanel(); }, 200);
    });
    icon.addEventListener('mouseleave', function () {
      clearTimeout(hoverTimeout);
      hoverTimeout = setTimeout(function () {
        var panel = document.getElementById(PANEL_ID);
        if (panel && !panel.matches(':hover')) hidePanel();
      }, 300);
    });
    // Also toggle on click
    icon.addEventListener('click', function (e) {
      e.stopPropagation();
      if (panelVisible) hidePanel(); else showPanel();
    });

    document.body.appendChild(icon);
  }

  function createPanel() {
    if (document.getElementById(PANEL_ID)) return;

    var panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.className = 'agy-rtl-panel';

    // Keep panel open on hover
    panel.addEventListener('mouseenter', function () { clearTimeout(hoverTimeout); });
    panel.addEventListener('mouseleave', function () {
      hoverTimeout = setTimeout(function () { hidePanel(); }, 300);
    });

    // Header
    var header = document.createElement('div');
    header.className = 'agy-rtl-panel-header';
    var title = document.createElement('span');
    title.className = 'agy-rtl-panel-title';
    title.textContent = 'Antigravity Smart RTL';
    header.appendChild(title);
    panel.appendChild(header);

    // Body
    var body = document.createElement('div');
    body.className = 'agy-rtl-panel-body';

    var row = document.createElement('div');
    row.className = 'agy-rtl-panel-row';
    var label = document.createElement('span');
    label.className = 'agy-rtl-panel-label';
    label.textContent = 'Enabled';
    row.appendChild(label);

    var sw = document.createElement('label');
    sw.className = 'agy-rtl-switch';
    var cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.id = TOGGLE_BTN_ID;
    cb.checked = isEnabled;
    var slider = document.createElement('span');
    slider.className = 'agy-rtl-slider';
    sw.appendChild(cb);
    sw.appendChild(slider);
    row.appendChild(sw);
    body.appendChild(row);
    panel.appendChild(body);

    // Footer
    var footer = document.createElement('div');
    footer.className = 'agy-rtl-panel-footer';
    var ghLink = document.createElement('a');
    ghLink.className = 'agy-rtl-gh-link';
    ghLink.href = GITHUB_URL;
    ghLink.target = '_blank';
    ghLink.rel = 'noopener noreferrer';

    var ghSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    ghSvg.setAttribute('width', '12'); ghSvg.setAttribute('height', '12');
    ghSvg.setAttribute('viewBox', '0 0 16 16'); ghSvg.setAttribute('fill', 'currentColor');
    var ghP = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    ghP.setAttribute('d', 'M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z');
    ghSvg.appendChild(ghP);
    ghLink.appendChild(ghSvg);
    var ghText = document.createElement('span');
    ghText.textContent = 'Star on GitHub';
    ghLink.appendChild(ghText);
    footer.appendChild(ghLink);
    panel.appendChild(footer);

    // Toggle event
    cb.addEventListener('change', function () {
      isEnabled = cb.checked;
      setStoredState(isEnabled);
      updateState();
    });

    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panelVisible) hidePanel();
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      var p = document.getElementById(PANEL_ID);
      var ic = document.getElementById(STATUS_ICON_ID);
      if (p && panelVisible && !p.contains(e.target) && !ic.contains(e.target)) hidePanel();
    });

    document.body.appendChild(panel);
  }

  function showPanel() {
    var panel = document.getElementById(PANEL_ID);
    if (!panel) { createPanel(); panel = document.getElementById(PANEL_ID); }
    var icon = document.getElementById(STATUS_ICON_ID);
    if (icon) {
      var r = icon.getBoundingClientRect();
      panel.style.bottom = (window.innerHeight - r.top + 8) + 'px';
      panel.style.right = (window.innerWidth - r.right) + 'px';
    }
    panel.classList.add('visible');
    panelVisible = true;
  }

  function hidePanel() {
    var panel = document.getElementById(PANEL_ID);
    if (panel) panel.classList.remove('visible');
    panelVisible = false;
  }

  function updateState() {
    var icon = document.getElementById(STATUS_ICON_ID);
    if (icon) {
      if (isEnabled) icon.classList.add('active');
      else icon.classList.remove('active');
    }
    var cb = document.getElementById(TOGGLE_BTN_ID);
    if (cb) cb.checked = isEnabled;

    if (isEnabled) startObserver();
    else stopObserver();
  }

  // ─── Init ────────────────────────────────────────────────

  function init() {
    injectCSS();
    createStatusIcon();
    createPanel();
    updateState();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 800);
  }
}
