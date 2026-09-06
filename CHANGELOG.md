# Changelog

All notable changes to this project will be documented in this file.

## [3.0.0] - 2024-09-06

### 🎉 Major Rewrite - Utils.js Injection Approach

This is a **breaking change** that completely rewrites the injection strategy for better control and features.

### ✨ Added

- **Advanced UI Panel** - Rich hover-activated widget with comprehensive customization
- **Custom Font Support** - Set separate fonts for Persian/Arabic, English, and code
- **Typography Controls** - Real-time line height (1.2-2.5) and font size (11-22px) adjustment
- **Persistent Configuration** - Settings saved to `~/.antigravity-rtl-v3.json`
- **Force RTL Mode** - Override auto-detection for consistent RTL layout
- **Enhanced Keyboard Shortcuts** - `Alt + R` to toggle RTL
- **@ Sign Fix** - Type `@` with `Shift+2` on Persian keyboard
- **DevTools Enabled** - Automatically enable DevTools for debugging
- **Colorful CLI Banner** - Beautiful gradient ASCII art banner
- **Update Command** - `agy-rtl update` to check for new versions

### 🔧 Changed

- **Injection Point**: Changed from `preload.js` to `dist/utils.js` for better lifecycle control
- **Config Storage**: Moved from localStorage to filesystem (`~/.antigravity-rtl-v3.json`)
- **Detection Algorithm**: Improved RTL text detection with smarter first-character analysis
- **UI Architecture**: Complete redesign with Tailwind-inspired styling
- **Dependencies**: Added `figlet`, `picocolors`, and `prompts` for better CLI experience

### 🗑️ Removed

- Old `preload-inject.js` payload (replaced with `utils-inject.js`)
- localStorage-based configuration (replaced with file-based config)

### 🐛 Fixed

- Better handling of mixed RTL/LTR content
- Improved code block preservation in RTL contexts
- More reliable font loading mechanism
- Enhanced list padding in RTL mode

### 📚 Documentation

- Completely rewritten README with v3.0 features
- Added troubleshooting section
- Added keyboard shortcuts reference
- Added configuration file documentation

---

## [2.3.4] - 2024-09-06

### ✨ Added

- Auto-update checker before patching
- `update` command to manually check for updates
- Update notification system

### 📚 Documentation

- Added update instructions to README
- Emphasized `@latest` usage in documentation

---

## [2.3.3] - 2024-09-06

### 🐛 Fixed

- Improved RTL text detection logic
- Better layout rendering for mixed content

---

## [2.3.1] - 2024-09-06

### 🐛 Fixed

- Bug fixes for layout issues
- Added IDE detection to skip patching IDE versions

---

## Earlier Versions

See [GitHub Releases](https://github.com/VaFa1726/antigravity-rtl-patcher/releases) for details on versions before 2.3.1.

---

## Migration Guide: v2.x → v3.0

### What Changed

1. **Configuration Location**: Your old settings in localStorage will not carry over. You'll need to reconfigure the RTL settings using the new UI panel.

2. **UI Location**: The old status icon is replaced with a hover-activated globe icon in the bottom-right corner.

3. **New Features**: Take advantage of custom fonts, typography controls, and Force RTL mode.

### How to Upgrade

```bash
# Restore old version
npx antigravity-rtl-patcher restore

# Install new version
npx antigravity-rtl-patcher@latest patch

# Restart Antigravity
```

Your old backup will work fine. The new patch is completely independent.

---

[3.0.0]: https://github.com/VaFa1726/antigravity-rtl-patcher/releases/tag/v3.0.0
[2.3.4]: https://github.com/VaFa1726/antigravity-rtl-patcher/releases/tag/v2.3.4
[2.3.3]: https://github.com/VaFa1726/antigravity-rtl-patcher/releases/tag/v2.3.3
[2.3.1]: https://github.com/VaFa1726/antigravity-rtl-patcher/releases/tag/v2.3.1
