import { Capacitor } from '@capacitor/core'
import { useEffect, useState } from 'react'
import {
  CHECK_EVERY_MS,
  DOWNLOAD_URL,
  isStoreInstall,
  parseVersionFile,
  SNOOZE_MS,
  updateToAnnounce,
  VERSION_URL,
} from '../../core/update/update'
import { t } from '../../i18n'
import { getInstaller } from '../../platform/appInfo'

/** Only the Android app installed from an APK announces updates; stores, the website and the computer update themselves. */
const supported = Capacitor.getPlatform() === 'android'
const STORAGE_KEY = 'maqsad.update'

interface Saved {
  latest: string | null
  checkedAt: number
  snoozedUntil: number
}

function load(): Saved {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<Saved> | null
    return { latest: saved?.latest ?? null, checkedAt: saved?.checkedAt ?? 0, snoozedUntil: saved?.snoozedUntil ?? 0 }
  } catch {
    return { latest: null, checkedAt: 0, snoozedUntil: 0 }
  }
}

function save(saved: Saved) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
  } catch {
    // Storage unavailable: the check simply runs again next time.
  }
}

/** Reads version.json when the last answer is old; offline or failed checks keep the last answer. */
async function check(): Promise<Saved> {
  const saved = load()
  if (Date.now() - saved.checkedAt < CHECK_EVERY_MS) return saved
  try {
    const response = await fetch(VERSION_URL, { cache: 'no-store' })
    if (!response.ok) return saved
    const latest = parseVersionFile(await response.text())
    const next = { ...saved, latest: latest ?? saved.latest, checkedAt: Date.now() }
    save(next)
    return next
  } catch {
    return saved
  }
}

/** "A new version is out" card for APK installs, with a link to the Telegram bot. */
export function UpdateNotice() {
  const [version, setVersion] = useState<string | null>(null)

  useEffect(() => {
    if (!supported) return
    let active = true
    const refresh = async () => {
      if (isStoreInstall(await getInstaller())) return
      const saved = await check()
      if (active) {
        setVersion(
          updateToAnnounce({ latest: saved.latest, current: __APP_VERSION__, snoozedUntil: saved.snoozedUntil, now: Date.now() }),
        )
      }
    }
    void refresh()
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      active = false
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  if (!version) return null

  function later() {
    save({ ...load(), snoozedUntil: Date.now() + SNOOZE_MS })
    setVersion(null)
  }

  return (
    <div className="notice update-notice">
      <p>{t('update.available', { version })}</p>
      <div className="update-notice__actions">
        <a className="btn btn--primary" href={DOWNLOAD_URL} target="_blank" rel="noopener noreferrer">
          {t('update.download')}
        </a>
        <button type="button" className="btn" onClick={later}>
          {t('update.later')}
        </button>
      </div>
    </div>
  )
}
