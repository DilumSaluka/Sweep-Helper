const { app, BrowserWindow, ipcMain, shell } = require('electron')
const path = require('path')
const tempCleaner = require('./cleaners/temp-cleaner')
const recycleBin = require('./cleaners/recycle-bin')
const browserCache = require('./cleaners/browser-cache')
const safeBin = require('./cleaners/safe-bin')
const largeFileFinder = require('./cleaners/large-file-finder')
const uninstallApps = require('./cleaners/uninstall-apps')

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
  await safeBin.restoreLast()
  return { success: true }
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
  return uninstallApps.uninstall(app)
})
