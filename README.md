# Antigravity RTL Patch

<div align="center">
  <img src="https://img.shields.io/npm/v/antigravity-rtl-patch?color=blue&style=flat-square" alt="NPM Version">
  <img src="https://img.shields.io/npm/dm/antigravity-rtl-patch?color=green&style=flat-square" alt="NPM Downloads">
  <img src="https://img.shields.io/github/license/VaFa1726/antigravity-rtl-patcher?style=flat-square" alt="License">
</div>

<br>

**Antigravity RTL Patch** is an advanced, production-ready typography and layout patcher designed specifically for the [Antigravity](https://github.com/vafa1726) application. 

This **stable release** seamlessly adds intelligent Right-to-Left (RTL) support for Persian, Arabic, and Hebrew languages, completely transforming your chat experience without breaking the application's core LTR user interface.

## ✨ Why Choose This Patcher?

- **🧠 True Smart RTL:** Using a highly optimized DOM `TreeWalker`, it detects Persian/Arabic text in real-time. The main application layout (sidebars, navbars, menus) remains flawlessly intact.
- **💬 Intelligent Input Fields:** Your input box ("Ask a question...") remains LTR and perfectly aligned while empty. It instantly switches direction *only* when you type an RTL character.
- **🎨 Native UI Widget:** Includes a sleek, floating settings panel (Alt+R) to toggle the RTL engine on and off on the fly.
- **🛡️ Bulletproof Stability:** Comprehensively tested on Windows, macOS, and Linux. Automatically backs up your original `app.asar` before making any modifications.

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
We frequently release stability improvements. To ensure you have the absolute latest stable release, use the `@latest` flag:

```bash
npx antigravity-rtl-patch@latest patch
```

### 3. Uninstall / Restore Original
If you ever want to remove the patch and revert Antigravity to its original state, simply run:

```bash
npx antigravity-rtl-patch restore
```

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
- **`Alt + R`**: Toggles the Smart RTL engine on/off instantly.

---

## 📝 License
This project is open-source and available under the [MIT License](LICENSE).
