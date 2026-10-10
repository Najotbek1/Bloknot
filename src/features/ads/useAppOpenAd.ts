import { App } from '@capacitor/app'
import { LocalNotifications } from '@capacitor/local-notifications'
import { useEffect } from 'react'
import { recordShown, shouldShowAppOpen, type AppOpenTrigger } from '../../core/ads/appOpenPolicy'
import { adConfig } from '../../platform/adConfig'
import { getRingingAlarm, onAlarmRinging } from '../../platform/alarm'
import { adsSupported, appOpenReady, preloadAppOpen, setAppOpenStatus, showAppOpenIfLoaded } from '../../platform/ads'
import { isAdBlocked } from './blockers'

/** This phone's App Open history. Device-local on purpose: it is not part of export/import. */
interface Stored {
  installedAt: number
  shownAt: number[]
  backgroundSince: number | null
}

const KEY = 'maqsad.appOpen'
/** Give notification taps and a ringing alarm time to be reported before deciding. */
const DECIDE_AFTER_MS = 1500
/** On a fresh start the first ad may still be loading; wait this long at most. */
const COLD_WAIT_MS = 8000

function load(): Stored {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<Stored> | null
    if (parsed && typeof parsed.installedAt === 'number') {
      return {
        installedAt: parsed.installedAt,
        shownAt: Array.isArray(parsed.shownAt) ? parsed.shownAt.filter((t) => typeof t === 'number') : [],
        backgroundSince: parsed.backgroundSince ?? null,
      }
    }
  } catch {
    // Unreadable storage: start over below.
  }
  return { installedAt: Date.now(), shownAt: [], backgroundSince: null }
}

function save(stored: Stored) {
  try {
    localStorage.setItem(KEY, JSON.stringify(stored))
  } catch {
    // Without storage the limits reset on each start; harmless.
  }
}

/**
 * The full-screen ad shown when the app is opened, within the limits of appOpenPolicy.ts. It is
 * skipped when the app was opened from a notification or by the alarm, and while a sheet or the
 * keyboard is open.
 */
export function useAppOpenAd() {
  useEffect(() => {
    if (!adsSupported) return
    let stored = load()
    save(stored)

    let interruptedAt = 0
    const markInterrupted = () => {
      interruptedAt = Date.now()
    }
    const notificationTap = LocalNotifications.addListener('localNotificationActionPerformed', markInterrupted)
    const stopAlarm = onAlarmRinging(markInterrupted)

    let timer: number | undefined
    let deciding = false
    const decide = (trigger: AppOpenTrigger) => {
      const startedAt = Date.now()
      const backgroundSince = stored.backgroundSince
      window.clearTimeout(timer)
      timer = window.setTimeout(async () => {
        if (deciding) return
        const allowed = shouldShowAppOpen({
          now: Date.now(),
          installedAt: stored.installedAt,
          shownAt: stored.shownAt,
          trigger,
          backgroundSince,
          testMode: adConfig.appOpenTest,
        })
        if (!allowed) {
          setAppOpenStatus({ state: 'skipped' })
          void preloadAppOpen()
          return
        }
        deciding = true
        try {
          if (!appOpenReady()) {
            await Promise.race([preloadAppOpen(), new Promise((resolve) => window.setTimeout(resolve, COLD_WAIT_MS))])
          }
          // Never over an open sheet or keyboard, a ringing alarm, or right after a notification tap.
          const interrupted = interruptedAt >= startedAt - DECIDE_AFTER_MS
          if (isAdBlocked() || interrupted || (await getRingingAlarm())) {
            setAppOpenStatus({ state: 'skipped' })
            return
          }
          if (await showAppOpenIfLoaded()) {
            stored = { ...stored, shownAt: recordShown(stored.shownAt, Date.now()) }
            save(stored)
          }
        } finally {
          deciding = false
        }
      }, DECIDE_AFTER_MS)
    }

    void preloadAppOpen()
    decide('cold')
    const stateChange = App.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) {
        stored = { ...stored, backgroundSince: Date.now() }
        save(stored)
        return
      }
      decide('resume')
    })

    return () => {
      window.clearTimeout(timer)
      void notificationTap.then((handle) => handle.remove())
      void stateChange.then((handle) => handle.remove())
      stopAlarm()
    }
  }, [])
}
