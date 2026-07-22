const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('sweep', {
  closeWindow: () => ipcRenderer.invoke('window:close'),
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  scanDisk: () => ipcRenderer.invoke('scan:disk'),
  cleanItems: (items) => ipcRenderer.invoke('clean:items', items),
  undoLast: () => ipcRenderer.invoke('undo:last'),
  hasRestorableItems: () => ipcRenderer.invoke('safe-bin:exists')
})
