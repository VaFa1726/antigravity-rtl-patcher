/**
 * AGY RTL — Preload Injection Snippet
 * Appended to Antigravity's preload.js at patch time.
 * Injects the RTL engine + toggle panel into every renderer page.
 *
 * MARKER: __AGY_RTL_INJECTED__
 */
(function _agyRtlPreloadInit() {
  // Only run in renderer context
  if (typeof document === 'undefined') {
    // We're in the preload context before DOM exists.
    // Schedule injection for when the page actually loads.
    const { webFrame } = require('electron');

    webFrame.executeJavaScript(`(${_agyRtlRendererMain.toString()})();`);
    return;
  }
  _agyRtlRendererMain();
})();

function _agyRtlRendererMain() {
  'use strict';

  // Prevent double injection
  if (window.__AGY_RTL_LOADED__) return;
  window.__AGY_RTL_LOADED__ = true;

  // ─── Configuration ───────────────────────────────────────
  var STORAGE_KEY = 'agy-rtl-enabled';
  var PANEL_ID = 'agy-rtl-panel';
  var TOGGLE_BTN_ID = 'agy-rtl-toggle-btn';
  var STATUS_ICON_ID = 'agy-rtl-status-icon';
  var GITHUB_URL = 'https://github.com/VaFa1726/antigravity-rtl-patcher';

  // RTL detection
  var RTL_REGEX = /[\u0591-\u07FF\u200F\u202B\u202E\uFB1D-\uFDFD\uFE70-\uFEFC]/;
  var RTL_CHAR_REGEX = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/g;
  var MIN_RTL_RATIO = 0.3;
  var PROCESSED_ATTR = 'data-agy-rtl';

  var TARGET_SELECTORS = [
    'p', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'td', 'th',
    '.chat-response-content p', '.chat-response-content li',
    '.chat-response-content h1', '.chat-response-content h2',
    '.chat-response-content h3', '.chat-response-content h4',
    '.chat-response-content blockquote',
    '.markdown-body p', '.markdown-body li',
    '.markdown-body h1', '.markdown-body h2',
    '.markdown-body h3', '.markdown-body blockquote',
    '.rendered-markdown p', '.rendered-markdown li',
    '.rendered-markdown h1', '.rendered-markdown h2',
    '.rendered-markdown h3', '.rendered-markdown blockquote',
    '.monaco-hover-content p', '.suggest-details p',
    '.notification-toast-container p',
  ].join(', ');

  // ─── State ───────────────────────────────────────────────
  var isEnabled = getStoredState();
  var observer = null;
  var panelVisible = false;

  // ─── CSS ─────────────────────────────────────────────────
  var CSS = [
    '@import url("https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;700&display=swap");',
    '[data-agy-rtl="true"]{font-family:"Vazirmatn",system-ui,-apple-system,"Segoe UI",sans-serif!important;line-height:1.85!important;word-spacing:.02em}',
    '[data-agy-rtl="true"] code,[data-agy-rtl="true"] pre,[data-agy-rtl="true"] .monaco-tokenized-source{direction:ltr!important;text-align:left!important;unicode-bidi:isolate!important;font-family:"Cascadia Code","Fira Code","JetBrains Mono",Consolas,monospace!important;display:inline-block}',
    '[data-agy-rtl="true"] code{margin:0 3px;padding:1px 5px;border-radius:3px}',
    '[data-agy-rtl="true"] li{list-style-position:inside}',
    // Status icon
    '.agy-rtl-status-icon{position:fixed;bottom:0;right:60px;z-index:99999;display:flex;align-items:center;justify-content:center;width:32px;height:22px;cursor:pointer;color:#ccc;opacity:.85;transition:opacity .2s,color .2s,background .15s;border-radius:3px 3px 0 0;user-select:none;-webkit-user-select:none;background:rgba(0,0,0,.25)}',
    '.agy-rtl-status-icon:hover{opacity:1;color:#fff;background:rgba(255,255,255,.12)}',
    '.agy-rtl-status-dot{position:absolute;top:2px;right:2px;width:6px;height:6px;border-radius:50%;background:#666;transition:background .3s,box-shadow .3s}',
    '.agy-rtl-status-dot.active{background:#4caf50;box-shadow:0 0 4px rgba(76,175,80,.6)}',
    // Panel
    '.agy-rtl-panel{position:fixed;z-index:100000;min-width:260px;max-width:300px;background:#252526;border:1px solid #454545;border-radius:8px;box-shadow:0 8px 32px rgba(0,0,0,.45),0 2px 8px rgba(0,0,0,.2);padding:16px;opacity:0;visibility:hidden;transform:translateY(8px) scale(.96);transition:opacity .2s,transform .2s,visibility .2s;font-family:-apple-system,"Segoe UI",system-ui,sans-serif;font-size:13px;color:#ccc}',
    '.agy-rtl-panel.visible{opacity:1;visibility:visible;transform:translateY(0) scale(1)}',
    '.agy-rtl-panel-header{margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid #3a3a3a}',
    '.agy-rtl-panel-title{font-size:14px;font-weight:600;color:#e0e0e0;letter-spacing:-.01em}',
    '.agy-rtl-panel-row{display:flex;align-items:center;justify-content:space-between;padding:6px 0}',
    '.agy-rtl-panel-label{font-size:13px;color:#ccc}',
    '.agy-rtl-panel-sep{height:1px;background:#3a3a3a;margin:8px 0}',
    // Toggle switch
    '.agy-rtl-switch{position:relative;display:inline-block;width:40px;height:22px;cursor:pointer;flex-shrink:0}',
    '.agy-rtl-switch input{opacity:0;width:0;height:0;position:absolute}',
    '.agy-rtl-slider{position:absolute;inset:0;background:#555;border-radius:22px;transition:background .25s,box-shadow .25s}',
    '.agy-rtl-slider::before{content:"";position:absolute;width:16px;height:16px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:transform .25s;box-shadow:0 1px 3px rgba(0,0,0,.3)}',
    '.agy-rtl-switch input:checked+.agy-rtl-slider{background:#4b9cf5;box-shadow:0 0 8px rgba(75,156,245,.3)}',
    '.agy-rtl-switch input:checked+.agy-rtl-slider::before{transform:translateX(18px)}',
    // GitHub link
    '.agy-rtl-panel-gh{justify-content:center;padding-top:4px}',
    '.agy-rtl-gh-link{display:inline-flex;align-items:center;gap:6px;color:#9cdcfe;text-decoration:none;font-size:12px;opacity:.8;transition:opacity .2s}',
    '.agy-rtl-gh-link:hover{opacity:1;text-decoration:underline}',
  ].join('\n');

  // ─── Helpers ─────────────────────────────────────────────

  function getStoredState() {
    try {
      var s = localStorage.getItem(STORAGE_KEY);
      return s === null ? true : s === 'true';
    } catch (e) { return true; }
  }

  function setStoredState(v) {
    try { localStorage.setItem(STORAGE_KEY, v ? 'true' : 'false'); }
    catch (e) { /* ignore */ }
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
    if (isRTL(el.textContent || '')) {
      el.setAttribute(PROCESSED_ATTR, 'true');
      el.style.direction = 'rtl';
      el.style.textAlign = 'start';
      el.style.unicodeBidi = 'plaintext';
    }
  }

  function removeRTL(el) {
    if (el.getAttribute(PROCESSED_ATTR)) {
      el.removeAttribute(PROCESSED_ATTR);
      el.style.direction = '';
      el.style.textAlign = '';
      el.style.unicodeBidi = '';
    }
  }

  function scanElement(root) {
    if (!root || root.nodeType !== 1) return;
    try { if (root.matches && root.matches(TARGET_SELECTORS)) applyRTL(root); } catch (e) {}
    try { root.querySelectorAll(TARGET_SELECTORS).forEach(applyRTL); } catch (e) {}
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
    var style = document.createElement('style');
    style.id = 'agy-rtl-styles';
    style.textContent = CSS;
    (document.head || document.documentElement).appendChild(style);
  }

  function createStatusIcon() {
    if (document.getElementById(STATUS_ICON_ID)) return;

    var icon = document.createElement('div');
    icon.id = STATUS_ICON_ID;
    icon.className = 'agy-rtl-status-icon';
    icon.setAttribute('title', 'Antigravity Smart RTL');

    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '16');
    svg.setAttribute('height', '16');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');

    var p1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p1.setAttribute('d', 'M16 4H9.5a3.5 3.5 0 1 0 0 7H12');
    svg.appendChild(p1);
    var l1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l1.setAttribute('x1', '12'); l1.setAttribute('y1', '4');
    l1.setAttribute('x2', '12'); l1.setAttribute('y2', '20');
    svg.appendChild(l1);
    var l2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l2.setAttribute('x1', '16'); l2.setAttribute('y1', '4');
    l2.setAttribute('x2', '16'); l2.setAttribute('y2', '20');
    svg.appendChild(l2);

    icon.appendChild(svg);

    var dot = document.createElement('span');
    dot.className = 'agy-rtl-status-dot' + (isEnabled ? ' active' : '');
    icon.appendChild(dot);

    icon.addEventListener('click', function (e) { e.stopPropagation(); togglePanel(); });
    document.body.appendChild(icon);
  }

  function createPanel() {
    if (document.getElementById(PANEL_ID)) return;

    var panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.className = 'agy-rtl-panel';

    // Header
    var header = document.createElement('div');
    header.className = 'agy-rtl-panel-header';
    var title = document.createElement('span');
    title.className = 'agy-rtl-panel-title';
    title.textContent = 'Antigravity Smart RTL';
    header.appendChild(title);
    panel.appendChild(header);

    // Toggle row
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
    panel.appendChild(row);

    // Separator
    var sep = document.createElement('div');
    sep.className = 'agy-rtl-panel-sep';
    panel.appendChild(sep);

    // GitHub link
    var ghRow = document.createElement('div');
    ghRow.className = 'agy-rtl-panel-row agy-rtl-panel-gh';
    var ghLink = document.createElement('a');
    ghLink.className = 'agy-rtl-gh-link';
    ghLink.href = GITHUB_URL;
    ghLink.target = '_blank';
    ghLink.rel = 'noopener noreferrer';

    var ghSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    ghSvg.setAttribute('width', '14');
    ghSvg.setAttribute('height', '14');
    ghSvg.setAttribute('viewBox', '0 0 16 16');
    ghSvg.setAttribute('fill', 'currentColor');
    var ghP = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    ghP.setAttribute('d', 'M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z');
    ghSvg.appendChild(ghP);
    ghLink.appendChild(ghSvg);

    var ghText = document.createElement('span');
    ghText.textContent = ' Star on GitHub';
    ghLink.appendChild(ghText);
    ghRow.appendChild(ghLink);
    panel.appendChild(ghRow);

    // Events
    cb.addEventListener('change', function () {
      isEnabled = cb.checked;
      setStoredState(isEnabled);
      updateState();
    });

    document.addEventListener('click', function (e) {
      var p = document.getElementById(PANEL_ID);
      var ic = document.getElementById(STATUS_ICON_ID);
      if (p && panelVisible && !p.contains(e.target) && !ic.contains(e.target)) hidePanel();
    });

    document.body.appendChild(panel);
  }

  function togglePanel() {
    panelVisible ? hidePanel() : showPanel();
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
    var dot = document.querySelector('.agy-rtl-status-dot');
    if (dot) {
      if (isEnabled) dot.classList.add('active');
      else dot.classList.remove('active');
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
