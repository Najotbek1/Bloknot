// Bridges the web app to the main process (src/platform/desktop.ts describes this API).
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('maqsadDesktop', {
  platform: process.platform,
  scheduleNotifications: (items) => ipcRenderer.invoke('notifications:schedule', items),
  notifyNow: (item) => ipcRenderer.invoke('notifications:now', item),
  setLabels: (labels) => ipcRenderer.invoke('labels:set', labels),
  getAutoStart: () => ipcRenderer.invoke('autostart:get'),
  setAutoStart: (enabled) => ipcRenderer.invoke('autostart:set', enabled),
  getCloseToTray: () => ipcRenderer.invoke('tray:get'),
  setCloseToTray: (enabled) => ipcRenderer.invoke('tray:set', enabled),
  startSync: () => ipcRenderer.invoke('sync:start'),
  stopSync: () => ipcRenderer.invoke('sync:stop'),
  onSyncRequest: (handler) => {
    const listener = async (_event, { id, body }) => {
      let answer
      try {
        answer = await handler(body)
      } catch {
        answer = { status: 500, body: '{"error":"internal"}' }
      }
      void ipcRenderer.invoke('sync:respond', id, answer)
    }
    ipcRenderer.on('sync:request', listener)
    return () => ipcRenderer.removeListener('sync:request', listener)
  },
})
