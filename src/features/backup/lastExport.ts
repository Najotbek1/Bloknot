/** When this device last exported. Per device on purpose, so it is kept out of the synced settings. */
const KEY = 'bloknot.lastExportAt'

export function readLastExport(): number | null {
  try {
    const value = Number(localStorage.getItem(KEY))
    return Number.isFinite(value) && value > 0 ? value : null
  } catch {
    return null
  }
}

export function writeLastExport(time: number): void {
  try {
    localStorage.setItem(KEY, String(time))
  } catch {
    // Storage can be unavailable; the reminder text is only a convenience.
  }
}
