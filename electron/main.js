const { app, BrowserWindow, ipcMain, shell, net } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')
const tempCleaner = require('./cleaners/temp-cleaner')
const recycleBin = require('./cleaners/recycle-bin')
const browserCache = require('./cleaners/browser-cache')
const safeBin = require('./cleaners/safe-bin')
const largeFileFinder = require('./cleaners/large-file-finder')
const uninstallApps = require('./cleaners/uninstall-apps')
const startupManager = require('./cleaners/startup-manager')
const duplicateFinder = require('./cleaners/duplicate-finder')

let mainWindow = null
let windowStateSaveTimer = null

app.isQuitting = false

const isSweepMode = process.argv.includes('--sweep')
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

function loadWindowState() {
  try {
    const statePath = path.join(app.getPath('userData'), 'window-state.json')
    if (fs.existsSync(statePath)) return JSON.parse(fs.readFileSync(statePath, 'utf-8'))
  } catch {}
  return {}
}

function saveWindowState() {
  if (!mainWindow) return
  const [x, y] = mainWindow.getPosition()
  try {
    fs.writeFileSync(path.join(app.getPath('userData'), 'window-state.json'), JSON.stringify({ x, y }), 'utf-8')
  } catch {}
}

function createWindow() {
  if (isSweepMode) {
    const { execSync } = require('child_process')
    Promise.all([
      tempCleaner.cleanAll(),
      recycleBin.clean(),
      browserCache.cleanAll()
    ]).then(() => {
      app.isQuitting = true
      app.quit()
    }).catch(() => {
      app.isQuitting = true
      app.quit()
    })
    return
  }

  const saved = loadWindowState()
  mainWindow = new BrowserWindow({
    width: 680,
    height: 720,
    minWidth: 520,
    minHeight: 480,
    x: saved.x,
    y: saved.y,
    resizable: true,
    frame: false,
    backgroundColor: '#111827',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  const isDev = process.env.DEV_MODE === 'true'
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  if (readSettings().startMinimized) {
    mainWindow?.hide()
  }

  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.on('move', () => {
    if (windowStateSaveTimer) clearTimeout(windowStateSaveTimer)
    windowStateSaveTimer = setTimeout(saveWindowState, 300)
  })
}

let tray = null
function createTray() {
  const { Tray, Menu, nativeImage } = require('electron')
  const iconPath = path.join(__dirname, '..', 'assets', 'icon.png')
  try {
    tray = new Tray(nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 }))
    tray.setToolTip('Sweep Helper')
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: 'Show', click: () => { mainWindow?.show() } },
      { label: 'Quit', click: () => { app.isQuitting = true; app.quit() } }
    ]))
    tray.on('double-click', () => mainWindow?.show())
  } catch {}
}

process.on('uncaughtException', (err) => {
  console.error('Uncaught:', err.message)
})

process.on('unhandledRejection', (err) => {
  console.error('Unhandled:', err.message)
})

app.whenReady().then(() => {
  createWindow()
  createTray()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.handle('window:close', () => mainWindow?.close())
ipcMain.handle('window:minimize', () => mainWindow?.minimize())
ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})
ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized())
ipcMain.handle('window:show', () => mainWindow?.show())

ipcMain.handle('scan:disk', async () => {
  const all = await Promise.allSettled([
    tempCleaner.scan().catch(() => []),
    recycleBin.scan().catch(() => [{ id: 'recycle', label: 'Recycle Bin', size: 0 }]),
    browserCache.scan().catch(() => [])
  ])
  return all.filter(r => r.status === 'fulfilled').flatMap(r => r.value)
})

ipcMain.handle('clean:items', async (_event, items) => {
  for (const item of items) {
    switch (item.id) {
      case 'temp': await tempCleaner.clean(item.subCategories); break
      case 'recycle': await recycleBin.clean(); break
      case 'browser': await browserCache.clean(item.subCategories); break
    }
  }
  return { success: true }
})

const SETTINGS_PATH = path.join(app.getPath('userData'), 'settings.json')

function readSettings() {
  try {
    if (fs.existsSync(SETTINGS_PATH)) return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8'))
  } catch {}
  return {}
}

function writeSettings(data) {
  try { fs.writeFileSync(SETTINGS_PATH, JSON.stringify(data), 'utf-8') } catch {}
}

ipcMain.handle('startMinimized:get', async () => {
  return !!readSettings().startMinimized
})

ipcMain.handle('startMinimized:set', async (_event, val) => {
  const s = readSettings()
  s.startMinimized = !!val
  writeSettings(s)
  return { success: true }
})

ipcMain.handle('app:isAdmin', async () => {
  try {
    return require('child_process').execSync('net session', { timeout: 2000 }).toString().length > 0
  } catch { return false }
})

ipcMain.handle('undo:last', async () => {
  try {
    await safeBin.restoreLast()
    return { success: true }
  } catch (e) {
    return { success: false, error: e.message }
  }
})

ipcMain.handle('safe-bin:exists', async () => {
  return safeBin.hasRestorableItems()
})

ipcMain.handle('files:drives', async () => {
  return largeFileFinder.listDrives()
})

ipcMain.handle('files:deepScan', async (_event, driveRoot) => {
  try {
    const script = `$path = "${driveRoot}\\"; Get-ChildItem -Path $path -Directory -ErrorAction SilentlyContinue | ForEach-Object { $size = (Get-ChildItem -Path $_.FullName -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum; [PSCustomObject]@{ Name = $_.Name; Size = if ($size) { $size } else { 0 }; ItemCount = (Get-ChildItem -Path $_.FullName -Recurse -ErrorAction SilentlyContinue | Measure-Object).Count } } | Sort-Object -Property Size -Descending | Select-Object -First 30 | ConvertTo-Json -Compress`
    const { execFile } = require('child_process')
    const ps = process.env.SystemRoot + '\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'
    return new Promise((resolve) => {
      execFile(ps, ['-NoProfile', '-Command', script], { maxBuffer: 1024 * 1024, timeout: 30000 }, (err, stdout) => {
        if (err) { resolve([]); return }
        try {
          const data = JSON.parse(stdout.trim())
          resolve(Array.isArray(data) ? data : [data])
        } catch { resolve([]) }
      })
    })
  } catch { return [] }
})

ipcMain.handle('files:scan', async (_event, driveRoot) => {
  return largeFileFinder.scan(driveRoot)
})

ipcMain.handle('files:delete', async (_event, paths) => {
  return largeFileFinder.deleteFiles(paths)
})

ipcMain.handle('uninstall:list', async () => {
  return uninstallApps.list()
})

ipcMain.handle('uninstall:run', async (_event, app) => {
  try {
    return await uninstallApps.uninstall(app)
  } catch (e) {
    return { success: false, error: e.message }
  }
})

ipcMain.handle('startup:list', async () => {
  return startupManager.list()
})

ipcMain.handle('startup:toggle', async (_event, item, enable) => {
  return startupManager.toggle(item, enable)
})

ipcMain.handle('duplicate:drives', async () => {
  return duplicateFinder.listDrives()
})

ipcMain.handle('duplicate:scan', async (_event, driveRoot) => {
  return duplicateFinder.scan(driveRoot)
})

ipcMain.handle('duplicate:delete', async (_event, paths) => {
  return duplicateFinder.deleteFiles(paths)
})

ipcMain.handle('system:listRestorePoints', async () => {
  try {
    const { execSync } = require('child_process')
    const output = execSync('powershell.exe "Get-ComputerRestorePoint | Select-Object -Property Description,SequenceNumber,CreationTime,RestorePointType | ConvertTo-Json"', { timeout: 10000 }).toString().trim()
    return JSON.parse(output)
  } catch { return [] }
})

ipcMain.handle('system:restorePoint', async () => {
  try {
    require('child_process').execSync('powershell.exe -Command "Checkpoint-Computer -Description \'Sweep Helper cleanup\' -RestorePointType MODIFY_SETTINGS"', { timeout: 30000 })
    return { success: true }
  } catch (e) { return { success: false, error: e.message } }
})

ipcMain.handle('schedule:weekly', async () => {
  try {
    const exePath = app.getPath('exe')
    require('child_process').execSync(`schtasks /create /tn "SweepHelperWeekly" /tr "\"${exePath}\" --sweep" /sc weekly /f`, { timeout: 5000 })
    return { success: true }
  } catch (e) { return { success: false, error: e.message } }
})

ipcMain.handle('schedule:status', async () => {
  try {
    require('child_process').execSync('schtasks /query /tn "SweepHelperWeekly" /nh', { timeout: 3000 })
    return { success: true }
  } catch { return { success: false } }
})

ipcMain.handle('schedule:remove', async () => {
  try {
    require('child_process').execSync('schtasks /delete /tn "SweepHelperWeekly" /f', { timeout: 5000 })
    return { success: true }
  } catch (e) { return { success: false, error: e.message } }
})

const GITHUB_REPO = 'DilumSaluka/Sweep-Helper'
const UPDATE_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`

ipcMain.handle('update:check', async () => {
  try {
    const res = await net.fetch(UPDATE_URL, { headers: { Accept: 'application/vnd.github.v3+json' } })
    const data = await res.json()
    if (!data.tag_name) return { available: false }
    const latestTag = data.tag_name.replace(/^v/, '')
    const current = app.getVersion()
    const latestParts = latestTag.split('.').map(Number)
    const currentParts = current.split('.').map(Number)
    const isNewer = latestParts[0] > currentParts[0] || (latestParts[0] === currentParts[0] && latestParts[1] > currentParts[1])
    if (!isNewer) return { available: false }
    const asset = data.assets.find(a => a.name.endsWith('.exe') && a.name.includes('Setup'))
    return { available: true, version: latestTag, url: asset?.browser_download_url, releaseUrl: data.html_url }
  } catch { return { available: false, error: true } }
})

ipcMain.handle('update:download', async (_event, url) => {
  const tempDir = app.getPath('temp')
  const dest = path.join(tempDir, 'sweep-helper-update.exe')
  try {
    const res = await net.fetch(url)
    if (!res.ok) return { success: false, error: `HTTP ${res.status}` }
    const buffer = Buffer.from(await res.arrayBuffer())
    fs.mkdirSync(tempDir, { recursive: true })
    fs.writeFileSync(dest, buffer)
    return { success: true, path: dest }
  } catch (e) { return { success: false, error: e.message } }
})

ipcMain.handle('autostart:get', async () => {
  try {
    const res = require('child_process').execSync(
      'reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v "SweepHelper" 2>nul',
      { timeout: 3000 }
    ).toString()
    return res.includes('SweepHelper')
  } catch { return false }
})

ipcMain.handle('autostart:set', async (_event, enable) => {
  try {
    const exePath = app.getPath('exe')
    if (enable) {
      require('child_process').execSync(`reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v "SweepHelper" /t REG_SZ /d "${exePath}" /f`, { timeout: 3000 })
    } else {
      require('child_process').execSync(`reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v "SweepHelper" /f 2>nul`, { timeout: 3000 })
    }
    return { success: true }
  } catch (e) { return { success: false, error: e.message } }
})

ipcMain.handle('system:info', async () => {
  const totalMem = os.totalmem()
  const freeMem = os.freemem()
  return {
    platform: os.platform(),
    release: os.release(),
    arch: os.arch(),
    totalMem,
    freeMem,
    hostname: os.hostname()
  }
})

ipcMain.handle('export:duplicates', async (_event, groups) => {
  try {
    const desktop = app.getPath('desktop')
    let content = `Sweep Helper Duplicate Files Report\n${'='.repeat(40)}\nDate: ${new Date().toLocaleString()}\n${'='.repeat(40)}\n\n`
    groups.forEach((g, i) => {
      content += `Group ${i + 1}: ${g.files[0].split('\\').pop()} (${g.size} bytes)\n`
      g.files.forEach(f => { content += `  - ${f}\n` })
      content += '\n'
    })
    const filePath = path.join(desktop, `sweep-duplicates-${Date.now()}.txt`)
    fs.writeFileSync(filePath, content, 'utf-8')
    return { success: true, path: filePath }
  } catch (e) { return { success: false, error: e.message } }
})

ipcMain.handle('export:report', async (_event, { freed, count, date }) => {
  try {
    const desktop = app.getPath('desktop')
    const content = `Sweep Helper Cleanup Report\n${'='.repeat(40)}\nDate: ${date}\nSpace Freed: ${freed}\nItems Cleaned: ${count}\n${'='.repeat(40)}\nThank you for using Sweep Helper!`
    const filePath = path.join(desktop, `sweep-report-${Date.now()}.txt`)
    fs.writeFileSync(filePath, content, 'utf-8')
    return { success: true, path: filePath }
  } catch (e) { return { success: false, error: e.message } }
})

ipcMain.handle('shell:openRestore', async () => {
  try {
    await shell.openPath(path.join(os.homedir(), '.sweep-helper-restore'))
  } catch (e) { console.error('Failed to open restore folder:', e.message) }
})

ipcMain.handle('explorer:installMenu', async () => {
  try {
    const exePath = app.getPath('exe')
    const { execSync } = require('child_process')
    execSync(`reg add "HKCR\\*\\shell\\Sweep with Sweep Helper\\command" /ve /d "${exePath}" "--sweep-file" "%1" /f`, { timeout: 3000 })
    execSync(`reg add "HKCR\\Directory\\shell\\Sweep with Sweep Helper\\command" /ve /d "${exePath}" "--sweep-folder" "%1" /f`, { timeout: 3000 })
    execSync(`reg add "HKCR\\*\\shell\\Sweep with Sweep Helper" /v "Icon" /d "${exePath}" /f`, { timeout: 3000 })
    return { success: true }
  } catch (e) { return { success: false, error: e.message } }
})

ipcMain.handle('explorer:removeMenu', async () => {
  try {
    require('child_process').execSync('reg delete "HKCR\\*\\shell\\Sweep with Sweep Helper" /f', { timeout: 3000 })
    require('child_process').execSync('reg delete "HKCR\\Directory\\shell\\Sweep with Sweep Helper" /f', { timeout: 3000 })
    return { success: true }
  } catch (e) { return { success: false, error: e.message } }
})

ipcMain.handle('explorer:checkMenu', async () => {
  try {
    require('child_process').execSync('reg query "HKCR\\*\\shell\\Sweep with Sweep Helper"', { timeout: 3000 })
    return true
  } catch { return false }
})

ipcMain.handle('file:sweepItem', async (_event, filePath) => {
  try {
    await safeBin.addFile(filePath)
    return { success: true }
  } catch (e) { return { success: false, error: e.message } }
})

ipcMain.handle('shell:openLocation', async (_event, filePath) => {
  try {
    shell.showItemInFolder(filePath)
  } catch (e) { console.error('Failed to open location:', e.message) }
})

ipcMain.handle('update:install', async (_event, installerPath) => {
  try {
    require('child_process').execFile(installerPath, ['/S'])
  } catch (e) { console.error('Failed to run installer:', e.message) }
  app.quit()
})

ipcMain.handle('hunter:listProcesses', async () => {
  try {
    const ps = require('child_process').execSync(
      `powershell -NoProfile -Command "Get-Process | Where-Object { $_.MainWindowTitle -ne '' } | Select-Object Id, ProcessName, @{N='WindowTitle';E={$_.MainWindowTitle}}, @{N='StartTime';E={$_.StartTime.ToString('yyyy-MM-dd HH:mm:ss')}} | ConvertTo-Json -Compress"`,
      { timeout: 5000 }
    ).toString().trim()
    return JSON.parse(ps)
  } catch { return [] }
})

ipcMain.handle('hunter:getWindowAtCursor', async () => {
  try {
    const result = require('child_process').execSync(
      'powershell -NoProfile -Command "Add-Type -AssemblyName System.Windows.Forms; $pt = [Windows.Forms.Cursor]::Position; Write-Output \\"$($pt.X),$($pt.Y)\\""',
      { timeout: 3000 }
    ).toString().trim()
    const [x, y] = result.split(',').map(Number)
    const windowInfo = require('child_process').execSync(
      `powershell -NoProfile -Command "$sig = @\\'[DllImport(\\"user32.dll\\")] public static extern IntPtr WindowFromPoint(int x, int y); [DllImport(\\"user32.dll\\")] public static extern uint GetWindowThreadProcessId(IntPtr hwnd, out int pid);\\'@; Add-Type -MemberDefinition $sig -Name Win32 -Namespace Win32; $hwnd = [Win32.Win32]::WindowFromPoint($x,$y); $pid = 0; [Win32.Win32]::GetWindowThreadProcessId($hwnd, [ref]$pid); Write-Output \\"$pid\\""`,
      { timeout: 5000 }
    ).toString().trim()
    const pid = parseInt(windowInfo)
    if (!pid) return null
    const proc = require('child_process').execSync(
      `powershell "Get-Process -Id ${pid} | Select-Object Id, ProcessName, @{N='WindowTitle';E={$_.MainWindowTitle}}, @{N='StartTime';E={$_.StartTime.ToString('yyyy-MM-dd HH:mm:ss')}} | ConvertTo-Json"`,
      { timeout: 5000 }
    ).toString().trim()
    return JSON.parse(proc)
  } catch { return null }
})

ipcMain.handle('hunter:killProcess', async (_event, pid) => {
  try {
    require('child_process').execSync(`taskkill /PID ${pid} /F`, { timeout: 3000 })
    return { success: true }
  } catch (e) { return { success: false, error: e.message } }
})

ipcMain.handle('hunter:getUninstallInfo', async (_event, processName) => {
  try {
    const info = require('child_process').execSync(
      `powershell "Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | Where-Object { $_.DisplayName -match '${processName.replace(/[^a-zA-Z0-9 ]/g, '')}' } | Select-Object DisplayName, UninstallString, DisplayVersion, Publisher, InstallLocation | ConvertTo-Json -Compress"`,
      { timeout: 5000 }
    ).toString().trim()
    if (!info || info === 'null') return null
    return JSON.parse(info)
  } catch { return null }
})

ipcMain.handle('hunter:scanLeftovers', async (_event, appName) => {
  const leftovers = { files: [], registry: [] }
  const sanitized = appName.replace(/[^a-zA-Z0-9 ]/g, '').trim()
  if (!sanitized) return leftovers
  try {
    const fileDirs = require('child_process').execSync(
      `powershell "Get-ChildItem \\"$env:LOCALAPPDATA\\",\\"$env:APPDATA\\" -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -like \\"*${sanitized}*\\" } | Select-Object FullName | ConvertTo-Json -Compress"`,
      { timeout: 5000 }
    ).toString().trim()
    if (fileDirs && fileDirs !== 'null') {
      leftovers.files = JSON.parse(fileDirs)
    }
  } catch {}
  try {
    const regKeys = require('child_process').execSync(
      `powershell "Get-ChildItem \\"HKCU:\\Software\\",\\"HKLM:\\Software\\" -ErrorAction SilentlyContinue | Where-Object { $_.PSChildName -like \\"*${sanitized}*\\" } | Select-Object @{N='Path';E={$_.PSPath}} | ConvertTo-Json -Compress"`,
      { timeout: 5000 }
    ).toString().trim()
    if (regKeys && regKeys !== 'null') {
      leftovers.registry = JSON.parse(regKeys)
    }
  } catch {}
  return leftovers
})

ipcMain.handle('hunter:runUninstaller', async (_event, uninstallString) => {
  try {
    const cmd = uninstallString.replace(/^"(.+)"$/, '$1').trim()
    require('child_process').exec(cmd, { timeout: 30000 })
    return { success: true }
  } catch (e) { return { success: false, error: e.message } }
})
