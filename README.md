# Antigravity RTL Patcher

> RTL (Right-to-Left) support for [Antigravity](https://antigravity.dev) desktop app with Persian/Arabic text.

[![npm version](https://img.shields.io/npm/v/antigravity-rtl-patcher)](https://www.npmjs.com/package/antigravity-rtl-patcher)
[![npm downloads](https://img.shields.io/npm/dt/antigravity-rtl-patcher)](https://www.npmjs.com/package/antigravity-rtl-patcher)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## ✨ Features

- 🌐 Smart RTL detection for Persian/Arabic text
- 📝 RTL support for messages, tables, and code blocks
- 🎨 UI elements (sidebar, navigation) stay LTR
- ⌨️ Toggle with `Alt + R` keyboard shortcut
- 💾 Settings saved automatically
- 🔤 Proper character rendering with system fonts

## 🚀 Installation

### Option 1: From npm (Recommended)

```bash
npx antigravity-rtl-patcher@latest patch
```

### Option 2: Direct from GitHub

```bash
npx github:VaFa1726/antigravity-rtl-patcher patch
```

Then restart Antigravity and press `Alt + R` to toggle RTL mode.

## 📋 Commands

| Command | Description |
|---------|-------------|
| `agy-rtl patch` | Apply RTL patch |
| `agy-rtl restore` | Restore original |
| `agy-rtl status` | Check patch status |
| `agy-rtl update` | Check for updates |

## 🔧 Custom Installation Path

```bash
npx antigravity-rtl-patcher patch --path /your/custom/path
```

## 🔄 After Antigravity Updates

Re-apply the patch after updating Antigravity:

**From npm:**
```bash
npx antigravity-rtl-patcher@latest patch
```

**From GitHub:**
```bash
npx github:VaFa1726/antigravity-rtl-patcher patch
```

> **💡 Tip:** Use GitHub installation to get the latest changes immediately. npm version is updated every 24 hours.

## 🛠️ Troubleshooting

**Restore original if needed:**

```bash
npx antigravity-rtl-patcher restore
```

## 📄 License

MIT © [VaFa1726](https://github.com/VaFa1726)

---

**Made with ❤️ for Persian/Arabic Developers**
