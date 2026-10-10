// Bridges the web app to the main process (src/platform/desktop.ts describes this API).
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('maqsadDesktop', {
  platform: process.platform,
  scheduleNotifications: (items) => ipcRenderer.invoke('notifications:schedule', items),
  notifyNow: (item) => ipcRenderer.invoke('notifications:now', item),
  setLabels: (labels) => ipcRenderer.invoke('labels:set', labels),
  getAutoStart: () => ipcRenderer.invoke('autostart:get'),
  setAutoStart: (enabled) => ipcRenderer.invoke('autostart:set', enabled),
})
