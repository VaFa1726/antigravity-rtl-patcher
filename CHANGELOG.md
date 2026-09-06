# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-09-06

### 🎉 First Stable Release

This is the first stable and production-ready release of Antigravity RTL Patcher.

### ✨ Features

- **Smart RTL Detection**: Automatically detects and applies RTL to Persian/Arabic text
- **RTL Support for All Content Types**:
  - Messages and chat content
  - Tables and data displays
  - Code blocks with Persian comments
  - Headings, paragraphs, and lists
- **Preserved UI Layout**: Sidebar, navigation, and toolbars stay LTR
- **Toggle Control**: Easy on/off switch with visual indicator
- **Keyboard Shortcut**: `Alt + R` to quickly toggle RTL mode
- **Persistent Settings**: Configuration saved to `~/.antigravity-rtl.json`
- **System Font Stack**: Uses native fonts (Segoe UI, Tahoma, Arial) for optimal rendering
- **Proper Character Joining**: Persian/Arabic characters connect correctly

### 🔧 Technical Details

- Injects into Antigravity's `dist/utils.js` for reliable operation
- CSS-based RTL implementation with selective targeting
- Automatic backup before patching
- Clean restore functionality

### 📦 Installation

```bash
npx antigravity-rtl-patcher@latest patch
```

### 🎯 Compatibility

- Supports all major Antigravity versions
- Works on Linux, macOS, and Windows
- Automatically detects installation paths

### 🙏 Credits

- Persian font rendering improvements
- Community feedback and testing
- Built with ❤️ for Persian/Arabic users

---

## Development History

Previous versions (2.x, 3.x) were experimental releases during active development.
Version 1.0.0 represents the first stable, production-ready release.

[1.0.0]: https://github.com/VaFa1726/antigravity-rtl-patcher/releases/tag/v1.0.0
