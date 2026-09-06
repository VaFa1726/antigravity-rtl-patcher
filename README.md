# Antigravity RTL Patcher

Smart RTL and Persian/Arabic typography support for the [Antigravity](https://antigravity.dev) desktop app. Patches the Electron runtime to detect right-to-left text and apply proper styling automatically.

[![npm version](https://img.shields.io/npm/v/antigravity-rtl-patcher)](https://www.npmjs.com/package/antigravity-rtl-patcher)
[![npm downloads](https://img.shields.io/npm/dt/antigravity-rtl-patcher)](https://www.npmjs.com/package/antigravity-rtl-patcher)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

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

Restart Antigravity after patching.

## 🔄 Update to Latest Version

To ensure you're always using the latest version, run:

```bash
npx antigravity-rtl-patcher@latest patch
```

Or check for updates manually:

```bash
npx antigravity-rtl-patcher@latest update
```

The patcher will automatically notify you when a new version is available.

## 🗑️ Uninstall

```bash
npx antigravity-rtl-patcher restore
```

This restores the original `app.asar` from the backup created during patching.

## 📋 Commands

| Command | Description |
|---|---|
| `agy-rtl patch` | Apply RTL patch |
| `agy-rtl restore` | Remove patch, restore original |
| `agy-rtl status` | Show current patch status |
| `agy-rtl update` | Check for updates |
| `agy-rtl patch --path /custom/path` | Patch a custom installation |
| `agy-rtl patch --skip-update-check` | Skip update check during patching |

## 🔧 How it works

Antigravity is an Electron app. The patcher extracts `app.asar`, appends an RTL engine to the preload script, and repacks the archive. The engine uses a `MutationObserver` to detect Persian, Arabic, and Hebrew text in real-time and applies `direction: rtl` where needed.

After patching, an RTL icon appears at the bottom of the Antigravity window. Click it to open a settings panel where you can enable or disable RTL support. The setting persists across restarts via `localStorage`.

### What the engine does

- Detects RTL text using Unicode range analysis with ratio-based scoring
- Applies directional styling only to elements that contain RTL text
- Injects the Vazirmatn font for improved Persian/Arabic readability
- Preserves LTR direction for code blocks inside RTL text
- Provides a toggle UI to enable/disable at any time

## 🔄 After Antigravity updates

Updates may overwrite the patch. Run the patch command again:

```bash
npx antigravity-rtl-patcher@latest patch
```

**Pro tip:** Always use `@latest` flag to ensure you're patching with the newest version of the patcher.

## 💻 Supported platforms

| Platform | Typical install locations |
|---|---|
| Linux | `/opt/antigravity`, `~/Downloads/Antigravity-x64` |
| macOS | `/Applications/Antigravity.app` |
| Windows | `%LOCALAPPDATA%\Programs\Antigravity` |

Custom paths are supported via `--path`.

## 🤝 Contributing

Issues and pull requests are welcome at [github.com/VaFa1726/antigravity-rtl-patcher](https://github.com/VaFa1726/antigravity-rtl-patcher).

## 📄 License

MIT
