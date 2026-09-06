# 🌌 Antigravity RTL Patcher

<div align="center">

![Version](https://img.shields.io/npm/v/antigravity-rtl-patcher?color=%2300bcd4&style=for-the-badge&label=VERSION)
![Downloads](https://img.shields.io/npm/dt/antigravity-rtl-patcher?color=%23e040fb&style=for-the-badge)
![License](https://img.shields.io/badge/LICENSE-MIT-brightgreen?style=for-the-badge)
![Node](https://img.shields.io/badge/NODE-%3E%3D16-339933?style=for-the-badge&logo=node.js&logoColor=white)

**Intelligent RTL & Persian Typography Engine for Antigravity IDE**

*One command. Full right-to-left support. Zero config.*

</div>

---

## 🧬 How It Works

Antigravity IDE is built on Electron. This CLI tool directly patches the IDE's core workbench files to inject a smart **MutationObserver** engine that:

1. 🔍 **Watches** the DOM for new chat messages and AI responses in real-time
2. 🧠 **Detects** Persian/Arabic/Hebrew text using Unicode analysis with ratio-based scoring
3. 🎨 **Applies** `direction: rtl` and `unicode-bidi: plaintext` only where needed
4. ✍️ **Injects** the beautiful **Vazirmatn** font for perfect Persian/Arabic readability
5. 🔒 **Isolates** English code blocks inside RTL text so they don't break

---

## ⚡ Quick Start

```bash
# Linux / macOS
npx antigravity-rtl-patcher patch

# If installed in system directory (e.g., /opt/)
sudo npx antigravity-rtl-patcher patch
```

```bash
# Windows (Run terminal as Administrator if needed)
npx antigravity-rtl-patcher patch
```

That's it. Restart Antigravity IDE and enjoy native RTL support. ✨

---

## 📖 Commands

| Command | Description |
|---------|-------------|
| `agy-rtl patch` | Inject RTL support into Antigravity IDE |
| `agy-rtl restore` | Remove patch and restore original files |
| `agy-rtl status` | Check if IDE is currently patched |
| `agy-rtl patch --path /custom/path` | Patch a custom installation directory |

---

## 🔄 After IDE Updates

When Antigravity IDE updates, the patch may be overwritten. Simply run the patch command again:

```bash
npx antigravity-rtl-patcher patch
```

---

## 🏗️ Architecture

```
antigravity-rtl-patcher/
├── bin/
│   └── cli.js              # CLI entry point (commander-based)
├── src/
│   ├── patcher.js           # Core logic: backup, inject, repack
│   ├── paths.js             # OS-aware installation path detection
│   └── utils.js             # Permission checks & helpers
├── payload/
│   ├── rtl-engine.js        # MutationObserver RTL detection engine
│   └── styles.css           # Vazirmatn font + RTL typography fixes
├── package.json
└── README.md
```

### Supported Installation Types

| Type | Description | Method |
|------|-------------|--------|
| **Unpacked** | IDE with `resources/app/` directory | Direct file modification |
| **ASAR** | App bundled as `app.asar` | Extract → Patch → Repack |

---

## 🔐 Permissions

- **User directory installs** (e.g., `~/Downloads/`): No special permissions needed
- **System directory installs** (e.g., `/opt/`): Requires `sudo` on Linux/macOS

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

## 📄 License

[MIT](https://choosealicense.com/licenses/mit/)
