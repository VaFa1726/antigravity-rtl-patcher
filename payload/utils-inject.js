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
        } catch (err) {
            console.error('[RTL] Config save failed:', err);
        }
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
                
                const CSS = \`
                    p, h1, h2, h3, h4, h5, h6, ul, ol, li, div, span {
                        unicode-bidi: plaintext;
                        text-align: start;
                    }
                    
                    [dir="rtl"] ul, [dir="rtl"] ol {
                        padding-left: 0 !important;
                        padding-right: 1.5rem !important;
                    }
                    
                    pre, code, pre *, code * {
                        unicode-bidi: isolate !important;
                        direction: ltr !important;
                        text-align: left !important;
                    }
                    
                    #rtl-toggle-btn {
                        position: fixed;
                        bottom: 20px;
                        right: 20px;
                        z-index: 999999;
                        width: 50px;
                        height: 50px;
                        border-radius: 50%;
                        background: rgba(60, 60, 60, 0.9);
                        border: 2px solid rgba(100, 100, 100, 0.5);
                        color: white;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 24px;
                        transition: all 0.3s;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                    }
                    
                    #rtl-toggle-btn:hover {
                        background: rgba(80, 80, 80, 0.95);
                        transform: scale(1.1);
                    }
                    
                    #rtl-toggle-btn.active {
                        background: rgba(70, 130, 180, 0.9);
                        border-color: rgba(70, 130, 180, 0.8);
                    }
                \`;
                
                const styleEl = document.createElement('style');
                styleEl.id = 'rtl-main-style';
                styleEl.textContent = CSS;
                document.head.appendChild(styleEl);
                
                function detectRTL(text) {
                    if (!text || text.trim().length === 0) return false;
                    const cleaned = text.replace(/[\\u200B-\\u200F\\uFEFF]/g, '').trim();
                    if (cleaned.length === 0) return false;
                    
                    const firstChar = cleaned.match(/[A-Za-z\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF\\uFB50-\\uFDFF\\uFE70-\\uFEFF]/);
                    if (!firstChar) return false;
                    
                    return /[\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF\\uFB50-\\uFDFF\\uFE70-\\uFEFF]/.test(firstChar[0]);
                }
                
                function updateDirections() {
                    if (!rtlEnabled) return;
                    
                    document.querySelectorAll('[contenteditable="true"], [contenteditable="true"] p, textarea').forEach(el => {
                        const text = el.tagName === 'TEXTAREA' ? el.value : el.textContent;
                        const cleaned = text.replace(/[\\u200B-\\u200F\\uFEFF]/g, '').trim();
                        
                        if (cleaned.length > 0) {
                            const dir = detectRTL(cleaned) ? 'rtl' : 'ltr';
                            if (el.getAttribute('dir') !== dir) {
                                el.setAttribute('dir', dir);
                            }
                        } else {
                            if (el.hasAttribute('dir')) el.removeAttribute('dir');
                        }
                    });
                    
                    document.querySelectorAll('.prose > *, [data-testid="chat-message"] > *, .markdown-body > *, .leading-relaxed > *').forEach(el => {
                        if (el.tagName === 'PRE' || el.tagName === 'CODE') return;
                        
                        const text = el.textContent.replace(/[\\u200B-\\u200F\\uFEFF]/g, '').trim();
                        if (text) {
                            const dir = detectRTL(text) ? 'rtl' : 'ltr';
                            if (el.getAttribute('dir') !== dir) {
                                el.setAttribute('dir', dir);
                            }
                        }
                    });
                }
                
                document.body.addEventListener('input', updateDirections, { capture: true });
                const observer = new MutationObserver(updateDirections);
                observer.observe(document.body, { childList: true, subtree: true });
                setInterval(updateDirections, 500);
                
                document.addEventListener('keydown', (e) => {
                    if (e.altKey && e.code === 'KeyR') {
                        e.preventDefault();
                        toggleRTL();
                    }
                }, { capture: true });
                
                const btn = document.createElement('button');
                btn.id = 'rtl-toggle-btn';
                btn.className = rtlEnabled ? 'active' : '';
                btn.innerHTML = '⇄';
                btn.title = 'Toggle RTL (Alt+R)';
                
                btn.addEventListener('click', toggleRTL);
                
                function toggleRTL() {
                    rtlEnabled = !rtlEnabled;
                    
                    if (rtlEnabled) {
                        btn.classList.add('active');
                        if (!document.getElementById('rtl-main-style')) {
                            document.head.appendChild(styleEl);
                        }
                        updateDirections();
                    } else {
                        btn.classList.remove('active');
                        if (styleEl.parentNode) {
                            styleEl.parentNode.removeChild(styleEl);
                        }
                        document.querySelectorAll('[dir]').forEach(el => {
                            if (!el.closest('#rtl-toggle-btn')) {
                                el.removeAttribute('dir');
                            }
                        });
                    }
                    
                    console.log('RTL_CONFIG_SAVE:' + JSON.stringify({ enabled: rtlEnabled }));
                }
                
                document.body.appendChild(btn);
                
                if (rtlEnabled) {
                    updateDirections();
                }
            })();
        `).catch(err => console.error('[RTL] Injection failed:', err));
        
    } catch (error) {
        console.error('[RTL] Init error:', error);
    }
});
