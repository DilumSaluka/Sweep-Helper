const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('sweep', {
  createRestorePoint: () => ipcRenderer.invoke('system:restorePoint'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  showWindow: () => ipcRenderer.invoke('window:show'),
  scanDisk: () => ipcRenderer.invoke('scan:disk'),
  cleanItems: (items) => ipcRenderer.invoke('clean:items', items),
  undoLast: () => ipcRenderer.invoke('undo:last'),
  hasRestorableItems: () => ipcRenderer.invoke('safe-bin:exists'),
  listDrives: () => ipcRenderer.invoke('files:drives'),
  scanLargeFiles: (drive) => ipcRenderer.invoke('files:scan', drive),
  deleteLargeFiles: (paths) => ipcRenderer.invoke('files:delete', paths),
  listUninstallApps: () => ipcRenderer.invoke('uninstall:list'),
  uninstallApp: (app) => ipcRenderer.invoke('uninstall:run', app),
  listStartup: () => ipcRenderer.invoke('startup:list'),
  toggleStartup: (item, enable) => ipcRenderer.invoke('startup:toggle', item, enable),
  listDupDrives: () => ipcRenderer.invoke('duplicate:drives'),
  scanDuplicates: (drive) => ipcRenderer.invoke('duplicate:scan', drive),
  deleteDuplicates: (paths) => ipcRenderer.invoke('duplicate:delete', paths),
  getSystemInfo: () => ipcRenderer.invoke('system:info'),
  openRestore: () => ipcRenderer.invoke('shell:openRestore'),
  openLocation: (path) => ipcRenderer.invoke('shell:openLocation', path),
  isAdmin: () => ipcRenderer.invoke('app:isAdmin'),
  checkUpdate: () => ipcRenderer.invoke('update:check'),
  downloadUpdate: (url) => ipcRenderer.invoke('update:download', url),
  installUpdate: (path) => ipcRenderer.invoke('update:install', path)
})
