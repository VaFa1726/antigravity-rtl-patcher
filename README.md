# Antigravity RTL Patcher

Advanced RTL and Persian/Arabic typography support for the [Antigravity](https://antigravity.dev) desktop app. Patches the Electron runtime to detect right-to-left text and apply proper styling with a rich, customizable UI.

[![npm version](https://img.shields.io/npm/v/antigravity-rtl-patcher)](https://www.npmjs.com/package/antigravity-rtl-patcher)
[![npm downloads](https://img.shields.io/npm/dt/antigravity-rtl-patcher)](https://www.npmjs.com/package/antigravity-rtl-patcher)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

---

## ✨ What's New in v3.0

- 🎨 **Advanced UI Panel** - Hover widget with comprehensive customization options
- 🔤 **Custom Font Support** - Set separate fonts for Persian, English, and code
- 📏 **Typography Controls** - Adjust line height and font size in real-time
- 💾 **Persistent Config** - Settings saved to `~/.antigravity-rtl-v3.json`
- ⚡ **Keyboard Shortcuts** - `Alt + R` to toggle RTL, `Shift + 2` for @ symbol
- 🔧 **Force RTL Mode** - Override auto-detection for consistent RTL layout
- 🎯 **Enhanced Detection** - Smarter RTL text recognition algorithm
- 🚀 **DevTools Enabled** - Built-in developer tools for debugging

---

## ⚡ Quick Install

Always use `@latest` to ensure you get the newest version:

```bash
npx antigravity-rtl-patcher@latest patch
```

If Antigravity is installed in a system directory, use `sudo`:

```bash
sudo npx antigravity-rtl-patcher@latest patch
```

Restart Antigravity after patching to see the RTL widget appear in the bottom-right corner!

---

## 🔄 Update to Latest Version

To ensure you're always using the latest version:

```bash
npx antigravity-rtl-patcher@latest patch
```

Or check for updates manually:

```bash
npx antigravity-rtl-patcher@latest update
```

The patcher will automatically notify you when a new version is available.

---

## 🎨 Features

### Smart RTL Detection
- Automatically detects Persian, Arabic, and Hebrew text
- Applies proper text direction without breaking layout
- Preserves LTR for code blocks and English text

### Rich UI Panel
Hover over the globe icon in the bottom-right corner to access:

- **RTL Toggle** - Enable/disable RTL support on the fly
- **Force RTL Mode** - Force RTL layout even when text starts with English
- **Custom Fonts**:
  - Persian/Arabic font (fallback: Vazirmatn)
  - English font (fallback: system font)
  - Code font (fallback: monospace)
- **Typography Controls**:
  - Line height slider (1.2 - 2.5)
  - Font size slider (11px - 22px)
- **@ Sign Fix** - Type `@` with `Shift+2` on Persian keyboard
- **Keyboard Shortcut** - `Alt + R` to toggle RTL

### Persistent Configuration
All your settings are automatically saved to `~/.antigravity-rtl-v3.json` and restored on restart.

---

## 🗑️ Uninstall

Remove the RTL patch and restore original Antigravity:

```bash
npx antigravity-rtl-patcher restore
```

Or with sudo if needed:

```bash
sudo npx antigravity-rtl-patcher restore
```

---

## 📋 Commands

| Command | Description |
|---------|-------------|
| `agy-rtl patch` | Apply RTL patch with advanced UI |
| `agy-rtl restore` | Remove patch and restore original |
| `agy-rtl status` | Show current patch status |
| `agy-rtl update` | Check for patcher updates |
| `agy-rtl patch --path /custom/path` | Patch custom installation |
| `agy-rtl patch --skip-update-check` | Skip update check during patching |

---

## 🔧 How It Works

Antigravity is built on Electron. The patcher:

1. **Extracts** `app.asar` (the packaged application)
2. **Locates** `dist/utils.js` (window creation module)
3. **Injects** RTL engine at the window lifecycle hook
4. **Repacks** the modified application

The RTL engine uses:
- `MutationObserver` for real-time DOM monitoring
- Unicode range analysis for RTL detection
- Dynamic CSS generation for typography control
- Electron IPC for config persistence

After patching, a hover-activated widget appears in the bottom-right corner with all customization options.

---

## 🔄 After Antigravity Updates

Antigravity updates may overwrite the patch. Simply run:

```bash
npx antigravity-rtl-patcher@latest patch
```

**Pro tip:** Always use `@latest` to ensure you're using the newest patcher version.

---

## 💻 Supported Platforms

| Platform | Typical Install Locations |
|----------|---------------------------|
| **Linux** | `/opt/Antigravity`<br>`~/Downloads/Antigravity-x64`<br>`~/.local/share/antigravity` |
| **macOS** | `/Applications/Antigravity.app`<br>`~/Applications/Antigravity.app` |
| **Windows** | `%LOCALAPPDATA%\Programs\Antigravity`<br>`%PROGRAMFILES%\Antigravity` |

Custom paths are supported via `--path` option.

---

## ⌨️ Keyboard Shortcuts

- **Alt + R** - Toggle RTL support on/off
- **Shift + 2** - Type `@` symbol (when @ fix is enabled)

---

## 🎯 Configuration File

Settings are stored in `~/.antigravity-rtl-v3.json`:

```json
{
  "faFont": "",
  "enFont": "",
  "codeFont": "",
  "lineHeight": "1.6",
  "fontSize": "16",
  "rtlEnabled": true,
  "forceRTL": false,
  "fixAtSign": true
}
```

You can manually edit this file or use the UI panel.

---

## 🐛 Troubleshooting

### Patch not working?
1. Make sure you restarted Antigravity after patching
2. Check patch status: `agy-rtl status`
3. Try restoring and re-patching:
   ```bash
   npx antigravity-rtl-patcher restore
   npx antigravity-rtl-patcher@latest patch
   ```

### Widget not appearing?
1. Open DevTools (now enabled by default)
2. Check console for any RTL engine errors
3. Make sure RTL is enabled in the widget

### Permission denied?
- **Linux/macOS**: Use `sudo` for system-wide installations
- **Windows**: Run terminal as Administrator

---

## 🤝 Contributing

Issues and pull requests are welcome at [github.com/VaFa1726/antigravity-rtl-patcher](https://github.com/VaFa1726/antigravity-rtl-patcher).

---

## 📄 License

MIT © VaFa1726

---

## 🙏 Credits

- Built with ❤️ for the Persian/Arabic developer community
- Vazirmatn font by [Saber Rastikerdar](https://github.com/rastikerdar/vazirmatn)
- Powered by Electron ASAR tools

---

## 🔗 Links

- [GitHub Repository](https://github.com/VaFa1726/antigravity-rtl-patcher)
- [NPM Package](https://www.npmjs.com/package/antigravity-rtl-patcher)
- [Report Issues](https://github.com/VaFa1726/antigravity-rtl-patcher/issues)
