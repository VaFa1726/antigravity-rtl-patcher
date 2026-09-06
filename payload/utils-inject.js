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
                
                const CSS = \`
                    /* Persian/Arabic Font Stack */
                    body.rtl-active {
                        font-family: 'Segoe UI', Tahoma, Arial, 'Helvetica Neue', sans-serif !important;
                        font-feature-settings: 'liga' 1, 'calt' 1 !important;
                        text-rendering: optimizeLegibility !important;
                        -webkit-font-smoothing: antialiased !important;
                    }
                    
                    /* Keep sidebars, navigation, and main layout LTR */
                    body.rtl-active [class*="sidebar"],
                    body.rtl-active [class*="nav"],
                    body.rtl-active [class*="menu"],
                    body.rtl-active [class*="toolbar"],
                    body.rtl-active [class*="panel"],
                    body.rtl-active [class*="list"],
                    body.rtl-active aside,
                    body.rtl-active nav {
                        direction: ltr !important;
                        text-align: left !important;
                    }
                    
                    /* RTL only for message/chat content area */
                    body.rtl-active [class*="message"] p,
                    body.rtl-active [class*="message"] h1, 
                    body.rtl-active [class*="message"] h2, 
                    body.rtl-active [class*="message"] h3,
                    body.rtl-active [class*="message"] h4, 
                    body.rtl-active [class*="message"] h5, 
                    body.rtl-active [class*="message"] h6,
                    body.rtl-active [class*="message"] li,
                    body.rtl-active [class*="chat"] p,
                    body.rtl-active [class*="chat"] h1,
                    body.rtl-active [class*="chat"] h2,
                    body.rtl-active [class*="chat"] h3,
                    body.rtl-active [class*="chat"] h4,
                    body.rtl-active [class*="chat"] h5,
                    body.rtl-active [class*="chat"] h6,
                    body.rtl-active [class*="chat"] li,
                    body.rtl-active [class*="content"] p,
                    body.rtl-active [class*="content"] h1,
                    body.rtl-active [class*="content"] h2,
                    body.rtl-active [class*="content"] h3,
                    body.rtl-active [class*="content"] h4,
                    body.rtl-active [class*="content"] h5,
                    body.rtl-active [class*="content"] h6,
                    body.rtl-active [class*="content"] li,
                    body.rtl-active main p,
                    body.rtl-active main h1,
                    body.rtl-active main h2,
                    body.rtl-active main h3,
                    body.rtl-active main h4,
                    body.rtl-active main h5,
                    body.rtl-active main h6,
                    body.rtl-active main li {
                        direction: rtl !important;
                        text-align: right !important;
                    }
                    
                    /* Lists */
                    body.rtl-active [class*="message"] ul,
                    body.rtl-active [class*="message"] ol,
                    body.rtl-active [class*="chat"] ul,
                    body.rtl-active [class*="chat"] ol,
                    body.rtl-active [class*="content"] ul,
                    body.rtl-active [class*="content"] ol,
                    body.rtl-active main ul,
                    body.rtl-active main ol {
                        padding-left: 0 !important;
                        padding-right: 2rem !important;
                    }
                    
                    /* Code blocks always LTR */
                    body.rtl-active pre,
                    body.rtl-active code,
                    body.rtl-active pre *,
                    body.rtl-active code * {
                        direction: ltr !important;
                        text-align: left !important;
                        font-family: 'Courier New', Consolas, Monaco, monospace !important;
                    }
                    
                    /* Keep UI elements LTR */
                    body.rtl-active button,
                    body.rtl-active input,
                    body.rtl-active select,
                    body.rtl-active [role="button"] {
                        direction: ltr !important;
                        text-align: left !important;
                    }
                    
                    /* Panel Container */
                    #rtl-trigger {
                        position: fixed;
                        bottom: 20px;
                        right: 20px;
                        z-index: 999998;
                        width: 50px;
                        height: 50px;
                        border-radius: 50%;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        border: none;
                        color: white;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 24px;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                    }
                    
                    #rtl-trigger:hover {
                        transform: scale(1.1) rotate(180deg);
                        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
                    }
                    
                    #rtl-trigger.active {
                        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                        box-shadow: 0 4px 12px rgba(245, 87, 108, 0.4);
                    }
                    
                    #rtl-panel {
                        position: fixed;
                        bottom: 80px;
                        right: 20px;
                        z-index: 999999;
                        width: 300px;
                        background: rgba(255, 255, 255, 0.95);
                        backdrop-filter: blur(10px);
                        border-radius: 16px;
                        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                        opacity: 0;
                        transform: translateY(20px) scale(0.9);
                        pointer-events: none;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        overflow: hidden;
                    }
                    
                    #rtl-panel.visible {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                        pointer-events: auto;
                    }
                    
                    @media (prefers-color-scheme: dark) {
                        #rtl-panel {
                            background: rgba(30, 30, 40, 0.95);
                            color: #e0e0e0;
                        }
                    }
                    
                    .rtl-panel-header {
                        padding: 20px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        text-align: center;
                        font-weight: 600;
                        font-size: 16px;
                    }
                    
                    .rtl-panel-body {
                        padding: 24px;
                    }
                    
                    .rtl-row {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        margin-bottom: 16px;
                    }
                    
                    .rtl-label {
                        font-size: 14px;
                        font-weight: 500;
                        color: #333;
                    }
                    
                    @media (prefers-color-scheme: dark) {
                        .rtl-label {
                            color: #e0e0e0;
                        }
                    }
                    
                    /* Toggle Switch */
                    .rtl-switch {
                        position: relative;
                        width: 52px;
                        height: 28px;
                        background: #ddd;
                        border-radius: 14px;
                        cursor: pointer;
                        transition: background 0.3s;
                    }
                    
                    .rtl-switch.active {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    }
                    
                    .rtl-switch::after {
                        content: '';
                        position: absolute;
                        width: 22px;
                        height: 22px;
                        background: white;
                        border-radius: 50%;
                        top: 3px;
                        left: 3px;
                        transition: transform 0.3s;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                    }
                    
                    .rtl-switch.active::after {
                        transform: translateX(24px);
                    }
                    
                    .rtl-panel-footer {
                        padding: 16px 24px;
                        border-top: 1px solid rgba(0, 0, 0, 0.1);
                        display: flex;
                        justify-content: center;
                    }
                    
                    @media (prefers-color-scheme: dark) {
                        .rtl-panel-footer {
                            border-top: 1px solid rgba(255, 255, 255, 0.1);
                        }
                    }
                    
                    .rtl-github-btn {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        padding: 10px 20px;
                        background: #24292e;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 13px;
                        font-weight: 500;
                        text-decoration: none;
                        transition: all 0.2s;
                    }
                    
                    .rtl-github-btn:hover {
                        background: #1a1f23;
                        transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                    }
                    
                    .rtl-github-icon {
                        width: 18px;
                        height: 18px;
                    }
                \`;
                
                const styleEl = document.createElement('style');
                styleEl.id = 'rtl-main-style';
                styleEl.textContent = CSS;
                document.head.appendChild(styleEl);
                
                // Apply RTL class if enabled
                if (rtlEnabled) {
                    document.body.classList.add('rtl-active');
                }
                
                // Create UI
                const trigger = document.createElement('button');
                trigger.id = 'rtl-trigger';
                trigger.className = rtlEnabled ? 'active rtl-ui' : 'rtl-ui';
                trigger.innerHTML = '⇄';
                trigger.title = 'RTL Settings';
                
                const panel = document.createElement('div');
                panel.id = 'rtl-panel';
                panel.className = 'rtl-ui';
                panel.innerHTML = \`
                    <div class="rtl-panel-header rtl-ui">
                        Antigravity Smart RTL
                    </div>
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
                
                // Event handlers
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
                    
                    const toggle = document.getElementById('rtl-toggle');
                    toggle.classList.toggle('active', rtlEnabled);
                    trigger.classList.toggle('active', rtlEnabled);
                    
                    if (rtlEnabled) {
                        document.body.classList.add('rtl-active');
                    } else {
                        document.body.classList.remove('rtl-active');
                    }
                    
                    console.log('RTL_CONFIG_SAVE:' + JSON.stringify({ enabled: rtlEnabled }));
                });
                
                // Keyboard shortcut
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
