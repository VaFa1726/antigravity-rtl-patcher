# Antigravity RTL Patcher

> Professional RTL (Right-to-Left) and Persian/Arabic text support for [Antigravity](https://antigravity.dev) desktop app.

[![npm version](https://img.shields.io/npm/v/antigravity-rtl-patcher)](https://www.npmjs.com/package/antigravity-rtl-patcher)
[![npm downloads](https://img.shields.io/npm/dt/antigravity-rtl-patcher)](https://www.npmjs.com/package/antigravity-rtl-patcher)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## ✨ Features

- 🌐 **Smart RTL Detection**: Automatically applies RTL to Persian/Arabic text
- 📝 **Complete Coverage**: Messages, tables, code blocks, and all text content
- 🎨 **Preserved Layout**: UI elements (sidebar, navigation) stay LTR
- ⌨️ **Keyboard Shortcut**: Toggle with `Alt + R`
- 💾 **Persistent Settings**: Your preferences are saved automatically
- 🔤 **Proper Text Rendering**: Characters connect correctly with system fonts
- 🛡️ **Safe Patching**: Automatic backup before modifications

## 🚀 Quick Start

### Installation

```bash
npx antigravity-rtl-patcher@latest patch
```

**For system-wide Antigravity installations (requires sudo):**

```bash
sudo npx antigravity-rtl-patcher@latest patch
```

### Usage

1. Restart Antigravity after patching
2. Click the toggle button in the bottom-right corner (⇄)
3. Or press `Alt + R` to toggle RTL mode

## 📋 Commands

| Command | Description |
|---------|-------------|
| `agy-rtl patch` | Apply RTL patch to Antigravity |
| `agy-rtl restore` | Remove patch and restore original |
| `agy-rtl status` | Check current patch status |
| `agy-rtl update` | Check for patcher updates |

## 🔧 How It Works

The patcher modifies Antigravity's `app.asar` file by injecting RTL detection and styling logic into `dist/utils.js`. It:

1. Creates an automatic backup of the original file
2. Extracts and modifies the necessary code
3. Repacks everything cleanly
4. Enables a toggle UI for easy control

### What Gets RTL'd

✅ Message content and chat text  
✅ Tables and data displays  
✅ Code blocks (including Persian comments)  
✅ Headings, paragraphs, and lists  

### What Stays LTR

✅ Sidebar and navigation  
✅ Toolbars and menus  
✅ Buttons and inputs  
✅ Project lists  

## 🔄 After Antigravity Updates

When Antigravity updates, you'll need to re-apply the patch:

```bash
npx antigravity-rtl-patcher@latest patch
```

Your RTL settings will be preserved in `~/.antigravity-rtl.json`.

## 🗂️ Supported Installation Paths

The patcher automatically detects Antigravity in common locations:

- **Linux**: `/opt/Antigravity`, `~/Downloads/Antigravity-x64`
- **macOS**: `/Applications/Antigravity.app`
- **Windows**: `%LOCALAPPDATA%\Programs\Antigravity`

**Custom path:**

```bash
npx antigravity-rtl-patcher patch --path /your/custom/path
```

## 🛠️ Troubleshooting

### Permission Denied

Use `sudo` for system-wide installations:

```bash
sudo npx antigravity-rtl-patcher@latest patch
```

### Antigravity Not Found

Specify the installation path manually:

```bash
npx antigravity-rtl-patcher patch --path /path/to/Antigravity
```

### Restore Original

If you encounter issues, restore the original:

```bash
npx antigravity-rtl-patcher restore
```

## 📦 Configuration

Settings are stored in `~/.antigravity-rtl.json`:

```json
{
  "enabled": true
}
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT © [VaFa1726](https://github.com/VaFa1726)

## 🙏 Acknowledgments

- Built with ❤️ for the Persian/Arabic developer community
- Inspired by the need for better RTL support in modern dev tools
- Thanks to all contributors and testers

---

**Made with ❤️ for Persian/Arabic Developers**
