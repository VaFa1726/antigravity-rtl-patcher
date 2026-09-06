# Antigravity RTL Patcher

RTL and Persian/Arabic text support for [Antigravity](https://antigravity.dev) desktop app.

[![npm version](https://img.shields.io/npm/v/antigravity-rtl-patcher)](https://www.npmjs.com/package/antigravity-rtl-patcher)
[![npm downloads](https://img.shields.io/npm/dt/antigravity-rtl-patcher)](https://www.npmjs.com/package/antigravity-rtl-patcher)

## Install

```bash
npx antigravity-rtl-patcher@latest patch
```

Use `sudo` if Antigravity is in a system directory:

```bash
sudo npx antigravity-rtl-patcher@latest patch
```

Restart Antigravity after patching.

## Usage

After patching, a toggle button appears in the bottom-right corner. Click it to enable/disable RTL support.

Keyboard shortcut: `Alt + R`

## Uninstall

```bash
npx antigravity-rtl-patcher restore
```

## Commands

| Command | Description |
|---------|-------------|
| `agy-rtl patch` | Apply RTL patch |
| `agy-rtl restore` | Remove patch |
| `agy-rtl status` | Show patch status |
| `agy-rtl update` | Check for updates |

## How It Works

The patcher modifies Antigravity's `app.asar` to inject RTL detection logic. It automatically detects Persian, Arabic, and Hebrew text and applies proper text direction.

## After Antigravity Updates

Run the patch command again after updating Antigravity:

```bash
npx antigravity-rtl-patcher@latest patch
```

## Supported Platforms

- Linux: `/opt/Antigravity`, `~/Downloads/Antigravity-x64`
- macOS: `/Applications/Antigravity.app`
- Windows: `%LOCALAPPDATA%\Programs\Antigravity`

Use `--path` option for custom locations.

## License

MIT
