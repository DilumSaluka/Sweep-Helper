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

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 520,
    height: 680,
    resizable: false,
    frame: false,
    transparent: true,
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
}

process.on('uncaughtException', (err) => {
  console.error('Uncaught:', err.message)
})

process.on('unhandledRejection', (err) => {
  console.error('Unhandled:', err.message)
})

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.handle('window:close', () => mainWindow?.close())
ipcMain.handle('window:minimize', () => mainWindow?.minimize())
ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized())

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

ipcMain.handle('shell:openRestore', async () => {
  try {
    await shell.openPath(path.join(os.homedir(), '.sweep-helper-restore'))
  } catch (e) { console.error('Failed to open restore folder:', e.message) }
})

ipcMain.handle('shell:openLocation', async (_event, filePath) => {
  try {
    shell.showItemInFolder(filePath)
  } catch (e) { console.error('Failed to open location:', e.message) }
})

ipcMain.handle('update:install', async (_event, installerPath) => {
  try {
    await shell.openPath(installerPath)
  } catch (e) { console.error('Failed to open installer:', e.message) }
  app.quit()
})
