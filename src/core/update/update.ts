/**
 * "A new version is out" for phones that got the APK outside a store (the Telegram bot). Each web
 * build publishes `version.json` next to the site (GitHub Pages); the app reads it at most every
 * few hours and compares version names. Store installs are left to their store, which updates them.
 */

/** Where the site publishes the latest version. */
export const VERSION_URL = 'https://najotbek1.github.io/Bloknot/version.json'
/** Where sideloaded installs get the new APK (the owner's Telegram bot). */
export const DOWNLOAD_URL = 'https://t.me/OmniViobot'
/** How long a fetched answer is trusted before asking again. */
export const CHECK_EVERY_MS = 6 * 60 * 60 * 1000
/** «Later» hides the card for this long. */
export const SNOOZE_MS = 24 * 60 * 60 * 1000

/** Installer packages of app stores that update the app themselves. */
const STORE_INSTALLERS = new Set([
  'com.android.vending', // Google Play
  'com.sec.android.app.samsungapps', // Samsung Galaxy Store
  'com.xiaomi.mipicks', // Xiaomi GetApps
  'com.xiaomi.market',
  'com.xiaomi.discover',
  'com.huawei.appmarket', // Huawei AppGallery
  'com.heytap.market', // OPPO / OnePlus / realme
  'com.oppo.market',
  'com.bbk.appstore', // vivo
  'com.vivo.appstore',
  'com.amazon.venezia', // Amazon Appstore
])

export function isStoreInstall(installer: string | null | undefined): boolean {
  return installer != null && STORE_INSTALLERS.has(installer)
}

/** Numeric parts of "1.2.3" (anything after "-" or "+" is ignored); null when it is not a version. */
function parts(version: string): number[] | null {
  const core = version.trim().split(/[-+]/)[0]
  if (!/^\d+(\.\d+)*$/.test(core)) return null
  return core.split('.').map(Number)
}

/** Positive when `a` is newer than `b`, negative when older, 0 when equal or not comparable. */
export function compareVersions(a: string, b: string): number {
  const x = parts(a)
  const y = parts(b)
  if (!x || !y) return 0
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const diff = (x[i] ?? 0) - (y[i] ?? 0)
    if (diff !== 0) return Math.sign(diff)
  }
  return 0
}

/** Reads `version.json`; anything unexpected gives null. */
export function parseVersionFile(text: string): string | null {
  try {
    const version = (JSON.parse(text) as { version?: unknown }).version
    return typeof version === 'string' && parts(version) ? version : null
  } catch {
    return null
  }
}

/** The version to announce, or null when there is nothing to say. */
export function updateToAnnounce(options: {
  latest: string | null
  current: string
  /** Until when «Later» hides the card (epoch ms). */
  snoozedUntil: number
  now: number
}): string | null {
  const { latest, current, snoozedUntil, now } = options
  if (!latest || compareVersions(latest, current) <= 0) return null
  return now < snoozedUntil ? null : latest
}
