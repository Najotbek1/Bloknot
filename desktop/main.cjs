// Maqsad for Windows: the same web app (built into ./web) in an Electron window, plus what a
// browser cannot do — notifications while the window is closed (the app stays in the tray) and
// starting with Windows. All data stays in the app's own IndexedDB, as on the phone.
const { app, BrowserWindow, ipcMain, Menu, Notification, Tray, net, protocol, shell, nativeImage } = require('electron')
const http = require('node:http')
const os = require('node:os')
const path = require('node:path')
const { pathToFileURL } = require('node:url')

const APP_ID = 'uz.najotbek.maqsad'
const ICON = path.join(__dirname, 'build', 'icon.png')
/** How often due notifications are checked. */
const TICK_MS = 15 * 1000
/** Notifications missed by more than this (the PC was off or asleep) are dropped, not shown late. */
const LATE_LIMIT_MS = 10 * 60 * 1000

/** The built web app (copied here by CI), served as app://maqsad/ — a stable, secure origin for its data. */
const WEB_DIR = path.join(__dirname, 'web')
const APP_URL = 'app://maqsad/index.html'

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } },
])

let win = null
let tray = null
let quitting = false
let labels = { open: 'Maqsad', quit: 'Quit', tooltip: 'Maqsad' }
/** Planned notifications from the web app: { id, at, title, body }. */
let plan = []
/** Keys of notifications already shown, so a re-sent plan does not repeat them. */
const shown = new Set()

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => showWindow())
  app.whenReady().then(start)
}

function start() {
  app.setAppUserModelId(APP_ID)
  Menu.setApplicationMenu(null)
  protocol.handle('app', (request) => {
    const pathname = decodeURIComponent(new URL(request.url).pathname)
    const file = path.normalize(path.join(WEB_DIR, pathname === '/' ? 'index.html' : pathname))
    if (!file.startsWith(WEB_DIR)) return new Response('Not found', { status: 404 })
    return net.fetch(pathToFileURL(file).toString())
  })
  createWindow()
  createTray()
  setInterval(tick, TICK_MS)
}

function createWindow() {
  win = new BrowserWindow({
    width: 1100,
    height: 800,
    minWidth: 380,
    minHeight: 560,
    title: 'Maqsad',
    icon: ICON,
    backgroundColor: '#0e1017',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })
  void win.loadURL(APP_URL)
  // Started with Windows: stay in the tray until the user opens it.
  if (!process.argv.includes('--hidden')) win.once('ready-to-show', () => win.show())

  // Links (contact email, privacy policy) open in the system's apps, never inside the window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })
  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('app://')) {
      event.preventDefault()
      void shell.openExternal(url)
    }
  })

  // Closing the window keeps Maqsad in the tray so reminders still arrive; "Quit" ends it.
  win.on('close', (event) => {
    if (!quitting) {
      event.preventDefault()
      win.hide()
    }
  })
}

function showWindow() {
  if (!win) return
  if (win.isMinimized()) win.restore()
  win.show()
  win.focus()
}

function createTray() {
  tray = new Tray(nativeImage.createFromPath(ICON).resize({ width: 16, height: 16 }))
  tray.on('click', showWindow)
  updateTray()
}

function updateTray() {
  if (!tray) return
  tray.setToolTip(labels.tooltip)
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: labels.open, click: showWindow },
      { type: 'separator' },
      {
        label: labels.quit,
        click: () => {
          quitting = true
          app.quit()
        },
      },
    ]),
  )
}

function keyOf(item) {
  return `${item.at}|${item.title}|${item.body}`
}

function notify(item) {
  if (!Notification.isSupported()) return
  const notification = new Notification({ title: item.title, body: item.body, icon: ICON })
  notification.on('click', showWindow)
  notification.show()
}

function tick() {
  const now = Date.now()
  for (const item of plan) {
    const key = keyOf(item)
    if (item.at > now || shown.has(key)) continue
    shown.add(key)
    if (now - item.at <= LATE_LIMIT_MS) notify(item)
  }
}

ipcMain.handle('notifications:schedule', (_event, items) => {
  plan = Array.isArray(items) ? items.filter((item) => typeof item.at === 'number') : []
  // Forget shown keys that are no longer planned, so the set does not grow forever.
  const planned = new Set(plan.map(keyOf))
  for (const key of shown) if (!planned.has(key)) shown.delete(key)
  tick()
})

ipcMain.handle('notifications:now', (_event, item) => notify(item))

ipcMain.handle('labels:set', (_event, next) => {
  labels = { ...labels, ...next }
  updateTray()
})

ipcMain.handle('autostart:get', () => app.getLoginItemSettings().openAtLogin)

ipcMain.handle('autostart:set', (_event, enabled) => {
  app.setLoginItemSettings({ openAtLogin: Boolean(enabled), args: ['--hidden'] })
})

// --- Wi-Fi sync with the phone (src/core/sync/lan.ts) ---
// The main process only relays: the key, decryption and merging live in the web app.
/** Phone backups are a few MB at most; anything larger is refused. */
const SYNC_BODY_LIMIT = 30 * 1024 * 1024
/** Safety net: the web app stops the server itself when the QR code expires. */
const SYNC_MAX_MS = 6 * 60 * 1000
const SYNC_ANSWER_MS = 60 * 1000

let syncServer = null
let syncTimer = null
let nextRequestId = 1
/** Requests waiting for the web app's answer: id → resolve({ status, body }). */
const pendingSync = new Map()

function isPrivate(ip) {
  return /^10\./.test(ip) || /^192\.168\./.test(ip) || /^172\.(1[6-9]|2\d|3[01])\./.test(ip)
}

/** Local IPv4 addresses, home-network ones first. */
function localAddresses() {
  const all = []
  for (const list of Object.values(os.networkInterfaces())) {
    for (const entry of list ?? []) {
      if (entry.family === 'IPv4' && !entry.internal && !/^169\.254\./.test(entry.address)) all.push(entry.address)
    }
  }
  const rank = (ip) => (/^192\.168\./.test(ip) ? 0 : isPrivate(ip) ? 1 : 2)
  return [...new Set(all)].sort((a, b) => rank(a) - rank(b))
}

function stopSync() {
  clearTimeout(syncTimer)
  syncTimer = null
  if (syncServer) {
    syncServer.close()
    syncServer.closeAllConnections()
  }
  syncServer = null
  for (const resolve of pendingSync.values()) resolve({ status: 503, body: '{"error":"closed"}' })
  pendingSync.clear()
}

function handleSyncRequest(request, response) {
  const reply = (status, body) => {
    // Plain text: the phone's HTTP client would otherwise parse it before the web app sees it.
    response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' })
    response.end(body)
  }
  if (request.method !== 'POST' || request.url !== '/sync') return reply(404, '{"error":"notFound"}')
  const chunks = []
  let size = 0
  request.on('data', (chunk) => {
    size += chunk.length
    if (size > SYNC_BODY_LIMIT) {
      reply(413, '{"error":"tooLarge"}')
      request.destroy()
      return
    }
    chunks.push(chunk)
  })
  request.on('end', () => {
    if (size > SYNC_BODY_LIMIT || !win) return
    const id = nextRequestId++
    const timer = setTimeout(() => pendingSync.get(id)?.({ status: 504, body: '{"error":"timeout"}' }), SYNC_ANSWER_MS)
    pendingSync.set(id, (answer) => {
      clearTimeout(timer)
      pendingSync.delete(id)
      reply(answer.status, answer.body)
      // One successful exchange per QR code.
      if (answer.status === 200) setTimeout(stopSync, 1000)
    })
    win.webContents.send('sync:request', { id, body: Buffer.concat(chunks).toString('utf8') })
  })
}

ipcMain.handle('sync:start', async () => {
  stopSync()
  const server = http.createServer(handleSyncRequest)
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '0.0.0.0', resolve)
  })
  syncServer = server
  syncTimer = setTimeout(stopSync, SYNC_MAX_MS)
  return { hosts: localAddresses(), port: server.address().port }
})

ipcMain.handle('sync:stop', () => stopSync())

ipcMain.handle('sync:respond', (_event, id, answer) => {
  pendingSync.get(id)?.({ status: Number(answer?.status) || 500, body: String(answer?.body ?? '') })
})

app.on('before-quit', () => {
  quitting = true
})

// The tray keeps the app alive; quitting happens only from its menu.
app.on('window-all-closed', () => {})
