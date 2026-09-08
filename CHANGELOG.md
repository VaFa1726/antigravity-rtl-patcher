# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.9] - 2026-09-08

### 🔧 Enhanced
- **Expanded Path Detection Coverage**: Added comprehensive support for various installation naming conventions:
  - Lowercase variants: `antigravity`, `antigravity-x64`
  - Architecture-specific: `antigravity-linux-x64`, `antigravity-linux-arm64`
  - macOS: Support for both `.app` bundle variants in Downloads/Desktop folders
- **Linux System Paths**: Added `/usr/lib64`, `/usr/local/lib`, `/usr/local/share`, `~/Applications`, and `~/apps` to search paths
- **Windows 32-bit Support**: Added `ProgramFiles(x86)` detection for 32-bit installations
- **Direct File Path Support**: Fixed bug where passing direct `app.asar` file path to `--path` argument would fail. Now handles folder, resources folder, or direct file path seamlessly.
- **Snap Package Support**: Added Snap installation paths (`/snap/antigravity/current`, `~/snap/antigravity/current`) with recursive `app.asar` search (max depth 3) for non-standard layouts.

### 🐛 Fixed
- **Stale Backup Detection**: Fixed a critical bug where updating Antigravity after patching would cause the patcher to re-apply an outdated backup. Now detects stale backups automatically and refreshes them.
- **Restore Manual Path**: `restore` command now prompts for manual path input when auto-detection fails, matching the `patch` command's UX.
- **Status Manual Path**: `status` command now prompts for manual path input when auto-detection fails.

### 📝 Notes
- All variants of case-sensitive naming in Linux are now properly detected
- Enhanced compatibility with package managers and portable installations
- Improved user experience when manually specifying installation paths

## [1.0.8] - 2026-09-07

### 🐛 Fixed
- **Critical: Force Re-patch Failure**: Fixed a critical bug where `--force` re-patching would fail with `ENOENT` errors. The backup system now correctly handles the `app.asar.unpacked/` directory alongside `app.asar`, which is required by Electron's asar module for native modules (e.g., `chrome-devtools-mcp`).
- **Restore Integrity**: The `restore` command now also restores the `.unpacked` directory from backup, ensuring a complete and clean rollback.
- **CLI Executable Permission**: Set correct executable permission (`755`) on `bin/cli.js` for reliable `npx` execution on Linux/macOS.

## [1.0.7] - 2026-09-07

### 🐛 Fixed
- **List Numbers and Bullets Positioning**: Fixed ordered list numbers (`1.`, `2.`, `3.`) and bullets staying stranded on the left margin by recursively propagating RTL direction to all ancestor list containers (`<ol>`, `<ul>`).
- **Inline Elements in Blocks**: Removed `SPAN` from `BLOCK_TAGS` so block containers (`<p>`, `<div>`, `<li>`) properly receive `direction: rtl` and `text-align: right`.
- **Preserved Native Typography**: Removed forced `Courier New` font overrides on code blocks, fully preserving Antigravity's native font and editor styling.
- **NPM Package Registry & Update Checker**: Fixed 404 registry endpoint and updated package references to `antigravity-rtl-patch`.
- **macOS Path Detection**: Added support for standard macOS bundle directories (`Contents/Resources/app.asar`).
- **Clean Re-patch Support**: Added `-f, --force` option and clean backup extraction to avoid nested payload injections.

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
- **Keyboard Shortcut**: `Ctrl + E` to quickly toggle RTL mode
- **Persistent Settings**: Configuration saved to `~/.antigravity-rtl.json`
- **Native Typography**: Preserves Antigravity's native fonts and editor typography
- **Proper Character Joining**: Persian/Arabic characters connect correctly

### 🔧 Technical Details

- Injects into Antigravity's `dist/utils.js` for reliable operation
- CSS-based RTL implementation with selective targeting
- Automatic backup before patching
- Clean restore functionality

### 📦 Installation

```bash
npx antigravity-rtl-patch@latest patch
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
