# Antigravity RTL Patch

<div align="center">
  <img src="https://img.shields.io/npm/v/antigravity-rtl-patch?color=blue&style=flat-square" alt="NPM Version">
  <img src="https://img.shields.io/npm/dm/antigravity-rtl-patch?color=green&style=flat-square" alt="NPM Downloads">
  <img src="https://img.shields.io/github/license/VaFa1726/antigravity-rtl-patcher?style=flat-square" alt="License">
</div>

<br>

**Antigravity RTL Patch** is an advanced, smart typography and layout patcher designed specifically for the [Antigravity](https://github.com/vafa1726) application. It seamlessly adds intelligent Right-to-Left (RTL) support for Persian, Arabic, and Hebrew languages without breaking the application's core LTR user interface.

## ✨ Features

- **🧠 Smart RTL Detection:** Automatically detects Persian/Arabic text and applies RTL direction *only* where necessary. The main application layout (sidebars, navbars, menus) remains completely intact.
- **💬 Intelligent Input Fields:** Text inputs (like "Ask a question...") remain LTR while empty. As soon as you type an RTL character, the field instantly switches direction.
- **🎨 Native UI Widget:** Includes a sleek, non-intrusive floating settings panel (Alt+R) to toggle RTL on and off in real-time.
- **⚡ Zero Overhead:** Highly optimized DOM `TreeWalker` ensures zero performance impact on large chats.
- **🛡️ Safe & Reversible:** Automatically backs up your original `app.asar` before making any changes. You can restore to the factory state at any time.

---

## 🚀 Installation & Usage

You do **not** need to download or clone this repository manually. The tool runs directly via `npx`, which comes pre-installed with [Node.js](https://nodejs.org/). 

> **Note:** If you don't have `npx`, please install Node.js first.

### 1. Apply the Patch (Install)
Close the Antigravity application, open your terminal (or Command Prompt), and run:

```bash
npx antigravity-rtl-patch patch
```

*The tool will automatically find your Antigravity installation, create a backup, and apply the patch. If it cannot find the app, it will prompt you to enter the path manually.*

### 2. Update to the Latest Version
To ensure you have the latest stable release with all bug fixes, run the patch command with the `@latest` tag:

```bash
npx antigravity-rtl-patch@latest patch
```

### 3. Restore Original (Uninstall)
If you want to remove the patch and revert Antigravity to its original, unpatched state:

```bash
npx antigravity-rtl-patch restore
```

---

## 🔐 A Note on Permissions (Linux / macOS)

Depending on how and where you installed Antigravity, you might get a **Permission Denied (EACCES)** error when running the tool. This happens because system directories (like `/opt/` on Linux or `/Applications/` on Mac) require Administrator rights to modify files.

If you encounter a permission error, simply run the command with `sudo`:

```bash
sudo npx antigravity-rtl-patch patch
```
*(You will be prompted to enter your computer's password).*

---

## 🛠️ Operating System Support

- **🐧 Linux:** Fully supported (Searches `/opt`, `/usr/lib`, `~/.local/share`, AppImage extracted locations, etc.)
- **🪟 Windows:** Fully supported (Searches `AppData\Local`, `Program Files`, etc.)
- **🍎 macOS:** Fully supported (Searches `/Applications/` and `~/Applications/`)

---

## ⌨️ Keyboard Shortcuts

Once patched, open Antigravity. You can quickly toggle the RTL mode using:
- **`Alt + R`**: Toggles the Smart RTL engine on/off globally.

---

## 📝 License
This project is open-source and available under the [MIT License](LICENSE).
