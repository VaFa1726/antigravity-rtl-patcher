/* ANTIGRAVITY_RTL_PATCH_v3 */

win.webContents.on('console-message', (event, ...args) => {
    let message = '';
    if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null) {
        message = args[0].message;
    } else {
        message = args[1];
    }
    
    if (typeof message === 'string' && message.startsWith('RTL_CONFIG_SAVE:')) {
        try {
            const configData = message.substring(16);
            const configPath = require('path').join(require('os').homedir(), '.antigravity-rtl.json');
            require('fs').writeFileSync(configPath, configData, 'utf8');
        } catch (err) {}
    }
});

void win.loadURL(url);

win.webContents.on('dom-ready', () => {
    try {
        let rtlConfig = { enabled: true };
        try {
            const configPath = require('path').join(require('os').homedir(), '.antigravity-rtl.json');
            if (require('fs').existsSync(configPath)) {
                const cfg = JSON.parse(require('fs').readFileSync(configPath, 'utf8'));
                rtlConfig = { ...rtlConfig, ...cfg };
            }
        } catch (err) {}
        
        win.webContents.executeJavaScript(`
            (function initRTL() {
                if (window.__RTL_LOADED__) return;
                window.__RTL_LOADED__ = true;
                
                let rtlEnabled = ${rtlConfig.enabled};
                let panelVisible = false;
                let mutObserver = null;
                
                // Persian / Arabic / Hebrew unicode ranges
                const RTL_REGEX = /[\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF\\uFB50-\\uFDFD\\uFE70-\\uFEFF\\u0590-\\u05FF]/;
                
                // Block-level elements where we want to set direction
                const BLOCK_TAGS = new Set([
                    'P','LI','H1','H2','H3','H4','H5','H6',
                    'TD','TH','BLOCKQUOTE','DIV','SECTION','ARTICLE','SPAN'
                ]);
                
                // Tags whose text should never be RTL
                const ALWAYS_LTR_TAGS = new Set([
                    'PRE','CODE','SCRIPT','STYLE','BUTTON','INPUT',
                    'SELECT','OPTION','LABEL','SVG','PATH','NAV',
                    'ASIDE','HEADER','FOOTER'
                ]);
                
                // Ancestor class patterns → skip RTL (ONLY very specific UI areas)
                const SKIP_PATTERNS = [
                    'sidebar', 'nav-', '-nav', 'navigation',
                    'toolbar', 'topbar',
                    'conversation-list', 'history-list',
                    'project-list', 'settings-page',
                    'rtl-ui'
                ];
                
                function isInsideLTRArea(el) {
                    let node = el;
                    let depth = 0;
                    while (node && depth < 15) {
                        if (!node.tagName) { node = node.parentElement; depth++; continue; }
                        
                        // Always-LTR tags
                        if (ALWAYS_LTR_TAGS.has(node.tagName)) return true;
                        
                        // RTL panel itself
                        if (node.id === 'rtl-panel' || node.id === 'rtl-trigger' || node.id === 'rtl-toggle') return true;
                        
                        // Semantic nav/aside/header/footer
                        if (['NAV','ASIDE','HEADER','FOOTER'].includes(node.tagName)) return true;
                        
                        // Role-based skip
                        const role = node.getAttribute ? (node.getAttribute('role') || '') : '';
                        if (['navigation','menubar','menu','tablist','complementary'].includes(role)) return true;
                        
                        // Class-based skip — ONLY very specific patterns
                        if (node.classList && node.classList.length) {
                            const classStr = Array.from(node.classList).join(' ').toLowerCase();
                            for (const pat of SKIP_PATTERNS) {
                                if (classStr.includes(pat)) return true;
                            }
                        }
                        
                        node = node.parentElement;
                        depth++;
                    }
                    return false;
                }
                
                // Find nearest block-level ancestor to set direction on
                function getNearestBlock(textNode) {
                    let el = textNode.parentElement;
                    while (el) {
                        if (BLOCK_TAGS.has(el.tagName)) return el;
                        el = el.parentElement;
                    }
                    return textNode.parentElement;
                }
                
                // Walk all text nodes under root, find those with RTL chars,
                // and mark their nearest block container as RTL
                function applyRTLToSubtree(root) {
                    const walker = document.createTreeWalker(
                        root,
                        NodeFilter.SHOW_TEXT,
                        {
                            acceptNode(node) {
                                // Skip empty text nodes
                                if (!node.textContent.trim()) return NodeFilter.FILTER_SKIP;
                                // Skip if parent is a "always LTR" tag
                                if (node.parentElement && ALWAYS_LTR_TAGS.has(node.parentElement.tagName)) return NodeFilter.FILTER_SKIP;
                                return NodeFilter.FILTER_ACCEPT;
                            }
                        }
                    );
                    
                    const seen = new Set();
                    let textNode;
                    while ((textNode = walker.nextNode())) {
                        if (!RTL_REGEX.test(textNode.textContent)) continue;
                        
                        const block = getNearestBlock(textNode);
                        if (!block || seen.has(block)) continue;
                        seen.add(block);
                        
                        if (isInsideLTRArea(block)) continue;
                        
                        block.setAttribute('data-rtl-forced', '1');
                        block.style.direction = 'rtl';
                        block.style.textAlign = 'right';
                    }
                }
                
                function removeRTLFromAll() {
                    document.querySelectorAll('[data-rtl-forced]').forEach(el => {
                        el.style.direction = '';
                        el.style.textAlign = '';
                        el.removeAttribute('data-rtl-forced');
                    });
                }
                
                // ─── CSS: only what JS can't handle ───────────────────────
                const CSS = \`
                    /* Code blocks: always LTR */
                    body.rtl-active pre,
                    body.rtl-active code,
                    body.rtl-active pre *,
                    body.rtl-active code * {
                        direction: ltr !important;
                        text-align: left !important;
                        font-family: 'Courier New', Consolas, Monaco, monospace !important;
                    }
                    /* NOTE: textarea/input RTL is handled by JS (setupInputRTL)
                       so placeholder stays LTR when field is empty */
                    /* Lists padding */
                    body.rtl-active [data-rtl-forced] ul,
                    body.rtl-active [data-rtl-forced] ol {
                        padding-left: 0 !important;
                        padding-right: 1.5rem !important;
                    }
                    /* Panel UI */
                    #rtl-trigger {
                        position: fixed; bottom: 20px; right: 20px; z-index: 999998;
                        width: 50px; height: 50px; border-radius: 50%;
                        background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
                        border: none; color: white; cursor: pointer;
                        display: flex; align-items: center; justify-content: center;
                        font-size: 24px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    }
                    #rtl-trigger:hover {
                        transform: scale(1.1) rotate(180deg);
                        background: linear-gradient(135deg, #3182ce 0%, #2c5282 100%);
                        box-shadow: 0 6px 20px rgba(49,130,206,0.4);
                    }
                    #rtl-trigger.active {
                        background: linear-gradient(135deg, #3182ce 0%, #2c5282 100%);
                        box-shadow: 0 4px 12px rgba(49,130,206,0.4);
                    }
                    #rtl-panel {
                        position: fixed; bottom: 80px; right: 20px; z-index: 999999;
                        width: 300px; background: rgba(255,255,255,0.95);
                        backdrop-filter: blur(10px); border-radius: 16px;
                        box-shadow: 0 8px 32px rgba(0,0,0,0.2);
                        opacity: 0; transform: translateY(20px) scale(0.9);
                        pointer-events: none;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        overflow: hidden; direction: ltr;
                    }
                    #rtl-panel.visible { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }
                    @media (prefers-color-scheme: dark) {
                        #rtl-panel { background: rgba(30,30,40,0.95); color: #e0e0e0; }
                    }
                    .rtl-panel-header {
                        padding: 20px;
                        background: linear-gradient(135deg, #3182ce 0%, #2c5282 100%);
                        color: white; text-align: center; font-weight: 600;
                        font-size: 16px; direction: ltr;
                    }
                    .rtl-panel-body { padding: 24px; direction: ltr; }
                    .rtl-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
                    .rtl-label { font-size: 14px; font-weight: 500; color: #333; }
                    @media (prefers-color-scheme: dark) { .rtl-label { color: #e0e0e0; } }
                    .rtl-switch {
                        position: relative; width: 52px; height: 28px;
                        background: #ddd; border-radius: 14px;
                        cursor: pointer; transition: background 0.3s;
                    }
                    .rtl-switch.active { background: linear-gradient(135deg, #3182ce 0%, #2c5282 100%); }
                    .rtl-switch::after {
                        content: ''; position: absolute;
                        width: 22px; height: 22px; background: white;
                        border-radius: 50%; top: 3px; left: 3px;
                        transition: transform 0.3s; box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    }
                    .rtl-switch.active::after { transform: translateX(24px); }
                    .rtl-panel-footer {
                        padding: 16px 24px;
                        border-top: 1px solid rgba(0,0,0,0.1);
                        display: flex; justify-content: center; direction: ltr;
                    }
                    @media (prefers-color-scheme: dark) {
                        .rtl-panel-footer { border-top: 1px solid rgba(255,255,255,0.1); }
                    }
                    .rtl-github-btn {
                        display: flex; align-items: center; gap: 8px;
                        padding: 10px 20px; background: #24292e; color: white;
                        border: none; border-radius: 8px; cursor: pointer;
                        font-size: 13px; font-weight: 500; text-decoration: none;
                        transition: all 0.2s; direction: ltr;
                    }
                    .rtl-github-btn:hover {
                        background: #1a1f23; transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                    }
                    .rtl-github-icon { width: 18px; height: 18px; }
                \`;
                
                const styleEl = document.createElement('style');
                styleEl.id = 'rtl-main-style';
                styleEl.textContent = CSS;
                document.head.appendChild(styleEl);
                
                if (rtlEnabled) {
                    document.body.classList.add('rtl-active');
                    applyRTLToSubtree(document.body);
                }
                
                // ─── MutationObserver: handle new messages (SPA) ──────────
                function startObserver() {
                    if (mutObserver) return;
                    mutObserver = new MutationObserver((mutations) => {
                        if (!rtlEnabled) return;
                        mutations.forEach(m => {
                            m.addedNodes.forEach(n => {
                                if (n.nodeType === 1) {
                                    applyRTLToSubtree(n);
                                    if (n.matches && n.matches('textarea, [contenteditable="true"], [role="textbox"]')) {
                                        setupInputRTL(n);
                                    }
                                    n.querySelectorAll && n.querySelectorAll('textarea, [contenteditable="true"], [role="textbox"]').forEach(setupInputRTL);
                                }
                            });
                            // Re-check parent when text content changes
                            if (m.type === 'characterData' && m.target.parentElement) {
                                applyRTLToSubtree(m.target.parentElement);
                            }
                        });
                    });
                    mutObserver.observe(document.body, {
                        childList: true, subtree: true, characterData: true
                    });
                }
                
                function stopObserver() {
                    if (mutObserver) { mutObserver.disconnect(); mutObserver = null; }
                }
                
                if (rtlEnabled) startObserver();
                
                // ─── Smart input RTL ──────────────────────────────────────
                // Apply RTL to text inputs ONLY when user has typed RTL chars.
                // When field is empty, direction is reset so placeholder stays LTR.
                function updateInputDir(el) {
                    const text = el.value !== undefined ? el.value : (el.innerText || '');
                    if (!text.trim()) {
                        // Empty — reset so placeholder shows correctly
                        el.style.direction = '';
                        el.style.textAlign = '';
                    } else if (RTL_REGEX.test(text)) {
                        el.style.direction = 'rtl';
                        el.style.textAlign = 'right';
                    } else {
                        // LTR content — also reset
                        el.style.direction = '';
                        el.style.textAlign = '';
                    }
                }
                
                function setupInputRTL(el) {
                    if (!el || el.dataset.rtlInputBound) return;
                    el.dataset.rtlInputBound = '1';
                    el.addEventListener('input', () => { if (rtlEnabled) updateInputDir(el); });
                    el.addEventListener('keyup',  () => { if (rtlEnabled) updateInputDir(el); });
                    if (rtlEnabled) updateInputDir(el);
                }
                
                function setupAllInputs() {
                    document.querySelectorAll(
                        'textarea, [contenteditable="true"], [role="textbox"]'
                    ).forEach(setupInputRTL);
                }
                
                function teardownAllInputs() {
                    document.querySelectorAll('[data-rtl-input-bound]').forEach(el => {
                        el.style.direction = '';
                        el.style.textAlign = '';
                    });
                }
                
                if (rtlEnabled) setupAllInputs();
                
                // ─── UI ───────────────────────────────────────────────────
                const trigger = document.createElement('button');
                trigger.id = 'rtl-trigger';
                trigger.className = rtlEnabled ? 'active rtl-ui' : 'rtl-ui';
                trigger.innerHTML = '⇄';
                trigger.title = 'RTL Settings (Alt+R)';
                
                const panel = document.createElement('div');
                panel.id = 'rtl-panel';
                panel.className = 'rtl-ui';
                panel.innerHTML = \`
                    <div class="rtl-panel-header rtl-ui">Antigravity Smart RTL</div>
                    <div class="rtl-panel-body rtl-ui">
                        <div class="rtl-row rtl-ui">
                            <span class="rtl-label rtl-ui">RTL Mode</span>
                            <div class="rtl-switch \${rtlEnabled ? 'active' : ''} rtl-ui" id="rtl-toggle"></div>
                        </div>
                    </div>
                    <div class="rtl-panel-footer rtl-ui">
                        <a href="https://github.com/VaFa1726/antigravity-rtl-patcher" target="_blank" class="rtl-github-btn rtl-ui">
                            <svg class="rtl-github-icon rtl-ui" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                            </svg>
                            Star on GitHub
                        </a>
                    </div>
                \`;
                
                document.body.appendChild(trigger);
                document.body.appendChild(panel);
                
                trigger.addEventListener('click', (e) => {
                    e.stopPropagation();
                    panelVisible = !panelVisible;
                    panel.classList.toggle('visible', panelVisible);
                });
                
                document.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('rtl-ui')) {
                        panelVisible = false;
                        panel.classList.remove('visible');
                    }
                });
                
                document.getElementById('rtl-toggle').addEventListener('click', () => {
                    rtlEnabled = !rtlEnabled;
                    document.getElementById('rtl-toggle').classList.toggle('active', rtlEnabled);
                    trigger.classList.toggle('active', rtlEnabled);
                    
                    if (rtlEnabled) {
                        document.body.classList.add('rtl-active');
                        applyRTLToSubtree(document.body);
                        setupAllInputs();
                        startObserver();
                    } else {
                        document.body.classList.remove('rtl-active');
                        stopObserver();
                        removeRTLFromAll();
                        teardownAllInputs();
                    }
                    
                    console.log('RTL_CONFIG_SAVE:' + JSON.stringify({ enabled: rtlEnabled }));
                });
                
                document.addEventListener('keydown', (e) => {
                    if (e.altKey && e.code === 'KeyR') {
                        e.preventDefault();
                        document.getElementById('rtl-toggle').click();
                    }
                });
            })();
        `).catch(err => console.error('[RTL] Injection failed:', err));
        
    } catch (error) {
        console.error('[RTL] Init error:', error);
    }
});
