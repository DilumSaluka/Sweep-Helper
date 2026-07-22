[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE) [![Latest Release](https://img.shields.io/github/v/release/DilumSaluka/Sweep-Helper?label=version)](https://github.com/DilumSaluka/Sweep-Helper/releases) [![Build EXE](https://github.com/DilumSaluka/Sweep-Helper/actions/workflows/build.yml/badge.svg)](https://github.com/DilumSaluka/Sweep-Helper/actions/workflows/build.yml) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)](CONTRIBUTING.md)

# 🧹 Sweep Helper

**Clean your PC in one click. No ads. No telemetry. No bloat.**

Sweep Helper is a free, open-source Windows cleaner that removes temporary files, browser cache, and Recycle Bin junk — all from a beautiful, friendly interface. No confusing settings, no upgrade popups, just one big button.

Created by **[Dilum Saluka](https://github.com/DilumSaluka)**.

---

## 📥 Download

| Version | Download | Size |
|---------|----------|------|
| v1.0 | [Sweep-Helper-Setup-1.0.0.exe](https://github.com/DilumSaluka/Sweep-Helper/releases/download/v1.0/Sweep-Helper-Setup-1.0.0.exe) | ~70 MB |

> Windows 10/11 only. The installer is code-signed and safe.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🗑 **Temp Files** | Cleans %TEMP%, Windows Temp, Recent documents, Prefetch |
| ♻️ **Recycle Bin** | Shows size before emptying — no surprises |
| 🌐 **Browser Cache** | Cleans Chrome, Edge, and Firefox cache |
| 🧹 **One-Click Sweep** | Single button cleans everything at once |
| ↩️ **Safe Undo** | Files go to a hidden restore folder — recover anytime within 7 days |
| 🌙 **Dark/Light Mode** | Toggle between themes with one click |
| 📊 **Size Preview** | See exactly how much space you will free before you clean |
| 🔒 **No Tracking** | Zero telemetry, zero ads, zero analytics |

---

## 🚀 How to Use

1. **Download** the latest installer from [Releases](https://github.com/DilumSaluka/Sweep-Helper/releases)
2. **Install** — run the EXE and follow the setup wizard
3. **Open** Sweep Helper — it automatically scans your PC
4. **Click 🧹 Sweep** — done. Your PC has more free space

> Everything you delete goes to a hidden `~/.sweep-helper-restore` folder. If you change your mind, click **Undo** in the top bar.

---

## 🔧 Build from Source

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- Windows 10/11

### Steps

```bash
# Clone the repo
git clone https://github.com/DilumSaluka/Sweep-Helper.git
cd Sweep-Helper

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build installer
npm run build
```

The installer will be in the `release/` folder.

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Shell | **Electron** |
| UI | **React** + **Tailwind CSS** |
| Build Tool | **Vite** |
| Installer | **electron-builder** (NSIS) |
| File Operations | Node.js **fs** + **child_process** |
| System Queries | **PowerShell** scripts |
| Theme | Dark/Light with Tailwind class mode |
| CI/CD | **GitHub Actions** — auto-build on tags |

---

## 🔒 Security

- [Private vulnerability reporting](https://github.com/DilumSaluka/Sweep-Helper/security/advisories)
- No network requests — the app works fully offline
- No telemetry, no analytics, no tracking
- Files are moved to a restore folder, not permanently deleted immediately

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). All contributions welcome!

---

## 📄 License

MIT License — see [LICENSE](LICENSE) file.

Copyright (c) 2026 Dilum Saluka
