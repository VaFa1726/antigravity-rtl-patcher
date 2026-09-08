# Antigravity RTL Patch

<div align="center">
  <img src="https://img.shields.io/npm/v/antigravity-rtl-patch?color=blue&style=flat-square" alt="NPM Version">
  <img src="https://img.shields.io/npm/dm/antigravity-rtl-patch?color=green&style=flat-square" alt="NPM Downloads">
  <img src="https://img.shields.io/github/license/VaFa1726/antigravity-rtl-patcher?style=flat-square" alt="License">
</div>

<br>

**Antigravity RTL Patch** is an advanced, production-ready typography and layout patcher designed specifically for the [Antigravity](https://github.com/VaFa1726/antigravity-rtl-patcher) application. 

This **stable release** seamlessly adds intelligent Right-to-Left (RTL) support for Persian, Arabic, and Hebrew languages, completely transforming your chat experience without breaking the application's core LTR user interface.

## ✨ Why Choose This Patcher?

- **🧠 True Smart RTL:** Using a highly optimized DOM `TreeWalker`, it detects Persian/Arabic text in real-time. The main application layout (sidebars, navbars, menus) remains flawlessly intact.
- **🔢 Perfect Ordered & Unordered Lists:** Flawlessly aligns numbers (`1.`, `2.`, `3.`) and bullet points (`•`) to the right side next to Persian text, eliminating disconnected bullets and stranded numbers.
- **💬 Intelligent Input Fields:** Your input box ("Ask anything...") remains LTR and perfectly aligned while empty. It instantly switches direction *only* when you type an RTL character.
- **💻 Native Typography Preserved:** Keeps Antigravity's native fonts and editor typography intact. Code blocks stay LTR with their original editor font without font overrides.
- **🎨 Native UI Widget:** Includes a sleek, floating settings panel (`Ctrl + E`) to toggle the RTL engine on and off on the fly.
- **🛡️ Clean Re-patch & Bulletproof Safety:** Automatically backs up your original `app.asar` before making any modifications. Updates and `--force` re-patches extract cleanly from original backups to prevent nested payloads.

---

## 🚀 Installation Guide

You do **not** need to download or clone this repository. The patcher runs directly via `npx`, which comes pre-installed with [Node.js](https://nodejs.org/). 

> **⚠️ Prerequisites:** You must have Node.js installed on your system. If you do not have `npx` available in your terminal, please [download and install Node.js first](https://nodejs.org/).

### 1. Apply the Patch (Windows, macOS, Linux)
Close the Antigravity application entirely. Open your terminal (or Command Prompt / PowerShell) and run:

```bash
npx antigravity-rtl-patch patch
```

*The tool will automatically locate your Antigravity installation, create a safe backup, and inject the smart RTL engine. If the app cannot be found automatically, the patcher will politely ask you to enter the installation path manually.*

### 2. Updating to the Latest Version
To update the patcher and apply the latest fixes:

```bash
npx antigravity-rtl-patch@latest patch
```

*If you ever want to force re-apply the patch:*
```bash
npx antigravity-rtl-patch patch -f
```

### 3. Check Patch Status
To check whether Antigravity is currently patched and which version is installed:

```bash
npx antigravity-rtl-patch status
```

### 4. Uninstall / Restore Original
If you ever want to remove the patch and revert Antigravity to its original state, simply run:

```bash
npx antigravity-rtl-patch restore
```

### 5. Custom Installation Path
If your Antigravity is installed in a non-standard location (e.g., Snap packages, portable installs), you can specify the path manually:

```bash
npx antigravity-rtl-patch patch --path /path/to/antigravity
npx antigravity-rtl-patch restore --path /path/to/antigravity
npx antigravity-rtl-patch status --path /path/to/antigravity
```

> **💡 Tip:** You can point `--path` to the installation folder, the `resources` folder, or even the `app.asar` file directly. The patcher will figure it out automatically. If the path is not provided and auto-detection fails, the patcher will prompt you to enter it interactively.

---

## 🔐 Permission Issues (Linux / macOS users)

Depending on your operating system, Antigravity might be installed in a system-protected directory (such as `/opt/` on Linux or `/Applications/` on macOS). 

If you run the patch command and receive an **`EACCES: permission denied`** error, it simply means the terminal does not have the necessary rights to modify the Antigravity files.

**How to fix it:**
Simply run the command with administrator privileges using `sudo`:

```bash
sudo npx antigravity-rtl-patch patch
```
*(You will be prompted to enter your computer's password. This grants the script the one-time permission needed to modify the system files).*

---

## ⌨️ Keyboard Shortcuts

Once successfully patched, open Antigravity. You can quickly toggle the RTL mode using:
- **`Ctrl + E`**: Toggles the Smart RTL engine on/off instantly.

---

