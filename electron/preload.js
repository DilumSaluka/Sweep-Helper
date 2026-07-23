const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('sweep', {
  closeWindow: () => ipcRenderer.invoke('window:close'),
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  scanDisk: () => ipcRenderer.invoke('scan:disk'),
  cleanItems: (items) => ipcRenderer.invoke('clean:items', items),
  undoLast: () => ipcRenderer.invoke('undo:last'),
  hasRestorableItems: () => ipcRenderer.invoke('safe-bin:exists'),
  listDrives: () => ipcRenderer.invoke('files:drives'),
  scanLargeFiles: (drive) => ipcRenderer.invoke('files:scan', drive),
  deleteLargeFiles: (paths) => ipcRenderer.invoke('files:delete', paths),
  listUninstallApps: () => ipcRenderer.invoke('uninstall:list'),
  uninstallApp: (app) => ipcRenderer.invoke('uninstall:run', app)
})
