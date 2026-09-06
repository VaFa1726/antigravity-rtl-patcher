/* ═══════════════════════════════════════════════════════════════
 * ANTIGRAVITY RTL PATCH v3.0
 * Advanced RTL & Typography Control for Antigravity
 * 
 * This code is injected into dist/utils.js at the window creation
 * hook point to enable comprehensive RTL support with a rich UI.
 * ═══════════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────────────
// PATCH MARKER: DO NOT REMOVE
// ─────────────────────────────────────────────────────────────────
/* ANTIGRAVITY_RTL_PATCH_v3 */

// ─────────────────────────────────────────────────────────────────
// Hook into console-message for config persistence
// ─────────────────────────────────────────────────────────────────
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
            const configPath = require('path').join(require('os').homedir(), '.antigravity-rtl-v3.json');
            require('fs').writeFileSync(configPath, configData, 'utf8');
        } catch (err) {
            console.error('[RTL] Failed to save config:', err);
        }
    }
});

// ─────────────────────────────────────────────────────────────────
// Original loadURL call - DO NOT MODIFY THIS LINE
// ─────────────────────────────────────────────────────────────────
void win.loadURL(url);

// ─────────────────────────────────────────────────────────────────
// RTL Engine Injection on DOM Ready
// ─────────────────────────────────────────────────────────────────
win.webContents.on('dom-ready', () => {
    try {
        // Load Vazirmatn font
        const fontPath = require('path').join(__dirname, 'Vazirmatn-Variable.woff2');
        const fontBase64 = require('fs').readFileSync(fontPath).toString('base64');
        
        // Load persisted configuration
        const defaultConfig = {
            faFont: '',
            enFont: '',
            codeFont: '',
            lineHeight: '1.6',
            fontSize: '16',
            rtlEnabled: true,
            forceRTL: false,
            fixAtSign: true
        };
        
        let userConfig = { ...defaultConfig };
        try {
            const configPath = require('path').join(require('os').homedir(), '.antigravity-rtl-v3.json');
            if (require('fs').existsSync(configPath)) {
                const loadedConfig = JSON.parse(require('fs').readFileSync(configPath, 'utf8'));
                userConfig = { ...defaultConfig, ...loadedConfig };
            }
        } catch (err) {
            console.warn('[RTL] Could not load config, using defaults:', err);
        }
        
        // ═══════════════════════════════════════════════════════════
        // INJECT THE COMPLETE RTL ENGINE INTO RENDERER
        // ═══════════════════════════════════════════════════════════
        win.webContents.executeJavaScript(`
            (function initAntigravityRTL() {
                'use strict';
                
                // Prevent double initialization
                if (window.__ANTIGRAVITY_RTL_LOADED__) return;
                window.__ANTIGRAVITY_RTL_LOADED__ = true;
                
                console.log('[RTL Engine] Initializing v3.0...');
                
                // ═══════════════════════════════════════════════════
                // Configuration & State
                // ═══════════════════════════════════════════════════
                const FONT_BASE64 = '${fontBase64}';
                const CONFIG = ${JSON.stringify(userConfig)};
                
                let rtlEnabled = CONFIG.rtlEnabled;
                let forceRTL = CONFIG.forceRTL;
                let fixAtSign = CONFIG.fixAtSign;
                
                // ═══════════════════════════════════════════════════
                // Utility Functions
                // ═══════════════════════════════════════════════════
                
                function saveConfig() {
                    const config = {
                        faFont: document.getElementById('rtl-fa-font')?.value.trim() || '',
                        enFont: document.getElementById('rtl-en-font')?.value.trim() || '',
                        codeFont: document.getElementById('rtl-code-font')?.value.trim() || '',
                        lineHeight: document.getElementById('rtl-lh-slider')?.value || '1.6',
                        fontSize: document.getElementById('rtl-fs-slider')?.value || '16',
                        rtlEnabled: rtlEnabled,
                        forceRTL: forceRTL,
                        fixAtSign: fixAtSign
                    };
                    console.log('RTL_CONFIG_SAVE:' + JSON.stringify(config));
                }
                
                function detectRTL(text) {
                    if (!text || text.trim().length === 0) return false;
                    const cleaned = text.replace(/[\\u200B-\\u200F\\uFEFF]/g, '').trim();
                    if (cleaned.length === 0) return false;
                    
                    // Check first meaningful character
                    const firstChar = cleaned.match(/[A-Za-z\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF\\uFB50-\\uFDFF\\uFE70-\\uFEFF]/);
                    if (!firstChar) return false;
                    
                    const isPersianArabic = /[\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF\\uFB50-\\uFDFF\\uFE70-\\uFEFF]/.test(firstChar[0]);
                    return isPersianArabic;
                }
                
                // ═══════════════════════════════════════════════════
                // Dynamic CSS Generator
                // ═══════════════════════════════════════════════════
                
                function generateCSS(faFont, enFont, codeFont, lh, fs) {
                    let faFontFamily = "'VazirmatnFallback'";
                    let faFontRule = '';
                    
                    if (faFont) {
                        faFontFamily = "'CustomPersianFont', 'VazirmatnFallback'";
                        const baseName = faFont.replace(/[-\\s]?Regular$/i, '');
                        faFontRule = \`
                            @font-face {
                                font-family: 'CustomPersianFont';
                                src: local('\${faFont}'), local('\${baseName}');
                                font-weight: 400;
                                unicode-range: U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF;
                            }
                            @font-face {
                                font-family: 'CustomPersianFont';
                                src: local('\${baseName} Bold'), local('\${baseName}-Bold'), local('\${baseName}Bold');
                                font-weight: 700;
                                unicode-range: U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF;
                            }
                        \`;
                    }
                    
                    const enFontStr = enFont ? \`'\${enFont}', ui-sans-serif, system-ui, sans-serif\` : 'ui-sans-serif, system-ui, sans-serif';
                    const codeFontStr = codeFont ? \`'\${codeFont}', ui-monospace, 'Courier New', monospace\` : 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
                    
                    const forceRTLStyles = forceRTL ? \`
                        .prose > *:not(pre):not(code),
                        [data-testid="chat-message"] > *:not(pre):not(code),
                        .markdown-body > *:not(pre):not(code),
                        .leading-relaxed > *:not(pre):not(code),
                        [data-testid="user-input-step"],
                        [data-testid="user-input-step"] > *:not(pre):not(code),
                        div:has(> [role="radiogroup"]),
                        label[for^="ask-opt-"] {
                            direction: rtl !important;
                            text-align: right !important;
                            unicode-bidi: isolate !important;
                        }
                    \` : '';
                    
                    return \`
                        \${faFontRule}
                        
                        @font-face {
                            font-family: 'VazirmatnFallback';
                            src: url('data:font/woff2;base64,\${FONT_BASE64}') format('woff2');
                            font-weight: 100 900;
                            unicode-range: U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF;
                        }
                        
                        :root, :host, html, body {
                            font-family: \${faFontFamily}, \${enFontStr}, "Apple Color Emoji", "Segoe UI Emoji" !important;
                        }
                        
                        .prose, [data-testid="chat-message"], .markdown-body, 
                        .leading-relaxed, [contenteditable="true"], [contenteditable="true"] p {
                            font-size: \${fs}px !important;
                        }
                        
                        p, h1, h2, h3, h4, h5, h6, ul, ol {
                            unicode-bidi: plaintext;
                            text-align: start;
                        }
                        
                        .prose > *, [data-testid="chat-message"] > *, .markdown-body > * {
                            unicode-bidi: plaintext;
                            text-align: start;
                        }
                        
                        label[for^="ask-opt-"] {
                            unicode-bidi: plaintext;
                            text-align: start;
                        }
                        
                        label[for^="ask-opt-"][dir="rtl"] {
                            direction: rtl;
                            text-align: right;
                        }
                        
                        textarea[data-testid="ask-question-writein"] {
                            unicode-bidi: plaintext;
                            text-align: start;
                        }
                        
                        \${forceRTLStyles}
                        
                        /* RTL List Padding */
                        ul:not(#_)[dir="rtl"], ol:not(#_)[dir="rtl"],
                        [dir="rtl"] ul:not(#_), [dir="rtl"] ol:not(#_) {
                            padding-left: 0 !important;
                            padding-right: 1.25rem !important;
                        }
                        
                        [dir="rtl"] ul:not(#_) ul:not(#_), [dir="rtl"] ul:not(#_) ol:not(#_),
                        [dir="rtl"] ol:not(#_) ul:not(#_), [dir="rtl"] ol:not(#_) ol:not(#_) {
                            padding-left: 0 !important;
                            padding-right: 2.5rem !important;
                        }
                        
                        /* Keep thinking blocks LTR */
                        .cursor-edit.text-secondary-foreground,
                        .cursor-edit.text-secondary-foreground * {
                            direction: ltr !important;
                            text-align: left !important;
                            unicode-bidi: isolate !important;
                        }
                        
                        /* Code blocks always LTR */
                        pre, code, pre *, code * {
                            unicode-bidi: isolate !important;
                            direction: ltr !important;
                            text-align: left !important;
                            font-family: \${codeFontStr} !important;
                        }
                        
                        /* Line height control */
                        .leading-relaxed {
                            line-height: \${lh} !important;
                        }
                        
                        [contenteditable="true"], [contenteditable="true"] * {
                            unicode-bidi: isolate !important;
                            text-align: start !important;
                        }
                        
                        /* Smart auto-direction */
                        [role="navigation"][aria-label="Sidebar"] *, .truncate {
                            unicode-bidi: plaintext !important;
                            text-align: start !important;
                        }
                        
                        /* Apply line height to chat */
                        .prose p, .prose li, .markdown-body p, 
                        [data-testid="chat-message"] p, 
                        [data-testid="chat-message"] .leading-relaxed,
                        .leading-relaxed, [data-testid="user-input-step"],
                        [data-testid="user-input-step"] div,
                        [data-lexical-text="true"],
                        [contenteditable="true"], [contenteditable="true"] p,
                        label[for^="ask-opt-"] {
                            line-height: \${lh} !important;
                        }
                    \`;
                }
                
                // ═══════════════════════════════════════════════════
                // Style Injection
                // ═══════════════════════════════════════════════════
                
                const mainStyleEl = document.createElement('style');
                mainStyleEl.id = 'antigravity-rtl-main-style';
                document.head.appendChild(mainStyleEl);
                
                function updateCSS() {
                    const faFont = document.getElementById('rtl-fa-font')?.value.trim() || '';
                    const enFont = document.getElementById('rtl-en-font')?.value.trim() || '';
                    const codeFont = document.getElementById('rtl-code-font')?.value.trim() || '';
                    const lh = document.getElementById('rtl-lh-slider')?.value || CONFIG.lineHeight;
                    const fs = document.getElementById('rtl-fs-slider')?.value || CONFIG.fontSize;
                    
                    mainStyleEl.textContent = generateCSS(faFont, enFont, codeFont, lh, fs);
                }
                
                // Initial CSS
                updateCSS();
                
                // ═══════════════════════════════════════════════════
                // Direction Observer
                // ═══════════════════════════════════════════════════
                
                function updateDirections() {
                    if (!rtlEnabled) return;
                    
                    // Input fields
                    document.querySelectorAll('[contenteditable="true"] p, [contenteditable="true"], textarea[data-testid="ask-question-writein"]').forEach(el => {
                        const rawText = el.tagName === 'TEXTAREA' ? el.value : el.textContent;
                        const text = rawText.replace(/[\\u200B-\\u200F\\uFEFF]/g, '').trim();
                        
                        if (text.length > 0) {
                            const isRTL = detectRTL(text);
                            const newDir = isRTL ? 'rtl' : 'ltr';
                            if (el.getAttribute('dir') !== newDir) {
                                el.setAttribute('dir', newDir);
                            }
                        } else {
                            if (el.hasAttribute('dir')) el.removeAttribute('dir');
                        }
                    });
                    
                    // Chat output & artifacts
                    document.querySelectorAll(\`
                        .prose > *,
                        [data-testid="chat-message"] > *,
                        .markdown-body > *,
                        .leading-relaxed > *,
                        [data-testid="user-input-step"],
                        [data-testid="user-input-step"] > *,
                        div:has(> [role="radiogroup"]),
                        label[for^="ask-opt-"]
                    \`).forEach(el => {
                        if (el.tagName === 'PRE' || el.tagName === 'CODE') return;
                        
                        const text = el.textContent.replace(/[\\u200B-\\u200F\\uFEFF]/g, '').trim();
                        let dir = 'auto';
                        
                        if (forceRTL) {
                            dir = 'rtl';
                        } else if (text) {
                            dir = detectRTL(text) ? 'rtl' : 'ltr';
                        }
                        
                        if (el.getAttribute('dir') !== dir) {
                            el.setAttribute('dir', dir);
                        }
                    });
                }
                
                // Set up observers
                document.body.addEventListener('input', updateDirections, { capture: true });
                document.body.addEventListener('focusin', updateDirections, { capture: true });
                
                const mutationObserver = new MutationObserver(updateDirections);
                mutationObserver.observe(document.body, { childList: true, subtree: true });
                
                setInterval(updateDirections, 500);
                
                // ═══════════════════════════════════════════════════
                // Keyboard Shortcuts & Fixes
                // ═══════════════════════════════════════════════════
                
                document.addEventListener('keydown', (e) => {
                    // Alt + R to toggle RTL
                    if (e.altKey && e.code === 'KeyR') {
                        e.preventDefault();
                        toggleRTL();
                    }
                    
                    // Fix @ sign on Persian keyboard
                    if (fixAtSign && e.code === 'Digit2' && e.shiftKey) {
                        if (e.key === '٬' || e.key === '،') {
                            e.preventDefault();
                            document.execCommand('insertText', false, '@');
                        }
                    }
                }, { capture: true });
                
                // ═══════════════════════════════════════════════════
                // Widget UI Styles
                // ═══════════════════════════════════════════════════
                
                const widgetStyles = document.createElement('style');
                widgetStyles.id = 'rtl-widget-styles';
                widgetStyles.textContent = \`
                    .rtl-tooltip {
                        visibility: hidden;
                        opacity: 0;
                        transition: opacity 0.2s;
                        pointer-events: none;
                    }
                    .rtl-info-icon:hover .rtl-tooltip {
                        visibility: visible;
                        opacity: 1;
                    }
                    .rtl-widget-panel {
                        transform: scale(0);
                        opacity: 0;
                        pointer-events: none;
                        transition: all 0.3s;
                        transform-origin: bottom right;
                    }
                    .rtl-widget-container:hover .rtl-widget-trigger {
                        opacity: 0 !important;
                        transform: scale(0.5) !important;
                        pointer-events: none !important;
                    }
                    .rtl-widget-container:hover .rtl-widget-panel {
                        transform: scale(1) !important;
                        opacity: 1 !important;
                        pointer-events: auto !important;
                    }
                    :root {
                        --rtl-bg: #ffffff;
                        --rtl-text: #111827;
                        --rtl-border: #e5e7eb;
                        --rtl-input-bg: #f3f4f6;
                    }
                    :root.dark, .dark {
                        --rtl-bg: #1e293b;
                        --rtl-text: #f3f4f6;
                        --rtl-border: #334155;
                        --rtl-input-bg: #334155;
                    }
                    @media (prefers-color-scheme: dark) {
                        :root:not(.light) {
                            --rtl-bg: #1e293b;
                            --rtl-text: #f3f4f6;
                            --rtl-border: #334155;
                            --rtl-input-bg: #334155;
                        }
                    }
                    .rtl-theme-panel {
                        background-color: var(--rtl-bg) !important;
                        color: var(--rtl-text) !important;
                        border: 1px solid var(--rtl-border) !important;
                    }
                    .rtl-theme-input {
                        background-color: var(--rtl-input-bg) !important;
                        color: var(--rtl-text) !important;
                        border: 1px solid var(--rtl-border) !important;
                    }
                    .w-11 { width: 44px !important; }
                    .h-6 { height: 24px !important; }
                    .w-4 { width: 16px !important; }
                    .h-4 { height: 16px !important; }
                    .translate-x-6 { transform: translateX(24px) !important; }
                    .translate-x-1 { transform: translateX(4px) !important; }
                    .bg-accent { background-color: #4f46e5 !important; }
                    .rtl-toggle-reset {
                        padding: 0 !important;
                        border: none !important;
                        box-sizing: border-box !important;
                        min-width: 44px !important;
                        outline: none !important;
                        display: inline-flex !important;
                        align-items: center !important;
                    }
                    .rtl-gh-link {
                        transition: all 0.1s !important;
                    }
                    .rtl-gh-link:hover {
                        color: #eab308 !important;
                        opacity: 1 !important;
                    }
                \`;
                document.head.appendChild(widgetStyles);
                
                // ═══════════════════════════════════════════════════
                // Widget UI HTML
                // ═══════════════════════════════════════════════════
                
                const widgetHTML = \`
                    <div class="rtl-widget-container group fixed bottom-4 right-4 w-10 h-10" style="direction: ltr; z-index: 999999;">
                        <div class="rtl-widget-trigger relative w-10 h-10 flex items-center justify-center rounded-full bg-secondary text-secondary-foreground hover:text-foreground cursor-pointer opacity-80 transition-all duration-300">
                            <svg height="20" width="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                        </div>
                        <div class="rtl-widget-panel rtl-theme-panel absolute bottom-0 right-0 flex flex-col p-px rounded-2xl text-sm w-60">
                            <div class="flex flex-col gap-2 p-3 rounded-[15px]">
                                <div class="text-center px-1 pb-2 mb-1 border-b border-border border-opacity-50">
                                    <span class="text-base font-semibold">Antigravity Smart RTL</span>
                                </div>
                                <div class="flex items-center justify-between gap-4 px-1">
                                    <div class="flex items-center">
                                        <span id="rtl-status-text" class="font-medium text-xs opacity-80">\${rtlEnabled ? 'Enabled' : 'Disabled'}</span>
                                        <div class="relative flex items-center rtl-info-icon ml-1">
                                            <span class="cursor-pointer inline-flex items-center text-muted-foreground hover:text-foreground">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 -960 960 960" fill="currentColor" class="w-3.5 h-3.5"><path d="M450-290h60V-520H450v230Zm52.92-307.75q9.38-9.29 9.38-23.02t-9.29-23.02T480-653.07t-23.02,9.29t-9.29,23.02t9.38,23.02T480-588.46t22.92-9.29ZM480.07-100q-78.84,0-148.2-29.92T211.18-211.13T129.93-331.76T100-479.93t29.92-148.2t81.21-120.68t120.63-81.25T479.93-860t148.2,29.92t120.68,81.21t81.25,120.63T860-480.07t-29.92,148.2T748.87-211.18T628.24-129.93T480.07-100ZM480-160q134,0 227-93t93-227T707-707T480-800T253-707T160-480t93,227t227,93Zm0-320Z"/></svg>
                                            </span>
                                            <div class="rtl-tooltip absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 p-1.5 rounded shadow-md z-50 text-center bg-muted border border-border text-foreground text-[11px]">
                                                Shortcut: Alt + R
                                                <div class="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0" style="border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid var(--border);"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <button id="rtl-main-toggle" type="button" class="rtl-toggle-reset relative rounded-full transition-colors h-6 w-11 \${rtlEnabled ? 'bg-accent' : 'bg-gray-400 bg-opacity-40'} cursor-pointer">
                                        <span class="inline-block rounded-full bg-white transition-transform shadow-sm h-4 w-4" style="transform: translateX(\${rtlEnabled ? '24px' : '4px'});"></span>
                                    </button>
                                </div>
                                <div id="rtl-settings-area" class="flex flex-col gap-2 transition-all \${rtlEnabled ? '' : 'opacity-40 pointer-events-none'}">
                                    <div class="flex items-center justify-between gap-2 px-1 mt-1">
                                        <span class="font-medium text-xs opacity-80">Force RTL</span>
                                        <button id="rtl-force-toggle" type="button" class="rtl-toggle-reset relative rounded-full transition-colors h-6 w-11 \${forceRTL ? 'bg-accent' : 'bg-gray-400 bg-opacity-40'} cursor-pointer">
                                            <span class="inline-block rounded-full bg-white transition-transform shadow-sm h-4 w-4" style="transform: translateX(\${forceRTL ? '24px' : '4px'});"></span>
                                        </button>
                                    </div>
                                    <div class="h-px bg-border border-opacity-30 w-full my-1"></div>
                                    <div class="flex items-center justify-between gap-2 px-1">
                                        <span class="font-medium text-xs opacity-80">FA/AR Font</span>
                                        <input id="rtl-fa-font" type="text" placeholder="Vazirmatn" value="\${CONFIG.faFont}" class="rtl-theme-input text-[11px] px-2 py-1 rounded-md w-28 focus:outline-none">
                                    </div>
                                    <div class="flex items-center justify-between gap-2 px-1 mt-1">
                                        <span class="font-medium text-xs opacity-80">EN Font</span>
                                        <input id="rtl-en-font" type="text" placeholder="System" value="\${CONFIG.enFont}" class="rtl-theme-input text-[11px] px-2 py-1 rounded-md w-28 focus:outline-none">
                                    </div>
                                    <div class="flex items-center justify-between gap-2 px-1 mt-1">
                                        <span class="font-medium text-xs opacity-80">Code Font</span>
                                        <input id="rtl-code-font" type="text" placeholder="System" value="\${CONFIG.codeFont}" class="rtl-theme-input text-[11px] px-2 py-1 rounded-md w-28 focus:outline-none">
                                    </div>
                                    <div class="flex items-center justify-between gap-2 px-1 mt-1">
                                        <span class="font-medium text-xs opacity-80">Line Height</span>
                                        <div class="flex items-center gap-2">
                                            <input id="rtl-lh-slider" type="range" min="1.2" max="2.5" step="0.1" value="\${CONFIG.lineHeight}" class="h-1 w-20 cursor-pointer">
                                            <button id="rtl-lh-reset" type="button" class="opacity-50 hover:opacity-100 transition-opacity cursor-pointer" title="Reset">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                                            </button>
                                        </div>
                                    </div>
                                    <div class="flex items-center justify-between gap-2 px-1 mt-1 mb-1">
                                        <span class="font-medium text-xs opacity-80">Font Size</span>
                                        <div class="flex items-center gap-2">
                                            <input id="rtl-fs-slider" type="range" min="11" max="22" step="1" value="\${CONFIG.fontSize}" class="h-1 w-20 cursor-pointer">
                                            <button id="rtl-fs-reset" type="button" class="opacity-50 hover:opacity-100 transition-opacity cursor-pointer" title="Reset">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                                            </button>
                                        </div>
                                    </div>
                                    <div class="h-px bg-border border-opacity-30 w-full my-1"></div>
                                    <div class="flex items-center justify-between gap-2 px-1 mb-1">
                                        <span class="font-medium text-xs opacity-80">Type @ with Shift+2</span>
                                        <button id="rtl-at-toggle" type="button" class="rtl-toggle-reset relative rounded-full transition-colors h-6 w-11 \${fixAtSign ? 'bg-accent' : 'bg-gray-400 bg-opacity-40'} cursor-pointer">
                                            <span class="inline-block rounded-full bg-white transition-transform shadow-sm h-4 w-4" style="transform: translateX(\${fixAtSign ? '24px' : '4px'});"></span>
                                        </button>
                                    </div>
                                </div>
                                <div class="h-px bg-border w-full"></div>
                                <a href="https://github.com/VaFa1726/antigravity-rtl-patcher" target="_blank" class="rtl-gh-link flex items-center justify-center gap-2 text-xs font-semibold opacity-70 no-underline pt-1 pb-0.5">
                                    <svg height="14" width="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"/></svg>
                                    Star on GitHub
                                </a>
                            </div>
                        </div>
                    </div>
                \`;
                
                // Insert widget
                const widgetWrapper = document.createElement('div');
                widgetWrapper.innerHTML = widgetHTML;
                document.body.appendChild(widgetWrapper.firstElementChild);
                
                // ═══════════════════════════════════════════════════
                // Event Handlers
                // ═══════════════════════════════════════════════════
                
                function toggleRTL() {
                    rtlEnabled = !rtlEnabled;
                    const statusText = document.getElementById('rtl-status-text');
                    const mainToggle = document.getElementById('rtl-main-toggle');
                    const settingsArea = document.getElementById('rtl-settings-area');
                    
                    statusText.textContent = rtlEnabled ? 'Enabled' : 'Disabled';
                    
                    if (rtlEnabled) {
                        mainToggle.classList.add('bg-accent');
                        mainToggle.classList.remove('bg-gray-400', 'bg-opacity-40');
                        mainToggle.querySelector('span').style.transform = 'translateX(24px)';
                        settingsArea.classList.remove('opacity-40', 'pointer-events-none');
                        if (!document.getElementById('antigravity-rtl-main-style')) {
                            document.head.appendChild(mainStyleEl);
                        }
                        updateCSS();
                        updateDirections();
                    } else {
                        mainToggle.classList.remove('bg-accent');
                        mainToggle.classList.add('bg-gray-400', 'bg-opacity-40');
                        mainToggle.querySelector('span').style.transform = 'translateX(4px)';
                        settingsArea.classList.add('opacity-40', 'pointer-events-none');
                        if (mainStyleEl.parentNode) {
                            mainStyleEl.parentNode.removeChild(mainStyleEl);
                        }
                        document.querySelectorAll('[dir]').forEach(el => {
                            if (!el.closest('.rtl-widget-container')) {
                                el.removeAttribute('dir');
                            }
                        });
                    }
                    
                    saveConfig();
                }
                
                document.getElementById('rtl-main-toggle').addEventListener('click', toggleRTL);
                
                document.getElementById('rtl-force-toggle').addEventListener('click', () => {
                    forceRTL = !forceRTL;
                    const btn = document.getElementById('rtl-force-toggle');
                    if (forceRTL) {
                        btn.classList.add('bg-accent');
                        btn.classList.remove('bg-gray-400', 'bg-opacity-40');
                        btn.querySelector('span').style.transform = 'translateX(24px)';
                    } else {
                        btn.classList.remove('bg-accent');
                        btn.classList.add('bg-gray-400', 'bg-opacity-40');
                        btn.querySelector('span').style.transform = 'translateX(4px)';
                    }
                    updateCSS();
                    updateDirections();
                    saveConfig();
                });
                
                document.getElementById('rtl-at-toggle').addEventListener('click', () => {
                    fixAtSign = !fixAtSign;
                    const btn = document.getElementById('rtl-at-toggle');
                    if (fixAtSign) {
                        btn.classList.add('bg-accent');
                        btn.classList.remove('bg-gray-400', 'bg-opacity-40');
                        btn.querySelector('span').style.transform = 'translateX(24px)';
                    } else {
                        btn.classList.remove('bg-accent');
                        btn.classList.add('bg-gray-400', 'bg-opacity-40');
                        btn.querySelector('span').style.transform = 'translateX(4px)';
                    }
                    saveConfig();
                });
                
                // Font inputs
                ['rtl-fa-font', 'rtl-en-font', 'rtl-code-font'].forEach(id => {
                    document.getElementById(id).addEventListener('input', () => {
                        updateCSS();
                        saveConfig();
                    });
                });
                
                // Sliders
                document.getElementById('rtl-lh-slider').addEventListener('input', () => {
                    updateCSS();
                    saveConfig();
                });
                
                document.getElementById('rtl-fs-slider').addEventListener('input', () => {
                    updateCSS();
                    saveConfig();
                });
                
                // Reset buttons
                document.getElementById('rtl-lh-reset').addEventListener('click', () => {
                    document.getElementById('rtl-lh-slider').value = '1.6';
                    updateCSS();
                    saveConfig();
                });
                
                document.getElementById('rtl-fs-reset').addEventListener('click', () => {
                    document.getElementById('rtl-fs-slider').value = '16';
                    updateCSS();
                    saveConfig();
                });
                
                // ═══════════════════════════════════════════════════
                // Initialization Complete
                // ═══════════════════════════════════════════════════
                
                if (rtlEnabled) {
                    updateDirections();
                }
                
                console.log('[RTL Engine] Initialization complete ✓');
            })();
        `).catch(err => {
            console.error('[RTL] Failed to inject engine:', err);
        });
        
    } catch (error) {
        console.error('[RTL] Injection error:', error);
    }
});
