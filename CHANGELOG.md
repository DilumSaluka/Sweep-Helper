# Changelog

All notable changes to Sweep Helper are documented here.

## [1.6.0] - 2026-07-28

### Added
- ⚙️ Settings page — all preferences in one place (auto-start, minimized start, explorer menu, theme, schedule)
- 🖥️ System info section in Settings (OS, RAM, hostname, admin status)
- 📋 Batch select — select files in Large File Finder / Duplicate Finder and sweep all at once
- 🖱️ Consistent icon sizing across nav tabs, title bar, and dashboard

### Fixed
- Scheduled cleanup now works via `--sweep` CLI flag auto-clean and quit
- App crash on startup — missing `pendingFiles` state definition

### Changed
- Removed duplicate toggle buttons from title bar (now in Settings)

## [1.5.0] - 2026-07-27

### Added
- 🔇 Silent auto-update with `/S` NSIS flag
- 🛡️ System restore points viewer dialog
- 📅 Schedule weekly automatic cleanup via Task Scheduler
- 💾 Canvas donut chart in Dashboard
- ⌨️ Ctrl+D/U/F/S keyboard shortcuts
- 👑 Admin badge in title bar
- 📁 File counts in cleaner subcategories
- 💾 Save and restore window position
- ⏹️ Cancel scan button for large file finder
- 📅 Keep Newest button in Duplicate Finder
- 🖱️ Right-click context menu on duplicate files
- 🔄 Shift+click to select entire duplicate group
- ⊟ Start minimized to tray option
- 🖱️ Explorer right-click context menu integration
- 🛡️ Manual restore point button in Dashboard
- File count display in cleaner subcategories

## [1.4.0] - 2026-07-26

### Added
- 🗂️ File type breakdown chips in Large File Finder
- 📄 Export sweep/duplicate report as .txt to Desktop
- 🔍 Search/filter bars in Uninstall & Startup managers
- 📝 Search counts ("X of Y" display)
- 🎉 What's New dialog on first launch after update
- 🎨 Visual polish — better layout and spacing
- 🔄 Invert selection in Duplicate Finder
- 📋 Copy file path button in Duplicate Finder
- ↩️ Restore button in cleaner results
- 🖥️ PC info (OS, RAM) in dashboard
- 📂 Open restore folder button in results
- 🖱️ Right-click context menu on large files
- 💾 Drive overview in cleaner tab
- 🔄 Check for Updates button
- 🗑️ App uninstaller with search/filter
- 📂 Large file finder with size range filter
- ⚡ Startup manager with enable/disable
- 📋 Duplicate file finder with search
- 🛡️ System restore point creation before sweep
- 💾 Minimize to tray
- ⚡ Auto-start toggle
- 💾 Settings persistence across sessions

### Fixed
- Black screen — reorder useEffect before const scan causing TDZ error
- Invisible window — remove transparent, set background color
- Single-instance lock — app not opening on second launch
- Large file scan not capturing results
- Uninstall apps showing 0
- Delete quoting for file paths with spaces

## [1.0.0] - 2026-07-22

### Added
- Initial release of Sweep Helper
- 🗑 Temporary files cleanup (%TEMP%, Recent documents, Prefetch)
- ♻️ Recycle Bin management (size preview + empty)
- 🌐 Browser cache cleanup (Chrome, Edge, Firefox)
- 🧹 One-click Sweep All button — clean everything at once
- ↩️ Safe Bin restore — deleted files stay in a hidden folder for 7 days
- 🌙 Dark/Light mode toggle
- 📊 Disk space preview before cleaning
- 🪟 Frameless modern UI with custom title bar
